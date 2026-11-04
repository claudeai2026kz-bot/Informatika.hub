/** Кіру бетінің фондағы суреті: желі сызықтары, ноутбук (код), кітаптар, гүл. Таза SVG, сурет файлы жоқ. */
export default function AuthScene() {
  const code = [
    [0, 30, "#C084FC"], [36, 50, "#60A5FA"], [92, 24, "#F472B6"],
    [12, 46, "#34D399"], [64, 34, "#60A5FA"],
    [12, 28, "#FBBF24"], [46, 60, "#C084FC"],
    [24, 40, "#60A5FA"], [70, 30, "#F472B6"],
    [24, 54, "#A5B4FC"],
    [12, 36, "#34D399"], [54, 44, "#60A5FA"],
    [0, 26, "#C084FC"],
    [12, 50, "#FBBF24"], [68, 36, "#A5B4FC"],
    [24, 32, "#F472B6"], [62, 48, "#60A5FA"],
  ] as const;
  const rows = [0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 8];
  return (
    <svg aria-hidden viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="as-glow1" cx="30%" cy="20%" r="60%"><stop offset="0" stopColor="#4F46E5" stopOpacity=".55" /><stop offset="1" stopColor="#0B1230" stopOpacity="0" /></radialGradient>
        <radialGradient id="as-glow2" cx="75%" cy="65%" r="55%"><stop offset="0" stopColor="#9333EA" stopOpacity=".35" /><stop offset="1" stopColor="#0B1230" stopOpacity="0" /></radialGradient>
        <linearGradient id="as-screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#131A3A" /><stop offset="1" stopColor="#0A0F26" /></linearGradient>
        <linearGradient id="as-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B4470" /><stop offset="1" stopColor="#1C2347" /></linearGradient>
        <linearGradient id="as-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A2150" /><stop offset="1" stopColor="#0B1030" /></linearGradient>
        <filter id="as-blur"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id="as-soft"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <rect width="1440" height="900" fill="#0B1230" />
      <rect width="1440" height="900" fill="url(#as-glow1)" />
      <rect width="1440" height="900" fill="url(#as-glow2)" />

      {/* желі */}
      <g stroke="#8B9CFF" strokeOpacity=".22" strokeWidth="1">
        {[[620,90,760,40],[760,40,900,120],[900,120,1040,60],[1040,60,1180,140],[760,40,840,210],[840,210,900,120],[840,210,1000,260],[1000,260,1040,60],[1000,260,1180,140],[1180,140,1320,90],[1180,140,1260,300],[1260,300,1000,260],[620,90,700,230],[700,230,840,210]].map(([a,b,c,d],i)=><line key={i} x1={a} y1={b} x2={c} y2={d} />)}
      </g>
      <g fill="#C7D2FE">
        {[[620,90],[760,40],[900,120],[1040,60],[1180,140],[840,210],[1000,260],[1320,90],[1260,300],[700,230]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3?2.5:4} opacity={i%2?.6:.9} />)}
      </g>
      {/* боке */}
      <g filter="url(#as-soft)">
        <circle cx="1350" cy="420" r="40" fill="#A78BFA" opacity=".25" />
        <circle cx="120" cy="300" r="30" fill="#60A5FA" opacity=".2" />
        <circle cx="560" cy="520" r="24" fill="#F472B6" opacity=".15" />
      </g>

      {/* үстел */}
      <rect x="0" y="770" width="1440" height="130" fill="url(#as-desk)" />
      <rect x="0" y="768" width="1440" height="3" fill="#6D7BFF" opacity=".25" />

      {/* кітаптар (оң жақта) */}
      <g>
        {[["#24306B",1110,690,300],["#3A2C6E",1125,650,270],["#1E3A6E",1100,612,310],["#2C2560",1118,578,280],["#33407A",1130,546,260]].map(([c,x,y,w],i)=>(
          <g key={i}><rect x={x as number} y={y as number} width={w as number} height={i===0?80:36} rx="5" fill={c as string} /><rect x={x as number} y={(y as number)+4} width="8" height={i===0?72:28} fill="#fff" opacity=".08" /></g>
        ))}
      </g>

      {/* гүл */}
      <g transform="translate(330 610)">
        <path d="M30 160 h60 l-8 70 h-44z" fill="#1F2A55" />
        {[[-30,-60,-20],[10,-90,10],[50,-70,35],[-10,-30,-40],[70,-30,50],[25,-40,0]].map(([x,y,r],i)=>(
          <ellipse key={i} cx={60+x} cy={150+y} rx="16" ry="46" fill={i%2?"#1E7A55":"#26966A"} transform={`rotate(${r} ${60+x} ${150+y+40})`} />
        ))}
      </g>

      {/* ноутбук */}
      <g transform="translate(470 470)">
        <rect x="0" y="0" width="560" height="320" rx="16" fill="url(#as-metal)" />
        <rect x="14" y="14" width="532" height="292" rx="8" fill="url(#as-screen)" />
        <g transform="translate(36 40)">
          <circle cx="0" cy="0" r="4" fill="#F87171" /><circle cx="14" cy="0" r="4" fill="#FBBF24" /><circle cx="28" cy="0" r="4" fill="#34D399" />
          {code.map(([x,w,c],i)=><rect key={i} x={x*2.4} y={22+rows[i]*24} width={w*2.4} height="7" rx="3.5" fill={c} opacity=".85" />)}
        </g>
        <rect x="14" y="14" width="532" height="292" rx="8" fill="#7C8CFF" opacity=".06" />
        <path d="M-50 320 h660 l-30 28 h-600z" fill="#2A3263" />
        <rect x="230" y="320" width="100" height="8" rx="4" fill="#151B40" />
      </g>
      {/* экран жарығы */}
      <ellipse cx="750" cy="790" rx="320" ry="26" fill="#6D7BFF" opacity=".25" filter="url(#as-blur)" />
    </svg>
  );
}
