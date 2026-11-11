/**
 * Сөзжұмбақты автоматты құрастыру: сөздерді бір-бірімен қиылыстырып торға орналастырады.
 * Мұғалім тек сөз бен сұрақты жазады — орны мен бағытын осы функция табады.
 */
export type Placement = { row: number; col: number; dir: "across" | "down" };

type Cell = { ch: string; dirs: Set<string> };

function tryOrder(words: string[]): { placed: (Placement & { w: number })[]; h: number; wd: number } | null {
  const grid = new Map<string, Cell>();
  const placed: (Placement & { w: number })[] = [];
  const key = (r: number, c: number) => `${r}:${c}`;
  const step = (d: Placement["dir"]) => (d === "across" ? [0, 1] : [1, 0]);

  function can(w: string, r: number, c: number, d: Placement["dir"]) {
    const [dr, dc] = step(d);
    if (grid.has(key(r - dr, c - dc)) || grid.has(key(r + dr * w.length, c + dc * w.length))) return 0;
    let inter = 0;
    for (let k = 0; k < w.length; k++) {
      const rr = r + dr * k, cc = c + dc * k;
      const g = grid.get(key(rr, cc));
      if (g) {
        if (g.ch !== w[k] || g.dirs.has(d)) return 0;
        inter++;
      } else if (grid.has(key(rr + dc, cc + dr)) || grid.has(key(rr - dc, cc - dr))) return 0;
    }
    return inter;
  }
  function put(wi: number, w: string, r: number, c: number, d: Placement["dir"]) {
    const [dr, dc] = step(d);
    for (let k = 0; k < w.length; k++) {
      const kk = key(r + dr * k, c + dc * k);
      const g = grid.get(kk);
      grid.set(kk, { ch: w[k], dirs: new Set([...(g?.dirs ?? []), d]) });
    }
    placed.push({ w: wi, row: r, col: c, dir: d });
  }
  function bbox(extra: [number, number][] = []) {
    let r0 = Infinity, r1 = -Infinity, c0 = Infinity, c1 = -Infinity;
    for (const k of [...grid.keys()].map((s) => s.split(":").map(Number) as [number, number]).concat(extra)) {
      r0 = Math.min(r0, k[0]); r1 = Math.max(r1, k[0]); c0 = Math.min(c0, k[1]); c1 = Math.max(c1, k[1]);
    }
    return { r0, c0, h: r1 - r0 + 1, wd: c1 - c0 + 1 };
  }

  const idx = words.map((_, i) => i);
  put(idx[0], words[idx[0]], 0, 0, "across");
  let left = idx.slice(1), stuck = 0;
  while (left.length && stuck <= left.length) {
    const wi = left.shift()!;
    const w = words[wi];
    let best: { score: number; r: number; c: number; d: Placement["dir"] } | null = null;
    for (const p of placed) {
      const pw = words[p.w];
      for (let i = 0; i < pw.length; i++)
        for (let j = 0; j < w.length; j++) {
          if (pw[i] !== w[j]) continue;
          const d: Placement["dir"] = p.dir === "across" ? "down" : "across";
          const r = p.dir === "across" ? p.row - j : p.row + i;
          const c = p.dir === "across" ? p.col + i : p.col - j;
          if (placed.some((x) => x.row === r && x.col === c)) continue;
          const inter = can(w, r, c, d);
          if (!inter) continue;
          const cells: [number, number][] = Array.from({ length: w.length }, (_, k) => [d === "down" ? r + k : r, d === "across" ? c + k : c]);
          const b = bbox(cells);
          const score = b.h * b.wd - inter * 3;
          if (!best || score < best.score) best = { score, r, c, d };
        }
    }
    if (best) { put(wi, w, best.r, best.c, best.d); stuck = 0; } else { left.push(wi); stuck++; }
  }
  if (left.length) return null;
  const b = bbox();
  return { placed: placed.map((p) => ({ ...p, row: p.row - b.r0, col: p.col - b.c0 })), h: b.h, wd: b.wd };
}

/** Сөздер тізімі → әр сөздің орны (сол ретпен). Барлығын қиылыстыру мүмкін болмаса — null. */
export function autoLayout(rawWords: string[], tries = 400): Placement[] | null {
  const words = rawWords.map((w) => w.trim().toUpperCase());
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let best: { res: NonNullable<ReturnType<typeof tryOrder>>; order: number[]; score: number } | null = null;
  for (let t = 0; t < tries; t++) {
    const order = words.map((_, i) => i);
    if (t === 0) order.sort((a, b) => words[b].length - words[a].length);
    else for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const res = tryOrder(order.map((i) => words[i]));
    if (!res || res.wd > 16) continue;
    const score = Math.max(res.h, res.wd) * 1000 + res.h * res.wd;
    if (!best || score < best.score) best = { res, order, score };
  }
  if (!best) return null;
  const out: Placement[] = new Array(words.length);
  for (const p of best.res.placed) out[best.order[p.w]] = { row: p.row, col: p.col, dir: p.dir };
  return out;
}
