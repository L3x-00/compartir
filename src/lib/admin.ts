import type { Prisma } from "@prisma/client";
import { hashPin, verificarPin } from "@/lib/pin";

/** Solo rota cuando cambió el PIN configurado; los reinicios conservan las sesiones. */
export async function sincronizarPinAdmin(tx: Prisma.TransactionClient, id: string, pin: string) {
  const admin = await tx.participante.findUniqueOrThrow({ where: { id }, select: { pin: true, esAdmin: true } });
  if (!admin.esAdmin) throw new Error("El participante no es administrador.");
  if (!verificarPin(admin.pin, pin)) await tx.participante.update({ where: { id }, data: { pin: hashPin(pin), versionSesion: { increment: 1 } } });
}
