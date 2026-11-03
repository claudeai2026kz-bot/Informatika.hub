import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { QUARTER_LABELS } from "@/lib/labels";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { FormAlert } from "@/components/ui/Field";
import { deleteAssessment } from "@/app/actions/admin";

export const metadata = { title: "БЖБ / ТЖБ" };

export default async function AssessmentsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const items = await db.assessment.findMany({ orderBy: [{ gradeId: "asc" }, { createdAt: "desc" }], include: { quarter: true, topic: true } });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold">БЖБ / ТЖБ</h1><Link href="/admin/assessments/new" className="btn-primary"><Plus className="h-4 w-4" /> Жаңа тапсырма</Link></div>
      {saved && <div className="mt-4"><FormAlert tone="ok" msg="Сақталды" /></div>}
      <div className="mt-6 card divide-y divide-sky-100">
        {items.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <span className={`chip ${a.kind === "BZHB" ? "" : "bg-lilac-100 text-lilac-500"}`}>{a.kind === "BZHB" ? "БЖБ" : "ТЖБ"}</span>
            <div className="flex-1 min-w-[200px]"><div className="font-semibold">{a.title}</div><div className="text-xs muted">{a.gradeId}-сынып · {QUARTER_LABELS[a.quarter.number]} · {a.variant}{a.topic ? ` · ${a.topic.title}` : ""} · {a.answers || a.answersPath ? "жауаптары бар" : "жауапсыз"} · {a.published ? "жарияланған" : "жоба"}</div></div>
            <Link href={`/admin/assessments/${a.id}`} className="btn-ghost btn-sm">Өңдеу</Link>
            <ConfirmButton action={deleteAssessment.bind(null, a.id)} confirm={`«${a.title}» жою керек пе?`}>Жою</ConfirmButton>
          </div>
        ))}
        {items.length === 0 && <p className="p-10 text-center muted">Әзірге тапсырма жоқ.</p>}
      </div>
    </div>
  );
}
