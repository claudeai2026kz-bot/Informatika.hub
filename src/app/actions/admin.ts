"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { GameType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth";
import { DOC_EXTS, UploadError, removeStored, saveUpload } from "@/lib/storage";

export type AdminState = { error?: string; ok?: string } | undefined;

const log = (actorId: string, action: string, target?: string) => db.activityLog.create({ data: { actorId, action, target } });
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optUrl = z.string().trim().url("Сілтеме дұрыс емес").max(500).optional().or(z.literal("").transform(() => undefined));

async function fileFrom(fd: FormData, key: string, folder: string, exts = DOC_EXTS) {
  const f = fd.get(key);
  if (!(f instanceof File) || f.size === 0) return null;
  return saveUpload(f, folder, exts);
}

async function notifyAll(title: string, body: string, link: string) {
  const users = await db.user.findMany({ where: { notifyOn: true, blocked: false }, select: { id: true } });
  if (users.length) await db.notification.createMany({ data: users.map((u) => ({ userId: u.id, title, body, link })) });
}

async function quarterId(gradeId: number, number: number) {
  const q = await db.quarter.findUnique({ where: { gradeId_number: { gradeId, number } } });
  if (!q) throw new UploadError("Сынып немесе тоқсан табылмады");
  return q.id;
}

/* ================= Пайдаланушылар ================= */

