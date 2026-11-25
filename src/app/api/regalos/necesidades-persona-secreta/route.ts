import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";

export async function GET() {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const jugador = await prisma.participante.findUniqueOrThrow({ where: { id: sesion.participanteId } });
    if (!jugador.personaSecretaId) return NextResponse.json({ ok: false, error: "Aún no has adivinado a tu persona secreta." }, { status: 403 });
    const necesidades = await prisma.necesidad.findMany({
      where: { participanteId: jugador.personaSecretaId, participante: { eventoId: sesion.eventoId } },
      select: { id: true, nombre: true, descripcion: true, fotoUrl: true, linkReferencia: true }, orderBy: [{ creadoEn: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({ ok: true, datos: { necesidades } });
  } catch (error) {
    return responderError(error);
  }
}
