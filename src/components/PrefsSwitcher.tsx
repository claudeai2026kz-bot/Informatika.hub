"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Languages, Moon, Sun } from "lucide-react";
import { LANGS, THEMES, THEME_COOKIE, isTheme, type Theme } from "@/lib/i18n";
import { useLang, useT } from "@/lib/i18n/client";
import { setPrefs } from "@/app/actions/prefs";

const THEME_META: Record<Theme, { label: string; icon: typeof Sun }> = {
  light: { label: "Қарапайым режим", icon: Sun },
  dark: { label: "Түнгі режим", icon: Moon },
  read: { label: "Оқу режимі", icon: BookOpen },
};

function currentTheme(): Theme {
  const v = typeof document !== "undefined" ? document.documentElement.dataset.theme : undefined;
  return isTheme(v) ? v : "light";
}

/** Режим (қарапайым / түнгі / оқу) және тіл (ҚАЗ / РУС / ENG) ауыстырғышы. */
export default function PrefsSwitcher({ tone = "dark", full = false }: { tone?: "dark" | "light"; full?: boolean }) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("light");
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setTheme(currentTheme()), []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, []);

  const pickTheme = (v: Theme) => {
    setTheme(v);
    document.documentElement.dataset.theme = v;
    document.cookie = `${THEME_COOKIE}=${v}; path=/; max-age=31536000; samesite=lax`;
    start(() => setPrefs({ theme: v }));
  };
  const pickLang = (v: string) => {
    setOpen(false);
    if (v === lang) return;
    start(async () => { await setPrefs({ lang: v }); router.refresh(); });
  };

  const panel = (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide muted">{t("Режим")}</div>
        <div className="grid gap-1">
          {THEMES.map((k) => {
            const { label, icon: I } = THEME_META[k];
            return (
              <button key={k} type="button" onClick={() => pickTheme(k)} aria-pressed={theme === k}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition ${theme === k ? "bg-sky-100 text-sky-600 font-semibold" : "hover:bg-sky-50"}`}>
                <I className="h-4 w-4" /> <span className="flex-1">{t(label)}</span>{theme === k && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide muted">{t("Тіл")}</div>
        <div className="grid grid-cols-3 gap-1">
          {LANGS.map((l) => (
            <button key={l.key} type="button" onClick={() => pickLang(l.key)} aria-pressed={lang === l.key} title={l.name} lang={l.key}
              className={`rounded-lg px-2 py-2 text-xs font-bold transition ${lang === l.key ? "bg-sky-500 text-white" : "bg-sky-50 text-ink-soft hover:bg-sky-100"}`}>
              {l.short}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (full) return panel;

  const Icon = THEME_META[theme].icon;
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open} aria-label={t("Режим және тіл")}
        className={`flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold transition ${tone === "dark" ? "text-white/85 hover:bg-white/10" : "text-ink-soft hover:bg-sky-50"}`}>
        <Icon className="h-[18px] w-[18px]" />
        <Languages className="h-4 w-4 opacity-70 hidden sm:block" />
        <span>{LANGS.find((l) => l.key === lang)?.short}</span>
      </button>
      {open && <div role="dialog" className="absolute right-0 mt-2 w-60 card p-3 animate-fadeUp text-ink z-50">{panel}</div>}
    </div>
  );
}
