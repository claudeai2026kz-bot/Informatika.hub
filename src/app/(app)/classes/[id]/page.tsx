import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Users, Gamepad2, BarChart3, Settings, Plus, Table2, CheckCircle2, PencilLine } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { loadGradebook, pct } from "@/lib/classes";
import { GAME_TYPES, GRADE_STYLES } from "@/lib/labels";
import { GAME_ICONS } from "@/components/games/icons";
import Breadcrumbs from "@/components/Breadcrumbs";
import ClassGameRow from "@/components/classes/ClassGameRow";
import AddGamePicker from "@/components/classes/AddGamePicker";
import StudentsEditor from "@/components/classes/StudentsEditor";
import ClassSettings from "@/components/classes/ClassSettings";
import StrangerActions from "@/components/classes/StrangerActions";
import { JournalToolbar, MarkCell, RemoveColumn } from "@/components/classes/JournalTools";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const c = await db.classroom.findUnique({ where: { id: (await params).id }, select: { name: true } });
  return { title: c?.name ?? (await getT())("Менің сыныптарым") };
}

const TABS = [
  { key: "journal", label: "Бағалар журналы", icon: Table2 },
  { key: "games", label: "Ойындар", icon: Gamepad2 },
  { key: "students", label: "Оқушылар", icon: Users },
  { key: "settings", label: "Баптаулар", icon: Settings },
] as const;

const SOLO = GAME_TYPES.filter((g) => g.mode === "solo").map((g) => g.key);

function tone(p: number) {
  if (p >= 0.85) return "bg-emerald-100 text-emerald-800";
  if (p >= 0.65) return "bg-sky-100 text-sky-800";
  if (p >= 0.4) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-700";
}

