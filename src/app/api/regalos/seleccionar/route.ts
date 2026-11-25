import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { MENSAJES } from "@/lib/constantes";
import { participacionCompleta } from "@/lib/reglas";

const esquemaRegalo = z.object({
  necesidadId: z.string({ required_error: "Selecciona un regalo.", invalid_type_error: "Selecciona un regalo válido." }).cuid("Selecciona un regalo válido."),
}, { required_error: "Selecciona un regalo.", invalid_type_error: "Revisa el regalo seleccionado." });

export async function POST(peticion: Request) {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    if (!await participacionCompleta(sesion)) return NextResponse.json({ ok: false, error: MENSAJES.JUEGO_INCOMPLETO }, { status: 403 });
    const { necesidadId } = esquemaRegalo.parse(await leerJSON(peticion));
    const eleccion = await prisma.$transaction(async (transaccion) => {
      const jugador = await transaccion.participante.findUniqueOrThrow({ where: { id: sesion.participanteId }, include: { regaloSeleccionado: true, evento: true } });
      if (jugador.evento.cerrado || jugador.evento.fechaLimite.getTime() <= Date.now()) throw NextResponse.json({ ok: false, error: MENSAJES.EVENTO_CERRADO }, { status: 403 });
      if (!jugador.personaSecretaId) throw NextResponse.json({ ok: false, error: "Aún no has adivinado a tu persona secreta." }, { status: 403 });
      const necesidad = await transaccion.necesidad.findFirst({
        where: { id: necesidadId, participanteId: jugador.personaSecretaId, participante: { eventoId: sesion.eventoId } },
        select: { nombre: true, participante: { select: { nombre: true } } },
      });
      if (!necesidad) throw NextResponse.json({ ok: false, error: "Elige una necesidad de tu persona secreta." }, { status: 403 });
      if (jugador.regaloSeleccionado) throw NextResponse.json({ ok: false, error: "Ya elegiste tu regalo." }, { status: 409 });
      await transaccion.regaloSeleccionado.create({ data: { participanteId: sesion.participanteId, necesidadId } });
      return { destinatario: necesidad.participante.nombre, regalo: necesidad.nombre };
    });
    return NextResponse.json({ ok: true, datos: { necesidadId, ...eleccion } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034", "P2028"].includes(error.code)) return NextResponse.json({ ok: false, error: "El regalo ya fue seleccionado o cambió mientras lo elegías. Revisa tu selección." }, { status: 409 });
    return responderError(error);
  }
}
