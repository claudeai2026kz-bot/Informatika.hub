import { requireAdmin } from "@/lib/auth";
import { loadTopicOpts } from "@/lib/topics";
import GameEditor from "@/components/admin/GameEditor";

export default async function NewGame() {
  await requireAdmin();
  return (<div><h1 className="text-3xl font-extrabold mb-6">Жаңа ойын</h1><GameEditor initial={null} topics={await loadTopicOpts()} /></div>);
}
