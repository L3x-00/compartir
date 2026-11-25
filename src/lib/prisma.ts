import { PrismaClient } from "@prisma/client";

const globalParaPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Reutiliza la conexión durante las recargas de Next.js en desarrollo.
export const prisma = globalParaPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalParaPrisma.prisma = prisma;
}
