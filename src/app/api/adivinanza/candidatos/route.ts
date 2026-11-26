import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { leerPistasCompletas } from "@/lib/validaciones/adivinanza";

export async function GET() {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const participantes = await prisma.participante.findMany({
      where: { eventoId: sesion.eventoId, esAdmin: false, id: { not: sesion.participanteId }, pistas: { isNot: null }, esPersonaSecretaDe: { is: null } },
      select: { id: true, pistas: { select: { datos: true } } }, orderBy: [{ creadoEn: "asc" }, { id: "asc" }],
    });
    const candidatos = participantes.filter((persona) => persona.pistas && leerPistasCompletas(persona.pistas.datos))
      .map((persona) => ({ participanteId: persona.id }));
    return NextResponse.json({ ok: true, datos: candidatos });
  } catch (error) {
    return responderError(error);
  }
}
