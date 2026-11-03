import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Навигация жолы" className="flex flex-wrap items-center gap-1 text-sm muted">
      <Link href="/dashboard" className="hover:text-sky-600">Басты бет</Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {it.href ? <Link href={it.href} className="hover:text-sky-600">{it.label}</Link> : <span className="text-ink font-medium">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
