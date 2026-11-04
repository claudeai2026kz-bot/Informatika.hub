import Link from "next/link";
import { notFound } from "next/navigation";
import { GRADE_STYLES } from "@/lib/labels";
import GradeBrowser from "@/components/GradeBrowser";
import Breadcrumbs from "@/components/Breadcrumbs";

export async function generateMetadata({ params }: { params: Promise<{ grade: string }> }) {
  return { title: `${(await params).grade}-сынып` };
}

export default async function GradePage({ params, searchParams }: { params: Promise<{ grade: string }>; searchParams: Promise<{ q?: string }> }) {
  const g = Number((await params).grade);
  if (!Number.isInteger(g) || g < 5 || g > 11) notFound();
  const qn = Math.min(4, Math.max(1, Number((await searchParams).q) || 1));

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

      <GradeBrowser g={g} qn={qn} quarterHref={(q) => `/grades/${g}?q=${q}`} />
    </div>
  );
}
