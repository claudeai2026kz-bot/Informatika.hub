"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type LiveState = {
  state: "lobby" | "question" | "reveal" | "ended"; type: string; title: string; total: number; current: number; teams: number; limit: number;
  startedAt: number | null; now: number; playerCount: number;
  question?: { prompt: string; points: number; options: string[]; code: string | null } | null;
  answered?: number; counts?: number[] | null; answer?: number | null; explanation?: string | null;
  board?: { id: string; name: string; team: number; score: number; bonus: number }[] | null;
  players?: { id: string; name: string; team: number; score: number; bonus: number }[];
  me?: { id: string; name: string; team: number; score: number; rank?: number; answered?: number | null; correct?: boolean | null; gained?: number | null } | null;
  progress?: { team: number; name: string; members: number; solved: number; score: number; done: boolean; last: number }[];
  door?: { index: number; prompt: string; points: number; clue: string; part: number; parts: number; mates: string[]; wrong: number } | null;
};

/** Тірі ойын күйін жиі сұрап отырады. skew — сервер мен құрылғы сағатының айырмасы. */
export function useLive(code: string, opts: { player?: string | null; host?: boolean; every?: number }) {
  const [s, setS] = useState<LiveState | null>(null);
  const [gone, setGone] = useState(false);
  const skew = useRef(0);
  const q = `${opts.player ? `p=${opts.player}&` : ""}${opts.host ? "host=1" : ""}`;
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/live/${code}?${q}`, { cache: "no-store" });
      if (r.status === 404) { setGone(true); return; }
      const j = (await r.json()) as LiveState;
      skew.current = j.now - Date.now();
      setS(j);
    } catch { /* желі уақытша үзілсе, келесі жолы */ }
  }, [code, q]);
  useEffect(() => {
    load();
    const id = setInterval(load, opts.every ?? 1500);
    return () => clearInterval(id);
  }, [load, opts.every]);
  const serverNow = useCallback(() => Date.now() + skew.current, []);
  return { s, gone, reload: load, serverNow };
}

/** Қалған секунд. */
export function useCountdown(s: LiveState | null, serverNow: () => number) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(s?.state === "question" && s.startedAt ? Math.max(0, Math.ceil((s.startedAt + s.limit * 1000 - serverNow()) / 1000)) : 0);
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [s, serverNow]);
  return left;
}

export const OPT_STYLES = [
  { bg: "from-rose-500 to-rose-600", shape: "▲" },
  { bg: "from-sky-500 to-sky-600", shape: "◆" },
  { bg: "from-amber-400 to-amber-500", shape: "●" },
  { bg: "from-emerald-500 to-emerald-600", shape: "■" },
  { bg: "from-lilac-500 to-lilac-600", shape: "★" },
  { bg: "from-teal-500 to-teal-600", shape: "⬟" },
];
