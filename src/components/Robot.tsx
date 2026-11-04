"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Ақ-көк 3D стильді робот (SVG + градиенттер). Көздері курсорға қарайды,
 * баяу қалқиды. Ауыр 3D кітапханасыз, сондықтан сайт жылдам жүктеледі.
 */
export default function Robot({
  size = 320,
  float = true,
  track = true,
  wave = false,
  talking = false,
  className = "",
}: {
  talking?: boolean;
  size?: number;
  float?: boolean;
  track?: boolean;
  wave?: boolean;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, "");
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height * 0.35)) / window.innerHeight;
        setLook({ x: Math.max(-1, Math.min(1, dx * 2)) * 7, y: Math.max(-1, Math.min(1, dy * 2)) * 5 });
        setTilt({ x: dx * 10, y: dy * -6 });
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [track]);

  return (
    <div
      className={`relative ${float ? "animate-float" : ""} ${className}`}
      style={{ width: size, height: size * 1.12, perspective: 800 }}
      aria-hidden
    >
      <svg
        ref={ref}
        viewBox="0 0 300 336"
        width="100%"
        height="100%"
        style={{ transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`, transition: "transform .4s ease-out" }}
      >
        <defs>
          <radialGradient id={`rb-white-${uid}`} cx="35%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#F1F7FE" />
            <stop offset="100%" stopColor="#C9DDF2" />
          </radialGradient>
          <radialGradient id={`rb-blue-${uid}`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#B9E0FF" />
            <stop offset="60%" stopColor="#67B7F7" />
            <stop offset="100%" stopColor="#2F86D6" />
          </radialGradient>
          <linearGradient id={`rb-visor-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A3A5C" />
            <stop offset="100%" stopColor="#111B30" />
          </linearGradient>
          <radialGradient id={`rb-eye-${uid}`} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#E9FBFF" />
            <stop offset="45%" stopColor="#7FE3FF" />
            <stop offset="100%" stopColor="#2AA8F0" />
          </radialGradient>
          <filter id={`rb-glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={`rb-shadow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#20304D" stopOpacity=".25" />
            <stop offset="100%" stopColor="#20304D" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* көлеңке */}
        <ellipse cx="150" cy="322" rx="90" ry="12" fill={`url(#rb-shadow-${uid})`} />

        {/* антенна */}
        <line x1="150" y1="44" x2="150" y2="20" stroke="#B7CBE2" strokeWidth="5" strokeLinecap="round" />
        <circle cx="150" cy="16" r="9" fill={`url(#rb-blue-${uid})`} filter={`url(#rb-glow-${uid})`} style={talking ? { transformOrigin: "150px 16px", animation: "rbping .6s ease-in-out infinite alternate" } : undefined} />

        {/* құлақтар */}
        <rect x="34" y="92" width="26" height="62" rx="13" fill={`url(#rb-blue-${uid})`} />
        <rect x="240" y="92" width="26" height="62" rx="13" fill={`url(#rb-blue-${uid})`} />

        {/* бас */}
        <rect x="50" y="42" width="200" height="160" rx="70" fill={`url(#rb-white-${uid})`} />
        <ellipse cx="110" cy="70" rx="38" ry="14" fill="#fff" opacity=".8" />

        {/* бет экраны */}
        <rect x="74" y="78" width="152" height="98" rx="46" fill={`url(#rb-visor-${uid})`} />
        <rect x="84" y="84" width="70" height="10" rx="5" fill="#fff" opacity=".07" />

        {/* көздер */}
        <g transform={`translate(${look.x} ${look.y})`} filter={`url(#rb-glow-${uid})`}>
          <g className="animate-blink" style={{ transformOrigin: "150px 127px" }}>
            <ellipse cx="120" cy="127" rx="17" ry="21" fill={`url(#rb-eye-${uid})`} />
            <ellipse cx="180" cy="127" rx="17" ry="21" fill={`url(#rb-eye-${uid})`} />
            <circle cx="114" cy="119" r="5" fill="#fff" opacity=".9" />
            <circle cx="174" cy="119" r="5" fill="#fff" opacity=".9" />
          </g>
        </g>
        {/* күлкі */}
        {talking ? (
          <ellipse cx="150" cy="160" rx="14" ry="7" fill="#7FE3FF" opacity=".9" style={{ transformOrigin: "150px 160px", animation: "rbtalk .28s ease-in-out infinite alternate" }} />
        ) : (
          <path d="M134 158 Q150 168 166 158" stroke="#7FE3FF" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".85" />
        )}

        {/* мойын */}
        <rect x="128" y="198" width="44" height="16" rx="8" fill="#C9DDF2" />

        {/* дене */}
        <path d="M82 236 Q82 212 112 210 L188 210 Q218 212 218 236 L224 290 Q226 312 200 312 L100 312 Q74 312 76 290 Z" fill={`url(#rb-white-${uid})`} />
        <ellipse cx="122" cy="230" rx="26" ry="8" fill="#fff" opacity=".85" />
        {/* кеуде белгісі */}
        <rect x="124" y="240" width="52" height="40" rx="14" fill={`url(#rb-blue-${uid})`} />
        <path d="M140 252 l-7 8 7 8 M160 252 l7 8 -7 8" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* қолдар */}
        <rect x="52" y="222" width="28" height="70" rx="14" fill={`url(#rb-white-${uid})`} />
        <g
          style={
            wave
              ? { transformOrigin: "234px 228px", animation: "rbwave 2.4s ease-in-out infinite" }
              : undefined
          }
        >
          <rect x="220" y="222" width="28" height="70" rx="14" fill={`url(#rb-white-${uid})`} />
          <circle cx="234" cy="290" r="13" fill={`url(#rb-blue-${uid})`} />
        </g>
        <circle cx="66" cy="290" r="13" fill={`url(#rb-blue-${uid})`} />
      </svg>
      <style>{`@keyframes rbtalk{from{transform:scaleY(.25)}to{transform:scaleY(1.15)}}@keyframes rbping{from{transform:scale(1)}to{transform:scale(1.5)}}@keyframes rbwave{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(-38deg)}80%{transform:rotate(-20deg)}90%{transform:rotate(-38deg)}}`}</style>
    </div>
  );
}
