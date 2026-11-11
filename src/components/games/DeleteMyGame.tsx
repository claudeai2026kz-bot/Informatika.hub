"use client";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteMyGame } from "@/app/actions/my-games";
import { useT } from "@/lib/i18n/client";

export default function DeleteMyGame({ id }: { id: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn-ghost btn-sm !px-2 text-rose-600" disabled={pending} aria-label={t("Жою")}
      onClick={() => { if (confirm(t("Ойынды жоясыз ба? Оқушылар нәтижесі де өшеді."))) start(() => deleteMyGame(id)); }}>
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
