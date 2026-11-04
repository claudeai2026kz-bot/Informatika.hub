"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { fieldErrors, loginSchema, registerSchema, type FieldErrors } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export type AuthState = { errors?: FieldErrors; values?: Record<string, string> } | undefined;

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
}

export async function registerAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const raw = {
    name: String(fd.get("name") ?? ""),
    email: String(fd.get("email") ?? ""),
    password: String(fd.get("password") ?? ""),
    confirm: String(fd.get("confirm") ?? ""),
  };
  const values = { name: raw.name, email: raw.email };
  if (!(await rateLimit("register", 10, 60))) return { errors: { form: "Тым көп әрекет. Бір минуттан кейін қайталаңыз." }, values };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { name, email, password } = parsed.data;

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return { errors: { email: "Бұл email арқылы тіркелген аккаунт бар. Жүйеге кіріңіз." }, values };

  // Әдепкі рөл әрқашан USER. Рөлді формадан қабылдамаймыз.
  const role = await db.role.upsert({ where: { key: "USER" }, update: {}, create: { key: "USER", name: "Пайдаланушы" } });
  const user = await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password), roleId: role.id },
  });
  await db.notification.create({
    data: { userId: user.id, title: "Қош келдіңіз!", body: "Informatika Hub-қа тіркелгеніңізге қуаныштымыз. Сыныпты таңдап, материалдарды қарап шығыңыз.", link: "/dashboard" },
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const raw = { email: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? "") };
  const values = { email: raw.email };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  if (!(await rateLimit(`login:${parsed.data.email}`, 8, 300)))
    return { errors: { form: "Тым көп сәтсіз әрекет. 5 минуттан кейін қайталаңыз." }, values };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !ok) return { errors: { form: "Email немесе құпиясөз қате. Қайта тексеріп көріңіз." }, values };
  if (user.blocked) return { errors: { form: "Бұл аккаунт бұғатталған. Қолдау қызметіне хабарласыңыз." }, values };

  await createSession(user.id, fd.get("remember") !== null || fd.get("rememberSet") === null);
  redirect(safeNext(fd.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
