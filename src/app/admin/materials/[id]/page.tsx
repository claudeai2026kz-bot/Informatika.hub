import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadTopicOpts } from "@/lib/topics";
import MaterialForm from "@/components/admin/MaterialForm";

export const metadata = { title: "Материалды өңдеу" };

export default async function EditMaterial({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const m = await db.material.findUnique({ where: { id: (await params).id }, include: { type: true, quarter: true } });
  if (!m) notFound();
  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">Материалды өңдеу</h1>
      <MaterialForm topics={await loadTopicOpts()} m={{ id: m.id, title: m.title, description: m.description, typeKey: m.type.key, grade: m.gradeId, quarter: m.quarter.number, topicId: m.topicId, videoUrl: m.videoUrl, externalUrl: m.externalUrl, published: m.published, fileName: m.fileName, hasPreview: !!m.previewPath }} />
    </div>
  );
}
