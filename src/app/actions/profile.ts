"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword, verifyPassword, sha256 } from "@/lib/auth";
import { cookies } from "next/headers";
import { emailSchema, nameSchema, passwordSchema } from "@/lib/validation";
import { IMAGE_EXTS, UploadError, removeStored, saveUpload } from "@/lib/storage";

export type FormState = { error?: string; ok?: string } | undefined;

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getCurrentUser();
  if (!u) return { error: "Жүйеге кіріңіз" };
  const p = z.object({ name: nameSchema, email: emailSchema }).safeParse({ name: fd.get("name"), email: fd.get("email") });
  if (!p.success) return { error: p.error.issues[0].message };
  if (p.data.email !== u.email && (await db.user.findUnique({ where: { email: p.data.email } }))) return { error: "Бұл email басқа аккаунтқа тіркелген" };

  let avatarPath: string | undefined;
  const file = fd.get("avatar");
  if (file instanceof File && file.size > 0) {
    try {
      avatarPath = (await saveUpload(file, "avatars", IMAGE_EXTS, 3)).path;
    } catch (e) {
      return { error: e instanceof UploadError ? e.message : "Суретті жүктеу мүмкін болмады" };
    }
    await removeStored(u.avatarPath);
  }
  await db.user.update({ where: { id: u.id }, data: { name: p.data.name, email: p.data.email, ...(avatarPath && { avatarPath }) } });
  revalidatePath("/", "layout");
  return { ok: "Профиль сақталды" };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getCurrentUser();
  if (!u) return { error: "Жүйеге кіріңіз" };
  const current = String(fd.get("current") ?? "");
  const np = passwordSchema.safeParse(fd.get("password"));
  if (!np.success) return { error: np.error.issues[0].message };
  if (np.data !== fd.get("confirm")) return { error: "Жаңа құпиясөздер сәйкес келмейді" };
  const row = await db.user.findUniqueOrThrow({ where: { id: u.id } });
  if (!(await verifyPassword(current, row.passwordHash))) return { error: "Қазіргі құпиясөз қате" };
  // Басқа құрылғылардағы сессияларды жабамыз, ағымдағысы қалады.
  const token = (await cookies()).get("ih_session")?.value ?? "";
  await db.$transaction([
    db.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(np.data) } }),
    db.session.deleteMany({ where: { userId: u.id, id: { not: sha256(token) } } }),
  ]);
  return { ok: "Құпиясөз ауыстырылды" };
}

export async function updateSettings(_: FormState, fd: FormData): Promise<FormState> {
  const u = await getCurrentUser();
  if (!u) return { error: "Жүйеге кіріңіз" };
  await db.user.update({
    where: { id: u.id },
    data: { soundOn: fd.get("soundOn") === "on", notifyOn: fd.get("notifyOn") === "on", profilePublic: fd.get("profilePublic") === "on" },
  });
  revalidatePath("/", "layout");
  return { ok: "Баптаулар сақталды" };
}

/** Робот дауысын (сөйлеуін) аккаунтқа сақтайды — қай құрылғыдан кірсе де сол күйі тұрады. */
export async function setVoiceAction(on: boolean): Promise<void> {
  const u = await getCurrentUser();
  if (!u) return;
  await db.user.update({ where: { id: u.id }, data: { voiceOn: on === true } });
}
