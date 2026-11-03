"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ name, id, placeholder, autoComplete, invalid }: { name: string; id: string; placeholder?: string; autoComplete?: string; invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        className={`input pr-12 ${invalid ? "!border-rose-400 focus:!ring-rose-100" : ""}`}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg text-ink-mute hover:bg-sky-50 hover:text-sky-600"
        aria-label={show ? "Құпиясөзді жасыру" : "Құпиясөзді көрсету"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
