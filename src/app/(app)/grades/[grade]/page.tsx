import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { GRADE_STYLES, QUARTER_LABELS } from "@/lib/labels";
import { TypeIcon } from "@/components/MaterialCard";
import Breadcrumbs from "@/components/Breadcrumbs";

export async function generateMetadata({ params }: { params: Promise<{ grade: string }> }) {
  return { title: `${(await params).grade}-сынып` };
}

export default async function GradePage({ params, searchParams }: { params: Promise<{ grade: string }>; searchParams: Promise<{ q?: string }> }) {
  const g = Number((await params).grade);
  if (!Number.isInteger(g) || g < 5 || g > 11) notFound();
  const qn = Math.min(4, Math.max(1, Number((await searchParams).q) || 1));

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

  const sections = new Map<string, typeof topics>();
  for (const t of topics) {
    const k = t.section ?? "Тақырыптар";
    sections.set(k, [...(sections.get(k) ?? []), t]);
  }
  let n = 0;

  return (
    <div>
      <Breadcrumbs items={[{ href: "/materials", label: "Материалдар" }, { label: `${g}-сынып` }]} />
      <header className="mt-4 card p-6 sm:p-8 flex items-center gap-5 bg-gradient-to-r from-white to-sky-50">
        <span className={`grid h-16 w-16 sm:h-20 sm:w-20 place-items-center rounded-2xl bg-gradient-to-b border text-3xl sm:text-4xl font-extrabold ${GRADE_STYLES[g - 5]}`}>{g}</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{g}-сынып</h1>
          <p className="muted">Информатика · тоқсанды таңдап, тақырыпты ашыңыз</p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1 -mx-1 px-1" aria-label="Тоқсандар">
          {quarters.map((q) => (
            <Link
              key={q.id}
              href={`/grades/${g}?q=${q.number}`}
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
        </div>
      </div>
    </div>
  );
}
