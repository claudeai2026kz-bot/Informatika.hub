import { requireAdmin } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export const metadata = { title: { default: "Әкімші панелі", template: "%s · Әкімші · Informatika Hub" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <AdminNav name={admin.name} />
      <main className="min-w-0 px-4 sm:px-8 py-6 sm:py-8 page-enter">{children}</main>
    </div>
  );
}
