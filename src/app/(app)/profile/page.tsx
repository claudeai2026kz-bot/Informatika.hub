import Link from "next/link";
import { Eye, Download, MessageSquare, Star, Heart, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/labels";
import ActionForm from "@/components/ui/ActionForm";
import SubmitButton from "@/components/ui/SubmitButton";
import PasswordInput from "@/components/ui/PasswordInput";
import { changePassword, updateProfile } from "@/app/actions/profile";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata() {
  return { title: (await getT())("Профиль") };
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const t = await getT();
  const user = await requireUser("/profile");
  const tab = (await searchParams).tab ?? "viewed";
  const [counts, history, comments, reviews, results] = await Promise.all([
    Promise.all([
      db.userHistory.count({ where: { userId: user.id, action: "VIEW" } }),
      db.userHistory.count({ where: { userId: user.id, action: "DOWNLOAD" } }),
      db.comment.count({ where: { userId: user.id } }),
      db.review.count({ where: { userId: user.id } }),
      db.favorite.count({ where: { userId: user.id } }),
    ]),
    db.userHistory.findMany({
      where: { userId: user.id, action: tab === "downloads" ? "DOWNLOAD" : "VIEW" },
      orderBy: { createdAt: "desc" }, take: 20,
      include: { material: { select: { id: true, title: true } }, assessment: { select: { id: true, title: true } } },
    }),
    db.comment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20, include: { material: { select: { id: true, title: true } }, assessment: { select: { id: true, title: true } } } }),
    db.review.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 20, include: { material: { select: { id: true, title: true } } } }),
    db.gameResult.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { game: { select: { id: true, title: true } } } }),
  ]);
  const initials = user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const tabs = [
    { k: "viewed", l: t("Соңғы қаралғандар"), i: Eye, n: counts[0] },
    { k: "downloads", l: t("Жүктеу тарихы"), i: Download, n: counts[1] },
    { k: "comments", l: t("Пікірлер"), i: MessageSquare, n: counts[2] },
    { k: "reviews", l: t("Бағалаулар"), i: Star, n: counts[3] },
    { k: "games", l: t("Ойын нәтижелері"), i: Trophy, n: results.length },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-4">
        <div className="card p-6 text-center">
          {user.avatarPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/avatar/${user.id}`} alt={t("Профиль суреті")} className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-sky-100" />
          ) : (
            <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-lilac-500 text-3xl font-bold text-white ring-4 ring-sky-100">{initials}</span>
          )}
          <h1 className="mt-3 text-xl font-bold">{user.name}</h1>
          <p className="text-sm muted">{user.email}</p>
          <span className="chip mt-2">{t(user.role === "ADMIN" ? "Әкімші" : "Мұғалім")}</span>
          <Link href="/favorites" className="btn-ghost w-full mt-5"><Heart className="h-4 w-4 text-rose-500" /> {t("Таңдаулылар")} ({counts[4]})</Link>
        </div>

        <details className="card p-6" open>
          <summary className="font-bold cursor-pointer">{t("Жеке ақпаратты өңдеу")}</summary>
          <ActionForm action={updateProfile} className="mt-4 space-y-4">
            <div><label className="label" htmlFor="name">{t("Аты-жөні")}</label><input id="name" name="name" className="input" defaultValue={user.name} required /></div>
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" defaultValue={user.email} required /></div>
            <div><label className="label" htmlFor="avatar">{t("Профиль суреті (PNG, JPG, WEBP, 3 МБ дейін)")}</label><input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:font-semibold file:text-sky-600" /></div>
            <SubmitButton className="btn-primary w-full">{t("Сақтау")}</SubmitButton>
          </ActionForm>
        </details>

        <details className="card p-6">
          <summary className="font-bold cursor-pointer">{t("Құпиясөзді ауыстыру")}</summary>
          <ActionForm action={changePassword} className="mt-4 space-y-4">
            <div><label className="label" htmlFor="current">{t("Қазіргі құпиясөз")}</label><PasswordInput id="current" name="current" autoComplete="current-password" /></div>
            <div><label className="label" htmlFor="password">{t("Жаңа құпиясөз")}</label><PasswordInput id="password" name="password" autoComplete="new-password" /></div>
            <div><label className="label" htmlFor="confirm">{t("Жаңа құпиясөзді қайталаңыз")}</label><PasswordInput id="confirm" name="confirm" autoComplete="new-password" /></div>
            <SubmitButton className="btn-primary w-full">{t("Ауыстыру")}</SubmitButton>
          </ActionForm>
        </details>
      </aside>

      <section className="min-w-0">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {tabs.map(({ k, l, i: I, n }) => (
            <Link key={k} href={`/profile?tab=${k}`} className={`card p-3 text-center transition ${tab === k ? "!border-sky-400 ring-4 ring-sky-100" : "hover:border-sky-200"}`}>
              <I className="mx-auto h-5 w-5 text-sky-500" />
              <div className="mt-1 text-lg font-extrabold">{n}</div>
              <div className="text-xs muted leading-tight">{l}</div>
            </Link>
          ))}
        </div>

        <div className="mt-5 card divide-y divide-sky-100">
          {(tab === "viewed" || tab === "downloads") && history.map((h) => {
            const it = h.material ?? h.assessment;
            if (!it) return null;
            return <Row key={h.id} href={h.material ? `/materials/${it.id}` : `/assessments/${it.id}`} title={it.title} meta={formatDate(h.createdAt, t)} />;
          })}
          {tab === "comments" && comments.map((c) => {
            const it = c.material ?? c.assessment;
            return <Row key={c.id} href={it ? (c.material ? `/materials/${it.id}` : `/assessments/${it.id}`) : "#"} title={c.text} meta={`${it?.title ?? ""} · ${formatDate(c.createdAt, t)}${c.hidden ? ` · ${t("жасырылған")}` : ""}`} />;
          })}
          {tab === "reviews" && reviews.map((r) => <Row key={r.id} href={`/materials/${r.material.id}`} title={r.material.title} meta={`${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} · ${formatDate(r.updatedAt, t)}`} />)}
          {tab === "games" && results.map((r) => <Row key={r.id} href={`/games/${r.game.id}`} title={r.game.title} meta={`${r.score} / ${r.maxScore} ${t("ұпай")} · ${formatDate(r.createdAt, t)}`} />)}
          {((tab === "viewed" || tab === "downloads") ? history.length : tab === "comments" ? comments.length : tab === "reviews" ? reviews.length : results.length) === 0 && (
            <p className="p-10 text-center muted">{t("Әзірге ештеңе жоқ.")}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <Link href={href} className="block px-5 py-4 hover:bg-sky-50/60 transition">
      <div className="font-medium line-clamp-1">{title}</div>
      <div className="text-xs muted mt-0.5">{meta}</div>
    </Link>
  );
}
