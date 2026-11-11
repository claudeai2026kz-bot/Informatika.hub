/** Робот-лабиринт: деңгей сипаттамасы және бағдарламаны орындау (сервер де, клиент те қолданады). */
export type MazeLevel = { w: number; h: number; walls: number[]; start: number; dir: number; goal: number; limit?: number };
/** F — алға, L — солға бұрылу, R — оңға бұрылу, {n, body} — қайталау */
export type Block = "F" | "L" | "R" | { n: number; body: Block[] };
export type Step = { cell: number; dir: number; crash?: boolean };

const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0]; // 0 — жоғары, 1 — оң, 2 — төмен, 3 — сол

export function isLevel(v: unknown): v is MazeLevel {
  const d = v as MazeLevel;
  if (!d || !Number.isInteger(d.w) || !Number.isInteger(d.h) || d.w < 3 || d.h < 3 || d.w > 10 || d.h > 10) return false;
  const n = d.w * d.h;
  const inGrid = (x: unknown) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < n;
  return Array.isArray(d.walls) && d.walls.every(inGrid) && inGrid(d.start) && inGrid(d.goal) && d.start !== d.goal
    && !d.walls.includes(d.start) && !d.walls.includes(d.goal) && Number.isInteger(d.dir) && d.dir >= 0 && d.dir < 4;
}

/** Бағдарламаны тексеру: тек белгілі блоктар, қайталау 2–10 рет, бір деңгей ішкі қайталау. */
export function parseProgram(v: unknown, depth = 0): Block[] | null {
  if (!Array.isArray(v) || v.length > 30) return null;
  const out: Block[] = [];
  for (const b of v) {
    if (b === "F" || b === "L" || b === "R") out.push(b);
    else if (b && typeof b === "object" && depth < 1) {
      const { n, body } = b as { n: unknown; body: unknown };
      const inner = parseProgram(body, depth + 1);
      if (!Number.isInteger(n) || (n as number) < 2 || (n as number) > 10 || !inner) return null;
      out.push({ n: n as number, body: inner });
    } else return null;
  }
  return out;
}

export const countBlocks = (p: Block[]): number => p.reduce((s, b) => s + (typeof b === "string" ? 1 : 1 + countBlocks(b.body)), 0);

/** Роботтың жүрген жолы. Қабырғаға не тордан тыс соғылса — тоқтайды. */
export function runMaze(level: MazeLevel, program: Block[]) {
  const walls = new Set(level.walls);
  let cell = level.start, dir = level.dir, crashed = false, reached = false;
  const steps: Step[] = [];
  const exec = (list: Block[]) => {
    for (const b of list) {
      if (crashed || reached || steps.length > 400) return;
      if (typeof b !== "string") { for (let k = 0; k < b.n; k++) exec(b.body); continue; }
      if (b === "L") dir = (dir + 3) % 4;
      else if (b === "R") dir = (dir + 1) % 4;
      else {
        const x = (cell % level.w) + DX[dir], y = Math.floor(cell / level.w) + DY[dir];
        const next = y * level.w + x;
        if (x < 0 || y < 0 || x >= level.w || y >= level.h || walls.has(next)) { crashed = true; steps.push({ cell, dir, crash: true }); return; }
        cell = next;
        if (cell === level.goal) reached = true;
      }
      steps.push({ cell, dir });
    }
  };
  exec(program);
  return { steps, reached, crashed };
}

export function mazeSolved(level: unknown, given: unknown) {
  if (!isLevel(level)) return false;
  const p = parseProgram(given);
  if (!p) return false;
  if (level.limit && countBlocks(p) > level.limit) return false;
  return runMaze(level, p).reached;
}

/** Деңгейдің шешімі бар ма (мұғалім салған лабиринтті тексеру үшін): жай іздеу. */
export function mazeHasPath(level: MazeLevel) {
  const walls = new Set(level.walls), seen = new Set([level.start]), q = [level.start];
  while (q.length) {
    const c = q.shift()!;
    if (c === level.goal) return true;
    for (let d = 0; d < 4; d++) {
      const x = (c % level.w) + DX[d], y = Math.floor(c / level.w) + DY[d], n = y * level.w + x;
      if (x >= 0 && y >= 0 && x < level.w && y < level.h && !walls.has(n) && !seen.has(n)) { seen.add(n); q.push(n); }
    }
  }
  return false;
}
