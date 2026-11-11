import type { PrismaClient, GameType } from "@prisma/client";

/**
 * Дайын ойындар (5–11 сынып). Seed кезінде қосылады: бір ойын (сынып + атауы бойынша) екі рет қосылмайды.
 * Әкімші кейін оларды әкімші панелінен өзгерте не жаба алады.
 *  QUIZ / RAPID: options + answer (дұрыс нұсқаның индексі, 0-ден)
 *  MATCHING: бір сұрақ, left[i] ↔ right[i] (сайт оң жақты өзі араластырады)
 *  CODING / LOGIC: answer — қабылданатын жауап(тар), code — көрсетілетін код
 */
type Q = { prompt: string; options?: string[]; answer?: number | string | string[]; code?: string; explanation?: string };
type G = {
  type: GameType; grade: number; quarter: number; topic?: string; title: string; description: string; timeLimit?: number;
  questions?: Q[]; pairs?: { prompt: string; left: string[]; right: string[] };
};

export const GAMES: G[] = [
  {
    type: "QUIZ", grade: 5, quarter: 1, topic: "Екілік ақпаратты ұсыну", title: "Ақпарат және екілік код",
    description: "Ақпарат, бит және екілік код туралы 8 сұрақ.",
    questions: [
      { prompt: "Екілік кодта қандай цифрлар қолданылады?", options: ["0 және 1", "1 және 2", "0-ден 9-ға дейін", "Тек 1"], answer: 0 },
      { prompt: "Ақпараттың ең кіші өлшем бірлігі қалай аталады?", options: ["Байт", "Бит", "Килобайт", "Пиксель"], answer: 1 },
      { prompt: "1 байт неше биттен тұрады?", options: ["2", "4", "8", "10"], answer: 2 },
      { prompt: "Адам ақпаратты көзбен қабылдаса, ол қандай ақпарат?", options: ["Дыбыстық", "Көрнекі (визуалды)", "Иіс", "Дәм"], answer: 1 },
      { prompt: "Екілік жүйеде 10 саны ондық жүйеде нешеге тең?", options: ["10", "1", "2", "3"], answer: 2, explanation: "10₂ = 1·2 + 0 = 2" },
      { prompt: "Бағдаршамның түстері адамға қандай ақпарат береді?", options: ["Дыбыстық", "Мәтіндік", "Түрлі түсті белгі (көрнекі)", "Сандық"], answer: 2 },
      { prompt: "Ақпаратты шифрлаудың мақсаты қандай?", options: ["Файлды үлкейту", "Ақпаратты бөгде адамнан жасыру", "Суретті бояу", "Интернетті жылдамдату"], answer: 1 },
      { prompt: "Ақ-қара суретте 1 пиксельді сақтауға неше бит жеткілікті?", options: ["1 бит", "8 бит", "16 бит", "24 бит"], answer: 0, explanation: "Екі түс бар: 0 — ақ, 1 — қара." },
    ],
  },
  {
    type: "MATCHING", grade: 5, quarter: 2, topic: "Растрлық және векторлық суреттерді салыстыру", title: "Растрлық пе, векторлық па?",
    description: "Ұғымдарды анықтамасымен сәйкестендіріңіз.",
    pairs: {
      prompt: "Ұғым мен оның анықтамасын сәйкестендіріңіз",
      left: ["Пиксель", "Растрлық сурет", "Векторлық сурет", "Палитра", "Үлкейту"],
      right: [
        "Суреттің ең кішкентай нүктесі",
        "Нүктелерден (пиксельдерден) тұратын сурет",
        "Сызықтар мен фигуралардан тұратын сурет",
        "Сурет салуға арналған түстер жиыны",
        "Растрлық суретте сапасы төмендейтін әрекет",
      ],
    },
  },
  {
    type: "RAPID", grade: 5, quarter: 4, topic: "Интернетте жұмыс істеудің қандай қауіп-қатері бар?", title: "Интернеттегі қауіпсіздік: жылдам сұрақтар",
    description: "Әр сұраққа 15 секунд. Қауіпсіз әрекетті таңдаңыз.", timeLimit: 15,
    questions: [
      { prompt: "Бейтаныс адам құпиясөзіңізді сұрады. Не істейсіз?", options: ["Айтамын", "Айтпаймын, ата-анама айтамын", "Жартысын айтамын", "Достарыма жіберемін"], answer: 1 },
      { prompt: "Қай құпиясөз мықтырақ?", options: ["123456", "qwerty", "Asel2014", "T7#kp!Lm9q"], answer: 3 },
      { prompt: "Хатта «Сіз телефон ұттыңыз, сілтемені басыңыз» деп жазылған. Бұл не болуы мүмкін?", options: ["Алаяқтық", "Сыйлық", "Мұғалімнің хаты", "Жаңалық"], answer: 0 },
      { prompt: "Компьютерді вирустан не қорғайды?", options: ["Ойын", "Антивирус", "Принтер", "Тінтуір"], answer: 1 },
      { prompt: "Әлеуметтік желіге не салуға болмайды?", options: ["Сүйікті кітабыңыз", "Үйіңіздің мекенжайы", "Салған суретіңіз", "Мектептегі жетістік"], answer: 1 },
      { prompt: "Компьютерде ұзақ отырғанда не істеу керек?", options: ["Үзіліс жасап, көзге жаттығу", "Экранға жақындау", "Жарықты өшіру", "Ештеңе"], answer: 0 },
    ],
  },
  {
    type: "QUIZ", grade: 6, quarter: 1, topic: "Компьютер қалай жұмыс істейді", title: "Компьютер қалай жұмыс істейді?",
    description: "Компьютердің негізгі құрылғылары және операциялық жүйе.",
    questions: [
      { prompt: "Компьютердің «миы» деп қай құрылғыны айтады?", options: ["Монитор", "Процессор", "Пернетақта", "Колонка"], answer: 1 },
      { prompt: "Ақпаратты енгізу құрылғысын табыңыз.", options: ["Монитор", "Принтер", "Пернетақта", "Колонка"], answer: 2 },
      { prompt: "Ақпаратты шығару құрылғысын табыңыз.", options: ["Тінтуір", "Микрофон", "Сканер", "Принтер"], answer: 3 },
      { prompt: "Қайсысы операциялық жүйе?", options: ["Windows", "Word", "Paint", "Chrome"], answer: 0 },
      { prompt: "Компьютер өшкенде қай жадыдағы ақпарат өшіп қалады?", options: ["Қатты диск", "Жедел жады (ЖЖҚ)", "Флешка", "Бұлттық диск"], answer: 1 },
      { prompt: "Wi-Fi дегеніміз не?", options: ["Сымсыз желі", "Антивирус", "Мәтіндік редактор", "Ойын"], answer: 0 },
      { prompt: "Эргономика бойынша көз бен монитордың ара қашықтығы шамамен қанша болуы керек?", options: ["10–20 см", "50–70 см", "2 метр", "Маңызы жоқ"], answer: 1 },
    ],
  },
  {
    type: "CODING", grade: 6, quarter: 3, topic: "Арифметикалық амалдардың жазылу ережелері", title: "Python: не шығады?",
    description: "Кодты оқып, экранға не шығатынын жазыңыз.",
    questions: [
      { prompt: "Бұл программа экранға не шығарады?", code: "print(2 + 3 * 4)", answer: "14", explanation: "Алдымен көбейту: 3·4 = 12, сосын 2 + 12 = 14." },
      { prompt: "Бұл программа экранға не шығарады?", code: "print(17 // 5)", answer: "3", explanation: "// — бүтін бөлу." },
      { prompt: "Бұл программа экранға не шығарады?", code: "print(17 % 5)", answer: "2", explanation: "% — бөлгендегі қалдық." },
      { prompt: "Бұл программа экранға не шығарады?", code: "a = 5\nb = a * 2\nprint(b - 1)", answer: "9" },
      { prompt: "Бұл программа экранға не шығарады?", code: "print(2 ** 3)", answer: "8", explanation: "** — дәрежеге шығару." },
      { prompt: "Бұл программа экранға не шығарады?", code: "x = \"10\"\nprint(x + \"5\")", answer: "105", explanation: "Жолдар қосылғанда бір-біріне жалғанады." },
    ],
  },
  {
    type: "MATCHING", grade: 7, quarter: 1, topic: "Ақпараттың өлшем бірліктері", title: "Өлшем бірліктері мен файл форматтары",
    description: "Өлшем бірлігін немесе форматты сәйкестендіріңіз.",
    pairs: {
      prompt: "Сол жақтағысына сәйкесін табыңыз",
      left: ["1 байт", "1 Кбайт", "1 Мбайт", ".docx", ".mp3", ".jpg"],
      right: ["8 бит", "1024 байт", "1024 Кбайт", "Мәтіндік құжат", "Дыбыс файлы", "Сурет файлы"],
    },
  },
  {
    type: "QUIZ", grade: 7, quarter: 3, topic: "Тармақталған алгоритмдерді программалау", title: "Python: шартты оператор if",
    description: "Тармақталған алгоритмдер бойынша сұрақтар.",
    questions: [
      { prompt: "Python-да шартты оператор қай сөзден басталады?", options: ["for", "if", "print", "while"], answer: 1 },
      { prompt: "Мына код не шығарады?", code: "x = 7\nif x > 5:\n    print(\"Иә\")\nelse:\n    print(\"Жоқ\")", options: ["Иә", "Жоқ", "7", "Қате"], answer: 0 },
      { prompt: "«Тең емес» белгісі Python-да қалай жазылады?", options: ["<>", "=!", "!=", "=="], answer: 2 },
      { prompt: "Екі шарттың ЕКЕУІ ДЕ орындалуы керек болса, қай сөз қолданылады?", options: ["or", "not", "and", "elif"], answer: 2 },
      { prompt: "Үшінші, төртінші тармақ қосу үшін не жазамыз?", options: ["elif", "else if", "then", "case"], answer: 0 },
      { prompt: "a = 4 болса, (a % 2 == 0) шарты нені білдіреді?", options: ["a — тақ сан", "a — жұп сан", "a — теріс сан", "a нөлге тең"], answer: 1 },
      { prompt: "if жолының соңына қандай белгі қойылады?", options: [";", ".", ":", ","], answer: 2 },
    ],
  },
  {
    type: "CODING", grade: 8, quarter: 3, topic: "For циклі", title: "Циклдер: нәтижені тап",
    description: "for және while циклдері бар кодтың нәтижесін жазыңыз.",
    questions: [
      { prompt: "Программа неше рет «Сәлем» шығарады? (санды жазыңыз)", code: "for i in range(4):\n    print(\"Сәлем\")", answer: "4" },
      { prompt: "Соңғы шығатын сан қандай?", code: "for i in range(1, 6):\n    print(i)", answer: "5", explanation: "range(1, 6) — 1, 2, 3, 4, 5." },
      { prompt: "Программа не шығарады?", code: "s = 0\nfor i in range(1, 5):\n    s = s + i\nprint(s)", answer: "10", explanation: "1 + 2 + 3 + 4 = 10" },
      { prompt: "Программа не шығарады?", code: "n = 1\nwhile n < 20:\n    n = n * 2\nprint(n)", answer: "32", explanation: "1 → 2 → 4 → 8 → 16 → 32" },
      { prompt: "Программа не шығарады?", code: "for i in range(10):\n    if i == 3:\n        break\nprint(i)", answer: "3", explanation: "break циклді i = 3 болғанда тоқтатады." },
      { prompt: "Программа неше сан шығарады?", code: "for i in range(0, 10, 3):\n    print(i)", answer: "4", explanation: "0, 3, 6, 9" },
    ],
  },
  {
    type: "RAPID", grade: 8, quarter: 1, topic: "Заманауи кибер қауіп-қатер", title: "Кибер қауіптер: жылдам сұрақтар",
    description: "Әр сұраққа 15 секунд.", timeLimit: 15,
    questions: [
      { prompt: "Жалған сайт арқылы құпиясөз ұрлау қалай аталады?", options: ["Фишинг", "Форматтау", "Архивтеу", "Сканерлеу"], answer: 0 },
      { prompt: "Файлдарды шифрлап, ақша талап ететін вирус?", options: ["Браузер", "Шифрлаушы-бопсалаушы (ransomware)", "Драйвер", "Кэш"], answer: 1 },
      { prompt: "Екі факторлы аутентификация дегеніміз?", options: ["Екі компьютер", "Құпиясөз + қосымша код", "Екі браузер", "Екі пернетақта"], answer: 1 },
      { prompt: "Процессордың жиілігі немен өлшенеді?", options: ["Гигагерц (ГГц)", "Гигабайт (Гб)", "Вольт", "Пиксель"], answer: 0 },
      { prompt: "Қоғамдық Wi-Fi-да не істемеген дұрыс?", options: ["Ауа райын қарау", "Банк қосымшасына кіру", "Жаңалық оқу", "Карта қарау"], answer: 1 },
      { prompt: "Спам дегеніміз не?", options: ["Пайдалы бағдарлама", "Сұралмаған жаппай хаттар", "Антивирус", "Файл форматы"], answer: 1 },
    ],
  },
  {
    type: "QUIZ", grade: 9, quarter: 3, topic: "Бірөлшемді массив", title: "Python: тізімдер (массивтер)",
    description: "Бірөлшемді массив бойынша 7 сұрақ.",
    questions: [
      { prompt: "a = [5, 8, 2, 9] болса, a[0] неге тең?", options: ["5", "8", "9", "Қате"], answer: 0, explanation: "Нөмірлеу 0-ден басталады." },
      { prompt: "a = [5, 8, 2, 9] болса, len(a) неге тең?", options: ["3", "4", "9", "24"], answer: 1 },
      { prompt: "a = [5, 8, 2, 9] болса, a[-1] неге тең?", options: ["5", "2", "9", "Қате"], answer: 2, explanation: "-1 — соңғы элемент." },
      { prompt: "Тізімнің соңына элемент қосатын әдіс?", options: ["add()", "append()", "insert_end()", "push()"], answer: 1 },
      { prompt: "a = [3, 1, 2]; a.sort() орындалғаннан кейін a неге тең?", options: ["[3, 2, 1]", "[1, 2, 3]", "[3, 1, 2]", "[2, 1, 3]"], answer: 1 },
      { prompt: "Тізімдегі ең үлкен элементті қай функция табады?", options: ["max()", "big()", "top()", "sum()"], answer: 0 },
      { prompt: "a = [1, 2, 3]; a.pop() орындалса, қай элемент жойылады?", options: ["1", "2", "3", "Бәрі"], answer: 2 },
    ],
  },
  {
    type: "MATCHING", grade: 9, quarter: 2, topic: "Деректер базасы", title: "Деректер базасы ұғымдары",
    description: "Деректер базасындағы ұғымдарды анықтамасымен сәйкестендіріңіз.",
    pairs: {
      prompt: "Ұғым мен анықтаманы сәйкестендіріңіз",
      left: ["Жазба", "Өріс", "Сұрыптау", "Сүзгі", "Кесте"],
      right: [
        "Кестенің бір жолы",
        "Кестенің бір бағаны",
        "Деректерді өсу не кему ретімен орналастыру",
        "Шартқа сай жазбаларды ғана көрсету",
        "Жолдар мен бағандардан тұратын деректер жиыны",
      ],
    },
  },
  {
    type: "LOGIC", grade: 10, quarter: 1, topic: "Бір санау жүйесінен екінші санау жүйесіне сандарды аудару", title: "Санау жүйелері және логика",
    description: "Сандарды аударып, логикалық өрнектің мәнін есептеңіз. Жауапты жазыңыз.",
    questions: [
      { prompt: "Ондық жүйедегі 13 санын екілік жүйеге аударыңыз.", answer: "1101" },
      { prompt: "Екілік 101010 санын ондық жүйеге аударыңыз.", answer: "42" },
      { prompt: "Ондық 255 санын он алтылық жүйеге аударыңыз.", answer: ["FF", "ff"] },
      { prompt: "A = 1, B = 0 болса, A ЖӘНЕ B (конъюнкция) неге тең? (0 немесе 1)", answer: "0" },
      { prompt: "A = 1, B = 0 болса, A НЕМЕСЕ B (дизъюнкция) неге тең? (0 немесе 1)", answer: "1" },
      { prompt: "ЕМЕС(1 ЖӘНЕ 1) неге тең? (0 немесе 1)", answer: "0" },
      { prompt: "Екі айнымалысы бар ақиқат кестесінде неше жол болады?", answer: "4", explanation: "2² = 4" },
    ],
  },
  {
    type: "QUIZ", grade: 10, quarter: 3, topic: "HTML негіздері және мәтінді пішімдеу", title: "HTML және CSS негіздері",
    description: "Веб-бет жасау бойынша 7 сұрақ.",
    questions: [
      { prompt: "Ең үлкен тақырып қай тегпен жазылады?", options: ["<h6>", "<h1>", "<head>", "<title>"], answer: 1 },
      { prompt: "Сілтеме қай тегпен жасалады?", options: ["<link>", "<a>", "<href>", "<url>"], answer: 1 },
      { prompt: "Суретті бетке қосатын тег?", options: ["<img>", "<pic>", "<src>", "<image>"], answer: 0 },
      { prompt: "Кестенің бір жолы қай тегпен жазылады?", options: ["<td>", "<th>", "<tr>", "<table>"], answer: 2 },
      { prompt: "CSS-те мәтін түсін қай қасиет өзгертеді?", options: ["background", "color", "font-size", "border"], answer: 1 },
      { prompt: "Бейне қосатын HTML тегі?", options: ["<movie>", "<media>", "<video>", "<play>"], answer: 2 },
      { prompt: "Бетке JavaScript коды қай тегпен қосылады?", options: ["<js>", "<code>", "<script>", "<style>"], answer: 2 },
    ],
  },
  {
    type: "RAPID", grade: 11, quarter: 1, topic: "Жасанды интеллект", title: "Жасанды интеллект: жылдам сұрақтар",
    description: "ЖИ, машиналық оқыту және нейрондық желілер. Әр сұраққа 15 секунд.", timeLimit: 15,
    questions: [
      { prompt: "Машиналық оқытуда модель неден үйренеді?", options: ["Деректерден", "Тек ережеден", "Пернетақтадан", "Ештеңеден"], answer: 0 },
      { prompt: "Нейрондық желінің негізгі элементі?", options: ["Пиксель", "Нейрон", "Транзистор", "Файл"], answer: 1 },
      { prompt: "Суреттегі мысықты тану — бұл қандай есеп?", options: ["Жіктеу (классификация)", "Сұрыптау", "Архивтеу", "Шифрлау"], answer: 0 },
      { prompt: "Жауаптары белгілі деректермен оқыту қалай аталады?", options: ["Мұғаліммен оқыту", "Мұғалімсіз оқыту", "Кездейсоқ оқыту", "Қолмен оқыту"], answer: 0 },
      { prompt: "Қайсысы ЖИ-ді қолданудың мысалы?", options: ["Дауыстық көмекші", "Қағаз кітап", "Калькулятордағы қосу", "Жарық шамы"], answer: 0 },
      { prompt: "Нейрондық желіде кіріс пен шығыс арасындағы қабат?", options: ["Жасырын қабат", "Негізгі қабат", "Соңғы қабат", "Бос қабат"], answer: 0 },
    ],
  },
];

