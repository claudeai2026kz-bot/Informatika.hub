"use client";
import { useEffect, useState, useTransition } from "react";
import { addGameToClass } from "@/app/actions/classes";
import Link from "next/link";
import { Send, Copy, Check, Users, MessageCircle, School } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/** Мұғалімге: ойынды оқушыларға жіберетін сілтеме (тіркелусіз ойнайды) және нәтижелер. */
type Cls = { id: string; name: string; has: boolean };

/** Ойынды мұғалімнің сыныбына беру — нәтижелер сол сыныптың журналына түседі. */
function AddToClass({ gameId, classes }: { gameId: string; classes: Cls[] }) {
  const t = useT();
  const [sel, setSel] = useState(classes.find((c) => !c.has)?.id ?? "");
  const [done, setDone] = useState<string[]>(classes.filter((c) => c.has).map((c) => c.id));
  const [pending, start] = useTransition();
  if (!classes.length)
    return <Link href="/classes" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"><School className="h-4 w-4" /> {t("Сынып құрып, журнал жүргізу")}</Link>;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <School className="h-4 w-4 text-emerald-700" />
      <select className="input h-9 w-auto py-0 text-sm" value={sel} onChange={(e) => setSel(e.target.value)} aria-label={t("Сынып")}>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}{done.includes(c.id) ? " ✓" : ""}</option>)}
      </select>
      {done.includes(sel) ? (
        <Link href={`/classes/${sel}?tab=games`} className="btn-ghost btn-sm text-emerald-700"><Check className="h-4 w-4" /> {t("Сыныпта бар — ашу")}</Link>
      ) : (
        <button type="button" className="btn-soft btn-sm" disabled={pending || !sel}
          onClick={() => start(async () => { const r = await addGameToClass(sel, gameId); if (r?.ok) setDone((d) => [...d, sel]); })}>
          {t("Сыныбыма беру")}
        </button>
      )}
    </div>
  );
}

export default function SendToStudents({ gameId, title, teacherId, results, classes }: { gameId: string; title: string; teacherId: string | null; results: number; classes?: Cls[] }) {
  const t = useT();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (teacherId) setLink(`${location.origin}/play/${gameId}?t=${teacherId}`); }, [gameId, teacherId]);

  if (!teacherId)
    return (
      <div className="card p-5 mb-6 flex flex-wrap items-center gap-3">
        <Send className="h-5 w-5 text-sky-600" />
        <span className="flex-1 text-sm">{t("Ойынды оқушыларға жіберіп, нәтижесін көру үшін жүйеге кіріңіз.")}</span>
        <Link href={`/login?next=/games/${gameId}`} className="btn-soft btn-sm">{t("Кіру")}</Link>
      </div>
    );

  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* */ }
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title}: ${link}`)}`;

  return (
    <div className="card p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-600"><Send className="h-5 w-5" /></span>
        <div className="flex-1">
          <div className="font-semibold">{t("Оқушыларға жіберу")}</div>
          <div className="text-sm muted">{t("Оқушылар тіркелмей, тек атын жазып ойнайды. Нәтижелері сізге келеді.")}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="input flex-1 text-sm" aria-label={t("Оқушыларға сілтеме")} />
        <button type="button" onClick={copy} className="btn-primary btn-sm">{copied ? <><Check className="h-4 w-4" /> {t("Көшірілді")}</> : <><Copy className="h-4 w-4" /> {t("Көшіру")}</>}</button>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-soft btn-sm"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link href={`/games/${gameId}/results`} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:underline">
          <Users className="h-4 w-4" /> {t("Оқушылар нәтижесі ({n})", { n: results })}
        </Link>
        {classes && <AddToClass gameId={gameId} classes={classes} />}
      </div>
    </div>
  );
}
