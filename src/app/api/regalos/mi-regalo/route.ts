import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion, responderError } from "@/lib/auth";
import { verificarCierreAutomatico } from "@/lib/evento";

export async function GET() {
  try {
    const sesion = await requiereSesion();
    const evento = await verificarCierreAutomatico(await prisma.evento.findUniqueOrThrow({ where: { id: sesion.eventoId } }));
    if (!evento.cerrado) return NextResponse.json({ ok: false, error: "La revelación aún no ocurre." }, { status: 403 });
    const regalador = await prisma.participante.findFirst({
      where: { eventoId: sesion.eventoId, personaSecretaId: sesion.participanteId },
      select: { id: true, nombre: true, fotoUrl: true, regaloSeleccionado: { select: { necesidad: { select: { id: true, nombre: true, descripcion: true, fotoUrl: true, linkReferencia: true, participanteId: true } } } } },
    });
    if (!regalador) return NextResponse.json({ ok: false, error: "Nadie te eligió como persona secreta." }, { status: 404 });
    const elegida = regalador.regaloSeleccionado?.necesidad;
    if (!elegida || elegida.participanteId !== sesion.participanteId) return NextResponse.json({ ok: false, error: "La persona que te eligió aún no seleccionó un regalo." }, { status: 404 });
    const { participanteId: _propietario, ...necesidad } = elegida;
    return NextResponse.json({ ok: true, datos: { necesidad, regalador: { participanteId: regalador.id, nombre: regalador.nombre, fotoUrl: regalador.fotoUrl } } });
  } catch (error) {
    return responderError(error);
  }
}
