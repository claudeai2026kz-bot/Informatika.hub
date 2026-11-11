import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "./db";

export const SESSION_COOKIE = "ih_session";
const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 30);

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

/** Жаңа сессия жасап, httpOnly cookie орнатады. Базада тек токеннің хэші сақталады. */
export async function createSession(userId: string, remember = true) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.session.create({ data: { id: sha256(token), userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember && { expires: expiresAt }),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  avatarPath: string | null;
  role: "USER" | "ADMIN";
  soundOn: boolean;
  voiceOn: boolean;
  notifyOn: boolean;
  profilePublic: boolean;
};

/** Ағымдағы пайдаланушы (бір сұраныс ішінде кэштеледі). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { include: { role: true } } },
  });
  if (!s || s.expiresAt < new Date() || s.user.blocked) return null;
  const u = s.user;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarPath: u.avatarPath,
    role: u.role.key === "ADMIN" ? "ADMIN" : "USER",
    soundOn: u.soundOn,
    voiceOn: u.voiceOn,
    notifyOn: u.notifyOn,
    profilePublic: u.profilePublic,
  };
});

export async function requireUser(next?: string) {
  const u = await getCurrentUser();
  if (!u) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return u;
}

/** Әкімші тексерісі сервер жағында. Беттерде де, әрекеттерде де шақырылады. */
export async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u) redirect("/login?next=/admin");
  if (u.role !== "ADMIN") redirect("/dashboard?denied=1");
  return u;
}

export class AuthError extends Error {}
/** Server action ішінде: redirect емес, қате лақтырады. */
export async function assertAdmin() {
  const u = await getCurrentUser();
  if (!u || u.role !== "ADMIN") throw new AuthError("Бұл әрекетке рұқсат жоқ");
  return u;
}
