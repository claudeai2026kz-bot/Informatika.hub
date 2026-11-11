"use client";
import { useState } from "react";
import { LockKeyhole, Unlock, EyeOff, ArrowRight, Check, X, Users } from "lucide-react";
import { alphabetFor, cipherCheck, encode, type Cipher as C } from "@/lib/cipher";
import { useT } from "@/lib/i18n/client";

type Q = { id: string; prompt: string; points: number; data: Record<string, unknown> };

function KeyTable({ word, cipher, shift }: { word: string; cipher: C; shift: number }) {
  const ab = alphabetFor(word).split("");
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl bg-[#0f1630] p-3">
      <table className="mx-auto border-separate border-spacing-[3px] font-mono text-xs sm:text-sm">
        <tbody>
          <tr>{ab.map((c) => <td key={c} className="h-7 w-7 rounded-md bg-white/10 text-center font-bold text-white">{c}</td>)}</tr>
          <tr>{ab.map((c, k) => <td key={c} className="h-7 w-7 rounded-md bg-gold-400/25 text-center font-bold text-gold-200">{cipher === "number" ? k + 1 : ab[(k + shift) % ab.length]}</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}

export default function Cipher({ questions, onDone }: { questions: Q[]; onDone: (a: Record<string, unknown>) => void }) {
  const t = useT();
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [step, setStep] = useState<"enc" | "pass" | "dec" | "show">("enc");
  const [enc, setEnc] = useState("");
  const [dec, setDec] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [score, setScore] = useState(0);
  const q = questions[i];
  const word = String(q?.data.word ?? "");
  const cipher = (q?.data.cipher as C) ?? "caesar";
  const shift = Number(q?.data.shift ?? 3);
  const a = names[i % 2] || t("1-оқушы"), b = names[(i + 1) % 2] || t("2-оқушы");
  const res = cipherCheck(word, cipher, shift, { enc, dec });
  const cname = cipher === "number" ? t("Әріп нөмірі (А=1, Ә=2 …)") : t("Цезарь шифры: әр әріп {n} орын алға жылжиды", { n: shift });

  if (!started)
    return (
      <form className="card p-6 sm:p-10 max-w-xl mx-auto" onSubmit={(e) => { e.preventDefault(); setStarted(true); }}>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lilac-100 text-lilac-600"><Users className="h-6 w-6" /></span>
        <h2 className="mt-3 text-xl font-bold">{t("Жұптың аттарын жазыңдар")}</h2>
        <p className="mt-1 text-sm muted">{t("Кезекпен бірің шифрлайсың, екіншің ашасың. Екеуің де дұрыс жасасаңдар, толық балл аласыңдар.")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[0, 1].map((k) => <input key={k} className="input" value={names[k]} maxLength={30} placeholder={t("{n}-оқушы", { n: k + 1 })} onChange={(e) => setNames((s) => (k ? [s[0], e.target.value] : [e.target.value, s[1]]))} />)}
        </div>
        <button className="btn-primary h-12 w-full mt-6">{t("Бастау")}</button>
      </form>
    );

  function finish() {
    const next = { ...answers, [q.id]: { enc, dec } };
    setAnswers(next);
    if (i + 1 < questions.length) { setI(i + 1); setEnc(""); setDec(""); setStep("enc"); } else onDone(next);
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_top,#2c1f63,#0e1027_70%)] p-5 sm:p-8 text-white shadow-[0_30px_60px_-30px_#1b0b4d]">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="rounded-full bg-white/10 px-3 py-1">{t("Сөз")} {i + 1} / {questions.length}</span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-gold-300">{t("{n} балл", { n: score })}</span>
      </div>
      {q.prompt && <p className="mt-4 text-white/80">{q.prompt}</p>}

      {step === "enc" && (
        <div className="mt-4 g-pop">
          <p className="inline-flex items-center gap-2 rounded-full bg-gold-400/20 px-3 py-1 text-sm font-bold text-gold-200"><EyeOff className="h-4 w-4" /> {t("{n}, тек сен қара!", { n: a })}</p>
          <h2 className="mt-3 text-xl font-bold">{t("Құпия сөзді шифрла")}</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">{word.split("").map((c, k) => <span key={k} className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl font-black text-ink shadow">{c}</span>)}</div>
          <p className="mt-4 text-sm text-white/80">{cname}</p>
          <KeyTable word={word} cipher={cipher} shift={shift} />
          <input className="input mt-4 !bg-white/95 !text-ink font-mono text-lg tracking-widest uppercase" value={enc} onChange={(e) => setEnc(e.target.value)} placeholder={cipher === "number" ? "16 11 …" : t("Шифрланған сөз")} aria-label={t("Шифрланған сөз")} />
          <button className="btn-primary mt-4" disabled={!enc.trim()} onClick={() => setStep("pass")}><LockKeyhole className="h-4 w-4" /> {t("Шифрладым")}</button>
        </div>
      )}
      {step === "pass" && (
        <div className="mt-6 grid place-items-center py-10 text-center g-pop">
          <LockKeyhole className="h-14 w-14 text-gold-300" />
          <h2 className="mt-3 text-2xl font-extrabold">{t("Құрылғыны жұбыңа бер: {n}", { n: b })}</h2>
          <p className="mt-1 text-white/70">{t("Хабар құлыпталды. Енді жұбың оны ашуы керек.")}</p>
          <button className="btn-primary mt-6" onClick={() => setStep("dec")}>{t("Мен {n}, ашамын", { n: b })}</button>
        </div>
      )}
      {step === "dec" && (
        <div className="mt-4 g-pop">
          <p className="inline-flex items-center gap-2 rounded-full bg-sky-400/20 px-3 py-1 text-sm font-bold text-sky-200">{t("{n}, хабарды аш!", { n: b })}</p>
          <h2 className="mt-3 text-xl font-bold">{t("Жасырын хабар:")}</h2>
          <p className="mt-2 rounded-2xl bg-white/10 px-4 py-3 font-mono text-2xl tracking-[.3em]">{enc.toUpperCase()}</p>
          <p className="mt-4 text-sm text-white/80">{cname}</p>
          <KeyTable word={word} cipher={cipher} shift={shift} />
          <input className="input mt-4 !bg-white/95 !text-ink text-lg uppercase tracking-widest" value={dec} onChange={(e) => setDec(e.target.value)} placeholder={t("Ашылған сөз")} aria-label={t("Ашылған сөз")} />
          <button className="btn-primary mt-4" disabled={!dec.trim()} onClick={() => { setStep("show"); const r = cipherCheck(word, cipher, shift, { enc, dec }); setScore((s) => s + (r.encOk && r.decOk ? q.points : r.encOk || r.decOk ? Math.floor(q.points / 2) : 0)); }}><Unlock className="h-4 w-4" /> {t("Аштым")}</button>
        </div>
      )}
      {step === "show" && (
        <div className="mt-6 g-pop">
          <h2 className="text-2xl font-extrabold">{res.encOk && res.decOk ? t("Тамаша жұп! 🎉") : t("Аздап қателестіңдер")}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li className={`flex items-center gap-2 rounded-xl px-3 py-2 ${res.encOk ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>{res.encOk ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} {a}: {t("шифр")} — <b className="font-mono">{encode(word, cipher, shift)}</b></li>
            <li className={`flex items-center gap-2 rounded-xl px-3 py-2 ${res.decOk ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>{res.decOk ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} {b}: {t("сөз")} — <b>{word}</b></li>
          </ul>
          <button className="btn-primary mt-5" onClick={finish}>{i + 1 < questions.length ? <>{t("Келесі сөз (рөлдер ауысады)")} <ArrowRight className="h-4 w-4" /></> : t("Нәтижені көру")}</button>
        </div>
      )}
    </div>
  );
}
