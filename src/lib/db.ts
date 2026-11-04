import { PrismaClient } from "@prisma/client";

/**
 * Хостингте (serverless) әр сервер данасы аз байланыс ашуы керек.
 * Supabase pooler-і болса: транзакция режимі (6543), pgbouncer=true, connection_limit=1.
 */
function runtimeUrl(raw = process.env.DATABASE_URL) {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.hostname.endsWith("pooler.supabase.com")) {
      u.port = "6543";
      u.searchParams.set("pgbouncer", "true");
      if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "1");
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
