import { requireAdmin } from "@/lib/auth";
import { loadTopicOpts } from "@/lib/topics";
import MaterialForm from "@/components/admin/MaterialForm";

export const metadata = { title: "Жаңа материал" };

export default async function NewMaterial() {
  await requireAdmin();
  return (<div><h1 className="text-3xl font-extrabold mb-6">Жаңа материал қосу</h1><MaterialForm m={null} topics={await loadTopicOpts()} /></div>);
}
