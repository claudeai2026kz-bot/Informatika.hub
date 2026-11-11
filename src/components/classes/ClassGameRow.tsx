"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Copy, Check, MessageCircle, Trash2, BarChart3 } from "lucide-react";
import { removeGameFromClass } from "@/app/actions/classes";
import { GAME_ICONS } from "@/components/games/icons";
import { useT } from "@/lib/i18n/client";

type G = { id: string; title: string; type: keyof typeof GAME_ICONS; meta: string };

export default function ClassGameRow({ classId, game, played, total, avg }: { classId: string; game: G; played: number; total: number; avg: string }) {
  const t = useT();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
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
        <button type="button" className="btn-ghost btn-sm ml-auto text-rose-600" disabled={pending}
          onClick={() => { if (confirm(t("Ойынды сыныптан алып тастау керек пе? Оқушылардың нәтижелері өшпейді."))) start(() => removeGameFromClass(classId, game.id)); }}>
          <Trash2 className="h-4 w-4" /> {t("Алып тастау")}
        </button>
      </div>
    </article>
  );
}
