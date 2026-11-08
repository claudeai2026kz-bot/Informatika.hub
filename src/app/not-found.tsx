import Link from "next/link";
import Robot from "@/components/Robot";

import { getT } from "@/lib/i18n/server";
export default async function NotFound() {
  const t = await getT();
  return (
    <div className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <div className="flex justify-center"><Robot size={180} /></div>
        <h1 className="mt-4 text-5xl font-extrabold gradient-text">404</h1>
        <p className="mt-2 text-lg font-semibold">{t("Бұл бет табылмады")}</p>
        <p className="muted">{t("Сілтеме қате болуы немесе бет жойылған болуы мүмкін.")}</p>
        <Link href="/" className="btn-primary mt-6">{t("Басты бетке оралу")}</Link>
      </div>
    </div>
  );
}
