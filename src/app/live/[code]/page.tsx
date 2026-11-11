import Logo from "@/components/Logo";
import PlayerLive from "@/components/games/live/PlayerLive";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getT())("Сынып жарысы"), robots: { index: false } };
}

export default async function LivePlayerPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <div className="min-h-screen bg-gradient-to-b from-lilac-50 via-white to-sky-50 px-4 py-5">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex justify-center"><Logo /></div>
        <PlayerLive code={code.replace(/\D/g, "").slice(0, 6)} />
      </div>
    </div>
  );
}
