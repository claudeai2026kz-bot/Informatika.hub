import Link from "next/link";
import Logo from "./Logo";
import { getCurrentUser } from "@/lib/auth";

export default async function PublicHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-3">
        <div className="glass rounded-2xl h-16 px-4 sm:px-5 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-soft">
            <a href="#features" className="hover:text-sky-600 transition">Мүмкіндіктер</a>
            <a href="#grades" className="hover:text-sky-600 transition">Сыныптар</a>
            <a href="#games" className="hover:text-sky-600 transition">Ойындар</a>
            <a href="#robot" className="hover:text-sky-600 transition">Робот-көмекші</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="btn-primary btn-sm">Менің панелім</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">Жүйеге кіру</Link>
                <Link href="/register" className="btn-primary btn-sm">Бастау</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
