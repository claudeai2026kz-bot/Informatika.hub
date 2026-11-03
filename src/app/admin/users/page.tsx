import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/labels";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { setUserBlocked, setUserRole } from "@/app/actions/admin";

export const metadata = { title: "Пайдаланушылар" };

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ q?: string; u?: string }> }) {
  const me = await requireAdmin();
  const { q = "", u } = await searchParams;
  const users = await db.user.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" }, take: 100,
    include: { role: true, _count: { select: { comments: true, history: true, favorites: true } } },
  });
  const detail = u ? await db.user.findUnique({ where: { id: u }, include: { role: true, history: { orderBy: { createdAt: "desc" }, take: 8, include: { material: { select: { title: true } }, assessment: { select: { title: true } } } } } }) : null;

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Пайдаланушылар</h1>
      <form className="mt-5 flex gap-2 max-w-lg">
        <input name="q" defaultValue={q} className="input" placeholder="Аты немесе email бойынша іздеу" aria-label="Іздеу" />
        <button className="btn-primary">Іздеу</button>
      </form>

      {detail && (
        <div className="mt-6 card p-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div><h2 className="text-xl font-bold">{detail.name}</h2><p className="muted text-sm">{detail.email} · {detail.role.name} · тіркелген: {formatDate(detail.createdAt)}{detail.blocked ? " · БҰҒАТТАЛҒАН" : ""}</p></div>
            <a href="/admin/users" className="btn-ghost btn-sm">Жабу</a>
          </div>
          <h3 className="mt-4 font-semibold text-sm">Соңғы әрекеттері</h3>
          <ul className="mt-2 text-sm space-y-1 muted">
            {detail.history.map((h) => <li key={h.id}>{h.action === "VIEW" ? "Қарады" : "Жүктеді"}: {h.material?.title ?? h.assessment?.title} · {formatDate(h.createdAt)}</li>)}
            {detail.history.length === 0 && <li>Әрекет жоқ</li>}
          </ul>
        </div>
      )}

      <div className="mt-6 card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-sky-50 text-left text-ink-soft">
            <tr><th className="px-4 py-3">Пайдаланушы</th><th className="px-4 py-3">Рөлі</th><th className="px-4 py-3">Белсенділік</th><th className="px-4 py-3">Тіркелген</th><th className="px-4 py-3 text-right">Әрекеттер</th></tr>
          </thead>
          <tbody className="divide-y divide-sky-100">
            {users.map((x) => (
              <tr key={x.id} className={x.blocked ? "bg-rose-50/50" : ""}>
                <td className="px-4 py-3"><a href={`/admin/users?u=${x.id}`} className="font-semibold hover:text-sky-600">{x.name}</a><div className="muted text-xs">{x.email}</div></td>
                <td className="px-4 py-3"><span className={`chip ${x.role.key === "ADMIN" ? "bg-gold-100 text-gold-500" : ""}`}>{x.role.name}</span>{x.blocked && <span className="chip ml-1 bg-rose-100 text-rose-600">Бұғатталған</span>}</td>
                <td className="px-4 py-3 muted text-xs">{x._count.history} әрекет · {x._count.comments} пікір · {x._count.favorites} таңдаулы</td>
                <td className="px-4 py-3 muted text-xs whitespace-nowrap">{formatDate(x.createdAt)}</td>
                <td className="px-4 py-3">
                  {x.id === me.id ? <span className="text-xs muted float-right">Бұл сіз</span> : (
                    <div className="flex justify-end gap-2">
                      <ConfirmButton className="btn-ghost btn-sm" action={setUserRole.bind(null, x.id, x.role.key === "ADMIN" ? "USER" : "ADMIN")} confirm={x.role.key === "ADMIN" ? "Әкімші рөлін алып тастау керек пе?" : "Бұл пайдаланушыға әкімші рөлін беру керек пе?"}>
                        {x.role.key === "ADMIN" ? "Пайдаланушы ету" : "Әкімші ету"}
                      </ConfirmButton>
                      <ConfirmButton className={x.blocked ? "btn-soft btn-sm" : "btn-danger btn-sm"} action={setUserBlocked.bind(null, x.id, !x.blocked)} confirm={x.blocked ? undefined : "Аккаунтты бұғаттау керек пе?"}>
                        {x.blocked ? "Бұғатты алу" : "Бұғаттау"}
                      </ConfirmButton>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
