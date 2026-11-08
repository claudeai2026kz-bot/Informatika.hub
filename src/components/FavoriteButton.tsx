"use client";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavorite, type FavTarget } from "@/app/actions/favorites";
import { useT } from "@/lib/i18n/client";

export default function FavoriteButton({ target, initial, loggedIn, withLabel = false }: { target: FavTarget; initial: boolean; loggedIn: boolean; withLabel?: boolean }) {
  const t = useT();
  const [on, setOn] = useOptimistic(initial);
  const [, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (!loggedIn) return router.push(`/login?next=${encodeURIComponent(location.pathname)}`);
        start(async () => { setOn(!on); await toggleFavorite(target); router.refresh(); });
      }}
      className={withLabel ? `btn-ghost w-full ${on ? "!border-rose-200 !text-rose-500 !bg-rose-50" : ""}` : `relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition hover:bg-rose-50 ${on ? "text-rose-500" : "text-ink-mute"}`}
      aria-pressed={on}
      aria-label={t(on ? "Таңдаулылардан алып тастау" : "Таңдаулыға қосу")}
      title={t(on ? "Таңдаулылардан алып тастау" : "Таңдаулыға қосу")}
    >
      <Heart className={`h-5 w-5 transition ${on ? "fill-rose-500 scale-110" : ""}`} />
      {withLabel && t(on ? "Таңдаулыда" : "Таңдаулыға қосу")}
    </button>
  );
}
