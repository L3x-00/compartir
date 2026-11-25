import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereAdmin, requiereEventoAbierto, responderError } from "@/lib/auth";
import { MENSAJES } from "@/lib/constantes";

const esquemaEvento = z.object({
  nombre: z.string({ invalid_type_error: "El nombre debe ser un texto." }).trim().min(2, "Escribe un nombre de al menos 2 caracteres.").max(100, "El nombre puede tener hasta 100 caracteres.").optional(),
  fechaLimite: z.string({ invalid_type_error: "La fecha límite debe ser un texto con fecha y hora." })
    .datetime({ offset: true, message: "Envía una fecha y hora ISO válidas, incluyendo la zona horaria." })
    .refine((fecha) => Date.parse(fecha) > Date.now(), "La fecha límite debe ser futura.").optional(),
}, { required_error: "Indica qué dato del evento quieres cambiar.", invalid_type_error: "Revisa los datos del evento." })
  .strict("Solo puedes cambiar el nombre y la fecha límite.")
  .refine((datos) => datos.nombre !== undefined || datos.fechaLimite !== undefined, "Indica el nombre o la fecha límite que quieres cambiar.");

export async function PUT(peticion: Request) {
  try {
    const sesion = await requiereAdmin();
    await requiereEventoAbierto(sesion.eventoId);
    const datos = esquemaEvento.parse(await leerJSON(peticion));
    const evento = await prisma.$transaction(async (transaccion) => {
      const actualizado = await transaccion.evento.updateMany({
        where: { id: sesion.eventoId, cerrado: false, fechaLimite: { gt: new Date() } },
        data: { nombre: datos.nombre, fechaLimite: datos.fechaLimite ? new Date(datos.fechaLimite) : undefined },
      });
      if (!actualizado.count) throw NextResponse.json({ ok: false, error: MENSAJES.EVENTO_CERRADO }, { status: 403 });
      return transaccion.evento.findUniqueOrThrow({ where: { id: sesion.eventoId } });
    });
    return NextResponse.json({ ok: true, datos: evento });
  } catch (error) {
    return responderError(error);
  }
}
