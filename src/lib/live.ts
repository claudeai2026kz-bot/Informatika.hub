import "server-only";
import { db } from "./db";
import { norm, type QuestionRow } from "./games";

export const LIVE_TYPES = ["QUIZ", "RAPID", "TRUEFALSE", "CLIMB", "SHOOTER", "TUGOFWAR", "DUEL", "LIVE"] as const;
export const TEAM_NAMES = ["Көктер", "Күлгіндер", "Сарылар", "Жасылдар", "Қызылдар", "Көгілдірлер"];
export const GRACE_MS = 1500;

export async function loadSession(code: string) {
  return db.liveSession.findUnique({
    where: { code },
    include: { game: { include: { questions: { orderBy: { order: "asc" } } } }, players: { orderBy: { joinedAt: "asc" } }, answers: true },
  });
}
type S = NonNullable<Awaited<ReturnType<typeof loadSession>>>;

export const isTeamEscape = (s: { game: { type: string } }) => s.game.type === "TEAMESCAPE";
export const limitSec = (s: S) => s.game.timeLimit ?? 20;

/** Команданың шешкен есіктері мен ұпайы. */
export function teamProgress(s: S) {
  return Array.from({ length: s.teams }, (_, team) => {
    const ids = new Set(s.players.filter((p) => p.team === team).map((p) => p.id));
    const solvedAns = s.answers.filter((a) => a.correct && ids.has(a.playerId));
    const solved = [...new Set(solvedAns.map((a) => a.qIndex))];
    const bonus = s.players.filter((p) => p.team === team).reduce((t, p) => t + p.bonus, 0);
    const score = solved.reduce((t, k) => t + (s.game.questions[k]?.points ?? 0), 0) + bonus;
    const last = solvedAns.length ? Math.max(...solvedAns.map((a) => a.createdAt.getTime())) : 0;
    return { team, name: TEAM_NAMES[team], members: ids.size, solved: solved.length, score, done: solved.length >= s.game.questions.length, last };
  });
}

/** Ойыншының (не мұғалімнің) экранына қажет күй. */
export function stateFor(s: S, playerId: string | null, host: boolean) {
  const qs = s.game.questions as QuestionRow[];
  const total = qs.length;
  const players = s.players.map((p) => ({ id: p.id, name: p.name, team: p.team, score: p.score + p.bonus, bonus: p.bonus }));
  const board = [...players].sort((a, b) => b.score - a.score);
  const me = playerId ? players.find((p) => p.id === playerId) ?? null : null;
  const base = { state: s.state, type: s.game.type, title: s.game.title, total, current: s.current, teams: s.teams, limit: limitSec(s), startedAt: s.startedAt?.getTime() ?? null, now: Date.now(), playerCount: players.length };

  if (isTeamEscape(s)) {
    const progress = teamProgress(s);
    let door = null;
    if (me && s.state === "question") {
      const tp = progress[me.team];
      const k = tp ? tp.solved : 0;
      if (k < total) {
        const q = qs[k];
        const clues = ((q.data as { clues?: string[] })?.clues ?? []);
        const mates = s.players.filter((p) => p.team === me.team);
        const idx = Math.max(0, mates.findIndex((p) => p.id === me.id));
        const tries = s.answers.filter((a) => a.qIndex === k && mates.some((m) => m.id === a.playerId) && !a.correct).length;
        door = { index: k, prompt: q.prompt, points: q.points, clue: clues.length ? clues[idx % clues.length] : "", part: clues.length ? (idx % clues.length) + 1 : 0, parts: clues.length, mates: mates.map((m) => m.name), wrong: tries };
      }
    }
    return { ...base, progress, me, door, players: host ? players : undefined };
  }

  const cur = s.current >= 0 && s.current < total ? qs[s.current] : null;
  const curAns = s.answers.filter((a) => a.qIndex === s.current);
  const question = cur ? { prompt: cur.prompt, points: cur.points, options: ((cur.data as { options?: string[] })?.options ?? []), code: (cur.data as { code?: string })?.code ?? null } : null;
  const mine = me ? curAns.find((a) => a.playerId === me.id) : undefined;
  const reveal = s.state === "reveal" || s.state === "ended";
  return {
    ...base,
    question,
    answered: curAns.length,
    counts: reveal && question ? question.options.map((_, k) => curAns.filter((a) => a.value === k).length) : null,
    answer: reveal && cur ? (cur.answer as number) : null,
    explanation: reveal && cur ? cur.explanation : null,
    board: reveal || host ? board.slice(0, host ? 100 : 5) : null,
    me: me ? { ...me, rank: board.findIndex((p) => p.id === me.id) + 1, answered: mine ? (mine.value as number) : null, correct: reveal && mine ? mine.correct : null, gained: reveal && mine ? mine.points : null } : null,
  };
}

/** Тірі ойында жауапты тексеру. */
export function checkLive(q: QuestionRow, type: string, value: unknown) {
  if (type === "TEAMESCAPE") {
    const acc = (Array.isArray(q.answer) ? q.answer : [q.answer]).map(norm);
    return acc.includes(norm(value));
  }
  return Number.isInteger(value) && value === q.answer;
}

export function newCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
