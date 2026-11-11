"use client";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trophy, Eye, Timer, X, Flag, Users } from "lucide-react";
import { useT } from "@/lib/i18n/client";

type Q = { id: string; prompt: string; points: number; data: Record<string, unknown> };
export const TEAM_COLORS = [
  { name: "Көктер", bg: "from-sky-400 to-sky-600", ring: "ring-sky-300", text: "text-sky-600", hex: "#3C9EEB" },
  { name: "Күлгіндер", bg: "from-lilac-400 to-lilac-600", ring: "ring-lilac-300", text: "text-lilac-600", hex: "#8B6CF0" },
  { name: "Сарылар", bg: "from-gold-400 to-orange-500", ring: "ring-amber-300", text: "text-amber-600", hex: "#F59E0B" },
  { name: "Жасылдар", bg: "from-emerald-400 to-emerald-600", ring: "ring-emerald-300", text: "text-emerald-600", hex: "#10B981" },
];

/** Командалар саны мен аттарын таңдау. */
export function TeamSetup({ min = 2, max = 4, onStart, title, note }: { min?: number; max?: number; onStart: (names: string[]) => void; title: string; note: string }) {
  const t = useT();
  const [n, setN] = useState(min);
  const [names, setNames] = useState<string[]>(TEAM_COLORS.map((c) => t(c.name)));
  return (
    <div className="card p-6 sm:p-10 max-w-2xl mx-auto">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-100 text-gold-500"><Users className="h-6 w-6" /></span>
      <h2 className="mt-3 text-2xl font-bold">{title}</h2>
      <p className="mt-1 muted">{note}</p>
      {max > min && (
        <div className="mt-5 flex gap-2" role="radiogroup" aria-label={t("Командалар саны")}>
          {Array.from({ length: max - min + 1 }, (_, k) => k + min).map((k) => (
            <button key={k} role="radio" aria-checked={n === k} onClick={() => setN(k)} className={`h-11 flex-1 rounded-xl border-2 font-bold ${n === k ? "border-sky-500 bg-sky-50 text-sky-700" : "border-sky-100"}`}>{t("{n} команда", { n: k })}</button>
          ))}
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: n }, (_, k) => (
          <label key={k} className="flex items-center gap-2">
            <span className={`h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br ${TEAM_COLORS[k].bg}`} />
            <input className="input" value={names[k]} maxLength={24} onChange={(e) => setNames((s) => s.map((x, j) => (j === k ? e.target.value : x)))} aria-label={t("{n}-команда аты", { n: k + 1 })} />
          </label>
        ))}
      </div>
      <button className="btn-primary h-12 w-full mt-6 text-base" onClick={() => onStart(names.slice(0, n).map((x, k) => x.trim() || t(TEAM_COLORS[k].name)))}>{t("Ойынды бастау")}</button>
    </div>
  );
}

