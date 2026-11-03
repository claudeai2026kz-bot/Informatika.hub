"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function markAllRead() {
  const u = await getCurrentUser();
  if (!u) return;
  await db.notification.updateMany({ where: { userId: u.id, read: false }, data: { read: true } });
  revalidatePath("/", "layout");
}
