"use client";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

const ICONS = { mail: Mail, lock: Lock, user: User };

/** Кіру/тіркелу бетіндегі жол: ішінде белгі, басқанда жоғары жылжитын жазу, жарқырайтын жиек. */
export default function AuthField({ id, name, label, icon, type = "text", autoComplete, defaultValue, error, hint }: {
  id: string; name: string; label: string; icon: keyof typeof ICONS; type?: "text" | "email" | "password"; autoComplete?: string; defaultValue?: string; error?: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  const I = ICONS[icon];
  const pw = type === "password";
  return (
    <div>
      <div className={`auth-field ${error ? "err" : ""}`}>
        <I className="fi h-5 w-5" aria-hidden />
        <input id={id} name={name} type={pw && !show ? "password" : pw ? "text" : type} autoComplete={autoComplete} defaultValue={defaultValue}
          placeholder=" " aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-err` : undefined} required />
        <label htmlFor={id}>{label}</label>
        {pw && (
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition"
            aria-label={show ? "Құпиясөзді жасыру" : "Құпиясөзді көрсету"}>
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {hint && !error && <p className="mt-1.5 pl-1 text-[13px] text-white/55">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 pl-1 text-sm text-rose-300">{error}</p>}
    </div>
  );
}
