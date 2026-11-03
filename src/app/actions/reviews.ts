"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function rateMaterial(materialId: string, rating: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "Бағалау үшін жүйеге кіріңіз" };
  const r = z.number().int().min(1).max(5).safeParse(rating);
  if (!r.success) return { error: "Баға 1-ден 5-ке дейін болуы керек" };
  const m = await db.material.findFirst({ where: { id: materialId, published: true }, select: { id: true } });
  if (!m) return { error: "Материал табылмады" };
  await db.review.upsert({
    where: { userId_materialId: { userId: user.id, materialId } },
    create: { userId: user.id, materialId, rating: r.data },
    update: { rating: r.data },
  });
  const agg = await db.review.aggregate({ where: { materialId }, _avg: { rating: true }, _count: true });
  await db.material.update({ where: { id: materialId }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count } });
  revalidatePath(`/materials/${materialId}`);
  return { ok: true };
}

export type CommentState = { error?: string; ok?: boolean } | undefined;

export async function addComment(_: CommentState, fd: FormData): Promise<CommentState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Пікір жазу үшін жүйеге кіріңіз" };
  const parsed = z
    .object({
      text: z.string().trim().min(2, "Пікір тым қысқа").max(1000, "Пікір 1000 таңбадан аспауы керек"),
      materialId: z.string().cuid().optional(),
      assessmentId: z.string().cuid().optional(),
    })
    .safeParse({ text: fd.get("text"), materialId: fd.get("materialId") || undefined, assessmentId: fd.get("assessmentId") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await rateLimit(`comment:${user.id}`, 5, 60))) return { error: "Тым жиі жазып жатырсыз. Біраз күте тұрыңыз." };
  const { text, materialId, assessmentId } = parsed.data;
  if (!materialId && !assessmentId) return { error: "Қате сұраныс" };
  // React мәтінді автоматты түрде экрандайды (XSS қорғанысы), сондықтан мәтінді сол күйінде сақтаймыз.
  await db.comment.create({ data: { userId: user.id, text, materialId, assessmentId } });
  revalidatePath(materialId ? `/materials/${materialId}` : `/assessments/${assessmentId}`);
  return { ok: true };
}
