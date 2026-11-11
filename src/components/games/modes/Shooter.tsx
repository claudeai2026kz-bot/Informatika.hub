"use client";
import { useEffect, useState, useTransition } from "react";
import { Heart, Star } from "lucide-react";
import { checkAnswer } from "@/app/actions/games";
import { AsteroidSprite, RocketSprite, SpaceBackdrop } from "../art/sprites";
import { useT } from "@/lib/i18n/client";

type Q = { id: string; prompt: string; points: number; data: Record<string, unknown> };
const SLOTS = [{ x: 18, y: 22 }, { x: 60, y: 12 }, { x: 38, y: 40 }, { x: 82, y: 36 }];
const HUES = [265, 200, 330, 150];

export default function Shooter({ gameId, questions, onDone }: { gameId: string; questions: Q[]; onDone: (a: Record<string, unknown>) => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);
  const [aim, setAim] = useState<number | null>(null);
  const [fb, setFb] = useState<{ chosen: number; correct: boolean; answer: number } | null>(null);
  const [laser, setLaser] = useState(0);
  const [pending, start] = useTransition();
  const q = questions[i];
  const opts = ((q?.data.options as string[]) ?? []).slice(0, 4);
  const rocketX = aim === null ? 50 : SLOTS[aim].x;

  useEffect(() => { setAim(null); setFb(null); }, [i]);

  function shoot(k: number) {
    if (fb || pending) return;
    setAim(k);
    setTimeout(() => setLaser((n) => n + 1), 280);
    start(async () => {
      const r = await checkAnswer(gameId, q.id, k);
      await new Promise((res) => setTimeout(res, 450));
      const a = { ...answers, [q.id]: k };
      setAnswers(a);
      setFb({ chosen: k, correct: r.correct, answer: r.answer as number });
      if (r.correct) setScore((s) => s + q.points);
      const h = r.correct ? hearts : hearts - 1;
      setHearts(h);
      setTimeout(() => { if (h <= 0 || i + 1 >= questions.length) onDone(a); else setI(i + 1); }, 1500);
    });
  }

  return (
    <div className="relative h-[560px] sm:h-[600px] overflow-hidden rounded-3xl text-white shadow-[0_30px_60px_-30px_#1b0b4d] select-none">
      <SpaceBackdrop />
      <div className="relative flex items-center justify-between gap-2 p-4 text-sm font-bold">
        <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">{t("Сұрақ")} {i + 1} / {questions.length}</span>
        <span className="flex items-center gap-3 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
          <span className="inline-flex items-center gap-1 text-gold-400"><Star className="h-4 w-4 fill-current" /> {score}</span>
          <span className="inline-flex gap-0.5" aria-label={t("{n} жүрек", { n: hearts })}>{[0, 1, 2].map((h) => <Heart key={h} className={`h-4 w-4 ${h < hearts ? "fill-rose-500 text-rose-500" : "text-white/30"}`} />)}</span>
        </span>
      </div>
      <div className="relative mx-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-center text-base sm:text-lg font-bold backdrop-blur">{q.prompt}</div>

      {opts.map((o, k) => {
        const s = SLOTS[k];
        const hit = fb && fb.chosen === k && fb.correct;
        const miss = fb && fb.chosen === k && !fb.correct;
        const right = fb && !fb.correct && fb.answer === k;
        return (
          <button key={`${i}-${k}`} onClick={() => shoot(k)} disabled={!!fb || pending}
            className="group absolute -translate-x-1/2 -translate-y-1/2 g-pop" style={{ left: `${s.x}%`, top: `${s.y + 14}%`, animationDelay: `${k * 90}ms` }}>
            <span className={`relative block h-24 w-24 sm:h-32 sm:w-32 ${hit ? "g-boom" : miss ? "g-shake" : "g-float"}`} style={{ animationDelay: hit || miss ? undefined : `${k * 0.6}s` }}>
              <AsteroidSprite uid={`as${i}${k}`} hue={HUES[k]} shape={k} className={`h-full w-full transition group-hover:scale-105 ${right ? "drop-shadow-[0_0_18px_#34d399]" : "drop-shadow-[0_8px_16px_#0008]"}`} />
              <span className={`absolute inset-0 grid place-items-center px-3 text-center text-xs sm:text-sm font-extrabold leading-tight [text-shadow:0_2px_4px_#000] ${right ? "text-emerald-300" : ""}`}>{o}</span>
            </span>
            {aim === k && !fb && <span className="absolute left-1/2 top-1/2 h-28 w-28 sm:h-36 sm:w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-300/80 animate-ping" aria-hidden />}
          </button>
        );
      })}

      {laser > 0 && aim !== null && (
        <span key={laser} className="pointer-events-none absolute bottom-[110px] w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-t from-emerald-200 via-emerald-400 to-transparent shadow-[0_0_14px_#34d399] g-laser"
          style={{ left: `${rocketX}%`, height: `calc(${100 - SLOTS[aim].y - 14}% - 110px)` }} aria-hidden />
      )}
      <div className={`absolute bottom-4 h-[110px] w-[80px] -translate-x-1/2 transition-[left] duration-300 ease-out ${fb && !fb.correct ? "g-shake" : ""}`} style={{ left: `${rocketX}%` }}>
        <RocketSprite uid="rk" className="h-full w-full drop-shadow-[0_0_20px_#8b6cf088]" />
      </div>
      {fb && (
        <div className={`absolute left-1/2 top-[44%] -translate-x-1/2 g-pop rounded-2xl px-5 py-2 text-lg font-extrabold shadow-xl ${fb.correct ? "bg-emerald-500" : "bg-rose-500"}`} role="status">
          {fb.correct ? t("Дәл тидің! +{n}", { n: q.points }) : t("Қате! −1 жүрек")}
        </div>
      )}
    </div>
  );
}
