import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus, Eye, Download } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { GRADES, MATERIAL_TYPES, QUARTER_LABELS, formatDate } from "@/lib/labels";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { FormAlert } from "@/components/ui/Field";
import { deleteMaterial, toggleMaterialPublished } from "@/app/actions/admin";

export const metadata = { title: "Материалдар" };

export default async function MaterialsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; grade?: string; type?: string; status?: string; saved?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const where: Prisma.MaterialWhereInput = {
    ...(sp.q && { title: { contains: sp.q, mode: "insensitive" } }),
    ...(Number(sp.grade) && { gradeId: Number(sp.grade) }),
    ...(sp.type && { type: { key: sp.type } }),
    ...(sp.status === "draft" && { published: false }), ...(sp.status === "published" && { published: true }),
  };
  const items = await db.material.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { type: true, quarter: true, topic: true } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Материалдар</h1>
        <Link href="/admin/materials/new" className="btn-primary"><Plus className="h-4 w-4" /> Жаңа материал</Link>
      </div>
      {sp.saved && <div className="mt-4"><FormAlert tone="ok" msg="Материал сақталды" /></div>}
      <form className="mt-5 grid gap-2 sm:grid-cols-5">
        <input name="q" defaultValue={sp.q} className="input sm:col-span-2" placeholder="Атауы бойынша іздеу" aria-label="Іздеу" />
        <select name="grade" defaultValue={sp.grade ?? ""} className="input" aria-label="Сынып"><option value="">Барлық сынып</option>{GRADES.map((g) => <option key={g} value={g}>{g}-сынып</option>)}</select>
        <select name="type" defaultValue={sp.type ?? ""} className="input" aria-label="Түрі"><option value="">Барлық түр</option>{MATERIAL_TYPES.map((t) => <option key={t.key} value={t.key}>{t.one}</option>)}</select>
        <div className="flex gap-2">
          <select name="status" defaultValue={sp.status ?? ""} className="input" aria-label="Күйі"><option value="">Барлығы</option><option value="published">Жарияланған</option><option value="draft">Жоба</option></select>
          <button className="btn-soft">Сүзу</button>
        </div>
      </form>
      <div className="mt-5 card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-sky-50 text-left text-ink-soft"><tr><th className="px-4 py-3">Материал</th><th className="px-4 py-3">Орны</th><th className="px-4 py-3">Статистика</th><th className="px-4 py-3">Күйі</th><th className="px-4 py-3 text-right">Әрекеттер</th></tr></thead>
          <tbody className="divide-y divide-sky-100">
            {items.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 max-w-xs"><Link href={`/admin/materials/${m.id}`} className="font-semibold hover:text-sky-600 line-clamp-2">{m.title}</Link><div className="text-xs muted">{m.type.name} · {m.fileName ?? (m.videoUrl ? "Видео" : "Сілтеме")} · {formatDate(m.createdAt)}</div></td>
                <td className="px-4 py-3 text-xs muted">{m.gradeId}-сынып · {QUARTER_LABELS[m.quarter.number]}<br />{m.topic?.title ?? "Тақырыпсыз"}</td>
                <td className="px-4 py-3 text-xs muted whitespace-nowrap"><Eye className="inline h-3.5 w-3.5" /> {m.views} · <Download className="inline h-3.5 w-3.5" /> {m.downloads}</td>
                <td className="px-4 py-3"><span className={`chip ${m.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{m.published ? "Жарияланған" : "Жоба"}</span></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2">
                  <Link href={`/materials/${m.id}`} className="btn-ghost btn-sm">Қарау</Link>
                  <Link href={`/admin/materials/${m.id}`} className="btn-ghost btn-sm">Өңдеу</Link>
                  <ConfirmButton className="btn-soft btn-sm" action={toggleMaterialPublished.bind(null, m.id)}>{m.published ? "Жасыру" : "Жариялау"}</ConfirmButton>
                  <ConfirmButton action={deleteMaterial.bind(null, m.id)} confirm={`«${m.title}» материалын біржола жою керек пе?`}>Жою</ConfirmButton>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-10 text-center muted">Материал табылмады.</p>}
      </div>
    </div>
  );
}
