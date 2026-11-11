"use client";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Check, X, Trophy, KeyRound, DoorOpen, Users, Timer } from "lucide-react";
import { answerLive, joinLive } from "@/app/actions/live";
import { useCountdown, useLive, OPT_STYLES } from "./useLive";
import { TEAM_COLORS } from "../modes/Board";
import { useT } from "@/lib/i18n/client";

const teamHex = (k: number) => [...TEAM_COLORS.map((c) => c.hex), "#F43F5E", "#14B8A6"][k % 6];

/** Оқушының телефоны: кодпен кіреді, жауап береді. */
export default function PlayerLive({ code }: { code: string }) {
  const t = useT();
  const key = `ihub-live-${code}`;
  const [pid, setPid] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { setPid(localStorage.getItem(key)); } catch { /* */ } setReady(true); }, [key]);
  if (!ready) return null;
  if (!pid) return <Join code={code} onJoin={(id) => { try { localStorage.setItem(key, id); } catch { /* */ } setPid(id); }} />;
  return <Play code={code} pid={pid} onLost={() => { try { localStorage.removeItem(key); } catch { /* */ } setPid(null); }} />;
}

function Join({ code, onJoin }: { code: string; onJoin: (id: string) => void }) {
  const t = useT();
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  useEffect(() => { try { setName(localStorage.getItem("ihub-student-name") ?? ""); } catch { /* */ } }, []);
  return (
    <form className="card p-6 sm:p-8 text-center" onSubmit={(e) => { e.preventDefault(); setErr(""); start(async () => { const r = await joinLive(code, name); if ("error" in r && r.error) setErr(r.error); else if ("playerId" in r && r.playerId) { try { localStorage.setItem("ihub-student-name", name.trim()); } catch { /* */ } onJoin(r.playerId); } }); }}>
      <p className="muted">{t("Ойын коды")}: <b className="font-mono text-ink">{code}</b></p>
      <h2 className="mt-2 text-2xl font-extrabold">{t("Атыңды жаз")}</h2>
      <input className="input mt-5 h-14 text-center text-lg" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder={t("Мысалы: Айбек")} autoFocus aria-label={t("Атың")} />
      {err && <p className="mt-3 text-sm font-semibold text-rose-600" role="alert">{t(err)}</p>}
      <button className="btn-primary h-14 w-full mt-4 text-lg" disabled={pending || name.trim().length < 2}>{pending ? <Loader2 className="h-5 w-5 animate-spin" /> : t("Кіру")}</button>
    </form>
  );
}

