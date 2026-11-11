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
  { key: "TRUEFALSE", name: "Дұрыс па, бұрыс па", desc: "Тұжырымның дұрыс не бұрыс екенін тез анықта" },
  { key: "CLIMB", name: "Шыңға шық", desc: "Сұрақтар біртіндеп қиындайды, бір қате — өрмелеу тоқтайды" },
  { key: "ORDERING", name: "Ретімен қой", desc: "Қадамдарды не код жолдарын дұрыс ретке қой" },
  { key: "MEMORY", name: "Жұбын тап", desc: "Карточкаларды аударып, ұғым мен анықтаманы жұпта" },
] as const;

type Tr = (s: string) => string;
const same: Tr = (s) => s;

export function formatSize(bytes?: number | null, t: Tr = same) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} ${t("КБ")}`;
  return `${(bytes / 1024 / 1024).toFixed(1)} ${t("МБ")}`;
}

const MONTHS = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
export function formatDate(d: Date, t: Tr = same) {
  return `${d.getDate()} ${t(MONTHS[d.getMonth()])} ${d.getFullYear()}`;
}

export const GRADE_STYLES = [
  "from-[#3B6BFF] to-[#6E8CFF] text-white border-transparent shadow-[0_14px_30px_-14px_#3B6BFF]",
  "from-[#2F86F6] to-[#5FB0FF] text-white border-transparent shadow-[0_14px_30px_-14px_#2F86F6]",
  "from-[#0EA5E9] to-[#38C6F4] text-white border-transparent shadow-[0_14px_30px_-14px_#0EA5E9]",
  "from-[#06B6D4] to-[#3FE0EC] text-white border-transparent shadow-[0_14px_30px_-14px_#06B6D4]",
  "from-[#5B5CF0] to-[#8183FF] text-white border-transparent shadow-[0_14px_30px_-14px_#5B5CF0]",
  "from-[#7C5CF5] to-[#A78BFA] text-white border-transparent shadow-[0_14px_30px_-14px_#7C5CF5]",
  "from-[#9B4DEB] to-[#C084FC] text-white border-transparent shadow-[0_14px_30px_-14px_#9B4DEB]",
];
