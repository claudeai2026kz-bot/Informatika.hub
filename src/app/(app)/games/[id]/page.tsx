import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GAME_TYPES } from "@/lib/labels";
import { crosswordLayout, publicQuestion, type QuestionRow } from "@/lib/games";
import Link from "next/link";
import { Pencil, Wand2, ArrowLeftRight, User } from "lucide-react";
import { isChoiceType } from "@/lib/labels";
import LiveLaunch from "@/components/games/live/LiveLaunch";
import Tug from "@/components/games/modes/Tug";
import Breadcrumbs from "@/components/Breadcrumbs";
import FavoriteButton from "@/components/FavoriteButton";
import GamePlayer from "@/components/games/GamePlayer";
import SendToStudents from "@/components/games/SendToStudents";
import { GAME_ICONS } from "@/components/games/icons";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const g = await db.game.findUnique({ where: { id: (await params).id }, select: { title: true } });
  return { title: g?.title ?? (await getT())("Ойын") };
}

export default async function GamePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ as?: string }> }) {
  const t = await getT();
  const { id } = await params;
  const { as } = await searchParams;
  const user = await getCurrentUser();
  const g = await db.game.findUnique({ where: { id }, include: { questions: { orderBy: { order: "asc" } }, topic: true } });
  if (!g || (!g.published && user?.role !== "ADMIN")) notFound();
  const mine = !!user && g.authorId === user.id;
  const fav = user ? await db.favorite.findFirst({ where: { userId: user.id, gameId: id } }) : null;
  const sentCount = user ? await db.studentResult.count({ where: { gameId: id, teacherId: user.id } }) : 0;
  const solo = GAME_TYPES.find((x) => x.key === g.type)?.mode === "solo";
  const classes = user && solo && g.published && (!g.authorId || mine)
    ? (await db.classroom.findMany({ where: { teacherId: user.id }, orderBy: [{ gradeId: "asc" }, { name: "asc" }], select: { id: true, name: true, games: { where: { gameId: id }, select: { id: true } } } }))
        .map((c) => ({ id: c.id, name: c.name, has: c.games.length > 0 }))
    : undefined;
  const seed = Math.floor(Math.random() * 1000);
  const asTug = as === "tug" && isChoiceType(g.type);
  const practice = as === "solo" && g.type === "LIVE";
  const questions = g.questions.map((q) => publicQuestion(asTug ? "TUGOFWAR" : g.type, q as QuestionRow, seed));
  const board = asTug || ["TUGOFWAR", "BOARD", "LIVE", "TEAMESCAPE"].includes(g.type);
  const I = GAME_ICONS[g.type];
  const gt = GAME_TYPES.find((x) => x.key === g.type);

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={[mine ? { href: "/games/my", label: t("Менің ойындарым") } : { href: "/games", label: t("Ойындар") }, { label: g.title }]} />
      <header className="mt-5 mb-6 flex items-start gap-3 sm:gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lilac-100 to-sky-100 text-lilac-500"><I className="h-7 w-7" /></span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold">{g.title}</h1>
          <p className="muted text-sm mt-1">{gt && t(gt.name)} · {t("{g}-сынып", { g: g.gradeId })}{g.topic ? ` · ${g.topic.title}` : ""}</p>
          {g.description && <p className="mt-2 text-ink-soft">{g.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {mine && <Link href={`/games/${g.id}/edit`} className="btn-soft btn-sm"><Pencil className="h-4 w-4" /> {t("Сұрақтарды өзгерту")}</Link>}
            <Link href={`/games/new?from=${g.id}`} className="btn-ghost btn-sm"><Wand2 className="h-4 w-4" /> {t(mine ? "Көшірмесін жасау" : "Өз тақырыбыма бейімдеу")}</Link>
          </div>
          {isChoiceType(g.type) && g.questions.length > 0 && (g.type !== "TUGOFWAR" || !!user) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-sky-50 p-2.5">
              <span className="px-1 text-xs font-bold uppercase tracking-wide text-sky-700">{t("Басқаша ойнау:")}</span>
              {(asTug || practice) && <Link href={`/games/${g.id}`} className="btn-ghost btn-sm"><User className="h-4 w-4" /> {t("Негізгі түрі")}</Link>}
              {g.type === "LIVE" && !practice && <Link href={`/games/${g.id}?as=solo`} className="btn-ghost btn-sm"><User className="h-4 w-4" /> {t("Жеке жаттығу")}</Link>}
              {g.type !== "TUGOFWAR" && !asTug && <Link href={`/games/${g.id}?as=tug`} className="btn-soft btn-sm"><ArrowLeftRight className="h-4 w-4" /> {t("Арқан тарту (тақтада)")}</Link>}
              {g.type !== "LIVE" && <LiveLaunch gameId={g.id} loggedIn={!!user} compact />}
            </div>
          )}
        </div>
        <FavoriteButton target={{ gameId: g.id }} initial={!!fav} loggedIn={!!user} />
      </header>
      {!board && <SendToStudents gameId={g.id} title={g.title} teacherId={user?.id ?? null} results={sentCount} classes={classes} />}
      {asTug ? <Tug questions={questions as never} /> : <GamePlayer
        gameId={g.id}
        type={g.type}
        title={g.title}
        questions={questions as never}
        timeLimit={g.timeLimit}
        layout={g.type === "CROSSWORD" ? crosswordLayout(g.questions) : null}
        loggedIn={!!user}
        practice={practice}
      />}
    </div>
  );
}