function Play({ code, pid, onLost }: { code: string; pid: string; onLost: () => void }) {
  const t = useT();
  const { s, gone, reload, serverNow } = useLive(code, { player: pid, every: 1300 });
  const left = useCountdown(s ?? null, serverNow);
  const [picked, setPicked] = useState<{ q: number; k: number } | null>(null);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => { if (s && !s.me) onLost(); }, [s, onLost]);
  useEffect(() => { setText(""); setMsg(null); }, [s?.door?.index]);

  if (gone) return <div className="card p-10 text-center">{t("Ойын табылмады не аяқталды.")}</div>;
  if (!s || !s.me) return <div className="card p-16 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-sky-500" /></div>;
  const me = s.me;
  const team = s.type === "TEAMESCAPE";
  const Top = (
    <div className="mb-4 flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 shadow-sm">
      <span className="truncate font-bold">{me.name}{team && <span className="ml-2 rounded-lg px-2 py-0.5 text-xs text-white" style={{ background: teamHex(me.team) }}>{t(s.progress?.[me.team]?.name ?? "")}</span>}</span>
      <span className="chip bg-gold-100 text-gold-500"><Trophy className="h-3.5 w-3.5" /> {team ? s.progress?.[me.team]?.score ?? 0 : me.score}</span>
    </div>
  );

  if (s.state === "lobby")
    return (
      <div>{Top}
        <div className="card p-10 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-lilac-500" />
          <h2 className="mt-4 text-2xl font-extrabold">{t("Сен ойындасың! 🎉")}</h2>
          <p className="mt-1 muted">{t("Мұғалім ойынды бастағанша күте тұр.")}</p>
          {team && <p className="mt-4 text-sm"><Users className="mr-1 inline h-4 w-4" />{t("Сенің командаң:")} <b style={{ color: teamHex(me.team) }}>{t(s.progress?.[me.team]?.name ?? "")}</b></p>}
        </div>
      </div>
    );

  if (s.state === "ended") {
    const prog = s.progress ? [...s.progress].sort((a, b) => b.solved - a.solved || a.last - b.last) : null;
    const place = prog ? prog.findIndex((p) => p.team === me.team) + 1 : me.rank;
    return (
      <div>{Top}
        <div className="card p-10 text-center">
          <Trophy className="mx-auto h-14 w-14 text-gold-500" />
          <h2 className="mt-3 text-2xl font-extrabold">{t("Ойын аяқталды!")}</h2>
          <p className="mt-2 text-lg">{t(team ? "Командаң {n}-орында" : "Сен {n}-орындасың", { n: place ?? "—" })}</p>
          <p className="muted">{t("Нәтижең мұғаліміңе жіберілді ✅")}</p>
        </div>
      </div>
    );
  }

  if (team) {
    const d = s.door;
    const tp = s.progress?.[me.team];
    if (!d) return (
      <div>{Top}
        <div className="card p-10 text-center"><DoorOpen className="mx-auto h-14 w-14 text-emerald-500" /><h2 className="mt-3 text-2xl font-extrabold">{t("Командаң барлық есікті ашты! 🎉")}</h2><p className="muted mt-1">{t("Басқа командаларды күтіңдер.")}</p></div>
      </div>
    );
    return (
      <div>{Top}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-[#2b1d5c] to-[#140c2c] p-5 sm:p-6 text-white shadow-xl">
          <div className="flex items-center justify-between text-sm font-bold"><span><DoorOpen className="mr-1 inline h-4 w-4" />{t("Есік {n} / {m}", { n: d.index + 1, m: s.total })}</span><span className="text-gold-300">{t("{n} балл", { n: d.points })}</span></div>
          <div className="mt-3 flex gap-1">{Array.from({ length: s.total }, (_, k) => <span key={k} className={`h-2 flex-1 rounded-full ${k < (tp?.solved ?? 0) ? "bg-emerald-400" : k === d.index ? "bg-gold-400" : "bg-white/15"}`} />)}</div>
          <p className="mt-5 text-xl font-bold leading-snug whitespace-pre-line">{d.prompt}</p>
          {d.clue && (
            <div className="mt-4 rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gold-300"><KeyRound className="mr-1 inline h-4 w-4" />{t("Сенің кеңесің ({n}/{m} бөлік)", { n: d.part, m: d.parts })}</p>
              <p className="mt-1 text-lg font-semibold whitespace-pre-line">{d.clue}</p>
              {d.parts > 1 && <p className="mt-2 text-xs text-white/70">{t("Қалған бөліктер командаластарыңда: {n}. Бір-біріңе айтып, бірге шешіңдер!", { n: d.mates.filter((m) => m !== me.name).join(", ") || "—" })}</p>}
            </div>
          )}
          <form className="mt-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; start(async () => { const r = await answerLive(code, pid, text); if ("correct" in r) setMsg(r.correct ? { ok: true, text: t("Дұрыс! Есік ашылды 🔓") } : { ok: false, text: t("Код қате. Командаңмен ақылдас 🤔") }); await reload(); }); }}>
            <input className="input h-12 !bg-white !text-ink text-lg" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Есіктің коды")} maxLength={100} aria-label={t("Есіктің коды")} />
            <button className="btn-primary h-12" disabled={pending || !text.trim()}>{pending ? <Loader2 className="h-5 w-5 animate-spin" /> : t("Ашу")}</button>
          </form>
          {msg && <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold ${msg.ok ? "bg-emerald-500/25" : "bg-rose-500/25 g-shake"}`} role="status">{msg.text}</p>}
          {d.wrong > 0 && <p className="mt-2 text-xs text-white/60">{t("Командаңның қате әрекеттері: {n}", { n: d.wrong })}</p>}
        </div>
      </div>
    );
  }

  const q = s.question;
  if (!q) return null;
  const answered = s.me.answered ?? (picked?.q === s.current ? picked.k : null);
  if (s.state === "reveal")
    return (
      <div>{Top}
        <div className={`card p-10 text-center g-pop ${me.correct ? "!bg-emerald-50" : "!bg-rose-50"}`}>
          {me.correct ? <Check className="mx-auto h-16 w-16 text-emerald-500" /> : <X className="mx-auto h-16 w-16 text-rose-500" />}
          <h2 className="mt-3 text-3xl font-extrabold">{me.correct ? t("Дұрыс! +{n}", { n: me.gained ?? 0 }) : answered === null ? t("Үлгермедің ⏰") : t("Қате 😕")}</h2>
          {!me.correct && s.answer !== null && s.answer !== undefined && <p className="mt-2">{t("Дұрыс жауап:")} <b>{q.options[s.answer]}</b></p>}
          <p className="mt-3 muted">{t("Сен {n}-орындасың", { n: me.rank ?? "—" })}</p>
        </div>
      </div>
    );
  return (
    <div>{Top}
      <div className="mb-3 flex items-center justify-between text-sm font-bold"><span>{t("Сұрақ")} {s.current + 1} / {s.total}</span><span className={`inline-flex items-center gap-1 ${left <= 5 ? "text-rose-600" : ""}`}><Timer className="h-4 w-4" />{left}</span></div>
      <h2 className="rounded-2xl bg-white p-4 text-lg font-bold shadow-sm">{q.prompt}</h2>
      {answered !== null ? (
        <div className="card mt-4 p-10 text-center"><Check className="mx-auto h-10 w-10 text-sky-500" /><p className="mt-2 text-lg font-bold">{t("Жауабың қабылданды!")}</p><p className="muted">{t("Басқаларды күтеміз…")}</p></div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {q.options.map((o, k) => {
            const st = OPT_STYLES[k % OPT_STYLES.length];
            return (
              <button key={k} disabled={pending || left === 0} onClick={() => { setPicked({ q: s.current, k }); start(async () => { const r = await answerLive(code, pid, k); if ("error" in r && r.error) setPicked(null); await reload(); }); }}
                className={`min-h-[110px] rounded-2xl bg-gradient-to-b ${st.bg} p-3 text-left text-white shadow-[0_5px_0_rgba(0,0,0,.25)] active:translate-y-1 active:shadow-none`}>
                <span className="block text-2xl">{st.shape}</span><span className="mt-1 block font-bold leading-tight">{o}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
