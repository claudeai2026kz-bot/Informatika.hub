"use client";
/* Мұғалімнің ойын құрастырушысы: жаңа ойын түрлерінің редакторлары. */
import { Plus, Trash2 } from "lucide-react";
import { mazeHasPath, type MazeLevel } from "@/lib/maze";
import { encode, cleanWord, type Cipher } from "@/lib/cipher";

type Q = { prompt: string; data: Record<string, unknown>; answer: unknown; explanation?: string; points: number };
type Upd = (p: Partial<Q>) => void;
type UpdD = (p: Record<string, unknown>) => void;

export const NEW_BLANKS: Record<string, () => Q> = {
  MAZE: () => ({ prompt: "Роботты жұлдызға жеткіз", data: { w: 6, h: 6, walls: [], start: 30, dir: 0, goal: 5 }, answer: 0, points: 1 }),
  PIXEL: () => ({ prompt: "Суретті кодқа айналдыр", data: { mode: "code", color: "#A78BFA" }, answer: Array.from({ length: 8 }, () => "00000000"), points: 1 }),
  SHOOTER: () => ({ prompt: "", data: { options: ["", "", "", ""] }, answer: 0, points: 1 }),
  TUGOFWAR: () => ({ prompt: "", data: { options: ["", "", "", ""] }, answer: 0, points: 1 }),
  DUEL: () => ({ prompt: "", data: { options: ["", "", "", ""] }, answer: 0, points: 1 }),
  LIVE: () => ({ prompt: "", data: { options: ["", "", "", ""] }, answer: 0, points: 1 }),
  ESCAPE: () => ({ prompt: "", data: { hint: "" }, answer: [""], points: 1 }),
  CIPHER: () => ({ prompt: "Құпия сөзді шифрла", data: { cipher: "caesar", shift: 3 }, answer: "", points: 2 }),
  BOARD: () => ({ prompt: "", data: { category: "" }, answer: "", points: 100 }),
  TEAMESCAPE: () => ({ prompt: "", data: { clues: ["", ""] }, answer: [""], points: 2 }),
};

const ARROWS = ["↑ жоғары", "→ оңға", "↓ төмен", "← солға"];

export function MazeEditor({ q, setD }: { q: Q; setD: UpdD }) {
  const L = q.data as unknown as MazeLevel & { tool?: string };
  const tool = (q.data.tool as string) ?? "wall";
  const walls = new Set(L.walls);
  const ok = mazeHasPath(L);
  function resize(w: number, h: number) {
    const map = (i: number) => { const x = i % L.w, y = Math.floor(i / L.w); return x < w && y < h ? y * w + x : -1; };
    const nw = L.walls.map(map).filter((i) => i >= 0);
    const s = map(L.start), g = map(L.goal);
    setD({ w, h, walls: nw, start: s >= 0 ? s : (h - 1) * w, goal: g >= 0 && g !== s ? g : w - 1 });
  }
  function click(i: number) {
    if (tool === "start") { if (i !== L.goal) setD({ start: i, walls: L.walls.filter((x) => x !== i) }); }
    else if (tool === "goal") { if (i !== L.start) setD({ goal: i, walls: L.walls.filter((x) => x !== i) }); }
    else if (i !== L.start && i !== L.goal) setD({ walls: walls.has(i) ? L.walls.filter((x) => x !== i) : [...L.walls, i] });
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-semibold">Ені<select className="input mt-1 h-10 w-24" value={L.w} onChange={(e) => resize(+e.target.value, L.h)}>{[4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label className="text-sm font-semibold">Биіктігі<select className="input mt-1 h-10 w-24" value={L.h} onChange={(e) => resize(L.w, +e.target.value)}>{[3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label className="text-sm font-semibold">Робот қарайды<select className="input mt-1 h-10 w-32" value={L.dir} onChange={(e) => setD({ dir: +e.target.value })}>{ARROWS.map((a, k) => <option key={k} value={k}>{a}</option>)}</select></label>
        <label className="text-sm font-semibold">Ең көп блок<input type="number" min={0} max={30} className="input mt-1 h-10 w-24" value={L.limit ?? 0} onChange={(e) => setD({ limit: +e.target.value || undefined })} /></label>
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Не қою керек">
        {[["wall", "🌳 Бұта"], ["start", "🤖 Робот"], ["goal", "⭐ Жұлдыз"]].map(([k, l]) => (
          <button key={k} type="button" role="radio" aria-checked={tool === k} onClick={() => setD({ tool: k })} className={`btn-sm rounded-xl border-2 px-3 font-semibold ${tool === k ? "border-sky-500 bg-sky-50" : "border-sky-100"}`}>{l}</button>
        ))}
      </div>
      <div className="grid w-full max-w-sm gap-1 rounded-xl bg-[#E9D9B8] p-1.5" style={{ gridTemplateColumns: `repeat(${L.w}, 1fr)` }}>
        {Array.from({ length: L.w * L.h }, (_, i) => (
          <button key={i} type="button" onClick={() => click(i)} aria-label={`${i % L.w + 1}:${Math.floor(i / L.w) + 1}`}
            className={`aspect-square rounded-md text-lg ${walls.has(i) ? "bg-emerald-500" : "bg-[#F7EBD3] hover:bg-white"}`}>
            {i === L.start ? "🤖" : i === L.goal ? "⭐" : walls.has(i) ? "🌳" : ""}
          </button>
        ))}
      </div>
      <p className={`text-sm font-semibold ${ok ? "text-emerald-600" : "text-rose-600"}`}>{ok ? "✓ Робот жұлдызға жете алады" : "✗ Жол жабық: робот жұлдызға жете алмайды"}</p>
      <p className="text-xs muted">«Ең көп блок» қойсаңыз, оқушы «Қайтала» блогын қолдануға мәжбүр болады. 0 — шектеусіз.</p>
    </div>
  );
}

