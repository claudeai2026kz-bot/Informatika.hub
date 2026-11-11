"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { prepareGame } from "@/lib/game-save";

export type MyGameState = { error?: string; ok?: string; id?: string } | undefined;

/** Мұғалім өз ойынын жасайды не өзгертеді. Ойын тек өзіне және сілтеме алған оқушыларына көрінеді. */
export async function saveMyGame(payload: unknown, id?: string, classId?: string): Promise<MyGameState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Жүйеге кіріңіз" };
  const prep = prepareGame(payload, { autoCrossword: true });
  if ("error" in prep) return { error: prep.error };
  if (prep.questions.length > 50) return { error: "Бір ойында 50-ден артық сұрақ болмауы керек" };
  if (id) {
    const g = await db.game.findUnique({ where: { id }, select: { authorId: true } });
    if (!g || g.authorId !== user.id) return { error: "Бұл ойынды тек оны жасаған мұғалім өзгерте алады" };
    await db.$transaction([
      db.game.update({ where: { id }, data: { ...prep.base, published: true } }),
      db.gameQuestion.deleteMany({ where: { gameId: id } }),
      db.gameQuestion.createMany({ data: prep.questions.map((q) => ({ ...q, gameId: id })) }),
    ]);
    revalidatePath(`/games/${id}`);
    return { ok: "Ойын сақталды", id };
  }
  const count = await db.game.count({ where: { authorId: user.id } });
  if (count >= 200) return { error: "Ойындар саны шегіне жетті (200)" };
  const g = await db.game.create({ data: { ...prep.base, published: true, authorId: user.id, questions: { create: prep.questions } } });
  // «Менің сыныптарым» ішінен жасалса — ойын бірден сол сыныпқа беріледі
  if (classId && (await db.classroom.findFirst({ where: { id: classId, teacherId: user.id }, select: { id: true } }))) {
    await db.classGame.create({ data: { classId, gameId: g.id } });
    revalidatePath(`/classes/${classId}`);
  }
  revalidatePath("/games/my");
  return { ok: "Ойын сақталды", id: g.id };
}

export async function deleteMyGame(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.game.deleteMany({ where: { id, authorId: user.id } });
  revalidatePath("/games/my");
}
