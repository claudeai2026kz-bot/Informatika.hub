/** Ойын ұпайын есептеу. Таза функциялар: сервер де, тест те қолданады. */
import type { GameType } from "@prisma/client";

export type QuestionRow = { id: string; prompt: string; data: unknown; answer: unknown; points: number; explanation?: string | null };

export const norm = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[«»"']/g, "").replace(/ё/g, "е");

/** Бір сұрақ үшін: (ұпай, максимум). */
export function scoreQuestion(type: GameType, q: QuestionRow, given: unknown): { score: number; max: number; correct: boolean } {
  switch (type) {
    case "QUIZ":
    case "RAPID": {
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
  const details = questions.map((q) => {
    const r = scoreQuestion(type, q, answers[q.id]);
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
