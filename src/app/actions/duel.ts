"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { scoreGame, type QuestionRow } from "@/lib/games";

const nameS = z.string().trim().min(2).max(40);
const msS = z.number().int().min(0).max(3_600_000);

async function load(gameId: string) {
  const g = await db.game.findFirst({ where: { id: z.string().cuid().parse(gameId), published: true }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!g) throw new Error("Ойын табылмады");
  return g;
}

/** Бірінші ойыншы ойнап болды: дуэль жасалады, досына сілтеме жібереді. */
export async function createDuel(gameId: string, name: string, answers: Record<string, unknown>, ms: number, teacherId?: string | null) {
  const g = await load(gameId);
  const res = scoreGame(g.type, g.questions as QuestionRow[], answers ?? {});
  const teacher = teacherId ? await db.user.findUnique({ where: { id: z.string().cuid().parse(teacherId) }, select: { id: true } }) : null;
  const d = await db.duel.create({ data: { gameId: g.id, aName: nameS.parse(name), aScore: res.score, aMs: msS.parse(Math.round(ms)), teacherId: teacher?.id ?? null } });
  await db.game.update({ where: { id: g.id }, data: { plays: { increment: 1 } } });
  if (teacher) await db.studentResult.create({ data: { gameId: g.id, teacherId: teacher.id, studentName: d.aName, className: "дуэль", score: res.score, maxScore: res.max } });
  return { id: d.id, score: res.score, max: res.max };
}

/** Екінші ойыншы жауап береді: нәтиже салыстырылады. */
export async function answerDuel(duelId: string, name: string, answers: Record<string, unknown>, ms: number) {
  const d = await db.duel.findUnique({ where: { id: z.string().cuid().parse(duelId) } });
  if (!d) return { error: "Дуэль табылмады" };
  if (d.bName) return { error: "Бұл дуэльге басқа біреу жауап беріп қойған" };
  const g = await load(d.gameId);
  const res = scoreGame(g.type, g.questions as QuestionRow[], answers ?? {});
  const upd = await db.duel.updateMany({ where: { id: d.id, bName: null }, data: { bName: nameS.parse(name), bScore: res.score, bMs: msS.parse(Math.round(ms)) } });
  if (!upd.count) return { error: "Бұл дуэльге басқа біреу жауап беріп қойған" };
  await db.game.update({ where: { id: g.id }, data: { plays: { increment: 1 } } });
  if (d.teacherId) await db.studentResult.create({ data: { gameId: g.id, teacherId: d.teacherId, studentName: nameS.parse(name), className: "дуэль", score: res.score, maxScore: res.max } });
  return { ok: true as const, a: { name: d.aName, score: d.aScore, ms: d.aMs }, b: { name: nameS.parse(name), score: res.score, ms: Math.round(ms) }, max: res.max };
}
