import { PrismaClient } from "@prisma/client"

/**
 * Singleton do Prisma Client.
 *
 * Em ambiente de desenvolvimento o Next.js recarrega os módulos a cada
 * alteração, o que criaria múltiplas instâncias do PrismaClient e esgotaria
 * o pool de conexões. Guardamos a instância no objeto global para reutilizá-la.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
