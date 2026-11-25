import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion, responderError } from "@/lib/auth";
import { verificarCierreAutomatico } from "@/lib/evento";

export async function GET() {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: true, datos: null });
    const participante = await prisma.participante.findFirst({
      where: { id: sesion.participanteId, eventoId: sesion.eventoId },
      select: {
        id: true, nombre: true, esAdmin: true,
        evento: true, regaloSeleccionado: { select: { id: true } },
      },
    });
    if (!participante) return NextResponse.json({ ok: true, datos: null });
    const actualizado = await verificarCierreAutomatico(participante.evento);
    const evento = { id: actualizado.id, nombre: actualizado.nombre, fechaLimite: actualizado.fechaLimite, cerrado: actualizado.cerrado };
    return NextResponse.json({ ok: true, datos: {
      participanteId: participante.id, nombre: participante.nombre, esAdmin: participante.esAdmin, evento,
      tieneRegaloSeleccionado: Boolean(participante.regaloSeleccionado),
    } });
  } catch (error) {
    return responderError(error);
  }
}
