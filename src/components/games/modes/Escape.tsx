"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Lightbulb, X, KeyRound, Timer, ArrowRight, Check, Eye } from "lucide-react";
import { checkAnswer } from "@/app/actions/games";
import { RoomObject, RoomScene, ROOM_SLOTS, ROOM_THEMES } from "../art/room";
import { useT } from "@/lib/i18n/client";

type Q = { id: string; prompt: string; points: number; data: Record<string, unknown> };

/** Тапсырмаларды бөлмелерге бөлу: әр бөлмеде 3-тен (соңғысында 1–4). */
function rooms(n: number) {
  const count = Math.max(1, Math.ceil(n / 3));
  const out: number[][] = [];
  let k = 0;
  for (let r = 0; r < count; r++) { const size = Math.ceil((n - k) / (count - r)); out.push(Array.from({ length: size }, (_, j) => k + j)); k += size; }
  return out;
}

export default function Escape({ gameId, questions, onDone }: { gameId: string; questions: Q[]; onDone: (a: Record<string, unknown>) => void }) {
  const t = useT();
  const plan = rooms(questions.length);
  const [room, setRoom] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [solved, setSolved] = useState<Record<string, "ok" | "shown">>({});
  const [first, setFirst] = useState<Record<string, unknown>>({});
  const [tries, setTries] = useState<Record<string, number>>({});
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [hint, setHint] = useState(false);
  const [sec, setSec] = useState(0);
  const [pending, start] = useTransition();
  const inp = useRef<HTMLInputElement>(null);
  const tasks = plan[room];
  const roomDone = tasks.every((k) => solved[questions[k].id]);
  const q = open !== null ? questions[open] : null;
  const opts = q?.data.options as string[] | undefined;

  useEffect(() => { const id = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { setText(""); setMsg(null); setHint(false); setTimeout(() => inp.current?.focus(), 50); }, [open]);

  function submit(v: unknown) {
    if (!q || pending) return;
    start(async () => {
      const r = await checkAnswer(gameId, q.id, v);
      if (!(q.id in first)) setFirst((f) => ({ ...f, [q.id]: v }));
      setTries((s) => ({ ...s, [q.id]: (s[q.id] ?? 0) + 1 }));
      if (r.correct) { setSolved((s) => ({ ...s, [q.id]: s[q.id] ?? "ok" })); setMsg({ ok: true, text: t("Дұрыс! Кілттің бір бөлігі табылды 🔑") }); setTimeout(() => setOpen(null), 900); }
      else setMsg({ ok: false, text: t("Қате. Қайта ойланып көр 🤔") });
    });
  }
  function reveal() {
    if (!q) return;
    start(async () => {
      const r = await checkAnswer(gameId, q.id, first[q.id] ?? "", true);
      const a = r.answer;
      const shown = opts && typeof a === "number" ? opts[a] : Array.isArray(a) ? String(a[0]) : String(a ?? "");
      setSolved((s) => ({ ...s, [q.id]: "shown" }));
      setMsg({ ok: true, text: t("Дұрыс жауап: {a}", { a: shown }) });
    });
  }
  function nextRoom() {
    if (room + 1 < plan.length) { setRoom(room + 1); return; }
    onDone(Object.fromEntries(questions.map((x) => [x.id, first[x.id] ?? null])));
  }
  const mm = String(Math.floor(sec / 60)).padStart(2, "0"), ss = String(sec % 60).padStart(2, "0");
  const keys = questions.filter((x) => solved[x.id]).length;

  return (
    <div className="relative aspect-[5/3] w-full overflow-hidden rounded-3xl bg-[#140c2c] text-white shadow-[0_30px_60px_-30px_#1b0b4d]">
      <RoomScene theme={room % ROOM_THEMES.length} open={roomDone} uid={`rm${room}`} />
      <div className="absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 text-sm font-bold">
        <span className="rounded-full bg-black/40 px-3 py-1 backdrop-blur">{t("Бөлме {n} / {m}", { n: room + 1, m: plan.length })} · {t(ROOM_THEMES[room % ROOM_THEMES.length].name)}</span>
        <span className="flex items-center gap-3 rounded-full bg-black/40 px-3 py-1 backdrop-blur">
          <span className="inline-flex items-center gap-1"><Timer className="h-4 w-4" />{mm}:{ss}</span>
          <span className="inline-flex items-center gap-1 text-gold-400"><KeyRound className="h-4 w-4" />{keys} / {questions.length}</span>
        </span>
      </div>

      {tasks.map((k, j) => {
        const s = ROOM_SLOTS[j], x = questions[k], st = solved[x.id];
        return (
          <button key={x.id} onClick={() => !st && setOpen(k)} disabled={!!st}
            className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%` }}
            aria-label={t("{n}-жұмбақ", { n: k + 1 })}>
            <span className={`block aspect-[4/3] transition ${st ? "opacity-60 saturate-50" : "g-float group-hover:scale-105 drop-shadow-[0_0_16px_rgba(167,139,250,.9)]"}`} style={{ animationDelay: `${j * 0.7}s` }}>
              <RoomObject kind={j} uid={`ob${room}${j}`} />
            </span>
            <span className={`absolute -top-2 left-1/2 -translate-x-1/2 grid h-7 w-7 place-items-center rounded-full text-xs font-black shadow-lg ${st ? "bg-emerald-500" : "bg-gold-400 text-ink animate-bounce"}`}>{st ? <Check className="h-4 w-4" /> : k + 1}</span>
          </button>
        );
      })}

      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
        {roomDone
          ? <button onClick={nextRoom} className="g-pop rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-5 py-3 font-extrabold shadow-[0_5px_0_#047857]">{room + 1 < plan.length ? <>{t("Есік ашылды! Келесі бөлме")} <ArrowRight className="inline h-4 w-4" /></> : t("Бөлмеден шықтың! Нәтиже")}</button>
          : <span className="rounded-2xl bg-black/50 px-4 py-2 text-sm backdrop-blur">{t("Есікті ашу үшін барлық жұмбақты шеш")}</span>}
      </div>

      {q && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3 backdrop-blur-sm text-white" role="dialog" aria-modal="true" aria-label={t("Жұмбақ")}>
          <div className="g-pop w-full max-w-lg rounded-3xl border border-white/15 bg-gradient-to-b from-[#2b1d5c] to-[#1a1238] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <span className="chip bg-amber-300/20 text-amber-200">{t("{n}-жұмбақ", { n: (open ?? 0) + 1 })} · {t("{n} балл", { n: q.points })}</span>
              <button onClick={() => setOpen(null)} className="rounded-full p-1 hover:bg-white/10" aria-label={t("Жабу")}><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 text-lg font-bold leading-snug whitespace-pre-line">{q.prompt}</p>
            {opts ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {opts.map((o, k) => <button key={k} disabled={pending || solved[q.id] === "shown"} onClick={() => submit(k)} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left font-semibold hover:bg-white/20">{o}</button>)}
              </div>
            ) : (
              <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) submit(text); }}>
                <input ref={inp} value={text} onChange={(e) => setText(e.target.value)} className="input !bg-white/95 !text-ink" placeholder={t("Кодты не жауапты жаз")} maxLength={100} disabled={solved[q.id] === "shown"} />
                <button className="btn-primary" disabled={pending || !text.trim() || solved[q.id] === "shown"}>{t("Тексеру")}</button>
              </form>
            )}
            {msg && <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${msg.ok ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200 g-shake"}`} role="status">{msg.text}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {typeof q.data.hint === "string" && (hint ? <p className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm"><Lightbulb className="mr-1 inline h-4 w-4 text-gold-400" />{q.data.hint}</p>
                : <button className="btn-sm rounded-xl bg-white/10 px-3 font-semibold hover:bg-white/20" onClick={() => setHint(true)}><Lightbulb className="mr-1 inline h-4 w-4 text-gold-400" />{t("Кеңес")}</button>)}
              {(tries[q.id] ?? 0) >= 2 && solved[q.id] !== "shown" && <button className="btn-sm rounded-xl bg-white/10 px-3 font-semibold hover:bg-white/20" onClick={reveal}><Eye className="mr-1 inline h-4 w-4" />{t("Жауабын көру (балл берілмейді)")}</button>}
              {solved[q.id] === "shown" && <button className="btn-primary btn-sm" onClick={() => setOpen(null)}>{t("Жалғастыру")}</button>}
            </div>
            <p className="mt-3 text-xs text-white/60">{t("Балл тек бірінші жауап дұрыс болса беріледі.")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
