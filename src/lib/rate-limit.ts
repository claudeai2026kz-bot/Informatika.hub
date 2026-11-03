import "server-only";
import { headers } from "next/headers";

/** Қарапайым жадтағы шектеу (бір сервер үшін). Көп серверлі хостингте Redis-ке ауыстыру керек. */
const hits = new Map<string, { n: number; reset: number }>();

export async function rateLimit(key: string, max: number, windowSec: number) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const k = `${key}:${ip}`;
  const now = Date.now();
  const cur = hits.get(k);
  if (!cur || cur.reset < now) {
    hits.set(k, { n: 1, reset: now + windowSec * 1000 });
    return true;
  }
  cur.n++;
  return cur.n <= max;
}
