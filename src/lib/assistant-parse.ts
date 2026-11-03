/** Робот-көмекшінің сұранысты талдауы. Таза функция, сондықтан тестпен тексеріледі. */

export type ParsedQuery = {
  grade?: number;
  quarter?: number;
  typeKey?: string; // MaterialType.key
  section?: "assessments" | "games";
  assessmentKind?: "BZHB" | "TZHB";
  nav?: { href: string; label: string };
  help?: boolean;
  terms: string[];
};

const ROMAN: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4 };
const ORDINAL: Record<string, number> = { бірінші: 1, екінші: 2, үшінші: 3, төртінші: 4 };
const GRADE_WORDS: Record<string, number> = { бесінші: 5, алтыншы: 6, жетінші: 7, сегізінші: 8, тоғызыншы: 9, оныншы: 10, "он бірінші": 11 };

const TYPE_WORDS: [RegExp, string][] = [
  [/презентац|слайд/, "PRESENTATION"],
  [/бейне|видео/, "VIDEO"],
  [/қмж|жоспар/, "KMZH"],
  [/практика|жаттығу|тапсырма/, "PRACTICE"],
  [/ресурс|кітап|сілтеме/, "RESOURCE"],
  [/интерактив/, "INTERACTIVE"],
];

const NAV: [RegExp, string, string][] = [
  [/таңдаул/, "/favorites", "Таңдаулылар"],
  [/профил/, "/profile", "Профиль"],
  [/баптау|параметр/, "/settings", "Баптаулар"],
  [/хабарлама/, "/notifications", "Хабарламалар"],
  [/әкімші|админ/, "/admin", "Әкімші панелі"],
];

const STOP = new Set([
  "робот", "маған", "тауып", "берші", "бер", "беріңіз", "табу", "тап", "керек", "қажет", "көрсет", "көрсетші", "ашшы", "аш",
  "сыныптың", "сынып", "сыныпқа", "сыныпта", "тоқсан", "тоқсанның", "тоқсанындағы", "тоқсандағы", "тоқсанда", "бойынша", "туралы",
  "арналған", "және", "мен", "пен", "бен", "қандай", "бар", "ма", "ме", "ба", "бе", "па", "пе", "пожалуйста", "сәлем", "сәлеметсіз",
  "материал", "материалдар", "материалын", "материалды", "іздеу", "ізде", "қайда", "мына", "осы", "бір", "керекті", "қажетті",
]);

/** «презентациясын», «презентациялар» сияқты жалғауларды жуық түрде алып тастау. */
export function stem(w: string) {
  return w.replace(/(ларындағы|леріндегі|тарындағы|теріндегі|ындағы|індегі|дағы|дегі|тағы|тегі|ларын|лерін|тарын|терін|ларды|лерді|тарды|терді|лары|лері|тары|тері|лар|лер|тар|тер|дар|дер|ның|нің|дың|дің|тың|тің|сын|сін|ын|ін|ға|ге|қа|ке|да|де|та|те|ны|ні|ды|ді|ты|ті|сы|сі)$/u, "") || w;
}

export function parseQuery(input: string): ParsedQuery {
  let s = ` ${input.toLowerCase().replace(/[«»"“”.,!?;:()]/g, " ").replace(/\s+/g, " ")} `;
  const out: ParsedQuery = { terms: [] };

  const g = s.match(/\b(5|6|7|8|9|10|11)\s*-?\s*(?:сынып\S*|кл\S*)/u) ?? s.match(/(?:^|\s)(5|6|7|8|9|10|11)\s*-?\s*(?:ші|шы|інші|ыншы)\b/u);
  if (g) { out.grade = +g[1]; s = s.replace(g[0], " "); }
  else for (const [w, n] of Object.entries(GRADE_WORDS)) if (s.includes(` ${w} `) && /сынып/.test(s)) { out.grade = n; s = s.replace(w, " "); break; }

  const q = s.match(/(?:^|\s)(iv|iii|ii|i|[1-4])\s*-?\s*(?:ші|шы|інші|ыншы)?\s*тоқсан\S*/u);
  if (q) { out.quarter = ROMAN[q[1]] ?? +q[1]; s = s.replace(q[0], " "); }
  else for (const [w, n] of Object.entries(ORDINAL)) if (new RegExp(`${w}\\s+тоқсан`).test(s)) { out.quarter = n; s = s.replace(w, " "); break; }

  if (/бжб/.test(s)) { out.section = "assessments"; out.assessmentKind = "BZHB"; s = s.replace(/бжб\S*/g, " "); }
  else if (/тжб/.test(s)) { out.section = "assessments"; out.assessmentKind = "TZHB"; s = s.replace(/тжб\S*/g, " "); }
  else if (/жиынтық бағалау/.test(s)) out.section = "assessments";
  else if (/ойын|викторина|сөзжұмбақ|квиз|тест\b|тесті/.test(s)) { out.section = "games"; s = s.replace(/ойын\S*|тест\S*/g, " "); }

  if (!out.section) for (const [re, key] of TYPE_WORDS) {
    const m = s.match(new RegExp(`\\S*(?:${re.source})\\S*`, "u"));
    if (m) { out.typeKey = key; s = s.replace(m[0], " "); break; }
  }

  for (const [re, href, label] of NAV) if (re.test(s)) { out.nav = { href, label }; break; }
  if (/қалай|көмек|не істей|түсіндір|нұсқаулық/.test(s)) out.help = true;

  out.terms = s
    .split(" ")
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem)
    .filter((w) => w.length > 1 && !STOP.has(w));
  return out;
}
