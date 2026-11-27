import type { SesionParticipante } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { CATALOGO_POR_DEFECTO, LIMITES } from "@/lib/constantes";
import { validarCatalogo } from "@/lib/catalogo";
import { prisma } from "@/lib/prisma";
import { leerPistasCompletas } from "@/lib/validaciones/adivinanza";

/** El juego no depende de que el cliente haya visitado las pantallas en orden. */
export async function participacionCompleta(sesion: SesionParticipante, cliente: Prisma.TransactionClient = prisma): Promise<boolean> {
  const participante = await cliente.participante.findFirst({
    where: { id: sesion.participanteId, eventoId: sesion.eventoId },
    select: { _count: { select: { necesidades: true } }, pistas: { select: { datos: true } } },
  });
  if (!participante || participante._count.necesidades < LIMITES.MIN_NECESIDADES || !participante.pistas) return false;
  let catalogo = CATALOGO_POR_DEFECTO;
  try {
    const fila = await cliente.catalogoPistas.findUnique({ where: { id: "principal" }, select: { datos: true } });
    if (fila) catalogo = validarCatalogo(JSON.parse(fila.datos));
  } catch { /* Sin catálogo guardado se usa el por defecto. */ }
  return Boolean(leerPistasCompletas(participante.pistas.datos, catalogo));
}
