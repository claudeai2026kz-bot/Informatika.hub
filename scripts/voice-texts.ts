/**
 * Робот айтатын барлық мәтіннің бөліктерін (chunk) жинайды — алдын ала дауысқа жазу үшін.
 * npx tsx scripts/voice-texts.ts <out.json>
 */
import fs from "node:fs";
import path from "node:path";
import { chunksKk } from "../src/lib/kk-normalize";
import { MATERIAL_TYPES, QUARTER_LABELS } from "../src/lib/labels";

const root = path.join(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const texts = new Set<string>();

// 1) Компоненттердегі қазақша сөйлемдер
for (const f of ["src/components/AuthGuide.tsx", "src/components/assistant/Assistant.tsx", "src/app/api/assistant/route.ts"]) {
  for (const m of read(f).matchAll(/["`]([^"`$]*[а-яәғқңөұүі][^"`$]*)["`]/gi)) if (m[1].length >= 6) texts.add(m[1]);
}
// 2) Көмекші жауаптарының барлық нұсқалары
const whats = ["материал", "ойын", "БЖБ", "ТЖБ", "жиынтық бағалау", ...MATERIAL_TYPES.map((t) => t.one.toLowerCase())];
const ctxs = [""];
for (let g = 5; g <= 11; g++) { ctxs.push(`${g}-сынып`); for (const q of [1, 2, 3, 4]) ctxs.push(`${g}-сынып, ${QUARTER_LABELS[q]}`); }
for (const q of [1, 2, 3, 4]) ctxs.push(QUARTER_LABELS[q]);
for (const ctx of ctxs) for (const w of whats) {
  for (let n = 1; n <= 6; n++) texts.add(`Таптым! ${ctx ? ctx + " бойынша " : ""}${n} ${w} шықты`);
  texts.add(`Өкінішке қарай, ${ctx ? ctx + " бойынша " : ""}сұранысыңызға сай ${w} табылмады. Сүзгіні кеңейтіп көрейік.`);
}
for (const label of ["Материалдар", "БЖБ / ТЖБ", "Ойындар", "Таңдаулылар", "Профиль", "Баптаулар", "Хабарламалар"]) texts.add(`«${label}» бөлімін ашайын ба?`);
// 3) Материал атаулары мен тақырыптар
for (const m of JSON.parse(read("content/manifest.json")) as { topic?: string; title?: string }[]) {
  if (m.title) texts.add(m.title);
  if (!m.topic) continue;
  texts.add(m.topic);
  for (const t of MATERIAL_TYPES) texts.add(`${m.topic}: ${t.one.toLowerCase()}`);
}
for (const m of read("prisma/curriculum.ts").matchAll(/"([^"]*[а-яәғқңөұүі][^"]*)"/gi)) if (m[1].length >= 4) texts.add(m[1]);

const chunks = new Set<string>();
for (const t of texts) for (const c of chunksKk(t)) chunks.add(c.text);
fs.writeFileSync(process.argv[2] ?? "voice-chunks.json", JSON.stringify([...chunks], null, 0));
console.log("texts", texts.size, "unique chunks", chunks.size);
