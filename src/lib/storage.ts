import "server-only";
import { mkdir, writeFile, readFile, unlink, stat } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

/**
 * Файл сақтау. Қазір жергілікті дискіде (STORAGE_DIR) сақталады.
 * Хостингке шығарғанда осы модульді S3 / Supabase Storage нұсқасына ауыстыру жеткілікті.
 */
const ROOT = path.resolve(process.env.STORAGE_DIR ?? "./storage");

export const MAX_FILE_MB = 50;

type Kind = { ext: string; mime: string; check: (b: Buffer) => boolean };
const zip = (b: Buffer) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
const KINDS: Kind[] = [
  { ext: "pdf", mime: "application/pdf", check: (b) => b.subarray(0, 5).toString() === "%PDF-" },
  { ext: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", check: zip },
  { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", check: zip },
  { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", check: zip },
  { ext: "zip", mime: "application/zip", check: zip },
  { ext: "png", mime: "image/png", check: (b) => b[0] === 0x89 && b.subarray(1, 4).toString() === "PNG" },
  { ext: "jpg", mime: "image/jpeg", check: (b) => b[0] === 0xff && b[1] === 0xd8 },
  { ext: "jpeg", mime: "image/jpeg", check: (b) => b[0] === 0xff && b[1] === 0xd8 },
  { ext: "webp", mime: "image/webp", check: (b) => b.subarray(8, 12).toString() === "WEBP" },
  { ext: "mp4", mime: "video/mp4", check: (b) => b.subarray(4, 8).toString() === "ftyp" },
];

export const DOC_EXTS = ["pdf", "pptx", "docx", "xlsx", "zip", "png", "jpg", "jpeg", "webp", "mp4"];
export const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp"];

export class UploadError extends Error {}

/** Файлдың кеңейтімін, көлемін және ішкі қолтаңбасын (magic bytes) тексеріп сақтайды. */
export async function saveUpload(file: File, folder: string, allowed: string[] = DOC_EXTS, maxMb = MAX_FILE_MB) {
  if (!file || file.size === 0) throw new UploadError("Файл таңдалмаған");
  if (file.size > maxMb * 1024 * 1024) throw new UploadError(`Файл көлемі ${maxMb} МБ-тан аспауы керек`);
  const ext = path.extname(file.name).slice(1).toLowerCase();
  const kind = KINDS.find((k) => k.ext === ext);
  if (!kind || !allowed.includes(ext)) throw new UploadError(`Бұл файл түріне рұқсат жоқ. Рұқсат етілгені: ${allowed.join(", ")}`);
  const buf = Buffer.from(await file.arrayBuffer());
  if (!kind.check(buf)) throw new UploadError("Файлдың мазмұны оның кеңейтіміне сәйкес келмейді");

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "");
  const name = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  const rel = path.posix.join(safeFolder, name);
  await mkdir(path.join(ROOT, safeFolder), { recursive: true });
  await writeFile(path.join(ROOT, rel), buf);
  const original = path.basename(file.name).replace(/[\u0000-\u001f"\\/]/g, "_").slice(0, 150);
  return { path: rel, name: original, mime: kind.mime, size: file.size };
}

function resolveSafe(rel: string) {
  const full = path.resolve(ROOT, rel);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("Рұқсат етілмеген жол");
  return full;
}

export async function readStored(rel: string) {
  const full = resolveSafe(rel);
  const [data, st] = await Promise.all([readFile(full), stat(full)]);
  return { data, size: st.size };
}

export async function removeStored(rel?: string | null) {
  if (!rel) return;
  try {
    await unlink(resolveSafe(rel));
  } catch {
    /* файл жоқ болса, елемейміз */
  }
}

export function mimeFor(rel: string) {
  const ext = path.extname(rel).slice(1).toLowerCase();
  return KINDS.find((k) => k.ext === ext)?.mime ?? "application/octet-stream";
}
