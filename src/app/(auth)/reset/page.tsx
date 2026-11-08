import AuthShell from "@/components/AuthShell";
import ResetForm from "./ResetForm";

import { getT } from "@/lib/i18n/server";
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const t = await getT();
  const { token = "" } = await searchParams;
  return (
    <AuthShell title={t("Жаңа құпиясөз")} subtitle={t("Кемінде 8 таңба, бір әріп және бір сан")}>
      <ResetForm token={token} />
    </AuthShell>
  );
}
