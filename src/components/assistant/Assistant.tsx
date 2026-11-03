"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X, Send, ArrowRight } from "lucide-react";
import Robot from "../Robot";

type Msg = { from: "bot" | "me"; text: string; items?: { title: string; href: string; meta: string }[]; links?: { href: string; label: string }[] };

const SUGGEST = ["7-сынып II тоқсан Python презентация", "9-сынып БЖБ", "5-сыныпқа ойын", "Сайтты қалай қолданамын?"];

export default function Assistant({ soundOn = true }: { soundOn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Сәлеметсіз бе! Мен Informatika Hub көмекшісімін 🤖 Қандай материал керек? Сыныпты, тоқсанды және тақырыпты жазыңыз." },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  function ping() {
    if (!soundOn) return;
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; g.gain.value = 0.04; o.connect(g); g.connect(ctx.destination);
      o.start(); o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08); o.stop(ctx.currentTime + 0.12);
    } catch { /* дыбыс қолжетімсіз */ }
  }

  async function ask(q: string) {
    const message = q.trim();
    if (!message || busy) return;
    setMsgs((m) => [...m, { from: "me", text: message }]);
    setText("");
    setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      const d = await r.json();
      setMsgs((m) => [...m, { from: "bot", text: d.reply, items: d.items, links: d.links }]);
      ping();
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "Байланыс үзілді. Қайталап көріңіз." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed z-50 right-4 bottom-20 lg:bottom-6 grid h-16 w-16 place-items-center rounded-full bg-white shadow-lift ring-4 ring-sky-100 transition hover:scale-105 active:scale-95 ${open ? "opacity-0 pointer-events-none" : ""}`}
        aria-label="Робот-көмекшіні ашу"
        aria-expanded={open}
      >
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-white" />
        <Robot size={52} track={false} />
      </button>

      {open && (
        <section role="dialog" aria-label="Робот-көмекші" className="fixed z-50 inset-x-3 bottom-20 lg:bottom-6 lg:left-auto lg:right-6 lg:w-[400px] max-h-[75vh] flex flex-col card overflow-hidden animate-fadeUp">
          <header className="flex items-center gap-3 bg-gradient-to-r from-sky-400 to-lilac-500 px-4 py-3 text-white">
            <div className="h-11 w-11 rounded-full bg-white/90 grid place-items-center overflow-hidden"><Robot size={40} track={false} float={false} /></div>
            <div className="flex-1">
              <div className="font-bold leading-tight">AI Navigator</div>
              <div className="text-xs text-white/80">Ақылды көмекші · сайт ішінен іздейді</div>
            </div>
            <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/20" aria-label="Жабу"><X className="h-5 w-5" /></button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 p-4 bg-sky-50/50" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "me" ? "flex justify-end" : ""}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${m.from === "me" ? "bg-sky-500 text-white rounded-br-md" : "bg-white border border-sky-100 rounded-bl-md"}`}>
                  {m.text}
                  {m.items && m.items.length > 0 && (
                    <ul className="mt-2.5 space-y-1.5">
                      {m.items.map((it) => (
                        <li key={it.href}>
                          <Link href={it.href} onClick={() => setOpen(false)} className="block rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 hover:border-sky-400 hover:bg-white transition">
                            <div className="font-semibold text-ink line-clamp-1">{it.title}</div>
                            <div className="text-xs muted">{it.meta}</div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.links && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="btn-soft btn-sm">{l.label} <ArrowRight className="h-3.5 w-3.5" /></Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex gap-1 px-2" aria-label="Іздеп жатыр">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGEST.map((s) => <button key={s} onClick={() => ask(s)} className="chip hover:bg-sky-200 transition">{s}</button>)}
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2 border-t border-sky-100 p-3 bg-white">
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} className="input h-10" placeholder="Сұрағыңызды жазыңыз…" aria-label="Сұрақ" />
            <button className="btn-primary h-10 w-10 !px-0 shrink-0" disabled={busy || !text.trim()} aria-label="Жіберу"><Send className="h-4 w-4" /></button>
          </form>
        </section>
      )}
    </>
  );
}