export async function setUserRole(userId: string, roleKey: "USER" | "ADMIN") {
  const admin = await assertAdmin();
  if (userId === admin.id) return { error: "Өз рөліңізді өзгерте алмайсыз" };
  const role = await db.role.findUniqueOrThrow({ where: { key: z.enum(["USER", "ADMIN"]).parse(roleKey) } });
  await db.user.update({ where: { id: userId }, data: { roleId: role.id } });
  await log(admin.id, `Рөл өзгертілді: ${role.name}`, userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserBlocked(userId: string, blocked: boolean) {
  const admin = await assertAdmin();
  if (userId === admin.id) return { error: "Өз аккаунтыңызды бұғаттай алмайсыз" };
  await db.user.update({ where: { id: userId }, data: { blocked } });
  if (blocked) await db.session.deleteMany({ where: { userId } });
  await log(admin.id, blocked ? "Пайдаланушы бұғатталды" : "Бұғат алынды", userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

/* ================= Тақырыптар ================= */

const topicSchema = z.object({
  grade: z.coerce.number().int().min(5).max(11),
  quarter: z.coerce.number().int().min(1).max(4),
  section: z.string().trim().max(120).optional(),
  title: z.string().trim().min(2, "Тақырып атауы тым қысқа").max(200),
  order: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveTopic(_: AdminState, fd: FormData): Promise<AdminState> {
  const admin = await assertAdmin();
  const p = topicSchema.safeParse({ grade: fd.get("grade"), quarter: fd.get("quarter"), section: str(fd, "section") || undefined, title: fd.get("title"), order: fd.get("order") || 0 });
  if (!p.success) return { error: p.error.issues[0].message };
  const qid = await quarterId(p.data.grade, p.data.quarter);
  const id = Number(fd.get("id")) || null;
  const data = { quarterId: qid, section: p.data.section ?? null, title: p.data.title, order: p.data.order };
  if (id) await db.topic.update({ where: { id }, data });
  else await db.topic.create({ data });
  await log(admin.id, id ? "Тақырып өңделді" : "Тақырып қосылды", p.data.title);
  revalidatePath("/admin/topics");
  return { ok: id ? "Тақырып сақталды" : "Тақырып қосылды" };
}

export async function deleteTopic(id: number) {
  const admin = await assertAdmin();
  const t = await db.topic.delete({ where: { id } });
  await log(admin.id, "Тақырып жойылды", t.title);
  revalidatePath("/admin/topics");
}

/* ================= Материалдар ================= */

const materialSchema = z.object({
  title: z.string().trim().min(3, "Атауы кемінде 3 таңба").max(200),
  description: z.string().trim().max(3000).default(""),
  typeKey: z.enum(["PRESENTATION", "VIDEO", "PRACTICE", "KMZH", "RESOURCE", "INTERACTIVE", "GAME_LINK"], { message: "Материал түрін таңдаңыз" }),
  grade: z.coerce.number().int().min(5, "Сыныпты таңдаңыз").max(11),
  quarter: z.coerce.number().int().min(1, "Тоқсанды таңдаңыз").max(4),
  topicId: z.coerce.number().int().positive().optional(),
  videoUrl: optUrl,
  externalUrl: optUrl,
  published: z.boolean(),
});

export async function saveMaterial(_: AdminState, fd: FormData): Promise<AdminState> {
  const admin = await assertAdmin();
  const id = str(fd, "id") || null;
  const p = materialSchema.safeParse({
    title: fd.get("title"), description: str(fd, "description"), typeKey: fd.get("typeKey"),
    grade: fd.get("grade"), quarter: fd.get("quarter"), topicId: Number(fd.get("topicId")) || undefined,
    videoUrl: str(fd, "videoUrl"), externalUrl: str(fd, "externalUrl"), published: fd.get("published") === "on",
  });
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  const existing = id ? await db.material.findUnique({ where: { id } }) : null;
  if (id && !existing) return { error: "Материал табылмады" };

  let file, preview;
  try {
    file = await fileFrom(fd, "file", "materials");
    preview = await fileFrom(fd, "preview", "previews", ["pdf"]);
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : "Файлды сақтау мүмкін болмады" };
  }
  if (!file && !existing?.filePath && !d.videoUrl && !d.externalUrl) return { error: "Файл жүктеңіз немесе видео/сыртқы сілтеме көрсетіңіз" };

  const type = await db.materialType.findUniqueOrThrow({ where: { key: d.typeKey } });
  const qid = await quarterId(d.grade, d.quarter);
  if (d.topicId) {
    const t = await db.topic.findUnique({ where: { id: d.topicId } });
    if (!t || t.quarterId !== qid) return { error: "Тақырып таңдалған сынып пен тоқсанға сәйкес келмейді" };
  }
  const data: Prisma.MaterialUncheckedCreateInput = {
    title: d.title, description: d.description, typeId: type.id, gradeId: d.grade, quarterId: qid, topicId: d.topicId ?? null,
    videoUrl: d.videoUrl ?? null, externalUrl: d.externalUrl ?? null, published: d.published,
    ...(file && { filePath: file.path, fileName: file.name, fileMime: file.mime, fileSize: file.size }),
    ...(preview && { previewPath: preview.path }),
  };
  if (fd.get("removePreview") === "on" && !preview) data.previewPath = null;

  let savedId = id;
  if (existing) {
    await db.material.update({ where: { id: existing.id }, data });
    if (file) await removeStored(existing.filePath);
    if (preview || data.previewPath === null) await removeStored(existing.previewPath);
  } else {
    savedId = (await db.material.create({ data: { ...data, authorId: admin.id } })).id;
  }
  if (d.published && !existing?.published) await notifyAll("Жаңа материал қосылды", `${d.grade}-сынып: ${d.title}`, `/materials/${savedId}`);
  await log(admin.id, existing ? "Материал өңделді" : "Материал қосылды", d.title);
  revalidatePath("/admin/materials");
  const back = str(fd, "back");
  if (back.startsWith("/topics/")) { revalidatePath(back); redirect(`${back}?saved=1`); }
  redirect(`/admin/materials?saved=1`);
}

export async function toggleMaterialPublished(id: string) {
  const admin = await assertAdmin();
  const m = await db.material.findUniqueOrThrow({ where: { id } });
  await db.material.update({ where: { id }, data: { published: !m.published } });
  if (!m.published) await notifyAll("Жаңа материал қосылды", `${m.gradeId}-сынып: ${m.title}`, `/materials/${id}`);
  await log(admin.id, m.published ? "Материал жариялаудан алынды" : "Материал жарияланды", m.title);
  revalidatePath("/admin/materials");
}

export async function deleteMaterial(id: string) {
  const admin = await assertAdmin();
  const m = await db.material.delete({ where: { id } });
  await Promise.all([removeStored(m.filePath), removeStored(m.previewPath)]);
  await log(admin.id, "Материал жойылды", m.title);
  revalidatePath("/admin/materials");
  if (m.topicId) revalidatePath(`/topics/${m.topicId}`);
}

/* ================= БЖБ / ТЖБ ================= */

const assessmentSchema = z.object({
  kind: z.enum(["BZHB", "TZHB"], { message: "БЖБ не ТЖБ таңдаңыз" }),
  title: z.string().trim().min(3, "Атауы кемінде 3 таңба").max(200),
  description: z.string().trim().max(3000).default(""),
  grade: z.coerce.number().int().min(5, "Сыныпты таңдаңыз").max(11),
  quarter: z.coerce.number().int().min(1, "Тоқсанды таңдаңыз").max(4),
  topicId: z.coerce.number().int().positive().optional(),
  variant: z.string().trim().min(1).max(40).default("1-нұсқа"),
  answers: z.string().trim().max(10000).optional(),
  criteria: z.string().trim().max(10000).optional(),
  descriptors: z.string().trim().max(10000).optional(),
  published: z.boolean(),
});

export async function saveAssessment(_: AdminState, fd: FormData): Promise<AdminState> {
  const admin = await assertAdmin();
  const id = str(fd, "id") || null;
  const p = assessmentSchema.safeParse({
    kind: fd.get("kind"), title: fd.get("title"), description: str(fd, "description"), grade: fd.get("grade"), quarter: fd.get("quarter"),
    topicId: Number(fd.get("topicId")) || undefined, variant: str(fd, "variant") || "1-нұсқа",
    answers: str(fd, "answers") || undefined, criteria: str(fd, "criteria") || undefined, descriptors: str(fd, "descriptors") || undefined,
    published: fd.get("published") === "on",
  });
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  const existing = id ? await db.assessment.findUnique({ where: { id } }) : null;
  let file, preview, answersFile;
  try {
    file = await fileFrom(fd, "file", "assessments");
    preview = await fileFrom(fd, "preview", "previews", ["pdf"]);
    answersFile = await fileFrom(fd, "answersFile", "assessments");
  } catch (e) {
    return { error: e instanceof UploadError ? e.message : "Файлды сақтау мүмкін болмады" };
  }
  if (!file && !existing?.filePath) return { error: "Тапсырма файлын жүктеңіз" };
  const qid = await quarterId(d.grade, d.quarter);
  const data: Prisma.AssessmentUncheckedCreateInput = {
    kind: d.kind, title: d.title, description: d.description, gradeId: d.grade, quarterId: qid, topicId: d.topicId ?? null, variant: d.variant,
    answers: d.answers ?? null, criteria: d.criteria ?? null, descriptors: d.descriptors ?? null, published: d.published,
    ...(file && { filePath: file.path, fileName: file.name, fileMime: file.mime, fileSize: file.size }),
    ...(preview && { previewPath: preview.path }),
    ...(answersFile && { answersPath: answersFile.path }),
  };
  if (existing) {
    await db.assessment.update({ where: { id: existing.id }, data });
    if (file) await removeStored(existing.filePath);
    if (preview) await removeStored(existing.previewPath);
    if (answersFile) await removeStored(existing.answersPath);
  } else {
    const a = await db.assessment.create({ data });
    if (d.published) await notifyAll(`Жаңа ${d.kind === "BZHB" ? "БЖБ" : "ТЖБ"} қосылды`, `${d.grade}-сынып: ${d.title}`, `/assessments/${a.id}`);
  }
  await log(admin.id, existing ? "БЖБ/ТЖБ өңделді" : "БЖБ/ТЖБ қосылды", d.title);
  revalidatePath("/admin/assessments");
  redirect("/admin/assessments?saved=1");
}

export async function deleteAssessment(id: string) {
  const admin = await assertAdmin();
  const a = await db.assessment.delete({ where: { id } });
  await Promise.all([removeStored(a.filePath), removeStored(a.previewPath), removeStored(a.answersPath)]);
  await log(admin.id, "БЖБ/ТЖБ жойылды", a.title);
  revalidatePath("/admin/assessments");
}

/* ================= Ойындар ================= */

const gameSchema = z.object({
  type: z.enum(["QUIZ", "MATCHING", "CROSSWORD", "RAPID", "LOGIC", "CODING"]),
  title: z.string().trim().min(3, "Атауы кемінде 3 таңба").max(200),
  description: z.string().trim().max(1000).default(""),
  grade: z.coerce.number().int().min(5).max(11),
  topicId: z.number().int().positive().optional(),
  timeLimit: z.number().int().min(3).max(120).optional(),
  published: z.boolean(),
  questions: z.array(z.object({
    prompt: z.string().trim().min(1, "Сұрақ мәтіні бос").max(1000),
    data: z.record(z.unknown()).default({}),
    answer: z.unknown(),
    explanation: z.string().trim().max(1000).optional(),
    points: z.number().int().min(1).max(100).default(1),
  })).min(1, "Кемінде бір сұрақ қосыңыз").max(200),
});

function validateQuestion(type: GameType, q: z.infer<typeof gameSchema>["questions"][number], n: number): string | null {
  const at = `${n + 1}-сұрақ: `;
  if (type === "QUIZ" || type === "RAPID") {
    const opts = q.data.options as unknown;
    if (!Array.isArray(opts) || opts.length < 2 || opts.some((o) => typeof o !== "string" || !o.trim())) return at + "кемінде 2 жауап нұсқасын толтырыңыз";
    if (!Number.isInteger(q.answer) || (q.answer as number) < 0 || (q.answer as number) >= opts.length) return at + "дұрыс жауапты белгілеңіз";
  } else if (type === "MATCHING") {
    const l = q.data.left as unknown, r = q.data.right as unknown;
    if (!Array.isArray(l) || !Array.isArray(r) || l.length < 2 || l.length !== r.length || [...l, ...r].some((x) => typeof x !== "string" || !x.trim())) return at + "кемінде 2 толық жұп енгізіңіз";
  } else if (type === "CROSSWORD") {
    const d = q.data as { row?: number; col?: number; dir?: string };
    const word = String(q.answer ?? "").trim();
    if (!word || /\s/.test(word)) return at + "жауап бос орынсыз бір сөз болуы керек";
    if (!Number.isInteger(d.row) || !Number.isInteger(d.col) || d.row! < 0 || d.col! < 0 || d.row! > 30 || d.col! > 30) return at + "жол мен бағанды көрсетіңіз (0–30)";
    if (d.dir !== "across" && d.dir !== "down") return at + "бағытын таңдаңыз";
  } else {
    const a = q.answer;
    if (!Array.isArray(a) || a.length === 0 || a.some((x) => typeof x !== "string" || !x.trim())) return at + "кемінде бір дұрыс жауап жазыңыз";
  }
  return null;
}

/** Сөзжұмбақ сөздерінің қиылысатын әріптері сәйкес келетінін тексереді. */
function checkCrossword(qs: { data: Record<string, unknown>; answer: unknown }[]) {
  const grid = new Map<string, string>();
  for (const [n, q] of qs.entries()) {
    const w = String(q.answer).toUpperCase();
    const { row, col, dir } = q.data as { row: number; col: number; dir: string };
    for (let k = 0; k < w.length; k++) {
      const key = dir === "down" ? `${row + k}:${col}` : `${row}:${col + k}`;
      const prev = grid.get(key);
      if (prev && prev !== w[k]) return `${n + 1}-сөз басқа сөзбен қиылысатын жерде әріптері сәйкес келмейді`;
      grid.set(key, w[k]);
    }
  }
  return null;
}

export async function saveGame(payload: unknown, id?: string): Promise<AdminState> {
  const admin = await assertAdmin();
  const p = gameSchema.safeParse(payload);
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;
  for (const [n, q] of d.questions.entries()) {
    const err = validateQuestion(d.type, q, n);
    if (err) return { error: err };
  }
  const questions = d.questions.map((q, order) => {
    let data = q.data, answer = q.answer;
    if (d.type === "MATCHING") answer = (q.data.left as string[]).map((_, i) => i);
    if (d.type === "CROSSWORD") { answer = String(q.answer).trim().toUpperCase(); data = { ...q.data, len: (answer as string).length }; }
    if (d.type === "LOGIC" || d.type === "CODING") answer = (q.answer as string[]).map((s) => s.trim());
    return { order, prompt: q.prompt, data: data as Prisma.InputJsonValue, answer: answer as Prisma.InputJsonValue, explanation: q.explanation || null, points: d.type === "MATCHING" ? (q.data.left as string[]).length : q.points };
  });
  if (d.type === "CROSSWORD") {
    const err = checkCrossword(questions.map((q) => ({ data: q.data as Record<string, unknown>, answer: q.answer })));
    if (err) return { error: err };
  }
  const base = { type: d.type, title: d.title, description: d.description, gradeId: d.grade, topicId: d.topicId ?? null, timeLimit: d.type === "RAPID" ? d.timeLimit ?? 10 : null, published: d.published };
  if (id) {
    await db.$transaction([
      db.game.update({ where: { id }, data: base }),
      db.gameQuestion.deleteMany({ where: { gameId: id } }),
      db.gameQuestion.createMany({ data: questions.map((q) => ({ ...q, gameId: id })) }),
    ]);
  } else {
    const g = await db.game.create({ data: { ...base, questions: { create: questions } } });
    if (d.published) await notifyAll("Жаңа ойын қосылды", d.title, `/games/${g.id}`);
  }
  await log(admin.id, id ? "Ойын өңделді" : "Ойын қосылды", d.title);
  revalidatePath("/admin/games");
  return { ok: "Ойын сақталды" };
}

export async function deleteGame(id: string) {
  const admin = await assertAdmin();
  const g = await db.game.delete({ where: { id } });
  await log(admin.id, "Ойын жойылды", g.title);
  revalidatePath("/admin/games");
}

/* ================= Пікірлер ================= */

export async function setCommentHidden(id: string, hidden: boolean) {
  const admin = await assertAdmin();
  await db.comment.update({ where: { id }, data: { hidden } });
  await log(admin.id, hidden ? "Пікір жасырылды" : "Пікір қайта көрсетілді", id);
  revalidatePath("/admin/comments");
}

export async function deleteComment(id: string) {
  const admin = await assertAdmin();
  await db.comment.delete({ where: { id } });
  await log(admin.id, "Пікір жойылды", id);
  revalidatePath("/admin/comments");
}
