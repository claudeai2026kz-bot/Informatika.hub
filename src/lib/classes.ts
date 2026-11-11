import "server-only";
import { db } from "@/lib/db";

export type GradeCell = { score: number; max: number; tries: number; resultId: string } | null;

/** Сынып журналы: оқушылар × ойындар. Әр ұяшықта — оқушының сол ойындағы ең жоғары нәтижесі. */
export async function loadGradebook(classId: string, teacherId: string) {
  const cls = await db.classroom.findFirst({
    where: { id: classId, teacherId },
    include: {
      students: { orderBy: { name: "asc" } },
      games: { orderBy: { createdAt: "asc" }, include: { game: { select: { id: true, title: true, type: true, gradeId: true, _count: { select: { questions: true } } } } } },
    },
  });
  if (!cls) return null;
  const results = await db.studentResult.findMany({
    where: { classId: cls.id, teacherId },
    select: { id: true, gameId: true, studentId: true, studentName: true, score: true, maxScore: true },
  });
  const byName = new Map(cls.students.map((s) => [s.name.toLowerCase(), s.id]));
  const cells = new Map<string, GradeCell>(); // `${studentId}:${gameId}`
  for (const r of results) {
    const sid = r.studentId ?? byName.get(r.studentName.toLowerCase());
    if (!sid) continue;
    const key = `${sid}:${r.gameId}`;
    const cur = cells.get(key);
    const pct = (x: { score: number; max: number }) => (x.max ? x.score / x.max : 0);
    if (!cur) cells.set(key, { score: r.score, max: r.maxScore, tries: 1, resultId: r.id });
    else {
      const next = { score: r.score, max: r.maxScore };
      cells.set(key, pct(next) > pct(cur) ? { ...next, tries: cur.tries + 1, resultId: r.id } : { ...cur, tries: cur.tries + 1 });
    }
  }
  const games = cls.games.map((cg) => cg.game);
  const rows = cls.students.map((s) => {
    const row = games.map((g) => cells.get(`${s.id}:${g.id}`) ?? null);
    const done = row.filter((c): c is NonNullable<GradeCell> => !!c);
    const sum = done.reduce((a, c) => a + c.score, 0);
    const max = done.reduce((a, c) => a + c.max, 0);
    const avg = done.length ? done.reduce((a, c) => a + (c.max ? c.score / c.max : 0), 0) / done.length : null;
    return { student: s, cells: row, sum, max, avg, done: done.length };
  });
  const gameAvg = games.map((_, i) => {
    const done = rows.map((r) => r.cells[i]).filter((c): c is NonNullable<GradeCell> => !!c);
    return { played: done.length, avg: done.length ? done.reduce((a, c) => a + (c.max ? c.score / c.max : 0), 0) / done.length : null };
  });
  return { cls, games, rows, gameAvg };
}

export const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
