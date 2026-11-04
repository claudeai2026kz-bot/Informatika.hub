import type { PrismaClient } from "@prisma/client";
import { readFile, mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomBytes } from "crypto";

/**
 * content/manifest.json ішіндегі файлдарды (әкімші жіберген материалдар) тиісті тақырыпқа қосады.
 * Бір файл екі рет қосылмайды (тақырып + түр + файл атауы бойынша тексеріледі).
 */
type Entry = { grade: number; quarter: number; topic: string; type: string; file?: string; url?: string; title?: string; replaces?: string };
type AEntry = { assessment: "BZHB" | "TZHB"; grade: number; quarter: number; title: string; description?: string; file: string; preview?: string; answersFile?: string; answers?: string; criteria?: string; descriptors?: string };

async function storeFile(rel: string) {
  const buf = await readFile(path.resolve("content", rel));
  const ext = path.extname(rel).slice(1).toLowerCase();
  const mime = MIME[ext] ?? "application/octet-stream";
  return { path: await store(buf, ext, mime), name: path.basename(rel), mime, size: buf.length };
}

async function importAssessment(db: PrismaClient, e: AEntry) {
  const quarter = await db.quarter.findFirst({ where: { gradeId: e.grade, number: e.quarter } });
  if (!quarter) return false;
  if (await db.assessment.findFirst({ where: { quarterId: quarter.id, kind: e.assessment, title: e.title } })) return false;
  const f = await storeFile(e.file);
  const pv = e.preview ? await storeFile(e.preview) : null;
  const ans = e.answersFile ? await storeFile(e.answersFile) : null;
  await db.assessment.create({
    data: {
      kind: e.assessment, title: e.title, description: e.description ?? "", gradeId: e.grade, quarterId: quarter.id,
      filePath: f.path, fileName: f.name, fileMime: f.mime, fileSize: f.size, previewPath: pv?.path,
      answersPath: ans?.path, answers: e.answers, criteria: e.criteria, descriptors: e.descriptors, published: true,
    },
  });
  return true;
}

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", doc: "application/msword", xls: "application/vnd.ms-excel",
  mp4: "video/mp4", zip: "application/zip", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
};
const LABEL: Record<string, string> = { PRESENTATION: "презентация", VIDEO: "бейнесабақ", PRACTICE: "тапсырма", KMZH: "ҚМЖ", GAME_LINK: "ойын", RESOURCE: "ресурс" };

function cloudConfig() {
  const url = process.env.SUPABASE_URL?.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
  const raw = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const parts = raw.split(".");
  if (parts.length === 3 && /[^A-Za-z0-9_-]/.test(parts[0])) parts[0] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
  const key = parts.map((x) => x.replace(/[^A-Za-z0-9_-]/g, "")).join(".");
  return url && key ? { url, key, bucket: process.env.SUPABASE_BUCKET?.trim() || "files" } : null;
}

async function store(buf: Buffer, ext: string, mime: string) {
  const rel = `materials/${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  const c = cloudConfig();
  if (c) {
    const r = await fetch(`${c.url}/storage/v1/object/${c.bucket}/${rel}`, {
      method: "POST", body: new Uint8Array(buf), headers: { Authorization: `Bearer ${c.key}`, apikey: c.key, "Content-Type": mime },
    });
    if (!r.ok) throw new Error(`Supabase upload ${r.status}: ${(await r.text()).slice(0, 200)}`);
  } else {
    const root = path.resolve(process.env.STORAGE_DIR ?? "./storage");
    await mkdir(path.join(root, "materials"), { recursive: true });
    await writeFile(path.join(root, rel), buf);
  }
  return rel;
}

export async function importContent(db: PrismaClient) {
  const manifest = path.resolve("content/manifest.json");
  if (!existsSync(manifest)) return;
  const all = JSON.parse(await readFile(manifest, "utf8")) as (Entry | AEntry)[];
  let added = 0;
  for (const a of all) {
    if (!("assessment" in a)) continue;
    try { if (await importAssessment(db, a)) added++; } catch (err) { console.error(`Импорт қатесі (${a.file}):`, err); }
  }
  const entries = all.filter((x): x is Entry => !("assessment" in x));
  for (const e of entries) {
    const topic = await db.topic.findFirst({ where: { title: e.topic, quarter: { gradeId: e.grade, number: e.quarter } }, include: { quarter: true } });
    if (!topic) { console.log(`Тақырып табылмады: ${e.grade}-${e.quarter} ${e.topic}`); continue; }
    const type = await db.materialType.findUnique({ where: { key: e.type } });
    if (!type) { console.log(`Түр табылмады: ${e.type}`); continue; }
    if (e.url) {
      if (e.replaces) await db.material.deleteMany({ where: { topicId: topic.id, typeId: type.id, externalUrl: e.replaces } });
      if (await db.material.findFirst({ where: { topicId: topic.id, typeId: type.id, externalUrl: e.url } })) continue;
      await db.material.create({
        data: {
          title: e.title ?? `${topic.title}: ${LABEL[e.type] ?? e.type}`,
          typeId: type.id, gradeId: e.grade, quarterId: topic.quarterId, topicId: topic.id,
          externalUrl: e.url, published: true,
        },
      });
      added++;
      continue;
    }
    if (!e.file) continue;
    const fileName = path.basename(e.file);
    if (await db.material.findFirst({ where: { topicId: topic.id, typeId: type.id, fileName } })) continue;
    try {
    const buf = await readFile(path.resolve("content", e.file!));
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const mime = MIME[ext] ?? "application/octet-stream";
    const filePath = await store(buf, ext, mime);
    await db.material.create({
      data: {
        title: e.title ?? `${topic.title}: ${LABEL[e.type] ?? e.type}`,
        typeId: type.id, gradeId: e.grade, quarterId: topic.quarterId, topicId: topic.id,
        filePath, fileName, fileMime: mime, fileSize: buf.length, published: true,
      },
    });
    added++;
    } catch (err) {
      // Импорт қатесі сайттың жаңаруын тоқтатпауы керек.
      console.error(`Импорт қатесі (${e.file}):`, err);
    }
  }
  console.log(`Мазмұн импорты: ${added} жаңа материал қосылды.`);
}
