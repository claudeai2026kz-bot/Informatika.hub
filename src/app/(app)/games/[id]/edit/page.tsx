import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadTopicOpts } from "@/lib/topics";
import { loadDraft } from "@/lib/game-draft";
import GameEditor from "@/components/admin/GameEditor";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getT())("Ойынды өзгерту") };
}

export default async function EditMyGame({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  const user = await requireUser(`/games/${id}/edit`);
  const d = await loadDraft(id);
  if (!d || d.authorId !== user.id) notFound();
  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={[{ href: "/games/my", label: t("Менің ойындарым") }, { href: `/games/${id}`, label: d.title }, { label: t("Өзгерту") }]} />
      <h1 className="mt-5 mb-6 text-3xl font-extrabold">{t("Ойынды өзгерту")}</h1>
      <GameEditor mode="teacher" initial={d} topics={await loadTopicOpts()} />
    </div>
  );
}
