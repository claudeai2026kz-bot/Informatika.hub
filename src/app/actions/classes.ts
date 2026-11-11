"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type ClassState = { error?: string; ok?: string } | undefined;

const nameS = z.string().trim().min(1, "Сынып атауын жазыңыз").max(30, "Атауы тым ұзын");
const gradeS = z.coerce.number().int().min(5).max(11);
const idS = z.string().cuid();

async function ownClass(classId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const c = await db.classroom.findFirst({ where: { id: idS.parse(classId), teacherId: user.id }, select: { id: true, teacherId: true } });
  return c;
}

/** Жаңа сынып құру (мысалы, 7 «А»). */
export async function createClass(_: ClassState, fd: FormData): Promise<ClassState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Жүйеге кіріңіз" };
  const name = nameS.safeParse(fd.get("name"));
  const grade = gradeS.safeParse(fd.get("grade"));
  if (!name.success) return { error: name.error.issues[0].message };
  if (!grade.success) return { error: "Сыныпты таңдаңыз" };
  if ((await db.classroom.count({ where: { teacherId: user.id } })) >= 50) return { error: "Сыныптар саны шегіне жетті (50)" };
  const c = await db.classroom.create({ data: { teacherId: user.id, name: name.data, gradeId: grade.data } });
  const list = String(fd.get("students") ?? "");
  const names = parseNames(list);
  if (names.length) await db.classStudent.createMany({ data: names.map((n) => ({ classId: c.id, name: n })), skipDuplicates: true });
  revalidatePath("/classes");
  redirect(`/classes/${c.id}`);
}

export async function renameClass(classId: string, name: string, grade: number): Promise<ClassState> {
  const c = await ownClass(classId);
  if (!c) return { error: "Рұқсат жоқ" };
  const n = nameS.safeParse(name);
  const g = gradeS.safeParse(grade);
  if (!n.success) return { error: n.error.issues[0].message };
  if (!g.success) return { error: "Сыныпты таңдаңыз" };
  await db.classroom.update({ where: { id: c.id }, data: { name: n.data, gradeId: g.data } });
  revalidatePath(`/classes/${c.id}`);
  revalidatePath("/classes");
  return { ok: "Сақталды" };
}

export async function deleteClass(classId: string) {
  const c = await ownClass(classId);
  if (!c) return;
  await db.classroom.delete({ where: { id: c.id } });
  revalidatePath("/classes");
  redirect("/classes");
}

/** Әр жолға бір оқушы. Нөмір, нүкте, артық бос орын алынып тасталады. */
function parseNames(text: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/\r?\n|;/)) {
    const n = raw.replace(/^\s*\d+[.)]?\s*/, "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (n.length < 2 || seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase());
    out.push(n);
  }
  return out.slice(0, 60);
}

export async function addStudents(classId: string, text: string): Promise<ClassState> {
  const c = await ownClass(classId);
  if (!c) return { error: "Рұқсат жоқ" };
  const names = parseNames(text);
  if (!names.length) return { error: "Оқушылардың аты-жөнін жазыңыз (әр жолға біреуден)" };
  if ((await db.classStudent.count({ where: { classId: c.id } })) + names.length > 60) return { error: "Бір сыныпта 60-тан артық оқушы болмайды" };
  const r = await db.classStudent.createMany({ data: names.map((n) => ({ classId: c.id, name: n })), skipDuplicates: true });
  revalidatePath(`/classes/${c.id}`);
  return { ok: `${r.count} оқушы қосылды` };
}

export async function renameStudent(studentId: string, name: string): Promise<ClassState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Жүйеге кіріңіз" };
  const s = await db.classStudent.findFirst({ where: { id: idS.parse(studentId), classroom: { teacherId: user.id } } });
  if (!s) return { error: "Рұқсат жоқ" };
  const n = z.string().trim().min(2).max(60).safeParse(name);
  if (!n.success) return { error: "Аты-жөні тым қысқа" };
  try {
    await db.classStudent.update({ where: { id: s.id }, data: { name: n.data } });
  } catch {
    return { error: "Бұл есім сыныпта бар" };
  }
  revalidatePath(`/classes/${s.classId}`);
  return { ok: "Сақталды" };
}

