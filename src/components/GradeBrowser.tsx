import Link from "next/link";
import { ChevronRight, ClipboardCheck, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { QUARTER_LABELS } from "@/lib/labels";
import { TypeIcon } from "@/components/MaterialCard";

/** Сынып ішінде: тоқсандар → тақырыптар → БЖБ/ТЖБ. Сынып беті мен басты бетте қолданылады. */
export default async function GradeBrowser({ g, qn, quarterHref }: { g: number; qn: number; quarterHref: (q: number) => string }) {
  const quarters = await db.quarter.findMany({
    where: { gradeId: g },
    orderBy: { number: "asc" },
    include: { _count: { select: { topics: true } } },
  });
  const current = quarters.find((q) => q.number === qn);
  const topics = current
    ? await db.topic.findMany({
        where: { quarterId: current.id },
        orderBy: [{ order: "asc" }, { id: "asc" }],
        include: { materials: { where: { published: true }, select: { type: { select: { key: true } } } } },
      })
    : [];

  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const assessments = current
    ? await db.assessment.findMany({
        where: { quarterId: current.id, ...(isAdmin ? {} : { published: true }) },
        orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
        select: { id: true, kind: true, title: true, variant: true, published: true, topic: { select: { title: true } } },
      })
    : [];

  const sections = new Map<string, typeof topics>();
  for (const t of topics) {
    const k = t.section ?? "Тақырыптар";
    sections.set(k, [...(sections.get(k) ?? []), t]);
  }
  let n = 0;

  return (
  <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
      <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1 -mx-1 px-1" aria-label="Тоқсандар">
        {quarters.map((q) => (
          <Link
            key={q.id}
            href={quarterHref(q.number)}
            aria-current={q.number === qn ? "page" : undefined}
            className={`shrink-0 rounded-xl px-4 py-3 transition flex items-center justify-between gap-3 ${q.number === qn ? "bg-gradient-to-r from-sky-500 to-lilac-500 text-white shadow-lift" : "bg-white border border-sky-100 hover:border-sky-300"}`}
          >
            <span>
              <span className="block font-semibold">{QUARTER_LABELS[q.number]}</span>
              <span className={`block text-xs ${q.number === qn ? "text-white/80" : "muted"}`}>{q._count.topics} тақырып</span>
            </span>
            <ChevronRight className="h-4 w-4 hidden lg:block" />
          </Link>
        ))}
      </nav>

      <div>
        <h2 className="text-lg font-bold mb-4">{QUARTER_LABELS[qn]} тақырыптары</h2>
        {topics.length === 0 ? (
          <div className="card p-10 text-center muted">Бұл тоқсанға әзірге тақырып қосылмаған.</div>
        ) : (
          [...sections.entries()].map(([section, list]) => (
            <section key={section} className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-lilac-500 mb-2">{section}</h3>
              <ul className="space-y-3">
                {list.map((t) => {
                  n++;
                  const kinds = [...new Set(t.materials.map((m) => m.type.key))];
                  return (
                    <li key={t.id}>
                      <Link href={`/topics/${t.id}`} className="card card-hover flex items-center gap-4 p-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-100 font-bold text-sky-600">{n}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{t.title}</div>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {kinds.length ? kinds.map((k) => <TypeIcon key={k} k={k} className="h-7 w-7 [&_svg]:h-4 [&_svg]:w-4" />) : <span className="text-xs muted">Материал әлі жоқ</span>}
                            {t.materials.length > 0 && <span className="ml-1 text-xs muted">{t.materials.length} материал</span>}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-ink-mute" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
        <section className="mt-8 card p-5 sm:p-6 bg-gradient-to-br from-white to-lilac-100/40" id="assessments">
          <div className="flex items-center gap-3 mb-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-lilac-100 text-lilac-500"><ClipboardCheck className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-bold">Бағалау: БЖБ және ТЖБ</h2>
              <p className="text-xs muted">{g}-сынып · {QUARTER_LABELS[qn]} · жауаптары мен критерийлерімен</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["BZHB", "TZHB"] as const).map((k) => {
              const list = assessments.filter((a) => a.kind === k);
              const name = k === "BZHB" ? "БЖБ" : "ТЖБ";
              return (
                <div key={k} className="rounded-xl border border-sky-100 bg-white p-4">
                  <h3 className="font-bold">{name} <span className="text-xs font-normal muted">{k === "BZHB" ? "бөлім бойынша жиынтық бағалау" : "тоқсандық жиынтық бағалау"}</span></h3>
                  <ul className="mt-3 space-y-2">
                    {list.map((a) => (
                      <li key={a.id}>
                        <Link href={`/assessments/${a.id}`} className="flex items-center gap-2 rounded-lg bg-sky-50/60 px-3 py-2.5 hover:bg-sky-100 transition">
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">{a.title}{!a.published && <span className="chip ml-2 bg-amber-100 text-amber-700">жоба</span>}</span>
                            <span className="block text-xs muted">{a.variant}{a.topic ? ` · ${a.topic.title}` : ""}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-ink-mute" />
                        </Link>
                      </li>
                    ))}
                    {list.length === 0 && <li className="text-sm muted">Әзірге {name} қосылмаған.</li>}
                  </ul>
                  {isAdmin && <Link href={`/admin/assessments/new?kind=${k}&grade=${g}&quarter=${qn}`} className="btn-soft btn-sm mt-3 w-full"><Plus className="h-4 w-4" /> {name} қосу</Link>}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