export default async function ClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; added?: string }> }) {
  const t = await getT();
  const { id } = await params;
  const sp = await searchParams;
  const tab = TABS.some((x) => x.key === sp.tab) ? sp.tab! : "journal";
  const user = await requireUser(`/classes/${id}`);
  const book = await loadGradebook(id, user.id);
  if (!book) notFound();
  const { cls, games, rows, gameAvg, columns, colAvg, strangers } = book;
  const played = rows.filter((r) => r.done > 0);
  const classAvg = played.length ? played.reduce((a, r) => a + (r.avg ?? 0), 0) / played.length : null;

  const candidates = tab === "games"
    ? await db.game.findMany({
        where: { published: true, type: { in: SOLO as never }, OR: [{ authorId: null }, { authorId: user.id }], NOT: { id: { in: games.map((g) => g.id) } } },
        orderBy: [{ gradeId: "asc" }, { title: "asc" }],
        select: { id: true, title: true, type: true, gradeId: true, authorId: true },
        take: 400,
      })
    : [];

  return (
    <div>
      <Breadcrumbs items={[{ href: "/classes", label: t("Менің сыныптарым") }, { label: cls.name }]} />
      <header className="mt-5 flex flex-wrap items-center gap-4">
        <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl font-extrabold ${GRADE_STYLES[cls.gradeId - 5]}`}>{cls.gradeId}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-extrabold">{cls.name}</h1>
          <p className="muted">{t("{g}-сынып", { g: cls.gradeId })} · {t("{n} оқушы", { n: cls.students.length })} · {t("{n} ойын", { n: games.length })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/classes/${cls.id}?tab=games`} className="btn-soft"><Plus className="h-4 w-4" /> {t("Ойын беру")}</Link>
          <a href={`/classes/${cls.id}/export`} download className="btn-primary"><Download className="h-4 w-4" /> {t("Excel-ге жүктеу")}</a>
        </div>
      </header>

      <nav className="mt-6 flex gap-1 overflow-x-auto rounded-2xl bg-sky-50 p-1.5" aria-label={t("Сынып бөлімдері")}>
        {TABS.map(({ key, label, icon: I }) => (
          <Link key={key} href={`/classes/${cls.id}${key === "journal" ? "" : `?tab=${key}`}`} aria-current={tab === key ? "page" : undefined}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === key ? "bg-white text-sky-700 shadow-sm" : "text-ink-soft hover:bg-white/60"}`}>
            <I className="h-4 w-4" /> {t(label)}
          </Link>
        ))}
      </nav>

      {tab === "journal" && (
        <section className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat n={cls.students.length} l={t("оқушы")} />
            <Stat n={games.length + columns.length} l={t("баған (ойын + өз бағаңыз)")} />
            <Stat n={pct(classAvg)} l={t("сынып орташасы")} />
            <Stat n={`${played.length} / ${cls.students.length}`} l={t("бағасы бар оқушы")} />
          </div>
          <div className="mt-5 rounded-xl bg-sky-50 p-4 text-sm text-sky-900">
            {t("Оқушылар сайтқа тіркелмейді. Сіз ойын сілтемесін WhatsApp-қа жібересіз, оқушы сілтемені ашып, атын таңдап (не жазып) ойнайды — балы осы кестеге өзі түседі. Ойыннан тыс бағаларды «Баған қосу» арқылы өзіңіз қоя аласыз.")}
          </div>
          <JournalToolbar classId={cls.id} />
          {strangers.length > 0 && (
            <div className="card mt-4 border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
              <h3 className="font-bold text-amber-900">{t("Тізімде жоқ есіммен ойнағандар ({n})", { n: strangers.length })}</h3>
              <p className="mt-1 text-sm text-amber-900/80">{t("Бұл есімдер сынып тізімінде жоқ. Өз оқушыңыз болса — «Тізімге қосу» басыңыз, нәтижесі кестеге түседі. Бөгде не қате жазылған ат болса — өшіріңіз.")}</p>
              <ul className="mt-3 divide-y divide-amber-100">
                {strangers.map((s) => (
                  <li key={s.name} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-xs muted">{s.cells.map((c, k) => (c ? `${games[k].title}: ${c.score}/${c.max}` : null)).filter(Boolean).join(" · ") || t("{n} рет ойнады", { n: s.tries })}</span>
                    <span className="ml-auto"><StrangerActions classId={cls.id} name={s.name} /></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cls.students.length === 0 && games.length === 0 && columns.length === 0 ? (
            <div className="card mt-4 p-10 text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-sky-400" />
              <p className="mt-3 font-semibold">{t("Кесте әзірге бос")}</p>
              <p className="mt-1 text-sm muted">{t("Оқушы тізімін қосыңыз не бірден ойын беріңіз — сілтеме арқылы ойнағандар осы бетте шығады, оларды бір батырмамен тізімге қосасыз.")}</p>
              <Link href={`/classes/${cls.id}?tab=games`} className="btn-primary mt-4"><Plus className="h-4 w-4" /> {t("Ойын беру")}</Link>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm muted">{t("Ойын бағандарында — оқушының ең жақсы нәтижесі (басып, балды өзгертуге болады). Өз бағандарыңызға санды жазып, Enter басыңыз.")}</p>
              <div className="card mt-3 overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left">
                      <th className="sticky left-0 z-10 bg-white px-4 py-3 font-semibold border-b border-sky-100 min-w-[180px]">{t("Оқушы")}</th>
                      {games.map((g) => {
                        const I = GAME_ICONS[g.type];
                        return (
                          <th key={g.id} className="px-2 py-3 border-b border-sky-100 align-bottom min-w-[96px] max-w-[140px]">
                            <Link href={`/games/${g.id}/results?c=${cls.id}`} className="flex flex-col items-center gap-1 text-center text-xs font-semibold leading-tight hover:text-sky-600" title={g.title}>
                              <I className="h-4 w-4 text-lilac-500" />
                              <span className="line-clamp-2">{g.title}</span>
                            </Link>
                          </th>
                        );
                      })}
                      {columns.map((c) => (
                        <th key={c.id} className="px-2 py-3 border-b border-sky-100 align-bottom min-w-[90px] max-w-[140px] bg-amber-50/60">
                          <div className="flex flex-col items-center gap-1 text-center text-xs font-semibold leading-tight">
                            <span className="flex items-center gap-1"><PencilLine className="h-4 w-4 text-amber-600" /><RemoveColumn id={c.id} title={c.title} /></span>
                            <span className="line-clamp-2" title={c.title}>{c.title}</span>
                            <span className="muted font-normal">{t("{n} балл", { n: c.max })}</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-3 border-b border-sky-100 text-center font-semibold">{t("Барлығы")}</th>
                      <th className="px-3 py-3 border-b border-sky-100 text-center font-semibold">{t("Орташа")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr><td colSpan={games.length + columns.length + 3} className="px-4 py-8 text-center muted">{t("Әзірге оқушы жоқ. «Оқушы қосу» батырмасымен тізім енгізіңіз не ойын сілтемесін жіберіңіз — ойнағандар жоғарыда шығады.")}</td></tr>
                    )}
                    {rows.map((r, i) => (
                      <tr key={r.student.id} className="hover:bg-sky-50/50">
                        <td className="sticky left-0 z-10 bg-white px-4 py-2.5 border-b border-sky-50 font-semibold whitespace-nowrap"><span className="mr-2 text-xs muted tabular-nums">{i + 1}.</span>{r.student.name}</td>
                        {r.cells.map((c, k) => (
                          <td key={games[k].id} className="px-2 py-2 border-b border-sky-50 text-center">
                            {c ? (
                              <Link href={`/games/${games[k].id}/results?c=${cls.id}`} title={t("{n} рет ойнады", { n: c.tries })}
                                className={`inline-block min-w-[58px] rounded-lg px-2 py-1 font-bold tabular-nums ${tone(c.max ? c.score / c.max : 0)}`}>
                                {c.score}/{c.max}
                              </Link>
                            ) : <span className="text-ink-mute">—</span>}
                          </td>
                        ))}
                        {r.marks.map((m, k) => (
                          <td key={columns[k].id} className="px-2 py-1.5 border-b border-sky-50 text-center bg-amber-50/30">
                            <MarkCell columnId={columns[k].id} studentId={r.student.id} value={m} max={columns[k].max} label={`${r.student.name}: ${columns[k].title}`} />
                          </td>
                        ))}
                        <td className="px-3 py-2 border-b border-sky-50 text-center font-bold tabular-nums">{r.done ? `${r.sum}/${r.max}` : "—"}</td>
                        <td className="px-3 py-2 border-b border-sky-50 text-center">
                          {r.avg === null ? <span className="text-ink-mute">—</span> : <span className={`inline-block rounded-lg px-2 py-1 font-bold ${tone(r.avg)}`}>{pct(r.avg)}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {rows.length > 0 && (
                    <tfoot>
                      <tr className="bg-sky-50/70 font-semibold">
                        <td className="sticky left-0 z-10 bg-sky-50 px-4 py-3">{t("Сынып орташасы")}</td>
                        {[...gameAvg, ...colAvg].map((a, k) => (
                          <td key={k} className="px-2 py-3 text-center text-xs">
                            <div className="font-bold text-sm">{pct(a.avg)}</div>
                            <div className="muted">{t(k < gameAvg.length ? "{n} ойнады" : "{n} бағаланды", { n: `${a.played}/${rows.length}` })}</div>
                          </td>
                        ))}
                        <td />
                        <td className="px-3 py-3 text-center font-bold">{pct(classAvg)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "games" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] items-start">
          <div>
            {sp.added && <p className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" /> {t("Ойын сыныпқа берілді. Енді сілтемесін оқушыларға жіберіңіз.")}</p>}
            <h2 className="text-lg font-bold">{t("Сыныпқа берілген ойындар")}</h2>
            <p className="mt-1 text-sm muted">{t("Сілтемені WhatsApp тобына жіберіңіз. Оқушы тізімнен өз атын таңдап ойнайды, нәтижесі журналға өзі түседі.")}</p>
            {games.length === 0 ? (
              <div className="card mt-4 p-8 text-center muted">{t("Әзірге ойын берілмеген. Оң жақтан ойын таңдаңыз не жаңасын жасаңыз.")}</div>
            ) : (
              <div className="mt-4 space-y-3">
                {games.map((g, k) => {
                  const gt = GAME_TYPES.find((x) => x.key === g.type);
                  return (
                    <ClassGameRow key={g.id} classId={cls.id} game={{ id: g.id, title: g.title, type: g.type, meta: `${gt ? t(gt.name) : ""} · ${t("{n} сұрақ", { n: g._count.questions })}` }}
                      played={gameAvg[k].played} total={rows.length} avg={pct(gameAvg[k].avg)} />
                  );
                })}
              </div>
            )}
          </div>
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="card p-5">
              <h3 className="font-bold">{t("Жаңа ойын жасау")}</h3>
              <p className="mt-1 text-sm muted">{t("Өз сұрақтарыңызбен ойын жасаңыз — сақтаған соң ол бірден осы сыныпқа беріледі.")}</p>
              <Link href={`/games/new?class=${cls.id}`} className="btn-primary mt-3 w-full"><Plus className="h-4 w-4" /> {t("Жаңа ойын жасау")}</Link>
            </div>
            <div className="card p-5">
              <h3 className="font-bold">{t("Дайын ойындардан беру")}</h3>
              <AddGamePicker classId={cls.id} grade={cls.gradeId} games={candidates.map((g) => ({ id: g.id, title: g.title, type: g.type, grade: g.gradeId, mine: g.authorId === user.id }))} />
            </div>
          </aside>
        </section>
      )}

      {tab === "students" && (
        <section className="mt-6">
          <StudentsEditor classId={cls.id} students={rows.map((r) => ({ id: r.student.id, name: r.student.name, done: r.done }))} />
        </section>
      )}

      {tab === "settings" && (
        <section className="mt-6 max-w-xl">
          <ClassSettings classId={cls.id} name={cls.name} grade={cls.gradeId} />
        </section>
      )}
    </div>
  );
}

function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-extrabold tabular-nums">{n}</div>
      <div className="text-sm muted">{l}</div>
    </div>
  );
}
