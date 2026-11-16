import { PrismaClient } from "@prisma/client";

/**
 * Хостингте (serverless) әр сервер данасы аз байланыс ашуы керек.
 * Supabase pooler-і болса: транзакция режимі (6543), pgbouncer=true.
 * Бір сервер данасы бір мезгілде көп сұранысқа қызмет етеді (Vercel Fluid), сондықтан
 * connection_limit=1 болса, сұраныстар кезекте қалып, 10 с кейін 500 қатесі шығады.
 * Сол үшін кемінде 5 байланыс және ұзағырақ күту уақыты беріледі; pooler өзі
 * дерекқорға баратын нақты байланыстар санын шектейді.
 */
const MIN_CONNECTIONS = 5;
function runtimeUrl(raw = process.env.DATABASE_URL) {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.hostname.endsWith("pooler.supabase.com")) {
      u.port = "6543";
      u.searchParams.set("pgbouncer", "true");
      const limit = Number(u.searchParams.get("connection_limit"));
      if (!(limit >= MIN_CONNECTIONS)) u.searchParams.set("connection_limit", String(MIN_CONNECTIONS));
      if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "30");
      return u.toString();
    }
  } catch {
    /* URL дұрыс болмаса, өзгертпейміз */
  }
  return raw;
}

const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient({ datasourceUrl: runtimeUrl() });
g.prisma = db;
