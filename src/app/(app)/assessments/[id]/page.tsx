import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Lock, FileWarning, KeyRound, ListChecks, Target } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { QUARTER_LABELS, formatDate, formatSize } from "@/lib/labels";
import Breadcrumbs from "@/components/Breadcrumbs";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import CommentForm from "@/components/CommentForm";
import ViewTracker from "@/components/ViewTracker";
import PdfFrame from "@/components/PdfFrame";
import { officeViewerUrl } from "@/lib/storage";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const a = await db.assessment.findUnique({ where: { id: (await params).id }, select: { title: true } });
  return { title: a?.title ?? "БЖБ / ТЖБ" };
}

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const a = await db.assessment.findUnique({
    where: { id },
    include: { quarter: true, topic: true, comments: { where: { hidden: false }, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } } },
  });
  if (!a || (!a.published && user?.role !== "ADMIN")) notFound();
  const fav = user ? await db.favorite.findFirst({ where: { userId: user.id, assessmentId: id } }) : null;
  const src = `/api/files/assessment/${a.id}`;
  const canPreview = a.previewPath || a.fileMime === "application/pdf";
  const office = canPreview ? null : await officeViewerUrl(a.filePath);
  const label = a.kind === "BZHB" ? "БЖБ" : "ТЖБ";

  return (
    <div>
      <ViewTracker kind="assessment" id={a.id} />
      <Breadcrumbs items={[{ href: "/assessments", label: "БЖБ / ТЖБ" }, { href: `/assessments?kind=${a.kind}`, label }, { label: a.title }]} />
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <header>
            <span className={`chip ${a.kind === "BZHB" ? "" : "bg-lilac-100 text-lilac-500"}`}>{label} · {a.variant}</span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold">{a.title}</h1>
            <p className="mt-1 muted">{a.gradeId}-сынып · {QUARTER_LABELS[a.quarter.number]}{a.topic ? ` · ${a.topic.title}` : ""}</p>
            {a.description && <p className="mt-3 text-ink-soft whitespace-pre-line">{a.description}</p>}
          </header>

          <div className="card overflow-hidden">
            {canPreview ? <PdfFrame src={`${src}#view=FitH`} title={a.title} /> : office ? <PdfFrame src={office} title={a.title} /> : (
              <div className="p-10 text-center"><FileWarning className="mx-auto h-10 w-10 text-gold-500" /><p className="mt-3 font-semibold">Алдын ала қарау нұсқасы жоқ</p><p className="text-sm muted">Файлды жүктеп алып ашыңыз.</p></div>
            )}
          </div>

          {user ? (
            <>
              {(a.answers || a.answersPath) && (
                <details className="card p-6 group">
                  <summary className="flex cursor-pointer items-center gap-2 font-bold list-none"><KeyRound className="h-5 w-5 text-gold-500" /> Жауаптар <span className="ml-auto text-sm font-normal text-sky-600 group-open:hidden">Көрсету</span></summary>
                  {a.answers && <pre className="mt-4 whitespace-pre-wrap font-sans text-ink-soft">{a.answers}</pre>}
                  {a.answersPath && <a href={`${src}?part=answers`} className="btn-soft btn-sm mt-4"><Download className="h-4 w-4" /> Жауаптар файлын жүктеу</a>}
                </details>
              )}
              {a.criteria && <InfoBlock icon={<Target className="h-5 w-5 text-sky-500" />} title="Бағалау критерийлері" text={a.criteria} />}
              {a.descriptors && <InfoBlock icon={<ListChecks className="h-5 w-5 text-emerald-500" />} title="Дескрипторлар" text={a.descriptors} />}
            </>
          ) : (
            <div className="card p-6 text-center">
              <Lock className="mx-auto h-8 w-8 text-sky-400" />
              <p className="mt-2 font-semibold">Жауаптар мен дескрипторлар тек тіркелген мұғалімдерге көрінеді</p>
              <Link href={`/login?next=/assessments/${a.id}`} className="btn-primary mt-4">Жүйеге кіру</Link>
            </div>
          )}

          <section className="card p-6">
            <h2 className="font-bold mb-4">Пікірлер ({a.comments.length})</h2>
            {user && <CommentForm assessmentId={a.id} />}
            <ul className="mt-5 space-y-3">
              {a.comments.map((c) => (
                <li key={c.id} className="text-sm"><span className="font-semibold">{c.user.name}</span> <span className="muted">· {formatDate(c.createdAt)}</span><p className="text-ink-soft whitespace-pre-line break-words">{c.text}</p></li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="card p-5 space-y-3">
            {a.filePath && (user
              ? <a href={`${src}?dl=1`} className="btn-primary w-full h-12"><Download className="h-4 w-4" /> Жүктеу {a.fileSize ? `(${formatSize(a.fileSize)})` : ""}</a>
              : <Link href={`/login?next=/assessments/${a.id}`} className="btn-primary w-full h-12"><Lock className="h-4 w-4" /> Жүктеу үшін кіріңіз</Link>)}
            <FavoriteButton target={{ assessmentId: a.id }} initial={!!fav} loggedIn={!!user} withLabel />
            <ShareButton title={a.title} />
          </div>
          <dl className="card p-5 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="muted">Қаралым</dt><dd className="font-semibold">{a.views}</dd></div>
            <div><dt className="muted">Жүктеу</dt><dd className="font-semibold">{a.downloads}</dd></div>
            {a.fileName && <div className="col-span-2"><dt className="muted">Файл</dt><dd className="font-semibold break-all">{a.fileName}</dd></div>}
          </dl>
        </aside>
      </div>
    </div>
  );
}

function InfoBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 font-bold">{icon} {title}</h2>
      <p className="mt-3 whitespace-pre-line text-ink-soft">{text}</p>
    </section>
  );
}
