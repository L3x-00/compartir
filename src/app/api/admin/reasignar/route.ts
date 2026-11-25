import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereAdmin, responderError } from "@/lib/auth";

const esquema = z.object({
  participanteId: z.string().cuid(),
  candidatoId: z.string().cuid(),
});

/** El organizador puede cerrar las asignaciones que quedaron pendientes. */
export async function POST(peticion: Request) {
  try {
    const sesion = await requiereAdmin();
    const { participanteId, candidatoId } = esquema.parse(await leerJSON(peticion));
    if (participanteId === candidatoId) {
      return NextResponse.json({ ok: false, error: "No puedes asignar a alguien consigo mismo." }, { status: 400 });
    }
    const [participante, candidato] = await Promise.all([
      prisma.participante.findFirst({ where: { id: participanteId, eventoId: sesion.eventoId, esAdmin: false }, select: { id: true } }),
      prisma.participante.findFirst({ where: { id: candidatoId, eventoId: sesion.eventoId, esAdmin: false }, select: { id: true } }),
    ]);
    if (!participante || !candidato) return NextResponse.json({ ok: false, error: "Participante no encontrado en el evento." }, { status: 404 });
    const ocupado = await prisma.participante.findFirst({ where: { eventoId: sesion.eventoId, personaSecretaId: candidatoId } });
    if (ocupado && ocupado.id !== participanteId) {
      return NextResponse.json({ ok: false, error: "Esa persona ya fue elegida por otro participante." }, { status: 409 });
    }
    await prisma.participante.update({ where: { id: participanteId }, data: { personaSecretaId: candidatoId } });
    return NextResponse.json({ ok: true, datos: { participanteId, candidatoId } });
  } catch (error) {
    return responderError(error);
  }
}
