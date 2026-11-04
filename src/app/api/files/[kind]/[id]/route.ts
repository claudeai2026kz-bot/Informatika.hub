import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { cloud, mimeFor, readStored, signedDownloadUrl } from "@/lib/storage";

function contentDisposition(type: "inline" | "attachment", name: string) {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/**
 * Файл беру:
 *  /api/files/material/:id          — сайт ішінде қарау (PDF/алдын ала қарау нұсқасы)
 *  /api/files/material/:id?dl=1     — түпнұсқаны жүктеу (тек жүйеге кірген пайдаланушы)
 *  /api/files/assessment/:id[?dl=1|&part=answers]
 *  /api/files/avatar/:userId
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const dl = req.nextUrl.searchParams.get("dl") === "1";
  const part = req.nextUrl.searchParams.get("part");
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  let path: string | null | undefined;
  let name = "file";
  let onDownload: (() => Promise<unknown>) | null = null;

  if (kind === "avatar") {
    const u = await db.user.findUnique({ where: { id }, select: { avatarPath: true } });
    path = u?.avatarPath;
    name = "avatar";
  } else if (kind === "material") {
    const m = await db.material.findUnique({ where: { id } });
    if (!m || (!m.published && !isAdmin)) return new NextResponse("Табылмады", { status: 404 });
    if (dl) {
      path = m.filePath;
      name = m.fileName ?? "material";
      if (user) onDownload = () => db.$transaction([
        db.material.update({ where: { id }, data: { downloads: { increment: 1 } } }),
        db.userHistory.create({ data: { userId: user.id, action: "DOWNLOAD", materialId: id } }),
      ]);
    } else {
      path = m.previewPath ?? (m.fileMime === "application/pdf" || m.fileMime?.startsWith("image/") || m.fileMime === "video/mp4" ? m.filePath : null);
      name = m.fileName ?? "material";
    }
  } else if (kind === "assessment") {
    const a = await db.assessment.findUnique({ where: { id } });
    if (!a || (!a.published && !isAdmin)) return new NextResponse("Табылмады", { status: 404 });
    if (part === "answers") {
      if (!user) return new NextResponse("Жүйеге кіріңіз", { status: 401 });
      path = a.answersPath;
      name = `Жауаптар - ${a.fileName ?? "БЖБ"}`;
    } else if (dl) {
      path = a.filePath;
      name = a.fileName ?? "assessment";
      if (user) onDownload = () => db.$transaction([
        db.assessment.update({ where: { id }, data: { downloads: { increment: 1 } } }),
        db.userHistory.create({ data: { userId: user.id, action: "DOWNLOAD", assessmentId: id } }),
      ]);
    } else {
      path = a.previewPath ?? (a.fileMime === "application/pdf" ? a.filePath : null);
      name = a.fileName ?? "assessment";
    }
  } else {
    return new NextResponse("Табылмады", { status: 404 });
  }

  if (dl && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(req.headers.get("referer") ? new URL(req.headers.get("referer")!).pathname : "/materials")}`;
    return NextResponse.redirect(url);
  }
  if (!path) return new NextResponse("Файл жоқ", { status: 404 });

  if (cloud) {
    const url = await signedDownloadUrl(path, dl || part === "answers" ? name : undefined);
    if (!url) return new NextResponse("Файл табылмады", { status: 404 });
    await onDownload?.();
    return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const { data, size } = await readStored(path);
    await onDownload?.();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeFor(path),
        "Content-Length": String(size),
        "Content-Disposition": contentDisposition(dl || part === "answers" ? "attachment" : "inline", name),
        "Cache-Control": kind === "avatar" ? "private, max-age=300" : "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Файл табылмады", { status: 404 });
  }
}
