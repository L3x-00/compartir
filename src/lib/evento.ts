import type { Evento, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { MENSAJES } from "@/lib/constantes";
import { prisma } from "@/lib/prisma";

/** La primera escritura toma el bloqueo SQLite y serializa las mutaciones con el cierre. */
export async function conEventoAbierto<T>(eventoId: string, operar: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    async function comprobar() {
      const cambio = await tx.evento.updateMany({
        where: { id: eventoId, cerrado: false, fechaLimite: { gt: new Date() } }, data: { cerrado: false },
      });
      if (!cambio.count) throw NextResponse.json({ ok: false, error: MENSAJES.EVENTO_CERRADO }, { status: 403 });
    }
    await comprobar();
    const resultado = await operar(tx);
    // También revierte peticiones que cruzaron la fecha límite durante la operación.
    await comprobar();
    return resultado;
  }, { maxWait: 10_000, timeout: 15_000 });
}

export async function verificarCierreAutomatico(evento: Evento): Promise<Evento> {
  if (!evento.cerrado && Date.now() >= evento.fechaLimite.getTime()) {
    // Una lectura anterior no debe cerrar un evento cuya fecha acaba de ampliarse.
    await prisma.evento.updateMany({ where: { id: evento.id, cerrado: false, fechaLimite: { lte: new Date() } }, data: { cerrado: true } });
    return prisma.evento.findUniqueOrThrow({ where: { id: evento.id } });
  }
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
