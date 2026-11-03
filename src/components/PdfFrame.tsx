"use client";
import { useEffect, useState } from "react";

/** PDF-ті бет ашылғаннан кейін жүктейді, сондықтан бетке өту кідірмейді. */
export default function PdfFrame({ src, title }: { src: string; title: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 50); return () => clearTimeout(t); }, []);
  return ready ? <iframe src={src} title={title} className="w-full h-[70vh] min-h-[420px] bg-sky-50" /> : <div className="skeleton w-full h-[70vh] min-h-[420px] !rounded-none" />;
}
