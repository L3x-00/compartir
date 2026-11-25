import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { esquemaAdivinanzaConfirmar, leerPistasCompletas } from "@/lib/validaciones/adivinanza";
import { MENSAJES } from "@/lib/constantes";
import { participacionCompleta } from "@/lib/reglas";

export async function POST(peticion: Request) {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    if (!await participacionCompleta(sesion)) return NextResponse.json({ ok: false, error: MENSAJES.JUEGO_INCOMPLETO }, { status: 403 });
    const { candidatoId } = esquemaAdivinanzaConfirmar.parse(await leerJSON(peticion));
    if (candidatoId === sesion.participanteId) return NextResponse.json({ ok: false, error: "No puedes elegirte a ti mismo." }, { status: 400 });
    const datos = await prisma.$transaction(async (transaccion) => {
      const jugador = await transaccion.participante.findUniqueOrThrow({ where: { id: sesion.participanteId } });
      // Repetir la misma confirmación no duplica intentos; cambiarla exige reintentar.
      if (jugador.personaSecretaId === candidatoId) return { personaSecretaId: candidatoId };
      if (jugador.personaSecretaId) throw NextResponse.json({ ok: false, error: "Ya confirmaste una persona secreta. Usa Reintentar para cambiarla." }, { status: 409 });
      const candidato = await transaccion.participante.findFirst({
        where: { id: candidatoId, eventoId: sesion.eventoId }, select: { pistas: { select: { datos: true } } },
      });
      if (!candidato?.pistas || !leerPistasCompletas(candidato.pistas.datos)) throw NextResponse.json({ ok: false, error: "No encontramos a ese participante con pistas completas." }, { status: 404 });
      const elegido = await transaccion.participante.findFirst({ where: { eventoId: sesion.eventoId, personaSecretaId: candidatoId } });
      if (elegido) throw NextResponse.json({ ok: false, error: "Esa persona ya fue elegida por otro participante. Intenta con otra." }, { status: 409 });
      const actualizado = await transaccion.participante.updateMany({
        where: { id: sesion.participanteId, personaSecretaId: null, evento: { cerrado: false, fechaLimite: { gt: new Date() } } },
        data: { personaSecretaId: candidatoId },
      });
      if (!actualizado.count) throw NextResponse.json({ ok: false, error: MENSAJES.EVENTO_CERRADO }, { status: 403 });
      await transaccion.intentoAdivinanza.create({ data: { participanteId: sesion.participanteId, candidatoId, acierto: true } });
      return { personaSecretaId: candidatoId };
    });
    return NextResponse.json({ ok: true, datos });
  } catch (error) {
    // La restricción única también protege dos confirmaciones simultáneas.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ ok: false, error: "Esa persona ya fue elegida por otro participante. Intenta con otra." }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2028"].includes(error.code)) return NextResponse.json({ ok: false, error: "La asignación cambió mientras confirmabas. Intenta de nuevo." }, { status: 409 });
    return responderError(error);
  }
}
