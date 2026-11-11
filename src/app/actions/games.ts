"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { scoreGame, scoreQuestion, type QuestionRow } from "@/lib/games";

async function loadGame(gameId: string) {
  const g = await db.game.findFirst({ where: { id: z.string().cuid().parse(gameId), published: true }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!g) throw new Error("Ойын табылмады");
  return g;
}

/** Бір сұрақты тексеру (тест пен жылдам сұрақтарда бірден нәтиже көрсету үшін). */
export async function checkAnswer(gameId: string, questionId: string, given: unknown) {
  const g = await loadGame(gameId);
  const q = g.questions.find((x) => x.id === questionId);
  if (!q) throw new Error("Сұрақ табылмады");
  const r = scoreQuestion(g.type, q as QuestionRow, given);
  return { correct: r.correct, answer: q.answer, explanation: q.explanation };
}

/** Ойынды аяқтау: ұпай серверде есептеледі, нәтиже сақталады. */
const studentSchema = z.object({
  teacherId: z.string().cuid(),
  name: z.string().trim().min(2).max(60),
  className: z.string().trim().max(20).default(""),
});

export async function submitGame(gameId: string, answers: Record<string, unknown>, student?: { teacherId: string; name: string; className?: string }) {
  const g = await loadGame(gameId);
  const res = scoreGame(g.type, g.questions as QuestionRow[], answers ?? {});
  const user = await getCurrentUser();
  await db.game.update({ where: { id: g.id }, data: { plays: { increment: 1 } } });
  let best: number | null = null;
  let sent = false;
  const st = student ? studentSchema.safeParse(student) : null;
  if (st?.success && (await db.user.findUnique({ where: { id: st.data.teacherId }, select: { id: true } }))) {
    await db.studentResult.create({ data: { gameId: g.id, teacherId: st.data.teacherId, studentName: st.data.name, className: st.data.className, score: res.score, maxScore: res.max } });
    sent = true;
  } else if (user) {
    await db.gameResult.create({ data: { userId: user.id, gameId: g.id, score: res.score, maxScore: res.max } });
    best = (await db.gameResult.aggregate({ where: { userId: user.id, gameId: g.id }, _max: { score: true } }))._max.score;
  }
  return {
    ...res,
    best,
    saved: !!user && !sent,
    sent,
    solutions: g.questions.map((q) => ({ id: q.id, answer: q.answer, explanation: q.explanation })),
  };
}

/** «Шыңға шық» көмегі: бір қате нұсқаны көрсетеді (клиент оны жасырады). Ойында бір рет қолданылады. */
export async function climbHint(gameId: string, questionId: string): Promise<number | null> {
  const g = await loadGame(gameId);
  if (g.type !== "CLIMB") return null;
  const q = g.questions.find((x) => x.id === questionId);
  if (!q) return null;
  const n = ((q.data as { options?: unknown[] })?.options ?? []).length;
  const wrong = Array.from({ length: n }, (_, i) => i).filter((i) => i !== q.answer);
  return wrong.length ? wrong[Math.floor(Math.random() * wrong.length)] : null;
}
