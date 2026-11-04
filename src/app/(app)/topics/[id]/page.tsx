import Link from "next/link";
import { notFound } from "next/navigation";
import { Presentation, PlayCircle, ClipboardList, FileText, Gamepad2, Download, ExternalLink, Eye, ChevronLeft, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { QUARTER_LABELS, formatSize } from "@/lib/labels";
import { embedUrl } from "@/lib/video";
import Breadcrumbs from "@/components/Breadcrumbs";
import Abbr from "@/components/Abbr";
import TopicUpload from "@/components/admin/TopicUpload";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deleteMaterial } from "@/app/actions/admin";

const SECTIONS = [
  { key: "PRESENTATION", label: "Презентация", icon: Presentation, color: "from-orange-100 to-orange-50 text-orange-500", mode: "file", accept: ".pptx,.ppt,.pdf" },
  { key: "VIDEO", label: "Бейнесабақ", icon: PlayCircle, color: "from-rose-100 to-rose-50 text-rose-500", mode: "both", accept: ".mp4" },
  { key: "PRACTICE", label: "Тапсырма", icon: ClipboardList, color: "from-emerald-100 to-emerald-50 text-emerald-600", mode: "file", accept: ".pdf,.docx,.doc,.pptx,.xlsx,.zip,.png,.jpg,.jpeg" },
  { key: "KMZH", label: "ҚМЖ", icon: FileText, color: "from-sky-100 to-sky-50 text-sky-600", mode: "file", accept: ".docx,.doc,.pdf" },
  { key: "GAME_LINK", label: "Ойын", icon: Gamepad2, color: "from-lilac-100 to-lilac-100/40 text-lilac-500", mode: "url", accept: "" },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const t = await db.topic.findUnique({ where: { id: Number((await params).id) || 0 }, select: { title: true } });
  return { title: t?.title ?? "Сабақ" };
}

