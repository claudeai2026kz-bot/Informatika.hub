"use client";
import { useEffect, useState } from "react";
import { User, Search, Clock, Lock } from "lucide-react";
import { classGameStatus } from "@/app/actions/games";
import GamePlayer from "@/components/games/GamePlayer";
import { useT } from "@/lib/i18n/client";
const fmtDue = (d: Date) => { const p = (n: number) => String(n).padStart(2, "0"); return `${p(d.getDate())}.${p(d.getMonth() + 1)}, ${p(d.getHours())}:${p(d.getMinutes())}`; };

type Classroom = { id: string; name: string; students: { id: string; name: string }[]; attempts?: number; dueAt?: string | null };
type Props = Omit<React.ComponentProps<typeof GamePlayer>, "student"> & { teacherId: string | null; classroom?: Classroom | null };

/** Алдымен оқушы аты-жөнін жазады (сынып сілтемесінде — тізімнен таңдайды), сосын ойын басталады. */
export default function StudentPlay({ teacherId, classroom, ...game }: Props) {
  const t = useT();
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [q, setQ] = useState("");
  const [ready, setReady] = useState(false);
  const [block, setBlock] = useState<"closed" | "limit" | null>(null);
  const [checking, setChecking] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const storeKey = classroom ? `ihub-class-${classroom.id}` : "";
  useEffect(() => {
    try {
      setName(localStorage.getItem("ihub-student-name") ?? "");
      setCls(localStorage.getItem("ihub-student-class") ?? "");
      if (storeKey) {
        const saved = localStorage.getItem(storeKey);
        if (saved && classroom?.students.some((s) => s.id === saved)) setPicked(saved);
      }
    } catch { /* */ }
  }, [storeKey, classroom]);

  if (!teacherId) return <GamePlayer {...game} />;

  if (classroom) {
    const list = classroom.students;
    const chosen = list.find((s) => s.id === picked);
    const free = typing || list.length === 0;
    if (ready) {
      const n = chosen && !free ? chosen.name : name.trim();
      return <GamePlayer {...game} student={{ teacherId, name: n, className: classroom.name, classId: classroom.id, studentId: chosen && !free ? chosen.id : undefined }} />;
    }
    const ok = (free ? name.trim().length >= 2 : !!chosen) && !checking;
    const due = classroom.dueAt && mounted ? new Date(classroom.dueAt) : null;
    if (block === "closed" || (due && due.getTime() < Date.now()))
      return (
        <div className="card p-8 max-w-lg mx-auto text-center">
          <Lock className="mx-auto h-10 w-10 text-rose-400" />
          <h2 className="mt-3 text-xl font-bold">{t("Бұл ойынның мерзімі бітті")}</h2>
          <p className="mt-1 muted">{t("Мұғаліміңе хабарлас.")}</p>
        </div>
      );
    const shown = q ? list.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())) : list;
    return (
      <form className="card p-6 sm:p-10 max-w-xl mx-auto" onSubmit={(e) => {
        e.preventDefault(); if (!ok) return;
        try { if (chosen && !free) localStorage.setItem(storeKey, chosen.id); else localStorage.setItem("ihub-student-name", name.trim()); } catch { /* */ }
        setChecking(true);
        classGameStatus(classroom.id, game.gameId, chosen && !free ? chosen.id : undefined, free ? name.trim() : undefined)
          .then((b) => { setBlock(b); if (!b) setReady(true); })
          .catch(() => setReady(true))
          .finally(() => setChecking(false));
      }}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-600"><User className="h-5 w-5" /></span>
          <div>
            <h2 className="text-xl font-bold">{free ? t("Сәлем! Атыңды жаз") : t("Сәлем! Өз атыңды таңда")}</h2>
            <p className="text-sm muted">{t("{c} сыныбы · нәтижең мұғаліміңнің журналына түседі.", { c: classroom.name })}</p>
          </div>
        </div>
        {(due || (classroom.attempts ?? 0) > 0) && (
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {due && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {t("Мерзімі: {d}", { d: fmtDue(due) })}</span>}
            {(classroom.attempts ?? 0) > 0 && <span>{t("Ойнауға болады: {n} рет", { n: classroom.attempts! })}</span>}
          </p>
        )}
        {block === "limit" && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{t("Сен бұл ойынды ойнап қойғансың. Қайта ойнауға рұқсат жоқ.")}</p>}
        {free ? (
          <>
            <label className="block mt-6 text-sm font-semibold" htmlFor="sname">{t("Аты-жөнің")}</label>
            <input id="sname" className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t("Мысалы: Айбек Серікұлы")} autoFocus />
            {list.length > 0 && <button type="button" className="mt-2 text-sm font-semibold text-sky-600 hover:underline" onClick={() => setTyping(false)}>{t("← Тізімнен таңдау")}</button>}
          </>
        ) : (
          <>
            {list.length > 8 && (
              <div className="relative mt-6">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Атыңды іздеу")} aria-label={t("Атыңды іздеу")} />
              </div>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2 max-h-[46vh] overflow-y-auto pr-1" role="radiogroup" aria-label={t("Оқушылар тізімі")}>
              {shown.map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={picked === s.id} onClick={() => { setPicked(s.id); setBlock(null); }}
                  className={`rounded-xl border px-4 py-3 text-left font-semibold transition ${picked === s.id ? "border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-300" : "border-sky-100 hover:border-sky-300 hover:bg-sky-50/60"}`}>
                  {s.name}
                </button>
              ))}
            </div>
            <button type="button" className="mt-3 text-sm font-semibold text-sky-600 hover:underline" onClick={() => { setTyping(true); setPicked(null); }}>{t("Менің атым тізімде жоқ")}</button>
          </>
        )}
        <button className="btn-primary h-12 w-full mt-6 text-base" disabled={!ok}>{t("Ойынға кіру")}</button>
      </form>
    );
  }

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
