"use client";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import GamePlayer from "@/components/games/GamePlayer";
import { useT } from "@/lib/i18n/client";

type Props = Omit<React.ComponentProps<typeof GamePlayer>, "student"> & { teacherId: string | null };

/** Алдымен оқушы аты-жөнін жазады, сосын ойын басталады. */
export default function StudentPlay({ teacherId, ...game }: Props) {
  const t = useT();
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setName(localStorage.getItem("ihub-student-name") ?? ""); setCls(localStorage.getItem("ihub-student-class") ?? ""); } catch { /* */ }
  }, []);

  if (!teacherId) return <GamePlayer {...game} />;
  if (ready) return <GamePlayer {...game} student={{ teacherId, name: name.trim(), className: cls.trim() }} />;

  const ok = name.trim().length >= 2;
  return (
    <form className="card p-6 sm:p-10 max-w-lg mx-auto" onSubmit={(e) => {
      e.preventDefault(); if (!ok) return;
      try { localStorage.setItem("ihub-student-name", name.trim()); localStorage.setItem("ihub-student-class", cls.trim()); } catch { /* */ }
      setReady(true);
    }}>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-600"><User className="h-5 w-5" /></span>
        <div>
          <h2 className="text-xl font-bold">{t("Сәлем! Атыңды жаз")}</h2>
          <p className="text-sm muted">{t("Нәтижең мұғаліміңе жіберіледі. Тіркелу қажет емес.")}</p>
        </div>
      </div>
      <label className="block mt-6 text-sm font-semibold" htmlFor="sname">{t("Аты-жөнің")}</label>
      <input id="sname" className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t("Мысалы: Айбек Серікұлы")} autoFocus />
      <label className="block mt-4 text-sm font-semibold" htmlFor="sclass">{t("Сыныбың (міндетті емес)")}</label>
      <input id="sclass" className="input mt-1" value={cls} onChange={(e) => setCls(e.target.value)} maxLength={20} placeholder={t("Мысалы: 7 «А»")} />
      <button className="btn-primary h-12 w-full mt-6 text-base" disabled={!ok}>{t("Ойынға кіру")}</button>
    </form>
  );
}
