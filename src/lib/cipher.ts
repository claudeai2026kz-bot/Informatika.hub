/** «Шифр жібер» ойынының шифрлары. */
export const KZ = "АӘБВГҒДЕЁЖЗИЙКҚЛМНҢОӨПРСТУҰҮФХҺЦЧШЩЪЫІЬЭЮЯ";
export const EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export type Cipher = "caesar" | "number";

export const alphabetFor = (word: string) => (/[A-Z]/i.test(word) ? EN : KZ);
export const cleanWord = (w: string) => w.toUpperCase().replace(/[^A-ZА-ЯЁӘҒҚҢӨҰҮҺІ]/g, "");

export function encode(word: string, cipher: Cipher, shift = 3) {
  const w = cleanWord(word), ab = alphabetFor(w);
  if (cipher === "number") return w.split("").map((c) => ab.indexOf(c) + 1).join(" ");
  return w.split("").map((c) => ab[(ab.indexOf(c) + shift) % ab.length]).join("");
}

/** Шифрланған мәтінді салыстыру үшін: бос орын/үтір айырмашылығы маңызды емес. */
export const normCode = (s: unknown, cipher: Cipher) =>
  cipher === "number" ? String(s ?? "").trim().split(/[\s,;.\-]+/).filter(Boolean).map((x) => String(Number(x))).join(" ") : cleanWord(String(s ?? ""));

export function cipherCheck(word: string, cipher: Cipher, shift: number, given: unknown) {
  const g = (given ?? {}) as { enc?: unknown; dec?: unknown };
  const encOk = normCode(g.enc, cipher) === encode(word, cipher, shift);
  const decOk = cleanWord(String(g.dec ?? "")) === cleanWord(word);
  return { encOk, decOk };
}
