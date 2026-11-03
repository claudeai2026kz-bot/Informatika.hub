"use client";
import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import PasswordInput from "@/components/ui/PasswordInput";
import SubmitButton from "@/components/ui/SubmitButton";
import { FieldError, FormAlert } from "@/components/ui/Field";

export default function RegisterForm() {
  const [state, action] = useActionState(registerAction, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormAlert msg={e.form} />
      <div>
        <label htmlFor="name" className="label">Аты-жөні</label>
        <input id="name" name="name" autoComplete="name" className={`input ${e.name ? "!border-rose-400" : ""}`} placeholder="Айдана Әбілқайыр" defaultValue={state?.values?.name} required />
        <FieldError msg={e.name} />
      </div>
      <div>
        <label htmlFor="email" className="label">Электрондық пошта</label>
        <input id="email" name="email" type="email" autoComplete="email" className={`input ${e.email ? "!border-rose-400" : ""}`} placeholder="example@mail.kz" defaultValue={state?.values?.email} required />
        <FieldError msg={e.email} />
      </div>
      <div>
        <label htmlFor="password" className="label">Құпиясөз</label>
        <PasswordInput id="password" name="password" placeholder="Кемінде 8 таңба, әріп және сан" autoComplete="new-password" invalid={!!e.password} />
        <FieldError msg={e.password} />
      </div>
      <div>
        <label htmlFor="confirm" className="label">Құпиясөзді қайталаңыз</label>
        <PasswordInput id="confirm" name="confirm" placeholder="Құпиясөзді қайта енгізіңіз" autoComplete="new-password" invalid={!!e.confirm} />
        <FieldError msg={e.confirm} />
      </div>
      <SubmitButton pendingText="Тіркеліп жатыр…">Тіркелу</SubmitButton>
      <p className="text-center text-sm muted">Аккаунтыңыз бар ма? <Link href="/login" className="font-semibold text-sky-600 hover:underline">Жүйеге кіру</Link></p>
    </form>
  );
}
