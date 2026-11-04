import { Presentation, PlayCircle, FileText, ClipboardCheck, Gamepad2, Star, Sparkles } from "lucide-react";
import Logo from "./Logo";
import AuthGuide from "./AuthGuide";

const FEATURES = [
  { icon: Presentation, label: "Презентация", bg: "#FFD43B" },
  { icon: PlayCircle, label: "Бейнесабақ", bg: "#FF8787" },
  { icon: FileText, label: "ҚМЖ", bg: "#63E6BE" },
  { icon: ClipboardCheck, label: "БЖБ / ТЖБ", bg: "#74C0FC" },
  { icon: Gamepad2, label: "Ойындар", bg: "#B197FC" },
];

/** Фондағы ұшып жүрген ойнақы белгілер */
const DOODLES = [
  { t: "</>", x: "6%", y: "18%", s: 34, c: "#7C5CFF", r: -12, d: 6 },
  { t: "{ }", x: "44%", y: "8%", s: 30, c: "#FF6B6B", r: 10, d: 7 },
  { t: "A1", x: "88%", y: "14%", s: 26, c: "#20C997", r: -8, d: 5.5 },
  { t: "★", x: "92%", y: "72%", s: 34, c: "#FCC419", r: 0, d: 4.5 },
  { t: "01", x: "4%", y: "82%", s: 28, c: "#339AF0", r: 14, d: 6.5 },
  { t: "+", x: "50%", y: "90%", s: 40, c: "#F06595", r: 0, d: 5 },
];

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="fun relative min-h-screen overflow-hidden bg-[#FFF8E6]">
      {/* фон */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(#F2D98C_1.5px,transparent_1.5px)] [background-size:26px_26px]" />
      {DOODLES.map((d, i) => (
        <span key={i} aria-hidden className="fun-bob pointer-events-none absolute hidden sm:block font-black select-none"
          style={{ left: d.x, top: d.y, fontSize: d.s, color: d.c, ["--r" as string]: `${d.r}deg`, ["--d" as string]: `${d.d}s` }}>{d.t}</span>
      ))}

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between">
          <Logo />
          <span className="sticker-sm hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-extrabold text-[#1E1B4B]"><Sparkles className="h-4 w-4 text-[#FAB005]" /> Тегін · 5–11 сынып</span>
        </header>

        <div className="flex flex-1 items-center py-6 [@media(max-height:720px)]:py-3">
          <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            {/* Робот жағы */}
            <aside className="relative hidden lg:flex flex-col items-center">
              <h2 className="text-center text-[2.1rem] font-black leading-tight text-[#1E1B4B]">
                Информатика мұғалімдеріне арналған{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span aria-hidden className="absolute inset-x-[-6px] bottom-1 -z-0 h-4 -rotate-1 rounded-full bg-[#FFD43B]" />
                  <span className="relative">ақылды көмекші</span>
                </span>
              </h2>
              <div className="mt-4 flex flex-wrap justify-center gap-2 [@media(max-height:720px)]:hidden">
                {FEATURES.map((f, i) => (
                  <span key={f.label} className="sticker-sm inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold text-[#1E1B4B]" style={{ background: f.bg, transform: `rotate(${[-3, 2, -1, 3, -2][i]}deg)` }}>
                    <f.icon className="h-4 w-4" />{f.label}
                  </span>
                ))}
              </div>
              <div className="relative mt-6 w-full flex justify-center">
                <span aria-hidden className="absolute bottom-6 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#FFD43B] sticker" />
                <Star aria-hidden className="fun-bob absolute left-[18%] bottom-40 h-8 w-8 fill-[#FF6B6B] text-[#1E1B4B]" style={{ ["--d" as string]: "3.5s" }} />
                <Star aria-hidden className="fun-bob absolute right-[16%] bottom-24 h-6 w-6 fill-[#63E6BE] text-[#1E1B4B]" style={{ ["--d" as string]: "4.2s" }} />
                <AuthGuide fun />
              </div>
            </aside>

            {/* Форма */}
            <main className="sticker relative rounded-[2rem] bg-white px-5 py-8 sm:px-10">
              <span aria-hidden className="absolute -top-5 right-8 rotate-6 rounded-xl bg-[#FF8787] px-3 py-1 text-sm font-black text-[#1E1B4B] sticker-sm">Сәлем! 👋</span>
              <div className="mx-auto w-full max-w-md page-enter">
                <div className="lg:hidden"><AuthGuide compact fun /></div>
                <h1 className="text-4xl font-black text-[#1E1B4B]">{title.replace(" 👋", "")}</h1>
                <p className="mt-2 text-lg font-semibold text-[#5C5A7A]">{subtitle}</p>
                <div className="mt-7">{children}</div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
