import Link from "next/link";
import { Search, ArrowRight, Users, Layers, Download, Gamepad2, ClipboardCheck, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GRADES, GAME_TYPES, GRADE_STYLES } from "@/lib/labels";
import Robot from "@/components/Robot";
import GradeBrowser from "@/components/GradeBrowser";
import Abbr from "@/components/Abbr";

export const metadata = { title: "Басты панель" };



function Section({ title, href, children }: { title: React.ReactNode; href?: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        {href && <Link href={href} className="text-sm font-semibold text-sky-600 hover:underline flex items-center gap-1 shrink-0">Барлығы <ArrowRight className="h-4 w-4" /></Link>}
      </div>
      {children}
    </section>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string; g?: string; q?: string }> }) {
  const user = await requireUser("/dashboard");
  const sp = await searchParams;
  const denied = sp.denied;
  const g = Math.min(11, Math.max(5, Number(sp.g) || 5));
  const qn = Math.min(4, Math.max(1, Number(sp.q) || 1));
  const pub = { published: true };
  const [assessments, games, stats] = await Promise.all([
    db.assessment.findMany({ where: pub, orderBy: { createdAt: "desc" }, take: 4, include: { quarter: true } }),
    db.game.findMany({ where: pub, orderBy: { plays: "desc" }, take: 4, include: { _count: { select: { questions: true } } } }),
    Promise.all([
      db.material.count({ where: pub }),
      db.user.count(),
      db.material.aggregate({ _sum: { downloads: true } }),
      db.game.count({ where: pub }),
    ]),
  ]);
  const first = user.name.split(" ")[0];

  return (
    <div>
      {denied && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          <ShieldAlert className="h-4 w-4" /> Бұл бөлімге тек әкімші кіре алады.
        </div>
      )}

      {/* Қош келдіңіз */}
      <section className="app-hero relative overflow-hidden rounded-xl3 border border-white/10 p-6 sm:p-10 text-white shadow-[0_30px_60px_-30px_rgba(11,16,53,.8)] animate-fadeUp">
        <div aria-hidden className="app-hero-grid absolute inset-0" />
        <div aria-hidden className="absolute right-[18%] top-10 h-40 w-40 rounded-full bg-cyan-400/25 blur-3xl animate-blob" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-200"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" /> Қош келдіңіз!</p>
            <h1 className="mt-3 text-3xl sm:text-[2.6rem] font-extrabold leading-tight">Сәлем, <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">{first}</span> 👋</h1>
            <p className="mt-2 text-white/70">Бүгін қандай сабаққа дайындаламыз?</p>
            <form action="/materials" className="mt-6 flex max-w-xl gap-2 rounded-2xl border border-white/15 bg-white/10 p-1.5 backdrop-blur-md focus-within:border-cyan-300/70 focus-within:shadow-[0_0_0_4px_rgba(34,211,238,.15)] transition">
              <label className="sr-only" htmlFor="q">Материал іздеу</label>
              <div className="flex flex-1 items-center gap-2 pl-3">
                <Search className="h-5 w-5 text-cyan-200" />
                <input id="q" name="q" className="w-full bg-transparent h-10 outline-none text-[15px] text-white placeholder:text-white/50" placeholder="Сабақ, тақырып немесе кілт сөз…" />
              </div>
              <button className="auth-btn !w-auto !h-10 px-5 rounded-xl text-sm font-semibold">Іздеу</button>
            </form>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              {["Python", "Алгоритм", "HTML", "Ақпарат", "Желі"].map((t) => (
                <Link key={t} href={`/materials?q=${encodeURIComponent(t)}`} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-medium text-white/80 transition hover:border-cyan-300/60 hover:text-white">{t}</Link>
              ))}
            </div>
          </div>
          <div className="hidden md:block robot-pad isolate pr-4"><div style={{ transform: "scaleX(-1)" }}><Robot size={200} /></div></div>
        </div>
      </section>

      {/* Сыныптар */}
      <Section title="Сыныпты таңдаңыз">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {GRADES.map((gr, i) => (
            <Link key={gr} href={`/dashboard?g=${gr}#browse`} scroll={false} aria-current={gr === g ? "page" : undefined} className={`card card-hover bg-gradient-to-b ${GRADE_STYLES[i]} py-5 text-center transition ${gr === g ? "ring-4 ring-cyan-300/80 ring-offset-2 ring-offset-[#f7fbff] scale-[1.04]" : "saturate-[.85] hover:saturate-100"}`}>
              <div className="text-3xl font-extrabold">{gr}</div>
              <div className="text-xs font-semibold text-white/80">сынып</div>
            </Link>
          ))}
        </div>
      </Section>

      <section id="browse" className="mt-6 scroll-mt-24">
        <h2 className="text-xl sm:text-2xl font-bold">{g}-сынып</h2>
        <GradeBrowser g={g} qn={qn} quarterHref={(q) => `/dashboard?g=${g}&q=${q}#browse`} />
      </section>

      <Section title={<><Abbr k="БЖБ" /> / <Abbr k="ТЖБ" /></>} href="/assessments">
        {assessments.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {assessments.map((a) => (
              <Link key={a.id} href={`/assessments/${a.id}`} className="card card-hover p-5">
                <span className={`chip ${a.kind === "BZHB" ? "" : "bg-lilac-100 text-lilac-500"}`}><ClipboardCheck className="h-3.5 w-3.5" /> {a.kind === "BZHB" ? "БЖБ" : "ТЖБ"}</span>
                <h3 className="mt-3 font-bold line-clamp-2">{a.title}</h3>
                <p className="mt-1 text-xs muted">{a.gradeId}-сынып · {a.quarter.number}-тоқсан · {a.variant}</p>
              </Link>
            ))}
          </div>
        ) : <Empty text="Әзірге БЖБ / ТЖБ қосылмаған." />}
      </Section>

      <Section title="Интерактивті ойындар" href="/games">
        {games.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((g) => (
              <Link key={g.id} href={`/games/${g.id}`} className="card card-hover p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#7C5CF5] to-[#C084FC] text-white"><Gamepad2 className="h-5 w-5" /></span>
                <h3 className="mt-3 font-bold">{g.title}</h3>
                <p className="mt-1 text-xs muted">{GAME_TYPES.find((t) => t.key === g.type)?.name} · {g.gradeId}-сынып · {g._count.questions} сұрақ</p>
              </Link>
            ))}
          </div>
        ) : <Empty text="Әзірге ойындар қосылмаған." />}
      </Section>

      <Section title="Платформа статистикасы">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { i: Layers, n: stats[0], l: "материал" },
            { i: Users, n: stats[1], l: "пайдаланушы" },
            { i: Download, n: stats[2]._sum.downloads ?? 0, l: "жүктеу" },
            { i: Gamepad2, n: stats[3], l: "ойын" },
          ].map(({ i: I, n, l }) => (
            <div key={l} className="card p-5 flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#3B6BFF] to-[#8B5CF6] text-white shadow-[0_10px_22px_-10px_#3B6BFF]"><I className="h-6 w-6" /></span>
              <div><div className="text-2xl font-extrabold">{n.toLocaleString("kk-KZ")}</div><div className="text-sm muted">{l}</div></div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="card p-8 text-center muted">{text}</div>;
}
