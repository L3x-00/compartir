import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerEventoActivo } from "@/lib/evento";
import { esquemaNombreParticipante, normalizarNombre } from "@/lib/validaciones/participante";
import { responderError } from "@/lib/auth";

/** Comprobación ligera para no exigir una foto nueva a quien ya está registrado. */
export async function GET(peticion: Request) {
  try {
    const nombre = new URL(peticion.url).searchParams.get("nombre") ?? "";
    const valido = esquemaNombreParticipante.safeParse({ nombre });
    if (!valido.success) return NextResponse.json({ ok: true, datos: { existe: false, tieneFoto: false, esAdmin: false } });
    const evento = await obtenerEventoActivo();
    if (!evento) return NextResponse.json({ ok: true, datos: { existe: false, tieneFoto: false, esAdmin: false } });
    const buscado = normalizarNombre(valido.data.nombre).toLocaleLowerCase("es");
    const participantes = await prisma.participante.findMany({
      where: { eventoId: evento.id }, select: { nombre: true, fotoUrl: true, esAdmin: true },
    });
    const encontrado = participantes.find((p) => normalizarNombre(p.nombre).toLocaleLowerCase("es") === buscado);
    return NextResponse.json({ ok: true, datos: {
      existe: !!encontrado,
      tieneFoto: !!encontrado?.fotoUrl,
      fotoOpcional: !!encontrado?.fotoUrl && !encontrado?.esAdmin,
    } });
  } catch (error) {
    return responderError(error);
  }
}
