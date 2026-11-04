"use client";
import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import AuthField from "@/components/ui/AuthField";
import SubmitButton from "@/components/ui/SubmitButton";

export default function RegisterForm() {
  const [state, action] = useActionState(registerAction, undefined);
  const e = state?.errors ?? {};
  const k = state ? Date.now() : 0;
  return (
    <form action={action} className="stagger space-y-3.5" noValidate>
      {e.form && <div role="alert" className="alert-dark border border-rose-400/30 bg-rose-400/10 text-rose-200">{e.form}</div>}
      <AuthField key={`n${k}`} id="name" name="name" icon="user" label="Аты-жөні" autoComplete="name" defaultValue={state?.values?.name} error={e.name} />
      <AuthField key={`e${k}`} id="email" name="email" type="email" icon="mail" label="Электрондық пошта" autoComplete="email" defaultValue={state?.values?.email} error={e.email} />
      <AuthField key={`p${k}`} id="password" name="password" type="password" icon="lock" label="Құпиясөз" hint="Кемінде 8 таңба, ішінде әріп пен сан болсын" autoComplete="new-password" error={e.password} />
      <AuthField key={`c${k}`} id="confirm" name="confirm" type="password" icon="lock" label="Құпиясөзді қайталаңыз" autoComplete="new-password" error={e.confirm} />
      <SubmitButton className="auth-btn mt-2" pendingText="Тіркеліп жатыр…">Тіркелу</SubmitButton>
      <p className="pt-1 text-center text-[15px] text-white/70">Аккаунтыңыз бар ма? <Link href="/login" className="font-bold text-cyan-300 hover:text-cyan-200">Жүйеге кіру</Link></p>
    </form>
  );
}
