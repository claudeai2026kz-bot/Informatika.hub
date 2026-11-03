import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseQuery } from "@/lib/assistant-parse";
import { MATERIAL_TYPES, QUARTER_LABELS } from "@/lib/labels";

const body = z.object({ message: z.string().trim().min(1).max(500) });

type Item = { title: string; href: string; meta: string };

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ reply: "Сұрағыңызды жазыңыз 🙂" }, { status: 400 });
  const msg = parsed.data.message;
  const p = parseQuery(msg);

  if (p.help && !p.grade && !p.typeKey && !p.section) {
    return NextResponse.json({
      reply: "Мен сізге материал табуға көмектесемін. Мысалы: «7-сынып II тоқсан Python презентация» немесе «9-сынып БЖБ» деп жазыңыз. Төмендегі батырмалар арқылы бөлімдерге де өтуге болады.",
      links: [
        { href: "/materials", label: "Материалдар" },
        { href: "/assessments", label: "БЖБ / ТЖБ" },
        { href: "/games", label: "Ойындар" },
      ],
    });
  }
  if (p.nav && !p.grade && !p.typeKey && !p.section) {
    return NextResponse.json({ reply: `«${p.nav.label}» бөлімін ашайын ба?`, links: [p.nav] });
  }

  const textOr = (fields: string[]) =>
    p.terms.length ? { AND: p.terms.map((t) => ({ OR: fields.map((f) => ({ [f]: { contains: t, mode: "insensitive" } })) })) } : {};
  const quarterWhere = p.quarter ? { quarter: { number: p.quarter } } : {};
  const ctx = [p.grade && `${p.grade}-сынып`, p.quarter && QUARTER_LABELS[p.quarter]].filter(Boolean).join(", ");
  let items: Item[] = [];
  let what = "";
  let more = "/materials";

  if (p.section === "assessments") {
    what = p.assessmentKind === "TZHB" ? "ТЖБ" : p.assessmentKind === "BZHB" ? "БЖБ" : "жиынтық бағалау";
    const where: Prisma.AssessmentWhereInput = {
      published: true, ...(p.grade && { gradeId: p.grade }), ...quarterWhere, ...(p.assessmentKind && { kind: p.assessmentKind }),
      ...(p.terms.length && { AND: p.terms.map((t) => ({ OR: [{ title: { contains: t, mode: "insensitive" as const } }, { description: { contains: t, mode: "insensitive" as const } }, { topic: { title: { contains: t, mode: "insensitive" as const } } }] })) }),
    };
    const rows = await db.assessment.findMany({ where, take: 6, orderBy: { createdAt: "desc" }, include: { quarter: true } });
    items = rows.map((a) => ({ title: a.title, href: `/assessments/${a.id}`, meta: `${a.gradeId}-сынып · ${QUARTER_LABELS[a.quarter.number]} · ${a.variant}` }));
    const qs = new URLSearchParams({ ...(p.grade && { grade: String(p.grade) }), ...(p.quarter && { quarter: String(p.quarter) }), ...(p.assessmentKind && { kind: p.assessmentKind }) });
    more = `/assessments?${qs}`;
  } else if (p.section === "games") {
    what = "ойын";
    const rows = await db.game.findMany({
      where: { published: true, ...(p.grade && { gradeId: p.grade }), ...textOr(["title", "description"]) },
      take: 6, orderBy: { createdAt: "desc" },
    });
    items = rows.map((g) => ({ title: g.title, href: `/games/${g.id}`, meta: `${g.gradeId}-сынып` }));
    more = `/games${p.grade ? `?grade=${p.grade}` : ""}`;
  } else {
    const type = MATERIAL_TYPES.find((t) => t.key === p.typeKey);
    what = type ? type.one.toLowerCase() : "материал";
    const where: Prisma.MaterialWhereInput = {
      published: true, ...(p.grade && { gradeId: p.grade }), ...quarterWhere, ...(p.typeKey && { type: { key: p.typeKey } }),
      ...(p.terms.length && { AND: p.terms.map((t) => ({ OR: [{ title: { contains: t, mode: "insensitive" as const } }, { description: { contains: t, mode: "insensitive" as const } }, { topic: { title: { contains: t, mode: "insensitive" as const } } }, { topic: { section: { contains: t, mode: "insensitive" as const } } }] })) }),
    };
    const rows = await db.material.findMany({ where, take: 6, orderBy: [{ downloads: "desc" }, { createdAt: "desc" }], include: { quarter: true, type: true } });
    items = rows.map((m) => ({ title: m.title, href: `/materials/${m.id}`, meta: `${m.gradeId}-сынып · ${QUARTER_LABELS[m.quarter.number]} · ${m.type.name}` }));
    const qs = new URLSearchParams({ ...(p.grade && { grade: String(p.grade) }), ...(p.quarter && { quarter: String(p.quarter) }), ...(p.typeKey && { type: p.typeKey }), ...(p.terms.length && { q: p.terms.join(" ") }) });
    more = `/materials?${qs}`;
  }

  if (!p.grade && !p.quarter && !p.typeKey && !p.section && p.terms.length === 0) {
    return NextResponse.json({ reply: "Сұрағыңызды толығырақ жазыңызшы. Мысалы: «8-сынып алгоритм презентация»." });
  }

  const reply = items.length
    ? `Таптым! ${ctx ? ctx + " бойынша " : ""}${items.length} ${what} шықты 👇`
    : `Өкінішке қарай, ${ctx ? ctx + " бойынша " : ""}сұранысыңызға сай ${what} табылмады. Сүзгіні кеңейтіп көрейік.`;
  return NextResponse.json({ reply, items, links: [{ href: more, label: "Барлық нәтижені көру" }] });
}
