"use client";
import { useState, useTransition } from "react";
import { UserPlus, Trash2, Pencil, Check, X } from "lucide-react";
import { addStudents, removeStudent, renameStudent } from "@/app/actions/classes";
import { useT } from "@/lib/i18n/client";

type S = { id: string; name: string; done: number };

export default function StudentsEditor({ classId, students }: { classId: string; students: S[] }) {
  const t = useT();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>();
  const [edit, setEdit] = useState<{ id: string; name: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100">
          <h2 className="font-bold">{t("Сынып тізімі")}</h2>
          <span className="text-sm muted">{t("{n} оқушы", { n: students.length })}</span>
        </div>
        {students.length === 0 ? (
          <p className="p-8 text-center muted">{t("Тізім бос. Оң жақтан оқушыларды қосыңыз.")}</p>
        ) : (
          <ol className="divide-y divide-sky-50">
            {students.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-6 text-right text-xs muted tabular-nums">{i + 1}.</span>
                {edit?.id === s.id ? (
                  <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await renameStudent(s.id, edit.name); if (r?.error) setMsg(r); else setEdit(null); }); }}>
                    <input className="input h-9 flex-1" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} maxLength={60} autoFocus aria-label={t("Аты-жөні")} />
                    <button className="btn-primary btn-sm" disabled={pending} aria-label={t("Сақтау")}><Check className="h-4 w-4" /></button>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setEdit(null)} aria-label={t("Болдырмау")}><X className="h-4 w-4" /></button>
                  </form>
                ) : (
                  <>
                    <span className="flex-1 font-semibold">{s.name}</span>
                    <span className="text-xs muted hidden sm:inline">{t("{n} ойын ойнады", { n: s.done })}</span>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setEdit({ id: s.id, name: s.name })} aria-label={t("Өзгерту")}><Pencil className="h-4 w-4" /></button>
                    <button type="button" className="btn-ghost btn-sm text-rose-600" disabled={pending} aria-label={t("Өшіру")}
                      onClick={() => { if (confirm(t("{n} тізімнен өшірілсін бе?", { n: s.name }))) start(() => removeStudent(s.id)); }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      <form className="card p-5 lg:sticky lg:top-24" onSubmit={(e) => {
        e.preventDefault();
        start(async () => { const r = await addStudents(classId, text); setMsg(r); if (r?.ok) setText(""); });
      }}>
        <h3 className="font-bold flex items-center gap-2"><UserPlus className="h-5 w-5 text-sky-600" /> {t("Оқушыларды қосу")}</h3>
        <p className="mt-1 text-sm muted">{t("Әр жолға бір оқушы. Тізімді Excel не Word-тан көшіріп қоюға болады.")}</p>
        <textarea rows={8} className="input mt-3 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Әр жолға бір оқушы:\nАйбек Серікұлы\nАружан Нұрланқызы")} aria-label={t("Оқушылар тізімі")} />
        {msg?.error && <p className="mt-2 text-sm text-rose-600">{t(msg.error)}</p>}
        {msg?.ok && <p className="mt-2 text-sm text-emerald-700">{msg.ok}</p>}
        <button className="btn-primary mt-3 w-full" disabled={pending || !text.trim()}><UserPlus className="h-4 w-4" /> {t("Қосу")}</button>
        <p className="mt-3 text-xs muted">{t("Тізімде жоқ оқушы сілтеме арқылы өз атын жазып ойнаса, ол «Бағалар журналы» бетінде шығады — тізімге қосасыз не өшіресіз.")}</p>
      </form>
    </div>
  );
}
