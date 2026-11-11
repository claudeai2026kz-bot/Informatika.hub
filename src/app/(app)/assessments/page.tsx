import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ClipboardCheck, Download, ArrowLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GRADES, QUARTER_LABELS } from "@/lib/labels";

// Әр сыныпқа бөлек, бірақ үйлесімді түс: көк → көгілдір → жасыл → сары → қызғылт сары → қызғылт → күлгін
const GRADE_COLORS = [
  "from-[#3B82F6] to-[#60A5FA] shadow-[0_14px_28px_-14px_#3B82F6]",
  "from-[#0891B2] to-[#22D3EE] shadow-[0_14px_28px_-14px_#0891B2]",
  "from-[#059669] to-[#34D399] shadow-[0_14px_28px_-14px_#059669]",
  "from-[#D97706] to-[#FBBF24] shadow-[0_14px_28px_-14px_#D97706]",
  "from-[#EA580C] to-[#FB923C] shadow-[0_14px_28px_-14px_#EA580C]",
  "from-[#DB2777] to-[#F472B6] shadow-[0_14px_28px_-14px_#DB2777]",
  "from-[#7C3AED] to-[#A78BFA] shadow-[0_14px_28px_-14px_#7C3AED]",
];
import FilterBar from "@/components/FilterBar";
import FavoriteButton from "@/components/FavoriteButton";
import Pagination from "@/components/Pagination";
import Abbr from "@/components/Abbr";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata() {
  return { title: (await getT())("БЖБ / ТЖБ") };
}
const PER = 12;
type SP = { kind?: string; grade?: string; quarter?: string; topic?: string; variant?: string; q?: string; page?: string };

