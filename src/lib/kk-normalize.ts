/**
 * Қазақша дауыс моделі (MMS-TTS kaz) үшін мәтінді дайындау:
 * сандарды сөзбен жазады, латын әріптерін қазақшаға ауыстырады,
 * қысқартуларды әріптеп оқиды, мәтінді кідірістері бар бөліктерге бөледі.
 */

const ONES = ["нөл", "бір", "екі", "үш", "төрт", "бес", "алты", "жеті", "сегіз", "тоғыз"];
const TENS = ["", "он", "жиырма", "отыз", "қырық", "елу", "алпыс", "жетпіс", "сексен", "тоқсан"];

export function numberWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n < 10) return ONES[n];
  if (n < 100) return [TENS[Math.floor(n / 10)], n % 10 ? ONES[n % 10] : ""].filter(Boolean).join(" ");
  if (n < 1000) {
    const h = Math.floor(n / 100), r = n % 100;
    return [h === 1 ? "жүз" : `${ONES[h]} жүз`, r ? numberWords(r) : ""].filter(Boolean).join(" ");
  }
  if (n < 1_000_000) {
    const th = Math.floor(n / 1000), r = n % 1000;
    return [th === 1 ? "мың" : `${numberWords(th)} мың`, r ? numberWords(r) : ""].filter(Boolean).join(" ");
  }
  return n.toLocaleString("ru-RU");
}

const FRONT = /[әөүіе]/;
export function ordinalWords(n: number): string {
  const w = numberWords(n);
  // соңғы буынға қарай -ыншы/-інші, дауыстыдан кейін -ншы/-нші
  const last = w.split(" ").pop()!;
  const front = FRONT.test(last.replace(/[^аәоөұүыіеэиуя]/g, "").slice(-1));
  const endsVowel = /[аәоөұүыіеэиуя]$/.test(last);
  return w + (endsVowel ? (front ? "нші" : "ншы") : (front ? "інші" : "ыншы"));
}

/** Шығыс (-дан) және барыс (-ға) септік жалғаулары, сингармонизммен. */
function suffix(word: string, kind: "abl" | "dat"): string {
  const vowels = word.replace(/[^аәоөұүыіеэиуя]/g, "");
  const front = FRONT.test(vowels.slice(-1));
  const last = word.slice(-1);
  const voiceless = /[птқкссшфхцщ]/.test(last);
  if (kind === "abl") {
    const base = voiceless ? "т" : /[мнң]/.test(last) ? "н" : "д";
    return word + base + (front ? "ен" : "ан");
  }
  return word + (voiceless ? (front ? "ке" : "қа") : (front ? "ге" : "ға"));
}

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };

const WORDS: [RegExp, string][] = [
  [/informatika\s*hub/gi, "информатика хаб"],
  [/\bhub\b/gi, "хаб"],
  [/\bpython\b/gi, "пайтон"],
  [/\bhtml\b/gi, "эйч ти эм эл"],
  [/\bcss\b/gi, "си эс эс"],
  [/\bexcel\b/gi, "эксель"],
  [/\bword\b/gi, "ворд"],
  [/\bpowerpoint\b/gi, "пауэрпойнт"],
  [/\bscratch\b/gi, "скретч"],
  [/\bpdf\b/gi, "пи ди эф"],
  [/\bpptx?\b/gi, "презентация"],
  [/\bdocx?\b/gi, "ворд файл"],
  [/\bmp4\b/gi, "бейне"],
  [/\bai\b/g, "эй ай"],
  [/\bAI\b/g, "эй ай"],
  [/\bonline\b/gi, "онлайн"],
  [/\bemail\b|\be-mail\b/gi, "электрондық пошта"],
  [/\.kz\b/gi, " нүкте кей зет"],
  [/\.com\b/gi, " нүкте ком"],
  [/@/g, " эт "],
  [/ҚМЖ/g, "қы мы жы"],
  [/БЖБ/g, "бы жы бы"],
  [/ТЖБ/g, "ты жы бы"],
  [/ҰБТ/g, "ұ бы ты"],
  [/IT\b/g, "ай ти"],
];

const LATIN: Record<string, string> = {
  a: "а", b: "б", c: "к", d: "д", e: "е", f: "ф", g: "г", h: "х", i: "и", j: "дж", k: "к", l: "л", m: "м",
  n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", w: "у", x: "кс", y: "й", z: "з",
};
const LATIN_DI: [RegExp, string][] = [[/sh/g, "ш"], [/ch/g, "ш"], [/zh/g, "ж"], [/ph/g, "ф"], [/th/g, "т"], [/oo/g, "у"], [/ee/g, "и"]];

const EXTRA: Record<string, string> = { ё: "йо", ч: "ш", ъ: "", "’": "", "'": "" };

/** Бір бөліктің мәтінін модель сөздігіне келтіреді. */
export function normalizeKk(raw: string): string {
  let s = raw.replace(/\p{Extended_Pictographic}/gu, " ");
  for (const [re, w] of WORDS) s = s.replace(re, ` ${w} `);
  // «5–11 сынып» → «бестен он бірге дейін сынып»
  s = s.replace(/(\d+)\s*[–-]\s*(\d+)(?=\s*сынып)/g, (_, a, b) => `${suffix(numberWords(+a), "abl")} ${suffix(numberWords(+b), "dat")} дейін`);
  // «7-сынып», «2-тоқсан», «1-нұсқа» → реттік сан
  s = s.replace(/(\d+)\s*-\s*(?=[а-яәғқңөұүһі])/gi, (_, n) => `${ordinalWords(+n)} `);
  // «II тоқсан» → «екінші тоқсан»
  s = s.replace(/\b(IV|III|II|I)\b(?=\s*тоқсан)/g, (m) => ordinalWords(ROMAN[m]));
  s = s.replace(/№\s*(\d+)/g, (_, n) => ` нөмір ${numberWords(+n)} `);
  s = s.replace(/(\d+)\s*%/g, (_, n) => ` ${numberWords(+n)} пайыз `);
  s = s.replace(/\d+/g, (n) => ` ${numberWords(+n)} `);
  s = s.toLowerCase();
  for (const [re, w] of LATIN_DI) s = s.replace(re, w);
  s = s.replace(/[a-z]/g, (c) => LATIN[c] ?? "");
  s = s.replace(/[ёчъ’']/g, (c) => EXTRA[c] ?? "");
  s = s.replace(/[«»"“”()[\]{}:;!?.,…/\\|*+=<>~^`#$&]/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

export type Chunk = { text: string; pause: number };

/** Мәтінді сөйлем/үтір бойынша бөліп, әр бөліктен кейінгі кідірісті (мс) береді. */
export function chunksKk(raw: string): Chunk[] {
  const parts = raw
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…])\s+|(?<=[,;:—])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: Chunk[] = [];
  for (const p of parts) {
    const text = normalizeKk(p);
    if (!text) continue;
    const pause = /[.!?…]$/.test(p) ? 380 : /[,;:—]$/.test(p) ? 180 : 250;
    // тым ұзын бөлікті сөз бойынша бөлеміз (модель ұзын мәтінде нашарлайды)
    const words = text.split(" ");
    for (let i = 0; i < words.length; i += 22) out.push({ text: words.slice(i, i + 22).join(" "), pause: i + 22 >= words.length ? pause : 120 });
  }
  return out;
}