/** Команданың ұпайы: мұғалім қолмен қоса не азайта алады. */
export function ScoreCard({ k, name, score, step, onChange, active }: { k: number; name: string; score: number; step: number; onChange: (d: number) => void; active?: boolean }) {
  const t = useT();
  const c = TEAM_COLORS[k];
  return (
    <div className={`relative overflow-hidden rounded-2xl p-3 text-white shadow-lg transition ${active ? `ring-4 ${c.ring} scale-[1.03]` : ""}`}>
      <span className={`absolute inset-0 bg-gradient-to-br ${c.bg}`} aria-hidden />
      <div className="relative flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold opacity-90">{name}</div>
          <div className="text-3xl font-black tabular-nums" aria-live="polite">{score}</div>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => onChange(step)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/25 hover:bg-white/40" aria-label={t("{n} командаға +{s}", { n: name, s: step })}><Plus className="h-4 w-4" /></button>
          <button onClick={() => onChange(-step)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/25 hover:bg-white/40" aria-label={t("{n} командадан −{s}", { n: name, s: step })}><Minus className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

export function Podium({ names, scores, onAgain }: { names: string[]; scores: number[]; onAgain: () => void }) {
  const t = useT();
  const order = names.map((n, k) => ({ n, k, s: scores[k] })).sort((a, b) => b.s - a.s);
  const top = order[0];
  const tie = order.length > 1 && order[1].s === top.s;
  return (
    <div className="relative overflow-hidden card p-8 sm:p-12 text-center">
      {Array.from({ length: 28 }, (_, k) => <span key={k} className="g-confetti pointer-events-none absolute top-0 h-3 w-2 rounded-sm" style={{ left: `${(k * 37) % 100}%`, background: TEAM_COLORS[k % 4].hex, animationDelay: `${(k % 7) * 0.15}s` }} aria-hidden />)}
      <Trophy className="mx-auto h-14 w-14 text-gold-500" />
      <h2 className="mt-3 text-3xl font-extrabold">{tie ? t("Тең түсті! 🤝") : t("{n} жеңді! 🏆", { n: top.n })}</h2>
      <div className="mx-auto mt-8 flex max-w-xl items-end justify-center gap-3">
        {order.map((o, place) => (
          <div key={o.k} className="flex-1">
            <div className="truncate text-sm font-bold">{o.n}</div>
            <div className={`mt-1 rounded-t-2xl bg-gradient-to-b ${TEAM_COLORS[o.k].bg} pt-3 text-2xl font-black text-white`} style={{ height: `${Math.max(60, 150 - place * 35)}px` }}>{o.s}</div>
          </div>
        ))}
      </div>
      <button className="btn-primary mt-8" onClick={onAgain}>{t("Қайта ойнау")}</button>
    </div>
  );
}

/** Ұпай тақтасы: командалар кезекпен тақырып пен бағаны таңдайды, ұпайды мұғалім береді. */
export default function Board({ questions }: { questions: Q[] }) {
  const t = useT();
  const [teams, setTeams] = useState<string[] | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Q | null>(null);
  const [showAns, setShowAns] = useState(false);
  const [turn, setTurn] = useState(0);
  const [timer, setTimer] = useState(true);
  const [left, setLeft] = useState(30);
  const [ended, setEnded] = useState(false);
  const cats = useMemo(() => [...new Set(questions.map((q) => String(q.data.category ?? t("Жалпы"))))], [questions, t]);
  const byCat = (c: string) => questions.filter((q) => String(q.data.category ?? t("Жалпы")) === c).sort((a, b) => a.points - b.points);
  const step = Math.max(1, Math.min(...questions.map((q) => q.points)));

  useEffect(() => {
    if (!open || showAns || !timer) return;
    if (left <= 0) { setShowAns(true); return; }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [open, showAns, left, timer]);

  if (!teams) return <TeamSetup title={t("Ұпай тақтасы")} note={t("Командалар кезекпен тақырып пен бағаны таңдайды. Жауаптың дұрыс-бұрысын мұғалім шешіп, ұпайды өзі береді.")} onStart={(n) => { setTeams(n); setScores(n.map(() => 0)); }} />;
  if (ended) return <Podium names={teams} scores={scores} onAgain={() => { setScores(teams.map(() => 0)); setUsed(new Set()); setEnded(false); setTurn(0); }} />;

  const change = (k: number, d: number) => setScores((s) => s.map((x, j) => (j === k ? x + d : x)));
  function close(winner?: number, delta = 0) {
    if (!open) return;
    if (winner !== undefined) change(winner, delta);
    setUsed((u) => new Set(u).add(open.id));
    setOpen(null); setShowAns(false);
    setTurn((x) => (x + 1) % teams!.length);
  }
  const ans = open ? String(open.data.answer ?? "") : "";

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${teams.length > 2 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
        {teams.map((n, k) => <ScoreCard key={k} k={k} name={n} score={scores[k]} step={step} onChange={(d) => change(k, d)} active={turn === k} />)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold">{t("Кезек:")} <b className={TEAM_COLORS[turn].text}>{teams[turn]}</b></span>
        <span className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 font-semibold"><input type="checkbox" className="h-4 w-4 accent-sky-500" checked={timer} onChange={(e) => setTimer(e.target.checked)} /> {t("30 секунд таймер")}</label>
          <button className="btn-ghost btn-sm" onClick={() => setEnded(true)}><Flag className="h-4 w-4" /> {t("Ойынды аяқтау")}</button>
        </span>
      </div>
      <div className="overflow-x-auto rounded-3xl bg-gradient-to-br from-[#1E2A78] via-[#3A2A8C] to-[#1B1F5C] p-3 sm:p-4 shadow-[0_30px_60px_-30px_#1b0b4d]">
        <div className="grid min-w-[520px] gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${cats.length}, minmax(0, 1fr))` }}>
          {cats.map((c) => <div key={c} className="rounded-xl bg-white/10 px-2 py-3 text-center text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white">{c}</div>)}
          {Array.from({ length: Math.max(...cats.map((c) => byCat(c).length)) }, (_, r) => cats.map((c) => {
            const q = byCat(c)[r];
            if (!q) return <div key={`${c}${r}`} />;
            const u = used.has(q.id);
            return (
              <button key={q.id} disabled={u} onClick={() => { setOpen(q); setShowAns(false); setLeft(30); }}
                className={`h-16 sm:h-20 rounded-xl text-2xl sm:text-3xl font-black transition ${u ? "bg-white/5 text-white/20" : "bg-gradient-to-b from-gold-300 to-gold-500 text-[#3b2600] shadow-[0_5px_0_#a8730a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"}`}>
                {u ? "—" : q.points}
              </button>
            );
          }))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b0f35]/85 p-4 backdrop-blur" role="dialog" aria-modal="true">
          <div className="g-pop w-full max-w-3xl rounded-3xl bg-gradient-to-b from-[#2A3A9C] to-[#1E2A78] p-6 sm:p-10 text-center text-white shadow-2xl">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="chip bg-white/15">{String(open.data.category ?? "")} · {open.points}</span>
              {timer && !showAns && <span className={`inline-flex items-center gap-1 text-lg ${left <= 5 ? "text-rose-300" : ""}`}><Timer className="h-5 w-5" />{left}</span>}
              <button onClick={() => close()} className="rounded-full p-1 hover:bg-white/10" aria-label={t("Жабу")}><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-6 text-2xl sm:text-4xl font-extrabold leading-snug whitespace-pre-line">{open.prompt}</p>
            {showAns ? (
              <>
                <p className="mt-6 g-pop rounded-2xl bg-emerald-400/20 px-4 py-3 text-xl sm:text-2xl font-bold text-emerald-200">{ans}</p>
                <p className="mt-6 text-sm text-white/70">{t("Кім дұрыс жауап берді?")}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {teams.map((n, k) => (
                    <span key={k} className="inline-flex overflow-hidden rounded-xl">
                      <button onClick={() => close(k, open.points)} className={`bg-gradient-to-b ${TEAM_COLORS[k].bg} px-4 py-2.5 font-bold`}>{n} +{open.points}</button>
                      <button onClick={() => close(k, -open.points)} className="bg-white/15 px-3 font-bold hover:bg-white/25" aria-label={t("{n} командадан −{s}", { n, s: open.points })}>−</button>
                    </span>
                  ))}
                  <button onClick={() => close()} className="rounded-xl bg-white/15 px-4 py-2.5 font-bold hover:bg-white/25">{t("Ешкім")}</button>
                </div>
              </>
            ) : (
              <button className="mt-8 rounded-2xl bg-white px-6 py-3 font-extrabold text-[#1E2A78]" onClick={() => setShowAns(true)}><Eye className="mr-1 inline h-5 w-5" />{t("Жауапты көрсету")}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
