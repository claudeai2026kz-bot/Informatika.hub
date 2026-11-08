"use client";
import { ABBR } from "@/lib/labels";
import { useT } from "@/lib/i18n/client";

/** ҚМЖ, БЖБ, ТЖБ қысқартуларының толық атауын көрсетеді. */
export default function Abbr({ k }: { k: keyof typeof ABBR | string }) {
  const t = useT();
  const full = ABBR[k as string];
  if (!full) return <>{t(k)}</>;
  return (
    <abbr title={t(full)} className="no-underline cursor-help decoration-dotted underline-offset-2 hover:underline">
      {t(k)}
    </abbr>
  );
}
