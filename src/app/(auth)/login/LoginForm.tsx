"use client";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import AuthField from "@/components/ui/AuthField";
import SubmitButton from "@/components/ui/SubmitButton";

export default function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="stagger space-y-4" noValidate>
      {notice && !state && <div role="status" className="alert-dark border border-emerald-400/30 bg-emerald-400/10 text-emerald-200">{notice}</div>}
      {e.form && <div role="alert" className="alert-dark border border-rose-400/30 bg-rose-400/10 text-rose-200">{e.form}</div>}
      <input type="hidden" name="next" value={next ?? ""} />
      <AuthField key={`e${state ? Date.now() : 0}`} id="email" name="email" type="email" icon="mail" label="Электрондық пошта" autoComplete="email" defaultValue={state?.values?.email} error={e.email} />
      <AuthField key={`p${state ? Date.now() : 0}`} id="password" name="password" type="password" icon="lock" label="Құпиясөз" autoComplete="current-password" error={e.password} />
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <input type="hidden" name="rememberSet" value="1" />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
          <input type="checkbox" name="remember" defaultChecked className="h-[18px] w-[18px] rounded accent-[#22D3EE]" /> Мені есте сақтау
        </label>
        <Link href="/forgot" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">Құпиясөзді ұмыттыңыз ба?</Link>
      </div>
      <SubmitButton className="auth-btn mt-2" pendingText="Кіріп жатыр…">Кіру</SubmitButton>
      <p className="pt-1 text-center text-[15px] text-white/70">Аккаунтыңыз жоқ па? <Link href="/register" className="font-bold text-cyan-300 hover:text-cyan-200">Тіркелу</Link></p>
    </form>
  );
}
