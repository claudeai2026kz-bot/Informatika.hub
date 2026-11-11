"use client";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { RobotSprite } from "../art/sprites";
import { Podium, ScoreCard, TeamSetup, TEAM_COLORS } from "./Board";
import { useT } from "@/lib/i18n/client";

type Q = { id: string; prompt: string; points: number; data: Record<string, unknown> };
const WIN = 4; // арқан осынша қадам жылжыса — жеңіс

/** Арқан тарту: тақтада екі жақ бір сұраққа бір уақытта жауап береді. */
export default function Tug({ questions }: { questions: Q[] }) {
  const t = useT();
  const [teams, setTeams] = useState<string[] | null>(null);
  const [scores, setScores] = useState([0, 0]);
  const [pos, setPos] = useState(0); // −WIN … +WIN (теріс — сол жақ)
  const [i, setI] = useState(0);
  const [locked, setLocked] = useState<[boolean, boolean]>([false, false]);
  const [picked, setPicked] = useState<[number | null, number | null]>([null, null]);
  const [winner, setWinner] = useState<number | null | "none">(null);
  const [ended, setEnded] = useState(false);
  const q = questions[i % questions.length];
  const opts = (q?.data.options as string[]) ?? [];
  const ans = q?.data.answer as number;

  useEffect(() => {
    if (winner === null) return;
    const id = setTimeout(() => {
      if (Math.abs(pos) >= WIN || i + 1 >= questions.length) { setEnded(true); return; }
      setI(i + 1); setLocked([false, false]); setPicked([null, null]); setWinner(null);
    }, 1700);
    return () => clearTimeout(id);
  }, [winner, pos, i, questions.length]);

  if (!teams) return <TeamSetup min={2} max={2} title={t("Арқан тарту")} note={t("Тақтаның сол жағында бір оқушы (не команда), оң жағында екіншісі тұрады. Кім бірінші дұрыс жауап берсе, арқанды өзіне тартады.")} onStart={(n) => setTeams(n)} />;
  if (ended) return <Podium names={teams} scores={scores} onAgain={() => { setScores([0, 0]); setPos(0); setI(0); setLocked([false, false]); setPicked([null, null]); setWinner(null); setEnded(false); }} />;

  function pick(side: 0 | 1, k: number) {
    if (winner !== null || locked[side]) return;
    const np: [number | null, number | null] = [...picked] as never; np[side] = k; setPicked(np);
    if (k === ans) {
      setWinner(side); setPos((p) => p + (side === 0 ? -1 : 1));
      setScores((s) => s.map((x, j) => (j === side ? x + q.points : x)));
    } else {
      const nl: [boolean, boolean] = [...locked] as never; nl[side] = true; setLocked(nl);
      if (nl[0] && nl[1]) setWinner("none");
    }
  }

  const shift = (pos / WIN) * 38; // %
  const Side = ({ side }: { side: 0 | 1 }) => (
    <div className={`grid gap-2 ${opts.length > 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {opts.map((o, k) => {
        const mine = picked[side] === k;
        const show = winner !== null && k === ans;
        return (
          <button key={k} onClick={() => pick(side, k)} disabled={winner !== null || locked[side]}
            className={`min-h-[64px] rounded-2xl border-2 px-3 py-3 text-base sm:text-lg font-bold transition active:scale-95 ${show ? "border-emerald-400 bg-emerald-50 text-emerald-800" : mine ? "border-rose-400 bg-rose-50 text-rose-700" : "border-white bg-white/90 hover:bg-white"} disabled:cursor-not-allowed`}>
            {o}{show && <Check className="ml-1 inline h-5 w-5" />}{mine && !show && <X className="ml-1 inline h-5 w-5" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {teams.map((n, k) => <ScoreCard key={k} k={k} name={n} score={scores[k]} step={q.points} onChange={(d) => setScores((s) => s.map((x, j) => (j === k ? x + d : x)))} />)}
      </div>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#8FD3FF] via-[#CDEFFF] to-[#7CCB6E] shadow-[0_20px_50px_-25px_#1d4f91]">
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-[#6CCB6A] to-[#3E9F55]" aria-hidden />
        <div className="relative px-4 pt-4 text-center">
          <span className="rounded-full bg-white/85 px-3 py-1 text-sm font-bold">{t("Сұрақ")} {i + 1} / {questions.length}</span>
          <h2 className="mx-auto mt-3 max-w-2xl rounded-2xl bg-white/90 px-5 py-3 text-xl sm:text-2xl font-extrabold shadow">{q.prompt}</h2>
        </div>
        <div className="relative mx-auto h-40 sm:h-48 max-w-4xl">
          <div className="absolute left-1/2 top-[18%] h-[70%] w-1 -translate-x-1/2 bg-white/80" aria-hidden />
          <div className="absolute inset-0 transition-transform duration-700 ease-out" style={{ transform: `translateX(${shift}%)` }}>
            <div className="absolute left-[12%] right-[12%] top-[58%] h-3 rounded-full bg-[repeating-linear-gradient(60deg,#C08B4E_0_10px,#9A6A34_10px_20px)] shadow" />
            <div className="absolute left-1/2 top-[48%] h-9 w-3 -translate-x-1/2 rounded bg-rose-500 shadow" aria-hidden />
            {[0, 1].map((k) => <RobotSprite key={`l${k}`} uid={`tl${k}`} className={`absolute top-[18%] h-24 w-24 sm:h-28 sm:w-28 ${winner === 1 ? "g-shake" : ""}`} style={{ left: `${3 + k * 10}%`, transform: "rotate(-10deg)", filter: "hue-rotate(0deg)" }} />)}
            {[0, 1].map((k) => <RobotSprite key={`r${k}`} uid={`tr${k}`} className={`absolute top-[18%] h-24 w-24 sm:h-28 sm:w-28 ${winner === 0 ? "g-shake" : ""}`} style={{ right: `${3 + k * 10}%`, transform: "rotate(10deg) scaleX(-1)", filter: "hue-rotate(60deg) saturate(1.4)" }} />)}
          </div>
          <div className="absolute bottom-2 left-3 rounded-lg px-2 py-0.5 text-xs font-black text-white" style={{ background: TEAM_COLORS[0].hex }}>{teams[0]}</div>
          <div className="absolute bottom-2 right-3 rounded-lg px-2 py-0.5 text-xs font-black text-white" style={{ background: TEAM_COLORS[1].hex }}>{teams[1]}</div>
        </div>
        {winner !== null && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 g-pop rounded-2xl bg-white px-5 py-2 text-lg font-extrabold shadow-xl" role="status">
            {winner === "none" ? t("Екеуі де қателесті 😅") : t("{n} тартты! 💪", { n: teams[winner] })}
          </div>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl p-3" style={{ background: `${TEAM_COLORS[0].hex}22` }}><div className="mb-2 text-center text-sm font-black" style={{ color: TEAM_COLORS[0].hex }}>{teams[0]}{locked[0] && winner === null ? ` · ${t("келесі сұрақты күт")}` : ""}</div><Side side={0} /></div>
        <div className="rounded-3xl p-3" style={{ background: `${TEAM_COLORS[1].hex}22` }}><div className="mb-2 text-center text-sm font-black" style={{ color: TEAM_COLORS[1].hex }}>{teams[1]}{locked[1] && winner === null ? ` · ${t("келесі сұрақты күт")}` : ""}</div><Side side={1} /></div>
      </div>
    </div>
  );
}
