"use client";
import { useMemo, useState, useTransition } from "react";
import { Plus, Search, Check } from "lucide-react";
import { addGameToClass } from "@/app/actions/classes";
import { GAME_ICONS } from "@/components/games/icons";
import { GAME_TYPES, GRADES } from "@/lib/labels";
import { useT } from "@/lib/i18n/client";

type G = { id: string; title: string; type: keyof typeof GAME_ICONS; grade: number; mine: boolean };

export default function AddGamePicker({ classId, grade, games }: { classId: string; grade: number; games: G[] }) {
  const t = useT();
  const [g, setG] = useState<number | 0>(grade);
  const [q, setQ] = useState("");
  const [mine, setMine] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [err, setErr] = useState<string>();
  const [, start] = useTransition();
  const list = useMemo(() => games.filter((x) => (!g || x.grade === g) && (!mine || x.mine) && (!q || x.title.toLowerCase().includes(q.toLowerCase()))), [games, g, q, mine]);

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <select className="input w-24" value={g} onChange={(e) => setG(Number(e.target.value))} aria-label={t("Сынып")}>
          <option value={0}>{t("Барлығы")}</option>
          {GRADES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Іздеу")} aria-label={t("Ойын іздеу")} />
        </div>
      </div>
      <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> {t("Тек менің ойындарым")}</label>
      {err && <p className="mt-2 text-sm text-rose-600">{t(err)}</p>}
      <ul className="mt-3 max-h-[420px] overflow-y-auto divide-y divide-sky-50 rounded-xl border border-sky-100">
        {list.length === 0 && <li className="p-4 text-sm muted text-center">{t("Ойын табылмады")}</li>}
        {list.map((x) => {
          const I = GAME_ICONS[x.type];
          const added = done.includes(x.id);
          const gt = GAME_TYPES.find((k) => k.key === x.type);
          return (
            <li key={x.id} className="flex items-center gap-2.5 px-3 py-2.5">
              <I className="h-4 w-4 shrink-0 text-lilac-500" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold leading-snug line-clamp-2">{x.title}</div>
                <div className="text-xs muted">{gt && t(gt.name)} · {t("{g}-сынып", { g: x.grade })}{x.mine ? ` · ${t("менікі")}` : ""}</div>
              </div>
              <button type="button" disabled={added || busy === x.id} className={`btn-sm shrink-0 ${added ? "btn-ghost text-emerald-700" : "btn-soft"}`} aria-label={t("Сыныпқа беру")}
                onClick={() => { setBusy(x.id); setErr(undefined); start(async () => { const r = await addGameToClass(classId, x.id); setBusy(null); if (r?.error) setErr(r.error); else setDone((d) => [...d, x.id]); }); }}>
                {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs muted">{t("Мұнда жеке ойнайтын ойындар ғана бар — олардың нәтижесі журналға түседі.")}</p>
    </div>
  );
}
