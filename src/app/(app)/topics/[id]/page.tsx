import Link from "next/link";
import { notFound } from "next/navigation";
import { Presentation, PlayCircle, ClipboardList, FileText, Gamepad2, Download, ExternalLink, Eye, ChevronLeft, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { QUARTER_LABELS, formatSize } from "@/lib/labels";
import { embedUrl } from "@/lib/video";
import ShareButton from "@/components/ShareButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import Abbr from "@/components/Abbr";
import TopicUpload from "@/components/admin/TopicUpload";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deleteMaterial } from "@/app/actions/admin";
import PdfFrame from "@/components/PdfFrame";
import { officeViewerUrl } from "@/lib/storage";

import { getT } from "@/lib/i18n/server";
const SECTIONS = [
  { key: "PRESENTATION", label: "Презентация", icon: Presentation, color: "from-orange-100 to-orange-50 text-orange-500", mode: "file", accept: ".pptx,.ppt,.pdf" },
  { key: "VIDEO", label: "Бейнесабақ", icon: PlayCircle, color: "from-rose-100 to-rose-50 text-rose-500", mode: "both", accept: ".mp4" },
  { key: "PRACTICE", label: "Тапсырма", icon: ClipboardList, color: "from-emerald-100 to-emerald-50 text-emerald-600", mode: "file", accept: ".pdf,.docx,.doc,.pptx,.xlsx,.zip,.png,.jpg,.jpeg" },
  { key: "KMZH", label: "ҚМЖ", icon: FileText, color: "from-sky-100 to-sky-50 text-sky-600", mode: "file", accept: ".docx,.doc,.pdf" },
  { key: "GAME_LINK", label: "Ойын", icon: Gamepad2, color: "from-lilac-100 to-lilac-100/40 text-lilac-500", mode: "url", accept: "" },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const t = await db.topic.findUnique({ where: { id: Number((await params).id) || 0 }, select: { title: true } });
  return { title: t?.title ?? (await getT())("Сабақ") };
}

