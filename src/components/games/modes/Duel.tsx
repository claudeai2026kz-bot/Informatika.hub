"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Swords, Timer, Check, X, Copy, MessageCircle, Trophy, Loader2 } from "lucide-react";
import { checkAnswer } from "@/app/actions/games";
import { answerDuel, createDuel } from "@/app/actions/duel";
import { useT } from "@/lib/i18n/client";

type Q = { id: string; prompt: string; points: number; data: Record<string, unknown> };
const fmtS = (ms: number) => `${(ms / 1000).toFixed(1)} с`;

/** Жылдам сұрақтар: әр жауаптың уақыты есептеледі. */
function Run({ gameId, questions, onDone, color }: { gameId: string; questions: Q[]; onDone: (a: Record<string, unknown>, ms: number) => void; color: string }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [fb, setFb] = useState<{ k: number; ok: boolean; ans: number } | null>(null);
  const [score, setScore] = useState(0);
  const [now, setNow] = useState(0);
  const t0 = useRef(0);
  const total = useRef(0);
  const [pending, start] = useTransition();
  const q = questions[i];
  const opts = (q.data.options as string[]) ?? [];
  useEffect(() => { t0.current = performance.now(); setFb(null); }, [i]);
  useEffect(() => { const id = setInterval(() => setNow(performance.now()), 100); return () => clearInterval(id); }, []);

  function pick(k: number) {
    if (fb || pending) return;
    total.current += performance.now() - t0.current;
    start(async () => {
      const r = await checkAnswer(gameId, q.id, k);
      const a = { ...answers, [q.id]: k };
      setAnswers(a); setFb({ k, ok: r.correct, ans: r.answer as number });
      if (r.correct) setScore((s) => s + q.points);
      setTimeout(() => (i + 1 < questions.length ? setI(i + 1) : onDone(a, total.current)), 900);
    });
  }
  const el = fb ? 0 : Math.max(0, now - t0.current);
  return (
    <div className="card overflow-hidden">
      <div className={`flex items-center justify-between bg-gradient-to-r ${color} px-5 py-3 text-sm font-bold text-white`}>
        <span>{t("Сұрақ")} {i + 1} / {questions.length}</span>
        <span className="inline-flex items-center gap-3"><span className="inline-flex items-center gap-1"><Timer className="h-4 w-4" />{fmtS(total.current + el)}</span><span>{t("{n} балл", { n: score })}</span></span>
      </div>
      <div className="p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold">{q.prompt}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {opts.map((o, k) => {
            const right = fb && fb.ans === k, wrong = fb && fb.k === k && !fb.ok;
            return <button key={k} disabled={!!fb || pending} onClick={() => pick(k)} className={`rounded-xl border-2 px-4 py-3.5 text-left font-semibold transition active:scale-[.98] ${right ? "border-emerald-400 bg-emerald-50" : wrong ? "border-rose-400 bg-rose-50" : "border-sky-100 hover:border-sky-400 hover:bg-sky-50"}`}>{o}{right && <Check className="float-right h-5 w-5 text-emerald-500" />}{wrong && <X className="float-right h-5 w-5 text-rose-500" />}</button>;
          })}
        </div>
      </div>
    </div>
  );
}

function NameForm({ title, note, onGo, cta }: { title: string; note: string; onGo: (n: string) => void; cta: string }) {
  const t = useT();
  const [name, setName] = useState("");
  useEffect(() => { try { setName(localStorage.getItem("ihub-student-name") ?? ""); } catch { /* */ } }, []);
  return (
    <form className="card p-6 sm:p-10 max-w-lg mx-auto text-center" onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) return; try { localStorage.setItem("ihub-student-name", name.trim()); } catch { /* */ } onGo(name.trim()); }}>
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-rose-400 to-lilac-500 text-white shadow-lg"><Swords className="h-8 w-8" /></span>
      <h2 className="mt-4 text-2xl font-extrabold">{title}</h2>
      <p className="mt-1 muted">{note}</p>
      <input className="input mt-5 text-center" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t("Атың")} aria-label={t("Атың")} autoFocus />
      <button className="btn-primary h-12 w-full mt-4 text-base" disabled={name.trim().length < 2}>{cta}</button>
    </form>
  );
}

