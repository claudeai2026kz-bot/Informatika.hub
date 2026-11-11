"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Play, RotateCcw, Check, X, Timer, ArrowRight, Trophy, Loader2 } from "lucide-react";
import { checkAnswer, submitGame } from "@/app/actions/games";
import Robot from "../Robot";
import { Climb, Ordering, Memory } from "./NewModes";
import { useT } from "@/lib/i18n/client";

const RULES: Record<string, string> = {
  TRUEFALSE: "Әр тұжырымды оқып, «Дұрыс» немесе «Бұрыс» деп жауап бер.",
  CLIMB: "Әр дұрыс жауап сені шыңға қарай бір биіктікке көтереді. Бір қате жауап — өрмелеу тоқтайды. Бір рет көмек алуға болады.",
  ORDERING: "Қадамдарды немесе код жолдарын дұрыс ретке қой.",
  MEMORY: "Карточкаларды екіден аударып, ұғым мен анықтаманың жұбын тап. Әр 3 қате 1 балл кемітеді.",
};

type Q = { id: string; prompt: string; points: number; data: Record<string, unknown> };
type Layout = { rows: number; cols: number; words: { id: string; n: number; row: number; col: number; dir: "across" | "down"; len: number }[] } | null;
type Result = Awaited<ReturnType<typeof submitGame>>;

export default function GamePlayer({ gameId, type, title, questions, timeLimit, layout, loggedIn, student }: {
  gameId: string; type: string; title: string; questions: Q[]; timeLimit: number | null; layout: Layout; loggedIn: boolean;
  /** Оқушы мұғалімнің сілтемесімен ойнаса — нәтиже мұғалімге жіберіледі */
  student?: { teacherId: string; name: string; className?: string };
}) {
  const t = useT();
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const [round, setRound] = useState(0);

  function restart() { setAnswers({}); setResult(null); setRound((r) => r + 1); setPhase("play"); }
  function finish(final: Record<string, unknown>) {
    start(async () => { const r = await submitGame(gameId, final, student); setResult(r); setPhase("done"); });
  }

  if (questions.length === 0) return <div className="card p-10 text-center muted">{t("Бұл ойынға әлі сұрақ қосылмаған.")}</div>;

  if (phase === "intro")
    return (
      <div className="card p-8 sm:p-12 text-center">
        <div className="flex justify-center"><Robot size={150} wave /></div>
        <h2 className="mt-4 text-2xl font-bold">{t("Дайынсыз ба?")}</h2>
        <p className="mt-2 muted">{type === "MATCHING" || type === "MEMORY" ? t("{n} жұп", { n: ((questions[0]?.data.left as unknown[]) ?? (questions[0]?.data.cards as unknown[]) ?? []).length / (type === "MEMORY" ? 2 : 1) }) : t("{n} сұрақ", { n: questions.length })}{type === "RAPID" ? ` · ${t("әр сұраққа {s} секунд", { s: timeLimit ?? 10 })}` : ""}. {t("Ұпай автоматты түрде есептеледі.")}</p>
        {RULES[type] && <p className="mt-3 mx-auto max-w-md rounded-xl bg-sky-50 px-4 py-2.5 text-sm text-sky-800">{t(RULES[type])}</p>}
        {!loggedIn && !student && <p className="mt-2 text-sm text-amber-700">{t("Нәтижеңіз сақталуы үшін жүйеге кіріңіз.")}</p>}
        <button onClick={() => setPhase("play")} className="btn-primary h-12 px-8 mt-6 text-base"><Play className="h-5 w-5" /> {t("Ойынды бастау")}</button>
      </div>
    );

  if (phase === "done" && result) return <ResultView result={result} questions={questions} type={type} onRestart={restart} />;

  return (
    <div key={round} className="relative">
      {pending && <div className="absolute inset-0 z-10 grid place-items-center rounded-xl2 bg-white/70"><Loader2 className="h-8 w-8 animate-spin text-sky-500" /></div>}
      {type === "CLIMB" && <Climb gameId={gameId} questions={questions} onDone={(a) => { setAnswers(a); finish(a); }} />}
      {type === "ORDERING" && <Ordering gameId={gameId} questions={questions} onDone={(a) => { setAnswers(a); finish(a); }} />}
      {type === "MEMORY" && <Memory q={questions[0]} onDone={(v) => finish({ [questions[0].id]: v })} />}
      {(type === "QUIZ" || type === "RAPID" || type === "TRUEFALSE" || type === "LOGIC" || type === "CODING") && (
        <Stepper gameId={gameId} type={type} questions={questions} timeLimit={timeLimit ?? 10}
          onDone={(a) => { setAnswers(a); finish(a); }} />
      )}
      {type === "MATCHING" && <Matching q={questions[0]} onDone={(v) => finish({ [questions[0].id]: v })} />}
      {type === "CROSSWORD" && layout && <Crossword layout={layout} questions={questions} onDone={(a) => finish(a)} />}
      <span className="sr-only">{title} {Object.keys(answers).length}</span>
    </div>
  );
}

