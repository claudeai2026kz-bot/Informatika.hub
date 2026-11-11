import Link from "next/link";
import type { GameType, Prisma } from "@prisma/client";
import { Play, Plus, User, Users, UsersRound } from "lucide-react";
import { GAME_ICONS } from "@/components/games/icons";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GAME_MODES, GAME_TYPES, GRADES, type GameMode } from "@/lib/labels";
import FilterBar from "@/components/FilterBar";
import FavoriteButton from "@/components/FavoriteButton";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata() {
  return { title: (await getT())("Интерактивті ойындар") };
}

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ m?: string; type?: string; grade?: string; topic?: string; q?: string }> }) {
  const t = await getT();
  const sp = await searchParams;
  const user = await getCurrentUser();
  const typeRow = GAME_TYPES.find((t) => t.key === sp.type);
  const mode: GameMode = typeRow?.mode ?? (GAME_MODES.some((x) => x.key === sp.m) ? (sp.m as GameMode) : "solo");
  const type = typeRow && typeRow.mode === mode ? (typeRow.key as GameType) : undefined;
  const modeTypes = GAME_TYPES.filter((x) => x.mode === mode);
  const grade = Number(sp.grade) || undefined;
  const topic = Number(sp.topic) || undefined;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const where: Prisma.GameWhereInput = {
    published: true, authorId: null, type: type ?? { in: modeTypes.map((x) => x.key as GameType) }, ...(grade && { gradeId: grade }), ...(topic && { topicId: topic }),
    ...(q && { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }),
  };
  const counts = await db.game.groupBy({ by: ["type"], where: { published: true, authorId: null }, _count: true });
  const modeCount = (m: GameMode) => counts.filter((c) => GAME_TYPES.find((x) => x.key === c.type)?.mode === m).reduce((s, c) => s + c._count, 0);
  const MODE_ICON = { solo: User, pair: Users, group: UsersRound } as const;
  const MODE_STYLE = { solo: "from-sky-400 to-sky-600", pair: "from-lilac-400 to-lilac-600", group: "from-gold-400 to-orange-500" } as const;
  const [games, topics, favs] = await Promise.all([
    db.game.findMany({ where, orderBy: { createdAt: "desc" }, include: { _count: { select: { questions: true } }, topic: true } }),
    grade ? db.topic.findMany({ where: { quarter: { gradeId: grade } }, select: { id: true, title: true }, orderBy: [{ quarterId: "asc" }, { order: "asc" }] }) : [],
    user ? db.favorite.findMany({ where: { userId: user.id, gameId: { not: null } }, select: { gameId: true } }) : [],
  ]);
  const favSet = new Set(favs.map((f) => f.gameId));

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{t("Интерактивті ойындар")}</h1>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="mt-1 muted">{t("Сабақта оқушылармен бірге ойнаңыз: ұпай автоматты есептеледі.")}</p>
        <div className="flex gap-2">
          <Link href="/games/my" className="btn-ghost btn-sm">{t("Менің ойындарым")}</Link>
          <Link href="/games/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> {t("Өз ойынымды жасау")}</Link>
        </div>
      </div>
      <nav className="mt-6 grid grid-cols-3 gap-2 sm:gap-4" aria-label={t("Ойын форматы")}>
        {GAME_MODES.map((md) => {
          const I = MODE_ICON[md.key];
          const on = md.key === mode;
          const s = new URLSearchParams(Object.entries({ grade: sp.grade, q: sp.q, m: md.key }).filter(([, v]) => v) as [string, string][]);
          return (
            <Link key={md.key} href={`/games?${s}`} aria-current={on ? "page" : undefined}
              className={`group relative overflow-hidden rounded-2xl border-2 p-3 sm:p-5 transition ${on ? "border-transparent text-white shadow-lg" : "border-sky-100 bg-white hover:border-sky-300"}`}>
              {on && <span className={`absolute inset-0 bg-gradient-to-br ${MODE_STYLE[md.key]}`} aria-hidden />}
              <span className="relative flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left">
                <span className={`grid h-11 w-11 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-2xl ${on ? "bg-white/20" : `bg-gradient-to-br ${MODE_STYLE[md.key]} text-white`}`}><I className="h-6 w-6 sm:h-7 sm:w-7" /></span>
                <span>
                  <span className="block text-base sm:text-xl font-extrabold">{t(md.name)}</span>
                  <span className={`hidden sm:block text-sm ${on ? "text-white/85" : "muted"}`}>{t(md.desc)}</span>
                  <span className={`mt-0.5 block text-xs font-semibold ${on ? "text-white/90" : "text-sky-600"}`}>{t("{n} ойын", { n: modeCount(md.key) })}</span>
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
      <div className={`mt-4 grid gap-2 ${modeTypes.length > 4 ? "grid-cols-3 sm:grid-cols-5 lg:grid-cols-7" : "grid-cols-3"}`}>
        {modeTypes.map((gt) => {
          const I = GAME_ICONS[gt.key];
          const on = type === gt.key;
          const s = new URLSearchParams(Object.entries({ ...sp, m: mode, type: on ? undefined : gt.key }).filter(([, v]) => v) as [string, string][]);
          return (
            <Link key={gt.key} href={`/games?${s}`} className={`card card-hover p-3 text-center ${on ? "!border-lilac-400 ring-4 ring-lilac-100" : ""}`} aria-pressed={on}>
              <I className="mx-auto h-6 w-6 text-lilac-500" />
              <div className="mt-1.5 text-xs font-semibold leading-tight">{t(gt.name)}</div>
            </Link>
          );
        })}
      </div>
      <div className="mt-4">
        <FilterBar placeholder={t("Ойын атауы бойынша іздеу…")} filters={[
          { name: "grade", label: t("Сынып"), options: GRADES.map((g) => ({ value: String(g), label: t("{g}-сынып", { g }) })) },
          { name: "topic", label: t("Тақырып"), options: topics.map((x) => ({ value: String(x.id), label: x.title })) },
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
                  <p className="text-xs muted mt-0.5">{t(GAME_TYPES.find((x) => x.key === g.type)?.name ?? "")} · {t("{g}-сынып", { g: g.gradeId })} · {t("{n} сұрақ", { n: g._count.questions })}</p>
                </div>
                <FavoriteButton target={{ gameId: g.id }} initial={favSet.has(g.id)} loggedIn={!!user} />
              </div>
              {g.description && <p className="mt-3 text-sm text-ink-soft line-clamp-2">{g.description}</p>}
              <Link href={`/games/${g.id}`} className="btn-primary btn-sm mt-auto self-start !mt-4"><Play className="h-4 w-4" /> {t("Ойнау")}</Link>
            </article>
          );
        })}
        {games.length === 0 && <div className="card p-12 text-center muted sm:col-span-2 lg:col-span-3">{t("Сүзгіге сай ойын табылмады.")}</div>}
      </div>
    </div>
  );
}
