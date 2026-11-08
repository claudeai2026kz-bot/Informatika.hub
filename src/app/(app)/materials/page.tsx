import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GRADES, MATERIAL_TYPES, QUARTER_LABELS } from "@/lib/labels";
import MaterialCard, { materialCardSelect } from "@/components/MaterialCard";
import FilterBar from "@/components/FilterBar";
import Pagination from "@/components/Pagination";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata() {
  return { title: (await getT())("Материалдар кітапханасы") };
}
const PER = 12;

type SP = { q?: string; grade?: string; quarter?: string; topic?: string; type?: string; sort?: string; page?: string };

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const t = await getT();
  const sp = await searchParams;
  const user = await getCurrentUser();
  const grade = Number(sp.grade) || undefined;
  const quarter = Number(sp.quarter) || undefined;
  const topic = Number(sp.topic) || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const terms = (sp.q ?? "").trim().slice(0, 100).split(/\s+/).filter(Boolean);

  const where: Prisma.MaterialWhereInput = {
    published: true,
    ...(grade && { gradeId: grade }),
    ...(quarter && { quarter: { number: quarter } }),
    ...(topic && { topicId: topic }),
    ...(sp.type && { type: { key: sp.type } }),
    ...(terms.length && {
      AND: terms.map((t) => ({
        OR: [
          { title: { contains: t, mode: "insensitive" as const } },
          { description: { contains: t, mode: "insensitive" as const } },
          { topic: { title: { contains: t, mode: "insensitive" as const } } },
          { topic: { section: { contains: t, mode: "insensitive" as const } } },
        ],
      })),
    }),
  };
  const orderBy: Prisma.MaterialOrderByWithRelationInput[] =
    sp.sort === "popular" ? [{ views: "desc" }] : sp.sort === "downloads" ? [{ downloads: "desc" }] : sp.sort === "rating" ? [{ ratingAvg: "desc" }] : [{ createdAt: "desc" }];

  const [items, total, topics, favs] = await Promise.all([
    db.material.findMany({ where, orderBy, skip: (page - 1) * PER, take: PER, select: materialCardSelect }),
    db.material.count({ where }),
    grade ? db.topic.findMany({ where: { quarter: { gradeId: grade, ...(quarter && { number: quarter }) } }, orderBy: [{ quarterId: "asc" }, { order: "asc" }], select: { id: true, title: true } }) : [],
    user ? db.favorite.findMany({ where: { userId: user.id, materialId: { not: null } }, select: { materialId: true } }) : [],
  ]);
  const favSet = new Set(favs.map((f) => f.materialId));

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{t("Материалдар кітапханасы")}</h1>
      <p className="mt-1 muted">{t("Сынып, тоқсан, тақырып және түрі бойынша сүзіңіз.")}</p>
      <div className="mt-6">
        <FilterBar
          filters={[
            { name: "grade", label: t("Сынып"), options: GRADES.map((g) => ({ value: String(g), label: t("{g}-сынып", { g }) })) },
            { name: "quarter", label: t("Тоқсан"), options: [1, 2, 3, 4].map((q) => ({ value: String(q), label: t(QUARTER_LABELS[q]) })) },
            { name: "topic", label: t("Тақырып"), options: topics.map((x) => ({ value: String(x.id), label: x.title })) },
            { name: "type", label: t("Түрі"), options: MATERIAL_TYPES.map((x) => ({ value: x.key, label: t(x.name) })) },
            { name: "sort", label: t("Сұрыптау"), options: [{ value: "popular", label: t("Танымал") }, { value: "downloads", label: t("Көп жүктелген") }, { value: "rating", label: t("Жоғары бағаланған") }] },
          ]}
        />
      </div>
      <p className="mt-6 mb-4 text-sm muted" aria-live="polite">{t("{n} материал табылды", { n: total })}</p>
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => <MaterialCard key={m.id} m={m} fav={favSet.has(m.id)} loggedIn={!!user} />)}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="font-semibold">{t("Ештеңе табылмады")}</p>
          <p className="mt-1 text-sm muted">{t("Сүзгіні өзгертіп немесе басқа кілт сөзбен іздеп көріңіз. Робот-көмекшіден де сұрауға болады.")}</p>
        </div>
      )}
      <Pagination page={page} pages={Math.ceil(total / PER)} base="/materials" params={{ ...sp, page: undefined }} />
    </div>
  );
}
