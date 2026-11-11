"use client";
import { useEffect, useState, useTransition } from "react";
import { Plus, X, Columns3, UserPlus } from "lucide-react";
import { addColumn, addStudents, removeColumn, setMark } from "@/app/actions/classes";
import { useT } from "@/lib/i18n/client";

/** Журналдағы қолмен толтырылатын ұяшық: санды жазып, Enter не басқа жерді басса — сақталады. */
export function MarkCell({ columnId, studentId, value, max, label }: { columnId: string; studentId: string; value: number | null; max: number; label: string }) {
  const [v, setV] = useState(value === null ? "" : String(value));
  const [state, setState] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [, start] = useTransition();
  useEffect(() => setV(value === null ? "" : String(value)), [value]);
  function save() {
    const raw = v.trim();
    const cur = value === null ? "" : String(value);
    if (raw === cur) return;
    const n = raw === "" ? null : Number(raw.replace(",", "."));
    if (n !== null && (Number.isNaN(n) || n < 0 || n > max)) { setState("err"); return; }
    setState("saving");
    start(async () => {
      const r = await setMark(columnId, studentId, n);
      if (r.error) setState("err");
      else { setV(r.score === null || r.score === undefined ? "" : String(r.score)); setState("ok"); setTimeout(() => setState("idle"), 1200); }
    });
  }
  const ring = state === "err" ? "border-rose-400 bg-rose-50" : state === "ok" ? "border-emerald-400 bg-emerald-50" : "border-sky-100 bg-white focus:border-sky-400";
  return (
    <input
      inputMode="numeric" value={v} onChange={(e) => { setV(e.target.value.replace(/[^\d.,]/g, "").slice(0, 3)); setState("idle"); }}
      onBlur={save} onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
      placeholder="—" aria-label={label} title={`0–${max}`}
      className={`h-9 w-14 rounded-lg border-2 text-center font-bold tabular-nums outline-none transition ${ring}`}
    />
  );
}

export function RemoveColumn({ id, title }: { id: string; title: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className="rounded p-0.5 text-ink-mute hover:bg-rose-50 hover:text-rose-600" aria-label={t("Бағанды өшіру")}
      onClick={() => { if (confirm(t("«{c}» бағаны және ондағы бағалар өшірілсін бе?", { c: title }))) start(() => removeColumn(id)); }}>
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

/** Журналдың үстіндегі құралдар: баған қосу, оқушы қосу. */
export function JournalToolbar({ classId }: { classId: string }) {
  const t = useT();
  const [open, setOpen] = useState<"col" | "stu" | null>(null);
  const [title, setTitle] = useState("");
  const [max, setMax] = useState("10");
  const [names, setNames] = useState("");
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>();
  const [pending, start] = useTransition();
  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={open === "col" ? "btn-primary btn-sm" : "btn-soft btn-sm"} onClick={() => { setOpen(open === "col" ? null : "col"); setMsg(undefined); }}>
          <Columns3 className="h-4 w-4" /> {t("Баған қосу")}
        </button>
        <button type="button" className={open === "stu" ? "btn-primary btn-sm" : "btn-soft btn-sm"} onClick={() => { setOpen(open === "stu" ? null : "stu"); setMsg(undefined); }}>
          <UserPlus className="h-4 w-4" /> {t("Оқушы қосу")}
        </button>
      </div>
      {open === "col" && (
        <form className="card mt-3 p-4 flex flex-wrap items-end gap-3" onSubmit={(e) => {
          e.preventDefault();
          start(async () => { const r = await addColumn(classId, title, Number(max)); setMsg(r); if (r?.ok) { setTitle(""); setOpen(null); } });
        }}>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-semibold" htmlFor="coltitle">{t("Баған атауы")}</label>
            <input id="coltitle" className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder={t("Мысалы: Үй жұмысы, Ауызша жауап, БЖБ")} autoFocus />
          </div>
          <div className="w-28">
            <label className="text-sm font-semibold" htmlFor="colmax">{t("Ең көп балл")}</label>
            <input id="colmax" className="input mt-1" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, "").slice(0, 3))} />
          </div>
          <button className="btn-primary" disabled={pending || !title.trim()}><Plus className="h-4 w-4" /> {t("Қосу")}</button>
          {msg?.error && <p className="w-full text-sm text-rose-600">{t(msg.error)}</p>}
          <p className="w-full text-xs muted">{t("Бағанға бағаны өзіңіз қоясыз: ұяшыққа санды жазып, Enter басыңыз.")}</p>
        </form>
      )}
      {open === "stu" && (
        <form className="card mt-3 p-4" onSubmit={(e) => {
          e.preventDefault();
          start(async () => { const r = await addStudents(classId, names); setMsg(r); if (r?.ok) { setNames(""); setOpen(null); } });
        }}>
          <label className="text-sm font-semibold" htmlFor="newnames">{t("Әр жолға бір оқушы. Тізімді Excel не Word-тан көшіріп қоюға болады.")}</label>
          <textarea id="newnames" rows={5} className="input mt-2 text-sm" value={names} onChange={(e) => setNames(e.target.value)} placeholder={t("Әр жолға бір оқушы:\nАйбек Серікұлы\nАружан Нұрланқызы")} autoFocus />
          {msg?.error && <p className="mt-2 text-sm text-rose-600">{t(msg.error)}</p>}
          <button className="btn-primary mt-3" disabled={pending || !names.trim()}><UserPlus className="h-4 w-4" /> {t("Қосу")}</button>
        </form>
      )}
    </div>
  );
}
