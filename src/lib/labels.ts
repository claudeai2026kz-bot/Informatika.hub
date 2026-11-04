export const GRADES = [5, 6, 7, 8, 9, 10, 11] as const;
export const QUARTER_LABELS: Record<number, string> = { 1: "I тоқсан", 2: "II тоқсан", 3: "III тоқсан", 4: "IV тоқсан" };

export const MATERIAL_TYPES = [
  { key: "PRESENTATION", name: "Презентациялар", one: "Презентация", icon: "slides" },
  { key: "VIDEO", name: "Бейнесабақтар", one: "Бейнесабақ", icon: "video" },
  { key: "PRACTICE", name: "Практикалық тапсырмалар", one: "Практикалық тапсырма", icon: "task" },
  { key: "KMZH", name: "ҚМЖ", one: "ҚМЖ", icon: "plan" },
  { key: "RESOURCE", name: "Қосымша ресурстар", one: "Қосымша ресурс", icon: "book" },
  { key: "INTERACTIVE", name: "Интерактивті тапсырмалар", one: "Интерактивті тапсырма", icon: "spark" },
  { key: "GAME_LINK", name: "Ойындар (гемификация)", one: "Ойын (гемификация)", icon: "game" },
] as const;

export const ABBR: Record<string, string> = {
  ҚМЖ: "Қысқа мерзімді жоспар",
  БЖБ: "Бөлім бойынша жиынтық бағалау",
  ТЖБ: "Тоқсан бойынша жиынтық бағалау",
};

export const GAME_TYPES = [
  { key: "QUIZ", name: "Тест сұрақтары", desc: "Бірнеше нұсқаның ішінен дұрыс жауапты таңда" },
  { key: "MATCHING", name: "Сәйкестендіру", desc: "Ұғымдар мен анықтамаларды жұптастыр" },
  { key: "CROSSWORD", name: "Сөзжұмбақ", desc: "Сұрақтарға жауап беріп, торды толтыр" },
  { key: "RAPID", name: "Жылдам сұрақтар", desc: "Уақыт шектеулі, жылдам ойла" },
  { key: "LOGIC", name: "Логикалық тапсырмалар", desc: "Ойлан да, жауабын жаз" },
  { key: "CODING", name: "Программалау тапсырмалары", desc: "Кодтың нәтижесін анықта не толықтыр" },
] as const;

export function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

const MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
export function formatDate(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export const GRADE_STYLES = [
  "from-rose-100 to-white text-rose-500 border-rose-100",
  "from-orange-100 to-white text-orange-500 border-orange-100",
  "from-amber-100 to-white text-amber-600 border-amber-100",
  "from-emerald-100 to-white text-emerald-600 border-emerald-100",
  "from-teal-100 to-white text-teal-600 border-teal-100",
  "from-sky-100 to-white text-sky-600 border-sky-100",
  "from-lilac-100 to-white text-lilac-500 border-lilac-100",
];
