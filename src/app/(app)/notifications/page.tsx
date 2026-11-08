import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/labels";
import { markAllRead } from "@/app/actions/notifications";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata() {
  return { title: (await getT())("Хабарламалар") };
}

export default async function NotificationsPage() {
  const t = await getT();
  const user = await requireUser("/notifications");
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = items.filter((n) => !n.read).length;
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold flex items-center gap-3"><Bell className="h-7 w-7 text-sky-500" /> {t("Хабарламалар")}</h1>
        {unread > 0 && <form action={markAllRead}><button className="btn-ghost btn-sm"><CheckCheck className="h-4 w-4" /> {t("Барлығын оқылды деу")}</button></form>}
      </div>
      <ul className="mt-6 space-y-3">
        {items.map((n) => (
          <li key={n.id} className={`card p-5 ${n.read ? "" : "!border-sky-300 bg-sky-50/60"}`}>
            <div className="flex items-start gap-3">
              {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" aria-label={t("Жаңа")} />}
              <div className="flex-1">
                <div className="font-semibold">{t(n.title)}</div>
                {n.body && <p className="mt-1 text-sm text-ink-soft">{t(n.body)}</p>}
                <div className="mt-2 flex items-center gap-3 text-xs muted">{formatDate(n.createdAt, t)}{n.link && <Link href={n.link} className="font-semibold text-sky-600 hover:underline">{t("Ашу")}</Link>}</div>
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="card p-10 text-center muted">{t("Хабарлама жоқ.")}</li>}
      </ul>
    </div>
  );
}
