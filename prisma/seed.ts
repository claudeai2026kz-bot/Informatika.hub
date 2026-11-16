import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CURRICULUM, REMOVED, RENAMED, SECTIONS } from "./curriculum";
import { importContent } from "./import-content";
import { importGames } from "./games";
import { hashOf, loadSeedState } from "./seed-state";

const db = new PrismaClient();

const TYPES = [
  ["PRESENTATION", "Презентация"],
  ["VIDEO", "Бейнесабақ"],
  ["PRACTICE", "Практикалық тапсырма"],
  ["KMZH", "ҚМЖ"],
  ["RESOURCE", "Қосымша ресурс"],
  ["INTERACTIVE", "Интерактивті тапсырма"],
  ["GAME_LINK", "Ойын (гемификация)"],
];

async function main() {
  await db.role.upsert({ where: { key: "USER" }, update: {}, create: { key: "USER", name: "Пайдаланушы" } });
  const admin = await db.role.upsert({ where: { key: "ADMIN" }, update: {}, create: { key: "ADMIN", name: "Әкімші" } });

  for (const [key, name] of TYPES) await db.materialType.upsert({ where: { key }, update: { name }, create: { key, name } });

  for (let g = 5; g <= 11; g++) {
    await db.grade.upsert({ where: { id: g }, update: {}, create: { id: g, title: `${g}-сынып` } });
    for (let q = 1; q <= 4; q++)
      await db.quarter.upsert({ where: { gradeId_number: { gradeId: g, number: q } }, update: {}, create: { gradeId: g, number: q } });
  }

  // Тақырыптар тізімі әр тоқсан үшін тек кодтағы тізім өзгергенде ғана қолданылады.
  // Әйтпесе әкімші сайттан өзгерткен тақырыптар (атауы, реті, жойылғаны) сақталады.
  const state = await loadSeedState(db);
  const qKeys = new Set<string>([
    ...Object.entries(CURRICULUM).flatMap(([g, qs]) => Object.keys(qs).map((q) => `${g}-${q}`)),
    ...RENAMED.map((r) => `${r.grade}-${r.quarter}`),
    ...REMOVED.map((r) => `${r.grade}-${r.quarter}`),
  ]);
  for (const k of qKeys) {
    const [g, q] = k.split("-").map(Number);
    const titles = (CURRICULUM as Record<string, Record<string, string[]>>)[String(g)]?.[String(q)] ?? [];
    const section = SECTIONS[k] ?? null;
    const renames = RENAMED.filter((r) => r.grade === g && r.quarter === q);
    const removed = REMOVED.filter((r) => r.grade === g && r.quarter === q);
    const hash = hashOf({ titles, section, renames, removed });
    if (state.has(`q:${k}`, hash)) continue;
    const quarter = await db.quarter.findUniqueOrThrow({ where: { gradeId_number: { gradeId: g, number: q } } });

    // Атауы өзгерген тақырыптар: материалдары сақталып, жаңа атауға ауысады.
    for (const r of renames) {
      const from = await db.topic.findFirst({ where: { quarterId: quarter.id, title: r.from } });
      if (from && !(await db.topic.findFirst({ where: { quarterId: quarter.id, title: r.to } }))) {
        await db.topic.update({ where: { id: from.id }, data: { title: r.to } });
        // Материал атауларындағы ескі тақырып атауын да жаңартамыз.
        for (const m of await db.material.findMany({ where: { topicId: from.id, title: { startsWith: `${r.from}:` } } }))
          await db.material.update({ where: { id: m.id }, data: { title: r.to + m.title.slice(r.from.length) } });
      }
    }

    // Тақырыптар: бар болса өзгертілмейді, жоқтары қосылады.
    for (const [i, title] of titles.entries()) {
      const found = await db.topic.findFirst({ where: { quarterId: quarter.id, title } });
      if (!found) await db.topic.create({ data: { quarterId: quarter.id, title, order: i + 1, section } });
      else if (found.order !== i + 1 || found.section !== section) await db.topic.update({ where: { id: found.id }, data: { order: i + 1, section } });
    }

    for (const r of removed) {
      const t = await db.topic.findFirst({
        where: { title: r.title, quarterId: quarter.id },
        include: { _count: { select: { materials: true, assessments: true, games: true } } },
      });
      if (!t) continue;
      if (t._count.materials + t._count.assessments + t._count.games === 0) await db.topic.delete({ where: { id: t.id } });
      else console.log(`Өшірілмеді (материалы бар): ${r.title}`);
    }
    await state.mark(`q:${k}`, hash);
  }

  await importContent(db, state);
  await importGames(db, state);

  // Бірінші әкімші тек осы жерде, ортаның айнымалылары арқылы жасалады.
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    await db.user.upsert({
      where: { email },
      update: { roleId: admin.id },
      create: { email, name: process.env.ADMIN_NAME ?? "Әкімші", passwordHash: await bcrypt.hash(password, 12), roleId: admin.id },
    });
    console.log(`Әкімші дайын: ${email}`);
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD берілмеген, әкімші жасалмады.");
  }

}

main().finally(() => db.$disconnect());
