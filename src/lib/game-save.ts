import "server-only";
import { z } from "zod";
import type { GameType, Prisma } from "@prisma/client";
import { autoLayout } from "./crossword";

/** Ойынды сақтауға дайындау: тексеру + сұрақтарды базаға жазылатын түрге келтіру (әкімші де, мұғалім де қолданады). */
export const gameSchema = z.object({
  type: z.enum(["QUIZ", "MATCHING", "CROSSWORD", "RAPID", "LOGIC", "CODING"]),
  title: z.string().trim().min(3, "Атауы кемінде 3 таңба").max(200),
  description: z.string().trim().max(1000).default(""),
  grade: z.coerce.number().int().min(5).max(11),
  topicId: z.number().int().positive().optional(),
  timeLimit: z.number().int().min(3).max(120).optional(),
  published: z.boolean(),
  questions: z.array(z.object({
    prompt: z.string().trim().min(1, "Сұрақ мәтіні бос").max(1000),
    data: z.record(z.unknown()).default({}),
    answer: z.unknown(),
    explanation: z.string().trim().max(1000).optional(),
    points: z.number().int().min(1).max(100).default(1),
  })).min(1, "Кемінде бір сұрақ қосыңыз").max(200),
});

function validateQuestion(type: GameType, q: z.infer<typeof gameSchema>["questions"][number], n: number): string | null {
  const at = `${n + 1}-сұрақ: `;
  if (type === "QUIZ" || type === "RAPID") {
    const opts = q.data.options as unknown;
    if (!Array.isArray(opts) || opts.length < 2 || opts.some((o) => typeof o !== "string" || !o.trim())) return at + "кемінде 2 жауап нұсқасын толтырыңыз";
    if (!Number.isInteger(q.answer) || (q.answer as number) < 0 || (q.answer as number) >= opts.length) return at + "дұрыс жауапты белгілеңіз";
  } else if (type === "MATCHING") {
    const l = q.data.left as unknown, r = q.data.right as unknown;
    if (!Array.isArray(l) || !Array.isArray(r) || l.length < 2 || l.length !== r.length || [...l, ...r].some((x) => typeof x !== "string" || !x.trim())) return at + "кемінде 2 толық жұп енгізіңіз";
  } else if (type === "CROSSWORD") {
    const d = q.data as { row?: number; col?: number; dir?: string };
    const word = String(q.answer ?? "").trim();
    if (!word || /\s/.test(word)) return at + "жауап бос орынсыз бір сөз болуы керек";
    if (!Number.isInteger(d.row) || !Number.isInteger(d.col) || d.row! < 0 || d.col! < 0 || d.row! > 30 || d.col! > 30) return at + "жол мен бағанды көрсетіңіз (0–30)";
    if (d.dir !== "across" && d.dir !== "down") return at + "бағытын таңдаңыз";
  } else {
    const a = q.answer;
    if (!Array.isArray(a) || a.length === 0 || a.some((x) => typeof x !== "string" || !x.trim())) return at + "кемінде бір дұрыс жауап жазыңыз";
  }
  return null;
}

/** Сөзжұмбақ сөздерінің қиылысатын әріптері сәйкес келетінін тексереді. */
function checkCrossword(qs: { data: Record<string, unknown>; answer: unknown }[]) {
  const grid = new Map<string, string>();
  for (const [n, q] of qs.entries()) {
    const w = String(q.answer).toUpperCase();
    const { row, col, dir } = q.data as { row: number; col: number; dir: string };
    for (let k = 0; k < w.length; k++) {
      const key = dir === "down" ? `${row + k}:${col}` : `${row}:${col + k}`;
      const prev = grid.get(key);
      if (prev && prev !== w[k]) return `${n + 1}-сөз басқа сөзбен қиылысатын жерде әріптері сәйкес келмейді`;
      grid.set(key, w[k]);
    }
  }
  return null;
}


export type PreparedGame = {
  base: { type: GameType; title: string; description: string; gradeId: number; topicId: number | null; timeLimit: number | null };
  questions: { order: number; prompt: string; data: Prisma.InputJsonValue; answer: Prisma.InputJsonValue; explanation: string | null; points: number }[];
  published: boolean;
};

/** autoCrossword: сөзжұмбақ сөздерінің орнын өзі табады (мұғалім тек сөз бен сұрақты жазады). */
export function prepareGame(payload: unknown, opts: { autoCrossword?: boolean } = {}): { error: string } | PreparedGame {
  const p = gameSchema.safeParse(payload);
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  if (d.type === "CROSSWORD" && opts.autoCrossword) {
    const words = d.questions.map((q) => String(q.answer ?? "").trim().replace(/\s/g, ""));
    if (words.some((w) => w.length < 2)) return { error: "Әр сөз кемінде 2 әріптен тұруы керек" };
    if (words.length < 2) return { error: "Сөзжұмбаққа кемінде 2 сөз керек" };
    const lay = autoLayout(words);
    if (!lay) return { error: "Сөздерді бір-бірімен қиылыстыру мүмкін болмады. Ортақ әріптері бар басқа сөздер қосып көріңіз." };
    d.questions = d.questions.map((q, i) => ({ ...q, answer: words[i], data: { ...lay[i] } }));
  }
  for (const [n, q] of d.questions.entries()) {
    const err = validateQuestion(d.type, q, n);
    if (err) return { error: err };
  }
  const questions = d.questions.map((q, order) => {
    let data = q.data, answer = q.answer;
    if (d.type === "MATCHING") answer = (q.data.left as string[]).map((_, i) => i);
    if (d.type === "CROSSWORD") { answer = String(q.answer).trim().toUpperCase(); data = { ...q.data, len: (answer as string).length }; }
    if (d.type === "LOGIC" || d.type === "CODING") answer = (q.answer as string[]).map((s) => s.trim());
    return { order, prompt: q.prompt, data: data as Prisma.InputJsonValue, answer: answer as Prisma.InputJsonValue, explanation: q.explanation || null, points: d.type === "MATCHING" ? (q.data.left as string[]).length : q.points };
  });
  if (d.type === "CROSSWORD") {
    const err = checkCrossword(questions.map((q) => ({ data: q.data as Record<string, unknown>, answer: q.answer })));
    if (err) return { error: err };
  }
  return {
    base: { type: d.type, title: d.title, description: d.description, gradeId: d.grade, topicId: d.topicId ?? null, timeLimit: d.type === "RAPID" ? d.timeLimit ?? 10 : null },
    questions,
    published: d.published,
  };
}
