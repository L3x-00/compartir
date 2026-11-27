import { conEventoAbierto } from "@/lib/evento";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereAdmin, requiereEventoAbierto, responderError } from "@/lib/auth";
import { crearEsquemaPistas } from "@/lib/validaciones/pistas";
import { leerPistasParaEditar } from "@/lib/validaciones/adivinanza";
import { leerCatalogo } from "@/lib/catalogo";

function esquemaCorreccion(catalogo: Awaited<ReturnType<typeof leerCatalogo>>) {
  return z.object({
    participanteId: z.string().cuid("Selecciona un participante válido."),
    pistas: crearEsquemaPistas(catalogo),
  });
}

/** El administrador consulta y corrige las pistas de cualquier participante del evento. */
export async function GET() {
  try {
    const sesion = await requiereAdmin();
    const catalogo = await leerCatalogo();
    const participantes = await prisma.participante.findMany({
      where: { eventoId: sesion.eventoId, esAdmin: false }, orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, fotoUrl: true, pistas: { select: { datos: true } } },
    });
    return NextResponse.json({ ok: true, datos: participantes.map((persona) => ({
      id: persona.id, nombre: persona.nombre, fotoUrl: persona.fotoUrl,
      pistas: persona.pistas ? leerPistasParaEditar(persona.pistas.datos, catalogo) : null,
    })) });
  } catch (error) {
    return responderError(error);
  }
}

export async function POST(peticion: Request) {
  try {
    const sesion = await requiereAdmin();
    await requiereEventoAbierto(sesion.eventoId);
    const catalogo = await leerCatalogo();
    const { participanteId, pistas } = esquemaCorreccion(catalogo).parse(await leerJSON(peticion));
    const participante = await prisma.participante.findFirst({
      where: { id: participanteId, eventoId: sesion.eventoId, esAdmin: false }, select: { id: true },
    });
    if (!participante) return NextResponse.json({ ok: false, error: "No encontramos a ese participante en el evento." }, { status: 404 });
    const datos = JSON.stringify(pistas);
    const guardadas = await conEventoAbierto(sesion.eventoId, (tx) => tx.pistas.upsert({
      where: { participanteId }, update: { datos }, create: { participanteId, datos },
      select: { actualizadoEn: true },
    }));
    return NextResponse.json({ ok: true, datos: { participanteId, actualizadoEn: guardadas.actualizadoEn } });
  } catch (error) {
    return responderError(error);
  }
}
