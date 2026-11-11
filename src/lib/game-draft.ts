import "server-only";
import { db } from "./db";
import type { GameDraft } from "@/components/admin/GameEditor";

/** Бар ойынды редакторға жүктеу (өңдеу не көшіріп алу үшін). */
export async function loadDraft(id: string): Promise<(GameDraft & { authorId: string | null }) | null> {
  const g = await db.game.findUnique({ where: { id }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!g) return null;
  return {
    id: g.id, authorId: g.authorId, type: g.type, title: g.title, description: g.description, grade: g.gradeId, topicId: g.topicId, timeLimit: g.timeLimit, published: g.published,
    questions: g.questions.map((q) => {
      const data = (q.data ?? {}) as Record<string, unknown>;
      // Сәйкестендіруде answer базада индекстер; редакторға жұптар жеткілікті
      return { prompt: q.prompt, data, answer: g.type === "LOGIC" || g.type === "CODING" ? (Array.isArray(q.answer) ? q.answer : [q.answer]) : q.answer, explanation: q.explanation ?? undefined, points: q.points };
    }),
  };
}
