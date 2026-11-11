import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GAME_TYPES } from "@/lib/labels";
import { crosswordLayout, publicQuestion, type QuestionRow } from "@/lib/games";
import { GAME_ICONS } from "@/components/games/icons";
import Logo from "@/components/Logo";
import StudentPlay from "./StudentPlay";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const g = await db.game.findUnique({ where: { id: (await params).id }, select: { title: true } });
  return { title: g?.title ?? (await getT())("Ойын"), robots: { index: false } };
}

/** Оқушыға арналған бет: тіркелусіз, тек атын жазып ойнайды. Нәтиже сілтемедегі мұғалімге барады. */
export default async function PlayPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string; c?: string }> }) {
  const t = await getT();
  const { id } = await params;
  const { t: teacherParam, c: classParam } = await searchParams;
  // ?c=<сынып> — «Менің сыныптарым» сілтемесі: мұғалім сыныптан анықталады, оқушы атын тізімнен таңдайды
  const cls = classParam && /^c[a-z0-9]{20,30}$/.test(classParam)
    ? await db.classroom.findUnique({ where: { id: classParam }, select: { id: true, name: true, teacherId: true, students: { select: { id: true, name: true }, orderBy: { name: "asc" } } } })
    : null;
  const teacherId = cls?.teacherId ?? teacherParam;
  const cg = cls ? await db.classGame.findUnique({ where: { classId_gameId: { classId: cls.id, gameId: id } }, select: { attempts: true, dueAt: true } }) : null;
  const g = await db.game.findFirst({ where: { id, published: true }, include: { questions: { orderBy: { order: "asc" } }, topic: true } });
  if (!g) notFound();
  const teacher = teacherId ? await db.user.findUnique({ where: { id: teacherId }, select: { id: true, name: true } }) : null;
  const viewer = await getCurrentUser();
  const seed = Math.floor(Math.random() * 1000);
  const questions = g.questions.map((q) => publicQuestion(g.type, q as QuestionRow, seed));
  const I = GAME_ICONS[g.type];
  const gt = GAME_TYPES.find((x) => x.key === g.type);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <div className="flex justify-center mb-6"><Logo /></div>
        <header className="mb-6 flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lilac-100 to-sky-100 text-lilac-500"><I className="h-7 w-7" /></span>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold">{g.title}</h1>
            <p className="muted text-sm mt-1">{gt && t(gt.name)} · {t("{g}-сынып", { g: g.gradeId })}{g.topic ? ` · ${g.topic.title}` : ""}</p>
            {teacher && <p className="mt-2 text-sm text-ink-soft">{t("Мұғалім: {n}", { n: teacher.name })}{cls ? ` · ${cls.name}` : ""}</p>}
          </div>
        </header>
        <StudentPlay
          gameId={g.id} type={g.type} title={g.title} questions={questions as never} timeLimit={g.timeLimit}
          layout={g.type === "CROSSWORD" ? crosswordLayout(g.questions) : null}
          teacherId={teacher?.id ?? null} loggedIn={!!viewer}
          classroom={cls && teacher ? { id: cls.id, name: cls.name, students: cls.students, attempts: cg?.attempts ?? 0, dueAt: cg?.dueAt?.toISOString() ?? null } : null}
        />
      </div>
    </div>
  );
}
