"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { rateMaterial } from "@/app/actions/reviews";

export default function RatingStars({ materialId, mine, loggedIn }: { materialId: string; mine: number; loggedIn: boolean }) {
  const [hover, setHover] = useState(0);
  const [val, setVal] = useState(mine);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div>
      <div className="flex gap-1" role="radiogroup" aria-label="Бағалау" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={val === n}
            aria-label={`${n} жұлдыз`}
            disabled={pending}
            onMouseEnter={() => setHover(n)}
            onClick={() => {
              if (!loggedIn) return router.push(`/login?next=/materials/${materialId}`);
              setVal(n);
              start(async () => {
                const r = await rateMaterial(materialId, n);
                setMsg(r.error ?? "Бағаңыз сақталды, рақмет!");
                router.refresh();
              });
            }}
            className="p-0.5 transition hover:scale-110"
          >
            <Star className={`h-7 w-7 ${(hover || val) >= n ? "fill-gold-400 text-gold-400" : "text-sky-200"}`} />
          </button>
        ))}
      </div>
      {msg && <p className="mt-1 text-xs muted" role="status">{msg}</p>}
    </div>
  );
}
