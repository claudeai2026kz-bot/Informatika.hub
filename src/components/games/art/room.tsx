/* «Қашу бөлмесі» көріністері: үш бөлме, әрқайсысында 3 зат және есік. */
export const ROOM_THEMES = [
  { name: "Құпия кітапхана", wall: ["#3A2670", "#22174A"], floor: ["#4A2F1C", "#2B1A10"], glow: "#A78BFA", accent: "#F5C451" },
  { name: "Ғылыми зертхана", wall: ["#0F4C5C", "#0A2E3A"], floor: ["#1F3A44", "#0F1E24"], glow: "#2EE6C5", accent: "#7DF9FF" },
  { name: "Ғарыш станциясы", wall: ["#1C2752", "#0B1030"], floor: ["#2A3158", "#121634"], glow: "#67B7F7", accent: "#FF7AC6" },
] as const;

/** Заттардың бөлмедегі орны (%): x, y, ені. */
export const ROOM_SLOTS = [{ x: 22, y: 63, w: 22 }, { x: 47, y: 80, w: 18 }, { x: 22, y: 27, w: 24 }];

export function RoomScene({ theme, open, uid }: { theme: number; open: boolean; uid: string }) {
  const th = ROOM_THEMES[theme % ROOM_THEMES.length];
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`${uid}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={th.wall[0]} /><stop offset="1" stopColor={th.wall[1]} /></linearGradient>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={th.floor[0]} /><stop offset="1" stopColor={th.floor[1]} /></linearGradient>
        <radialGradient id={`${uid}l`} cx=".5" cy=".2" r=".7"><stop offset="0" stopColor="#FFE7A8" stopOpacity=".45" /><stop offset="1" stopColor="#FFE7A8" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${uid}d`}><stop offset="0" stopColor={th.glow} stopOpacity=".9" /><stop offset="1" stopColor={th.glow} stopOpacity="0" /></radialGradient>
        <linearGradient id={`${uid}door`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6B4A2E" /><stop offset="1" stopColor="#4A311D" /></linearGradient>
      </defs>
      <rect width="1000" height="600" fill={`url(#${uid}w)`} />
      {/* қабырға жолақтары */}
      {Array.from({ length: 12 }, (_, k) => <rect key={k} x={k * 90} y="0" width="2" height="430" fill="#fff" opacity=".04" />)}
      <rect y="410" width="1000" height="22" fill="#000" opacity=".25" />
      <path d="M0 430 L1000 430 L1000 600 L0 600 Z" fill={`url(#${uid}f)`} />
      {Array.from({ length: 9 }, (_, k) => <line key={k} x1={500 + (k - 4) * 40} y1="430" x2={500 + (k - 4) * 260} y2="600" stroke="#000" strokeOpacity=".18" strokeWidth="2" />)}
      {/* терезе */}
      <g transform="translate(430 70)">
        <rect width="170" height="200" rx="85" fill="#0A0F2C" stroke="#1d1238" strokeWidth="10" />
        <circle cx="110" cy="70" r="26" fill="#FFF3C4" /><circle cx="122" cy="62" r="24" fill="#0A0F2C" />
        {[[30, 50], [60, 120], [140, 150], [40, 160], [95, 30]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="2.2" fill="#fff" className="space-twinkle" style={{ animationDelay: `${k * 0.5}s` }} />)}
        <line x1="85" y1="0" x2="85" y2="200" stroke="#1d1238" strokeWidth="8" /><line x1="0" y1="110" x2="170" y2="110" stroke="#1d1238" strokeWidth="8" />
      </g>
      {/* шам жарығы */}
      <ellipse cx="300" cy="160" rx="420" ry="320" fill={`url(#${uid}l)`} />
      <line x1="300" y1="0" x2="300" y2="60" stroke="#111" strokeWidth="3" />
      <path d="M270 60 L330 60 L345 92 L255 92 Z" fill={th.accent} /><circle cx="300" cy="98" r="9" fill="#FFF3C4" />
      {/* кілем */}
      <ellipse cx="460" cy="535" rx="300" ry="48" fill={th.glow} opacity=".22" />
      <ellipse cx="460" cy="535" rx="250" ry="36" fill="none" stroke={th.accent} strokeOpacity=".5" strokeWidth="4" strokeDasharray="14 10" />
      {/* сөре мен үстел */}
      <g transform="translate(110 120)">
        <rect width="250" height="14" rx="4" fill="#5B3A22" y="96" />
        {[0, 1, 2, 3, 4, 5, 6].map((k) => <rect key={k} x={18 + k * 30} y={96 - (50 + (k % 3) * 10)} width="24" height={50 + (k % 3) * 10} rx="3" fill={["#8B6CF0", "#3C9EEB", "#F5C451", "#EF5D7A", "#2EC27E", "#A78BFA", "#67B7F7"][k]} />)}
      </g>
      <g transform="translate(70 380)">
        <rect width="300" height="20" rx="6" fill="#6B4A2E" />
        <rect x="16" y="20" width="14" height="110" fill="#4A311D" /><rect x="270" y="20" width="14" height="110" fill="#4A311D" />
      </g>
      {/* есік */}
      <g transform="translate(740 150)">
        <ellipse cx="90" cy="150" rx="170" ry="210" fill={`url(#${uid}d)`} opacity={open ? 0.9 : 0.35} />
        <rect x="-8" y="-8" width="196" height="296" rx="10" fill="#2a1b10" />
        {open ? (
          <>
            <rect width="180" height="280" rx="6" fill="#FFF6D8" />
            <rect width="180" height="280" rx="6" fill={th.glow} opacity=".35" />
            <path d="M0 0 L60 20 L60 270 L0 280 Z" fill={`url(#${uid}door)`} />
          </>
        ) : (
          <>
            <rect width="180" height="280" rx="6" fill={`url(#${uid}door)`} />
            <rect x="20" y="20" width="140" height="105" rx="6" fill="none" stroke="#2d1d10" strokeWidth="6" />
            <rect x="20" y="145" width="140" height="115" rx="6" fill="none" stroke="#2d1d10" strokeWidth="6" />
            <circle cx="150" cy="140" r="9" fill={th.accent} />
          </>
        )}
      </g>
      {/* код құлпы */}
      <g transform="translate(940 270)">
        <rect width="44" height="66" rx="8" fill="#111827" stroke={open ? "#34D399" : th.glow} strokeWidth="3" />
        {Array.from({ length: 9 }, (_, k) => <rect key={k} x={7 + (k % 3) * 11} y={8 + Math.floor(k / 3) * 11} width="8" height="8" rx="2" fill={open ? "#34D399" : th.glow} opacity=".85" />)}
        <rect x="7" y="44" width="30" height="12" rx="3" fill={open ? "#34D399" : "#EF4444"} />
      </g>
    </svg>
  );
}

