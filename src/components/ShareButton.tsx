"use client";
import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost w-full"
      onClick={async () => {
        const url = location.href;
        try {
          if (navigator.share) await navigator.share({ title, url });
          else { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); }
        } catch { /* пайдаланушы бас тартты */ }
      }}
    >
      {done ? <><Check className="h-4 w-4 text-emerald-500" /> Сілтеме көшірілді</> : <><Share2 className="h-4 w-4" /> Бөлісу</>}
    </button>
  );
}
