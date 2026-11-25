import type { Evento } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function verificarCierreAutomatico(evento: Evento): Promise<Evento> {
  if (!evento.cerrado && Date.now() >= evento.fechaLimite.getTime()) return cerrarEvento(evento.id);
  return evento;
}

export async function cerrarEvento(eventoId: string): Promise<Evento> {
  // Las asignaciones ya están guardadas. El cierre no inventa parejas pendientes.
  await prisma.evento.updateMany({ where: { id: eventoId, cerrado: false }, data: { cerrado: true } });
  return prisma.evento.findUniqueOrThrow({ where: { id: eventoId } });
}

export async function obtenerEventoActivo(): Promise<Evento | null> {
  const abierto = await prisma.evento.findFirst({ where: { cerrado: false }, orderBy: [{ creadoEn: "desc" }, { id: "desc" }] });
  return abierto ?? prisma.evento.findFirst({ where: { cerrado: true }, orderBy: [{ creadoEn: "desc" }, { id: "desc" }] });
}
