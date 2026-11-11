import AppNav from "@/components/AppNav";
import Footer from "@/components/Footer";
import Assistant from "@/components/assistant/Assistant";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unread = user ? await db.notification.count({ where: { userId: user.id, read: false } }) : 0;
  return (
    <>
      <AppNav user={user && { name: user.name, role: user.role, avatar: user.avatarPath ? `/api/files/avatar/${user.id}` : null }} unread={unread} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 pb-28 lg:pb-8 page-enter">{children}</main>
      <Footer />
      <Assistant soundOn={user?.soundOn ?? true} accountVoice={user ? user.voiceOn : undefined} />
    </>
  );
}
