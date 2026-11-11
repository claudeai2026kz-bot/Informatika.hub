"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Мұғалім оқушының баллын қолмен өзгертеді (мысалы, ауызша жауабы үшін қосады). */
export async function setStudentScore(id: string, score: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "Жүйеге кіріңіз" };
  const r = await db.studentResult.findUnique({ where: { id: z.string().cuid().parse(id) } });
  if (!r || r.teacherId !== user.id) return { error: "Рұқсат жоқ" };
  const s = Math.max(0, Math.min(r.maxScore, Math.round(Number(score) || 0)));
  await db.studentResult.update({ where: { id: r.id }, data: { score: s } });
  revalidatePath(`/games/${r.gameId}/results`);
  return { ok: true, score: s };
}

export async function deleteStudentResult(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const r = await db.studentResult.findUnique({ where: { id: z.string().cuid().parse(id) } });
  if (!r || r.teacherId !== user.id) return;
  await db.studentResult.delete({ where: { id: r.id } });
  revalidatePath(`/games/${r.gameId}/results`);
}
