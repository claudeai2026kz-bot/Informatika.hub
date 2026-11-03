"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.union([
  z.object({ materialId: z.string().cuid() }),
  z.object({ assessmentId: z.string().cuid() }),
  z.object({ gameId: z.string().cuid() }),
]);
export type FavTarget = { materialId: string } | { assessmentId: string } | { gameId: string };

export async function toggleFavorite(target: FavTarget) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Алдымен жүйеге кіріңіз" };
  const t = schema.parse(target);
  const where = { userId: user.id, ...t };
  const existing = await db.favorite.findFirst({ where });
  if (existing) await db.favorite.delete({ where: { id: existing.id } });
  else await db.favorite.create({ data: where });
  return { ok: true, on: !existing };
}
