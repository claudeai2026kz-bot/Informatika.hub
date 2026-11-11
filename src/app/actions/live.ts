"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkLive, GRACE_MS, isTeamEscape, limitSec, loadSession, newCode, teamProgress, LIVE_TYPES } from "@/lib/live";
import type { QuestionRow } from "@/lib/games";

/** Мұғалім тірі ойын ашады: оқушылар 6 таңбалы кодпен кіреді. */
export async function startLive(gameId: string, teams = 0) {
  const user = await getCurrentUser();
  if (!user) return { error: "Жүйеге кіріңіз" };
  const g = await db.game.findFirst({ where: { id: z.string().cuid().parse(gameId), published: true }, select: { id: true, type: true, _count: { select: { questions: true } } } });
  if (!g || !g._count.questions) return { error: "Ойын табылмады" };
  const team = g.type === "TEAMESCAPE";
  if (!team && !(LIVE_TYPES as readonly string[]).includes(g.type)) return { error: "Бұл ойынды сыныппен бірге ойнауға болмайды" };
  const nTeams = team ? Math.max(2, Math.min(6, Math.floor(teams) || 2)) : 0;
  // ескі ойындарды тазалау (бір тәуліктен асқан)
  await db.liveSession.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86400e3) } } });
  for (let k = 0; k < 8; k++) {
    try {
      const s = await db.liveSession.create({ data: { code: newCode(), gameId: g.id, hostId: user.id, teams: nTeams } });
      return { code: s.code };
    } catch { /* код қайталанса, қайта байқаймыз */ }
  }
  return { error: "Қайта байқап көріңіз" };
}

const nameS = z.string().trim().min(2, "Атыңды толық жаз").max(30);

export async function joinLive(code: string, name: string) {
  const s = await loadSession(String(code).trim());
  if (!s || s.state === "ended") return { error: "Мұндай кодпен ойын табылмады" };
  const n = nameS.safeParse(name);
  if (!n.success) return { error: n.error.issues[0].message };
  const same = s.players.find((p) => p.name.toLowerCase() === n.data.toLowerCase());
  if (same) return { error: "Бұл атпен біреу кіріп қойған. Басқаша жаз (мысалы, фамилияңмен)" };
  if (s.players.length >= 200) return { error: "Ойынға орын қалмады" };
  let team = 0;
  if (s.teams > 0) {
    const sizes = Array.from({ length: s.teams }, (_, k) => s.players.filter((p) => p.team === k).length);
    team = sizes.indexOf(Math.min(...sizes));
  }
  const p = await db.livePlayer.create({ data: { sessionId: s.id, name: n.data, team } });
  return { playerId: p.id };
}

async function asHost(code: string) {
  const user = await getCurrentUser();
  const s = await loadSession(code);
  if (!user || !s || s.hostId !== user.id) throw new Error("Рұқсат жоқ");
  return s;
}

async function saveResults(code: string) {
  const s = await loadSession(code);
  if (!s) return;
  const maxAll = s.game.questions.reduce((t, q) => t + q.points, 0);
  if (isTeamEscape(s)) {
    const prog = teamProgress(s);
    await db.studentResult.createMany({ data: s.players.map((p) => ({ gameId: s.gameId, teacherId: s.hostId, studentName: p.name, className: prog[p.team]?.name ?? "", score: Math.max(0, prog[p.team]?.score ?? 0), maxScore: maxAll })) });
  } else {
    await db.studentResult.createMany({ data: s.players.map((p) => ({ gameId: s.gameId, teacherId: s.hostId, studentName: p.name, className: "Сынып жарысы", score: Math.max(0, p.score + p.bonus), maxScore: maxAll })) });
  }
}

/** Мұғалімнің басқару батырмалары. */
export async function hostLive(code: string, action: "start" | "next" | "reveal" | "end" | "adjust", arg?: { playerId?: string; team?: number; delta?: number }) {
  const s = await asHost(code);
  const total = s.game.questions.length;
  if (action === "adjust") {
    const delta = Math.max(-1000, Math.min(1000, Math.round(arg?.delta ?? 0)));
    if (arg?.playerId) await db.livePlayer.updateMany({ where: { id: arg.playerId, sessionId: s.id }, data: { bonus: { increment: delta } } });
    else if (Number.isInteger(arg?.team)) {
      const first = s.players.find((p) => p.team === arg!.team);
      if (first) await db.livePlayer.update({ where: { id: first.id }, data: { bonus: { increment: delta } } });
    }
    return { ok: true };
  }
  if (action === "end") {
    if (s.state !== "ended") { await db.liveSession.update({ where: { id: s.id }, data: { state: "ended" } }); await saveResults(code); }
    return { ok: true };
  }
  if (isTeamEscape(s)) {
    if (action === "start" && s.state === "lobby") await db.liveSession.update({ where: { id: s.id }, data: { state: "question", current: 0, startedAt: new Date() } });
    return { ok: true };
  }
  if (action === "reveal" && s.state === "question") await db.liveSession.update({ where: { id: s.id }, data: { state: "reveal" } });
  if ((action === "start" && s.state === "lobby") || (action === "next" && s.state === "reveal")) {
    const next = s.current + 1;
    if (next >= total) { await db.liveSession.update({ where: { id: s.id }, data: { state: "ended" } }); await saveResults(code); }
    else await db.liveSession.update({ where: { id: s.id }, data: { state: "question", current: next, startedAt: new Date() } });
  }
  return { ok: true };
}

/** Оқушы жауап береді. */
export async function answerLive(code: string, playerId: string, value: unknown) {
  const s = await loadSession(String(code));
  if (!s || s.state !== "question") return { error: "Қазір жауап беру уақыты емес" };
  const p = s.players.find((x) => x.id === playerId);
  if (!p) return { error: "Ойыншы табылмады" };
  const qs = s.game.questions as QuestionRow[];
  if (isTeamEscape(s)) {
    const prog = teamProgress(s)[p.team];
    const k = prog?.solved ?? 0;
    if (k >= qs.length) return { ok: true, correct: true };
    const v = String(value ?? "").slice(0, 100);
    const correct = checkLive(qs[k], s.game.type, v);
    await db.liveAnswer.create({ data: { sessionId: s.id, playerId: p.id, qIndex: k, value: v, correct, points: correct ? qs[k].points : 0 } });
    return { ok: true, correct };
  }
  const q = qs[s.current];
  if (!q) return { error: "Сұрақ табылмады" };
  const ms = Date.now() - (s.startedAt?.getTime() ?? Date.now());
  if (ms > limitSec(s) * 1000 + GRACE_MS) return { error: "Уақыт бітті" };
  if (s.answers.some((a) => a.playerId === p.id && a.qIndex === s.current)) return { error: "Жауап беріп қойдың" };
  const correct = checkLive(q, s.game.type, value);
  await db.$transaction([
    db.liveAnswer.create({ data: { sessionId: s.id, playerId: p.id, qIndex: s.current, value: Number(value), correct, points: correct ? q.points : 0, ms } }),
    ...(correct ? [db.livePlayer.update({ where: { id: p.id }, data: { score: { increment: q.points } } })] : []),
  ]);
  return { ok: true };
}
