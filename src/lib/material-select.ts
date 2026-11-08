/**
 * Материал карточкасына керек өрістер (серверде Prisma сұрауында қолданылады).
 * MaterialCard енді "use client" болғандықтан, бұл объект бөлек (серверлік) файлда тұруы керек.
 */
export const materialCardSelect = {
  id: true, title: true, description: true, gradeId: true, views: true, downloads: true, ratingAvg: true, ratingCount: true,
  fileName: true, videoUrl: true, type: { select: { key: true, name: true } }, quarter: { select: { number: true } }, topic: { select: { title: true } },
} as const;
