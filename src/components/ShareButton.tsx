"use client";
import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/** Бөлісу: телефонда жүйелік мәзір, компьютерде сілтемені көшіреді. url берілмесе — ағымдағы бет. */
export default function ShareButton({ title, url, className = "btn-ghost w-full" }: { title: string; url?: string; className?: string }) {
  const t = useT();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={url ? "btn-ghost btn-sm" : className}
      onClick={async () => {
        const link = url ? new URL(url, location.origin).toString() : location.href;
        try {
          if (navigator.share) await navigator.share({ title, url: link });
          else { await navigator.clipboard.writeText(link); setDone(true); setTimeout(() => setDone(false), 2000); }
        } catch { /* пайдаланушы бас тартты */ }
      }}
    >
      {done ? <><Check className="h-4 w-4 text-emerald-500" /> {t("Сілтеме көшірілді")}</> : <><Share2 className="h-4 w-4" /> {t("Бөлісу")}</>}
    </button>
  );
}
