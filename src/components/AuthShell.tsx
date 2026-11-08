"use client";
import Link from "next/link";
import PrefsSwitcher from "./PrefsSwitcher";
import { useT } from "@/lib/i18n/client";
import AuthScene3D from "./AuthScene3D";
import AuthGuide from "./AuthGuide";

const NAV = [
  { href: "/", label: "Басты бет" },
  { href: "/#grades", label: "Сыныптар" },
  { href: "/materials", label: "Материалдар" },
  { href: "/games", label: "Ойындар" },
];

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const t = useT();
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1230] text-white">
      <AuthScene3D />
      <div aria-hidden className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0B1230]/70 via-transparent to-transparent" />

      {/* робот үстелде, ноутбуктың жанында */}
      <div className="pointer-events-none absolute bottom-[7%] left-[max(1.5rem,calc(50%-42rem))] z-10 hidden lg:block [&_button]:pointer-events-auto [&_[aria-live]]:pointer-events-auto">
        <AuthGuide dark />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-8">
        {/* жоғарғы мәзір */}
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-2.5" aria-label={t("Басты бет")}>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#2F6BFF] to-[#8B5CF6] shadow-[0_0_24px_rgba(99,102,241,.6)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" /></svg>
            </span>
            <span className="text-[15px] font-extrabold tracking-wide">INFORMATIKA HUB</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[15px] text-white/80">
            {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-white transition">{t(n.label)}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <PrefsSwitcher />
            <Link href="/register" className="hidden sm:inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur hover:bg-white/10">{t("Тіркелу")}</Link>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_440px]">
          {/* сол жақ */}
          <section className="relative hidden lg:flex h-full flex-col justify-start pt-6">
            <h1 className="text-[3.4rem] font-extrabold leading-[1.08] tracking-tight [@media(max-height:760px)]:text-[2.7rem]">
              {t("Информатика")}<br />{t("мұғалімдеріне")}<br /><span className="bg-gradient-to-r from-[#3B6BFF] via-[#60A5FA] to-[#22D3EE] bg-clip-text text-transparent">{t("көмекші")}</span> {t("сайт")}
            </h1>
            <p className="mt-5 max-w-md text-xl text-white/80">{t("Сапалы, дайын, жүйеленген материалдар – уақытыңызды үнемдейді!")}</p>

          </section>

          {/* форма */}
          <main className="auth-glass relative z-20 w-full overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#121a46]/55 p-7 sm:p-9 shadow-[0_40px_90px_-24px_rgba(0,0,0,.75),inset_0_1px_0_rgba(255,255,255,.12)] backdrop-blur-2xl page-enter [&_.label]:text-white/80 [&_.btn-primary]:h-12">
            <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#8B5CF6]/30 blur-3xl" />
            <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#22D3EE]/20 blur-3xl" />
            <div className="lg:hidden mb-2"><AuthGuide compact /></div>
            <div className="relative">
              <h2 className="text-[2rem] font-extrabold">{t(title)}</h2>
              <p className="mt-1.5 text-[15px] muted">{t(subtitle)}</p>
              <div className="mt-7">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
