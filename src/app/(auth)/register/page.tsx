import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata() {
  return { title: (await getT())("Тіркелу") };
}

export default async function RegisterPage() {
  const t = await getT();
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <AuthShell title={t("Тіркелу")} subtitle={t("Тегін аккаунт ашып, материалдарды қолдана бастаңыз")}>
      <RegisterForm />
    </AuthShell>
  );
}
