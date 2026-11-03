import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ClipboardCheck, Download } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GRADES, QUARTER_LABELS } from "@/lib/labels";
import FilterBar from "@/components/FilterBar";
import FavoriteButton from "@/components/FavoriteButton";
import Pagination from "@/components/Pagination";
import Abbr from "@/components/Abbr";

export const metadata = { title: "БЖБ / ТЖБ" };
const PER = 12;
type SP = { kind?: string; grade?: string; quarter?: string; topic?: string; variant?: string; q?: string; page?: string };

export default async function AssessmentsPage({ searchParams }: { searchParams: Promise<SP> }) {
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
  const [items, total, topics, variants, favs] = await Promise.all([
    db.assessment.findMany({ where, orderBy: [{ gradeId: "asc" }, { createdAt: "desc" }], skip: (page - 1) * PER, take: PER, include: { quarter: true, topic: true } }),
    db.assessment.count({ where }),
    grade ? db.topic.findMany({ where: { quarter: { gradeId: grade, ...(quarter && { number: quarter }) } }, select: { id: true, title: true }, orderBy: { order: "asc" } }) : [],
    db.assessment.findMany({ where: { published: true }, distinct: ["variant"], select: { variant: true } }),
    user ? db.favorite.findMany({ where: { userId: user.id, assessmentId: { not: null } }, select: { assessmentId: true } }) : [],
  ]);
  const favSet = new Set(favs.map((f) => f.assessmentId));
  const tab = (k?: string) => {
    const s = new URLSearchParams(Object.entries({ ...sp, kind: k, page: undefined }).filter(([, v]) => v) as [string, string][]);
    return `/assessments?${s}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold"><Abbr k="БЖБ" /> / <Abbr k="ТЖБ" /></h1>
      <p className="mt-1 muted">Бөлім және тоқсан бойынша жиынтық бағалау тапсырмалары, жауаптары және дескрипторлары.</p>

      <div className="mt-6 inline-flex rounded-2xl bg-white p-1 border border-sky-100 shadow-soft" role="tablist">
        {[[undefined, "Барлығы"], ["BZHB", "БЖБ"], ["TZHB", "ТЖБ"]].map(([k, l]) => (
          <Link key={l} href={tab(k)} role="tab" aria-selected={kind === k} className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${kind === k ? "bg-gradient-to-r from-sky-500 to-lilac-500 text-white" : "text-ink-soft hover:bg-sky-50"}`}>{l}</Link>
        ))}
      </div>

      <div className="mt-4">
        <FilterBar placeholder="Тапсырма атауы бойынша іздеу…" filters={[
          { name: "grade", label: "Сынып", options: GRADES.map((g) => ({ value: String(g), label: `${g}-сынып` })) },
          { name: "quarter", label: "Тоқсан", options: [1, 2, 3, 4].map((n) => ({ value: String(n), label: QUARTER_LABELS[n] })) },
          { name: "topic", label: "Тақырып", options: topics.map((t) => ({ value: String(t.id), label: t.title })) },
          { name: "variant", label: "Нұсқа", options: variants.map((v) => ({ value: v.variant, label: v.variant })) },
        ]} />
      </div>

      <p className="mt-6 mb-4 text-sm muted">{total} тапсырма табылды</p>
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <article key={a.id} className="card card-hover p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className={`chip ${a.kind === "BZHB" ? "" : "bg-lilac-100 text-lilac-500"}`}><ClipboardCheck className="h-3.5 w-3.5" /> {a.kind === "BZHB" ? "БЖБ" : "ТЖБ"}</span>
                <FavoriteButton target={{ assessmentId: a.id }} initial={favSet.has(a.id)} loggedIn={!!user} />
              </div>
              <h3 className="mt-2 font-bold leading-snug"><Link href={`/assessments/${a.id}`} className="hover:text-sky-600">{a.title}</Link></h3>
              <p className="mt-1 text-xs muted">{a.gradeId}-сынып · {QUARTER_LABELS[a.quarter.number]} · {a.variant}{a.topic ? ` · ${a.topic.title}` : ""}</p>
              {a.description && <p className="mt-2 text-sm text-ink-soft line-clamp-2">{a.description}</p>}
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-xs muted flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {a.downloads}</span>
                <Link href={`/assessments/${a.id}`} className="btn-soft btn-sm">Ашу</Link>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="card p-12 text-center muted">Сүзгіге сай тапсырма табылмады.</div>}
      <Pagination page={page} pages={Math.ceil(total / PER)} base="/assessments" params={{ ...sp, page: undefined }} />
    </div>
  );
}
