import Link from "next/link";
import { Eye, Download, Star, Presentation, PlayCircle, ClipboardList, FileText, BookOpen, Sparkles, Gamepad2 } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import { QUARTER_LABELS } from "@/lib/labels";

const ICONS: Record<string, { i: typeof Eye; c: string }> = {
  PRESENTATION: { i: Presentation, c: "bg-orange-100 text-orange-500" },
  VIDEO: { i: PlayCircle, c: "bg-rose-100 text-rose-500" },
  PRACTICE: { i: ClipboardList, c: "bg-emerald-100 text-emerald-600" },
  KMZH: { i: FileText, c: "bg-sky-100 text-sky-600" },
  RESOURCE: { i: BookOpen, c: "bg-amber-100 text-amber-600" },
  INTERACTIVE: { i: Sparkles, c: "bg-lilac-100 text-lilac-500" },
  GAME_LINK: { i: Gamepad2, c: "bg-teal-100 text-teal-600" },
};
export function TypeIcon({ k, className = "h-11 w-11" }: { k: string; className?: string }) {
  const { i: I, c } = ICONS[k] ?? ICONS.RESOURCE;
  return <span className={`grid shrink-0 place-items-center rounded-xl ${c} ${className}`}><I className="h-5 w-5" /></span>;
}

export type MaterialCardData = {
  id: string; title: string; description: string; gradeId: number; views: number; downloads: number;
  ratingAvg: number; ratingCount: number; fileName: string | null; videoUrl: string | null;
  type: { key: string; name: string }; quarter: { number: number }; topic: { title: string } | null;
};

export default function MaterialCard({ m, fav, loggedIn }: { m: MaterialCardData; fav?: boolean; loggedIn: boolean }) {
  const ext = m.fileName?.split(".").pop()?.toUpperCase() ?? (m.videoUrl ? "Видео" : "Сілтеме");
  return (
    <article className="card card-hover flex flex-col p-5 h-full">
      <div className="flex items-start gap-3">
        <TypeIcon k={m.type.key} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-snug line-clamp-2"><Link href={`/materials/${m.id}`} className="hover:text-sky-600">{m.title}</Link></h3>
          <p className="mt-1 text-xs muted">{m.gradeId}-сынып · {QUARTER_LABELS[m.quarter.number]}{m.topic ? ` · ${m.topic.title}` : ""}</p>
        </div>
        <FavoriteButton target={{ materialId: m.id }} initial={!!fav} loggedIn={loggedIn} />
      </div>
      {m.description && <p className="mt-3 text-sm text-ink-soft line-clamp-2">{m.description}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip">{m.type.name}</span>
        <span className="chip bg-lilac-100 text-lilac-500">{ext}</span>
      </div>
      <div className="mt-auto pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs muted">
          {m.views > 0 && <span className="flex items-center gap-1" title="Қаралым"><Eye className="h-3.5 w-3.5" />{m.views}</span>}
          {m.downloads > 0 && <span className="flex items-center gap-1" title="Жүктеу"><Download className="h-3.5 w-3.5" />{m.downloads}</span>}
          {m.ratingCount > 0 && <span className="flex items-center gap-1" title="Бағалау"><Star className="h-3.5 w-3.5 text-gold-500 fill-gold-400" />{m.ratingAvg.toFixed(1)}</span>}
          {!m.views && !m.downloads && !m.ratingCount && <span className="chip bg-emerald-100 text-emerald-700">Жаңа</span>}
        </div>
        <Link href={`/materials/${m.id}`} className="btn-soft btn-sm">Ашу</Link>
      </div>
    </article>
  );
}

export const materialCardSelect = {
  id: true, title: true, description: true, gradeId: true, views: true, downloads: true, ratingAvg: true, ratingCount: true,
  fileName: true, videoUrl: true, type: { select: { key: true, name: true } }, quarter: { select: { number: true } }, topic: { select: { title: true } },
} as const;
