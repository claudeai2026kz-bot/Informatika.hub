import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadTopicOpts } from "@/lib/topics";
import GameEditor from "@/components/admin/GameEditor";

export default async function EditGame({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const g = await db.game.findUnique({ where: { id: (await params).id }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!g) notFound();
  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">Ойынды өңдеу</h1>
      <GameEditor topics={await loadTopicOpts()} initial={{
        id: g.id, type: g.type, title: g.title, description: g.description, grade: g.gradeId, topicId: g.topicId, timeLimit: g.timeLimit, published: g.published,
        questions: g.questions.map((q) => ({ prompt: q.prompt, data: (q.data ?? {}) as Record<string, unknown>, answer: q.answer, explanation: q.explanation ?? undefined, points: q.points })),
      }} />
    </div>
  );
}
