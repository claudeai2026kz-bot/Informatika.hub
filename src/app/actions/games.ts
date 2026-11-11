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
export async function checkAnswer(gameId: string, questionId: string, given: unknown, reveal = false) {
  const g = await loadGame(gameId);
  const q = g.questions.find((x) => x.id === questionId);
  if (!q) throw new Error("Сұрақ табылмады");
  const r = scoreQuestion(g.type, q as QuestionRow, given);
  // Қашу бөлмесінде жауап бірден айтылмайды: оқушы қайта байқайды, қаласа ғана ашады
  if (g.type === "ESCAPE" && !r.correct && !reveal) return { correct: false, answer: null, explanation: null };
  return { correct: r.correct, answer: q.answer, explanation: q.explanation };
}

/** Ойынды аяқтау: ұпай серверде есептеледі, нәтиже сақталады. */
const studentSchema = z.object({
  teacherId: z.string().cuid(),
  name: z.string().trim().min(2).max(60),
  className: z.string().trim().max(20).default(""),
  classId: z.string().cuid().optional(),
  studentId: z.string().cuid().optional(),
});

/** Сынып сілтемесі арқылы ойнаса: оқушыны сынып тізімінен табамыз. Тізімде жоқ болса — тізімге өзі қосылмайды,
 * журналда «Тізімде жоқ» болып шығады да, мұғалім өзі қосады не өшіреді. */
async function classLink(teacherId: string, classId?: string, studentId?: string, name?: string) {
  if (!classId) return null;
  const c = await db.classroom.findFirst({ where: { id: classId, teacherId }, select: { id: true, name: true } });
  if (!c) return null;
  let st: { id: string; name: string } | null = null;
  if (studentId) st = await db.classStudent.findFirst({ where: { id: studentId, classId: c.id }, select: { id: true, name: true } });
  if (!st && name) {
    const n = name.replace(/\s+/g, " ").trim();
    st = await db.classStudent.findFirst({ where: { classId: c.id, name: { equals: n, mode: "insensitive" } }, select: { id: true, name: true } });
  }
  return { classId: c.id, className: c.name, studentId: st?.id ?? null, studentName: st?.name ?? null };
}

/** Сынып ойынының шектеулері: мерзімі бітті ме, ойнау саны таусылды ма. */
async function classBlock(classId: string, gameId: string, studentId: string | null, name: string): Promise<"closed" | "limit" | null> {
  const cg = await db.classGame.findUnique({ where: { classId_gameId: { classId, gameId } } });
  if (!cg) return null;
  if (cg.dueAt && cg.dueAt.getTime() < Date.now()) return "closed";
  if (cg.attempts > 0) {
    const used = await db.studentResult.count({
      where: { classId, gameId, ...(studentId ? { studentId } : { studentId: null, studentName: { equals: name.trim(), mode: "insensitive" } }) },
    });
    if (used >= cg.attempts) return "limit";
  }
  return null;
}

/** Оқушы ойынды бастамай тұрып: бұл ойынды ойнауға бола ма? */
export async function classGameStatus(classId: string, gameId: string, studentId?: string, name?: string) {
  const c = z.string().cuid().safeParse(classId);
  const g = z.string().cuid().safeParse(gameId);
  if (!c.success || !g.success) return null;
  let sid: string | null = null;
  let n = (name ?? "").trim();
  if (studentId) {
    const s = await db.classStudent.findFirst({ where: { id: studentId, classId: c.data }, select: { id: true, name: true } });
    if (s) { sid = s.id; n = s.name; }
  } else if (n) {
    sid = (await db.classStudent.findFirst({ where: { classId: c.data, name: { equals: n, mode: "insensitive" } }, select: { id: true } }))?.id ?? null;
  }
  return classBlock(c.data, g.data, sid, n);
}

export async function submitGame(gameId: string, answers: Record<string, unknown>, student?: { teacherId: string; name: string; className?: string; classId?: string; studentId?: string }) {
  const g = await loadGame(gameId);
  const res = scoreGame(g.type, g.questions as QuestionRow[], answers ?? {});
  const user = await getCurrentUser();
  await db.game.update({ where: { id: g.id }, data: { plays: { increment: 1 } } });
  let best: number | null = null;
  let sent = false;
  let blocked: "closed" | "limit" | null = null;
  const st = student ? studentSchema.safeParse(student) : null;
  if (st?.success && (await db.user.findUnique({ where: { id: st.data.teacherId }, select: { id: true } }))) {
    const cl = await classLink(st.data.teacherId, st.data.classId, st.data.studentId, st.data.name);
    blocked = cl ? await classBlock(cl.classId, g.id, cl.studentId, cl.studentName ?? st.data.name) : null;
    if (!blocked) await db.studentResult.create({
      data: {
        gameId: g.id, teacherId: st.data.teacherId, studentName: cl?.studentName ?? st.data.name, className: cl?.className ?? st.data.className, score: res.score, maxScore: res.max,
        classId: cl?.classId ?? null, studentId: cl?.studentId ?? null,
      },
    });
    sent = !blocked;
  } else if (user) {
    await db.gameResult.create({ data: { userId: user.id, gameId: g.id, score: res.score, maxScore: res.max } });
    best = (await db.gameResult.aggregate({ where: { userId: user.id, gameId: g.id }, _max: { score: true } }))._max.score;
  }
  return {
    ...res,
    best,
    saved: !!user && !sent && !blocked,
    sent,
    blocked,
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
