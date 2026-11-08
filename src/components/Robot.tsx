"use client";

import { useEffect, useRef } from "react";

/**
 * Шынайы 3D робот-көмекші (сурет). Жайлап ұшып тербеледі, тінтуірге қарай
 * сәл бұрылады (3D қисаю), астында көгілдір жарық тұғыр жанады.
 * wave — қуанып сәлемдеседі, talking — сөйлегенде экраны жарқырайды.
 * `head` — шағын батырмалар үшін тек басы. API бұрынғыдай.
 */
export default function Robot({
  size = 320,
  float = true,
  track = true,
  wave = false,
  talking = false,
  head = false,
  className = "",
}: {
  size?: number;
  float?: boolean;
  track?: boolean;
  wave?: boolean;
  talking?: boolean;
  head?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const w = size;
  const h = head ? Math.round(size * 0.89) : Math.round(size * 1.23);

  useEffect(() => {
    if (!track) return;
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, tx = 0, ty = 0, x = 0, y = 0, last = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.45)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.4)) / (window.innerHeight * 0.45)));
      last = performance.now();
    };
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (performance.now() - last > 4000) { tx = Math.sin(t / 2400) * 0.3; ty = Math.sin(t / 3100) * 0.12; }
      x += (tx - x) * 0.06; y += (ty - y) * 0.06;
      if (tiltRef.current) tiltRef.current.style.transform = `perspective(900px) rotateY(${(x * 16).toFixed(2)}deg) rotateX(${(-y * 10).toFixed(2)}deg)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, [track]);

  const src = head ? "/robot/robot-head.webp" : size <= 130 ? "/robot/robot-sm.webp" : "/robot/robot.webp";

  return (
    <div ref={ref} className={`rb relative select-none ${float ? "rb-float" : ""} ${wave ? "rb-wave" : ""} ${talking ? "rb-talk" : ""} ${head ? "rb-head" : ""} ${className}`} style={{ width: w, height: h }} aria-hidden>
      {!head && <span className="rb-pad" />}
      <div className="rb-bob">
        <div ref={tiltRef} className="rb-tilt">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} className="rb-img" />
          <span className="rb-shine" style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }} />
        </div>
      </div>
    </div>
  );
}