export default async function TopicPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const { saved } = await searchParams;
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const topic = await db.topic.findUnique({
    where: { id },
    include: {
      quarter: true,
      materials: { where: isAdmin ? {} : { published: true }, orderBy: { createdAt: "asc" }, include: { type: true } },
      games: { where: { published: true }, select: { id: true, title: true } },
    },
  });
  if (!topic) notFound();
  const siblings = await db.topic.findMany({ where: { quarterId: topic.quarterId }, orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true, title: true } });
  const idx = siblings.findIndex((s) => s.id === id);
  const prev = siblings[idx - 1], next = siblings[idx + 1];
  const g = topic.quarter.gradeId, q = topic.quarter.number;

  return (
    <div>
      <Breadcrumbs items={[{ href: `/grades/${g}`, label: `${g}-сынып` }, { href: `/grades/${g}?q=${q}`, label: QUARTER_LABELS[q] }, { label: topic.title }]} />

      <header className="mt-4 card p-6 sm:p-8 bg-gradient-to-r from-white via-sky-50 to-lilac-100">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-lilac-500 text-2xl font-extrabold text-white shadow-lift">{idx + 1}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sky-600">{g}-сынып · {QUARTER_LABELS[q]}{topic.section ? ` · ${topic.section}` : ""}</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold">{topic.title}</h1>
          </div>
        </div>
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Бөлімдер">
          {SECTIONS.map((s) => {
            const n = topic.materials.filter((m) => m.type.key === s.key).length + (s.key === "GAME_LINK" ? topic.games.length : 0);
            return <a key={s.key} href={`#${s.key}`} className={`chip border ${n ? "bg-white border-sky-200 text-ink" : "bg-white/60 border-transparent text-ink-mute"}`}>{n > 0 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}{s.key === "KMZH" ? <Abbr k="ҚМЖ" /> : s.label}</a>;
          })}
        </nav>
      </header>

      {saved && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">Материал қосылды ✓</div>}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {SECTIONS.map((s) => {
          const items = topic.materials.filter((m) => m.type.key === s.key);
          const I = s.icon;
          const empty = items.length === 0 && !(s.key === "GAME_LINK" && topic.games.length);
          return (
            <section key={s.key} id={s.key} className={`card p-5 sm:p-6 scroll-mt-24 ${s.key === "VIDEO" ? "lg:col-span-2" : ""}`}>
              <div className="flex items-center gap-3">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${s.color}`}><I className="h-6 w-6" /></span>
                <h2 className="text-lg font-bold">{s.key === "KMZH" ? <><Abbr k="ҚМЖ" /> (қысқа мерзімді жоспар)</> : s.label}</h2>
              </div>

              <ul className="mt-4 space-y-3">
                {items.map((m) => {
                  const video = s.key === "VIDEO" ? embedUrl(m.videoUrl) : null;
                  return (
                    <li key={m.id} className="rounded-xl border border-sky-100 bg-sky-50/40 p-3">
                      {video && <div className="mb-3 aspect-video overflow-hidden rounded-lg"><iframe src={video} title={m.title} className="h-full w-full" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" /></div>}
                      {s.key === "VIDEO" && !video && m.fileMime === "video/mp4" && <video src={`/api/files/material/${m.id}`} controls preload="metadata" className="mb-3 w-full rounded-lg bg-black aspect-video" />}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-0 basis-full sm:basis-0 flex-1">
                          <div className="font-semibold leading-snug">{m.title}{!m.published && <span className="chip ml-2 bg-amber-100 text-amber-700">жоба</span>}</div>
                          <div className="text-xs muted">{m.fileName ? `${m.fileName.split(".").pop()?.toUpperCase()} · ${formatSize(m.fileSize)}` : m.externalUrl ? new URL(m.externalUrl).hostname.replace(/^www\./, "") : "Видео"}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.key === "GAME_LINK" && m.externalUrl ? (
                            <a href={m.externalUrl} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary btn-sm"><ExternalLink className="h-4 w-4" /> Ойнау</a>
                          ) : (
                            <>
                              {s.key !== "VIDEO" && <Link href={`/materials/${m.id}`} className="btn-ghost btn-sm"><Eye className="h-4 w-4" /> Ашу</Link>}
                              {m.filePath && (user
                                ? <a href={`/api/files/material/${m.id}?dl=1`} className="btn-primary btn-sm"><Download className="h-4 w-4" /> Жүктеу</a>
                                : <Link href={`/login?next=/topics/${id}`} className="btn-soft btn-sm"><Lock className="h-4 w-4" /> Жүктеу</Link>)}
                            </>
                          )}
                          {isAdmin && <ConfirmButton action={deleteMaterial.bind(null, m.id)} confirm={`«${m.title}» жою керек пе?`}>Жою</ConfirmButton>}
                        </div>
                      </div>
                    </li>
                  );
                })}
                {s.key === "GAME_LINK" && topic.games.map((gm) => (
                  <li key={gm.id} className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/40 p-3">
                    <div className="flex-1 font-semibold">{gm.title} <span className="text-xs muted font-normal">· сайттағы ойын</span></div>
                    <Link href={`/games/${gm.id}`} className="btn-primary btn-sm"><Gamepad2 className="h-4 w-4" /> Ойнау</Link>
                  </li>
                ))}
              </ul>
              {empty && <p className="mt-3 text-sm muted">Әзірге қосылмаған.</p>}
              {isAdmin && <div className="mt-3"><TopicUpload typeKey={s.key} label={s.label} mode={s.mode} accept={s.accept} grade={g} quarter={q} topicId={id} topicTitle={topic.title} /></div>}
            </section>
          );
        })}
      </div>

      <nav className="mt-8 grid grid-cols-2 gap-3" aria-label="Сабақтар">
        {prev ? <Link href={`/topics/${prev.id}`} className="card card-hover p-4 flex items-center gap-2"><ChevronLeft className="h-5 w-5 shrink-0 text-sky-500" /><span className="min-w-0"><span className="block text-xs muted">Алдыңғы сабақ</span><span className="block font-semibold truncate">{prev.title}</span></span></Link> : <span />}
        {next ? <Link href={`/topics/${next.id}`} className="card card-hover p-4 flex items-center justify-end gap-2 text-right"><span className="min-w-0"><span className="block text-xs muted">Келесі сабақ</span><span className="block font-semibold truncate">{next.title}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-sky-500" /></Link> : <span />}
      </nav>
    </div>
  );
}
