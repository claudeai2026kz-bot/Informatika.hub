"use client";
/**
 * Робот-көмекшінің дауысы — таза қазақша, тегін, тіркелусіз, кез келген браузерде.
 * Дауыс: ISSAI KazakhTTS2 (Piper «kk_KZ-issai-high», 3-диктор, әйел), CC-BY-4.0.
 *  1) Робот жиі айтатын сөздер алдын ала жазылған: /tts/kk-issai/clips.bin (бір файл),
 *     ал clips.json әр сөйлемнің сол файлдағы орнын береді [offset, length] — бірден ойнайды.
 *  2) Жазылмаған жаңа бөліктерді сол дауыс браузердің өзінде дыбысқа айналдырады (Web Worker).
 *  3) Ол да мүмкін болмаса — браузердегі қазақша дауыс (бар болса). Орыс дауысына ешқашан түспейді.
 */
import { chunksKk } from "./kk-normalize";

const VOICE_DIR = "/tts/kk-issai";

let ctx: AudioContext | null = null;
let worker: Worker | null = null;
let workerBroken = false;
let manifestP: Promise<Record<string, [number, number]>> | null = null;
let wholeBin: Promise<ArrayBuffer | null> | null = null;
let seq = 0;
let current: { id: number; sources: AudioBufferSourceNode[] } | null = null;
const waiting = new Map<string, { resolve: (b: AudioBuffer | null) => void }>();

function audio(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function manifest() {
  manifestP ??= fetch(`${VOICE_DIR}/clips.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return manifestP;
}

function getWorker(): Worker | null {
  if (workerBroken || typeof Worker === "undefined") return null;
  if (!worker) {
    try {
      worker = new Worker(new URL("./kk-piper.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<{ type: string; id: number; idx: number; pcm?: Float32Array; rate?: number }>) => {
        const m = e.data;
        const w = waiting.get(`${m.id}:${m.idx}`);
        if (!w) return;
        waiting.delete(`${m.id}:${m.idx}`);
        if (m.type !== "pcm" || !m.pcm || !ctx) return w.resolve(null);
        const buf = ctx.createBuffer(1, m.pcm.length, m.rate!);
        buf.getChannelData(0).set(m.pcm);
        w.resolve(buf);
      };
      worker.onerror = () => { workerBroken = true; waiting.forEach((w) => w.resolve(null)); waiting.clear(); };
    } catch {
      workerBroken = true;
      return null;
    }
  }
  return worker;
}

function synthInBrowser(id: number, idx: number, text: string): Promise<AudioBuffer | null> {
  const w = getWorker();
  if (!w) return Promise.resolve(null);
  return new Promise((resolve) => {
    waiting.set(`${id}:${idx}`, { resolve });
    w.postMessage({ type: "synth", id, idx, text });
  });
}

/** Бір сөйлемнің дайын дыбысын clips.bin файлынан кесіп алады (Range сұранысы; сервер қолдамаса — бүкіл файл бір рет). */
async function clip([offset, length]: [number, number]): Promise<AudioBuffer | null> {
  try {
    if (!ctx) return null;
    let bytes: ArrayBuffer | null = null;
    if (!wholeBin) {
      const r = await fetch(`${VOICE_DIR}/clips.bin`, { headers: { Range: `bytes=${offset}-${offset + length - 1}` } });
      if (r.status === 206) bytes = await r.arrayBuffer();
      else if (r.ok) { const all = r.arrayBuffer(); wholeBin = all.catch(() => null); }
      else return null;
    }
    if (!bytes) {
      const all = await wholeBin;
      if (!all) return null;
      bytes = all.slice(offset, offset + length);
    }
    return await ctx.decodeAudioData(bytes);
  } catch {
    return null;
  }
}

function browserKazakh(text: string, onEnd?: () => void): boolean {
  try {
    const ss = window.speechSynthesis;
    const v = ss?.getVoices().find((x) => x.lang.toLowerCase().startsWith("kk"));
    if (!ss || !v) return false;
    const u = new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}/gu, ""));
    u.voice = v; u.lang = v.lang; u.rate = 0.95;
    if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
    ss.speak(u);
    return true;
  } catch {
    return false;
  }
}

/** Сайт орыс/ағылшын тілінде ашылса — браузердің сол тілдегі дауысы. */
function pageLang(): "kk" | "ru" | "en" {
  const l = (document.documentElement.lang || "kk").slice(0, 2);
  return l === "ru" || l === "en" ? l : "kk";
}
function browserOther(text: string, lang: "ru" | "en", onEnd?: () => void): boolean {
  try {
    const ss = window.speechSynthesis;
    if (!ss) return false;
    const v = ss.getVoices().find((x) => x.lang.toLowerCase().startsWith(lang));
    const u = new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}/gu, ""));
    if (v) u.voice = v;
    u.lang = v?.lang ?? (lang === "ru" ? "ru-RU" : "en-US");
    u.rate = 0.95;
    if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
    ss.speak(u);
    return true;
  } catch {
    return false;
  }
}

async function run(id: number, text: string, onEnd?: () => void) {
  const c = audio();
  const done = () => { if (current?.id === id) current = null; onEnd?.(); };
  if (!c) { if (!browserKazakh(text, onEnd)) onEnd?.(); return; }
  const chunks = chunksKk(text);
  const map = await manifest();
  if (seq !== id) return;
  // Барлық бөлікті қатар дайындаймыз, бірақ ретімен ойнатамыз
  const bufs = chunks.map((ch, i) => (map[ch.text] ? clip(map[ch.text]).then((b) => b ?? synthInBrowser(id, i, ch.text)) : synthInBrowser(id, i, ch.text)));
  let nextAt = 0, played = 0, lastEnd: Promise<void> = Promise.resolve();
  for (let i = 0; i < chunks.length; i++) {
    const buf = await bufs[i];
    if (seq !== id) return;
    if (!buf) continue;
    if (c.state !== "running") { done(); return; } // дыбысқа рұқсат жоқ (бетпен әлі әрекет жасалмаған)
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    const at = Math.max(c.currentTime + 0.03, nextAt);
    src.start(at);
    nextAt = at + buf.duration + chunks[i].pause / 1000;
    current?.sources.push(src);
    lastEnd = new Promise((r) => { src.onended = () => r(); });
    played++;
  }
  if (!played && seq === id) { if (!browserKazakh(text, onEnd)) done(); return; }
  await lastEnd;
  if (seq === id) done();
}

/** Мәтінді қазақша дауыстап оқиды. Дауыс шығару мүмкін болса true. */
export function speak(text: string, onEnd?: () => void): boolean {
  stopSpeaking();
  const t = text.trim();
  if (!t || typeof window === "undefined") return false;
  const lang = pageLang();
  if (lang !== "kk") return browserOther(t, lang, onEnd);
  const id = ++seq;
  current = { id, sources: [] };
  void run(id, t, onEnd);
  return true;
}

export function stopSpeaking() {
  const cur = current;
  current = null;
  seq++;
  cur?.sources.forEach((s) => { try { s.stop(); } catch { /* */ } });
  if (cur) worker?.postMessage({ type: "cancel", id: cur.id });
  waiting.forEach((w) => w.resolve(null));
  waiting.clear();
  try { window.speechSynthesis?.cancel(); } catch { /* */ }
}

/** Бос уақытта дайындық: дайын дауыстар тізімін алдын ала жүктейді (модель тек керек кезде жүктеледі). */
export function preloadVoice() {
  if (voiceOff()) return;
  void manifest();
}

export function voiceOff() { try { return localStorage.getItem("ihub-voice") === "off"; } catch { return false; } }
