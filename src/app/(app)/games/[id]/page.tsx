import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GAME_TYPES } from "@/lib/labels";
import { crosswordLayout, publicQuestion, type QuestionRow } from "@/lib/games";
import Breadcrumbs from "@/components/Breadcrumbs";
import FavoriteButton from "@/components/FavoriteButton";
import GamePlayer from "@/components/games/GamePlayer";
import { GAME_ICONS } from "@/components/games/icons";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const g = await db.game.findUnique({ where: { id: (await params).id }, select: { title: true } });
  return { title: g?.title ?? (await getT())("Ойын") };
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  const user = await getCurrentUser();
  const g = await db.game.findUnique({ where: { id }, include: { questions: { orderBy: { order: "asc" } }, topic: true } });
  if (!g || (!g.published && user?.role !== "ADMIN")) notFound();
  const fav = user ? await db.favorite.findFirst({ where: { userId: user.id, gameId: id } }) : null;
  const seed = Math.floor(Math.random() * 1000);
  const questions = g.questions.map((q) => publicQuestion(g.type, q as QuestionRow, seed));
  const I = GAME_ICONS[g.type];
  const gt = GAME_TYPES.find((x) => x.key === g.type);

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={[{ href: "/games", label: t("Ойындар") }, { label: g.title }]} />
      <header className="mt-5 mb-6 flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lilac-100 to-sky-100 text-lilac-500"><I className="h-7 w-7" /></span>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold">{g.title}</h1>
          <p className="muted text-sm mt-1">{gt && t(gt.name)} · {t("{g}-сынып", { g: g.gradeId })}{g.topic ? ` · ${g.topic.title}` : ""}</p>
          {g.description && <p className="mt-2 text-ink-soft">{g.description}</p>}
        </div>
        <FavoriteButton target={{ gameId: g.id }} initial={!!fav} loggedIn={!!user} />
      </header>
      <GamePlayer
        gameId={g.id}
        type={g.type}
        title={g.title}
        questions={questions as never}
        timeLimit={g.timeLimit}
        layout={g.type === "CROSSWORD" ? crosswordLayout(g.questions) : null}
        loggedIn={!!user}
      />
    </div>
  );
}
