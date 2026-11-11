import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { loadSession, stateFor } from "@/lib/live";

export const dynamic = "force-dynamic";

/** Тірі ойынның күйі (экрандар 1–2 секунд сайын сұрайды). */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(req.url);
  const s = await loadSession(code);
  if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });
  let host = false;
  if (url.searchParams.get("host")) { const u = await getCurrentUser(); host = !!u && u.id === s.hostId; }
  const res = NextResponse.json(stateFor(s, url.searchParams.get("p"), host));
  res.headers.set("Cache-Control", "no-store");
  return res;
}
