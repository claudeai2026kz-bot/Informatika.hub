import "server-only";
import { mkdir, writeFile, readFile, unlink, stat } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

/**
 * Файл сақтау.
 *  - SUPABASE_URL және SUPABASE_SERVICE_ROLE_KEY берілсе: Supabase Storage (жабық bucket).
 *  - Әйтпесе: жергілікті диск (STORAGE_DIR).
 */
const ROOT = path.resolve(process.env.STORAGE_DIR ?? "./storage");
const SB_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET ?? "files";
export const cloud = !!(SB_URL && SB_KEY);

async function sb(pathname: string, init: RequestInit = {}) {
  const res = await fetch(`${SB_URL}/storage/v1/${pathname}`, {
    ...init,
    headers: { Authorization: `Bearer ${SB_KEY}`, apikey: SB_KEY!, ...(init.headers ?? {}) },
    cache: "no-store",
  });
  return res;
}
const objPath = (rel: string) => rel.split("/").map(encodeURIComponent).join("/");

export const MAX_FILE_MB = 50;

type Kind = { ext: string; mime: string; check: (b: Buffer) => boolean };
const zip = (b: Buffer) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
const ole = (b: Buffer) => b.length > 8 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;
const KINDS: Kind[] = [
  { ext: "ppt", mime: "application/vnd.ms-powerpoint", check: ole },
  { ext: "doc", mime: "application/msword", check: ole },
  { ext: "xls", mime: "application/vnd.ms-excel", check: ole },
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

export const DOC_EXTS = ["pdf", "pptx", "ppt", "docx", "doc", "xlsx", "xls", "zip", "png", "jpg", "jpeg", "webp", "mp4"];
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

  const rel = newPath(folder, ext);
  if (cloud) {
    const r = await sb(`object/${BUCKET}/${objPath(rel)}`, { method: "POST", body: buf, headers: { "Content-Type": kind.mime } });
    if (!r.ok) throw new UploadError("Файлды бұлтқа сақтау мүмкін болмады");
  } else {
    await mkdir(path.dirname(path.join(ROOT, rel)), { recursive: true });
    await writeFile(path.join(ROOT, rel), buf);
  }
  return { path: rel, name: cleanName(file.name), mime: kind.mime, size: file.size };
}

const cleanName = (n: string) => path.basename(n).replace(/[\u0000-\u001f"\\/]/g, "_").slice(0, 150);
function newPath(folder: string, ext: string) {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "") || "files";
  return path.posix.join(safeFolder, `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`);
}
const UPLOADED = /^uploads\/\d+-[0-9a-f]{16}\.([a-z0-9]+)$/;

/**
 * Үлкен файлдар үшін: браузер файлды тікелей Supabase-ке жүктейтін бір реттік сілтеме.
 * (Хостингте сервер арқылы өтетін сұраныс көлемі шектеулі.) Бұлт қосылмаса null қайтарады.
 */
export async function signDirectUpload(fileName: string, size: number, allowed: string[] = DOC_EXTS, maxMb = MAX_FILE_MB) {
  if (!cloud) return null;
  if (size > maxMb * 1024 * 1024) throw new UploadError(`Файл көлемі ${maxMb} МБ-тан аспауы керек`);
  const ext = path.extname(fileName).slice(1).toLowerCase();
  if (!KINDS.some((k) => k.ext === ext) || !allowed.includes(ext)) throw new UploadError(`Бұл файл түріне рұқсат жоқ. Рұқсат етілгені: ${allowed.join(", ")}`);
  const rel = newPath("uploads", ext);
  const r = await sb(`object/upload/sign/${BUCKET}/${objPath(rel)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  if (!r.ok) throw new UploadError("Жүктеу сілтемесін алу мүмкін болмады");
  const { url } = (await r.json()) as { url: string };
  return { path: rel, url: `${SB_URL}/storage/v1${url}` };
}

/** Браузер тікелей жүктеген файлды тексеріп қабылдайды (кеңейтімі, көлемі, ішкі қолтаңбасы). */
export async function adoptDirectUpload(raw: string, allowed: string[] = DOC_EXTS, maxMb = MAX_FILE_MB) {
  let info: { path?: string; name?: string };
  try { info = JSON.parse(raw); } catch { throw new UploadError("Файл деректері дұрыс емес"); }
  const m = cloud && typeof info.path === "string" ? UPLOADED.exec(info.path) : null;
  const kind = m && KINDS.find((k) => k.ext === m[1]);
  if (!m || !kind || !allowed.includes(kind.ext)) throw new UploadError("Бұл файл түріне рұқсат жоқ");
  const rel = info.path!;
  const r = await sb(`object/authenticated/${BUCKET}/${objPath(rel)}`, { headers: { Range: "bytes=0-15" } });
  if (!r.ok && r.status !== 206) throw new UploadError("Жүктелген файл табылмады");
  const head = Buffer.from(await r.arrayBuffer()).subarray(0, 16);
  const size = Number(r.headers.get("content-range")?.split("/")[1] ?? r.headers.get("content-length") ?? 0);
  if (!kind.check(head) || size <= 0 || size > maxMb * 1024 * 1024) {
    await removeStored(rel);
    throw new UploadError(size > maxMb * 1024 * 1024 ? `Файл көлемі ${maxMb} МБ-тан аспауы керек` : "Файлдың мазмұны оның кеңейтіміне сәйкес келмейді");
  }
  return { path: rel, name: cleanName(String(info.name ?? `file.${kind.ext}`)), mime: kind.mime, size };
}

/** Бұлтта: файлға қысқа мерзімді сілтеме (жүктеуге 60 с, қарауға 1 сағ). */
export async function signedDownloadUrl(rel: string, downloadName?: string) {
  const r = await sb(`object/sign/${BUCKET}/${objPath(rel)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: downloadName ? 60 : 3600 }) });
  if (!r.ok) return null;
  const { signedURL } = (await r.json()) as { signedURL: string };
  const u = new URL(`${SB_URL}/storage/v1${signedURL}`);
  if (downloadName) u.searchParams.set("download", downloadName);
  return u.toString();
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
  if (cloud) {
    await sb(`object/${BUCKET}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [rel] }) }).catch(() => null);
    return;
  }
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
