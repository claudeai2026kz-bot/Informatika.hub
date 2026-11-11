import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getT())("Оқушылар нәтижесі") };
}

/** Мұғалім өз сілтемесі арқылы ойнаған оқушылардың нәтижесін көреді. */
export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  const user = await requireUser(`/games/${id}/results`);
  const g = await db.game.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!g) notFound();
  const rows = await db.studentResult.findMany({ where: { gameId: id, teacherId: user.id }, orderBy: { createdAt: "desc" }, take: 500 });
  const avg = rows.length ? rows.reduce((s, r) => s + (r.maxScore ? r.score / r.maxScore : 0), 0) / rows.length : 0;
  const fmt = new Intl.DateTimeFormat("kk-KZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" });

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={[{ href: "/games", label: t("Ойындар") }, { href: `/games/${g.id}`, label: g.title }, { label: t("Оқушылар нәтижесі") }]} />
      <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold">{t("Оқушылар нәтижесі")}</h1>
      <p className="muted mt-1">{g.title}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 max-w-md">
        <div className="card p-4"><div className="text-2xl font-extrabold">{rows.length}</div><div className="text-sm muted">{t("ойнады")}</div></div>
        <div className="card p-4"><div className="text-2xl font-extrabold">{Math.round(avg * 10 * 10) / 10} / 10</div><div className="text-sm muted">{t("орташа балл")}</div></div>
      </div>
      {rows.length === 0 ? (
        <div className="card p-10 mt-6 text-center muted">{t("Әзірге ешкім ойнаған жоқ. Сілтемені оқушыларға жіберіңіз.")}</div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left muted border-b border-sky-100">
              <th className="px-4 py-3">{t("Оқушы")}</th><th className="px-4 py-3">{t("Сынып")}</th><th className="px-4 py-3">{t("Балл")}</th><th className="px-4 py-3">{t("Уақыты")}</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-sky-50 last:border-0">
                  <td className="px-4 py-3 font-semibold">{r.studentName}</td>
                  <td className="px-4 py-3">{r.className || "—"}</td>
                  <td className="px-4 py-3"><span className={`chip ${r.score / Math.max(1, r.maxScore) >= 0.7 ? "bg-emerald-100 text-emerald-700" : r.score / Math.max(1, r.maxScore) >= 0.4 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{r.score} / {r.maxScore}</span></td>
                  <td className="px-4 py-3 muted">{fmt.format(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
