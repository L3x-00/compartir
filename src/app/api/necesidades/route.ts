import { validarFotoPropia } from "@/lib/archivos";
import { conEventoAbierto } from "@/lib/evento";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { esquemaNecesidad } from "@/lib/validaciones/necesidad";
import { LIMITES } from "@/lib/constantes";

export async function GET() {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const necesidades = await prisma.necesidad.findMany({
      where: { participanteId: sesion.participanteId }, orderBy: { creadoEn: "asc" },
    });
    return NextResponse.json({ ok: true, datos: necesidades });
  } catch (error) {
    return responderError(error);
  }
}

export async function POST(peticion: Request) {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const datos = esquemaNecesidad.parse(await leerJSON(peticion));
    // El conteo y la creación van juntos para respetar el límite de diez regalos.
    const necesidad = await conEventoAbierto(sesion.eventoId, async (transaccion) => {
      await validarFotoPropia(transaccion, datos.fotoUrl, sesion.participanteId);
      const cantidad = await transaccion.necesidad.count({ where: { participanteId: sesion.participanteId } });
      if (cantidad >= LIMITES.MAX_NECESIDADES) throw NextResponse.json({ ok: false, error: `Puedes publicar un máximo de ${LIMITES.MAX_NECESIDADES} necesidades.` }, { status: 400 });
      return transaccion.necesidad.create({ data: { ...datos, participanteId: sesion.participanteId } });
    });
    return NextResponse.json({ ok: true, datos: necesidad }, { status: 201 });
  } catch (error) {
    return responderError(error);
  }
}
