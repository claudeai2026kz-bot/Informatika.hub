import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="page-enter">{children}</main>
      <Footer />
    </>
  );
}
