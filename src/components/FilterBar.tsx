"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X, Loader2 } from "lucide-react";

export type FilterDef = { name: string; label: string; options: { value: string; label: string }[] };

/** Сүзгі өзгергенде URL жаңарады, нәтиже серверден келеді. */
export default function FilterBar({ filters, placeholder = "Атауы бойынша іздеу…" }: { filters: FilterDef[]; placeholder?: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [pending, start] = useTransition();

  useEffect(() => setQ(sp.get("q") ?? ""), [sp]);

  function set(updates: Record<string, string>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) v ? next.set(k, v) : next.delete(k);
    next.delete("page");
    // тәуелді сүзгілер: сынып/тоқсан өзгерсе, тақырыпты тазалаймыз
    if ("grade" in updates || "quarter" in updates) next.delete("topic");
    start(() => router.push(`${path}?${next}`, { scroll: false }));
  }

  const active = filters.some((f) => sp.get(f.name)) || sp.get("q");

  return (
    <div className="card p-3 sm:p-4">
      <form onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() }); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-ink-mute h-4 w-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-10" placeholder={placeholder} aria-label="Іздеу" maxLength={100} />
        </div>
        <button className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Іздеу"}</button>
      </form>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {filters.map((f) => (
          <select key={f.name} aria-label={f.label} className="input h-10 text-sm" value={sp.get(f.name) ?? ""} onChange={(e) => set({ [f.name]: e.target.value })} disabled={f.options.length === 0}>
            <option value="">{f.label}: барлығы</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        {active && (
          <button type="button" onClick={() => start(() => router.push(path))} className="btn-ghost h-10 text-sm"><X className="h-4 w-4" /> Тазалау</button>
        )}
      </div>
    </div>
  );
}
