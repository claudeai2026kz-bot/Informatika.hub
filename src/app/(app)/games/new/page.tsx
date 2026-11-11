import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadTopicOpts } from "@/lib/topics";
import { loadDraft } from "@/lib/game-draft";
import GameEditor from "@/components/admin/GameEditor";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getT())("Жаңа ойын жасау") };
}

/** Мұғалім жаңа ойын жасайды. ?from=<ойын> болса — сол ойынның көшірмесінен бастайды. */
export default async function NewMyGame({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const t = await getT();
  const { from } = await searchParams;
  await requireUser(`/games/new${from ? `?from=${from}` : ""}`);
  let initial = null;
  if (from) {
    const d = await loadDraft(from);
    if (!d || !d.published) notFound();
    initial = { ...d, title: `${d.title} (${t("менің нұсқам")})` };
  }
  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumbs items={[{ href: "/games", label: t("Ойындар") }, { href: "/games/my", label: t("Менің ойындарым") }, { label: t("Жаңа ойын") }]} />
      <h1 className="mt-5 text-3xl font-extrabold">{t(from ? "Ойынды өз тақырыбыма бейімдеу" : "Жаңа ойын жасау")}</h1>
      <p className="mt-1 mb-6 muted">{t(from ? "Сұрақтарды өз тақырыбыңызға ауыстырыңыз. Түпнұсқа ойын өзгермейді." : "Ойын түрін таңдап, сұрақтарды жазыңыз. Сақтаған соң оқушыларға сілтемемен жібере аласыз.")}</p>
      <GameEditor mode="teacher" copyOf={!!from} initial={initial} topics={await loadTopicOpts()} />
    </div>
  );
}
