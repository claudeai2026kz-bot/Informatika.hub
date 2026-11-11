"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { saveGame } from "@/app/actions/admin";
import { saveMyGame } from "@/app/actions/my-games";
import { GAME_MODES, GAME_TYPES, GRADES } from "@/lib/labels";
import { NEW_BLANKS, MazeEditor, PixelEditor, EscapeEditor, CipherEditor, TeamEscapeEditor, BoardEditor } from "./GameEditorExtras";
import { FormAlert } from "../ui/Field";
import type { TopicOpt } from "./CurriculumSelect";

type Q = { prompt: string; data: Record<string, unknown>; answer: unknown; explanation?: string; points: number };
export type GameDraft = { id?: string; type: string; title: string; description: string; grade: number; topicId: number | null; timeLimit: number | null; published: boolean; questions: Q[] };

const PAIRS = (t: string) => t === "MATCHING" || t === "MEMORY";

const CHOICE = ["QUIZ", "RAPID", "CLIMB", "SHOOTER", "TUGOFWAR", "DUEL", "LIVE"];
const blank = (type: string): Q => {
  if (NEW_BLANKS[type]) return NEW_BLANKS[type]();
  switch (type) {
    case "TRUEFALSE": return { prompt: "", data: { options: ["Дұрыс", "Бұрыс"] }, answer: 0, points: 1 };
    case "ORDERING": return { prompt: "Дұрыс ретке қойыңыз", data: { items: ["", "", ""] }, answer: [], points: 1 };
    case "MEMORY": return { prompt: "Жұбын тап", data: { left: ["", ""], right: ["", ""] }, answer: [], points: 1 };
    case "QUIZ": case "RAPID": case "CLIMB": return { prompt: "", data: { options: ["", "", "", ""] }, answer: 0, points: 1 };
    case "MATCHING": return { prompt: "Сәйкестендіріңіз", data: { left: ["", ""], right: ["", ""] }, answer: [], points: 1 };
    case "CROSSWORD": return { prompt: "", data: { row: 0, col: 0, dir: "across" }, answer: "", points: 1 };
    case "CODING": return { prompt: "Бағдарлама не шығарады?", data: { code: "" }, answer: [""], points: 1 };
    default: return { prompt: "", data: {}, answer: [""], points: 1 };
  }
};

