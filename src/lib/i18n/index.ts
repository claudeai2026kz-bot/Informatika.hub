import ru from "./ru";
import en from "./en";

// Интерфейс тілдері. Негізгі тіл – қазақша: кілт ретінде қазақша мәтіннің өзі алынады,
// аудармасы табылмаса, қазақша нұсқасы көрсетіледі.
// Тек интерфейс аударылады; әкімші жүктеген материалдардың мазмұны өзгермейді.
export const LANGS = [
  { key: "kk", short: "ҚАЗ", name: "Қазақша" },
  { key: "ru", short: "РУС", name: "Русский" },
  { key: "en", short: "ENG", name: "English" },
] as const;
export type Lang = (typeof LANGS)[number]["key"];
export const DEFAULT_LANG: Lang = "kk";
export const LANG_COOKIE = "ih_lang";

export const THEMES = ["light", "dark", "read"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "light";
export const THEME_COOKIE = "ih_theme";

const DICTS: Record<Exclude<Lang, "kk">, Record<string, string>> = { ru, en };

export function isLang(v: unknown): v is Lang {
  return LANGS.some((l) => l.key === v);
}
export function isTheme(v: unknown): v is Theme {
  return (THEMES as readonly unknown[]).includes(v);
}

export type Vars = Record<string, string | number>;
export type T = (s: string, vars?: Vars) => string;

const fill = (s: string, vars: Vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

export function translate(lang: Lang, s: string, vars?: Vars): string {
  if (lang === "kk" || !s) return vars ? fill(s, vars) : s;
  const dict = DICTS[lang];
  let out = dict[s];
  if (out === undefined) {
    // «7-сынып» сияқты сан бар мәтін: санды {n}-ге ауыстырып үлгіні іздейміз.
    const num = s.match(/\d+/)?.[0];
    const pattern = num ? dict[s.replace(num, "{n}")] : undefined;
    out = pattern !== undefined ? fill(pattern, { n: num! }) : s;
  }
  return vars ? fill(out, vars) : out;
}

export function makeT(lang: Lang): T {
  return (s, vars) => translate(lang, s, vars);
}

export const LOCALES: Record<Lang, string> = { kk: "kk-KZ", ru: "ru-RU", en: "en-US" };
