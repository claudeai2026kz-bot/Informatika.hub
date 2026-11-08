"use client";
import { useActionState } from "react";
import PasswordInput from "@/components/ui/PasswordInput";
import SubmitButton from "@/components/ui/SubmitButton";
import { FormAlert } from "@/components/ui/Field";
import { resetPasswordAction } from "@/app/actions/reset";

import { useT } from "@/lib/i18n/client";
export default function ResetForm({ token }: { token: string }) {
  const t = useT();
  const [state, action] = useActionState(resetPasswordAction, undefined);
  return (
    <form action={action} className="space-y-5">
      <FormAlert msg={state?.error} />
      <input type="hidden" name="token" value={token} />
      <div><label className="label" htmlFor="password">{t("Жаңа құпиясөз")}</label><PasswordInput id="password" name="password" autoComplete="new-password" /></div>
      <div><label className="label" htmlFor="confirm">{t("Құпиясөзді қайталаңыз")}</label><PasswordInput id="confirm" name="confirm" autoComplete="new-password" /></div>
      <SubmitButton>{t("Сақтау")}</SubmitButton>
    </form>
  );
}
