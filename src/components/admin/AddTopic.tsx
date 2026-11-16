"use client";
import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { saveTopic } from "@/app/actions/admin";
import { FormAlert } from "../ui/Field";
import SubmitButton from "../ui/SubmitButton";

/** Сынып бетінен (сынып + тоқсан таңдалған) жаңа тақырып қосу. Сақталған соң тақырып беті ашылады. */
export default function AddTopic({ grade, quarter, order, sections }: { grade: number; quarter: number; order: number; sections: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(saveTopic, undefined);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full sm:w-auto">
        <Plus className="h-4 w-4" /> Тақырып қосу
      </button>
    );
  return (
    <form action={action} className="space-y-3 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{grade}-сынып · {quarter}-тоқсан: жаңа тақырып</span>
        <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white" aria-label="Жабу"><X className="h-4 w-4" /></button>
      </div>
      <FormAlert msg={state?.error} />
      <input type="hidden" name="grade" value={grade} />
      <input type="hidden" name="quarter" value={quarter} />
      <input type="hidden" name="order" value={order} />
      <input type="hidden" name="open" value="1" />
      <div>
        <label className="label" htmlFor="new-topic-title">Тақырып атауы</label>
        <input id="new-topic-title" name="title" className="input" placeholder="Мысалы: Шартты операторлар" required minLength={2} maxLength={200} autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="new-topic-section">Бөлім (міндетті емес)</label>
        <input id="new-topic-section" name="section" className="input" list="topic-sections" maxLength={120} defaultValue={sections.at(-1) ?? ""} />
        <datalist id="topic-sections">{sections.map((s) => <option key={s} value={s} />)}</datalist>
      </div>
      <p className="text-xs muted">Сақтаған соң тақырып беті ашылады: сол жерде презентация, бейнесабақ, тапсырма, ҚМЖ және ойын қосасыз.</p>
      <SubmitButton className="btn-primary w-full" pendingText="Сақталып жатыр…">Қосу және ашу</SubmitButton>
    </form>
  );
}
