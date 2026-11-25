import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereAdmin, responderError } from "@/lib/auth";
import { verificarCierreAutomatico } from "@/lib/evento";

export async function GET() {
  try {
    const sesion = await requiereAdmin();
    // Siempre usa el evento de la sesión, evitando revelar otro evento por accidente.
    const evento = await verificarCierreAutomatico(await prisma.evento.findUniqueOrThrow({ where: { id: sesion.eventoId } }));
    if (!evento.cerrado) return NextResponse.json({ ok: true, datos: { revelado: false, fechaLimite: evento.fechaLimite, cerrado: false } });
    const participantes = await prisma.participante.findMany({
      where: { eventoId: evento.id }, orderBy: [{ creadoEn: "asc" }, { id: "asc" }],
      select: { id: true, nombre: true, personaSecretaId: true, personaSecreta: { select: { nombre: true } }, regaloSeleccionado: { select: { necesidad: { select: { id: true, nombre: true } } } } },
    });
    const emparejamientos = participantes.map((persona) => ({
      regaladorId: persona.id,
      regaladorNombre: persona.nombre,
      personaSecretaId: persona.personaSecretaId,
      personaSecretaNombre: persona.personaSecreta?.nombre ?? null,
      necesidadElegidaId: persona.regaloSeleccionado?.necesidad.id ?? null,
      necesidadElegidaNombre: persona.regaloSeleccionado?.necesidad.nombre ?? null,
    }));
    return NextResponse.json({ ok: true, datos: { revelado: true, cerrado: true, emparejamientos } });
  } catch (error) {
    return responderError(error);
  }
}