/* ---------- Тест / Жылдам сұрақтар / Логика / Программалау ---------- */
function Stepper({ gameId, type, questions, timeLimit, onDone }: { gameId: string; type: string; questions: Q[]; timeLimit: number; onDone: (a: Record<string, unknown>) => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: unknown; explanation?: string | null; chosen: unknown } | null>(null);
  const [text, setText] = useState("");
  const [left, setLeft] = useState(timeLimit);
  const [score, setScore] = useState(0);
  const [pending, start] = useTransition();
  const q = questions[i];
  const options = (q.data.options as string[]) ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLeft(timeLimit); setText(""); inputRef.current?.focus(); }, [i, timeLimit]);
  useEffect(() => {
    if (type !== "RAPID" || feedback) return;
    if (left <= 0) { answer(-1); return; }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, type, feedback]);

  function answer(v: unknown) {
    if (feedback || pending) return;
    start(async () => {
      const r = await checkAnswer(gameId, q.id, v);
      setAnswers((a) => ({ ...a, [q.id]: v }));
      if (r.correct) setScore((s) => s + q.points);
      setFeedback({ ...r, chosen: v });
    });
  }
  function next() {
    const a = answers;
    setFeedback(null);
    if (i + 1 < questions.length) setI(i + 1); else onDone(a);
  }

  const isChoice = type === "QUIZ" || type === "RAPID" || type === "TRUEFALSE";
  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{t("Сұрақ")} {i + 1} / {questions.length}</span>
        <span className="chip bg-gold-100 text-gold-500"><Trophy className="h-3.5 w-3.5" /> {t("{n} ұпай", { n: score })}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-sky-100 overflow-hidden"><div className="h-full bg-gradient-to-r from-sky-400 to-lilac-500 transition-all duration-500" style={{ width: `${(i / questions.length) * 100}%` }} /></div>
      {type === "RAPID" && (
        <div className={`mt-4 flex items-center gap-2 font-bold ${left <= 3 ? "text-rose-500" : "text-sky-600"}`} aria-live="polite">
          <Timer className="h-5 w-5" /> {Math.max(0, left)} {t("с")}
          <div className="flex-1 h-1.5 rounded-full bg-sky-100"><div className={`h-full rounded-full transition-all duration-1000 ease-linear ${left <= 3 ? "bg-rose-400" : "bg-sky-400"}`} style={{ width: `${(Math.max(0, left) / timeLimit) * 100}%` }} /></div>
        </div>
      )}
      <h2 className="mt-6 text-xl sm:text-2xl font-bold">{q.prompt}</h2>
      {typeof q.data.code === "string" && (
        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-sm text-sky-100"><code>{q.data.code}</code></pre>
      )}

      {isChoice ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {options.map((o, k) => {
            const isRight = feedback && feedback.answer === k;
            const isWrongPick = feedback && feedback.chosen === k && !feedback.correct;
            return (
              <button key={k} onClick={() => answer(k)} disabled={!!feedback || pending}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left font-medium transition active:scale-[.98] ${isRight ? "border-emerald-400 bg-emerald-50" : isWrongPick ? "border-rose-400 bg-rose-50" : "border-sky-100 bg-white hover:border-sky-400 hover:bg-sky-50"}`}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-100 text-sm font-bold text-sky-600">{"ABCDEF"[k]}</span>
                {o}
                {isRight && <Check className="ml-auto h-5 w-5 text-emerald-500" />}
                {isWrongPick && <X className="ml-auto h-5 w-5 text-rose-500" />}
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) answer(text); }} className="mt-6 flex gap-2">
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} disabled={!!feedback} className="input" placeholder={t("Жауабыңызды жазыңыз")} aria-label={t("Жауап")} maxLength={200} />
          <button className="btn-primary" disabled={!!feedback || !text.trim() || pending}>{t("Тексеру")}</button>
        </form>
      )}

      {feedback && (
        <div className={`mt-6 rounded-xl p-4 animate-fadeUp ${feedback.correct ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`} role="status">
          <div className="font-bold">{t(feedback.correct ? "Дұрыс! 🎉" : feedback.chosen === -1 ? "Уақыт бітті ⏰" : "Қате 😕")}</div>
          {!feedback.correct && !isChoice && <div className="text-sm mt-1">{t("Дұрыс жауап:")} <b>{Array.isArray(feedback.answer) ? String(feedback.answer[0]) : String(feedback.answer)}</b></div>}
          {feedback.explanation && <div className="text-sm mt-1">{feedback.explanation}</div>}
          <button onClick={next} className="btn-primary btn-sm mt-3">{i + 1 < questions.length ? <>{t("Келесі сұрақ")} <ArrowRight className="h-4 w-4" /></> : t("Нәтижені көру")}</button>
        </div>
      )}
    </div>
  );
}

/* ---------- Сәйкестендіру ---------- */
function Matching({ q, onDone }: { q: Q; onDone: (v: number[]) => void }) {
  const t = useT();
  const leftItems = (q.data.left as string[]) ?? [];
  const rightItems = (q.data.right as { i: number; text: string }[]) ?? [];
  const [sel, setSel] = useState<number | null>(null);
  const [pairs, setPairs] = useState<Record<number, number>>({});
  const colors = ["bg-sky-100 border-sky-400", "bg-lilac-100 border-lilac-400", "bg-amber-100 border-amber-400", "bg-emerald-100 border-emerald-400", "bg-rose-100 border-rose-400", "bg-teal-100 border-teal-400", "bg-orange-100 border-orange-400", "bg-indigo-100 border-indigo-400"];
  const usedRight = new Map(Object.entries(pairs).map(([l, r]) => [r, Number(l)]));
  const complete = Object.keys(pairs).length === leftItems.length;

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-xl font-bold">{q.prompt}</h2>
      <p className="mt-1 text-sm muted">{t("Алдымен сол жақтағы ұғымды, содан кейін оң жақтағы сәйкес анықтаманы басыңыз.")}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6">
        <ul className="space-y-2.5">
          {leftItems.map((t, l) => (
            <li key={l}>
              <button onClick={() => { setSel(l); if (pairs[l] !== undefined) { const p = { ...pairs }; delete p[l]; setPairs(p); } }}
                className={`w-full rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition ${pairs[l] !== undefined ? colors[l % colors.length] : sel === l ? "border-sky-500 bg-sky-50 ring-4 ring-sky-100" : "border-sky-100 bg-white hover:border-sky-300"}`}>{t}</button>
            </li>
          ))}
        </ul>
        <ul className="space-y-2.5">
          {rightItems.map((r) => {
            const owner = usedRight.get(r.i);
            return (
              <li key={r.i}>
                <button disabled={sel === null && owner === undefined}
                  onClick={() => {
                    if (sel === null) return;
                    const p = { ...pairs };
                    if (owner !== undefined) delete p[owner];
                    p[sel] = r.i;
                    setPairs(p);
                    setSel(null);
                  }}
                  className={`w-full rounded-xl border-2 px-3 py-3 text-left text-sm transition ${owner !== undefined ? colors[owner % colors.length] : "border-sky-100 bg-white hover:border-sky-300"} disabled:opacity-70`}>{r.text}</button>
              </li>
            );
          })}
        </ul>
      </div>
      <button className="btn-primary mt-6" disabled={!complete} onClick={() => onDone(leftItems.map((_, l) => pairs[l]))}>{t("Тексеру")}</button>
    </div>
  );
}

/* ---------- Сөзжұмбақ ---------- */
function Crossword({ layout, questions, onDone }: { layout: NonNullable<Layout>; questions: Q[]; onDone: (a: Record<string, string>) => void }) {
  const t = useT();
  const cellKey = (r: number, c: number) => `${r}:${c}`;
  const cells = useMemo(() => {
    const m = new Map<string, { n?: number }>();
    for (const w of layout.words)
      for (let k = 0; k < w.len; k++) {
        const r = w.dir === "down" ? w.row + k : w.row, c = w.dir === "across" ? w.col + k : w.col;
        const cur = m.get(cellKey(r, c)) ?? {};
        if (k === 0) cur.n = w.n;
        m.set(cellKey(r, c), cur);
      }
    return m;
  }, [layout]);
  const [vals, setVals] = useState<Record<string, string>>({});
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const [dir, setDir] = useState<"across" | "down">("across");

  function move(r: number, c: number, d = 1) {
    const nr = dir === "down" ? r + d : r, nc = dir === "across" ? c + d : c;
    refs.current[cellKey(nr, nc)]?.focus();
  }
  const filled = layout.words.every((w) => Array.from({ length: w.len }).every((_, k) => vals[cellKey(w.dir === "down" ? w.row + k : w.row, w.dir === "across" ? w.col + k : w.col)]));

  return (
    <div className="card p-6 sm:p-8 grid gap-8 lg:grid-cols-[auto_1fr]">
      <div className="overflow-x-auto">
        <div className="grid gap-1 w-max" style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 2.6rem))` }}>
          {Array.from({ length: layout.rows * layout.cols }).map((_, idx) => {
            const r = Math.floor(idx / layout.cols), c = idx % layout.cols;
            const cell = cells.get(cellKey(r, c));
            if (!cell) return <div key={idx} className="h-10 w-10" />;
            return (
              <div key={idx} className="relative h-10 w-10">
                {cell.n && <span className="absolute left-0.5 top-0 text-[9px] font-bold text-sky-600">{cell.n}</span>}
                <input
                  ref={(el) => { refs.current[cellKey(r, c)] = el; }}
                  value={vals[cellKey(r, c)] ?? ""}
                  maxLength={1}
                  aria-label={t("{r}-жол, {c}-баған", { r: r + 1, c: c + 1 })}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !vals[cellKey(r, c)]) move(r, c, -1);
                    if (e.key === "ArrowRight") { setDir("across"); refs.current[cellKey(r, c + 1)]?.focus(); }
                    if (e.key === "ArrowLeft") refs.current[cellKey(r, c - 1)]?.focus();
                    if (e.key === "ArrowDown") { setDir("down"); refs.current[cellKey(r + 1, c)]?.focus(); }
                    if (e.key === "ArrowUp") refs.current[cellKey(r - 1, c)]?.focus();
                  }}
                  onChange={(e) => {
                    const v = e.target.value.slice(-1).toUpperCase();
                    setVals((s) => ({ ...s, [cellKey(r, c)]: v }));
                    if (v) move(r, c);
                  }}
                  className="h-10 w-10 rounded-lg border-2 border-sky-200 bg-white text-center text-lg font-bold uppercase text-ink focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="font-bold">{t("Сұрақтар")}</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {layout.words.map((w) => (
            <li key={w.id}>
              <button type="button" className="text-left hover:text-sky-600" onClick={() => { setDir(w.dir); refs.current[cellKey(w.row, w.col)]?.focus(); }}>
                <b>{w.n}.</b> {questions.find((q) => q.id === w.id)?.prompt} <span className="muted">({t(w.dir === "across" ? "көлденең" : "тігінен")}, {t("{n} әріп", { n: w.len })})</span>
              </button>
            </li>
          ))}
        </ol>
        <button className="btn-primary mt-6" disabled={!filled}
          onClick={() => onDone(Object.fromEntries(layout.words.map((w) => [w.id, Array.from({ length: w.len }, (_, k) => vals[cellKey(w.dir === "down" ? w.row + k : w.row, w.dir === "across" ? w.col + k : w.col)] ?? "").join("")])))}>
          {t("Тексеру")}
        </button>
      </div>
    </div>
  );
}

