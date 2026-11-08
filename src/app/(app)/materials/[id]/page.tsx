import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Eye, Star, ExternalLink, FileWarning, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { QUARTER_LABELS, formatDate, formatSize } from "@/lib/labels";
import { embedUrl } from "@/lib/video";
import Breadcrumbs from "@/components/Breadcrumbs";
import FavoriteButton from "@/components/FavoriteButton";
import RatingStars from "@/components/RatingStars";
import CommentForm from "@/components/CommentForm";
import ShareButton from "@/components/ShareButton";
import MaterialCard, { TypeIcon, materialCardSelect } from "@/components/MaterialCard";
import ViewTracker from "@/components/ViewTracker";
import PdfFrame from "@/components/PdfFrame";
import { officeViewerUrl } from "@/lib/storage";

import { getT } from "@/lib/i18n/server";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const m = await db.material.findUnique({ where: { id: (await params).id }, select: { title: true } });
  return { title: m?.title ?? (await getT())("Материал") };
}

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  const user = await getCurrentUser();
  const m = await db.material.findUnique({
    where: { id },
    include: {
      type: true, quarter: true, topic: true,
      comments: { where: { hidden: false }, orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { name: true } } } },
    },
  });
  if (!m || (!m.published && user?.role !== "ADMIN")) notFound();

  const [fav, mine, related] = await Promise.all([
    user ? db.favorite.findFirst({ where: { userId: user.id, materialId: id } }) : null,
    user ? db.review.findUnique({ where: { userId_materialId: { userId: user.id, materialId: id } } }) : null,
    db.material.findMany({ where: { published: true, id: { not: id }, OR: [{ topicId: m.topicId ?? -1 }, { gradeId: m.gradeId, quarterId: m.quarterId }] }, take: 3, select: materialCardSelect }),
  ]);

  const video = embedUrl(m.videoUrl);
  const isPdfLike = m.previewPath || m.fileMime === "application/pdf";
  const isImage = m.fileMime?.startsWith("image/");
  const isMp4 = m.fileMime === "video/mp4";
  const fileSrc = `/api/files/material/${m.id}`;
  const office = !isPdfLike && !video ? await officeViewerUrl(m.filePath) : null;

  return (
    <div>
      <ViewTracker kind="material" id={m.id} />
      <Breadcrumbs items={[
        { href: "/materials", label: t("Материалдар") },
        { href: `/grades/${m.gradeId}`, label: t("{g}-сынып", { g: m.gradeId }) },
        { href: `/grades/${m.gradeId}?q=${m.quarter.number}`, label: t(QUARTER_LABELS[m.quarter.number]) },
        { label: m.topic?.title ?? m.title },
      ]} />

      {!m.published && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">{t("Бұл материал әлі жарияланбаған (тек әкімшіге көрінеді).")}</div>}

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <header className="flex items-start gap-4">
            <TypeIcon k={m.type.key} className="h-14 w-14" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{m.title}</h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="chip">{t(m.type.name)}</span>
                <span className="chip bg-white border border-sky-100">{t("{g}-сынып", { g: m.gradeId })}</span>
                <span className="chip bg-white border border-sky-100">{t(QUARTER_LABELS[m.quarter.number])}</span>
                {m.topic && <span className="chip bg-lilac-100 text-lilac-500">{m.topic.title}</span>}
              </div>
            </div>
          </header>

          {/* Қарау аймағы */}
          <div className="mt-6 card overflow-hidden">
            {video ? (
              <div className="aspect-video"><iframe src={video} title={m.title} className="h-full w-full" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen loading="lazy" /></div>
            ) : isMp4 ? (
              <video src={fileSrc} controls className="w-full aspect-video bg-black" preload="metadata" />
            ) : isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileSrc} alt={m.title} className="w-full" />
            ) : isPdfLike ? (
              <PdfFrame src={`${fileSrc}#view=FitH`} title={m.title} />
            ) : office ? (
              <PdfFrame src={office} title={m.title} />
            ) : (
              <div className="p-10 text-center">
                <FileWarning className="mx-auto h-10 w-10 text-gold-500" />
                <p className="mt-3 font-semibold">{t("Бұл файлдың алдын ала қарау нұсқасы жоқ")}</p>
                <p className="mt-1 text-sm muted">{m.fileName ? t("{ext} файлын жүктеп алып ашыңыз.", { ext: m.fileName.split(".").pop()?.toUpperCase() ?? "" }) : t("Материал сыртқы сілтеме арқылы қолжетімді.")}</p>
              </div>
            )}
          </div>

          {m.description && (
            <section className="mt-6 card p-6">
              <h2 className="font-bold mb-2">{t("Сипаттамасы")}</h2>
              <p className="text-ink-soft whitespace-pre-line">{m.description}</p>
            </section>
          )}

          {/* Пікірлер */}
          <section className="mt-6 card p-6" id="comments">
            <h2 className="font-bold mb-4">{t("Пікірлер")} ({m.comments.length})</h2>
            {user ? <CommentForm materialId={m.id} /> : (
              <p className="text-sm muted"><Link href={`/login?next=/materials/${m.id}`} className="font-semibold text-sky-600 hover:underline">{t("Жүйеге кіріп")}</Link>{t(", пікір қалдырыңыз.")}</p>
            )}
            <ul className="mt-6 space-y-4">
              {m.comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-lilac-500 text-xs font-bold text-white">{c.user.name.slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0">
                    <div className="text-sm"><span className="font-semibold">{c.user.name}</span> <span className="muted">· {formatDate(c.createdAt, t)}</span></div>
                    <p className="mt-0.5 text-sm text-ink-soft whitespace-pre-line break-words">{c.text}</p>
                  </div>
                </li>
              ))}
              {m.comments.length === 0 && <li className="text-sm muted">{t("Әзірге пікір жоқ. Бірінші болыңыз!")}</li>}
            </ul>
          </section>
        </div>

        {/* Бүйір панелі */}
        <aside className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="card p-5 space-y-3">
            {m.filePath && (
              user ? (
                <a href={`${fileSrc}?dl=1`} className="btn-primary w-full h-12"><Download className="h-4 w-4" /> {t("Жүктеу")} {m.fileSize ? `(${formatSize(m.fileSize, t)})` : ""}</a>
              ) : (
                <Link href={`/login?next=/materials/${m.id}`} className="btn-primary w-full h-12"><Lock className="h-4 w-4" /> {t("Жүктеу үшін кіріңіз")}</Link>
              )
            )}
            {(m.externalUrl || (m.videoUrl && !video) || (video && m.videoUrl)) && (
              <a href={m.externalUrl ?? m.videoUrl!} target="_blank" rel="noopener noreferrer nofollow" className="btn-ghost w-full"><ExternalLink className="h-4 w-4" /> {t("Сыртқы сілтемені ашу")}</a>
            )}
            <FavoriteButton target={{ materialId: m.id }} initial={!!fav} loggedIn={!!user} withLabel />
            <ShareButton title={m.title} />
          </div>
          <div className="card p-5">
            <h2 className="font-bold">{t("Бағалау")}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
              <span className="font-semibold">{m.ratingCount ? m.ratingAvg.toFixed(1) : "–"}</span>
              <span className="muted">({t("{n} баға", { n: m.ratingCount })})</span>
            </div>
            <div className="mt-3"><RatingStars materialId={m.id} mine={mine?.rating ?? 0} loggedIn={!!user} /></div>
          </div>
          <dl className="card p-5 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="muted">{t("Қаралым")}</dt><dd className="font-semibold flex items-center gap-1"><Eye className="h-4 w-4" /> {m.views}</dd></div>
            <div><dt className="muted">{t("Жүктеу")}</dt><dd className="font-semibold flex items-center gap-1"><Download className="h-4 w-4" /> {m.downloads}</dd></div>
            {m.fileName && <div className="col-span-2"><dt className="muted">{t("Файл")}</dt><dd className="font-semibold break-all">{m.fileName}</dd></div>}
            <div className="col-span-2"><dt className="muted">{t("Қосылған күні")}</dt><dd className="font-semibold">{formatDate(m.createdAt, t)}</dd></div>
          </dl>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-4">{t("Ұқсас материалдар")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <MaterialCard key={r.id} m={r} loggedIn={!!user} />)}
          </div>
        </section>
      )}
    </div>
  );
}
