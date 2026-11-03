"use client";
import Link from "next/link";
import { useActionState } from "react";
import AuthShell from "@/components/AuthShell";
import SubmitButton from "@/components/ui/SubmitButton";
import { FormAlert } from "@/components/ui/Field";
import { requestResetAction } from "@/app/actions/reset";

export default function ForgotPage() {
  const [state, action] = useActionState(requestResetAction, undefined);
  return (
    <AuthShell title="Құпиясөзді қалпына келтіру" subtitle="Email енгізіңіз, біз сізге жаңа құпиясөз орнату сілтемесін жібереміз">
      <form action={action} className="space-y-5" noValidate>
        <FormAlert msg={state?.error} />
        <FormAlert tone="ok" msg={state?.ok} />
        <div>
          <label htmlFor="email" className="label">Электрондық пошта</label>
          <input id="email" name="email" type="email" className="input" placeholder="example@mail.kz" required />
        </div>
        <SubmitButton>Сілтеме жіберу</SubmitButton>
        <p className="text-center text-sm"><Link href="/login" className="font-semibold text-sky-600 hover:underline">Жүйеге кіру бетіне оралу</Link></p>
      </form>
    </AuthShell>
  );
}
