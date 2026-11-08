import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  const t = await getT();
  return (
    <nav aria-label={t("Навигация жолы")} className="flex flex-wrap items-center gap-1 text-sm muted">
      <Link href="/dashboard" className="hover:text-sky-600">{t("Басты бет")}</Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {it.href ? <Link href={it.href} className="hover:text-sky-600">{t(it.label)}</Link> : <span className="text-ink font-medium">{t(it.label)}</span>}
        </span>
      ))}
    </nav>
  );
}