/** Басуға болатын заттар. */
export function RoomObject({ kind, uid }: { kind: number; uid: string }) {
  if (kind === 0) // ноутбук
    return (
      <svg viewBox="0 0 200 140" className="h-full w-full">
        <defs><linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7DD3FC" /><stop offset="1" stopColor="#3C9EEB" /></linearGradient></defs>
        <rect x="30" y="10" width="140" height="92" rx="8" fill="#1F2937" /><rect x="38" y="18" width="124" height="76" rx="4" fill={`url(#${uid}s)`} />
        <text x="100" y="52" textAnchor="middle" fontFamily="monospace" fontSize="16" fill="#0B2545" fontWeight="700">1011</text>
        <text x="100" y="76" textAnchor="middle" fontFamily="monospace" fontSize="12" fill="#0B2545">print(?)</text>
        <path d="M10 102 L190 102 L178 122 L22 122 Z" fill="#9CA3AF" /><rect x="80" y="104" width="40" height="6" rx="3" fill="#6B7280" />
      </svg>
    );
  if (kind === 1) // сандық
    return (
      <svg viewBox="0 0 200 150" className="h-full w-full">
        <defs><linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B7793D" /><stop offset="1" stopColor="#7A4B22" /></linearGradient></defs>
        <ellipse cx="100" cy="140" rx="90" ry="10" fill="#000" opacity=".35" />
        <path d="M14 56 Q14 14 100 14 Q186 14 186 56 Z" fill={`url(#${uid}c)`} stroke="#4A2C12" strokeWidth="4" />
        <rect x="14" y="56" width="172" height="80" rx="6" fill={`url(#${uid}c)`} stroke="#4A2C12" strokeWidth="4" />
        <rect x="40" y="14" width="14" height="122" fill="#F5C451" opacity=".9" /><rect x="146" y="14" width="14" height="122" fill="#F5C451" opacity=".9" />
        <rect x="84" y="50" width="32" height="38" rx="6" fill="#F5C451" stroke="#B7791F" strokeWidth="3" /><circle cx="100" cy="66" r="5" fill="#4A2C12" /><rect x="98" y="68" width="4" height="10" fill="#4A2C12" />
      </svg>
    );
  // сейф / кітап
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full">
      <defs><linearGradient id={`${uid}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F472B6" /><stop offset="1" stopColor="#8B6CF0" /></linearGradient></defs>
      <g transform="rotate(-8 100 75)">
        <rect x="30" y="20" width="140" height="110" rx="8" fill={`url(#${uid}b)`} stroke="#4C1D95" strokeWidth="4" />
        <rect x="30" y="20" width="18" height="110" rx="4" fill="#4C1D95" opacity=".6" />
        <text x="108" y="84" textAnchor="middle" fontSize="44" fontWeight="900" fill="#FFF7D6">?</text>
      </g>
    </svg>
  );
}
