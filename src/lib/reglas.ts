import type { SesionParticipante } from "@/lib/auth";
import { LIMITES } from "@/lib/constantes";
import { prisma } from "@/lib/prisma";
import { leerPistasCompletas } from "@/lib/validaciones/adivinanza";

/** El juego no depende de que el cliente haya visitado las pantallas en orden. */
export async function participacionCompleta(sesion: SesionParticipante): Promise<boolean> {
  const participante = await prisma.participante.findFirst({
    where: { id: sesion.participanteId, eventoId: sesion.eventoId },
    select: { _count: { select: { necesidades: true } }, pistas: { select: { datos: true } } },
  });
  if (!participante || participante._count.necesidades < LIMITES.MIN_NECESIDADES || !participante.pistas) return false;
  return Boolean(leerPistasCompletas(participante.pistas.datos));
}
