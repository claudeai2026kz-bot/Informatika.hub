"use client";
/** Браузердің дауыспен оқу мүмкіндігі. Қазақша дауыс болса соны, болмаса орысша/әдепкі дауысты алады. */
export function speak(text: string, onEnd?: () => void): boolean {
  try {
    const ss = window.speechSynthesis;
    if (!ss) return false;
    ss.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}/gu, ""));
    const voices = ss.getVoices();
    const v = voices.find((x) => x.lang.toLowerCase().startsWith("kk")) ?? voices.find((x) => x.lang.toLowerCase().startsWith("ru"));
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "kk-KZ";
    u.rate = 0.92;
    if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
    ss.speak(u);
    return true;
  } catch {
    return false;
  }
}
export function stopSpeaking() { try { window.speechSynthesis?.cancel(); } catch { /* */ } }
export function voiceOff() { try { return localStorage.getItem("ihub-voice") === "off"; } catch { return false; } }
