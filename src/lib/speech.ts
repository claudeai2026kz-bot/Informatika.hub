"use client";
/**
 * Робот-көмекшінің дауысы.
 * 1) Сервердегі таза қазақша нейрондық дауыс (/api/tts, Azure kk-KZ).
 * 2) Ол бапталмаса — браузердегі қазақша дауыс (мысалы, Edge-те «Aigul»/«Daulet»).
 * 3) Қазақша дауыс мүлде болмаса — орыс акцентімен бұрмаламау үшін үндемейді (мәтін экранда көрінеді).
 */
let current: HTMLAudioElement | null = null;
let serverTts: "unknown" | "yes" | "no" = "unknown";
let token = 0;
const urls = new Map<string, string>();

function clean(text: string) {
  return text.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
}

function kazakhVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang.toLowerCase().startsWith("kk"));
}

function browserSpeak(text: string, onEnd?: () => void): boolean {
  const ss = window.speechSynthesis;
  const v = ss && kazakhVoice();
  if (!ss || !v) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = v; u.lang = v.lang; u.rate = 0.95;
  if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
  ss.speak(u);
  return true;
}

async function serverSpeak(text: string, my: number, onEnd?: () => void): Promise<boolean> {
  if (serverTts === "no") return false;
  try {
    let url = urls.get(text);
    if (!url) {
      const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (r.status === 501) { serverTts = "no"; return false; }
      if (!r.ok) return false;
      url = URL.createObjectURL(await r.blob());
      urls.set(text, url);
    }
    serverTts = "yes";
    if (my !== token) return true; // басқа сөз басталып кетті
    const a = new Audio(url);
    current = a;
    a.onended = () => { if (current === a) current = null; onEnd?.(); };
    a.onerror = () => { if (current === a) current = null; onEnd?.(); };
    await a.play();
    return true;
  } catch {
    return false;
  }
}

/** Мәтінді дауыстап оқиды. Дауыс шығатын болса true қайтарады. */
export function speak(text: string, onEnd?: () => void): boolean {
  try {
    stopSpeaking();
    const t = clean(text);
    if (!t) return false;
    const my = ++token;
    // Сервер дауысы жоқ екені белгілі болса — бірден браузердің қазақша дауысы
    if (serverTts === "no") return browserSpeak(t, onEnd);
    // Сервер дауысын көреміз; болмаса браузерге ауысамыз, ол да болмаса үнсіз аяқтаймыз
    void serverSpeak(t, my, onEnd).then((ok) => {
      if (ok || my !== token) return;
      if (!browserSpeak(t, onEnd)) onEnd?.();
    });
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  token++;
  try { current?.pause(); } catch { /* */ }
  current = null;
  try { window.speechSynthesis?.cancel(); } catch { /* */ }
}
export function voiceOff() { try { return localStorage.getItem("ihub-voice") === "off"; } catch { return false; } }
