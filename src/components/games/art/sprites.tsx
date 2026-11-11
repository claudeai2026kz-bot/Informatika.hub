/* Ойындардағы кейіпкерлер мен заттар: векторлық суреттер (кез келген өлшемде анық, тез жүктеледі). */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { uid?: string };

/** Сүйкімді робот (жоғары қарап тұр). */
export function RobotSprite({ uid = "r", ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" {...p}>
      <defs>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#D7E6F7" /></linearGradient>
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#24406E" /><stop offset="1" stopColor="#10203F" /></linearGradient>
        <radialGradient id={`${uid}g`}><stop offset="0" stopColor="#8FF3FF" /><stop offset="1" stopColor="#2FB8FF" /></radialGradient>
      </defs>
      <ellipse cx="50" cy="93" rx="26" ry="5" fill="#0B2545" opacity=".22" />
      <line x1="50" y1="14" x2="50" y2="5" stroke="#7C8DB5" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="5" r="4.5" fill="#F5C451" />
      <rect x="20" y="13" width="60" height="44" rx="20" fill={`url(#${uid}b)`} stroke="#B8CCE6" strokeWidth="1.5" />
      <rect x="27" y="21" width="46" height="27" rx="13" fill={`url(#${uid}v)`} />
      <ellipse cx="40" cy="34" rx="5" ry="6" fill={`url(#${uid}g)`} />
      <ellipse cx="60" cy="34" rx="5" ry="6" fill={`url(#${uid}g)`} />
      <path d="M43 42 Q50 46 57 42" stroke="#8FF3FF" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="33" cy="20" rx="7" ry="3" fill="#fff" opacity=".9" />
      <rect x="16" y="28" width="6" height="14" rx="3" fill="#3C9EEB" />
      <rect x="78" y="28" width="6" height="14" rx="3" fill="#3C9EEB" />
      <rect x="29" y="58" width="42" height="28" rx="12" fill={`url(#${uid}b)`} stroke="#B8CCE6" strokeWidth="1.5" />
      <circle cx="50" cy="70" r="6" fill="#3C9EEB" /><circle cx="50" cy="70" r="2.6" fill="#BDF4FF" />
      <rect x="20" y="62" width="9" height="18" rx="4.5" fill="#E8F0FA" stroke="#B8CCE6" />
      <rect x="71" y="62" width="9" height="18" rx="4.5" fill="#E8F0FA" stroke="#B8CCE6" />
      <rect x="33" y="85" width="12" height="7" rx="3.5" fill="#3C9EEB" /><rect x="55" y="85" width="12" height="7" rx="3.5" fill="#3C9EEB" />
    </svg>
  );
}

export function StarSprite({ uid = "s", ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" {...p}>
      <defs>
        <radialGradient id={`${uid}h`}><stop offset="0" stopColor="#FFE9A6" stopOpacity=".95" /><stop offset="1" stopColor="#FFE9A6" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE27A" /><stop offset="1" stopColor="#F2A516" /></linearGradient>
      </defs>
      <circle cx="50" cy="52" r="48" fill={`url(#${uid}h)`} />
      <path d="M50 12 L61 38 L89 40 L67 58 L74 86 L50 71 L26 86 L33 58 L11 40 L39 38 Z" fill={`url(#${uid}f)`} stroke="#E08A00" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 22 L57 40 L76 42" stroke="#FFF6CF" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".9" />
    </svg>
  );
}

/** Бұта (лабиринт қабырғасы). */
export function BushSprite({ uid = "b", ...p }: P) {
  return (
    <svg viewBox="0 0 100 100" {...p}>
      <defs>
        <radialGradient id={`${uid}a`} cx=".4" cy=".3"><stop offset="0" stopColor="#7EDB6A" /><stop offset="1" stopColor="#2E9B4F" /></radialGradient>
        <radialGradient id={`${uid}c`} cx=".4" cy=".3"><stop offset="0" stopColor="#5FC95E" /><stop offset="1" stopColor="#1F7A45" /></radialGradient>
      </defs>
      <ellipse cx="50" cy="88" rx="40" ry="8" fill="#0F3D24" opacity=".3" />
      <circle cx="30" cy="62" r="24" fill={`url(#${uid}c)`} />
      <circle cx="70" cy="62" r="24" fill={`url(#${uid}c)`} />
      <circle cx="50" cy="44" r="28" fill={`url(#${uid}a)`} />
      <circle cx="50" cy="70" r="22" fill={`url(#${uid}a)`} />
      <circle cx="40" cy="34" r="7" fill="#B6F29A" opacity=".55" />
      <circle cx="68" cy="52" r="3.5" fill="#FF8FB1" /><circle cx="30" cy="58" r="3" fill="#FFE27A" /><circle cx="56" cy="74" r="3" fill="#FFFFFF" />
    </svg>
  );
}

