import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, DEFAULT_THEME, LANG_COOKIE, THEME_COOKIE, isLang, isTheme, makeT, type Lang, type Theme } from ".";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}

export async function getTheme(): Promise<Theme> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(v) ? v : DEFAULT_THEME;
}

export async function getT() {
  return makeT(await getLang());
}
