import type { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

/**
 * Seed қадамдарын бір рет қана орындау үшін.
 * Кодтағы тізім (тақырыптар, манифест жазбасы, ойын) өзгермесе, қайта қолданылмайды —
 * сондықтан әкімші сайттың өзінен жасаған өзгерістер (атауын өзгерту, жою, ретін ауыстыру) сақталады.
 */
export const hashOf = (v: unknown) => createHash("sha1").update(JSON.stringify(v)).digest("hex");

export async function loadSeedState(db: PrismaClient) {
  const rows = await db.seedState.findMany({ select: { key: true, hash: true } });
  const map = new Map(rows.map((r) => [r.key, r.hash]));
  return {
    has: (key: string, hash = "1") => map.get(key) === hash,
    async mark(key: string, hash = "1") {
      map.set(key, hash);
      await db.seedState.upsert({ where: { key }, update: { hash }, create: { key, hash } });
    },
  };
}
export type SeedState = Awaited<ReturnType<typeof loadSeedState>>;
