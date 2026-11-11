import Link from "next/link";
import { Plus, Pencil, Play, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { GAME_TYPES } from "@/lib/labels";
import { GAME_ICONS } from "@/components/games/icons";
import DeleteMyGame from "@/components/games/DeleteMyGame";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getT())("Менің ойындарым") };
}

export default async function MyGames() {
  const t = await getT();
  const user = await requireUser("/games/my");
  const games = await db.game.findMany({
    where: { authorId: user.id }, orderBy: { updatedAt: "desc" },
    include: { _count: { select: { questions: true, studentResults: true } }, topic: true },
  });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t("Менің ойындарым")}</h1>
          <p className="mt-1 muted">{t("Өзіңіз жасаған ойындар. Оларды тек сіз және сілтеме алған оқушыларыңыз көреді.")}</p>
        </div>
        <Link href="/games/new" className="btn-primary"><Plus className="h-4 w-4" /> {t("Жаңа ойын жасау")}</Link>
      </div>
      <div className="mt-4 rounded-xl bg-sky-50 p-4 text-sm text-sky-800">
        {t("Кеңес: дайын ойындардың кез келгенін ашып, «Өз тақырыбыма бейімдеу» батырмасын бассаңыз, сұрақтарын өзгертіп, өз ойыныңызды тез жасай аласыз.")} <Link href="/games" className="font-semibold underline">{t("Дайын ойындар")}</Link>
      </div>
      {games.length === 0 ? (
        <div className="card mt-6 p-10 text-center muted">{t("Әзірге ойын жасамағансыз.")}</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => {
            const I = GAME_ICONS[g.type];
            const gt = GAME_TYPES.find((x) => x.key === g.type);
            return (
              <article key={g.id} className="card p-5 flex flex-col">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lilac-100 text-lilac-500"><I className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold leading-snug line-clamp-2"><Link href={`/games/${g.id}`} className="hover:text-sky-600">{g.title}</Link></h3>
                    <p className="mt-1 text-xs muted">{gt && t(gt.name)} · {t("{g}-сынып", { g: g.gradeId })} · {t("{n} сұрақ", { n: g._count.questions })}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm muted flex items-center gap-1.5"><Users className="h-4 w-4" /> {t("Оқушылар нәтижесі ({n})", { n: g._count.studentResults })}</p>
                <div className="mt-auto pt-4 flex flex-wrap gap-2">
                  <Link href={`/games/${g.id}`} className="btn-primary btn-sm"><Play className="h-4 w-4" /> {t("Ашу")}</Link>
                  <Link href={`/games/${g.id}/edit`} className="btn-soft btn-sm"><Pencil className="h-4 w-4" /> {t("Өзгерту")}</Link>
                  <DeleteMyGame id={g.id} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
