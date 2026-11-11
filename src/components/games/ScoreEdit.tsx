"use client";
import { useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { deleteStudentResult, setStudentScore } from "@/app/actions/results";
import { useT } from "@/lib/i18n/client";

/** Нәтижелер кестесінде баллды мұғалім өзі өзгертеді. */
export default function ScoreEdit({ id, score, max }: { id: string; score: number; max: number }) {
  const t = useT();
  const [v, setV] = useState(score);
  const [pending, start] = useTransition();
  const save = (n: number) => { const s = Math.max(0, Math.min(max, n)); setV(s); start(async () => { await setStudentScore(id, s); }); };
  const pct = v / Math.max(1, max);
  return (
    <span className="inline-flex items-center gap-1">
      <button className="grid h-7 w-7 place-items-center rounded-lg bg-sky-50 hover:bg-sky-100 disabled:opacity-40" disabled={pending || v <= 0} onClick={() => save(v - 1)} aria-label={t("Баллды азайту")}><Minus className="h-3.5 w-3.5" /></button>
      <span className={`chip min-w-[64px] justify-center ${pct >= 0.7 ? "bg-emerald-100 text-emerald-700" : pct >= 0.4 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{v} / {max}</span>
      <button className="grid h-7 w-7 place-items-center rounded-lg bg-sky-50 hover:bg-sky-100 disabled:opacity-40" disabled={pending || v >= max} onClick={() => save(v + 1)} aria-label={t("Баллды қосу")}><Plus className="h-3.5 w-3.5" /></button>
      <button className="ml-1 grid h-7 w-7 place-items-center rounded-lg text-rose-500 hover:bg-rose-50" disabled={pending} onClick={() => { if (confirm(t("Бұл нәтижені өшіру керек пе?"))) start(async () => { await deleteStudentResult(id); }); }} aria-label={t("Нәтижені өшіру")}><Trash2 className="h-3.5 w-3.5" /></button>
    </span>
  );
}
