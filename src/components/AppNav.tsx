"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Heart, Home, LayoutGrid, ClipboardCheck, Gamepad2, User, Settings, LogOut, Shield, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { logoutAction } from "@/app/actions/auth";

type NavUser = { name: string; role: "USER" | "ADMIN"; avatar?: string | null } | null;

const LINKS = [
  { href: "/dashboard", label: "Басты бет", icon: Home },
  { href: "/materials", label: "Материалдар", icon: LayoutGrid },
  { href: "/assessments", label: "БЖБ / ТЖБ", icon: ClipboardCheck },
  { href: "/games", label: "Ойындар", icon: Gamepad2 },
  { href: "/favorites", label: "Таңдаулылар", icon: Heart },
];

function Avatar({ user, size = 36 }: { user: NonNullable<NavUser>; size?: number }) {
  const initials = user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return user.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatar} alt="" width={size} height={size} className="rounded-full object-cover ring-2 ring-cyan-300/60" style={{ width: size, height: size }} />
  ) : (
    <span className="grid place-items-center rounded-full bg-gradient-to-br from-sky-400 to-lilac-500 text-white text-sm font-bold ring-2 ring-cyan-300/60" style={{ width: size, height: size }}>{initials}</span>
  );
}

export default function AppNav({ user, unread }: { user: NavUser; unread: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, []);
  const active = (href: string) => path === href || path.startsWith(href + "/") || (href === "/materials" && path.startsWith("/grades"));

  return (
    <>
      <header className="sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-3">
          <div className="app-bar rounded-2xl h-16 px-3 sm:px-4 flex items-center gap-3 text-white">
            <Logo href={user ? "/dashboard" : "/"} small />
            <nav className="hidden lg:flex items-center gap-1 ml-6" aria-label="Негізгі мәзір">
              {LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${active(href) ? "bg-white/12 text-white shadow-[inset_0_-2px_0_#22D3EE]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>{label}</Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-1.5">
              {user ? (
                <>
                  <Link href="/notifications" className="relative grid h-10 w-10 place-items-center rounded-xl text-white/80 hover:bg-white/10" aria-label={`Хабарламалар${unread ? `, ${unread} жаңа` : ""}`}>
                    <Bell className="h-5 w-5" />
                    {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
                  </Link>
                  <div className="relative" ref={menuRef}>
                    <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-white/10" aria-haspopup="menu" aria-expanded={open}>
                      <Avatar user={user} />
                      <span className="hidden sm:block max-w-[120px] truncate text-sm font-semibold">{user.name.split(" ")[0]}</span>
                      <ChevronDown className="h-4 w-4 text-white/60 hidden sm:block" />
                    </button>
                    {open && (
                      <div role="menu" className="absolute right-0 mt-2 w-56 card p-1.5 animate-fadeUp text-ink">
                        <MenuLink href="/profile" icon={User}>Профиль</MenuLink>
                        <MenuLink href="/settings" icon={Settings}>Баптаулар</MenuLink>
                        {user.role === "ADMIN" && <MenuLink href="/admin" icon={Shield}>Әкімші панелі</MenuLink>}
                        <form action={logoutAction}>
                          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50" role="menuitem"><LogOut className="h-4 w-4" /> Шығу</button>
                        </form>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href={`/login?next=${encodeURIComponent(path)}`} className="btn-ghost btn-sm">Кіру</Link>
                  <Link href="/register" className="btn-primary btn-sm hidden sm:inline-flex">Тіркелу</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Мобильді төменгі мәзір */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 app-bar rounded-t-2xl pb-[env(safe-area-inset-bottom)]" aria-label="Мобильді мәзір">
        <div className="grid grid-cols-5">
          {LINKS.map(({ href, label, icon: I }) => (
            <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${active(href) ? "text-cyan-300" : "text-white/60"}`}>
              <I className="h-5 w-5" />
              <span className="truncate max-w-full px-1">{({ "Басты бет": "Басты", "Материалдар": "Материал", "Таңдаулылар": "Таңдаулы" } as Record<string, string>)[label] ?? label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

function MenuLink({ href, icon: I, children }: { href: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <Link href={href} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-sky-50">
      <I className="h-4 w-4 text-ink-mute" /> {children}
    </Link>
  );
}
