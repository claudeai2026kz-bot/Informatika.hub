import Link from "next/link";
import type { GameType, Prisma } from "@prisma/client";
import { Play } from "lucide-react";
import { GAME_ICONS } from "@/components/games/icons";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GAME_TYPES, GRADES } from "@/lib/labels";
import FilterBar from "@/components/FilterBar";
import FavoriteButton from "@/components/FavoriteButton";

export const metadata = { title: "Интерактивті ойындар" };

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ type?: string; grade?: string; topic?: string; q?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const type = GAME_TYPES.some((t) => t.key === sp.type) ? (sp.type as GameType) : undefined;
  const grade = Number(sp.grade) || undefined;
  const topic = Number(sp.topic) || undefined;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const where: Prisma.GameWhereInput = {
    published: true, ...(type && { type }), ...(grade && { gradeId: grade }), ...(topic && { topicId: topic }),
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }),
  };
  const [games, topics, favs] = await Promise.all([
    db.game.findMany({ where, orderBy: { createdAt: "desc" }, include: { _count: { select: { questions: true } }, topic: true } }),
    grade ? db.topic.findMany({ where: { quarter: { gradeId: grade } }, select: { id: true, title: true }, orderBy: [{ quarterId: "asc" }, { order: "asc" }] }) : [],
    user ? db.favorite.findMany({ where: { userId: user.id, gameId: { not: null } }, select: { gameId: true } }) : [],
  ]);
  const favSet = new Set(favs.map((f) => f.gameId));

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Интерактивті ойындар</h1>
      <p className="mt-1 muted">Сабақта оқушылармен бірге ойнаңыз: ұпай автоматты есептеледі.</p>
      <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {GAME_TYPES.map((t) => {
          const I = GAME_ICONS[t.key];
          const on = type === t.key;
          const s = new URLSearchParams(Object.entries({ ...sp, type: on ? undefined : t.key }).filter(([, v]) => v) as [string, string][]);
          return (
            <Link key={t.key} href={`/games?${s}`} className={`card card-hover p-3 text-center ${on ? "!border-lilac-400 ring-4 ring-lilac-100" : ""}`} aria-pressed={on}>
              <I className="mx-auto h-6 w-6 text-lilac-500" />
              <div className="mt-1.5 text-xs font-semibold leading-tight">{t.name}</div>
            </Link>
          );
        })}
      </div>
      <div className="mt-4">
        <FilterBar placeholder="Ойын атауы бойынша іздеу…" filters={[
          { name: "grade", label: "Сынып", options: GRADES.map((g) => ({ value: String(g), label: `${g}-сынып` })) },
          { name: "topic", label: "Тақырып", options: topics.map((t) => ({ value: String(t.id), label: t.title })) },
        ]} />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => {
          const I = GAME_ICONS[g.type];
          return (
            <article key={g.id} className="card card-hover p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lilac-100 to-sky-100 text-lilac-500"><I className="h-6 w-6" /></span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold leading-snug">{g.title}</h3>
                  <p className="text-xs muted mt-0.5">{GAME_TYPES.find((t) => t.key === g.type)?.name} · {g.gradeId}-сынып · {g._count.questions} сұрақ</p>
                </div>
                <FavoriteButton target={{ gameId: g.id }} initial={favSet.has(g.id)} loggedIn={!!user} />
              </div>
              {g.description && <p className="mt-3 text-sm text-ink-soft line-clamp-2">{g.description}</p>}
              <Link href={`/games/${g.id}`} className="btn-primary btn-sm mt-auto self-start !mt-4"><Play className="h-4 w-4" /> Ойнау</Link>
            </article>
          );
        })}
        {games.length === 0 && <div className="card p-12 text-center muted sm:col-span-2 lg:col-span-3">Сүзгіге сай ойын табылмады.</div>}
      </div>
    </div>
  );
}
