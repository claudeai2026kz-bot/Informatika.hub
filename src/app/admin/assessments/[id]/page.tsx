import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadTopicOpts } from "@/lib/topics";
import AssessmentForm from "@/components/admin/AssessmentForm";

export default async function EditAssessment({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const a = await db.assessment.findUnique({ where: { id: (await params).id }, include: { quarter: true } });
  if (!a) notFound();
  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">БЖБ / ТЖБ өңдеу</h1>
      <AssessmentForm topics={await loadTopicOpts()} a={{ id: a.id, kind: a.kind, title: a.title, description: a.description, grade: a.gradeId, quarter: a.quarter.number, topicId: a.topicId, variant: a.variant, answers: a.answers, criteria: a.criteria, descriptors: a.descriptors, published: a.published, fileName: a.fileName, hasAnswersFile: !!a.answersPath }} />
    </div>
  );
}
