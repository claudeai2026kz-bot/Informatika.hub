import Link from "next/link";
import {
  Presentation, PlayCircle, ClipboardList, FileText, BookOpen, Sparkles,
  Gamepad2, Puzzle, Grid3x3, Zap, Brain, Code2, Search, Heart, ShieldCheck, Clock, Smartphone, ArrowRight, Bot,
} from "lucide-react";
import Robot from "@/components/Robot";
import Reveal from "@/components/Reveal";
import Abbr from "@/components/Abbr";
import { db } from "@/lib/db";
import { GRADES } from "@/lib/labels";

export const dynamic = "force-dynamic";

const GRADE_COLORS = [
  "from-rose-100 to-rose-50 text-rose-500",
  "from-orange-100 to-orange-50 text-orange-500",
  "from-amber-100 to-amber-50 text-amber-600",
  "from-emerald-100 to-emerald-50 text-emerald-600",
  "from-teal-100 to-teal-50 text-teal-600",
  "from-sky-100 to-sky-50 text-sky-600",
  "from-lilac-100 to-lilac-100/40 text-lilac-500",
];

export default async function Landing() {
  const [materials, assessments, games, users] = await Promise.all([
    db.material.count({ where: { published: true } }),
    db.assessment.count({ where: { published: true } }),
    db.game.count({ where: { published: true } }),
    db.user.count(),
  ]);

  return (
    <div className="overflow-x-clip">
      {/* ---------- HERO ---------- */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-16 pb-16">
        <div aria-hidden className="pointer-events-none absolute -top-10 right-0 h-80 w-80 rounded-full bg-lilac-200/60 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute top-40 -left-10 h-72 w-72 rounded-full bg-sky-200/70 blur-3xl animate-blob [animation-delay:-6s]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="animate-fadeUp">
            <span className="chip bg-white/80 border border-sky-200 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-gold-500" /> 5–11 сынып · барлығы бір жерде
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08]">
              Информатика мұғалімдеріне арналған <span className="gradient-text">ақылды көмекші</span>
            </h1>
            <p className="mt-5 text-lg text-ink-soft max-w-xl">
              Презентациялар, бейнесабақтар, <Abbr k="ҚМЖ" />, <Abbr k="БЖБ" /> мен <Abbr k="ТЖБ" />, интерактивті ойындар. Сабаққа дайындалу уақытын бірнеше есе қысқартыңыз.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary h-12 px-7 text-base">Бастау <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/login" className="btn-ghost h-12 px-7 text-base">Жүйеге кіру</Link>
            </div>
            <dl className="mt-10 grid grid-cols-3 max-w-md gap-4">
              {[
                [materials, "материал"],
                [assessments, "БЖБ / ТЖБ"],
                [games, "ойын"],
              ].map(([n, l]) => (
                <div key={String(l)} className="glass rounded-2xl px-4 py-3">
                  <dt className="text-2xl font-extrabold text-ink">{n}</dt>
                  <dd className="text-xs muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative grid place-items-center">
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-sky-200/70 to-lilac-200/70 blur-2xl" />
            <Robot size={340} wave className="relative max-w-[78vw]" />
            {[
              { t: "Презентация", c: "top-6 left-0 sm:left-4", i: Presentation },
              { t: "ҚМЖ", c: "top-24 right-0", i: FileText },
              { t: "Ойындар", c: "bottom-16 left-2", i: Gamepad2 },
            ].map(({ t, c, i: I }, k) => (
              <div key={t} className={`absolute ${c} glass rounded-xl px-3 py-2 text-sm font-semibold flex items-center gap-2 animate-float`} style={{ animationDelay: `${-k * 1.6}s` }}>
                <I className="h-4 w-4 text-sky-500" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 1. ТАНЫСТЫРУ ---------- */}
      <Reveal as="section" className="mx-auto max-w-5xl px-4 sm:px-6 py-12 text-center">
        <h2 className="section-title">Informatika Hub деген не?</h2>
        <p className="mt-4 text-lg text-ink-soft">
          Бұл 5–11 сыныпта сабақ беретін информатика мұғалімдеріне арналған цифрлық платформа. Мұнда материалдар сынып, тоқсан және тақырып бойынша реттелген, сондықтан қажетті файлды бірнеше секундта табасыз.
        </p>
      </Reveal>

      {/* ---------- 2. МҮМКІНДІКТЕР ---------- */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <Reveal><h2 className="section-title text-center">Сайттың мүмкіндіктері</h2></Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { i: Presentation, t: "Презентациялар", d: "Әр тақырыпқа дайын слайдтар, сайт ішінде алдын ала қарау." },
            { i: PlayCircle, t: "Бейнесабақтар", d: "Видеоларды сайттан шықпай көріңіз." },
            { i: ClipboardList, t: "Практикалық тапсырмалар", d: "Сабаққа арналған жаттығулар мен жұмыс парақтары." },
            { i: FileText, t: "ҚМЖ", d: "Қысқа мерзімді жоспарлар, бірден жүктеуге дайын." },
            { i: BookOpen, t: "Қосымша ресурстар", d: "Кітаптар, сілтемелер және анықтамалық материалдар." },
            { i: Sparkles, t: "Интерактивті тапсырмалар", d: "Оқушылармен бірге тақтада орындауға арналған." },
          ].map(({ i: I, t, d }, k) => (
            <Reveal key={t} delay={k * 70}>
              <div className="card card-hover p-6 h-full">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-100 to-lilac-100 text-sky-600"><I className="h-6 w-6" /></span>
                <h3 className="mt-4 font-bold text-lg">{t === "ҚМЖ" ? <Abbr k="ҚМЖ" /> : t}</h3>
                <p className="mt-1.5 text-sm muted">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- 3. СЫНЫПТАР ---------- */}
      <section id="grades" className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <Reveal><h2 className="section-title text-center">5–11 сынып материалдары</h2></Reveal>
        <Reveal><p className="mt-3 text-center muted">Сыныпты таңдаңыз, содан кейін тоқсан мен тақырыпты ашыңыз.</p></Reveal>
        <div className="mt-8 grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-4">
          {GRADES.map((g, k) => (
            <Reveal key={g} delay={k * 50}>
              <Link href={`/grades/${g}`} className={`card card-hover block bg-gradient-to-b ${GRADE_COLORS[k]} text-center py-5 sm:py-7`}>
                <div className="text-3xl sm:text-4xl font-extrabold">{g}</div>
                <div className="text-xs font-semibold opacity-80">сынып</div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- 4. БЖБ ЖӘНЕ ТЖБ ---------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <Reveal>
          <div className="card overflow-hidden grid md:grid-cols-2">
            <div className="p-8 sm:p-10">
              <h2 className="section-title"><Abbr k="БЖБ" /> және <Abbr k="ТЖБ" /></h2>
              <p className="mt-3 text-ink-soft">Бөлім және тоқсан бойынша жиынтық бағалау тапсырмалары. Әрқайсысында жауаптар, бағалау критерийлері мен дескрипторлар бар.</p>
              <ul className="mt-5 space-y-2 text-sm">
                {["Сынып, тоқсан, тақырып және нұсқа бойынша сүзгі", "Файлды сайт ішінде алдын ала қарау", "Жауаптар мен дескрипторлар бір бетте"].map((t) => (
                  <li key={t} className="flex gap-2"><ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" /> {t}</li>
                ))}
              </ul>
              <Link href="/assessments" className="btn-primary mt-7">БЖБ / ТЖБ ашу</Link>
            </div>
            <div className="relative min-h-56 bg-gradient-to-br from-sky-100 via-white to-lilac-100 p-8 grid place-items-center">
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {["БЖБ №1", "БЖБ №2", "ТЖБ", "Жауаптар"].map((t, k) => (
                  <div key={t} className="glass rounded-2xl p-4 animate-float" style={{ animationDelay: `${-k}s` }}>
                    <ClipboardList className="h-5 w-5 text-lilac-500" />
                    <div className="mt-2 font-semibold text-sm">{t}</div>
                    <div className="mt-2 h-1.5 rounded bg-sky-100"><div className="h-full rounded bg-sky-400" style={{ width: `${55 + k * 12}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- 5. ОЙЫНДАР ---------- */}
      <section id="games" className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <Reveal><h2 className="section-title text-center">Интерактивті ойындар</h2></Reveal>
        <Reveal><p className="mt-3 text-center muted">Сабақты қызықты етіңіз: ұпай автоматты есептеледі, нәтиже бірден шығады.</p></Reveal>
        <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-6">
          {[
            { i: Gamepad2, t: "Тест" }, { i: Puzzle, t: "Сәйкестендіру" }, { i: Grid3x3, t: "Сөзжұмбақ" },
            { i: Zap, t: "Жылдам сұрақтар" }, { i: Brain, t: "Логика" }, { i: Code2, t: "Программалау" },
          ].map(({ i: I, t }, k) => (
            <Reveal key={t} delay={k * 60}>
              <Link href="/games" className="card card-hover flex flex-col items-center gap-3 p-5 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lilac-100 text-lilac-500"><I className="h-6 w-6" /></span>
                <span className="font-semibold text-sm">{t}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- 6. РОБОТ ---------- */}
      <section id="robot" className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl3 bg-ink text-white p-8 sm:p-12 grid md:grid-cols-[.8fr_1.2fr] gap-8 items-center">
            <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sky-400/30 blur-3xl" />
            <div className="grid place-items-center"><Robot size={230} /></div>
            <div className="relative">
              <span className="chip bg-white/10 text-sky-200"><Bot className="h-3.5 w-3.5" /> AI Navigator</span>
              <h2 className="mt-4 text-3xl font-bold">Ақылды робот-көмекші</h2>
              <p className="mt-3 text-white/75">Әр беттің төменгі бұрышында тұрады. Сұрағыңызды жазыңыз, ол қажетті материалды тауып береді.</p>
              <div className="mt-6 space-y-3 max-w-md">
                <div className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-sky-400 px-4 py-2.5 text-sm">7-сыныптың II тоқсанындағы Python презентациясын тауып берші</div>
                <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-white/10 px-4 py-2.5 text-sm">Таптым! 7-сынып, II тоқсан, «Python программалау» бөлімінен 3 презентация бар 👇</div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- 7. АРТЫҚШЫЛЫҚТАРЫ ---------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <Reveal><h2 className="section-title text-center">Неліктен Informatika Hub?</h2></Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: Clock, t: "Уақыт үнемдейді", d: "Материал іздеуге кететін сағаттарды минуттарға айналдырады." },
            { i: Search, t: "Жылдам іздеу", d: "Сынып, тоқсан, тақырып және түрі бойынша сүзгі." },
            { i: Heart, t: "Таңдаулылар", d: "Керек материалды сақтап, кез келген уақытта ашыңыз." },
            { i: Smartphone, t: "Кез келген құрылғы", d: "Компьютер, планшет және телефонда ыңғайлы." },
          ].map(({ i: I, t, d }, k) => (
            <Reveal key={t} delay={k * 70}>
              <div className="card p-6 h-full">
                <I className="h-7 w-7 text-gold-500" />
                <h3 className="mt-3 font-bold">{t}</h3>
                <p className="mt-1 text-sm muted">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- 8. СОҢҒЫ ШАҚЫРУ ---------- */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl3 bg-gradient-to-r from-sky-400 to-lilac-500 p-10 sm:p-14 text-center text-white shadow-lift">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.35),transparent_40%)]" />
            <h2 className="relative text-3xl sm:text-4xl font-extrabold">Сабаққа дайындалуды бүгін жеңілдетіңіз</h2>
            <p className="relative mt-3 text-white/85">{users > 0 ? `${users} мұғалім қазірдің өзінде қолданып жүр.` : "Тіркелу тегін және бір минут алады."}</p>
            <Link href="/register" className="relative mt-7 btn h-12 px-8 bg-white text-ink hover:bg-sky-50 shadow-soft">Тегін тіркелу <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
