import Link from "next/link";
import { Users, Gamepad2, ArrowRight, School } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { GRADE_STYLES } from "@/lib/labels";
import CreateClassForm from "@/components/classes/CreateClassForm";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getT())("Менің сыныптарым") };
}

export default async function ClassesPage() {
  const t = await getT();
  const user = await requireUser("/classes");
  const classes = await db.classroom.findMany({
    where: { teacherId: user.id },
    orderBy: [{ gradeId: "asc" }, { name: "asc" }],
    include: { _count: { select: { students: true, games: true, results: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t("Менің сыныптарым")}</h1>
          <p className="mt-1 muted max-w-2xl">{t("Сынып құрыңыз, оқушыларды қосыңыз, ойын беріңіз — барлық баға бір журналда жиналады және Excel-ге жүктеледі.")}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        <section>
          {classes.length === 0 ? (
            <div className="card p-10 text-center">
              <School className="mx-auto h-10 w-10 text-sky-400" />
              <p className="mt-3 font-semibold">{t("Әзірге сынып жоқ")}</p>
              <p className="mt-1 text-sm muted">{t("Оң жақтағы формадан алғашқы сыныбыңызды құрыңыз (мысалы, 7 «А»).")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {classes.map((c) => (
                <Link key={c.id} href={`/classes/${c.id}`} className="card card-hover p-5 group flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg font-extrabold ${GRADE_STYLES[c.gradeId - 5]}`}>{c.gradeId}</span>
                    <div className="min-w-0">
                      <h2 className="text-xl font-extrabold truncate">{c.name}</h2>
                      <p className="text-sm muted">{t("{g}-сынып", { g: c.gradeId })}</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-sky-500 transition group-hover:translate-x-1" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-sky-800"><Users className="h-4 w-4" /> {t("{n} оқушы", { n: c._count.students })}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-lilac-100 px-2.5 py-1 text-lilac-500"><Gamepad2 className="h-4 w-4" /> {t("{n} ойын", { n: c._count.games })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        <aside className="card p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">{t("Жаңа сынып құру")}</h2>
          <CreateClassForm />
        </aside>
      </div>
    </div>
  );
}
