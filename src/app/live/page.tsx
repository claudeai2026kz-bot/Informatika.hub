"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useT } from "@/lib/i18n/client";

/** Оқушы ойын кодын енгізеді. */
export default function LiveJoin() {
  const t = useT();
  const [code, setCode] = useState("");
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2B2FA8] via-[#5B2FC0] to-[#8B3FD8] px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center rounded-2xl bg-white/90 py-3"><Logo /></div>
        <form className="card p-6 sm:p-8 text-center" onSubmit={(e) => { e.preventDefault(); if (/^\d{6}$/.test(code)) router.push(`/live/${code}`); }}>
          <h1 className="text-2xl font-extrabold">{t("Ойынға кіру")}</h1>
          <p className="mt-1 muted">{t("Мұғалім тақтада көрсеткен 6 таңбалы кодты жаз.")}</p>
          <input className="input mt-5 h-16 text-center font-mono text-3xl tracking-[.3em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" autoFocus aria-label={t("Ойын коды")} />
          <button className="btn-primary h-14 w-full mt-4 text-lg" disabled={code.length !== 6}>{t("Кіру")}</button>
        </form>
      </div>
    </div>
  );
}
