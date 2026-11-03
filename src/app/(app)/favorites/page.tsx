import Link from "next/link";
import { Heart, ClipboardCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GAME_TYPES, QUARTER_LABELS } from "@/lib/labels";
import MaterialCard, { materialCardSelect } from "@/components/MaterialCard";
import FavoriteButton from "@/components/FavoriteButton";
import { GAME_ICONS } from "@/components/games/icons";

export const metadata = { title: "Таңдаулылар" };

const TABS = [
  { k: "all", l: "Барлығы" },
  { k: "PRESENTATION", l: "Презентациялар" },
  { k: "PRACTICE", l: "Тапсырмалар" },
  { k: "other", l: "Басқа материалдар" },
  { k: "assessments", l: "БЖБ / ТЖБ" },
  { k: "games", l: "Ойындар" },
];

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser("/favorites");
  const tab = (await searchParams).tab ?? "all";
  const favs = await db.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      material: { select: { ...materialCardSelect, published: true } },
      assessment: { include: { quarter: true } },
      game: { include: { _count: { select: { questions: true } } } },
    },
  });
  const mats = favs.flatMap((f) => (f.material?.published ? [f.material] : []));
  const shownMats = tab === "all" ? mats : tab === "other" ? mats.filter((m) => !["PRESENTATION", "PRACTICE"].includes(m.type.key)) : mats.filter((m) => m.type.key === tab);
  const asm = favs.flatMap((f) => (f.assessment?.published ? [f.assessment] : []));
  const games = favs.flatMap((f) => (f.game?.published ? [f.game] : []));
  const showMats = !["assessments", "games"].includes(tab);
  const showAsm = tab === "all" || tab === "assessments";
  const showGames = tab === "all" || tab === "games";
  const empty = (showMats ? shownMats.length : 0) + (showAsm ? asm.length : 0) + (showGames ? games.length : 0) === 0;

  return (
    <div>
      <h1 className="text-3xl font-extrabold flex items-center gap-3"><Heart className="h-8 w-8 text-rose-500 fill-rose-500" /> Таңдаулылар</h1>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Link key={t.k} href={`/favorites?tab=${t.k}`} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === t.k ? "bg-gradient-to-r from-sky-500 to-lilac-500 text-white" : "bg-white border border-sky-100 hover:border-sky-300"}`}>{t.l}</Link>
        ))}
      </div>

      {empty && (
        <div className="mt-8 card p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-rose-300" />
          <p className="mt-3 font-semibold">Мұнда әзірге ештеңе жоқ</p>
          <p className="mt-1 text-sm muted">Материалдағы ♥ белгісін бассаңыз, ол осында сақталады.</p>
          <Link href="/materials" className="btn-primary mt-5">Материалдарды қарау</Link>
        </div>
      )}

      {showMats && shownMats.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold mb-3">Материалдар</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shownMats.map((m) => <MaterialCard key={m.id} m={m} fav loggedIn />)}</div>
        </section>
      )}
      {showAsm && asm.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold mb-3">БЖБ / ТЖБ</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {asm.map((a) => (
              <div key={a.id} className="card card-hover p-5 flex items-start gap-3">
                <ClipboardCheck className="h-6 w-6 text-sky-500 shrink-0" />
                <div className="flex-1 min-w-0"><Link href={`/assessments/${a.id}`} className="font-bold hover:text-sky-600">{a.title}</Link><p className="text-xs muted mt-1">{a.kind === "BZHB" ? "БЖБ" : "ТЖБ"} · {a.gradeId}-сынып · {QUARTER_LABELS[a.quarter.number]}</p></div>
                <FavoriteButton target={{ assessmentId: a.id }} initial loggedIn />
              </div>
            ))}
          </div>
        </section>
      )}
      {showGames && games.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold mb-3">Ойындар</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => {
              const I = GAME_ICONS[g.type];
              return (
                <div key={g.id} className="card card-hover p-5 flex items-start gap-3">
                  <I className="h-6 w-6 text-lilac-500 shrink-0" />
                  <div className="flex-1 min-w-0"><Link href={`/games/${g.id}`} className="font-bold hover:text-sky-600">{g.title}</Link><p className="text-xs muted mt-1">{GAME_TYPES.find((t) => t.key === g.type)?.name} · {g._count.questions} сұрақ</p></div>
                  <FavoriteButton target={{ gameId: g.id }} initial loggedIn />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
