import "server-only";
import { db } from "./db";

export async function loadTopicOpts() {
  const rows = await db.topic.findMany({ orderBy: [{ quarterId: "asc" }, { order: "asc" }], select: { id: true, title: true, quarter: { select: { gradeId: true, number: true } } } });
  return rows.map((r) => ({ id: r.id, title: r.title, grade: r.quarter.gradeId, quarter: r.quarter.number }));
}
