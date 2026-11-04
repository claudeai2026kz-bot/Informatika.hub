import { requireAdmin } from "@/lib/auth";
import { loadTopicOpts } from "@/lib/topics";
import AssessmentForm from "@/components/admin/AssessmentForm";

export default async function NewAssessment({ searchParams }: { searchParams: Promise<{ kind?: string; grade?: string; quarter?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const preset = {
    kind: sp.kind === "TZHB" ? "TZHB" : "BZHB",
    grade: Number(sp.grade) || undefined,
    quarter: Number(sp.quarter) || undefined,
  };
  return (<div><h1 className="text-3xl font-extrabold mb-6">Жаңа БЖБ / ТЖБ</h1><AssessmentForm a={null} topics={await loadTopicOpts()} preset={preset} /></div>);
}
