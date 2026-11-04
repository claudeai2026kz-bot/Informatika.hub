"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";
import Robot from "./Robot";
import { speak, stopSpeaking, voiceOff } from "@/lib/speech";

/** Кіру/тіркелу бетіндегі тірі робот: шығып келеді, қол бұлғайды, сайт туралы айтады, қай жолды толтыру керегін көрсетеді. */
const INTRO: Record<string, string[]> = {
  "/login": [
    "Сәлеметсіз бе! Informatika Hub сайтына қош келдіңіз!",
    "Бұл сайт информатика мұғалімдеріне арналған. Мұнда 5–11 сыныптарға дайын презентация, ҚМЖ, тапсырма, БЖБ мен ТЖБ бар.",
    "Сайтқа кіру үшін қасымдағы жолдарға электрондық поштаңыз бен құпиясөзіңізді жазып, «Кіру» батырмасын басыңыз.",
  ],
  "/register": [
    "Сәлеметсіз бе! Informatika Hub сайтына қош келдіңіз!",
    "Бұл сайт информатика мұғалімдеріне арналған. Мұнда 5–11 сыныптарға дайын материалдар бар, бәрі тегін.",
    "Тіркелу үшін қасымдағы жолдарды толтырыңыз: аты-жөніңіз, поштаңыз және құпиясөз. Сосын «Тіркелу» батырмасын басыңыз.",
  ],
};
const FIELD: Record<string, string> = {
  name: "Мұнда аты-жөніңізді жазыңыз.",
  email: "Мұнда электрондық поштаңызды жазыңыз. Мысалы: aigul@mail.kz",
  password: "Енді құпиясөзіңізді жазыңыз.",
  confirm: "Құпиясөзді тағы бір рет қайталап жазыңыз.",
};

export default function AuthGuide({ compact = false }: { compact?: boolean }) {
  const path = usePathname();
  const lines = (INTRO[path] ?? ["Сәлеметсіз бе! Informatika Hub сайтына қош келдіңіз!"]).map((l) => (compact ? l.replace("қасымдағы", "төмендегі") : l));
  const [text, setText] = useState("");
  const [shown, setShown] = useState("");
  const [talking, setTalking] = useState(false);
  const [wave, setWave] = useState(true);
  const [mute, setMute] = useState(false);
  const spokeRef = useRef(false);
  const idxRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Мәтінді біртіндеп жазу (жазу машинкасы әсері).
  useEffect(() => {
    let i = 0;
    setShown("");
    if (!text) return;
    const t = setInterval(() => { i += 2; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(t); }, 28);
    return () => clearInterval(t);
  }, [text]);

  function say(t: string, after?: () => void) {
    setText(t);
    const audible = !voiceOff() && !mute;
    if (audible && speak(t, () => { setTalking(false); after?.(); })) { setTalking(true); return; }
    setTalking(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setTalking(false); after?.(); }, Math.max(2500, t.length * 55));
  }

  function playIntro(from = 0) {
    idxRef.current = from;
    const next = () => {
      const k = idxRef.current;
      if (k >= lines.length) { setWave(false); return; }
      setWave(k === 0);
      idxRef.current = k + 1;
      say(lines[k], () => setTimeout(next, 500));
    };
    next();
  }

  useEffect(() => {
    setMute(voiceOff());
    // Бетте екі нұсқа бар (үлкен экран / телефон): тек көрініп тұрғаны сөйлейді.
    if (compact !== window.matchMedia("(max-width: 1023px)").matches) return;
    const start = setTimeout(() => playIntro(0), 900);
    // Браузер дыбысты бірінші басудан кейін ғана рұқсат етеді: сонда қайта айтамыз.
    const unlock = () => {
      if (spokeRef.current) return;
      spokeRef.current = true;
      if (!voiceOff() && idxRef.current <= 1) { stopSpeaking(); playIntro(0); }
    };
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLInputElement;
      const hint = el?.name === "password" && path === "/register" ? "Құпиясөз ойлап табыңыз: кемінде 8 таңба, ішінде әріп пен сан болсын." : el?.name && FIELD[el.name];
      if (!hint) return;
      spokeRef.current = true;
      idxRef.current = lines.length;
      setWave(false);
      say(hint);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("focusin", onFocus);
    return () => { clearTimeout(start); clearTimeout(timer.current); stopSpeaking(); window.removeEventListener("pointerdown", unlock); document.removeEventListener("focusin", onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  function toggleMute() {
    const m = !mute;
    setMute(m);
    try { localStorage.setItem("ihub-voice", m ? "off" : "on"); } catch { /* */ }
    if (m) stopSpeaking(); else playIntro(0);
  }

  if (compact) {
    return (
      <div className="flex items-end gap-3 mb-6 animate-fadeUp">
        <div className="shrink-0"><Robot size={84} track={false} wave={wave} talking={talking} /></div>
        <div className="relative flex-1 rounded-2xl rounded-bl-md bg-white border border-sky-100 shadow-soft px-4 py-3 text-[15px] font-medium text-ink min-h-[64px]" aria-live="polite">
          {shown}<span className={talking ? "inline-block w-1.5 h-4 ml-0.5 bg-sky-400 align-middle animate-pulse" : "hidden"} />
          <button type="button" onClick={toggleMute} className="absolute -top-3 -right-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow-soft text-sky-600" aria-label={mute ? "Дауысты қосу" : "Дауысты өшіру"}>{mute ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center" style={{ animation: "ihubRise 1.2s cubic-bezier(.2,.9,.3,1.3) both" }}>
      <div className="relative mb-4 w-full max-w-md rounded-3xl bg-white px-5 py-4 text-ink shadow-lift min-h-[104px]" aria-live="polite">
        <p className="text-[17px] font-semibold leading-snug">{shown}<span className={talking ? "inline-block w-2 h-5 ml-1 bg-sky-400 align-middle animate-pulse rounded-sm" : "hidden"} /></p>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => { stopSpeaking(); playIntro(0); }} className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-100"><Volume2 className="h-4 w-4" /> Қайта тыңдау</button>
          <button type="button" onClick={toggleMute} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-soft hover:bg-sky-50">{mute ? <><VolumeX className="h-4 w-4" /> Дауыс өшірулі</> : "Дауысты өшіру"}</button>
          <span className="ml-auto flex gap-1">{lines.map((_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < idxRef.current ? "bg-sky-400" : "bg-sky-100"}`} />)}</span>
        </div>
        <span className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 bg-white" />
      </div>
      <div className="relative">
        {talking && [0, 1, 2].map((i) => <span key={i} aria-hidden className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full border-2 border-white/40" style={{ animation: `ihubRing 1.8s ${i * 0.6}s ease-out infinite` }} />)}
        <Robot size={170} wave={wave} talking={talking} />
      </div>
      <style>{`@keyframes ihubRise{0%{transform:translateY(120px) scale(.6);opacity:0}70%{transform:translateY(-10px) scale(1.03);opacity:1}100%{transform:none}}@keyframes ihubRing{0%{transform:translate(-50%,-50%) scale(.6);opacity:.8}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}@media (prefers-reduced-motion:reduce){[style*=ihubRise],[style*=ihubRing]{animation:none!important}}`}</style>
    </div>
  );
}
