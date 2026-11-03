/** YouTube / Vimeo сілтемесін ендіру сілтемесіне айналдырады. Басқа сайттар ендірілмейді. */
export function embedUrl(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtube.com") { const v = u.searchParams.get("v"); return v && /^[\w-]{6,15}$/.test(v) ? `https://www.youtube-nocookie.com/embed/${v}` : null; }
    if (host === "youtu.be") { const v = u.pathname.slice(1); return /^[\w-]{6,15}$/.test(v) ? `https://www.youtube-nocookie.com/embed/${v}` : null; }
    if (host === "vimeo.com") { const v = u.pathname.split("/")[1]; return /^\d+$/.test(v) ? `https://player.vimeo.com/video/${v}` : null; }
  } catch { /* жарамсыз сілтеме */ }
  return null;
}
