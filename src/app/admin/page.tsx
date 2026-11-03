import Link from "next/link";
import { Users, Layers, Download, Eye, ClipboardCheck, Gamepad2, MessageSquare, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/labels";

export default async function AdminHome() {
  await requireAdmin();
  const [users, materials, drafts, sums, asm, games, comments, logs, top] = await Promise.all([
    db.user.count(),
    db.material.count(),
    db.material.count({ where: { published: false } }),
    db.material.aggregate({ _sum: { downloads: true, views: true } }),
    db.assessment.count(),
    db.game.count(),
    db.comment.count(),
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    db.material.findMany({ orderBy: { downloads: "desc" }, take: 5, select: { id: true, title: true, downloads: true, views: true } }),
  ]);
  const actors = new Map((await db.user.findMany({ where: { id: { in: logs.map((l) => l.actorId ?? "") } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));
  const cards = [
    { i: Users, n: users, l: "Тіркелген пайдаланушы", c: "bg-sky-100 text-sky-600" },
    { i: Layers, n: materials, l: `Материал (${drafts} жоба)`, c: "bg-lilac-100 text-lilac-500" },
    { i: Download, n: sums._sum.downloads ?? 0, l: "Жүктеу", c: "bg-emerald-100 text-emerald-600" },
    { i: Eye, n: sums._sum.views ?? 0, l: "Қаралым", c: "bg-amber-100 text-amber-600" },
    { i: ClipboardCheck, n: asm, l: "БЖБ / ТЖБ", c: "bg-rose-100 text-rose-500" },
    { i: Gamepad2, n: games, l: "Ойын", c: "bg-teal-100 text-teal-600" },
    { i: MessageSquare, n: comments, l: "Пікір", c: "bg-orange-100 text-orange-500" },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Басқару тақтасы</h1>
        <div className="flex gap-2">
          <Link href="/admin/materials/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Материал</Link>
          <Link href="/admin/games/new" className="btn-ghost btn-sm"><Plus className="h-4 w-4" /> Ойын</Link>
        </div>
      </div>
      <div className="mt-6 grid gap-4 grid-cols-2 xl:grid-cols-4">
        {cards.map(({ i: I, n, l, c }) => (
          <div key={l} className="card p-5 flex items-center gap-4">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${c}`}><I className="h-6 w-6" /></span>
            <div><div className="text-2xl font-extrabold">{n.toLocaleString("kk-KZ")}</div><div className="text-sm muted">{l}</div></div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-bold mb-4">Соңғы әрекеттер</h2>
          <ul className="space-y-3 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex justify-between gap-3"><span><b>{actors.get(l.actorId ?? "") ?? "Жүйе"}</b>: {l.action}{l.target && l.target.length < 60 ? ` · ${l.target}` : ""}</span><span className="muted shrink-0">{formatDate(l.createdAt)}</span></li>
            ))}
            {logs.length === 0 && <li className="muted">Әзірге әрекет жоқ.</li>}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="font-bold mb-4">Көп жүктелген материалдар</h2>
          <ul className="space-y-3 text-sm">
            {top.map((m) => (
              <li key={m.id} className="flex justify-between gap-3"><Link href={`/admin/materials/${m.id}`} className="hover:text-sky-600 line-clamp-1">{m.title}</Link><span className="muted shrink-0">{m.downloads} жүктеу · {m.views} қаралым</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
