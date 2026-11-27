import { repartoCompletable } from "@/lib/reparto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { MENSAJES } from "@/lib/constantes";
import { participacionCompleta } from "@/lib/reglas";
import { crearEsquemaAdivinanza, leerPistasCompletas } from "@/lib/validaciones/adivinanza";
import { calcularCoincidencias } from "@/lib/coincidencias";
import { leerCatalogo } from "@/lib/catalogo";

export async function POST(peticion: Request) {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    if (!await participacionCompleta(sesion)) return NextResponse.json({ ok: false, error: MENSAJES.JUEGO_INCOMPLETO }, { status: 403 });
    const catalogo = await leerCatalogo();
    const { seleccion } = crearEsquemaAdivinanza(catalogo).parse(await leerJSON(peticion));
    const jugador = await prisma.participante.findUniqueOrThrow({ where: { id: sesion.participanteId } });
    if (jugador.personaSecretaId) return NextResponse.json({ ok: true, datos: { yaConfirmado: true, personaSecretaId: jugador.personaSecretaId } });
    const personas = await prisma.participante.findMany({ where: { eventoId: sesion.eventoId, esAdmin: false }, select: { id: true, personaSecretaId: true } });
    const participantes = await prisma.participante.findMany({
      where: { eventoId: sesion.eventoId, esAdmin: false, id: { not: sesion.participanteId }, pistas: { isNot: null }, esPersonaSecretaDe: { is: null } },
      select: { id: true, pistas: { select: { datos: true } } }, orderBy: [{ creadoEn: "asc" }, { id: "asc" }],
    });
    const candidatos = participantes.flatMap((persona) => {
      const pistas = persona.pistas && leerPistasCompletas(persona.pistas.datos, catalogo);
      return pistas && repartoCompletable(personas, { participanteId: sesion.participanteId, candidatoId: persona.id }) ? [{ participanteId: persona.id, pistas }] : [];
    });
    return NextResponse.json({ ok: true, datos: { top3: calcularCoincidencias(seleccion, candidatos).slice(0, 3), totalCandidatos: candidatos.length } });
  } catch (error) {
    return responderError(error);
  }
}
