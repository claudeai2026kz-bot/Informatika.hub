import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CURRICULUM, REMOVED, SECTIONS } from "./curriculum";
import { importContent } from "./import-content";
import { importGames } from "./games";

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

  // Тақырыптар: бар болса өзгертілмейді, жоқтары қосылады.
  for (const [g, quarters] of Object.entries(CURRICULUM))
    for (const [q, titles] of Object.entries(quarters)) {
      const quarter = await db.quarter.findUniqueOrThrow({ where: { gradeId_number: { gradeId: Number(g), number: Number(q) } } });
      const section = SECTIONS[`${g}-${q}`] ?? null;
      for (const [i, title] of titles.entries()) {
        const found = await db.topic.findFirst({ where: { quarterId: quarter.id, title } });
        if (!found) await db.topic.create({ data: { quarterId: quarter.id, title, order: i + 1, section } });
        else if (found.order !== i + 1 || found.section !== section) await db.topic.update({ where: { id: found.id }, data: { order: i + 1, section } });
      }
    }

  for (const r of REMOVED) {
    const t = await db.topic.findFirst({
      where: { title: r.title, quarter: { gradeId: r.grade, number: r.quarter } },
      include: { _count: { select: { materials: true, assessments: true, games: true } } },
    });
    if (!t) continue;
    if (t._count.materials + t._count.assessments + t._count.games === 0) await db.topic.delete({ where: { id: t.id } });
    else console.log(`Өшірілмеді (материалы бар): ${r.title}`);
  }

  await importContent(db);
  await importGames(db);

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
