import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const TYPES = [
  ["PRESENTATION", "Презентация"],
  ["VIDEO", "Бейнесабақ"],
  ["PRACTICE", "Практикалық тапсырма"],
  ["KMZH", "ҚМЖ"],
  ["RESOURCE", "Қосымша ресурс"],
  ["INTERACTIVE", "Интерактивті тапсырма"],
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

  if (process.env.SEED_DEMO === "1") await (await import("./demo")).seedDemo(db);
}

main().finally(() => db.$disconnect());
