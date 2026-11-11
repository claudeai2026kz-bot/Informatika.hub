"use client";
import { useTransition } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { acceptStranger, dismissStranger } from "@/app/actions/classes";
import { useT } from "@/lib/i18n/client";

/** «Тізімде жоқ» есім: тізімге қосу не нәтижесін өшіру. */
export default function StrangerActions({ classId, name }: { classId: string; name: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex gap-1.5">
      <button type="button" className="btn-primary btn-sm" disabled={pending} onClick={() => start(async () => { await acceptStranger(classId, name); })}>
        <UserPlus className="h-4 w-4" /> {t("Тізімге қосу")}
      </button>
      <button type="button" className="btn-ghost btn-sm text-rose-600" disabled={pending} aria-label={t("Өшіру")}
        onClick={() => { if (confirm(t("«{n}» атымен жіберілген нәтижелер өшірілсін бе?", { n: name }))) start(() => dismissStranger(classId, name)); }}>
        <Trash2 className="h-4 w-4" />
      </button>
    </span>
  );
}