export async function importGames(db: PrismaClient) {
  let added = 0;
  for (const g of GAMES) {
    if (await db.game.findFirst({ where: { gradeId: g.grade, title: g.title } })) continue;
    const topic = g.topic
      ? await db.topic.findFirst({ where: { title: g.topic, quarter: { gradeId: g.grade, number: g.quarter } }, select: { id: true } })
      : null;
    const questions = g.type === "MATCHING" && g.pairs
      ? [{ order: 0, prompt: g.pairs.prompt, data: { left: g.pairs.left, right: g.pairs.right }, answer: g.pairs.left.map((_, i) => i), points: g.pairs.left.length }]
      : (g.questions ?? []).map((q, i) => ({
          order: i,
          prompt: q.prompt,
          data: { ...(q.options ? { options: q.options } : {}), ...(q.code ? { code: q.code } : {}) },
          answer: q.answer as number | string | string[],
          explanation: q.explanation ?? null,
          points: 1,
        }));
    await db.game.create({
      data: {
        type: g.type, title: g.title, description: g.description, gradeId: g.grade, topicId: topic?.id ?? null,
        timeLimit: g.timeLimit ?? null, published: true, questions: { create: questions },
      },
    });
    added++;
  }
  if (added) console.log(`Ойындар: ${added} жаңа ойын қосылды.`);
}
