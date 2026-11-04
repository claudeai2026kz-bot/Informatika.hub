"use client";
import { useActionState, useState } from "react";
import { Plus, X, Upload, Link2 } from "lucide-react";
import { saveMaterial } from "@/app/actions/admin";
import { FormAlert } from "../ui/Field";
import SubmitButton from "../ui/SubmitButton";

/** Сабақ бетінен тікелей материал қосу (компьютер мен телефонда жұмыс істейді). */
export default function TopicUpload({ typeKey, label, mode, accept, grade, quarter, topicId, topicTitle }: {
  typeKey: string; label: string; mode: "file" | "url" | "both"; accept: string; grade: number; quarter: number; topicId: number; topicTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(saveMaterial, undefined);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-soft btn-sm w-full sm:w-auto"><Plus className="h-4 w-4" /> {label} қосу</button>
    );
  return (
    <form action={action} className="mt-2 space-y-3 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-4">
      <div className="flex items-center justify-between"><span className="text-sm font-semibold">{label} қосу</span><button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-white" aria-label="Жабу"><X className="h-4 w-4" /></button></div>
      <FormAlert msg={state?.error} />
      <input type="hidden" name="typeKey" value={typeKey} />
      <input type="hidden" name="grade" value={grade} />
      <input type="hidden" name="quarter" value={quarter} />
      <input type="hidden" name="topicId" value={topicId} />
      <input type="hidden" name="back" value={`/topics/${topicId}`} />
      <input type="hidden" name="published" value="on" />
      <div><label className="label">Атауы</label><input name="title" className="input" defaultValue={`${topicTitle}: ${label.toLowerCase()}`} required maxLength={200} /></div>
      {mode !== "url" && (
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-sky-200 bg-white p-4 text-center text-sm hover:border-sky-400">
          <Upload className="h-6 w-6 text-sky-500" />
          <span className="font-semibold">Файлды таңдау</span>
          <span className="text-xs muted">{accept.replaceAll(".", "").toUpperCase().replaceAll(",", ", ")} · 50 МБ дейін</span>
          <input name="file" type="file" accept={accept} className="mt-2 w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-1.5 file:font-semibold file:text-sky-600" />
        </label>
      )}
      {mode !== "file" && (
        <div>
          <label className="label flex items-center gap-1"><Link2 className="h-4 w-4" /> {typeKey === "VIDEO" ? "YouTube сілтемесі" : "Ойын сілтемесі (Wordwall, Kahoot, Quizizz…)"}</label>
          <input name={typeKey === "VIDEO" ? "videoUrl" : "externalUrl"} type="url" inputMode="url" className="input" placeholder="https://…" />
        </div>
      )}
      <div><label className="label">Қысқаша сипаттама (міндетті емес)</label><input name="description" className="input" maxLength={500} /></div>
      <SubmitButton className="btn-primary w-full" pendingText="Жүктеліп жатыр…">Сақтау</SubmitButton>
    </form>
  );
}
