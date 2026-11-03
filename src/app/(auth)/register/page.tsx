import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Тіркелу" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <AuthShell title="Тіркелу" subtitle="Тегін аккаунт ашып, материалдарды қолдана бастаңыз">
      <RegisterForm />
    </AuthShell>
  );
}
