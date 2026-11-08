import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { getLang, getTheme } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/client";

export async function generateMetadata(): Promise<Metadata> {
  const t = makeT(await getLang());
  return {
    title: { default: "Informatika Hub", template: "%s · Informatika Hub" },
    description: t("Информатика мұғалімдеріне арналған ақылды көмекші: 5–11 сыныптың презентациялары, ҚМЖ, БЖБ, ТЖБ және интерактивті ойындар."),
  };
}
export const viewport: Viewport = { themeColor: "#67B7F7", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, theme] = await Promise.all([getLang(), getTheme()]);
  return (
    <html lang={lang} data-theme={theme} suppressHydrationWarning>
      <body className="min-h-screen">
        <I18nProvider lang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
