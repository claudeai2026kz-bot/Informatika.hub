import Link from "next/link";
import Logo from "./Logo";
import { getT } from "@/lib/i18n/server";

export default async function Footer() {
  const t = await getT();
  return (
    <footer className="mt-24 border-t border-sky-100 bg-white/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm muted max-w-xs">{t("Информатика мұғалімдеріне арналған ақылды көмекші: 5–11 сыныптың дайын материалдары бір жерде.")}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-3">{t("Платформа")}</h3>
          <ul className="space-y-2 text-sm muted">
            <li><Link className="hover:text-sky-600" href="/materials">{t("Материалдар")}</Link></li>
            <li><Link className="hover:text-sky-600" href="/assessments">{t("БЖБ / ТЖБ")}</Link></li>
            <li><Link className="hover:text-sky-600" href="/games">{t("Ойындар")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">{t("Ақпарат")}</h3>
          <ul className="space-y-2 text-sm muted">
            <li><Link className="hover:text-sky-600" href="/about">{t("Жоба туралы")}</Link></li>
            <li><Link className="hover:text-sky-600" href="/contact">{t("Байланыс")}</Link></li>
            <li><Link className="hover:text-sky-600" href="/support">{t("Қолдау қызметі")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3">{t("Құқықтық")}</h3>
          <ul className="space-y-2 text-sm muted">
            <li><Link className="hover:text-sky-600" href="/privacy">{t("Құпиялық саясаты")}</Link></li>
            <li><Link className="hover:text-sky-600" href="/terms">{t("Пайдалану ережелері")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sky-100 py-5 text-center text-xs muted">
        © {new Date().getFullYear()} Informatika Hub. {t("Барлық құқықтар қорғалған. Материалдар авторларының құқығы сақталады.")}
      </div>
    </footer>
  );
}