const COLORS = ["#A78BFA", "#F472B6", "#F5C451", "#34D399", "#60A5FA", "#F87171"];
export function PixelEditor({ q, set, setD }: { q: Q; set: Upd; setD: UpdD }) {
  const rows = (q.answer as string[]) ?? [];
  const cols = rows[0]?.length ?? 8;
  const color = (q.data.color as string) ?? COLORS[0];
  const size = (r: number, c: number) => set({ answer: Array.from({ length: r }, (_, y) => Array.from({ length: c }, (_, x) => rows[y]?.[x] ?? "0").join("")) });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-semibold">Жол<select className="input mt-1 h-10 w-20" value={rows.length} onChange={(e) => size(+e.target.value, cols)}>{[5, 6, 7, 8, 9, 10].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label className="text-sm font-semibold">Баған<select className="input mt-1 h-10 w-20" value={cols} onChange={(e) => size(rows.length, +e.target.value)}>{[5, 6, 7, 8, 9, 10].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label className="text-sm font-semibold">Оқушы не істейді<select className="input mt-1 h-10" value={String(q.data.mode)} onChange={(e) => setD({ mode: e.target.value })}><option value="code">Суретке қарап, код жазады</option><option value="paint">Кодты оқып, сурет салады</option></select></label>
        <div className="flex gap-1.5 pb-1">{COLORS.map((c) => <button key={c} type="button" aria-label={`Түс ${c}`} onClick={() => setD({ color: c })} className={`h-8 w-8 rounded-full ${c === color ? "ring-4 ring-sky-300" : ""}`} style={{ background: c }} />)}</div>
      </div>
      <p className="text-sm muted">Шаршыларды басып, суретті салыңыз. Әр жол — {q.points} балл, барлығы {rows.length * q.points} балл.</p>
      <div className="grid w-full max-w-sm gap-1 rounded-xl bg-[#1d1f36] p-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {rows.flatMap((r, y) => r.split("").map((b, x) => (
          <button key={`${y}-${x}`} type="button" aria-label={`${y + 1}:${x + 1}`} className="aspect-square rounded" style={{ background: b === "1" ? color : "#34364f" }}
            onClick={() => set({ answer: rows.map((row, k) => (k === y ? row.slice(0, x) + (b === "1" ? "0" : "1") + row.slice(x + 1) : row)) })} />
        )))}
      </div>
    </div>
  );
}

export function LinesInput({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return <div><label className="label">{label}</label><textarea rows={2} className="input" value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} /></div>;
}

