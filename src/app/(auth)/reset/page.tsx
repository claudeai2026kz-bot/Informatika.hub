import AuthShell from "@/components/AuthShell";
import ResetForm from "./ResetForm";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <AuthShell title="Жаңа құпиясөз" subtitle="Кемінде 8 таңба, бір әріп және бір сан">
      <ResetForm token={token} />
    </AuthShell>
  );
}
