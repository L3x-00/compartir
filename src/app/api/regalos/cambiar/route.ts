import { conEventoAbierto } from "@/lib/evento";
import { z } from "zod";
import { NextResponse } from "next/server";
import { leerJSON, requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { MENSAJES } from "@/lib/constantes";
import { participacionCompleta } from "@/lib/reglas";

const esquema = z.object({
  necesidadId: z.string({ required_error: "Selecciona un regalo." }).cuid("Selecciona un regalo válido."),
});

/** Permite corregir o quitar el regalo mientras el evento siga abierto. */
export async function POST(peticion: Request) {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    if (!await participacionCompleta(sesion)) return NextResponse.json({ ok: false, error: MENSAJES.JUEGO_INCOMPLETO }, { status: 403 });
    const { necesidadId } = esquema.parse(await leerJSON(peticion));
    const datos = await conEventoAbierto(sesion.eventoId, async (transaccion) => {
      if (!await participacionCompleta(sesion, transaccion)) throw NextResponse.json({ ok: false, error: MENSAJES.JUEGO_INCOMPLETO }, { status: 403 });
      const jugador = await transaccion.participante.findFirst({
        where: { id: sesion.participanteId, eventoId: sesion.eventoId, evento: { cerrado: false, fechaLimite: { gt: new Date() } } },
        select: { personaSecretaId: true },
      });
      if (!jugador) throw NextResponse.json({ ok: false, error: MENSAJES.EVENTO_CERRADO }, { status: 403 });
      if (!jugador.personaSecretaId) {
        throw NextResponse.json({ ok: false, error: "Aún no has adivinado a tu persona secreta." }, { status: 403 });
      }
      const necesidad = await transaccion.necesidad.findFirst({
        where: { id: necesidadId, participanteId: jugador.personaSecretaId, participante: { eventoId: sesion.eventoId } }, select: { nombre: true },
      });
      if (!necesidad) {
        throw NextResponse.json({ ok: false, error: "Elige una necesidad de tu persona secreta." }, { status: 403 });
      }
      const actual = await transaccion.regaloSeleccionado.findUnique({
        where: { participanteId: sesion.participanteId }, select: { necesidadId: true },
      });
      if (actual?.necesidadId === necesidadId) return { nombre: necesidad.nombre };
      const ocupada = await transaccion.regaloSeleccionado.findUnique({ where: { necesidadId } });
      if (ocupada) {
        throw NextResponse.json({ ok: false, error: "Ese regalo ya fue elegido por otra persona." }, { status: 409 });
      }
      if (actual) await transaccion.regaloSeleccionado.delete({ where: { participanteId: sesion.participanteId } });
      await transaccion.regaloSeleccionado.create({ data: { participanteId: sesion.participanteId, necesidadId } });
      return { nombre: necesidad.nombre };
    });
    return NextResponse.json({ ok: true, datos });
  } catch (error) {
    if (error instanceof Error && ["P2002", "P2034", "P2028"].includes((error as { code?: string }).code ?? "")) {
      return NextResponse.json({ ok: false, error: "El regalo cambió mientras lo editabas. Intenta de nuevo." }, { status: 409 });
    }
    return responderError(error);
  }
}

export async function DELETE() {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    await conEventoAbierto(sesion.eventoId, (tx) => tx.regaloSeleccionado.deleteMany({ where: { participanteId: sesion.participanteId } }));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return responderError(error);
  }
}
