"use client";
/** Жаңа ойын түрлері: «Шыңға шық», «Ретімен қой», «Жұбын тап». */
import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowUp, ArrowDown, ArrowRight, Check, X, Flag, Mountain, Sparkles, GripVertical, Trophy } from "lucide-react";
import { checkAnswer, climbHint } from "@/app/actions/games";
import { useT } from "@/lib/i18n/client";

type Q = { id: string; prompt: string; points: number; data: Record<string, unknown> };
type FB = { correct: boolean; answer: unknown; explanation?: string | null; chosen: unknown };

/* ---------- Шыңға шық: әр дұрыс жауап — тағы бір биіктік, бір қате — ойын бітеді ---------- */
export function Climb({ gameId, questions, onDone }: { gameId: string; questions: Q[]; onDone: (a: Record<string, unknown>) => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [fb, setFb] = useState<FB | null>(null);
  const [hidden, setHidden] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [pending, start] = useTransition();
  const q = questions[i];
  const options = (q.data.options as string[]) ?? [];
  const n = questions.length;

  function answer(k: number) {
    if (fb || pending) return;
    start(async () => {
      const r = await checkAnswer(gameId, q.id, k);
      setAnswers((a) => ({ ...a, [q.id]: k }));
      setFb({ ...r, chosen: k });
    });
  }
  function hint() {
    if (hintUsed || fb) return;
    setHintUsed(true);
    start(async () => setHidden(await climbHint(gameId, q.id)));
  }
  function next() {
    const a = answers;
    if (!fb?.correct || i + 1 >= n) { onDone(a); return; }
    setFb(null); setHidden(null); setI(i + 1);
  }
  const level = i + (fb?.correct ? 1 : 0);

  return (
    <div className="card p-6 sm:p-8 grid gap-6 md:grid-cols-[1fr_170px]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold">{t("{n}-биіктік", { n: i + 1 })} / {n}</span>
          <button type="button" onClick={hint} disabled={hintUsed || !!fb || pending} className="btn-soft btn-sm">
            <Sparkles className="h-4 w-4" /> {t(hintUsed ? "Көмек қолданылды" : "Көмек: бір қате жауапты алып тастау")}
          </button>
        </div>
        <h2 className="mt-5 text-xl sm:text-2xl font-bold">{q.prompt}</h2>
        {typeof q.data.code === "string" && <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-sm text-sky-100"><code>{q.data.code}</code></pre>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {options.map((o, k) => {
            if (k === hidden) return <div key={k} className="rounded-xl border-2 border-dashed border-sky-100 px-4 py-3.5 text-sm muted">{t("алынып тасталды")}</div>;
            const isRight = fb && fb.answer === k, isWrong = fb && fb.chosen === k && !fb.correct;
            return (
              <button key={k} onClick={() => answer(k)} disabled={!!fb || pending}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left font-medium transition active:scale-[.98] ${isRight ? "border-emerald-400 bg-emerald-50" : isWrong ? "border-rose-400 bg-rose-50" : "border-sky-100 bg-white hover:border-sky-400 hover:bg-sky-50"}`}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-100 text-sm font-bold text-sky-600">{"ABCDEF"[k]}</span>
                {o}
                {isRight && <Check className="ml-auto h-5 w-5 text-emerald-500" />}
                {isWrong && <X className="ml-auto h-5 w-5 text-rose-500" />}
              </button>
            );
          })}
        </div>
        {fb && (
          <div className={`mt-6 rounded-xl p-4 animate-fadeUp ${fb.correct ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`} role="status">
            <div className="font-bold">{fb.correct ? (i + 1 >= n ? t("Шыңға шықтыңыз! 🏔️") : t("Дұрыс! Тағы бір биіктік ⛰️")) : t("Қате 😕 Өрмелеу осы жерде тоқтады.")}</div>
            {fb.explanation && <div className="text-sm mt-1">{fb.explanation}</div>}
            <button onClick={next} className="btn-primary btn-sm mt-3">{fb.correct && i + 1 < n ? <>{t("Жоғары көтерілу")} <ArrowUp className="h-4 w-4" /></> : t("Нәтижені көру")}</button>
          </div>
        )}
      </div>
      {/* Тау: төменнен жоғары биіктіктер */}
      <ol className="flex md:flex-col-reverse gap-1.5 overflow-x-auto md:overflow-visible" aria-label={t("Биіктік")}>
        {questions.map((_, k) => {
          const done = k < level, cur = k === i && !fb;
          return (
            <li key={k} className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${done ? "bg-emerald-100 text-emerald-700" : cur ? "bg-sky-500 text-white" : "bg-sky-50 text-sky-400"}`}
>
              {k === n - 1 ? <Flag className="h-3.5 w-3.5" /> : <Mountain className="h-3.5 w-3.5" />}
              {(k + 1) * 100} {t("м")}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- Ретімен қой ---------- */
export function Ordering({ gameId, questions, onDone }: { gameId: string; questions: Q[]; onDone: (a: Record<string, unknown>) => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const q = questions[i];
  const items = useMemo(() => (q.data.items as { i: number; text: string }[]) ?? [], [q]);
  const [order, setOrder] = useState(items);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [fb, setFb] = useState<FB | null>(null);
  const [score, setScore] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => { setOrder(items); }, [items]);

  const move = (k: number, d: number) => setOrder((o) => { const j = k + d; if (j < 0 || j >= o.length) return o; const c = [...o]; [c[k], c[j]] = [c[j], c[k]]; return c; });
  function check() {
    const v = order.map((x) => x.i);
    start(async () => {
      const r = await checkAnswer(gameId, q.id, v);
      setAnswers((a) => ({ ...a, [q.id]: v }));
      if (r.correct) setScore((s) => s + q.points);
      setFb({ ...r, chosen: v });
    });
  }
  function next() {
    setFb(null);
    if (i + 1 < questions.length) setI(i + 1); else onDone(answers);
  }
  const correctText = [...items].sort((a, b) => a.i - b.i);

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{t("Сұрақ")} {i + 1} / {questions.length}</span>
        <span className="chip bg-gold-100 text-gold-500"><Trophy className="h-3.5 w-3.5" /> {t("{n} ұпай", { n: score })}</span>
      </div>
      <h2 className="mt-5 text-xl sm:text-2xl font-bold">{q.prompt}</h2>
      <p className="mt-1 text-sm muted">{t("Жолдарды сүйреп немесе көрсеткілермен дұрыс ретке қойыңыз.")}</p>
      <ol className="mt-5 space-y-2">
        {order.map((it, k) => (
          <li key={it.i} draggable={!fb}
            onDragStart={() => setDrag(k)} onDragOver={(e) => { e.preventDefault(); if (drag === null || drag === k) return; setOrder((o) => { const c = [...o]; const [m] = c.splice(drag, 1); c.splice(k, 0, m); return c; }); setDrag(k); }}
            onDragEnd={() => setDrag(null)}
            className={`flex items-center gap-2 rounded-xl border-2 bg-white px-3 py-2.5 ${fb ? (fb.correct ? "border-emerald-300" : "border-rose-200") : drag === k ? "border-sky-400 bg-sky-50" : "border-sky-100"} ${fb ? "" : "cursor-grab"}`}>
            <GripVertical className="h-4 w-4 text-sky-300 shrink-0" />
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sky-100 text-sm font-bold text-sky-600">{k + 1}</span>
            <span className={`flex-1 font-medium whitespace-pre-wrap ${/^\s|[=()[\]:]/.test(it.text) ? "font-mono text-sm" : ""}`}>{it.text}</span>
            {!fb && <>
              <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => move(k, -1)} disabled={k === 0} aria-label={t("Жоғары")}><ArrowUp className="h-4 w-4" /></button>
              <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => move(k, 1)} disabled={k === order.length - 1} aria-label={t("Төмен")}><ArrowDown className="h-4 w-4" /></button>
            </>}
          </li>
        ))}
      </ol>
      {!fb ? (
        <button className="btn-primary mt-5" onClick={check} disabled={pending}>{t("Тексеру")}</button>
      ) : (
        <div className={`mt-6 rounded-xl p-4 animate-fadeUp ${fb.correct ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`} role="status">
          <div className="font-bold">{t(fb.correct ? "Дұрыс! 🎉" : "Қате 😕")}</div>
          {!fb.correct && <div className="text-sm mt-1">{t("Дұрыс реті:")} <b>{correctText.map((x) => x.text).join(" → ")}</b></div>}
          {fb.explanation && <div className="text-sm mt-1">{fb.explanation}</div>}
          <button onClick={next} className="btn-primary btn-sm mt-3">{i + 1 < questions.length ? <>{t("Келесі сұрақ")} <ArrowRight className="h-4 w-4" /></> : t("Нәтижені көру")}</button>
        </div>
      )}
    </div>
  );
}

/* ---------- Жұбын тап: карточкаларды аударып, ұғым мен анықтаманы табу ---------- */
export function Memory({ q, onDone }: { q: Q; onDone: (v: { found: number; mistakes: number }) => void }) {
  const t = useT();
  const cards = (q.data.cards as { p: number; side: string; text: string }[]) ?? [];
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [lock, setLock] = useState(false);
  const pairs = cards.length / 2;

  function flip(k: number) {
    if (lock || open.includes(k) || found.has(cards[k].p)) return;
    const o = [...open, k];
    setOpen(o);
    if (o.length < 2) return;
    const [a, b] = o.map((x) => cards[x]);
    if (a.p === b.p && a.side !== b.side) {
      const f = new Set(found).add(a.p);
      setFound(f); setOpen([]);
      if (f.size === pairs) setTimeout(() => onDone({ found: f.size, mistakes }), 700);
    } else {
      setMistakes((m) => m + 1); setLock(true);
      setTimeout(() => { setOpen([]); setLock(false); }, 1100);
    }
  }

  return (
    <div className="card p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <h2 className="text-xl font-bold">{q.prompt}</h2>
        <div className="flex gap-2">
          <span className="chip bg-emerald-100 text-emerald-700">{t("Табылды: {n} / {m}", { n: found.size, m: pairs })}</span>
          <span className="chip bg-rose-100 text-rose-700">{t("Қате: {n}", { n: mistakes })}</span>
        </div>
      </div>
      <p className="mt-1 text-sm muted">{t("Екі карточканы аударып, ұғым мен оның анықтамасын табыңыз. Әр 3 қате 1 балл кемітеді.")}</p>
      <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {cards.map((c, k) => {
          const shown = open.includes(k) || found.has(c.p);
          const done = found.has(c.p);
          return (
            <button key={k} type="button" onClick={() => flip(k)} aria-label={shown ? c.text : t("Жабық карточка")}
              className={`relative min-h-[88px] rounded-xl border-2 p-2 text-center text-sm font-semibold transition duration-300 ${shown ? "animate-fadeUp" : ""} ${done ? "border-emerald-300 bg-emerald-50 text-emerald-800" : shown ? "border-sky-400 bg-white" : "border-lilac-200 bg-gradient-to-br from-sky-400 to-lilac-500 text-white"}`}>
              {shown ? <span className={c.side === "R" ? "text-xs font-medium leading-snug block" : "block"}>{c.text}</span> : <span className="text-2xl">?</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