/** Дуэльді бастау: ойнап болған соң досына сілтеме жібереді. */
export function DuelStart({ gameId, title, questions, teacherId }: { gameId: string; title: string; questions: Q[]; teacherId?: string | null }) {
  const t = useT();
  const [name, setName] = useState<string | null>(null);
  const [res, setRes] = useState<{ id: string; score: number; max: number; ms: number } | null>(null);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  if (!name) return <NameForm title={t("Дуэль")} note={t("Алдымен өзің ойна, сосын досыңа шақыру жібер. Ол сол сұрақтарға жауап береді: кім көп балл алса (тең болса — кім жылдам), сол жеңеді.")} cta={t("Ойнау")} onGo={setName} />;
  if (pending) return <div className="card p-16 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-sky-500" /></div>;
  if (!res) return <Run gameId={gameId} questions={questions} color="from-sky-500 to-lilac-500" onDone={(a, ms) => start(async () => { const r = await createDuel(gameId, name, a, ms, teacherId); setRes({ ...r, ms }); })} />;
  const link = typeof location !== "undefined" ? `${location.origin}/duel/${res.id}` : "";
  const wa = `https://wa.me/?text=${encodeURIComponent(t("{n} сені «{g}» дуэліне шақырады! {l}", { n: name, g: title, l: link }))}`;
  return (
    <div className="card p-6 sm:p-10 text-center">
      <Trophy className="mx-auto h-12 w-12 text-gold-500" />
      <h2 className="mt-3 text-2xl font-extrabold">{t("Сенің нәтижең: {s} / {m}", { s: res.score, m: res.max })}</h2>
      <p className="muted">{t("Уақыт: {s}", { s: fmtS(res.ms) })}</p>
      <p className="mt-5 font-semibold">{t("Енді досыңа шақыру жібер:")}</p>
      <div className="mx-auto mt-3 flex max-w-xl flex-col gap-2 sm:flex-row">
        <input readOnly value={link} className="input flex-1 text-sm" onFocus={(e) => e.currentTarget.select()} aria-label={t("Дуэль сілтемесі")} />
        <button className="btn-primary btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { /* */ } }}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {t(copied ? "Көшірілді" : "Көшіру")}</button>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-soft btn-sm"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
      </div>
      <p className="mt-4 text-sm muted">{t("Досың ойнап болғанда, нәтижені осы сілтемеден көресіңдер.")}</p>
    </div>
  );
}

export type DuelInfo = { id: string; aName: string; aScore: number; aMs: number; bName: string | null; bScore: number | null; bMs: number | null; max: number };

export function DuelResult({ d }: { d: DuelInfo }) {
  const t = useT();
  const aWin = d.aScore > (d.bScore ?? 0) || (d.aScore === d.bScore && d.aMs < (d.bMs ?? 0));
  const tie = d.aScore === d.bScore && d.aMs === d.bMs;
  const Side = ({ n, s, ms, win, c }: { n: string; s: number; ms: number; win: boolean; c: string }) => (
    <div className={`relative flex-1 rounded-3xl bg-gradient-to-b ${c} p-5 text-white ${win ? "ring-4 ring-gold-400 scale-105" : "opacity-90"} transition`}>
      {win && <Trophy className="absolute -top-4 left-1/2 h-8 w-8 -translate-x-1/2 text-gold-400 drop-shadow" />}
      <div className="truncate text-lg font-bold">{n}</div>
      <div className="mt-1 text-5xl font-black">{s}<span className="text-xl opacity-70">/{d.max}</span></div>
      <div className="mt-1 text-sm opacity-85"><Timer className="mr-1 inline h-4 w-4" />{fmtS(ms)}</div>
    </div>
  );
  return (
    <div className="card p-6 sm:p-10 text-center">
      <h2 className="text-2xl sm:text-3xl font-extrabold">{tie ? t("Тең түсті! 🤝") : t("{n} жеңді! 🏆", { n: aWin ? d.aName : d.bName ?? "" })}</h2>
      <div className="mt-8 flex items-stretch gap-3 sm:gap-6">
        <Side n={d.aName} s={d.aScore} ms={d.aMs} win={!tie && aWin} c="from-sky-400 to-sky-600" />
        <div className="grid place-items-center text-2xl font-black text-rose-500">VS</div>
        <Side n={d.bName ?? ""} s={d.bScore ?? 0} ms={d.bMs ?? 0} win={!tie && !aWin} c="from-rose-400 to-lilac-600" />
      </div>
      <p className="mt-6 text-sm muted">{t("Балл тең болса, жылдам жауап берген жеңеді.")}</p>
    </div>
  );
}

/** Шақыру сілтемесі арқылы келген екінші ойыншы. */
export function DuelAccept({ gameId, questions, duel }: { gameId: string; questions: Q[]; duel: DuelInfo }) {
  const t = useT();
  const [name, setName] = useState<string | null>(null);
  const [d, setD] = useState<DuelInfo>(duel);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  if (d.bName) return <DuelResult d={d} />;
  if (!name) return <NameForm title={t("{n} сені дуэльге шақырды!", { n: d.aName })} note={t("{n} сұраққа жауап бер. Досыңның нәтижесін ойын соңында көресің.", { n: questions.length })} cta={t("Дуэльді қабылдау")} onGo={setName} />;
  if (pending) return <div className="card p-16 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-sky-500" /></div>;
  if (err) return <div className="card p-10 text-center text-rose-600">{t(err)}</div>;
  return <Run gameId={gameId} questions={questions} color="from-rose-500 to-lilac-500" onDone={(a, ms) => start(async () => {
    const r = await answerDuel(d.id, name, a, ms);
    if (!("ok" in r) || !r.b) { setErr(("error" in r && r.error) || "Қате"); return; }
    setD({ ...d, bName: r.b.name, bScore: r.b.score, bMs: r.b.ms });
  })} />;
}
