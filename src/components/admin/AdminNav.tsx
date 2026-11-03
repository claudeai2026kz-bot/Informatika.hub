"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Layers, ListTree, ClipboardCheck, Gamepad2, MessageSquare, ArrowLeft } from "lucide-react";
import Logo from "../Logo";

const LINKS = [
  { href: "/admin", label: "Басқару тақтасы", i: LayoutDashboard },
  { href: "/admin/users", label: "Пайдаланушылар", i: Users },
  { href: "/admin/topics", label: "Тақырыптар", i: ListTree },
  { href: "/admin/materials", label: "Материалдар", i: Layers },
  { href: "/admin/assessments", label: "БЖБ / ТЖБ", i: ClipboardCheck },
  { href: "/admin/games", label: "Ойындар", i: Gamepad2 },
  { href: "/admin/comments", label: "Пікірлер", i: MessageSquare },
];

export default function AdminNav({ name }: { name: string }) {
  const path = usePathname();
  const on = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));
  return (
    <aside className="lg:sticky lg:top-0 lg:h-screen border-b lg:border-b-0 lg:border-r border-sky-100 bg-white/80 backdrop-blur p-4 flex flex-col">
      <div className="flex items-center justify-between lg:block">
        <Logo href="/admin" small />
        <span className="chip bg-gold-100 text-gold-500 lg:mt-3">Әкімші</span>
      </div>
      <nav className="mt-4 flex lg:flex-col gap-1 overflow-x-auto -mx-1 px-1 pb-1">
        {LINKS.map(({ href, label, i: I }) => (
          <Link key={href} href={href} className={`shrink-0 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${on(href) ? "bg-gradient-to-r from-sky-500 to-lilac-500 text-white shadow-lift" : "text-ink-soft hover:bg-sky-50"}`}>
            <I className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto hidden lg:block pt-4 border-t border-sky-100">
        <p className="text-xs muted">Кірген: <b className="text-ink">{name}</b></p>
        <Link href="/dashboard" className="btn-ghost btn-sm w-full mt-3"><ArrowLeft className="h-4 w-4" /> Сайтқа оралу</Link>
      </div>
    </aside>
  );
}
