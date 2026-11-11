"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio, Loader2, UsersRound, Smartphone, Monitor } from "lucide-react";
import { startLive } from "@/app/actions/live";
import { useT } from "@/lib/i18n/client";

/** Мұғалім тірі ойынды ашады (Сынып жарысы не Командалық қашу бөлмесі). */
export default function LiveLaunch({ gameId, team, loggedIn, compact }: { gameId: string; team?: boolean; loggedIn: boolean; compact?: boolean }) {
  const t = useT();
  const [n, setN] = useState(3);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const go = () => start(async () => { const r = await startLive(gameId, team ? n : 0); if ("code" in r && r.code) router.push(`/games/live/${r.code}`); else setErr(("error" in r && r.error) || "Қате"); });

  if (compact)
    return loggedIn
      ? <button className="btn-soft btn-sm" onClick={go} disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />} {t("Сынып жарысы (телефоннан)")}</button>
      : null;

  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#2B2FA8] via-[#5B2FC0] to-[#8B3FD8] p-6 sm:p-10 text-white shadow-[0_30px_60px_-30px_#2b1673]">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">{team ? <UsersRound className="h-7 w-7" /> : <Radio className="h-7 w-7" />}</span>
      <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold">{t(team ? "Командалық қашу бөлмесі" : "Сынып жарысы")}</h2>
      <ol className="mt-4 space-y-2 text-white/90">
        <li className="flex gap-2"><Monitor className="h-5 w-5 shrink-0" />{t("Мұғалім ойынды ашады, тақтада код шығады.")}</li>
        <li className="flex gap-2"><Smartphone className="h-5 w-5 shrink-0" />{t(team ? "Оқушылар телефоннан кодпен кіреді, сайт оларды командаларға бөледі. Әр мүшеге кодтың бір бөлігі ғана көрінеді." : "Оқушылар телефоннан кодпен кіріп, бір уақытта жауап береді. Әр сұрақтан кейін үздіктер кестесі шығады.")}</li>
      </ol>
      {team && (
        <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label={t("Командалар саны")}>
          {[2, 3, 4, 5, 6].map((k) => <button key={k} role="radio" aria-checked={n === k} onClick={() => setN(k)} className={`h-10 rounded-xl px-4 font-bold ${n === k ? "bg-white text-[#3B2FA8]" : "bg-white/15 hover:bg-white/25"}`}>{t("{n} команда", { n: k })}</button>)}
        </div>
      )}
      {err && <p className="mt-4 rounded-xl bg-rose-500/30 px-3 py-2 text-sm font-semibold">{t(err)}</p>}
      <div className="mt-6">
        {loggedIn
          ? <button className="rounded-2xl bg-white px-6 py-3.5 text-lg font-extrabold text-[#3B2FA8] shadow-lg disabled:opacity-60" onClick={go} disabled={pending}>{pending ? <Loader2 className="mr-1 inline h-5 w-5 animate-spin" /> : null}{t("Ойынды ашу")}</button>
          : <Link href={`/login?next=/games/${gameId}`} className="rounded-2xl bg-white px-6 py-3.5 text-lg font-extrabold text-[#3B2FA8]">{t("Мұғалім ретінде кіру")}</Link>}
        <Link href="/live" className="ml-3 text-sm font-semibold text-white/90 underline">{t("Мен оқушымын, кодпен кіремін")}</Link>
      </div>
    </div>
  );
}
