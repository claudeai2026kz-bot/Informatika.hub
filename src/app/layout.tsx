import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/nunito";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Informatika Hub", template: "%s · Informatika Hub" },
  description: "Информатика мұғалімдеріне арналған ақылды көмекші: 5–11 сыныптың презентациялары, ҚМЖ, БЖБ, ТЖБ және интерактивті ойындар.",
};
export const viewport: Viewport = { themeColor: "#67B7F7", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kk">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
