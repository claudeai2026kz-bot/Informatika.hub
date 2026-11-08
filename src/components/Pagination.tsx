import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function Pagination({ page, pages, base, params }: { page: number; pages: number; base: string; params: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const t = await getT();
  const href = (p: number) => {
    const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    s.set("page", String(p));
    return `${base}?${s}`;
  };
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label={t("Беттер")}>
      {page > 1 && <Link className="btn-ghost btn-sm" href={href(page - 1)}>← {t("Алдыңғы")}</Link>}
      <span className="text-sm muted px-2">{page} / {pages}</span>
      {page < pages && <Link className="btn-ghost btn-sm" href={href(page + 1)}>{t("Келесі")} →</Link>}
    </nav>
  );
}
