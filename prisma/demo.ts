/* Үлгі деректер: интерфейсті тексеруге арналған. Нақты мазмұн келгенде әкімші панелінен ауыстырылады. */
import type { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function tinyPdf(lines: string[]) {
  // Латын әріптерімен қарапайым PDF (стандартты Helvetica кириллицаны көрсетпейді).
  const text = lines.map((l, i) => `BT /F1 ${i === 0 ? 22 : 13} Tf 60 ${740 - i * 28} Td (${l.replace(/[()\\]/g, "")}) Tj ET`).join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offs: number[] = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return Buffer.from(out, "latin1");
}

export async function seedDemo(db: PrismaClient) {
  if ((await db.topic.count()) > 0) return console.log("Тақырыптар бар, үлгі деректер қосылмады.");
  const root = path.resolve(process.env.STORAGE_DIR ?? "./storage");
  await mkdir(path.join(root, "demo"), { recursive: true });
  const types = Object.fromEntries((await db.materialType.findMany()).map((t) => [t.key, t.id]));

  const plan: Record<number, Record<number, [string, string[]][]>> = {
    5: { 1: [["Информатика және ақпарат", ["Ақпарат дегеніміз не?", "Ақпарат түрлері", "Компьютердің құрылымы"]]] },
    7: {
      1: [["Компьютерлік жүйелер", ["Компьютердің негізгі құрылғылары", "Бағдарламалық жасақтама"]]],
      2: [["Python программалау", ["Python тіліне кіріспе", "Айнымалылар және деректер түрлері", "Шартты операторлар"]]],
    },
    9: { 3: [["Веб-жобалау", ["HTML негіздері", "CSS стильдері"]]] },
  };

  for (const [g, quarters] of Object.entries(plan)) {
    for (const [qn, sections] of Object.entries(quarters)) {
      const quarter = await db.quarter.findUniqueOrThrow({ where: { gradeId_number: { gradeId: +g, number: +qn } } });
      let order = 0;
      for (const [section, titles] of sections) {
        for (const title of titles) {
          const topic = await db.topic.create({ data: { quarterId: quarter.id, section, title, order: order++ } });
          const file = `demo/${topic.id}.pdf`;
          const pdf = tinyPdf([`Informatika Hub - ${g} grade`, `Demo material #${topic.id}`, "This is a sample PDF for testing the viewer."]);
          await writeFile(path.join(root, file), pdf);
          await db.material.createMany({
            data: [
              { title: `${title}: презентация`, description: `${g}-сынып, ${section}. Сабаққа арналған слайдтар (үлгі).`, typeId: types.PRESENTATION, gradeId: +g, quarterId: quarter.id, topicId: topic.id, filePath: file, fileName: `${title}.pdf`, fileMime: "application/pdf", fileSize: pdf.length, published: true, views: 20 + topic.id * 7, downloads: 5 + topic.id * 3 },
              { title: `${title}: ҚМЖ`, description: "Қысқа мерзімді жоспар (үлгі).", typeId: types.KMZH, gradeId: +g, quarterId: quarter.id, topicId: topic.id, filePath: file, fileName: `${title} ҚМЖ.pdf`, fileMime: "application/pdf", fileSize: pdf.length, published: true, views: 10 + topic.id * 4, downloads: 3 + topic.id * 2 },
              { title: `${title}: бейнесабақ`, description: "Тақырып бойынша қысқа бейнесабақ (үлгі сілтеме).", typeId: types.VIDEO, gradeId: +g, quarterId: quarter.id, topicId: topic.id, videoUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8", published: true, views: 8 + topic.id * 5 },
            ],
          });
        }
      }
    }
  }

  const q7 = await db.quarter.findUniqueOrThrow({ where: { gradeId_number: { gradeId: 7, number: 2 } } });
  const pyTopic = await db.topic.findFirst({ where: { quarterId: q7.id, title: "Шартты операторлар" } });
  const file = "demo/bzhb-7-2.pdf";
  const pdf = tinyPdf(["BZhB - 7 grade, II quarter", "Python: conditional statements", "Sample assessment"]);
  await writeFile(path.join(root, file), pdf);
  await db.assessment.create({
    data: { kind: "BZHB", title: "«Python программалау» бөлімі бойынша БЖБ", description: "Шартты операторлар мен айнымалылар (үлгі).", gradeId: 7, quarterId: q7.id, topicId: pyTopic?.id, filePath: file, fileName: "БЖБ 7-сынып II тоқсан.pdf", fileMime: "application/pdf", fileSize: pdf.length, answers: "1) B\n2) if x > 0:\n3) True", criteria: "Шартты операторды дұрыс қолданады", descriptors: "• if құрылымын жазады — 1 балл\n• шартты дұрыс құрады — 1 балл\n• нәтижені анықтайды — 1 балл", published: true },
  });
  await db.assessment.create({
    data: { kind: "TZHB", title: "II тоқсан бойынша ТЖБ", description: "Тоқсан бойынша жиынтық бағалау (үлгі).", gradeId: 7, quarterId: q7.id, variant: "1-нұсқа", filePath: file, fileName: "ТЖБ 7-сынып II тоқсан.pdf", fileMime: "application/pdf", fileSize: pdf.length, answers: "1) A  2) C  3) print()", published: true },
  });

  const quiz = await db.game.create({ data: { type: "QUIZ", title: "Python негіздері", description: "Айнымалылар мен шартты операторлар бойынша тест", gradeId: 7, topicId: pyTopic?.id, published: true } });
  await db.gameQuestion.createMany({
    data: [
      { gameId: quiz.id, order: 0, prompt: "Python тілінде экранға мәтін шығаратын функция қайсы?", data: { options: ["input()", "print()", "len()", "int()"] }, answer: 1 },
      { gameId: quiz.id, order: 1, prompt: "Шартты оператор қай сөзден басталады?", data: { options: ["for", "while", "if", "def"] }, answer: 2 },
      { gameId: quiz.id, order: 2, prompt: "x = 5 болса, x > 3 өрнегінің мәні қандай?", data: { options: ["True", "False", "5", "Қате"] }, answer: 0 },
    ],
  });
  const match = await db.game.create({ data: { type: "MATCHING", title: "Компьютер құрылғылары", description: "Құрылғыны оның қызметімен сәйкестендір", gradeId: 7, published: true } });
  await db.gameQuestion.create({ data: { gameId: match.id, prompt: "Сәйкестендіріңіз", data: { left: ["Процессор", "Монитор", "Пернетақта", "Қатқыл диск"], right: ["Деректерді өңдейді", "Бейнені көрсетеді", "Мәтін енгізеді", "Деректерді сақтайды"] }, answer: [0, 1, 2, 3], points: 4 } });
  const cw = await db.game.create({ data: { type: "CROSSWORD", title: "Информатика сөзжұмбағы", description: "Негізгі терминдер", gradeId: 5, published: true } });
  await db.gameQuestion.createMany({
    data: [
      { gameId: cw.id, order: 0, prompt: "Ақпаратты өңдейтін электронды құрылғы", data: { row: 0, col: 0, dir: "across", len: 9 }, answer: "КОМПЬЮТЕР" },
      { gameId: cw.id, order: 1, prompt: "Мәтінді қағазға басып шығаратын құрылғы", data: { row: 0, col: 3, dir: "down", len: 7 }, answer: "ПРИНТЕР" },
    ],
  });
  const rapid = await db.game.create({ data: { type: "RAPID", title: "Жылдам сұрақтар: ақпарат", description: "Әр сұраққа 10 секунд", gradeId: 5, timeLimit: 10, published: true } });
  await db.gameQuestion.createMany({
    data: [
      { gameId: rapid.id, order: 0, prompt: "1 байт неше биттен тұрады?", data: { options: ["4", "8", "16", "2"] }, answer: 1 },
      { gameId: rapid.id, order: 1, prompt: "Енгізу құрылғысы қайсы?", data: { options: ["Принтер", "Монитор", "Пернетақта", "Колонка"] }, answer: 2 },
    ],
  });
  const logic = await db.game.create({ data: { type: "LOGIC", title: "Логикалық жұмбақтар", description: "Ойланып, жауабын жаз", gradeId: 6, published: true } });
  await db.gameQuestion.createMany({
    data: [
      { gameId: logic.id, order: 0, prompt: "Сан тізбегін жалғастыр: 1, 2, 4, 8, ?", data: {}, answer: ["16"], explanation: "Әр сан алдыңғысынан 2 есе үлкен." },
      { gameId: logic.id, order: 1, prompt: "Екілік жүйедегі 101 саны ондық жүйеде неге тең?", data: {}, answer: ["5"] },
    ],
  });
  const code = await db.game.create({ data: { type: "CODING", title: "Кодтың нәтижесі", description: "Бағдарлама экранға не шығарады?", gradeId: 7, topicId: pyTopic?.id, published: true } });
  await db.gameQuestion.createMany({
    data: [
      { gameId: code.id, order: 0, prompt: "Бағдарлама не шығарады?", data: { code: "x = 7\nif x % 2 == 0:\n    print(\"жұп\")\nelse:\n    print(\"тақ\")" }, answer: ["тақ"] },
      { gameId: code.id, order: 1, prompt: "Бағдарлама не шығарады?", data: { code: "s = 0\nfor i in range(4):\n    s += i\nprint(s)" }, answer: ["6"] },
    ],
  });
  console.log("Үлгі деректер қосылды.");
}
