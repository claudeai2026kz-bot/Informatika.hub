import Link from "next/link";

export default function Pagination({ page, pages, base, params }: { page: number; pages: number; base: string; params: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    s.set("page", String(p));
    return `${base}?${s}`;
  };
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Беттер">
      {page > 1 && <Link className="btn-ghost btn-sm" href={href(page - 1)}>← Алдыңғы</Link>}
      <span className="text-sm muted px-2">{page} / {pages}</span>
      {page < pages && <Link className="btn-ghost btn-sm" href={href(page + 1)}>Келесі →</Link>}
    </nav>
  );
}
