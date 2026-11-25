import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { esquemaPistas } from "@/lib/validaciones/pistas";

export async function GET() {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const pistas = await prisma.pistas.findUnique({ where: { participanteId: sesion.participanteId } });
    if (!pistas) return NextResponse.json({ ok: true, datos: null });
    return NextResponse.json({ ok: true, datos: { pistas: esquemaPistas.parse(JSON.parse(pistas.datos)), actualizadoEn: pistas.actualizadoEn } });
  } catch (error) {
    return responderError(error);
  }
}

export async function POST(peticion: Request) {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const datos = JSON.stringify(esquemaPistas.parse(await leerJSON(peticion)));
    const pistas = await prisma.pistas.upsert({
      where: { participanteId: sesion.participanteId }, update: { datos }, create: { participanteId: sesion.participanteId, datos },
    });
    return NextResponse.json({ ok: true, datos: pistas });
  } catch (error) {
    return responderError(error);
  }
}
