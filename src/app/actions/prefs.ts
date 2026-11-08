"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LANG_COOKIE, THEME_COOKIE, isLang, isTheme } from "@/lib/i18n";

const YEAR = 365 * 864e5;
const opts = () => ({ path: "/", sameSite: "lax" as const, expires: new Date(Date.now() + YEAR) });

/** Тақырып пен тілді cookie-ге жазады, кірген пайдаланушы болса – профиліне де сақтайды. */
export async function setPrefs(p: { theme?: string; lang?: string }) {
  const jar = await cookies();
  const data: { theme?: string; lang?: string } = {};
  if (isTheme(p.theme)) { jar.set(THEME_COOKIE, p.theme, opts()); data.theme = p.theme; }
  if (isLang(p.lang)) { jar.set(LANG_COOKIE, p.lang, opts()); data.lang = p.lang; }
  const user = await getCurrentUser();
  if (user && Object.keys(data).length) await db.user.update({ where: { id: user.id }, data });
}

/** Кіргенде профильде сақталған таңдауды cookie-ге қайтарады. */
export async function applyUserPrefs(theme?: string | null, lang?: string | null) {
  const jar = await cookies();
  if (isTheme(theme)) jar.set(THEME_COOKIE, theme, opts());
  if (isLang(lang)) jar.set(LANG_COOKIE, lang, opts());
}
