import { Presentation, PlayCircle, FileText, ClipboardCheck, Gamepad2, ShieldCheck } from "lucide-react";
import Logo from "./Logo";
import AuthGuide from "./AuthGuide";

const FEATURES = [
  { icon: Presentation, label: "Презентация" },
  { icon: PlayCircle, label: "Бейнесабақ" },
  { icon: FileText, label: "ҚМЖ" },
  { icon: ClipboardCheck, label: "БЖБ / ТЖБ" },
  { icon: Gamepad2, label: "Ойындар" },
];

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-lilac-100">
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-sky-200/60 blur-3xl animate-blob" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-[-6rem] h-[30rem] w-[30rem] rounded-full bg-lilac-200/70 blur-3xl animate-blob [animation-delay:-7s]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.35] [background-image:radial-gradient(#b9d6f2_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between">
          <Logo />
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-ink-soft shadow-soft"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Тегін · 5–11 сынып</span>
        </header>

        <div className="flex flex-1 items-center py-6 [@media(max-height:720px)]:py-3">
          <div className="grid w-full overflow-hidden rounded-[2rem] bg-white/90 shadow-lift ring-1 ring-sky-100 backdrop-blur lg:grid-cols-[1.05fr_1fr]">
            {/* Робот жағы */}
            <aside className="relative hidden lg:flex flex-col overflow-hidden bg-gradient-to-br from-sky-400 via-sky-500 to-lilac-500 p-8 text-white">
              <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
              <div aria-hidden className="absolute -left-20 bottom-10 h-56 w-56 rounded-full bg-white/10" />
              <h2 className="relative text-[1.7rem] font-extrabold leading-tight">Информатика мұғалімдеріне арналған ақылды көмекші</h2>
              <div className="relative mt-4 flex flex-wrap gap-2 [@media(max-height:720px)]:hidden">
                {FEATURES.map((f) => (
                  <span key={f.label} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur"><f.icon className="h-4 w-4" />{f.label}</span>
                ))}
              </div>
              <div className="relative mt-auto pt-6 flex justify-center"><AuthGuide /></div>
            </aside>

            {/* Форма */}
            <main className="flex flex-col justify-center px-5 py-8 sm:px-10 lg:px-12">
              <div className="mx-auto w-full max-w-md page-enter">
                <div className="lg:hidden"><AuthGuide compact /></div>
                <h1 className="text-3xl sm:text-4xl font-extrabold">{title}</h1>
                <p className="mt-2 text-base muted">{subtitle}</p>
                <div className="mt-8 [&_input]:h-12 [&_input]:text-base [&_label]:text-base [&_button[type=submit]]:h-12 [&_button[type=submit]]:text-base">{children}</div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
