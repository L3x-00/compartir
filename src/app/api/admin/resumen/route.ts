import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requiereAdmin, responderError } from "@/lib/auth";
import { verificarCierreAutomatico } from "@/lib/evento";
import { leerPistasCompletas } from "@/lib/validaciones/adivinanza";
import { LIMITES } from "@/lib/constantes";

export async function GET() {
  try {
    const sesion = await requiereAdmin();
    const actual = await verificarCierreAutomatico(await prisma.evento.findUniqueOrThrow({ where: { id: sesion.eventoId } }));
    const registros = await prisma.participante.findMany({
      where: { eventoId: sesion.eventoId, esAdmin: false }, orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, fotoUrl: true, esAdmin: true, personaSecretaId: true, pistas: { select: { datos: true } }, regaloSeleccionado: { select: { necesidad: { select: { nombre: true } } } }, esPersonaSecretaDe: { select: { id: true } }, _count: { select: { necesidades: true } } },
    });
    const participantes = registros.map((persona) => ({
      id: persona.id, nombre: persona.nombre, fotoUrl: persona.fotoUrl, esAdmin: persona.esAdmin,
      tieneNecesidades: persona._count.necesidades >= LIMITES.MIN_NECESIDADES,
      cantidadNecesidades: persona._count.necesidades,
      tienePistas: !!persona.pistas && !!leerPistasCompletas(persona.pistas.datos),
      personaSecretaId: persona.personaSecretaId,
      tieneRegaloSeleccionado: !!persona.regaloSeleccionado,
      nombreRegalo: persona.regaloSeleccionado?.necesidad.nombre ?? null,
      esPersonaSecretaDe: persona.esPersonaSecretaDe?.id ?? null,
    })).sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, "es"));
    return NextResponse.json({ ok: true, datos: {
      evento: { id: actual.id, nombre: actual.nombre, fechaLimite: actual.fechaLimite, cerrado: actual.cerrado },
      totalParticipantes: participantes.length,
      participantes,
      emparejamientosCompletos: participantes.filter((persona) => persona.personaSecretaId !== null).length,
      regalosSeleccionados: participantes.filter((persona) => persona.tieneRegaloSeleccionado).length,
      participantesSinPistas: participantes.filter((persona) => !persona.tienePistas).length,
      participantesSinNecesidades: participantes.filter((persona) => !persona.tieneNecesidades).length,
    } });
  } catch (error) {
    return responderError(error);
  }
}
