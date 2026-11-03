import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/labels";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deleteComment, setCommentHidden } from "@/app/actions/admin";

export const metadata = { title: "Пікірлер" };

export default async function CommentsAdmin({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin();
  const { show } = await searchParams;
  const items = await db.comment.findMany({
    where: show === "hidden" ? { hidden: true } : {},
    orderBy: { createdAt: "desc" }, take: 200,
    include: { user: { select: { name: true, email: true } }, material: { select: { id: true, title: true } }, assessment: { select: { id: true, title: true } } },
  });
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Пікірлер модерациясы</h1>
      <div className="mt-4 flex gap-2">
        <Link href="/admin/comments" className={`btn-sm btn ${show !== "hidden" ? "bg-sky-500 text-white" : "bg-white border border-sky-100"}`}>Барлығы</Link>
        <Link href="/admin/comments?show=hidden" className={`btn-sm btn ${show === "hidden" ? "bg-sky-500 text-white" : "bg-white border border-sky-100"}`}>Жасырылғандар</Link>
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((c) => {
          const t = c.material ?? c.assessment;
          return (
            <li key={c.id} className={`card p-5 ${c.hidden ? "opacity-70 !border-amber-200" : ""}`}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="text-sm"><b>{c.user.name}</b> <span className="muted">({c.user.email}) · {formatDate(c.createdAt)}</span></div>
                  {t && <Link href={c.material ? `/materials/${t.id}` : `/assessments/${t.id}`} className="text-xs text-sky-600 hover:underline">{t.title}</Link>}
                  <p className="mt-2 text-sm whitespace-pre-line break-words">{c.text}</p>
                </div>
                <div className="flex gap-2">
                  <ConfirmButton className="btn-ghost btn-sm" action={setCommentHidden.bind(null, c.id, !c.hidden)}>{c.hidden ? "Көрсету" : "Жасыру"}</ConfirmButton>
                  <ConfirmButton action={deleteComment.bind(null, c.id)} confirm="Пікірді біржола жою керек пе?">Жою</ConfirmButton>
                </div>
              </div>
            </li>
          );
        })}
        {items.length === 0 && <li className="card p-10 text-center muted">Пікір жоқ.</li>}
      </ul>
    </div>
  );
}
