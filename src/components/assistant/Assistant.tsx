"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X, Send, ArrowRight, Mic, Volume2, VolumeX } from "lucide-react";
import Robot from "../Robot";
import { speak, preloadVoice, setVoiceOff, voiceOff, VOICE_EVENT } from "@/lib/speech";
import { useT } from "@/lib/i18n/client";

type Msg = { from: "bot" | "me"; text: string; items?: { title: string; href: string; meta: string }[]; links?: { href: string; label: string }[] };

const WELCOME = "Қош келдіңіз! Менің көмегім қажет болса, мен осында тұрамын. Маған басыңыз, мен сізге көмектесемін.";

type Rec = { lang: string; interimResults: boolean; onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start(): void; stop(): void };
function makeRecognizer(): Rec | null {
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return C ? new C() : null;
}

const SUGGEST = ["7-сынып II тоқсан Python презентация", "9-сынып БЖБ", "5-сыныпқа ойын", "Сайтты қалай қолданамын?"];

export default function Assistant({ soundOn = true }: { soundOn?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Сәлеметсіз бе! Мен Informatika Hub көмекшісімін 🤖 Қандай материал керек? Сыныпты, тоқсанды және тақырыпты жазыңыз." },
  ]);
  const [intro, setIntro] = useState<"none" | "center" | "leaving">("none");
  const [voice, setVoice] = useState(true);
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const recRef = useRef<Rec | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Сайтқа кіргенде робот ортаға шығып, қол бұлғап сәлемдеседі, сосын бұрышқа барып отырады (сессияда бір рет).
  useEffect(() => {
    setCanListen(!!makeRecognizer());
    // Қазақша дауыс моделін бос уақытта алдын ала жүктейміз
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2500));
    idle(() => preloadVoice());
    try { setVoice(localStorage.getItem("ihub-voice") !== "off"); } catch { /* */ }
    let seen = false;
    try { seen = sessionStorage.getItem("ihub-welcome") === "1"; sessionStorage.setItem("ihub-welcome", "1"); } catch { /* */ }
    if (seen) return;
    setIntro("center");
    let off = false;
    try { off = localStorage.getItem("ihub-voice") === "off"; } catch { /* */ }
    const t0 = setTimeout(() => { if (soundOn && !off) speak(t(WELCOME)); }, 700);
    const t1 = setTimeout(() => setIntro("leaving"), 6500);
    const t2 = setTimeout(() => setIntro("none"), 7400);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [soundOn]);

  function dismissIntro() {
    setIntro("leaving");
    setTimeout(() => setIntro("none"), 900);
  }

  function toggleVoice() {
    const v = !voice;
    setVoice(v);
    setVoiceOff(!v);
  }

  // Баптаулардан (немесе басқа беттен) дауыс ауыстырылса — бірден ескереміз
  useEffect(() => {
    const sync = () => setVoice(!voiceOff());
    window.addEventListener(VOICE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(VOICE_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);

  function listen() {
    if (listening) { recRef.current?.stop(); return; }
    const r = makeRecognizer();
    if (!r) return;
    window.speechSynthesis?.cancel();
    r.lang = ({ kk: "kk-KZ", ru: "ru-RU", en: "en-US" } as Record<string, string>)[document.documentElement.lang] ?? "kk-KZ";
    r.interimResults = false;
    r.onresult = (e) => { const t = e.results[0]?.[0]?.transcript; if (t) ask(t, true); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r;
    setListening(true);
    try { r.start(); } catch { setListening(false); }
  }

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    const h = () => setOpen((o) => !o);
    window.addEventListener("ihub-assistant", h);
    return () => window.removeEventListener("ihub-assistant", h);
  }, []);
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

  async function ask(q: string, spoken = false, shown?: string) {
    const message = q.trim();
    if (!message || busy) return;
    setMsgs((m) => [...m, { from: "me", text: shown ?? message }]);
    setText("");
    setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      const d = await r.json();
      setMsgs((m) => [...m, { from: "bot", text: d.reply, items: d.items, links: d.links }]);
      if (voice && (spoken || soundOn)) {
        const found = (d.items ?? []).slice(0, 3).map((x: { title: string }) => x.title).join(". ");
        speak(found ? `${d.reply} ${found}` : d.reply);
      } else ping();
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "Байланыс үзілді. Қайталап көріңіз." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {intro !== "none" && (
        <div
          className={`fixed inset-0 z-[60] grid place-items-center transition-opacity duration-700 ${intro === "leaving" ? "pointer-events-none bg-transparent" : "bg-ink/20 backdrop-blur-[2px]"}`}
          onClick={dismissIntro}
        >
          <div
            className="flex flex-col items-center gap-4 transition-all duration-[900ms] ease-in-out"
            style={intro === "leaving" ? { transform: "translate(calc(50vw - 3.5rem), calc(50vh - 6rem)) scale(0.25)", opacity: 0 } : { animation: "ihubWalkIn 1.1s ease-out both" }}
          >
            <div className="relative max-w-sm rounded-3xl bg-white px-6 py-4 text-center text-lg font-semibold text-ink shadow-lift" role="status">
              {t(WELCOME)}
              <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />
            </div>
            <Robot size={190} track={false} wave talking={intro === "center"} />
            <button onClick={(e) => { e.stopPropagation(); speak(t(WELCOME)); }} className="btn-soft btn-sm bg-white"><Volume2 className="h-4 w-4" /> {t("Тыңдау")}</button>
          </div>
          <style>{`@keyframes ihubWalkIn{0%{transform:translate(45vw,40vh) scale(.3);opacity:0}60%{transform:translate(0,0) scale(1.05);opacity:1}100%{transform:none}}@media (prefers-reduced-motion:reduce){[style*=ihubWalkIn]{animation:none!important}}`}</style>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`group fixed z-50 right-4 bottom-4 hidden lg:flex flex-col items-center transition hover:scale-105 active:scale-95 ${open || intro === "center" ? "opacity-0 pointer-events-none" : ""}`}
        aria-label={t("Робот-көмекшіні ашу")}
        aria-expanded={open}
      >
        <span className="mb-1 rounded-full bg-[#121a46] px-3 py-1 text-xs font-bold text-cyan-200 shadow-soft opacity-0 transition group-hover:opacity-100">{t("Көмек керек пе?")}</span>
        <span className="robot-pad relative isolate grid place-items-center rounded-full border border-cyan-300/40 bg-[#121a46]/85 backdrop-blur-md shadow-[0_12px_30px_-10px_rgba(11,16,53,.7),0_0_0_4px_rgba(34,211,238,.12)] h-[76px] w-[76px] overflow-visible">
          <span className="absolute right-0.5 top-0.5 z-10 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#121a46]" />
          <span className="mt-1"><Robot head size={80} /></span>
        </span>
      </button>

      {open && (
        <section role="dialog" aria-label={t("Робот-көмекші")} className="fixed z-50 inset-x-3 bottom-20 lg:bottom-6 lg:left-auto lg:right-6 lg:w-[400px] max-h-[75vh] flex flex-col card overflow-hidden animate-fadeUp">
          <header className="flex items-center gap-3 bg-gradient-to-r from-sky-400 to-lilac-500 px-4 py-3 text-white">
            <div className="h-11 w-11 rounded-full bg-white/90 grid place-items-center overflow-hidden"><Robot size={40} track={false} float={false} /></div>
            <div className="flex-1">
              <div className="font-bold leading-tight">AI Navigator</div>
              <div className="text-xs text-white/80">{t("Ақылды көмекші · сайт ішінен іздейді")}</div>
            </div>
            <button onClick={toggleVoice} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/20" aria-label={t(voice ? "Дауысты өшіру" : "Дауысты қосу")} title={t(voice ? "Дауысты өшіру" : "Дауысты қосу")}>{voice ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>
            <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/20" aria-label={t("Жабу")}><X className="h-5 w-5" /></button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 p-4 bg-sky-50/50" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "me" ? "flex justify-end" : ""}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-base ${m.from === "me" ? "bg-sky-500 text-white rounded-br-md" : "bg-white border border-sky-100 rounded-bl-md"}`}>
                  {m.from === "bot" ? t(m.text) : m.text}
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
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="btn-soft btn-sm">{t(l.label)} <ArrowRight className="h-3.5 w-3.5" /></Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex gap-1 px-2" aria-label={t("Іздеп жатыр")}>{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGEST.map((s) => <button key={s} onClick={() => ask(s, false, t(s))} className="chip hover:bg-sky-200 transition">{t(s)}</button>)}
              </div>
            )}
          </div>

          {canListen && (
            <div className="border-t border-sky-100 bg-white px-3 pt-3">
              <button type="button" onClick={listen} className={`w-full h-14 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition ${listening ? "bg-rose-500 text-white animate-pulse" : "bg-gradient-to-r from-sky-400 to-lilac-500 text-white hover:opacity-90"}`} aria-label={t("Дауыспен сұрау")}>
                <Mic className="h-6 w-6" /> {t(listening ? "Тыңдап тұрмын… айтыңыз" : "Басып, дауыспен айтыңыз")}
              </button>
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="flex gap-2 p-3 bg-white">
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} className="input h-11 text-base" placeholder={t("Немесе жазыңыз…")} aria-label={t("Сұрақ")} />
            <button className="btn-primary h-11 w-11 !px-0 shrink-0" disabled={busy || !text.trim()} aria-label={t("Жіберу")}><Send className="h-4 w-4" /></button>
          </form>
        </section>
      )}
    </>
  );
}
