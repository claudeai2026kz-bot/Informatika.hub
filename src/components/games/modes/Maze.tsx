"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, RotateCcw, RotateCw, Repeat, Play, Delete, Trash2, ArrowRight, SkipForward, Trophy } from "lucide-react";
import { RobotSprite, StarSprite, BushSprite } from "../art/sprites";
import { countBlocks, runMaze, type Block, type MazeLevel } from "@/lib/maze";
import { useT } from "@/lib/i18n/client";

type Q = { id: string; prompt: string; points: number; data: Record<string, unknown> };
const ARROW = ["↑", "→", "↓", "←"];

/** Бақтағы фон: аспан, төбелер, бұлттар. */
function Garden() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8FD3FF" /><stop offset=".55" stopColor="#CDEFFF" /><stop offset="1" stopColor="#E9FBEF" /></linearGradient>
        <linearGradient id="ghill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8EDB7B" /><stop offset="1" stopColor="#4DB35E" /></linearGradient>
        <linearGradient id="ghill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6CCB6A" /><stop offset="1" stopColor="#2F9550" /></linearGradient>
        <radialGradient id="gsun"><stop offset="0" stopColor="#FFF7C2" /><stop offset="1" stopColor="#FFF7C2" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="800" height="500" fill="url(#gsky)" />
      <circle cx="680" cy="70" r="120" fill="url(#gsun)" /><circle cx="680" cy="70" r="34" fill="#FFE68A" />
      <g fill="#fff" opacity=".9"><ellipse cx="140" cy="80" rx="60" ry="18" /><ellipse cx="180" cy="66" rx="36" ry="22" /><ellipse cx="470" cy="56" rx="48" ry="14" /><ellipse cx="500" cy="46" rx="28" ry="16" /></g>
      <path d="M0 300 Q140 220 300 280 T620 260 T800 250 L800 500 L0 500 Z" fill="url(#ghill1)" />
      <path d="M0 360 Q200 300 420 350 T800 330 L800 500 L0 500 Z" fill="url(#ghill2)" />
      <g><rect x="58" y="230" width="10" height="60" rx="4" fill="#8A5A2B" /><circle cx="63" cy="220" r="34" fill="#3FAE5A" /><circle cx="50" cy="206" r="10" fill="#7EDB6A" opacity=".7" /></g>
      <g><rect x="730" y="220" width="10" height="64" rx="4" fill="#8A5A2B" /><circle cx="735" cy="208" r="38" fill="#2F9E52" /><circle cx="722" cy="194" r="11" fill="#7EDB6A" opacity=".7" /></g>
      <g fill="#FF8FB1"><circle cx="120" cy="420" r="6" /><circle cx="680" cy="440" r="6" /><circle cx="300" cy="470" r="5" /></g>
      <g fill="#FFE27A"><circle cx="160" cy="455" r="5" /><circle cx="620" cy="410" r="5" /><circle cx="520" cy="475" r="5" /></g>
    </svg>
  );
}

function Chip({ b, small }: { b: "F" | "L" | "R"; small?: boolean }) {
  const t = useT();
  const s = { F: { c: "from-sky-400 to-sky-600", i: <ArrowUp className="h-4 w-4" />, l: t("Алға") }, L: { c: "from-lilac-400 to-lilac-600", i: <RotateCcw className="h-4 w-4" />, l: t("Солға") }, R: { c: "from-lilac-400 to-lilac-600", i: <RotateCw className="h-4 w-4" />, l: t("Оңға") } }[b];
  return <span className={`inline-flex items-center gap-1 rounded-xl bg-gradient-to-b ${s.c} px-2.5 ${small ? "py-1 text-xs" : "py-1.5 text-sm"} font-bold text-white shadow-[0_3px_0_rgba(0,0,0,.18)]`}>{s.i}{s.l}</span>;
}