export function RocketSprite({ uid = "k", flame = true, ...p }: P & { flame?: boolean }) {
  return (
    <svg viewBox="0 0 100 140" {...p}>
      <defs>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#C9D3E6" /><stop offset=".45" stopColor="#FFFFFF" /><stop offset="1" stopColor="#9AA8C4" /></linearGradient>
        <linearGradient id={`${uid}w`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B79BFF" /><stop offset="1" stopColor="#6A47E0" /></linearGradient>
        <radialGradient id={`${uid}g`} cx=".35" cy=".35"><stop offset="0" stopColor="#E3F6FF" /><stop offset="1" stopColor="#3C9EEB" /></radialGradient>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF5B8" /><stop offset=".5" stopColor="#FFB23E" /><stop offset="1" stopColor="#FF5A36" stopOpacity="0" /></linearGradient>
      </defs>
      {flame && <path className="rk-flame" d="M38 104 Q50 140 62 104 Z" fill={`url(#${uid}f)`} />}
      <path d="M30 70 L10 100 L12 108 L32 96 Z" fill={`url(#${uid}w)`} />
      <path d="M70 70 L90 100 L88 108 L68 96 Z" fill={`url(#${uid}w)`} />
      <path d="M50 4 C72 24 74 60 68 100 L32 100 C26 60 28 24 50 4 Z" fill={`url(#${uid}h)`} stroke="#8592B0" strokeWidth="1.5" />
      <path d="M50 4 C60 13 66 24 68 34 L32 34 C34 24 40 13 50 4 Z" fill={`url(#${uid}w)`} />
      <circle cx="50" cy="56" r="11" fill="#5A6888" /><circle cx="50" cy="56" r="8.5" fill={`url(#${uid}g)`} />
      <ellipse cx="47" cy="53" rx="3" ry="2" fill="#fff" opacity=".85" />
      <rect x="44" y="96" width="12" height="10" rx="2" fill="#5A6888" />
      <path d="M50 80 L50 98" stroke={`url(#${uid}w)`} strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

const ROCK_PATHS = [
  "M50 6 L78 14 L95 40 L90 72 L66 94 L32 92 L9 70 L6 38 L24 14 Z",
  "M44 5 L74 9 L96 33 L94 66 L72 92 L38 96 L12 78 L4 46 L18 18 Z",
  "M56 4 L86 20 L96 52 L82 84 L50 96 L20 86 L4 58 L12 24 L32 8 Z",
];
/** Астероид: түсі мен пішіні әртүрлі. */
export function AsteroidSprite({ uid = "a", hue = 260, shape = 0, ...p }: P & { hue?: number; shape?: number }) {
  const d = ROCK_PATHS[shape % ROCK_PATHS.length];
  return (
    <svg viewBox="0 0 100 100" {...p}>
      <defs>
        <radialGradient id={`${uid}r`} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor={`hsl(${hue} 70% 72%)`} /><stop offset=".6" stopColor={`hsl(${hue} 55% 46%)`} /><stop offset="1" stopColor={`hsl(${hue} 60% 24%)`} /></radialGradient>
        <radialGradient id={`${uid}c`} cx=".4" cy=".35"><stop offset="0" stopColor={`hsl(${hue} 50% 26%)`} /><stop offset="1" stopColor={`hsl(${hue} 55% 40%)`} /></radialGradient>
      </defs>
      <path d={d} fill={`url(#${uid}r)`} stroke={`hsl(${hue} 80% 80%)`} strokeOpacity=".55" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="32" cy="36" rx="10" ry="8" fill={`url(#${uid}c)`} />
      <ellipse cx="66" cy="62" rx="13" ry="10" fill={`url(#${uid}c)`} />
      <ellipse cx="42" cy="72" rx="6" ry="5" fill={`url(#${uid}c)`} />
      <ellipse cx="68" cy="28" rx="5" ry="4" fill={`url(#${uid}c)`} />
      <path d="M22 22 Q34 12 50 12" stroke="#fff" strokeOpacity=".5" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Ғарыш фоны: жұлдыздар, тұмандық, планета (параллакс үшін қабаттар). */
export function SpaceBackdrop() {
  const stars = Array.from({ length: 70 }, (_, i) => ({ x: (i * 97.13) % 100, y: (i * 61.7 + (i % 7) * 13) % 100, r: (i % 5 === 0 ? 1.6 : i % 3 === 0 ? 1.1 : 0.7), d: (i % 6) * 0.7 }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,#5B2FA8_0%,transparent_55%),radial-gradient(ellipse_at_15%_80%,#123E8C_0%,transparent_55%),linear-gradient(180deg,#0B0E2A,#120A35_60%,#070A1F)]" />
      <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute right-10 top-10 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.18} fill="#fff" className="space-twinkle" style={{ animationDelay: `${s.d}s` }} />)}
      </svg>
      <div className="absolute -right-16 -bottom-24 h-64 w-64 sm:h-80 sm:w-80 rounded-full bg-[radial-gradient(circle_at_30%_30%,#FFD27A,#E6A817_45%,#8A4B0B)] shadow-[0_0_80px_#E6A81755]">
        <div className="absolute left-[-30%] top-[46%] h-[14%] w-[160%] -rotate-12 rounded-[50%] border-[6px] border-amber-200/50" />
      </div>
      <div className="absolute left-[8%] top-[14%] h-10 w-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,#9FE7FF,#2A7BD6_60%,#123C7A)]" />
    </div>
  );
}
