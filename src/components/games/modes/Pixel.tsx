"use client";
import { useState } from "react";
import { Check, X, Eraser } from "lucide-react";
import { useT } from "@/lib/i18n/client";

type Q = { id: string; prompt: string; points: number; data: Record<string, unknown> };

/** Жарқырайтын LED тақта. */
export function LedPanel({ rows, color, onToggle, marks, size = "lg" }: { rows: string[]; color: string; onToggle?: (r: number, c: number) => void; marks?: (boolean | null)[]; size?: "sm" | "lg" }) {
  const cols = rows[0]?.length ?? 0;
  return (
    <div className={`relative rounded-[22px] bg-gradient-to-b from-[#2A2D45] to-[#14152A] ${size === "lg" ? "p-3 sm:p-4" : "p-2"} shadow-[inset_0_1px_0_#ffffff22,0_18px_40px_-18px_#000]`}>
      <div className="grid gap-[5px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {rows.flatMap((r, ri) => r.split("").map((b, ci) => {
          const on = b === "1";
          const El = onToggle ? "button" : "div";
          return (
            <El key={`${ri}-${ci}`} type={onToggle ? "button" : undefined} onClick={onToggle ? () => onToggle(ri, ci) : undefined}
              aria-label={onToggle ? `${ri + 1}:${ci + 1}` : undefined}
              className={`aspect-square rounded-[6px] transition-all duration-200 ${onToggle ? "active:scale-90" : ""}`}
              style={on ? { background: `radial-gradient(circle at 35% 30%, #fff, ${color} 55%)`, boxShadow: `0 0 ${size === "lg" ? 14 : 6}px ${color}, inset 0 -2px 0 #0003` } : { background: "linear-gradient(#33364f,#262842)", boxShadow: "inset 0 2px 3px #0008" }} />
          );
        }))}
      </div>
      {marks && (
        <div className="absolute -right-7 top-0 grid h-full py-3 sm:py-4" style={{ gridTemplateRows: `repeat(${rows.length}, 1fr)` }}>
          {marks.map((m, k) => <span key={k} className="grid place-items-center">{m === true ? <Check className="h-4 w-4 text-emerald-500" /> : m === false ? <X className="h-4 w-4 text-rose-500" /> : null}</span>)}
        </div>
      )}
    </div>
  );
}

export default function Pixel({ q, onDone }: { q: Q; onDone: (v: string[]) => void }) {
  const t = useT();
  const target = (q.data.target as string[]) ?? [];
  const color = (q.data.color as string) ?? "#A78BFA";
  const paint = q.data.mode === "paint";
  const cols = target[0]?.length ?? 0;
  const empty = target.map(() => "0".repeat(cols));
  const [rows, setRows] = useState<string[]>(paint ? empty : target.map(() => ""));
  const shown = paint ? rows : rows.map((r) => (r.replace(/[^01]/g, "") + "0".repeat(cols)).slice(0, cols));
  const filled = paint ? true : rows.every((r) => r.length === cols);
  const done = shown.filter((r, k) => r === target[k]).length;

  function toggle(r: number, c: number) {
    setRows((s) => s.map((row, k) => (k === r ? row.slice(0, c) + (row[c] === "1" ? "0" : "1") + row.slice(c + 1) : row)));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold">{q.prompt || t(paint ? "Кодты суретке айналдыр" : "Суретті кодқа айналдыр")}</h2>
        <p className="mt-1 text-sm muted">{t(paint ? "Әр жолдағы 1 — жанған шаршы, 0 — сөнген. Шаршыларды басып суретті сал." : "Жанған шаршы — 1, сөнген шаршы — 0. Әр жолдың кодын жаз.")}</p>
        {paint ? (
          <ol className="mt-4 space-y-1.5 font-mono text-[15px] sm:text-base">
            {target.map((r, k) => (
              <li key={k} className={`flex items-center gap-3 rounded-lg px-3 py-1 ${shown[k] === r ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-ink"}`}>
                <span className="w-5 text-right text-xs muted">{k + 1}</span><span className="tracking-[.25em]">{r}</span>{shown[k] === r && <Check className="ml-auto h-4 w-4" />}
              </li>
            ))}
          </ol>
        ) : (
          <>
            <div className="mt-4 flex items-start gap-4">
              <div className="w-36 shrink-0 sm:w-44"><LedPanel rows={target} color={color} size="sm" /></div>
              <p className="text-sm text-ink-soft">{t("Сол жақтағы суретке қара. Әр жолда {n} шаршы бар.", { n: cols })}</p>
            </div>
            <ol className="mt-4 space-y-1.5">
              {rows.map((r, k) => (
                <li key={k} className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs muted">{k + 1}</span>
                  <input value={r} inputMode="numeric" maxLength={cols} aria-label={t("{n}-жол коды", { n: k + 1 })}
                    onChange={(e) => { const v = e.target.value.replace(/[^01]/g, "").slice(0, cols); setRows((s) => s.map((x, j) => (j === k ? v : x))); if (v.length === cols) (document.getElementById(`px-${k + 1}`) as HTMLInputElement | null)?.focus(); }}
                    id={`px-${k}`} className={`input h-10 font-mono tracking-[.3em] ${shown[k] === target[k] && r.length === cols ? "!border-emerald-400 bg-emerald-50" : ""}`} placeholder={"0".repeat(cols)} />
                </li>
              ))}
            </ol>
          </>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className="btn-primary" disabled={!filled} onClick={() => onDone(shown)}>{t("Тексеру")}</button>
          {paint && <button className="btn-ghost btn-sm" onClick={() => setRows(empty)}><Eraser className="h-4 w-4" /> {t("Тазалау")}</button>}
          <span className="text-sm font-semibold text-emerald-600">{t("{n} / {m} жол дұрыс", { n: done, m: target.length })}</span>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_top,#3B2A6B,#120F24_70%)] p-5 sm:p-8">
        <div className="absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full blur-3xl" style={{ background: color, opacity: 0.25 }} aria-hidden />
        <div className="relative mx-auto max-w-[460px]"><LedPanel rows={shown} color={color} onToggle={paint ? toggle : undefined} /></div>
        <p className="relative mt-4 text-center text-sm text-white/70">{t(paint ? "Шаршыны басып жақ не сөндір" : "Кодты жазған сайын шаршылар жанады")}</p>
      </div>
    </div>
  );
}
