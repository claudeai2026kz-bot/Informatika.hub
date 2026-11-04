import Link from "next/link";
import { GraduationCap, BookOpenCheck, ClipboardCheck, Presentation } from "lucide-react";
import AuthScene from "./AuthScene";
import AuthGuide from "./AuthGuide";

const CHIPS = [
  { icon: GraduationCap, label: "5–11 сынып" },
  { icon: BookOpenCheck, label: "Дайын сабақтар" },
  { icon: ClipboardCheck, label: "ҚМЖ, БЖБ, ТЖБ" },
  { icon: Presentation, label: "Презентациялар, бейнесабақтар" },
];
const NAV = [
  { href: "/", label: "Басты бет" },
  { href: "/#grades", label: "Сыныптар" },
  { href: "/materials", label: "Материалдар" },
  { href: "/games", label: "Ойындар" },
];

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1230] text-white">
      <AuthScene />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0B1230]/85 via-[#0B1230]/30 to-transparent" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-8">
        {/* жоғарғы мәзір */}
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Басты бет">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#2F6BFF] to-[#8B5CF6] shadow-[0_0_24px_rgba(99,102,241,.6)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" /></svg>
            </span>
            <span className="text-[15px] font-extrabold tracking-wide">INFORMATIKA HUB</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[15px] text-white/80">
            {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-white transition">{n.label}</Link>)}
          </nav>
          <Link href="/register" className="hidden sm:inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur hover:bg-white/10">Тіркелу</Link>
        </header>

        <div className="grid flex-1 items-center gap-10 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_440px]">
          {/* сол жақ */}
          <section className="relative hidden lg:flex h-full flex-col justify-center">
            <h1 className="text-[3.4rem] font-extrabold leading-[1.08] tracking-tight [@media(max-height:760px)]:text-[2.7rem]">
              Информатика<br />мұғалімдеріне<br /><span className="text-[#3B82F6]">көмекші</span> сайт
            </h1>
            <p className="mt-5 max-w-md text-xl text-white/80">Сапалы, дайын, жүйеленген материалдар – уақытыңызды үнемдейді!</p>

            <div className="mt-auto pt-8 flex items-end gap-6">
              <div className="shrink-0 -mb-2"><AuthGuide dark /></div>
              <div className="grid grid-cols-2 gap-3 pb-2">
                {CHIPS.map((c) => (
                  <span key={c.label} className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141B45]/75 px-4 py-3 text-[15px] font-medium backdrop-blur-md">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#2F6BFF]"><c.icon className="h-5 w-5" /></span>{c.label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* форма */}
          <main className="relative w-full rounded-3xl bg-white p-7 sm:p-9 text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,.6)] [&_.btn-primary]:h-12 [&_.btn-primary]:text-base [&_.btn-primary]:bg-none [&_.btn-primary]:bg-[#2F6BFF] [&_.btn-primary:hover]:bg-[#1F5AF0] [&_.input]:h-12 [&_.input]:bg-slate-50 [&_.input]:border-slate-200 [&_a]:text-[#2F6BFF]">
            <div className="lg:hidden mb-2"><AuthGuide compact /></div>
            <h2 className="text-[1.9rem] font-extrabold">{title}</h2>
            <p className="mt-1.5 text-[15px] muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
