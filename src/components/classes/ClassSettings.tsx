"use client";
import { useState, useTransition } from "react";
import { Save, Trash2 } from "lucide-react";
import { deleteClass, renameClass } from "@/app/actions/classes";
import { GRADES } from "@/lib/labels";
import { useT } from "@/lib/i18n/client";

export default function ClassSettings({ classId, name, grade }: { classId: string; name: string; grade: number }) {
  const t = useT();
  const [n, setN] = useState(name);
  const [g, setG] = useState(grade);
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>();
  const [pending, start] = useTransition();
  return (
    <div className="space-y-6">
      <form className="card p-5 space-y-4" onSubmit={(e) => { e.preventDefault(); start(async () => setMsg(await renameClass(classId, n, g))); }}>
        <h2 className="font-bold">{t("Сынып атауы")}</h2>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <input className="input" value={n} onChange={(e) => setN(e.target.value)} maxLength={30} aria-label={t("Сынып атауы")} />
          <select className="input" value={g} onChange={(e) => setG(Number(e.target.value))} aria-label={t("Сынып")}>
            {GRADES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        {msg?.error && <p className="text-sm text-rose-600">{t(msg.error)}</p>}
        {msg?.ok && <p className="text-sm text-emerald-700">{t(msg.ok)}</p>}
        <button className="btn-primary" disabled={pending}><Save className="h-4 w-4" /> {t("Сақтау")}</button>
      </form>
      <div className="card p-5 border border-rose-100">
        <h2 className="font-bold text-rose-700">{t("Сыныпты өшіру")}</h2>
        <p className="mt-1 text-sm muted">{t("Сынып тізімі мен журнал өшеді. Ойындардың өзі және «Оқушылар нәтижесі» беттеріндегі жазбалар сақталады.")}</p>
        <button type="button" className="btn-ghost mt-3 text-rose-600" disabled={pending}
          onClick={() => { if (confirm(t("«{c}» сыныбын өшіру керек пе?", { c: name }))) start(() => deleteClass(classId)); }}>
          <Trash2 className="h-4 w-4" /> {t("Өшіру")}
        </button>
      </div>
    </div>
  );
}
