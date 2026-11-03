"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, sha256 } from "@/lib/auth";
import { mailConfigured, sendMail } from "@/lib/mail";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export type ResetState = { error?: string; ok?: string } | undefined;

export async function requestResetAction(_: ResetState, fd: FormData): Promise<ResetState> {
  const parsed = emailSchema.safeParse(fd.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!mailConfigured())
    return { error: "Email жіберу қызметі әлі бапталмаған, сондықтан хат жіберу мүмкін емес. Құпиясөзді қалпына келтіру үшін әкімшіге хабарласыңыз." };
  if (!(await rateLimit("reset", 5, 600))) return { error: "Тым көп сұраныс. Кейінірек қайталаңыз." };

  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (user && !user.blocked) {
    const token = randomBytes(32).toString("base64url");
    await db.passwordResetToken.create({ data: { id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + 3600e3) } });
    const h = await headers();
    const origin = process.env.APP_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
    const link = `${origin}/reset?token=${token}`;
    await sendMail(user.email, "Informatika Hub: құпиясөзді қалпына келтіру",
      `<p>Сәлеметсіз бе, ${user.name.replace(/[<>&]/g, "")}!</p><p>Жаңа құпиясөз орнату үшін сілтемені ашыңыз (1 сағат жарамды):</p><p><a href="${link}">${link}</a></p><p>Егер сіз сұрамаған болсаңыз, бұл хатты елемеңіз.</p>`);
  }
  // Email бар-жоғын жария етпеу үшін бірдей жауап.
  return { ok: "Егер бұл email тіркелген болса, оған қалпына келтіру сілтемесі жіберілді." };
}

export async function resetPasswordAction(_: ResetState, fd: FormData): Promise<ResetState> {
  const token = String(fd.get("token") ?? "");
  const pw = passwordSchema.safeParse(fd.get("password"));
  if (!pw.success) return { error: pw.error.issues[0].message };
  if (pw.data !== fd.get("confirm")) return { error: "Құпиясөздер сәйкес келмейді" };
  const rec = await db.passwordResetToken.findUnique({ where: { id: sha256(token) } });
  if (!rec || rec.usedAt || rec.expiresAt < new Date()) return { error: "Сілтеме жарамсыз немесе мерзімі өтіп кеткен. Қайта сұраныс жіберіңіз." };
  await db.$transaction([
    db.user.update({ where: { id: rec.userId }, data: { passwordHash: await hashPassword(pw.data) } }),
    db.passwordResetToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: rec.userId } }),
  ]);
  redirect("/login?reset=1");
}
