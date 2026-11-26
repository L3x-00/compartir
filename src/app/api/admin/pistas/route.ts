import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereAdmin, requiereEventoAbierto, responderError } from "@/lib/auth";
import { esquemaPistas } from "@/lib/validaciones/pistas";
import type { Pistas } from "@/tipos/pistas";

const esquemaCorreccion = z.object({
  participanteId: z.string().cuid("Selecciona un participante válido."),
  pistas: esquemaPistas,
});

/** El administrador consulta y corrige las pistas de cualquier participante del evento. */
export async function GET() {
  try {
    const sesion = await requiereAdmin();
    const participantes = await prisma.participante.findMany({
      where: { eventoId: sesion.eventoId, esAdmin: false }, orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, fotoUrl: true, pistas: { select: { datos: true } } },
    });
    return NextResponse.json({ ok: true, datos: participantes.map((persona) => {
      let pistas: Pistas | null = null;
      if (persona.pistas) {
        try {
          const leidas = esquemaPistas.safeParse(JSON.parse(persona.pistas.datos));
          if (leidas.success) pistas = leidas.data;
        } catch { /* Un registro antiguo e inválido se muestra como pendiente. */ }
      }
      return { id: persona.id, nombre: persona.nombre, fotoUrl: persona.fotoUrl, pistas };
    }) });
  } catch (error) {
    return responderError(error);
  }
}

export async function POST(peticion: Request) {
  try {
    const sesion = await requiereAdmin();
    await requiereEventoAbierto(sesion.eventoId);
    const { participanteId, pistas } = esquemaCorreccion.parse(await leerJSON(peticion));
    const participante = await prisma.participante.findFirst({
      where: { id: participanteId, eventoId: sesion.eventoId, esAdmin: false }, select: { id: true },
    });
    if (!participante) return NextResponse.json({ ok: false, error: "No encontramos a ese participante en el evento." }, { status: 404 });
    const datos = JSON.stringify(pistas);
    const guardadas = await prisma.pistas.upsert({
      where: { participanteId }, update: { datos }, create: { participanteId, datos },
      select: { actualizadoEn: true },
    });
    return NextResponse.json({ ok: true, datos: { participanteId, actualizadoEn: guardadas.actualizadoEn } });
  } catch (error) {
    return responderError(error);
  }
}
