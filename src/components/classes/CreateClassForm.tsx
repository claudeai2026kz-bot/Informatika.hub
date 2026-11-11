"use client";
import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createClass } from "@/app/actions/classes";
import { GRADES } from "@/lib/labels";
import { useT } from "@/lib/i18n/client";

export default function CreateClassForm() {
  const t = useT();
  const [state, action, pending] = useActionState(createClass, undefined);
  return (
    <form action={action} className="mt-4 space-y-4">
      {state?.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{t(state.error)}</p>}
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <div>
          <label className="text-sm font-semibold" htmlFor="cname">{t("Сынып атауы")}</label>
          <input id="cname" name="name" className="input mt-1" placeholder={t("Мысалы: 7 «А»")} maxLength={30} required />
        </div>
        <div>
          <label className="text-sm font-semibold" htmlFor="cgrade">{t("Сынып")}</label>
          <select id="cgrade" name="grade" className="input mt-1" defaultValue={7}>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="cstudents">{t("Оқушылар тізімі (міндетті емес)")}</label>
        <textarea id="cstudents" name="students" rows={6} className="input mt-1 text-sm" placeholder={t("Әр жолға бір оқушы:\nАйбек Серікұлы\nАружан Нұрланқызы")} />
        <p className="mt-1 text-xs muted">{t("Тізімсіз де болады: оқушы сілтемені ашып, атын жазса — кестеге өзі қосылады.")}</p>
      </div>
      <button className="btn-primary w-full" disabled={pending}><Plus className="h-4 w-4" /> {t("Сынып құру")}</button>
    </form>
  );
}
