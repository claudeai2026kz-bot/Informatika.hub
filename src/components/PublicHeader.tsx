import Link from "next/link";
import Logo from "./Logo";
import { getCurrentUser } from "@/lib/auth";
import PrefsSwitcher from "./PrefsSwitcher";
import { getT } from "@/lib/i18n/server";

export default async function PublicHeader() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-3">
        <div className="glass rounded-2xl h-16 px-4 sm:px-5 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-soft">
            <a href="#features" className="hover:text-sky-600 transition">{t("Мүмкіндіктер")}</a>
            <a href="#grades" className="hover:text-sky-600 transition">{t("Сыныптар")}</a>
            <a href="#games" className="hover:text-sky-600 transition">{t("Ойындар")}</a>
            <a href="#robot" className="hover:text-sky-600 transition">{t("Робот-көмекші")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <PrefsSwitcher tone="light" />
            {user ? (
              <Link href="/dashboard" className="btn-primary btn-sm">{t("Менің панелім")}</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">{t("Жүйеге кіру")}</Link>
                <Link href="/register" className="btn-primary btn-sm">{t("Бастау")}</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
