import { ABBR } from "@/lib/labels";

/** ҚМЖ, БЖБ, ТЖБ қысқартуларының толық атауын көрсетеді. */
export default function Abbr({ k }: { k: keyof typeof ABBR | string }) {
  const full = ABBR[k as string];
  if (!full) return <>{k}</>;
  return (
    <abbr title={full} className="no-underline cursor-help decoration-dotted underline-offset-2 hover:underline">
      {k}
    </abbr>
  );
}
