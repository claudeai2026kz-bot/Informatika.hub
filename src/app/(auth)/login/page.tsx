import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Жүйеге кіру" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <AuthShell title="Жүйеге кіру 👋" subtitle="Жалғастыру үшін аккаунтыңызға кіріңіз">
      <LoginForm next={sp.next} notice={sp.reset ? "Құпиясөз жаңартылды. Жаңа құпиясөзбен кіріңіз." : undefined} />
    </AuthShell>
  );
}