export async function removeStudent(studentId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const s = await db.classStudent.findFirst({ where: { id: idS.parse(studentId), classroom: { teacherId: user.id } } });
  if (!s) return;
  await db.classStudent.delete({ where: { id: s.id } });
  revalidatePath(`/classes/${s.classId}`);
}

/** Сыныпқа ойын беру: сайттың дайын ойыны немесе мұғалімнің өз ойыны. */
export async function addGameToClass(classId: string, gameId: string): Promise<ClassState> {
  const user = await getCurrentUser();
  const c = await ownClass(classId);
  if (!user || !c) return { error: "Рұқсат жоқ" };
  const g = await db.game.findFirst({ where: { id: idS.parse(gameId), published: true, OR: [{ authorId: null }, { authorId: user.id }] }, select: { id: true } });
  if (!g) return { error: "Ойын табылмады" };
  if ((await db.classGame.count({ where: { classId: c.id } })) >= 100) return { error: "Бір сыныпқа 100-ден артық ойын беруге болмайды" };
  await db.classGame.upsert({ where: { classId_gameId: { classId: c.id, gameId: g.id } }, create: { classId: c.id, gameId: g.id }, update: {} });
  revalidatePath(`/classes/${c.id}`);
  return { ok: "Ойын сыныпқа берілді" };
}

export async function removeGameFromClass(classId: string, gameId: string) {
  const c = await ownClass(classId);
  if (!c) return;
  await db.classGame.deleteMany({ where: { classId: c.id, gameId: idS.parse(gameId) } });
  revalidatePath(`/classes/${c.id}`);
}

/** Журналға қолмен толтырылатын баған қосу (мысалы, «Үй жұмысы»). */
export async function addColumn(classId: string, title: string, max: number): Promise<ClassState> {
  const c = await ownClass(classId);
  if (!c) return { error: "Рұқсат жоқ" };
  const t = z.string().trim().min(1, "Баған атауын жазыңыз").max(40, "Атауы тым ұзын").safeParse(title);
  if (!t.success) return { error: t.error.issues[0].message };
  const m = z.coerce.number().int().min(1).max(100).safeParse(max);
  if (!m.success) return { error: "Ең көп балл 1-ден 100-ге дейін болуы керек" };
  if ((await db.classColumn.count({ where: { classId: c.id } })) >= 40) return { error: "Бағандар саны шегіне жетті (40)" };
  await db.classColumn.create({ data: { classId: c.id, title: t.data, maxScore: m.data } });
  revalidatePath(`/classes/${c.id}`);
  return { ok: "Баған қосылды" };
}

export async function removeColumn(columnId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const col = await db.classColumn.findFirst({ where: { id: idS.parse(columnId), classroom: { teacherId: user.id } } });
  if (!col) return;
  await db.classColumn.delete({ where: { id: col.id } });
  revalidatePath(`/classes/${col.classId}`);
}

/** Қолмен баға қою. score=null — бағаны өшіру. */
export async function setMark(columnId: string, studentId: string, score: number | null): Promise<{ error?: string; score?: number | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Жүйеге кіріңіз" };
  const col = await db.classColumn.findFirst({ where: { id: idS.parse(columnId), classroom: { teacherId: user.id } } });
  const st = col && (await db.classStudent.findFirst({ where: { id: idS.parse(studentId), classId: col.classId } }));
  if (!col || !st) return { error: "Рұқсат жоқ" };
  if (score === null || Number.isNaN(Number(score))) {
    await db.classMark.deleteMany({ where: { columnId: col.id, studentId: st.id } });
    revalidatePath(`/classes/${col.classId}`);
    return { score: null };
  }
  const v = Math.max(0, Math.min(col.maxScore, Math.round(Number(score))));
  await db.classMark.upsert({ where: { columnId_studentId: { columnId: col.id, studentId: st.id } }, create: { columnId: col.id, studentId: st.id, score: v }, update: { score: v } });
  revalidatePath(`/classes/${col.classId}`);
  return { score: v };
}
