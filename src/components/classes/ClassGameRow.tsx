"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Copy, Check, MessageCircle, Trash2, BarChart3, SlidersHorizontal, Clock } from "lucide-react";
import { removeGameFromClass, updateClassGame } from "@/app/actions/classes";
import { GAME_ICONS } from "@/components/games/icons";
import { useT } from "@/lib/i18n/client";
const fmtDue = (d: Date) => { const p = (n: number) => String(n).padStart(2, "0"); return `${p(d.getDate())}.${p(d.getMonth() + 1)}, ${p(d.getHours())}:${p(d.getMinutes())}`; };

type G = { id: string; title: string; type: keyof typeof GAME_ICONS; meta: string };

type S = { attempts: number; countMode: string; dueAt: string | null };

/** ISO → <input type="datetime-local"> мәні (браузердің өз уақыты бойынша). */
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function ClassGameRow({ classId, game, played, total, avg, settings }: { classId: string; game: G; played: number; total: number; avg: string; settings: S }) {
  const t = useT();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [att, setAtt] = useState(settings.attempts);
  const [mode, setMode] = useState(settings.countMode);
  const [due, setDue] = useState("");
  useEffect(() => setDue(toLocal(settings.dueAt)), [settings.dueAt]);
  const [msg, setMsg] = useState<string>();
  // Күн мен уақыт браузерде ғана көрсетіледі (сервер мен браузердің уақыт белдеуі әртүрлі)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const closed = !!settings.dueAt && now !== null && new Date(settings.dueAt).getTime() < now;
  const modeLabel: Record<string, string> = { best: "ең жақсы нәтиже", first: "бірінші нәтиже", last: "соңғы нәтиже" };
  useEffect(() => setLink(`${location.origin}/play/${game.id}?c=${classId}`), [game.id, classId]);
  const I = GAME_ICONS[game.type];
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* */ }
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(`${game.title}: ${link}`)}`;
  return (
    <article className={`card p-4 sm:p-5 ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lilac-100 text-lilac-500"><I className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-snug"><Link href={`/games/${game.id}`} className="hover:text-sky-600">{game.title}</Link></h3>
          <p className="text-xs muted mt-0.5">{game.meta}</p>
          <p className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-md bg-sky-50 px-2 py-0.5 text-sky-800">{settings.attempts ? t("{n} рет ойнайды", { n: settings.attempts }) : t("шексіз ойнайды")}</span>
            <span className="rounded-md bg-sky-50 px-2 py-0.5 text-sky-800">{t("журналда: {m}", { m: t(modeLabel[settings.countMode] ?? modeLabel.best) })}</span>
            {settings.dueAt && now !== null && <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${closed ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}><Clock className="h-3 w-3" /> {closed ? t("мерзімі бітті") : t("{d} дейін", { d: fmtDue(new Date(settings.dueAt)) })}</span>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-extrabold tabular-nums">{played}/{total}</div>
          <div className="text-xs muted">{t("ойнады")} · {avg}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="btn-primary btn-sm">{copied ? <><Check className="h-4 w-4" /> {t("Көшірілді")}</> : <><Copy className="h-4 w-4" /> {t("Сілтемені көшіру")}</>}</button>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-soft btn-sm"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
        <Link href={`/games/${game.id}/results?c=${classId}`} className="btn-ghost btn-sm"><BarChart3 className="h-4 w-4" /> {t("Нәтижелер")}</Link>
        <button type="button" className={open ? "btn-soft btn-sm" : "btn-ghost btn-sm"} onClick={() => setOpen((o) => !o)} aria-expanded={open}><SlidersHorizontal className="h-4 w-4" /> {t("Баптау")}</button>
        <button type="button" className="btn-ghost btn-sm ml-auto text-rose-600" disabled={pending}
          onClick={() => { if (confirm(t("Ойынды сыныптан алып тастау керек пе? Оқушылардың нәтижелері өшпейді."))) start(() => removeGameFromClass(classId, game.id)); }}>
          <Trash2 className="h-4 w-4" /> {t("Алып тастау")}
        </button>
      </div>
      {open && (
        <form className="mt-3 grid gap-3 rounded-xl bg-sky-50/70 p-3 sm:grid-cols-3" onSubmit={(e) => {
          e.preventDefault(); setMsg(undefined);
          start(async () => {
            const r = await updateClassGame(classId, game.id, { attempts: att, countMode: mode, dueAt: due ? new Date(due).toISOString() : null });
            setMsg(r?.error ? t(r.error) : t("Сақталды")); if (r?.ok) setOpen(false);
          });
        }}>
          <label className="text-sm font-semibold">{t("Неше рет ойнайды")}
            <select className="input mt-1" value={att} onChange={(e) => setAtt(Number(e.target.value))}>
              <option value={0}>{t("Шексіз")}</option>
              {[1, 2, 3, 5].map((n) => <option key={n} value={n}>{t("{n} рет", { n })}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">{t("Журналға түсетін нәтиже")}
            <select className="input mt-1" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="best">{t("Ең жақсы нәтиже")}</option>
              <option value="first">{t("Бірінші нәтиже")}</option>
              <option value="last">{t("Соңғы нәтиже")}</option>
            </select>
          </label>
          <label className="text-sm font-semibold">{t("Мерзімі (міндетті емес)")}
            <span className="mt-1 flex gap-1">
              <input type="datetime-local" className="input flex-1" value={due} onChange={(e) => setDue(e.target.value)} />
              {due && <button type="button" className="btn-ghost btn-sm self-center" onClick={() => setDue("")} aria-label={t("Мерзімді алып тастау")}>×</button>}
            </span>
          </label>
          <div className="sm:col-span-3 flex items-center gap-3">
            <button className="btn-primary btn-sm" disabled={pending}>{t("Сақтау")}</button>
            <span className="text-xs muted">{t("Мерзімі біткен соң сілтеме жабылады, оқушы ойнай алмайды.")}</span>
          </div>
        </form>
      )}
      {msg && !open && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
    </article>
  );
}
