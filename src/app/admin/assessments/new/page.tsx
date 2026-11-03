import { requireAdmin } from "@/lib/auth";
import { loadTopicOpts } from "@/lib/topics";
import AssessmentForm from "@/components/admin/AssessmentForm";

export default async function NewAssessment() {
  await requireAdmin();
  return (<div><h1 className="text-3xl font-extrabold mb-6">Жаңа БЖБ / ТЖБ</h1><AssessmentForm a={null} topics={await loadTopicOpts()} /></div>);
}