/** mode="teacher": мұғалімнің өз ойыны — жариялау/ұпай жасырын, сөзжұмбақ сөздерінің орнын сайт өзі табады. */
export default function GameEditor({ initial, topics, mode = "admin", copyOf = false }: { initial: GameDraft | null; topics: TopicOpt[]; mode?: "admin" | "teacher"; copyOf?: boolean }) {
  const teacher = mode === "teacher";
  const [g, setG] = useState<GameDraft>(initial ?? { type: "QUIZ", title: "", description: "", grade: 7, topicId: null, timeLimit: 10, published: true, questions: [blank("QUIZ")] });
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>();
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (p: Partial<GameDraft>) => setG((s) => ({ ...s, ...p }));
  const setQ = (i: number, p: Partial<Q>) => setG((s) => ({ ...s, questions: s.questions.map((q, k) => (k === i ? { ...q, ...p } : q)) }));
  const setD = (i: number, p: Record<string, unknown>) => setQ(i, { data: { ...g.questions[i].data, ...p } });
  const move = (i: number, d: number) => setG((s) => { const q = [...s.questions]; const j = i + d; if (j < 0 || j >= q.length) return s; [q[i], q[j]] = [q[j], q[i]]; return { ...s, questions: q }; });
  const topicList = topics.filter((t) => t.grade === g.grade);

  function submit() {
    setMsg(undefined);
    start(async () => {
      const payload = { ...g, topicId: g.topicId || undefined, timeLimit: g.timeLimit || undefined };
      const editId = copyOf ? undefined : initial?.id;
      const r = teacher ? await saveMyGame(payload, editId) : await saveGame(payload, editId);
      setMsg(r);
      if (r?.ok) { router.push(teacher ? `/games/${(r as { id?: string }).id}?saved=1` : "/admin/games?saved=1"); router.refresh(); }
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const optionsEditor = (q: Q, i: number) => (
            <div className="space-y-2">
              <p className="label !mb-0">Жауап нұсқалары (дұрысын белгілеңіз)</p>
              {(q.data.options as string[]).map((o, k) => (
                <div key={k} className="flex items-center gap-2">
                  <input type="radio" name={`ans-${i}`} checked={q.answer === k} onChange={() => setQ(i, { answer: k })} className="h-5 w-5 accent-emerald-500" aria-label={`${k + 1}-нұсқа дұрыс`} />
                  <input className="input h-10" value={o} placeholder={`${k + 1}-нұсқа`} onChange={(e) => setD(i, { options: (q.data.options as string[]).map((x, j) => (j === k ? e.target.value : x)) })} />
                  <button type="button" className="btn-ghost btn-sm !px-2" disabled={(q.data.options as string[]).length <= 2} aria-label="Нұсқаны жою"
                    onClick={() => { const opts = (q.data.options as string[]).filter((_, j) => j !== k); setQ(i, { data: { ...q.data, options: opts }, answer: q.answer === k ? 0 : (q.answer as number) > k ? (q.answer as number) - 1 : q.answer }); }}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {(q.data.options as string[]).length < maxOpts && <button type="button" className="btn-soft btn-sm" onClick={() => setD(i, { options: [...(q.data.options as string[]), ""] })}><Plus className="h-4 w-4" /> Нұсқа қосу</button>}
            </div>
  );
  const maxOpts = g.type === "SHOOTER" ? 4 : 6;

  return (
    <div className="max-w-4xl space-y-5">
      <FormAlert msg={msg?.error} />
      <FormAlert tone="ok" msg={msg?.ok} />
      <section className="card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="type">Ойын түрі</label>
            <select id="type" className="input" value={g.type} disabled={!!initial && !copyOf} onChange={(e) => set({ type: e.target.value, questions: [blank(e.target.value)] })}>
              {GAME_MODES.map((m) => <optgroup key={m.key} label={m.name}>{GAME_TYPES.filter((t) => t.mode === m.key).map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}</optgroup>)}
            </select>
            {initial && !copyOf && <p className="mt-1 text-xs muted">Бар ойынның түрін өзгертуге болмайды.</p>}
          </div>
          <div><label className="label" htmlFor="title">Атауы *</label><input id="title" className="input" value={g.title} onChange={(e) => set({ title: e.target.value })} /></div>
        </div>
        <div><label className="label" htmlFor="desc">Сипаттамасы</label><input id="desc" className="input" value={g.description} onChange={(e) => set({ description: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label" htmlFor="grade">Сынып</label><select id="grade" className="input" value={g.grade} onChange={(e) => set({ grade: +e.target.value, topicId: null })}>{GRADES.map((x) => <option key={x} value={x}>{x}-сынып</option>)}</select></div>
          <div><label className="label" htmlFor="topic">Тақырып</label><select id="topic" className="input" value={g.topicId ?? 0} onChange={(e) => set({ topicId: +e.target.value || null })}><option value={0}>Тақырыпсыз</option>{topicList.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
          {(g.type === "RAPID" || g.type === "LIVE") && <div><label className="label" htmlFor="tl">Бір сұраққа уақыт (сек)</label><input id="tl" type="number" min={3} max={120} className="input" value={g.timeLimit ?? 10} onChange={(e) => set({ timeLimit: +e.target.value })} /></div>}
        </div>
        {!teacher && <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-sky-500" checked={g.published} onChange={(e) => set({ published: e.target.checked })} /> Жариялау</label>}
      </section>

      {g.type === "CLIMB" && <p className="rounded-xl bg-sky-50 p-4 text-sm text-sky-800">Сұрақтарды жеңілден қиынға қарай орналастырыңыз: оқушы бір қате жіберсе, ойын тоқтайды.</p>}
      {(() => {
        const pairs = PAIRS(g.type);
        const total = pairs ? (g.questions[0]?.data.left as string[] | undefined)?.length ?? 0
          : g.questions.reduce((s, q) => s + (g.type === "PIXEL" ? ((q.answer as string[])?.length ?? 0) * q.points : q.points), 0);
        return (
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 space-y-2">
            <p>
              {pairs ? `Жұптар саны: ${(g.questions[0]?.data.left as string[] | undefined)?.length ?? 0} · әр жұп 1 балл.` : `${g.type === "MAZE" ? "Деңгейлер" : g.type === "CIPHER" ? "Сөздер" : g.type === "TEAMESCAPE" ? "Есіктер" : "Сұрақтар"} саны: ${g.questions.length}.`}
              {" "}<b>Барлығы: {total} балл.</b>
              {g.type === "BOARD" ? " Ұпай тақтасында баллды ойын кезінде мұғалім өзі береді." : ""}
              {g.type === "CROSSWORD" && teacher ? " Тек сөз бен сұрақты жазыңыз, сөздердің торда қиылысатын орнын сайт өзі табады." : ""}
            </p>
            {!pairs && g.type !== "BOARD" && (
              <p className="flex flex-wrap items-center gap-2">
                <span>Әр {g.type === "PIXEL" ? "жолға" : "сұраққа"} бірдей балл қою:</span>
                {[1, 2, 5, 10].map((n) => <button key={n} type="button" className="rounded-lg bg-white px-2.5 py-1 font-bold shadow-sm hover:bg-emerald-100" onClick={() => set({ questions: g.questions.map((q) => ({ ...q, points: n })) })}>{n}</button>)}
                <span className="text-xs">· не әр сұрақтың «Балл» өрісін өзіңіз өзгертіңіз</span>
              </p>
            )}
          </div>
        );
      })()}
      {g.type === "CROSSWORD" && !teacher && (
        <p className="rounded-xl bg-sky-50 p-4 text-sm text-sky-800">Әр сөз үшін бірінші әрпінің орнын (жол мен баған, 0-ден бастап) және бағытын көрсетіңіз. Қиылысатын әріптер бірдей болуы керек, сақтағанда бұл тексеріледі.</p>
      )}

      {g.questions.map((q, i) => (
        <section key={i} className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{PAIRS(g.type) ? "Жұптар" : g.type === "CROSSWORD" || g.type === "CIPHER" ? `${i + 1}-сөз` : g.type === "MAZE" ? `${i + 1}-деңгей` : g.type === "PIXEL" ? `${i + 1}-сурет` : g.type === "TEAMESCAPE" ? `${i + 1}-есік` : `${i + 1}-сұрақ`}</h3>
            {!PAIRS(g.type) && (
              <div className="flex gap-1">
                <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => move(i, -1)} aria-label="Жоғары"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => move(i, 1)} aria-label="Төмен"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" className="btn-danger btn-sm !px-2" disabled={g.questions.length === 1} onClick={() => set({ questions: g.questions.filter((_, k) => k !== i) })} aria-label="Жою"><Trash2 className="h-4 w-4" /></button>
              </div>
            )}
          </div>
          <div><label className="label">{g.type === "CROSSWORD" ? "Сұрақ (анықтама)" : "Сұрақ мәтіні"}</label><textarea rows={2} className="input" value={q.prompt} onChange={(e) => setQ(i, { prompt: e.target.value })} /></div>

          {g.type === "TRUEFALSE" && (
            <div className="flex gap-4">
              {["Дұрыс", "Бұрыс"].map((o, k) => (
                <label key={k} className="flex items-center gap-2 font-semibold"><input type="radio" name={`ans-${i}`} checked={q.answer === k} onChange={() => setQ(i, { answer: k })} className="h-5 w-5 accent-emerald-500" /> {o}</label>
              ))}
            </div>
          )}

          {g.type === "ORDERING" && (
            <div className="space-y-2">
              <p className="label !mb-0">Қадамдарды ДҰРЫС ретімен жазыңыз (ойында араласып шығады)</p>
              {(q.data.items as string[]).map((it, k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-100 text-sm font-bold text-sky-600">{k + 1}</span>
                  <input className="input h-10" value={it} placeholder={`${k + 1}-қадам`} onChange={(e) => setD(i, { items: (q.data.items as string[]).map((x, j) => (j === k ? e.target.value : x)) })} />
                  <button type="button" className="btn-ghost btn-sm !px-2" disabled={(q.data.items as string[]).length <= 3} aria-label="Қадамды жою" onClick={() => setD(i, { items: (q.data.items as string[]).filter((_, j) => j !== k) })}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {(q.data.items as string[]).length < 8 && <button type="button" className="btn-soft btn-sm" onClick={() => setD(i, { items: [...(q.data.items as string[]), ""] })}><Plus className="h-4 w-4" /> Қадам қосу</button>}
            </div>
          )}

          {CHOICE.includes(g.type) && optionsEditor(q, i)}
          {g.type === "MAZE" && <MazeEditor q={q} setD={(p) => setD(i, p)} />}
          {g.type === "PIXEL" && <PixelEditor q={q} set={(p) => setQ(i, p)} setD={(p) => setD(i, p)} />}
          {g.type === "ESCAPE" && <EscapeEditor q={q} set={(p) => setQ(i, p)} setD={(p) => setD(i, p)} OptionsEditor={Array.isArray(q.data.options) ? optionsEditor(q, i) : null} />}
          {g.type === "CIPHER" && <CipherEditor q={q} set={(p) => setQ(i, p)} setD={(p) => setD(i, p)} />}
          {g.type === "TEAMESCAPE" && <TeamEscapeEditor q={q} set={(p) => setQ(i, p)} setD={(p) => setD(i, p)} />}
          {g.type === "BOARD" && <BoardEditor q={q} set={(p) => setQ(i, p)} setD={(p) => setD(i, p)} />}

          {PAIRS(g.type) && (
            <div className="space-y-2">
              <p className="label !mb-0">Әр жолда сол жақ пен оған сәйкес оң жақ</p>
              {(q.data.left as string[]).map((l, k) => (
                <div key={k} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input className="input h-10" value={l} placeholder="Ұғым" onChange={(e) => setD(i, { left: (q.data.left as string[]).map((x, j) => (j === k ? e.target.value : x)) })} />
                  <input className="input h-10" value={(q.data.right as string[])[k]} placeholder="Анықтама" onChange={(e) => setD(i, { right: (q.data.right as string[]).map((x, j) => (j === k ? e.target.value : x)) })} />
                  <button type="button" className="btn-ghost btn-sm !px-2" disabled={(q.data.left as string[]).length <= 2} onClick={() => setD(i, { left: (q.data.left as string[]).filter((_, j) => j !== k), right: (q.data.right as string[]).filter((_, j) => j !== k) })} aria-label="Жұпты жою"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {(q.data.left as string[]).length < 12 && <button type="button" className="btn-soft btn-sm" onClick={() => setD(i, { left: [...(q.data.left as string[]), ""], right: [...(q.data.right as string[]), ""] })}><Plus className="h-4 w-4" /> Жұп қосу</button>}
            </div>
          )}

          {g.type === "CROSSWORD" && teacher && (
            <div><label className="label">Жауап (бір сөз)</label><input className="input uppercase" value={String(q.answer)} onChange={(e) => setQ(i, { answer: e.target.value.replace(/\s/g, "") })} /></div>
          )}
          {g.type === "CROSSWORD" && !teacher && (
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2"><label className="label">Жауап (бір сөз)</label><input className="input uppercase" value={String(q.answer)} onChange={(e) => setQ(i, { answer: e.target.value.replace(/\s/g, "") })} /></div>
              <div><label className="label">Жол / баған</label><div className="flex gap-1"><input type="number" min={0} max={30} className="input" value={Number(q.data.row)} onChange={(e) => setD(i, { row: +e.target.value })} aria-label="Жол" /><input type="number" min={0} max={30} className="input" value={Number(q.data.col)} onChange={(e) => setD(i, { col: +e.target.value })} aria-label="Баған" /></div></div>
              <div><label className="label">Бағыты</label><select className="input" value={String(q.data.dir)} onChange={(e) => setD(i, { dir: e.target.value })}><option value="across">Көлденең</option><option value="down">Тігінен</option></select></div>
            </div>
          )}

          {g.type === "CODING" && (
            <div><label className="label">Код</label><textarea rows={5} className="input font-mono text-sm" value={String(q.data.code ?? "")} onChange={(e) => setD(i, { code: e.target.value })} spellCheck={false} /></div>
          )}

          {(g.type === "LOGIC" || g.type === "CODING") && (
            <div>
              <label className="label">Дұрыс жауап(тар) · бірнеше нұсқаны жаңа жолдан жазыңыз</label>
              <textarea rows={2} className="input" value={(q.answer as string[]).join("\n")} onChange={(e) => setQ(i, { answer: e.target.value.split("\n") })} />
            </div>
          )}

          {!PAIRS(g.type) && g.type !== "BOARD" && (
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <div><label className="label">Түсіндірме (міндетті емес)</label><input className="input" value={q.explanation ?? ""} onChange={(e) => setQ(i, { explanation: e.target.value })} /></div>
              <div><label className="label">{g.type === "PIXEL" ? "Әр жолға балл" : "Балл"}</label><input type="number" min={1} max={100} className="input" value={q.points} onChange={(e) => setQ(i, { points: Math.max(1, Math.min(100, +e.target.value || 1)) })} /></div>
            </div>
          )}
        </section>
      ))}

      {!PAIRS(g.type) && <button type="button" className="btn-ghost" onClick={() => set({ questions: [...g.questions, blank(g.type)] })}><Plus className="h-4 w-4" /> {g.type === "CROSSWORD" || g.type === "CIPHER" ? "Сөз қосу" : g.type === "MAZE" ? "Деңгей қосу" : g.type === "PIXEL" ? "Сурет қосу" : g.type === "TEAMESCAPE" ? "Есік қосу" : "Сұрақ қосу"}</button>}

      <div className="flex gap-2 sticky bottom-4">
        <button type="button" onClick={submit} disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Ойынды сақтау</button>
        <Link href={teacher ? (initial?.id && !copyOf ? `/games/${initial.id}` : "/games/my") : "/admin/games"} className="btn-ghost">Болдырмау</Link>
      </div>
    </div>
  );
}
