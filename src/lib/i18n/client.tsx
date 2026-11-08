"use client";
import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LANG, makeT, type Lang, type T } from ".";

const Ctx = createContext<{ lang: Lang; t: T }>({ lang: DEFAULT_LANG, t: makeT(DEFAULT_LANG) });

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, t: makeT(lang) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx).t;
}
export function useLang() {
  return useContext(Ctx).lang;
}
