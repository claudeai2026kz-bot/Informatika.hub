"use client";
import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import PasswordInput from "@/components/ui/PasswordInput";
import SubmitButton from "@/components/ui/SubmitButton";
import { FieldError, FormAlert } from "@/components/ui/Field";

export default function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {notice && !state && <FormAlert tone="ok" msg={notice} />}
      <FormAlert msg={e.form} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="label">Электрондық пошта</label>
        <input id="email" name="email" type="email" autoComplete="email" className={`input ${e.email ? "!border-rose-400" : ""}`} placeholder="example@mail.kz" defaultValue={state?.values?.email} aria-invalid={!!e.email || undefined} aria-describedby="email-err" required />
        <FieldError id="email-err" msg={e.email} />
      </div>
      <div>
        <label htmlFor="password" className="label">Құпиясөз</label>
        <PasswordInput id="password" name="password" placeholder="Құпиясөзді енгізіңіз" autoComplete="current-password" invalid={!!e.password} />
        <FieldError msg={e.password} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input type="hidden" name="rememberSet" value="1" />
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 rounded border-sky-300 accent-[#2F6BFF]" /> Мені есте сақтау
        </label>
        <Link href="/forgot" className="text-sm font-medium text-[#2F6BFF] hover:underline">Құпиясөзді ұмыттыңыз ба?</Link>
      </div>
      <SubmitButton pendingText="Кіріп жатыр…">Кіру</SubmitButton>
      <p className="text-center text-sm muted">Аккаунтыңыз жоқ па? <Link href="/register" className="font-semibold text-sky-600 hover:underline">Тіркелу</Link></p>
    </form>
  );
}
