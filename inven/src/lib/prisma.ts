import { PrismaClient } from "@/src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function getDatabaseConfig() {
  const rawUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/inven";
  try {
    const dbUrl = new URL(rawUrl);
    return {
      host: dbUrl.hostname || "localhost",
      port: Number(dbUrl.port) || 3306,
      user: dbUrl.username || "root",
      password: dbUrl.password || "",
      database: dbUrl.pathname.replace(/^\//, "") || "inven",
    };
  } catch {
    return {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "inven",
    };
  }
}

const adapter = new PrismaMariaDb(getDatabaseConfig());

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
