import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { GAME_TYPES } from "@/lib/labels";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { FormAlert } from "@/components/ui/Field";
import { deleteGame } from "@/app/actions/admin";
import { GAME_ICONS } from "@/components/games/icons";

export const metadata = { title: "Ойындар" };

export default async function GamesAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const games = await db.game.findMany({ where: { authorId: null }, orderBy: { createdAt: "desc" }, include: { _count: { select: { questions: true, results: true } } } });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold">Ойындар</h1><Link href="/admin/games/new" className="btn-primary"><Plus className="h-4 w-4" /> Жаңа ойын</Link></div>
      {saved && <div className="mt-4"><FormAlert tone="ok" msg="Ойын сақталды" /></div>}
      <div className="mt-6 card divide-y divide-sky-100">
        {games.map((g) => {
          const I = GAME_ICONS[g.type];
          return (
            <div key={g.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <I className="h-6 w-6 text-lilac-500" />
              <div className="flex-1 min-w-[200px]"><div className="font-semibold">{g.title}</div><div className="text-xs muted">{GAME_TYPES.find((t) => t.key === g.type)?.name} · {g.gradeId}-сынып · {g._count.questions} сұрақ · {g.plays} рет ойналды · {g.published ? "жарияланған" : "жоба"}</div></div>
              <Link href={`/games/${g.id}`} className="btn-ghost btn-sm">Ойнап көру</Link>
              <Link href={`/admin/games/${g.id}`} className="btn-ghost btn-sm">Өңдеу</Link>
              <ConfirmButton action={deleteGame.bind(null, g.id)} confirm={`«${g.title}» ойынын жою керек пе?`}>Жою</ConfirmButton>
            </div>
          );
        })}
        {games.length === 0 && <p className="p-10 text-center muted">Әзірге ойын жоқ.</p>}
      </div>
    </div>
  );
}
