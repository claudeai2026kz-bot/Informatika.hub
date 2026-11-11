import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import HostLive from "@/components/games/live/HostLive";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getT())("Сынып жарысы") };
}

export default async function HostPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireUser(`/games/live/${code}`);
  const s = await db.liveSession.findUnique({ where: { code }, select: { hostId: true, gameId: true } });
  if (!s || s.hostId !== user.id) notFound();
  return <div className="max-w-5xl mx-auto"><HostLive code={code} gameId={s.gameId} /></div>;
}
