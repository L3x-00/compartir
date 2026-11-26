import { NextResponse } from "next/server";
import { z } from "zod";
import { leerJSON, requiereAdmin, requiereEventoAbierto, responderError } from "@/lib/auth";
import { conEventoAbierto } from "@/lib/evento";
import { repartoCompletable } from "@/lib/reparto";

const esquema = z.object({
  participanteId: z.string().cuid(),
  candidatoId: z.string().cuid(),
});

/** El organizador puede cerrar las asignaciones que quedaron pendientes. */
export async function POST(peticion: Request) {
  try {
    const sesion = await requiereAdmin();
    await requiereEventoAbierto(sesion.eventoId);
    const { participanteId, candidatoId } = esquema.parse(await leerJSON(peticion));
    if (participanteId === candidatoId) {
      return NextResponse.json({ ok: false, error: "No puedes asignar a alguien consigo mismo." }, { status: 400 });
    }
    await conEventoAbierto(sesion.eventoId, async (transaccion) => {
      const [participante, candidato] = await Promise.all([
        transaccion.participante.findFirst({ where: { id: participanteId, eventoId: sesion.eventoId, esAdmin: false }, select: { id: true, personaSecretaId: true } }),
        transaccion.participante.findFirst({ where: { id: candidatoId, eventoId: sesion.eventoId, esAdmin: false }, select: { id: true } }),
      ]);
      if (!participante || !candidato) throw NextResponse.json({ ok: false, error: "Participante no encontrado en el evento." }, { status: 404 });
      if (participante.personaSecretaId) throw NextResponse.json({ ok: false, error: "Ese participante ya tiene una asignación confirmada." }, { status: 409 });
      const ocupado = await transaccion.participante.findFirst({ where: { eventoId: sesion.eventoId, personaSecretaId: candidatoId } });
      if (ocupado) throw NextResponse.json({ ok: false, error: "Esa persona ya fue elegida por otro participante." }, { status: 409 });
      const personas = await transaccion.participante.findMany({ where: { eventoId: sesion.eventoId, esAdmin: false }, select: { id: true, personaSecretaId: true } });
      if (!repartoCompletable(personas, { participanteId, candidatoId })) throw NextResponse.json({ ok: false, error: "Esa asignación dejaría a alguien sin destinatario. Elige otra persona." }, { status: 409 });
      const actualizado = await transaccion.participante.updateMany({
        where: { id: participanteId, eventoId: sesion.eventoId, personaSecretaId: null, evento: { cerrado: false } },
        data: { personaSecretaId: candidatoId },
      });
      if (!actualizado.count) throw NextResponse.json({ ok: false, error: "La asignación cambió mientras la editabas. Recarga el panel." }, { status: 409 });
    });
    return NextResponse.json({ ok: true, datos: { participanteId, candidatoId } });
  } catch (error) {
    return responderError(error);
  }
}
