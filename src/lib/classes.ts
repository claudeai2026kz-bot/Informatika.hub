import "server-only";
import { db } from "@/lib/db";

export type GradeCell = { score: number; max: number; tries: number; resultId: string } | null;

/** Сынып журналы: оқушылар × ойындар. Әр ұяшықта — оқушының сол ойындағы ең жоғары нәтижесі. */
export async function loadGradebook(classId: string, teacherId: string) {
  const cls = await db.classroom.findFirst({
    where: { id: classId, teacherId },
    include: {
      students: { orderBy: { name: "asc" } },
      columns: { orderBy: { createdAt: "asc" }, include: { marks: true } },
      games: { orderBy: { createdAt: "asc" }, include: { game: { select: { id: true, title: true, type: true, gradeId: true, _count: { select: { questions: true } } } } } },
    },
  });
  if (!cls) return null;
  const results = await db.studentResult.findMany({
    where: { classId: cls.id, teacherId },
    select: { id: true, gameId: true, studentId: true, studentName: true, score: true, maxScore: true },
    orderBy: { createdAt: "asc" },
  });
  const modeOf = new Map(cls.games.map((cg) => [cg.gameId, cg.countMode]));
  const byName = new Map(cls.students.map((s) => [s.name.toLowerCase(), s.id]));
  const cells = new Map<string, GradeCell>(); // `${studentId}:${gameId}`
  // Тізімде жоқ есіммен ойнағандар: мұғалім тізімге қосады не өшіреді
  const strangerMap = new Map<string, { name: string; tries: number; best: Map<string, { score: number; max: number }> }>();
  for (const r of results) {
    const sid = r.studentId ?? byName.get(r.studentName.toLowerCase());
    if (!sid) {
      const k = r.studentName.trim().toLowerCase();
      const e = strangerMap.get(k) ?? { name: r.studentName.trim(), tries: 0, best: new Map() };
      e.tries++;
      const b = e.best.get(r.gameId);
      if (!b || (r.maxScore ? r.score / r.maxScore : 0) > (b.max ? b.score / b.max : 0)) e.best.set(r.gameId, { score: r.score, max: r.maxScore });
      strangerMap.set(k, e);
      continue;
    }
    const key = `${sid}:${r.gameId}`;
    const cur = cells.get(key);
    const pct = (x: { score: number; max: number }) => (x.max ? x.score / x.max : 0);
    if (!cur) cells.set(key, { score: r.score, max: r.maxScore, tries: 1, resultId: r.id });
    else {
      const next = { score: r.score, max: r.maxScore };
      const mode = modeOf.get(r.gameId) ?? "best";
      const take = mode === "last" || (mode === "best" && pct(next) > pct(cur));
      cells.set(key, take ? { ...next, tries: cur.tries + 1, resultId: r.id } : { ...cur, tries: cur.tries + 1 });
    }
  }
  const games = cls.games.map((cg) => ({ ...cg.game, attempts: cg.attempts, countMode: cg.countMode, dueAt: cg.dueAt }));
  const columns = cls.columns.map((c) => ({ id: c.id, title: c.title, max: c.maxScore, marks: new Map(c.marks.map((m) => [m.studentId, m.score])) }));
  const rows = cls.students.map((s) => {
    const row = games.map((g) => cells.get(`${s.id}:${g.id}`) ?? null);
    const marks = columns.map((c) => (c.marks.has(s.id) ? c.marks.get(s.id)! : null));
    const done = [
      ...row.filter((c): c is NonNullable<GradeCell> => !!c),
      ...marks.flatMap((m, k) => (m === null ? [] : [{ score: m, max: columns[k].max }])),
    ];
    const sum = done.reduce((a, c) => a + c.score, 0);
    const max = done.reduce((a, c) => a + c.max, 0);
    const avg = done.length ? done.reduce((a, c) => a + (c.max ? c.score / c.max : 0), 0) / done.length : null;
    return { student: s, cells: row, marks, sum, max, avg, done: done.length };
  });
  const gameAvg = games.map((_, i) => {
    const done = rows.map((r) => r.cells[i]).filter((c): c is NonNullable<GradeCell> => !!c);
    return { played: done.length, avg: done.length ? done.reduce((a, c) => a + (c.max ? c.score / c.max : 0), 0) / done.length : null };
  });
  const colAvg = columns.map((c, i) => {
    const done = rows.map((r) => r.marks[i]).filter((m): m is number => m !== null);
    return { played: done.length, avg: done.length && c.max ? done.reduce((a, m) => a + m / c.max, 0) / done.length : null };
  });
  const strangers = [...strangerMap.values()].map((e) => ({ name: e.name, tries: e.tries, cells: games.map((g) => e.best.get(g.id) ?? null) }));
  return { cls, games, rows, gameAvg, strangers, columns: columns.map(({ marks: _m, ...c }) => c), colAvg };
}

/** Пайызды 5 балдық бағаға айналдыру (85% — 5, 65% — 4, 40% — 3, одан төмен — 2). */
export const MARK_STEPS = [{ min: 0.85, m: 5 }, { min: 0.65, m: 4 }, { min: 0.4, m: 3 }, { min: 0, m: 2 }];
export const markOf = (p: number | null) => (p === null ? null : MARK_STEPS.find((x) => p >= x.min - 1e-9)!.m);

export const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
