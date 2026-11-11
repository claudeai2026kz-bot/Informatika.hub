"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Users, Play, Eye, ArrowRight, Flag, Minus, Plus, Trophy, Timer, Check, DoorOpen, Copy, Maximize } from "lucide-react";
import { hostLive } from "@/app/actions/live";
import { useCountdown, useLive, OPT_STYLES } from "./useLive";
import { TEAM_COLORS } from "../modes/Board";
import { useT } from "@/lib/i18n/client";

const TC = (k: number) => TEAM_COLORS[k % TEAM_COLORS.length];
const EXTRA = [{ bg: "from-rose-400 to-rose-600", hex: "#F43F5E" }, { bg: "from-teal-400 to-teal-600", hex: "#14B8A6" }];
const teamBg = (k: number) => (k < 4 ? TC(k).bg : EXTRA[(k - 4) % 2].bg);

/** Мұғалімнің тақтасы (проектор): код, сұрақ, нәтиже, ұпай басқару. */
export default function HostLive({ code, gameId }: { code: string; gameId: string }) {
  const t = useT();
  const { s, reload, serverNow } = useLive(code, { host: true, every: 1200 });
  const left = useCountdown(s ?? null, serverNow);
  const [pending, start] = useTransition();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const autoRevealed = useRef(-1);
  useEffect(() => setOrigin(location.origin), []);
  const act = (a: Parameters<typeof hostLive>[1], arg?: Parameters<typeof hostLive>[2]) => start(async () => { await hostLive(code, a, arg); await reload(); });

  // уақыт біткенде не бәрі жауап бергенде өзі ашылады
  useEffect(() => {
    if (!s || s.type === "TEAMESCAPE" || s.state !== "question" || autoRevealed.current === s.current) return;
    const all = s.playerCount > 0 && (s.answered ?? 0) >= s.playerCount;
    if ((left === 0 && s.startedAt && serverNow() > s.startedAt + 1000) || all) { autoRevealed.current = s.current; act("reveal"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, left]);

  if (!s) return <div className="card p-16 text-center muted">{t("Жүктелуде…")}</div>;
  const team = s.type === "TEAMESCAPE";
  const joinUrl = `${origin}/live`;
  const players = s.players ?? s.board ?? [];

  const Adjust = ({ id, teamIdx, step }: { id?: string; teamIdx?: number; step: number }) => (
    <span className="inline-flex gap-1">
      <button onClick={() => act("adjust", { playerId: id, team: teamIdx, delta: -step })} className="grid h-7 w-7 place-items-center rounded-lg bg-black/10 hover:bg-black/20" aria-label={t("−{s} балл", { s: step })}><Minus className="h-3.5 w-3.5" /></button>
      <button onClick={() => act("adjust", { playerId: id, team: teamIdx, delta: step })} className="grid h-7 w-7 place-items-center rounded-lg bg-black/10 hover:bg-black/20" aria-label={t("+{s} балл", { s: step })}><Plus className="h-3.5 w-3.5" /></button>
    </span>
  );

  const Header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">{s.title}</h1>
        <p className="muted text-sm">{t(team ? "Командалық қашу бөлмесі" : "Сынып жарысы")} · {t("{n} оқушы", { n: s.playerCount })}</p>
      </div>
      <div className="flex gap-2">
        <button className="btn-ghost btn-sm" onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}><Maximize className="h-4 w-4" /> {t("Толық экран")}</button>
        {s.state !== "ended" && <button className="btn-ghost btn-sm" disabled={pending} onClick={() => act("end")}><Flag className="h-4 w-4" /> {t("Аяқтау")}</button>}
      </div>
    </div>
  );

  if (s.state === "lobby")
    return (
      <div className="space-y-5">
        {Header}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2B2FA8] via-[#5B2FC0] to-[#8B3FD8] p-6 sm:p-10 text-white text-center shadow-[0_30px_60px_-30px_#2b1673]">
          <p className="text-lg opacity-90">{t("Телефоннан мына сайтқа кіріңдер:")}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold break-all">{joinUrl.replace(/^https?:\/\//, "")}</p>
          <p className="mt-6 text-lg opacity-90">{t("Ойын коды:")}</p>
          <p className="mt-1 font-mono text-6xl sm:text-8xl font-black tracking-[.15em] drop-shadow-lg">{code}</p>
          <button className="mt-4 inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/25" onClick={async () => { try { await navigator.clipboard.writeText(`${joinUrl}/${code}`); setCopied(true); } catch { /* */ } }}><Copy className="h-4 w-4" /> {t(copied ? "Көшірілді" : "Сілтемені көшіру")}</button>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold"><Users className="mr-1 inline h-5 w-5 text-sky-500" />{t("Кірген оқушылар: {n}", { n: s.playerCount })}</h2>
            <button className="btn-primary" disabled={pending || s.playerCount === 0} onClick={() => act("start")}><Play className="h-4 w-4" /> {t("Ойынды бастау")}</button>
          </div>
          {team ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(s.progress ?? []).map((tp) => (
                <div key={tp.team} className="rounded-2xl border border-sky-100 p-3">
                  <div className={`inline-block rounded-lg bg-gradient-to-r ${teamBg(tp.team)} px-2 py-0.5 text-sm font-bold text-white`}>{t(tp.name)}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">{players.filter((p) => p.team === tp.team).map((p) => <span key={p.id} className="chip bg-sky-50 text-ink g-pop">{p.name}</span>)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">{players.map((p) => <span key={p.id} className="chip bg-sky-50 text-ink g-pop text-sm">{p.name}</span>)}{!players.length && <span className="muted text-sm">{t("Оқушыларды күтудеміз…")}</span>}</div>
          )}
        </div>
      </div>
    );

  if (team) {
    const prog = [...(s.progress ?? [])].sort((a, b) => b.solved - a.solved || a.last - b.last);
    return (
      <div className="space-y-5">
        {Header}
        <div className="rounded-3xl bg-gradient-to-br from-[#1a1238] to-[#2b1d5c] p-5 sm:p-8 text-white shadow-[0_30px_60px_-30px_#1b0b4d]">
          <h2 className="text-xl font-extrabold"><DoorOpen className="mr-1 inline h-6 w-6 text-gold-400" />{t("Командалар есіктерді ашып жатыр")}</h2>
          <div className="mt-5 space-y-4">
            {prog.map((tp, place) => (
              <div key={tp.team} className="rounded-2xl bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold"><span className="mr-2 text-white/50">{place + 1}.</span><span className={`rounded-lg bg-gradient-to-r ${teamBg(tp.team)} px-2 py-0.5`}>{t(tp.name)}</span> <span className="text-sm text-white/60">· {t("{n} оқушы", { n: tp.members })}</span></span>
                  <span className="flex items-center gap-3"><b className="text-gold-300">{t("{n} балл", { n: tp.score })}</b><span className="text-white"><Adjust teamIdx={tp.team} step={1} /></span></span>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {Array.from({ length: s.total }, (_, k) => (
                    <span key={k} className={`grid h-10 flex-1 place-items-center rounded-lg text-sm font-black transition ${k < tp.solved ? "bg-emerald-500" : k === tp.solved ? "bg-gold-400 text-ink animate-pulse" : "bg-white/10 text-white/40"}`}>{k < tp.solved ? <Check className="h-4 w-4" /> : k + 1}</span>
                  ))}
                </div>
                {tp.done && <p className="mt-2 text-sm font-bold text-emerald-300">{t("Барлық есікті ашты! 🎉")}</p>}
              </div>
            ))}
          </div>
        </div>
        {s.state === "ended" && <Link href={`/games/${gameId}/results`} className="btn-primary"><Trophy className="h-4 w-4" /> {t("Нәтижелерді көру")}</Link>}
      </div>
    );
  }

  if (s.state === "ended") {
    const board = s.board ?? [];
    return (
      <div className="space-y-5">
        {Header}
        <div className="relative overflow-hidden card p-8 text-center">
          {Array.from({ length: 30 }, (_, k) => <span key={k} className="g-confetti pointer-events-none absolute top-0 h-3 w-2 rounded-sm" style={{ left: `${(k * 37) % 100}%`, background: ["#3C9EEB", "#8B6CF0", "#F5C451", "#10B981"][k % 4], animationDelay: `${(k % 7) * 0.15}s` }} aria-hidden />)}
          <Trophy className="mx-auto h-14 w-14 text-gold-500" />
          <h2 className="mt-2 text-3xl font-extrabold">{t("Жарыс аяқталды!")}</h2>
          <div className="mx-auto mt-8 flex max-w-2xl items-end justify-center gap-3">
            {[1, 0, 2].map((k) => board[k] && (
              <div key={k} className="flex-1">
                <div className="truncate font-bold">{board[k].name}</div>
                <div className={`mt-1 rounded-t-2xl pt-3 text-2xl font-black text-white ${k === 0 ? "h-40 bg-gradient-to-b from-gold-400 to-gold-500" : k === 1 ? "h-28 bg-gradient-to-b from-slate-300 to-slate-400" : "h-20 bg-gradient-to-b from-orange-300 to-orange-400"}`}>{k + 1}<div className="text-base">{board[k].score}</div></div>
              </div>
            ))}
          </div>
        </div>
        <LeaderTable board={board} Adjust={Adjust} />
        <Link href={`/games/${gameId}/results`} className="btn-primary"><Trophy className="h-4 w-4" /> {t("Нәтижелерді көру")}</Link>
      </div>
    );
  }

  const q = s.question!;
  const reveal = s.state === "reveal";
  const maxC = Math.max(1, ...(s.counts ?? [0]));
  return (
    <div className="space-y-5">
      {Header}
      <div className="rounded-3xl bg-gradient-to-br from-[#2B2FA8] via-[#4B2FB8] to-[#7B3FD0] p-5 sm:p-8 text-white shadow-[0_30px_60px_-30px_#2b1673]">
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="rounded-full bg-white/15 px-3 py-1">{t("Сұрақ")} {s.current + 1} / {s.total} · {t("{n} балл", { n: q.points })}</span>
          {!reveal && <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-lg ${left <= 5 ? "bg-rose-500" : "bg-white/15"}`}><Timer className="h-5 w-5" />{left}</span>}
          <span className="rounded-full bg-white/15 px-3 py-1">{t("Жауап берді: {n} / {m}", { n: s.answered ?? 0, m: s.playerCount })}</span>
        </div>
        <h2 className="mt-6 text-center text-2xl sm:text-4xl font-extrabold leading-snug">{q.prompt}</h2>
        {q.code && <pre className="mx-auto mt-4 max-w-2xl overflow-x-auto rounded-xl bg-black/40 p-4 text-sm"><code>{q.code}</code></pre>}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {q.options.map((o, k) => {
            const st = OPT_STYLES[k % OPT_STYLES.length];
            const right = reveal && s.answer === k;
            return (
              <div key={k} className={`relative overflow-hidden rounded-2xl bg-gradient-to-b ${st.bg} px-5 py-4 text-lg sm:text-xl font-bold shadow-[0_5px_0_rgba(0,0,0,.25)] transition ${reveal && !right ? "opacity-40" : ""} ${right ? "ring-4 ring-white scale-[1.02]" : ""}`}>
                {reveal && <span className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-700" style={{ width: `${((s.counts?.[k] ?? 0) / maxC) * 100}%` }} aria-hidden />}
                <span className="relative flex items-center gap-3"><span className="text-2xl opacity-90">{st.shape}</span>{o}{reveal && <span className="ml-auto text-base">{s.counts?.[k] ?? 0}</span>}{right && <Check className="h-6 w-6" />}</span>
              </div>
            );
          })}
        </div>
        {reveal && s.explanation && <p className="mt-5 rounded-xl bg-white/15 px-4 py-3 text-center">{s.explanation}</p>}
        <div className="mt-6 flex justify-center">
          {reveal
            ? <button className="rounded-2xl bg-white px-6 py-3 font-extrabold text-[#3B2FA8] shadow-lg" disabled={pending} onClick={() => act("next")}>{s.current + 1 < s.total ? <>{t("Келесі сұрақ")} <ArrowRight className="inline h-5 w-5" /></> : t("Қорытынды")}</button>
            : <button className="rounded-2xl bg-white/15 px-5 py-2.5 font-bold hover:bg-white/25" disabled={pending} onClick={() => act("reveal")}><Eye className="mr-1 inline h-5 w-5" />{t("Жауапты қазір ашу")}</button>}
        </div>
      </div>
      {reveal && <LeaderTable board={(s.board ?? []).slice(0, 10)} Adjust={Adjust} title={t("Үздіктер")} step={q.points} />}
    </div>
  );
}

function LeaderTable({ board, Adjust, title, step = 1 }: { board: { id: string; name: string; score: number; bonus: number }[]; Adjust: (p: { id?: string; step: number }) => React.ReactNode; title?: string; step?: number }) {
  const t = useT();
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-sky-100 px-5 py-3"><h3 className="font-bold">{title ?? t("Барлық нәтиже")}</h3><span className="text-xs muted">{t("Мұғалім баллды қолмен өзгерте алады")}</span></div>
      <ol>
        {board.map((p, k) => (
          <li key={p.id} className="flex items-center gap-3 border-b border-sky-50 px-5 py-2.5 last:border-0">
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${k === 0 ? "bg-gold-400 text-ink" : k === 1 ? "bg-slate-200" : k === 2 ? "bg-orange-200" : "bg-sky-50"}`}>{k + 1}</span>
            <span className="flex-1 truncate font-semibold">{p.name}{p.bonus ? <span className="ml-2 text-xs muted">({p.bonus > 0 ? "+" : ""}{p.bonus})</span> : null}</span>
            <b className="tabular-nums">{p.score}</b>
            <Adjust id={p.id} step={step} />
          </li>
        ))}
        {!board.length && <li className="px-5 py-6 text-center muted">{t("Әзірге ешкім жоқ")}</li>}
      </ol>
    </div>
  );
}
