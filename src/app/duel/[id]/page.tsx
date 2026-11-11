import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { publicQuestion, scoreGame, type QuestionRow } from "@/lib/games";
import Logo from "@/components/Logo";
import { DuelAccept } from "@/components/games/modes/Duel";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getT())("Дуэль"), robots: { index: false } };
}

export default async function DuelPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  const d = await db.duel.findUnique({ where: { id }, include: { game: { include: { questions: { orderBy: { order: "asc" } } } } } });
  if (!d || !d.game.published) notFound();
  const seed = Math.floor(Math.random() * 1000);
  const qs = d.game.questions.map((q) => publicQuestion(d.game.type, q as QuestionRow, seed));
  const max = scoreGame(d.game.type, d.game.questions as QuestionRow[], {}).max;
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-sky-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <div className="flex justify-center mb-6"><Logo /></div>
        <h1 className="mb-6 text-center text-2xl sm:text-3xl font-extrabold">{d.game.title}</h1>
        <DuelAccept gameId={d.game.id} questions={qs as never} duel={{ id: d.id, aName: d.aName, aScore: d.aScore, aMs: d.aMs, bName: d.bName, bScore: d.bScore, bMs: d.bMs, max }} />
      </div>
    </div>
  );
}
