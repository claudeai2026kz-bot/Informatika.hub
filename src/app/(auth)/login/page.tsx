import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata() {
  return { title: (await getT())("Жүйеге кіру") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const t = await getT();
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <AuthShell title={t("Жүйеге кіру 👋")} subtitle={t("Жалғастыру үшін аккаунтыңызға кіріңіз")}>
      <LoginForm next={sp.next} notice={sp.reset ? t("Құпиясөз жаңартылды. Жаңа құпиясөзбен кіріңіз.") : undefined} />
    </AuthShell>
  );
}