export default async function AssessmentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const t = await getT();
  const sp = await searchParams;
  const user = await getCurrentUser();
  const kind = sp.kind === "BZHB" || sp.kind === "TZHB" ? sp.kind : undefined;
  const grade = Number(sp.grade) || undefined;
  const quarter = Number(sp.quarter) || undefined;
  const topic = Number(sp.topic) || undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim().slice(0, 100);

  const where: Prisma.AssessmentWhereInput = {
    published: true,
    ...(kind && { kind }), ...(grade && { gradeId: grade }), ...(quarter && { quarter: { number: quarter } }),
    ...(topic && { topicId: topic }), ...(sp.variant && { variant: sp.variant }),
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }),
  };
  const showGrades = !grade && !quarter && !topic && !sp.variant && !q;
  const [items, total, topics, variants, favs, perGrade] = await Promise.all([
    db.assessment.findMany({ where, orderBy: [{ gradeId: "asc" }, { createdAt: "desc" }], skip: (page - 1) * PER, take: PER, include: { quarter: true, topic: true } }),
    db.assessment.count({ where }),
    grade ? db.topic.findMany({ where: { quarter: { gradeId: grade, ...(quarter && { number: quarter }) } }, select: { id: true, title: true }, orderBy: { order: "asc" } }) : [],
    db.assessment.findMany({ where: { published: true }, distinct: ["variant"], select: { variant: true } }),
    user ? db.favorite.findMany({ where: { userId: user.id, assessmentId: { not: null } }, select: { assessmentId: true } }) : [],
    showGrades ? db.assessment.groupBy({ by: ["gradeId", "kind"], where: { published: true }, _count: { _all: true } }) : [],
  ]);
  const cnt = (g: number, k: string) => perGrade.find((x) => x.gradeId === g && x.kind === k)?._count._all ?? 0;
  const link = (u: Partial<SP>) => {
    const s = new URLSearchParams(Object.entries({ ...sp, page: undefined, ...u }).filter(([, v]) => v) as [string, string][]);
    return `/assessments?${s}`;
  };
  const favSet = new Set(favs.map((f) => f.assessmentId));
  const tab = (k?: string) => {
    const s = new URLSearchParams(Object.entries({ ...sp, kind: k, page: undefined }).filter(([, v]) => v) as [string, string][]);
    return `/assessments?${s}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold"><Abbr k="БЖБ" /> / <Abbr k="ТЖБ" /></h1>
      <p className="mt-1 muted">{t("Бөлім және тоқсан бойынша жиынтық бағалау тапсырмалары, жауаптары және дескрипторлары.")}</p>

      <div className="mt-6 inline-flex rounded-2xl bg-white p-1 border border-sky-100 shadow-soft" role="tablist">
        {[[undefined, "Барлығы"], ["BZHB", "БЖБ"], ["TZHB", "ТЖБ"]].map(([k, l]) => (
          <Link key={l} href={tab(k)} role="tab" aria-selected={kind === k} className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${kind === k ? "bg-gradient-to-r from-sky-500 to-lilac-500 text-white" : "text-ink-soft hover:bg-sky-50"}`}>{t(l ?? "")}</Link>
        ))}
      </div>

      <div className="mt-4">
        <FilterBar placeholder={t("Тапсырма атауы бойынша іздеу…")} filters={[
          ...(grade ? [] : [{ name: "grade", label: t("Сынып"), options: GRADES.map((g) => ({ value: String(g), label: t("{g}-сынып", { g }) })) }]),
          { name: "quarter", label: t("Тоқсан"), options: [1, 2, 3, 4].map((n) => ({ value: String(n), label: t(QUARTER_LABELS[n]) })) },
          { name: "topic", label: t("Тақырып"), options: topics.map((x) => ({ value: String(x.id), label: x.title })) },
          { name: "variant", label: t("Нұсқа"), options: variants.map((v) => ({ value: v.variant, label: v.variant })) },
        ]} />
      </div>

      {showGrades ? (
        <section className="mt-8">
          <h2 className="text-xl sm:text-2xl font-bold">{t("Сыныпты таңдаңыз")}</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {GRADES.map((g, i) => {
              const b = cnt(g, "BZHB"), tz = cnt(g, "TZHB"), n = kind ? cnt(g, kind) : b + tz;
              return (
                <Link key={g} href={link({ grade: String(g) })} className={`card card-hover border-transparent bg-gradient-to-br ${GRADE_COLORS[i]} text-white px-3 py-5 text-center transition hover:-translate-y-0.5`}>
                  <div className="text-4xl font-extrabold">{g}</div>
                  <div className="text-xs font-semibold text-white/85">{t("сынып")}</div>
                  <div className="mt-3 flex justify-center gap-1.5 text-[11px] font-bold">
                    {n ? (<>
                      {kind !== "TZHB" && <span className="rounded-full bg-white/90 px-2 py-0.5 text-ink">{t("БЖБ")} {b}</span>}
                      {kind !== "BZHB" && <span className="rounded-full bg-white/90 px-2 py-0.5 text-ink">{t("ТЖБ")} {tz}</span>}
                    </>) : <span className="rounded-full bg-white/25 px-2 py-0.5">{t("Әзірге жоқ")}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
      <>
      {grade && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href={link({ grade: undefined, quarter: undefined, topic: undefined })} className="btn-ghost btn-sm"><ArrowLeft className="h-4 w-4" /> {t("Барлық сыныптар")}</Link>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-1">{t("{g}-сынып", { g: grade })}<ChevronRight className="h-5 w-5 text-ink-mute" /></h2>
          <div className="flex flex-wrap gap-1.5">
            {[undefined, 1, 2, 3, 4].map((n) => (
              <Link key={n ?? 0} href={link({ quarter: n ? String(n) : undefined, topic: undefined })} aria-current={quarter === n ? "page" : undefined} className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition ${quarter === n ? "bg-sky-500 text-white" : "bg-white border border-sky-100 text-ink-soft hover:bg-sky-50"}`}>{n ? t(QUARTER_LABELS[n]) : t("Барлығы")}</Link>
            ))}
          </div>
        </div>
      )}
      <p className="mt-6 mb-4 text-sm muted">{t("{n} тапсырма табылды", { n: total })}</p>
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <article key={a.id} className="card card-hover p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className={`chip ${a.kind === "BZHB" ? "" : "bg-lilac-100 text-lilac-500"}`}><ClipboardCheck className="h-3.5 w-3.5" /> {t(a.kind === "BZHB" ? "БЖБ" : "ТЖБ")}</span>
                <FavoriteButton target={{ assessmentId: a.id }} initial={favSet.has(a.id)} loggedIn={!!user} />
              </div>
              <h3 className="mt-2 font-bold leading-snug"><Link href={`/assessments/${a.id}`} className="hover:text-sky-600">{a.title}</Link></h3>
              <p className="mt-1 text-xs muted">{t("{g}-сынып", { g: a.gradeId })} · {t(QUARTER_LABELS[a.quarter.number])} · {a.variant}{a.topic ? ` · ${a.topic.title}` : ""}</p>
              {a.description && <p className="mt-2 text-sm text-ink-soft line-clamp-2">{a.description}</p>}
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-xs muted flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {a.downloads}</span>
                <Link href={`/assessments/${a.id}`} className="btn-soft btn-sm">{t("Ашу")}</Link>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="card p-12 text-center muted">{t("Сүзгіге сай тапсырма табылмады.")}</div>}
      <Pagination page={page} pages={Math.ceil(total / PER)} base="/assessments" params={{ ...sp, page: undefined }} />
      </>
      )}
    </div>
  );
}