/* ---------- Нәтиже ---------- */
function ResultView({ result, questions, type, onRestart }: { result: Result; questions: Q[]; type: string; onRestart: () => void }) {
  const t = useT();
  const pct = result.max ? Math.round((result.score / result.max) * 100) : 0;
  const msg = t(pct >= 90 ? "Керемет нәтиже! 🏆" : pct >= 60 ? "Жақсы! Тағы аздап қалды 💪" : "Қайта байқап көріңіз, сіз міндетті түрде жетесіз! 🙂");
  return (
    <div className="card p-8 sm:p-10">
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div className="relative mx-auto grid h-40 w-40 place-items-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
            <circle cx="60" cy="60" r="52" stroke="#EAF5FF" strokeWidth="12" fill="none" />
            <circle cx="60" cy="60" r="52" stroke="url(#rg)" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 327} 327`} style={{ transition: "stroke-dasharray 1s ease" }} />
            <defs><linearGradient id="rg"><stop offset="0" stopColor="#67B7F7" /><stop offset="1" stopColor="#A78BFA" /></linearGradient></defs>
          </svg>
          <div className="text-center"><div className="text-4xl font-extrabold">{pct}%</div><div className="text-xs muted">{result.score} / {result.max}</div></div>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold">{msg}</h2>
          <p className="mt-1 muted">{result.sent ? t("Нәтижең мұғаліміңе жіберілді ✅") : result.saved ? t("Нәтиже сақталды. Ең жақсы нәтижеңіз: {n} ұпай.", { n: result.best ?? 0 }) : t("Нәтижені сақтау үшін жүйеге кіріңіз.")}</p>
          <div className="mt-5 flex flex-wrap gap-2 justify-center sm:justify-start">
            <button onClick={onRestart} className="btn-primary"><RotateCcw className="h-4 w-4" /> {t("Қайта ойнау")}</button>
            {!result.sent && <Link href="/games" className="btn-ghost">{t("Басқа ойындар")}</Link>}
          </div>
        </div>
      </div>
      {type !== "MATCHING" && type !== "MEMORY" && (
        <ul className="mt-8 space-y-2">
          {questions.map((q, k) => {
            const d = result.details.find((x) => x.id === q.id);
            const sol = result.solutions.find((s) => s.id === q.id);
            const opts = q.data.options as string[] | undefined;
            const its = q.data.items as { i: number; text: string }[] | undefined;
            const ans = its ? [...its].sort((a, b) => a.i - b.i).map((x) => x.text).join(" → ") : opts && typeof sol?.answer === "number" ? opts[sol.answer] : Array.isArray(sol?.answer) ? String(sol?.answer[0]) : String(sol?.answer ?? "");
            return (
              <li key={q.id} className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${d?.correct ? "bg-emerald-50" : "bg-rose-50"}`}>
                {d?.correct ? <Check className="h-5 w-5 text-emerald-500 shrink-0" /> : <X className="h-5 w-5 text-rose-500 shrink-0" />}
                <div><b>{k + 1}.</b> {q.prompt} <span className="muted">· {t("Дұрыс жауап:")} <b className="text-ink">{ans}</b></span></div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
