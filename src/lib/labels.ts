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
  { key: "QUIZ", mode: "solo", name: "Тест сұрақтары", desc: "Бірнеше нұсқаның ішінен дұрыс жауапты таңда" },
  { key: "MATCHING", mode: "solo", name: "Сәйкестендіру", desc: "Ұғымдар мен анықтамаларды жұптастыр" },
  { key: "CROSSWORD", mode: "solo", name: "Сөзжұмбақ", desc: "Сұрақтарға жауап беріп, торды толтыр" },
  { key: "RAPID", mode: "solo", name: "Жылдам сұрақтар", desc: "Уақыт шектеулі, жылдам ойла" },
  { key: "LOGIC", mode: "solo", name: "Логикалық тапсырмалар", desc: "Ойлан да, жауабын жаз" },
  { key: "CODING", mode: "solo", name: "Программалау тапсырмалары", desc: "Кодтың нәтижесін анықта не толықтыр" },
  { key: "TRUEFALSE", mode: "solo", name: "Дұрыс па, бұрыс па", desc: "Тұжырымның дұрыс не бұрыс екенін тез анықта" },
  { key: "CLIMB", mode: "solo", name: "Шыңға шық", desc: "Сұрақтар біртіндеп қиындайды, бір қате — өрмелеу тоқтайды" },
  { key: "ORDERING", mode: "solo", name: "Ретімен қой", desc: "Қадамдарды не код жолдарын дұрыс ретке қой" },
  { key: "MEMORY", mode: "solo", name: "Жұбын тап", desc: "Карточкаларды аударып, ұғым мен анықтаманы жұпта" },
  { key: "MAZE", mode: "solo", name: "Робот-лабиринт", desc: "Командалар құрастырып, роботты жұлдызға жеткіз" },
  { key: "PIXEL", mode: "solo", name: "Пиксель сурет", desc: "Суретті 0 мен 1 кодына айналдыр не кодтан сурет сал" },
  { key: "SHOOTER", mode: "solo", name: "Ғарыш атқышы", desc: "Дұрыс жауабы бар астероидты атып түсір" },
  { key: "ESCAPE", mode: "solo", name: "Қашу бөлмесі", desc: "Бөлмедегі жұмбақтарды шешіп, есікті аш" },
  { key: "TUGOFWAR", mode: "pair", name: "Арқан тарту", desc: "Тақтада екі оқушы не екі команда жарысады" },
  { key: "DUEL", mode: "pair", name: "Дуэль", desc: "Досыңа шақыру жібер, кім көп балл алады?" },
  { key: "CIPHER", mode: "pair", name: "Шифр жібер", desc: "Біреуің сөзді шифрлайсың, жұбың оны ашады" },
  { key: "LIVE", mode: "group", name: "Сынып жарысы", desc: "Бүкіл сынып телефоннан бір уақытта жауап береді" },
  { key: "BOARD", mode: "group", name: "Ұпай тақтасы", desc: "Командалар тақырып пен бағаны таңдап, ұпай жинайды" },
  { key: "TEAMESCAPE", mode: "group", name: "Командалық қашу бөлмесі", desc: "Әр мүшеде кодтың бір бөлігі ғана бар — бірігіп шешіңдер" },
] as const;

export type GameMode = "solo" | "pair" | "group";
export const GAME_MODES: { key: GameMode; name: string; desc: string }[] = [
  { key: "solo", name: "Жеке", desc: "Әр оқушы өзі ойнайды" },
  { key: "pair", name: "Жұппен", desc: "Екі оқушы бірге не бір-біріне қарсы" },
  { key: "group", name: "Топпен", desc: "Командалар мен бүкіл сынып" },
];
/** Сұрақтары «нұсқалы» ойындар: оларды Сынып жарысы не Арқан тарту түрінде де ойнауға болады. */
export const CHOICE_TYPES = ["QUIZ", "RAPID", "TRUEFALSE", "CLIMB", "SHOOTER", "TUGOFWAR", "DUEL", "LIVE"] as const;
export const isChoiceType = (t: string) => (CHOICE_TYPES as readonly string[]).includes(t);

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
