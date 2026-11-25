import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { esquemaPistas } from "@/lib/validaciones/pistas";

export async function GET(_peticion: Request, { params }: { params: Promise<{ participanteId: string }> }) {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const { participanteId } = await params;
    if (participanteId === sesion.participanteId) {
      return NextResponse.json({ ok: false, error: "No puedes ver tus propias pistas por esta ruta." }, { status: 400 });
    }
    const pistas = await prisma.pistas.findFirst({
      where: { participanteId, participante: { eventoId: sesion.eventoId } }, select: { datos: true },
    });
    if (!pistas) return NextResponse.json({ ok: false, error: "Ese participante aún no completó sus pistas." }, { status: 404 });
    return NextResponse.json({ ok: true, datos: { participanteId, pistas: esquemaPistas.parse(JSON.parse(pistas.datos)) } });
  } catch (error) {
    return responderError(error);
  }
}