export function EscapeEditor({ q, set, setD, OptionsEditor }: { q: Q; set: Upd; setD: UpdD; OptionsEditor: React.ReactNode }) {
  const withOpts = Array.isArray(q.data.options);
  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm font-semibold">
        <label className="flex items-center gap-2"><input type="radio" checked={!withOpts} onChange={() => set({ data: { hint: q.data.hint ?? "" }, answer: [""] })} className="h-4 w-4 accent-sky-500" /> Жауабын жазады</label>
        <label className="flex items-center gap-2"><input type="radio" checked={withOpts} onChange={() => set({ data: { hint: q.data.hint ?? "", options: ["", "", ""] }, answer: 0 })} className="h-4 w-4 accent-sky-500" /> Нұсқадан таңдайды</label>
      </div>
      {withOpts ? OptionsEditor : <LinesInput label="Дұрыс жауап(тар) · бірнеше нұсқаны жаңа жолдан жазыңыз" value={(q.answer as string[]) ?? [""]} onChange={(v) => set({ answer: v })} />}
      <div><label className="label">Кеңес (міндетті емес)</label><input className="input" value={String(q.data.hint ?? "")} onChange={(e) => setD({ hint: e.target.value })} /></div>
    </div>
  );
}

export function CipherEditor({ q, set, setD }: { q: Q; set: Upd; setD: UpdD }) {
  const w = cleanWord(String(q.answer ?? ""));
  const c = (q.data.cipher as Cipher) ?? "caesar";
  const shift = Number(q.data.shift ?? 3);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div><label className="label">Құпия сөз</label><input className="input uppercase" value={String(q.answer ?? "")} maxLength={12} onChange={(e) => set({ answer: e.target.value.toUpperCase() })} /></div>
      <div><label className="label">Шифр</label><select className="input" value={c} onChange={(e) => setD({ cipher: e.target.value })}><option value="caesar">Цезарь (әріпті жылжыту)</option><option value="number">Әріп нөмірі (А=1)</option></select></div>
      {c === "caesar" && <div><label className="label">Неше орын жылжиды</label><input type="number" min={1} max={10} className="input" value={shift} onChange={(e) => setD({ shift: +e.target.value })} /></div>}
      {w.length >= 2 && <p className="sm:col-span-3 text-sm muted">Шифрланған түрі: <b className="font-mono text-ink">{encode(w, c, shift)}</b></p>}
    </div>
  );
}

export function TeamEscapeEditor({ q, set, setD }: { q: Q; set: Upd; setD: UpdD }) {
  const clues = (q.data.clues as string[]) ?? [];
  return (
    <div className="space-y-2">
      <p className="label !mb-0">Кеңес бөліктері (әр командаласқа біреуі көрінеді)</p>
      {clues.map((c, k) => (
        <div key={k} className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-100 text-sm font-bold text-gold-500">{k + 1}</span>
          <input className="input h-10" value={c} placeholder={`${k + 1}-бөлік`} onChange={(e) => setD({ clues: clues.map((x, j) => (j === k ? e.target.value : x)) })} />
          <button type="button" className="btn-ghost btn-sm !px-2" disabled={clues.length <= 1} aria-label="Бөлікті жою" onClick={() => setD({ clues: clues.filter((_, j) => j !== k) })}><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {clues.length < 4 && <button type="button" className="btn-soft btn-sm" onClick={() => setD({ clues: [...clues, ""] })}><Plus className="h-4 w-4" /> Бөлік қосу</button>}
      <LinesInput label="Есіктің коды (дұрыс жауап) · бірнеше нұсқаны жаңа жолдан" value={(q.answer as string[]) ?? [""]} onChange={(v) => set({ answer: v })} />
    </div>
  );
}

export function BoardEditor({ q, set, setD }: { q: Q; set: Upd; setD: UpdD }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px]">
      <div><label className="label">Тақырып (баған)</label><input className="input" value={String(q.data.category ?? "")} maxLength={40} placeholder="Мысалы: Python" onChange={(e) => setD({ category: e.target.value })} /></div>
      <div><label className="label">Дұрыс жауап (мұғалімге көрінеді)</label><input className="input" value={String(q.answer ?? "")} onChange={(e) => set({ answer: e.target.value })} /></div>
      <div><label className="label">Бағасы</label><select className="input" value={q.points} onChange={(e) => set({ points: +e.target.value })}>{[100, 200, 300, 400, 500].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
    </div>
  );
}
