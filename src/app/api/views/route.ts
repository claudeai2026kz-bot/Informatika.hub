import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const body = z.object({ kind: z.enum(["material", "assessment"]), id: z.string().cuid() });

/** Қаралымды санау беттің рендерінен бөлек жасалады (prefetch санауға кірмейді). */
export async function POST(req: Request) {
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { kind, id } = p.data;
  const user = await getCurrentUser();
  const key = kind === "material" ? { materialId: id } : { assessmentId: id };
  if (user) {
    const recent = await db.userHistory.findFirst({ where: { userId: user.id, action: "VIEW", ...key, createdAt: { gt: new Date(Date.now() - 3600e3) } } });
    if (recent) return NextResponse.json({ ok: true });
  }
  try {
    if (kind === "material") await db.material.update({ where: { id, published: true }, data: { views: { increment: 1 } } });
    else await db.assessment.update({ where: { id, published: true }, data: { views: { increment: 1 } } });
    if (user) await db.userHistory.create({ data: { userId: user.id, action: "VIEW", ...key } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
