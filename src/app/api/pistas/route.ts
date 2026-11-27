import { conEventoAbierto } from "@/lib/evento";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { crearEsquemaPistas } from "@/lib/validaciones/pistas";
import { leerPistasParaEditar } from "@/lib/validaciones/adivinanza";
import { leerCatalogo } from "@/lib/catalogo";

export async function GET() {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const [pistas, catalogo] = await Promise.all([
      prisma.pistas.findUnique({ where: { participanteId: sesion.participanteId } }),
      leerCatalogo(),
    ]);
    if (!pistas) return NextResponse.json({ ok: true, datos: null });
    return NextResponse.json({ ok: true, datos: { pistas: leerPistasParaEditar(pistas.datos, catalogo), actualizadoEn: pistas.actualizadoEn } });
  } catch (error) {
    return responderError(error);
  }
}

export async function POST(peticion: Request) {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const catalogo = await leerCatalogo();
    const datos = JSON.stringify(crearEsquemaPistas(catalogo).parse(await leerJSON(peticion)));
    const pistas = await conEventoAbierto(sesion.eventoId, (tx) => tx.pistas.upsert({
      where: { participanteId: sesion.participanteId }, update: { datos }, create: { participanteId: sesion.participanteId, datos },
    }));
    return NextResponse.json({ ok: true, datos: pistas });
  } catch (error) {
    return responderError(error);
  }
}
