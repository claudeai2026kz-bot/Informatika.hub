import { getCurrentUser } from "@/lib/auth";
import { loadGradebook } from "@/lib/classes";
import { buildXlsx, type Cell } from "@/lib/xlsx";

/** Сынып журналын .xlsx файлы ретінде жүктеу (Excel). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Жүйеге кіріңіз", { status: 401 });
  const book = await loadGradebook((await params).id, user.id);
  if (!book) return new Response("Табылмады", { status: 404 });
  const { cls, games, rows, gameAvg } = book;

  // Әр ойынның ең көп баллы (тақырыпқа жазамыз, ұяшықта — тек сан, Excel-де есептеуге ыңғайлы)
  const maxOf = games.map((_, k) => Math.max(0, ...rows.map((r) => r.cells[k]?.max ?? 0)) || null);
  const header: Cell[] = ["№", "Оқушы", ...games.map((g, k) => (maxOf[k] ? `${g.title} (${maxOf[k]} балл)` : g.title)), "Барлығы (балл)", "Ең көп балл", "Орташа (%)"];
  const body: Cell[][] = rows.map((r, i) => [
    i + 1,
    r.student.name,
    ...r.cells.map((c, k) => (c ? (c.max === maxOf[k] ? c.score : `${c.score}/${c.max}`) : "")),
    r.done ? r.sum : "",
    r.done ? r.max : "",
    r.avg === null ? "" : Math.round(r.avg * 100),
  ]);
  const played = rows.filter((r) => r.avg !== null);
  const avgAll = played.length ? Math.round((played.reduce((a, r) => a + (r.avg ?? 0), 0) / played.length) * 100) : "";
  const footer: Cell[] = ["", "Сынып орташасы (%)", ...gameAvg.map((a) => (a.avg === null ? "" : Math.round(a.avg * 100))), "", "", avgAll];

  const file = buildXlsx(cls.name, [header, ...body, [], footer], [5, 28, ...games.map(() => 16), 14, 12, 12]);
  const date = new Date().toISOString().slice(0, 10);
  const fname = `${cls.name} журнал ${date}.xlsx`.replace(/[\\/:*?"<>|«»]/g, "");
  return new Response(file as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="class.xlsx"; filename*=UTF-8''${encodeURIComponent(fname)}`,
      "Cache-Control": "no-store",
    },
  });
}
