import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { GRADES, QUARTER_LABELS } from "@/lib/labels";
import ActionForm from "@/components/ui/ActionForm";
import SubmitButton from "@/components/ui/SubmitButton";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deleteTopic, saveTopic } from "@/app/actions/admin";

export const metadata = { title: "Тақырыптар" };

export default async function TopicsAdmin({ searchParams }: { searchParams: Promise<{ grade?: string; quarter?: string; edit?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const grade = Number(sp.grade) || 5;
  const quarter = Number(sp.quarter) || 1;
  const topics = await db.topic.findMany({
    where: { quarter: { gradeId: grade, number: quarter } },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    include: { _count: { select: { materials: true, assessments: true, games: true } } },
  });
  const editing = sp.edit ? topics.find((t) => t.id === Number(sp.edit)) : undefined;

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Тақырыптар</h1>
      <p className="muted mt-1">Әр сыныптың тоқсандарына оқу бағдарламасының тақырыптарын қосыңыз.</p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {GRADES.map((g) => <Link key={g} href={`/admin/topics?grade=${g}&quarter=${quarter}`} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${g === grade ? "bg-sky-500 text-white" : "bg-white border border-sky-100"}`}>{g}-сынып</Link>)}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[1, 2, 3, 4].map((q) => <Link key={q} href={`/admin/topics?grade=${grade}&quarter=${q}`} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${q === quarter ? "bg-lilac-500 text-white" : "bg-white border border-sky-100"}`}>{QUARTER_LABELS[q]}</Link>)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="card divide-y divide-sky-100">
          {topics.map((t, i) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-100 text-sm font-bold text-sky-600">{i + 1}</span>
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs muted">{t.section ?? "Бөлімсіз"} · {t._count.materials} материал · {t._count.assessments} БЖБ/ТЖБ · {t._count.games} ойын</div>
              </div>
              <Link href={`/admin/topics?grade=${grade}&quarter=${quarter}&edit=${t.id}`} className="btn-ghost btn-sm">Өңдеу</Link>
              <ConfirmButton action={deleteTopic.bind(null, t.id)} confirm={`«${t.title}» тақырыбын жою керек пе? Байланысқан материалдар тақырыпсыз қалады.`}>Жою</ConfirmButton>
            </div>
          ))}
          {topics.length === 0 && <p className="p-10 text-center muted">{grade}-сынып, {QUARTER_LABELS[quarter]} үшін тақырып жоқ.</p>}
        </div>

        <div className="card p-6 self-start">
          <h2 className="font-bold">{editing ? "Тақырыпты өңдеу" : "Жаңа тақырып қосу"}</h2>
          <ActionForm action={saveTopic} className="mt-4 space-y-4" key={editing?.id ?? "new"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="grade">Сынып</label><select id="grade" name="grade" className="input" defaultValue={grade}>{GRADES.map((g) => <option key={g} value={g}>{g}-сынып</option>)}</select></div>
              <div><label className="label" htmlFor="quarter">Тоқсан</label><select id="quarter" name="quarter" className="input" defaultValue={quarter}>{[1, 2, 3, 4].map((q) => <option key={q} value={q}>{QUARTER_LABELS[q]}</option>)}</select></div>
            </div>
            <div><label className="label" htmlFor="section">Бөлім (міндетті емес)</label><input id="section" name="section" className="input" placeholder="Мысалы: Python программалау" defaultValue={editing?.section ?? ""} /></div>
            <div><label className="label" htmlFor="title">Тақырып атауы</label><input id="title" name="title" className="input" placeholder="Мысалы: Шартты операторлар" defaultValue={editing?.title} required /></div>
            <div><label className="label" htmlFor="order">Реттік нөмірі</label><input id="order" name="order" type="number" min={0} className="input" defaultValue={editing?.order ?? topics.length} /></div>
            <SubmitButton className="btn-primary w-full">{editing ? "Сақтау" : "Қосу"}</SubmitButton>
            {editing && <Link href={`/admin/topics?grade=${grade}&quarter=${quarter}`} className="btn-ghost w-full">Болдырмау</Link>}
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
