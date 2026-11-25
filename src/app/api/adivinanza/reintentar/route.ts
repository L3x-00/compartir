import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { MENSAJES } from "@/lib/constantes";

export async function POST() {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    await prisma.$transaction(async (transaccion) => {
      const regalo = await transaccion.regaloSeleccionado.findUnique({ where: { participanteId: sesion.participanteId } });
      if (regalo) throw NextResponse.json({ ok: false, error: "Ya elegiste tu regalo, no puedes reintentar." }, { status: 409 });
      const actualizado = await transaccion.participante.updateMany({
        where: { id: sesion.participanteId, evento: { cerrado: false, fechaLimite: { gt: new Date() } } }, data: { personaSecretaId: null },
      });
      if (!actualizado.count) throw NextResponse.json({ ok: false, error: MENSAJES.EVENTO_CERRADO }, { status: 403 });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return responderError(error);
  }
}