export default function Maze({ questions, onDone }: { questions: Q[]; onDone: (a: Record<string, unknown>) => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [prog, setProg] = useState<Block[]>([]);
  const [openLoop, setOpenLoop] = useState(false);
  const [loopN, setLoopN] = useState(3);
  const [pos, setPos] = useState<{ cell: number; dir: number; crash?: boolean } | null>(null);
  const [status, setStatus] = useState<"edit" | "run" | "win" | "crash" | "short">("edit");
  const [score, setScore] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const q = questions[i];
  const L = q.data as unknown as MazeLevel;
  const walls = useMemo(() => new Set(L.walls), [L]);
  const used = countBlocks(prog);
  const robot = pos ?? { cell: L.start, dir: L.dir };

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { setProg([]); setOpenLoop(false); setPos(null); setStatus("edit"); }, [i]);

  function add(b: "F" | "L" | "R") {
    if (status !== "edit" || used >= 30) return;
    setProg((p) => {
      const last = p[p.length - 1];
      if (openLoop && last && typeof last !== "string") return [...p.slice(0, -1), { ...last, body: [...last.body, b] }];
      return [...p, b];
    });
  }
  function addLoop() {
    if (status !== "edit") return;
    if (openLoop) { setOpenLoop(false); return; }
    setProg((p) => [...p, { n: loopN, body: [] }]); setOpenLoop(true);
  }
  function undo() {
    if (status !== "edit") return;
    setProg((p) => {
      const last = p[p.length - 1];
      if (last && typeof last !== "string") {
        if (last.body.length && openLoop) return [...p.slice(0, -1), { ...last, body: last.body.slice(0, -1) }];
        setOpenLoop(false); return p.slice(0, -1);
      }
      return p.slice(0, -1);
    });
  }
  function run() {
    const clean = prog.filter((b) => typeof b === "string" || b.body.length);
    const r = runMaze(L, clean);
    setOpenLoop(false); setStatus("run"); setPos({ cell: L.start, dir: L.dir });
    let k = 0;
    const tick = () => {
      if (k >= r.steps.length) {
        const ok = r.reached && (!L.limit || countBlocks(clean) <= L.limit);
        setStatus(ok ? "win" : r.crashed ? "crash" : "short");
        if (ok) { setAnswers((a) => ({ ...a, [q.id]: clean })); setScore((s) => s + q.points); }
        return;
      }
      setPos(r.steps[k]); k++;
      timer.current = setTimeout(tick, 380);
    };
    timer.current = setTimeout(tick, 250);
  }
  function reset() { clearTimeout(timer.current); setPos(null); setStatus("edit"); }
  function next(skip = false) {
    const a = skip ? { ...answers, [q.id]: prog } : answers;
    setAnswers(a);
    if (i + 1 < questions.length) setI(i + 1); else onDone(a);
  }

  const x = robot.cell % L.w, y = Math.floor(robot.cell / L.w);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <div className="relative overflow-hidden rounded-3xl border border-sky-100 shadow-[0_20px_50px_-25px_#1d4f91]">
        <Garden />
        <div className="relative flex items-center justify-between gap-2 px-4 pt-4 text-sm font-bold">
          <span className="rounded-full bg-white/85 px-3 py-1 text-ink shadow-sm backdrop-blur">{t("Деңгей")} {i + 1} / {questions.length}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-gold-500 shadow-sm backdrop-blur"><Trophy className="h-4 w-4" /> {score}</span>
        </div>
        <div className="relative mx-auto w-full max-w-[520px] p-4 sm:p-6">
          <div className="relative rounded-2xl bg-[#E9D9B8] p-1.5 shadow-[inset_0_2px_0_#fff8,0_10px_0_#B99B6A,0_18px_30px_-10px_#5c3d1488]">
            <div className="relative grid gap-1" style={{ gridTemplateColumns: `repeat(${L.w}, 1fr)` }}>
              {Array.from({ length: L.w * L.h }, (_, c) => (
                <div key={c} className={`relative aspect-square rounded-lg ${walls.has(c) ? "bg-[#7BC96F]" : (c + Math.floor(c / L.w)) % 2 ? "bg-[#F7EBD3]" : "bg-[#F1E0C0]"} shadow-[inset_0_-3px_0_#0000000f]`}>
                  {walls.has(c) && <BushSprite uid={`bu${c}`} className="absolute inset-[-8%] h-[116%] w-[116%]" />}
                  {c === L.goal && <StarSprite uid="st" className={`absolute inset-[6%] h-[88%] w-[88%] ${status === "win" ? "g-boom" : "g-glow g-float"}`} />}
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-1.5">
              <div className="absolute transition-all duration-300 ease-out" style={{ left: `${(x / L.w) * 100}%`, top: `${(y / L.h) * 100}%`, width: `${100 / L.w}%`, height: `${100 / L.h}%` }}>
                <div className={`relative h-full w-full ${robot.crash || status === "crash" ? "g-shake" : ""}`}>
                  <RobotSprite uid="rb" className="absolute inset-[-6%] h-[112%] w-[112%] drop-shadow-[0_6px_6px_rgba(20,40,80,.25)]" />
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-sky-500 text-[11px] font-black text-white shadow" aria-label={t("Бағыты")}>{ARROW[robot.dir]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {status !== "edit" && status !== "run" && (
          <div className="absolute inset-x-4 bottom-4 g-pop rounded-2xl bg-white/95 p-4 text-center shadow-xl backdrop-blur" role="status">
            <div className="text-lg font-extrabold">{status === "win" ? t("Робот жұлдызға жетті! ⭐") : status === "crash" ? t("Робот кедергіге соғылды 🌳") : t("Робот жұлдызға жетпеді 🤔")}</div>
            {status === "win" && L.limit && <div className="text-sm muted">{t("{n} блок қолданылды", { n: used })}</div>}
            <div className="mt-3 flex justify-center gap-2">
              {status === "win"
                ? <button className="btn-primary" onClick={() => next()}>{i + 1 < questions.length ? <>{t("Келесі деңгей")} <ArrowRight className="h-4 w-4" /></> : t("Нәтижені көру")}</button>
                : <button className="btn-primary" onClick={reset}><RotateCcw className="h-4 w-4" /> {t("Бағдарламаны түзету")}</button>}
            </div>
          </div>
        )}
      </div>

      <div className="card p-5 flex flex-col">
        <h2 className="text-lg font-bold">{q.prompt || t("Роботты жұлдызға жеткіз")}</h2>
        <p className="mt-1 text-sm muted">{t("Командаларды басып бағдарлама құрастыр, сосын «Іске қосу» бас.")}{L.limit ? " " + t("Ең көбі {n} блок.", { n: L.limit }) : ""}</p>
        <div className="mt-4 min-h-[120px] flex-1 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-3" aria-label={t("Бағдарлама")}>
          {prog.length === 0 && <p className="text-sm muted">{t("Бағдарлама бос. Төмендегі командаларды басыңыз.")}</p>}
          <ol className="flex flex-wrap items-start gap-1.5">
            {prog.map((b, k) => (
              <li key={k}>
                {typeof b === "string" ? <Chip b={b} /> : (
                  <span className={`inline-flex flex-wrap items-center gap-1 rounded-2xl border-2 ${openLoop && k === prog.length - 1 ? "border-gold-400 bg-gold-100" : "border-amber-200 bg-amber-50"} p-1.5`}>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-b from-gold-400 to-gold-500 px-2 py-1 text-xs font-black text-white"><Repeat className="h-3.5 w-3.5" />{b.n}×</span>
                    {b.body.map((x, j) => <Chip key={j} b={x as "F" | "L" | "R"} small />)}
                    {b.body.length === 0 && <span className="px-1 text-xs text-amber-700">{t("ішіне команда қос")}</span>}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
        <div className={`mt-2 text-xs font-semibold ${L.limit && used > L.limit ? "text-rose-600" : "muted"}`}>{t("Блоктар: {n}", { n: used })}{L.limit ? ` / ${L.limit}` : ""}</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button className="rounded-2xl bg-gradient-to-b from-sky-400 to-sky-600 py-3 font-bold text-white shadow-[0_4px_0_#1f6fb8] active:translate-y-0.5 active:shadow-none disabled:opacity-50" disabled={status !== "edit"} onClick={() => add("F")}><ArrowUp className="mx-auto h-5 w-5" />{t("Алға")}</button>
          <button className="rounded-2xl bg-gradient-to-b from-lilac-400 to-lilac-600 py-3 font-bold text-white shadow-[0_4px_0_#5b3fc4] active:translate-y-0.5 active:shadow-none disabled:opacity-50" disabled={status !== "edit"} onClick={() => add("L")}><RotateCcw className="mx-auto h-5 w-5" />{t("Солға")}</button>
          <button className="rounded-2xl bg-gradient-to-b from-lilac-400 to-lilac-600 py-3 font-bold text-white shadow-[0_4px_0_#5b3fc4] active:translate-y-0.5 active:shadow-none disabled:opacity-50" disabled={status !== "edit"} onClick={() => add("R")}><RotateCw className="mx-auto h-5 w-5" />{t("Оңға")}</button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button className={`flex-1 rounded-2xl py-2.5 font-bold text-white shadow-[0_4px_0_#b07a06] active:translate-y-0.5 active:shadow-none disabled:opacity-50 ${openLoop ? "bg-amber-600" : "bg-gradient-to-b from-gold-400 to-gold-500"}`} disabled={status !== "edit"} onClick={addLoop}>
            <Repeat className="mr-1 inline h-4 w-4" />{openLoop ? t("Қайталауды жабу") : t("Қайтала {n} рет", { n: loopN })}
          </button>
          {!openLoop && <select className="input h-11 w-20" value={loopN} onChange={(e) => setLoopN(+e.target.value)} aria-label={t("Қайталау саны")}>{[2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}×</option>)}</select>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-ghost btn-sm" onClick={undo} disabled={status !== "edit" || !prog.length}><Delete className="h-4 w-4" /> {t("Соңғысын өшіру")}</button>
          <button className="btn-ghost btn-sm" onClick={() => { setProg([]); setOpenLoop(false); }} disabled={status !== "edit" || !prog.length}><Trash2 className="h-4 w-4" /> {t("Тазалау")}</button>
          <button className="btn-ghost btn-sm ml-auto" onClick={() => next(true)} disabled={status === "run"}><SkipForward className="h-4 w-4" /> {t("Өткізу")}</button>
        </div>
        <button className="mt-3 h-12 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-base font-extrabold text-white shadow-[0_5px_0_#047857] active:translate-y-0.5 active:shadow-none disabled:opacity-50" disabled={status !== "edit" || !prog.length} onClick={run}><Play className="mr-1 inline h-5 w-5" /> {t("Іске қосу")}</button>
      </div>
    </div>
  );
}
