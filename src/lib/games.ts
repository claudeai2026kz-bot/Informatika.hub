/** Ойын ұпайын есептеу. Таза функциялар: сервер де, тест те қолданады. */
import type { GameType } from "@prisma/client";
import { mazeSolved } from "./maze";
import { cipherCheck, type Cipher } from "./cipher";

export type QuestionRow = { id: string; prompt: string; data: unknown; answer: unknown; points: number; explanation?: string | null };

export const norm = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[«»"']/g, "").replace(/ё/g, "е");

/** Бір сұрақ үшін: (ұпай, максимум). */
export function scoreQuestion(type: GameType, q: QuestionRow, given: unknown): { score: number; max: number; correct: boolean } {
  switch (type) {
    case "QUIZ":
    case "RAPID":
    case "TRUEFALSE":
    case "CLIMB":
    case "SHOOTER":
    case "TUGOFWAR":
    case "DUEL":
    case "LIVE": {
      const ok = Number.isInteger(given) && given === q.answer;
      return { score: ok ? q.points : 0, max: q.points, correct: ok };
    }
    case "MATCHING": {
      const ans = (q.answer as number[]) ?? [];
      const g = Array.isArray(given) ? given : [];
      const right = ans.filter((v, i) => g[i] === v).length;
      return { score: right, max: ans.length, correct: right === ans.length };
    }
    case "CROSSWORD": {
      const ok = norm(given).replace(/\s/g, "") === norm(q.answer).replace(/\s/g, "");
      return { score: ok ? q.points : 0, max: q.points, correct: ok };
    }
    case "ORDERING": {
      const n = ((q.data as { items?: unknown[] })?.items ?? []).length;
      const g = Array.isArray(given) ? given : [];
      const ok = n > 0 && g.length === n && g.every((v, i) => v === i);
      return { score: ok ? q.points : 0, max: q.points, correct: ok };
    }
    case "MEMORY": {
      const pairs = ((q.data as { left?: unknown[] })?.left ?? []).length;
      const g = (given ?? {}) as { found?: unknown; mistakes?: unknown };
      const found = Math.min(pairs, Math.max(0, Number.isInteger(g.found) ? (g.found as number) : 0));
      const mistakes = Math.max(0, Number.isInteger(g.mistakes) ? (g.mistakes as number) : 0);
      const score = Math.max(0, found - Math.floor(mistakes / 3)); // әр 3 қате 1 балл кемітеді
      return { score, max: pairs, correct: found === pairs && score === pairs };
    }
    case "MAZE": {
      const ok = mazeSolved(q.data, given);
      return { score: ok ? q.points : 0, max: q.points, correct: ok };
    }
    case "PIXEL": {
      const rows = Array.isArray(q.answer) ? (q.answer as string[]) : [];
      const g = Array.isArray(given) ? given : [];
      const right = rows.filter((r, i) => typeof g[i] === "string" && (g[i] as string).replace(/\s/g, "") === r).length;
      return { score: right * q.points, max: rows.length * q.points, correct: right === rows.length };
    }
    case "CIPHER": {
      const d = (q.data ?? {}) as { cipher?: Cipher; shift?: number };
      const { encOk, decOk } = cipherCheck(String(q.answer ?? ""), d.cipher ?? "caesar", d.shift ?? 3, given);
      const score = encOk && decOk ? q.points : encOk || decOk ? Math.floor(q.points / 2) : 0;
      return { score, max: q.points, correct: encOk && decOk };
    }
    case "BOARD": // ұпайды мұғалім тақтада өзі береді
      return { score: 0, max: q.points, correct: false };
    case "ESCAPE": {
      if (Array.isArray((q.data as { options?: unknown[] })?.options) && Number.isInteger(q.answer)) {
        const ok = given === q.answer;
        return { score: ok ? q.points : 0, max: q.points, correct: ok };
      }
      const accepted = (Array.isArray(q.answer) ? q.answer : [q.answer]).map(norm);
      const ok = accepted.includes(norm(given));
      return { score: ok ? q.points : 0, max: q.points, correct: ok };
    }
    case "TEAMESCAPE":
    case "LOGIC":
    case "CODING": {
      const accepted = (Array.isArray(q.answer) ? q.answer : [q.answer]).map(norm);
      const ok = accepted.includes(norm(given));
      return { score: ok ? q.points : 0, max: q.points, correct: ok };
    }
  }
}

export function scoreGame(type: GameType, questions: QuestionRow[], answers: Record<string, unknown>) {
  let score = 0, max = 0;
  let fallen = false; // «Шыңға шық»: бірінші қатеден кейінгі сұрақтар есептелмейді
  const details = questions.map((q) => {
    const r = scoreQuestion(type, q, answers[q.id]);
    if (type === "CLIMB") { if (fallen) r.score = 0, r.correct = false; if (!r.correct) fallen = true; }
    score += r.score; max += r.max;
    return { id: q.id, ...r };
  });
  return { score, max, details };
}

/** Клиентке жіберілетін сұрақ: дұрыс жауапсыз. Сәйкестендіруде оң жақ баған араласады. */
export function publicQuestion(type: GameType, q: QuestionRow, seed: number) {
  const data = (q.data ?? {}) as Record<string, unknown>;
  if (type === "MATCHING") {
    const right = (data.right as string[]) ?? [];
    const order = right.map((_, i) => i).sort((a, b) => ((a * 9301 + seed) % 233) - ((b * 9301 + seed) % 233));
    return { id: q.id, prompt: q.prompt, points: q.points, data: { left: data.left, right: order.map((i) => ({ i, text: right[i] })) } };
  }
  if (type === "ORDERING") {
    const items = (data.items as string[]) ?? [];
    let order = items.map((_, i) => i).sort((a, b) => ((a * 7919 + seed * 31) % 101) - ((b * 7919 + seed * 31) % 101));
    if (order.every((v, i) => v === i) && order.length > 1) order = [...order.slice(1), order[0]]; // дұрыс реті бірден көрінбесін
    return { id: q.id, prompt: q.prompt, points: q.points, data: { items: order.map((i) => ({ i, text: items[i] })) } };
  }
  if (type === "MEMORY") {
    const left = (data.left as string[]) ?? [], right = (data.right as string[]) ?? [];
    const cards = [...left.map((text, p) => ({ p, side: "L", text })), ...right.map((text, p) => ({ p, side: "R", text }))];
    const order = cards.map((_, i) => i).sort((a, b) => ((a * 9301 + seed * 49297) % 233280) - ((b * 9301 + seed * 49297) % 233280));
    return { id: q.id, prompt: q.prompt, points: q.points, data: { cards: order.map((i) => cards[i]) } };
  }
  // Тақтадағы ойындар (мұғалім экраны) мен жұптық шифр: жауап ойын ішінде керек
  if (type === "TUGOFWAR" || type === "BOARD") return { id: q.id, prompt: q.prompt, points: q.points, data: { ...data, answer: q.answer, explanation: q.explanation ?? null } };
  if (type === "CIPHER") return { id: q.id, prompt: q.prompt, points: q.points, data: { ...data, word: q.answer } };
  if (type === "PIXEL") return { id: q.id, prompt: q.prompt, points: q.points, data: { ...data, target: q.answer } };
  if (type === "TEAMESCAPE") return { id: q.id, prompt: q.prompt, points: q.points, data: { parts: ((data.clues as unknown[]) ?? []).length } };
  return { id: q.id, prompt: q.prompt, points: q.points, data };
}

/** Сөзжұмбақ торы: сұрақтардың орны мен ұзындығы бойынша тор өлшемін анықтайды. */
export function crosswordLayout(qs: { id: string; data: unknown }[]) {
  let rows = 0, cols = 0;
  const words = qs.map((q, n) => {
    const d = q.data as { row: number; col: number; dir: "across" | "down"; len: number };
    rows = Math.max(rows, d.dir === "down" ? d.row + d.len : d.row + 1);
    cols = Math.max(cols, d.dir === "across" ? d.col + d.len : d.col + 1);
    return { id: q.id, n: n + 1, ...d };
  });
  return { rows, cols, words };
}