export default async function TopicPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; s?: string; m?: string }> }) {
  const t = await getT();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const sp = await searchParams;
  const { saved } = sp;
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
  const counts = Object.fromEntries(SECTIONS.map((x) => [x.key, topic.materials.filter((m) => m.type.key === x.key).length + (x.key === "GAME_LINK" ? topic.games.length : 0)])) as Record<string, number>;
  const ready = SECTIONS.filter((x) => counts[x.key]).length;
  const active = SECTIONS.find((x) => x.key === sp.s) ?? SECTIONS.find((x) => counts[x.key]) ?? SECTIONS[0];
  const items = topic.materials.filter((m) => m.type.key === active.key);
  const sel = items.find((m) => m.id === sp.m) ?? items[0];
  const selGame = !sel && active.key === "GAME_LINK" ? topic.games[0] : undefined;
  const isPdfLike = sel && (sel.previewPath || sel.fileMime === "application/pdf");
  const office = sel && sel.filePath && !isPdfLike && active.key !== "VIDEO" ? await officeViewerUrl(sel.filePath) : null;

  return (
    <div>
      <Breadcrumbs items={[{ href: `/grades/${g}`, label: t("{g}-сынып", { g }) }, { href: `/grades/${g}?q=${q}`, label: t(QUARTER_LABELS[q]) }, { label: topic.title }]} />

      <header className="mt-4 card p-6 sm:p-8 bg-gradient-to-r from-white via-sky-50 to-lilac-100">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-lilac-500 text-2xl font-extrabold text-white shadow-lift">{idx + 1}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sky-600">{t("{g}-сынып", { g })} · {t(QUARTER_LABELS[q])}{topic.section ? ` · ${topic.section}` : ""}</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold">{topic.title}</h1>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-2.5 flex-1 max-w-xs overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${(ready / SECTIONS.length) * 100}%` }} /></div>
          <span className="text-sm font-semibold text-ink-soft">{t("{n} бөлімнің {r}-і дайын", { n: SECTIONS.length, r: ready })}</span>
        </div>
      </header>

      {saved && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-700" role="status">{t("Материал қосылды ✓")}</div>}

      {/* Бөлім қойындылары */}
      <div id="tabs" className="mt-6 scroll-mt-24 -mx-4 px-4 flex gap-2.5 overflow-x-auto pb-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:overflow-visible" role="tablist" aria-label={t("Сабақ бөлімдері")}>
        {SECTIONS.map((s) => {
          const n = counts[s.key];
          const I = s.icon;
          const on = s.key === active.key;
          return (
            <Link key={s.key} href={`/topics/${id}?s=${s.key}#tabs`} scroll={false} role="tab" aria-selected={on}
              className={`group relative flex shrink-0 items-center gap-3 rounded-2xl border-2 px-4 py-3.5 transition ${on ? "border-transparent bg-gradient-to-r from-sky-500 to-lilac-500 text-white shadow-lift" : "border-sky-100 bg-white hover:border-sky-300 hover:-translate-y-0.5"}`}>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${on ? "bg-white/20" : `bg-gradient-to-br ${s.color}`}`}><I className="h-6 w-6" /></span>
              <span className="min-w-0">
                <span className="block text-base font-bold leading-tight">{t(s.key === "KMZH" ? "ҚМЖ" : s.label)}</span>
                <span className={`block text-sm ${on ? "text-white/85" : n ? "text-emerald-600 font-medium" : "text-ink-mute"}`}>{n ? t("{n} материал", { n }) : t("әзірге жоқ")}</span>
              </span>
              {n > 0 && !on && <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-500" />}
            </Link>
          );
        })}
      </div>

      {/* Таңдалған бөлім */}
      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]" aria-live="polite">
        <div className="card overflow-hidden">
          {sel ? <Preview m={sel} office={office} isGame={active.key === "GAME_LINK"} /> : selGame ? (
            <GameHero title={selGame.title} href={`/games/${selGame.id}`} />
          ) : (
            <div className="grid place-items-center text-center px-6 py-16 min-h-[420px] bg-gradient-to-br from-sky-50 to-lilac-100/50">
              <div>
                <span className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br ${active.color}`}><active.icon className="h-10 w-10" /></span>
                <h2 className="mt-5 text-2xl font-extrabold">{t("{name} әлі қосылмаған", { name: t(active.key === "KMZH" ? "ҚМЖ" : active.label) })}</h2>
                <p className="mt-2 text-base muted max-w-sm mx-auto">{t("Бұл бөлімге материал жақында қосылады. Басқа бөлімдерді қарап көріңіз.")}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SECTIONS.filter((x) => counts[x.key] && x.key !== active.key).map((x) => <Link key={x.key} href={`/topics/${id}?s=${x.key}#tabs`} scroll={false} className="btn-soft">{t(x.key === "KMZH" ? "ҚМЖ" : x.label)} →</Link>)}
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold"><active.icon className="h-5 w-5 text-sky-500" />{active.key === "KMZH" ? <><Abbr k="ҚМЖ" /> {t("(қысқа мерзімді жоспар)")}</> : t(active.label)}</h2>
          {items.map((m) => {
            const on = sel?.id === m.id;
            const ext = m.fileName?.split(".").pop()?.toUpperCase();
            return (
              <div key={m.id} className={`rounded-2xl border-2 bg-white p-4 transition ${on ? "border-sky-400 shadow-soft" : "border-sky-100"}`}>
                <Link href={`/topics/${id}?s=${active.key}&m=${m.id}#tabs`} scroll={false} className="flex items-start gap-3">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${active.color} text-xs font-extrabold`}>{ext ?? <active.icon className="h-6 w-6" />}</span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-snug">{m.title}{!m.published && <span className="chip ml-2 bg-amber-100 text-amber-700">{t("жоба")}</span>}</span>
                    <span className="block text-sm muted">{m.fileName ? `${ext} · ${formatSize(m.fileSize, t)}` : m.externalUrl ? t(hostLabel(m.externalUrl)) : t("Видео")}</span>
                  </span>
                </Link>
                <div className="mt-3 flex flex-wrap gap-2">
                  {active.key === "GAME_LINK" && m.externalUrl ? (
                    <>
                      <a href={m.externalUrl} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary flex-1"><ExternalLink className="h-4 w-4" /> {t("Ойнау")}</a>
                      {m.externalUrl.startsWith("/play/") && (user
                        ? <a href={m.externalUrl} download className="btn-ghost"><Download className="h-4 w-4" /> {t("Жүктеу")}</a>
                        : <Link href={`/login?next=/topics/${id}`} className="btn-soft"><Lock className="h-4 w-4" /> {t("Жүктеу")}</Link>)}
                      {m.externalUrl.startsWith("/play/") && <ShareButton title={m.title} url={m.externalUrl} />}
                    </>
                  ) : (
                    <>
                      {m.filePath && (user
                        ? <a href={`/api/files/material/${m.id}?dl=1`} className="btn-primary flex-1"><Download className="h-4 w-4" /> {t("Жүктеу")}</a>
                        : <Link href={`/login?next=/topics/${id}`} className="btn-soft flex-1"><Lock className="h-4 w-4" /> {t("Жүктеу")}</Link>)}
                      {active.key !== "VIDEO" && <Link href={`/materials/${m.id}`} className="btn-ghost"><Eye className="h-4 w-4" /> {t("Толық ашу")}</Link>}
                    </>
                  )}
                  {isAdmin && <ConfirmButton action={deleteMaterial.bind(null, m.id)} confirm={t("«{title}» жою керек пе?", { title: m.title })}>{t("Жою")}</ConfirmButton>}
                </div>
              </div>
            );
          })}
          {active.key === "GAME_LINK" && topic.games.map((gm) => (
            <div key={gm.id} className="flex items-center gap-2 rounded-2xl border-2 border-sky-100 bg-white p-4">
              <div className="flex-1 font-semibold">{gm.title} <span className="text-sm muted font-normal">· {t("сайттағы ойын")}</span></div>
              <Link href={`/games/${gm.id}`} className="btn-primary"><Gamepad2 className="h-4 w-4" /> {t("Ойнау")}</Link>
            </div>
          ))}
          {!items.length && !(active.key === "GAME_LINK" && topic.games.length) && <p className="rounded-2xl border-2 border-dashed border-sky-200 p-5 text-center text-base muted">{t("Әзірге материал жоқ")}</p>}
          {isAdmin && <div className="pt-1"><TopicUpload typeKey={active.key} label={active.label} mode={active.mode} accept={active.accept} grade={g} quarter={q} topicId={id} topicTitle={topic.title} /></div>}
        </aside>
      </section>

      <nav className="mt-8 grid grid-cols-2 gap-3" aria-label={t("Сабақтар")}>
        {prev ? <Link href={`/topics/${prev.id}`} className="card card-hover p-4 flex items-center gap-2"><ChevronLeft className="h-5 w-5 shrink-0 text-sky-500" /><span className="min-w-0"><span className="block text-xs muted">{t("Алдыңғы сабақ")}</span><span className="block font-semibold truncate">{prev.title}</span></span></Link> : <span />}
        {next ? <Link href={`/topics/${next.id}`} className="card card-hover p-4 flex items-center justify-end gap-2 text-right"><span className="min-w-0"><span className="block text-xs muted">{t("Келесі сабақ")}</span><span className="block font-semibold truncate">{next.title}</span></span><ChevronRight className="h-5 w-5 shrink-0 text-sky-500" /></Link> : <span />}
      </nav>
    </div>
  );
}

function hostLabel(u: string) {
  if (u.startsWith("/")) return "Сайттағы интерактивті ойын";
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "Сілтеме"; }
}

type PM = { id: string; title: string; fileName: string | null; fileMime: string | null; previewPath: string | null; videoUrl: string | null; externalUrl: string | null; filePath: string | null };

async function Preview({ m, office, isGame }: { m: PM; office: string | null; isGame: boolean }) {
  const t = await getT();
  const video = embedUrl(m.videoUrl);
  if (video) return <div className="aspect-video bg-black"><iframe src={video} title={m.title} className="h-full w-full" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" /></div>;
  if (m.fileMime === "video/mp4") return <video src={`/api/files/material/${m.id}`} controls preload="metadata" className="w-full aspect-video bg-black" />;
  if (isGame && m.externalUrl) return <GameHero title={m.title} href={m.externalUrl} external />;
  if (m.previewPath || m.fileMime === "application/pdf") return <PdfFrame src={`/api/files/material/${m.id}#view=FitH`} title={m.title} />;
  if (office) return <PdfFrame src={office} title={m.title} />;
  return (
    <div className="grid place-items-center text-center px-6 py-16 min-h-[420px] bg-gradient-to-br from-sky-50 to-lilac-100/50">
      <div>
        <Eye className="mx-auto h-12 w-12 text-sky-400" />
        <h2 className="mt-4 text-xl font-bold">{m.title}</h2>
        <Link href={`/materials/${m.id}`} className="btn-primary mt-5"><Eye className="h-4 w-4" /> {t("Ашып көру")}</Link>
      </div>
    </div>
  );
}

async function GameHero({ title, href, external }: { title: string; href: string; external?: boolean }) {
  const t = await getT();
  return (
    <div className="relative grid place-items-center overflow-hidden px-6 py-16 min-h-[420px] text-center text-white bg-gradient-to-br from-lilac-500 via-sky-500 to-sky-400">
      <span aria-hidden className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -right-12 bottom-0 h-64 w-64 rounded-full bg-white/10" />
      <div className="relative">
        <Gamepad2 className="mx-auto h-16 w-16" />
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold">{title}</h2>
        <p className="mt-2 text-white/85 text-base">{t("Оқушылардың білім деңгейін ойын арқылы анықтаңыз")}</p>
        {external
          ? <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-lg font-bold text-sky-600 shadow-lift hover:scale-105 transition"><ExternalLink className="h-5 w-5" /> {t("Ойынды бастау")}</a>
          : <Link href={href} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-lg font-bold text-sky-600 shadow-lift hover:scale-105 transition"><Gamepad2 className="h-5 w-5" /> {t("Ойынды бастау")}</Link>}
      </div>
    </div>
  );
}
