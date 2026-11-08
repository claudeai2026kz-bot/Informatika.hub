"use client";
import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/app/actions/reviews";
import SubmitButton from "./ui/SubmitButton";
import { FormAlert } from "./ui/Field";
import { useT } from "@/lib/i18n/client";

export default function CommentForm({ materialId, assessmentId }: { materialId?: string; assessmentId?: string }) {
  const t = useT();
  const [state, action] = useActionState(addComment, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <FormAlert msg={state?.error} />
      {materialId && <input type="hidden" name="materialId" value={materialId} />}
      {assessmentId && <input type="hidden" name="assessmentId" value={assessmentId} />}
      <label htmlFor="text" className="sr-only">{t("Пікір")}</label>
      <textarea id="text" name="text" rows={3} maxLength={1000} className="input resize-y" placeholder={t("Материал туралы пікіріңізді жазыңыз…")} required />
      <SubmitButton className="btn-primary" pendingText="Жіберіліп жатыр…">{t("Пікір жіберу")}</SubmitButton>
    </form>
  );
}
