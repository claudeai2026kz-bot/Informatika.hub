"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Шынайы 3D робот (суреті public/robot ішінде). Ауада қалқиды, тінтуірге қарай бұрылады,
 * сәлемдескенде тербеледі, сөйлегенде беті жарқырайды.
 */
export default function Robot({
  size = 320,
  float = true,
  track = true,
  wave = false,
  talking = false,
  className = "",
}: {
  size?: number;
  float?: boolean;
  track?: boolean;
  wave?: boolean;
  talking?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height * 0.4)) / window.innerHeight;
        setTilt({ x: Math.max(-1, Math.min(1, dx * 2)) * 14, y: Math.max(-1, Math.min(1, dy * 2)) * -9 });
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, [track]);

  const h = Math.round(size * 1.23);
  const src = size <= 120 ? "/robot/robot-sm.webp" : "/robot/robot.webp";
  return (
    <div ref={ref} className={`relative select-none ${className}`} style={{ width: size, height: h, perspective: 900 }} aria-hidden>
      {/* еденге түскен жарық көлеңке */}
      <span className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-cyan-400/40 blur-md" style={{ bottom: -size * 0.02, width: size * 0.55, height: size * 0.08, animation: float ? "rbshadow 5s ease-in-out infinite" : undefined }} />
      <div className={float ? "rb-float" : ""} style={{ width: "100%", height: "100%" }}>
        <div style={{ width: "100%", height: "100%", transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`, transition: "transform .5s cubic-bezier(.2,.7,.2,1)", transformStyle: "preserve-3d", animation: wave ? "rbhello 2.6s ease-in-out infinite" : talking ? "rbnod .9s ease-in-out infinite" : undefined }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={size} height={h} draggable={false} className="h-full w-full object-contain drop-shadow-[0_18px_30px_rgba(10,20,60,.35)]" />
          {/* сөйлегенде экран жарқырайды */}
          <span className="pointer-events-none absolute rounded-[45%] bg-cyan-300 mix-blend-screen blur-xl transition-opacity duration-300"
            style={{ left: "44%", top: "14%", width: "46%", height: "38%", opacity: talking ? 0.35 : 0, animation: talking ? "rbglow .5s ease-in-out infinite alternate" : undefined }} />
        </div>
      </div>
      <style>{`
        .rb-float{animation:rbfloat 5s ease-in-out infinite}
        @keyframes rbfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-${Math.max(4, size * 0.045)}px)}}
        @keyframes rbshadow{0%,100%{transform:translateX(-50%) scale(1);opacity:.9}50%{transform:translateX(-50%) scale(.8);opacity:.5}}
        @keyframes rbhello{0%,100%{rotate:0deg}15%{rotate:-7deg}30%{rotate:6deg}45%{rotate:-5deg}60%{rotate:0deg}}
        @keyframes rbnod{0%,100%{translate:0 0}50%{translate:0 -2px}}
        @keyframes rbglow{from{opacity:.15}to{opacity:.45}}
        @media (prefers-reduced-motion:reduce){.rb-float{animation:none}}
      `}</style>
    </div>
  );
}
