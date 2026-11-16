import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/**
 * Барлық мұғалімге бірдей көрінетін жарияланған мазмұн (тоқсандар, тақырыптар, материалдар, БЖБ/ТЖБ).
 * Дерекқорға әр кірген сайын бармас үшін сервер кэшінде сақталады — көп адам бір уақытта кірсе де
 * дерекқорға жүктеме түспейді. Әкімші мазмұнды өзгерткенде revalidateTag(CATALOG_TAG) кэшті жаңартады,
 * әйтпесе 5 минут сайын өзі жаңарады.
 */
export const CATALOG_TAG = "catalog";
const opts = { tags: [CATALOG_TAG], revalidate: 300 };

export const getGradeQuarters = unstable_cache(
  (g: number) => db.quarter.findMany({ where: { gradeId: g }, orderBy: { number: "asc" }, include: { _count: { select: { topics: true } } } }),
  ["grade-quarters"], opts,
);

export const getQuarterTopics = unstable_cache(
  (quarterId: number) => db.topic.findMany({
    where: { quarterId },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    include: { materials: { where: { published: true }, select: { type: { select: { key: true } } } } },
  }),
  ["quarter-topics"], opts,
);

export const getQuarterAssessments = unstable_cache(
  (quarterId: number) => db.assessment.findMany({
    where: { quarterId, published: true },
    orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
    select: { id: true, kind: true, title: true, variant: true, published: true, topic: { select: { title: true } } },
  }),
  ["quarter-assessments"], opts,
);

/** Тақырып беті (әкімші емес көрініс). Күндер кэште мәтінге айналатындықтан, олар қолданылмайды. */
export const getPublishedTopic = unstable_cache(
  async (id: number) => {
    const topic = await db.topic.findUnique({
      where: { id },
      include: {
        quarter: true,
        materials: { where: { published: true }, orderBy: { createdAt: "asc" }, include: { type: true } },
        games: { where: { published: true }, select: { id: true, title: true } },
      },
    });
    if (!topic) return null;
    const siblings = await db.topic.findMany({ where: { quarterId: topic.quarterId }, orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true, title: true } });
    return { topic, siblings };
  },
  ["published-topic"], opts,
);
