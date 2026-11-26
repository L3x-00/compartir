import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { eliminarFoto, leerFoto } from "@/lib/archivos";
import { requiereSesion, responderError } from "@/lib/auth";
import { conEventoAbierto } from "@/lib/evento";

type Contexto = { params: Promise<{ archivo: string }> };
export async function GET(_peticion: Request, { params }: Contexto) {
  try {
    const sesion = await requiereSesion();
    const nombre = (await params).archivo;
    const url = `/uploads/${nombre}`;
    const jugador = await prisma.participante.findUniqueOrThrow({ where: { id: sesion.participanteId }, select: { personaSecretaId: true } });
    const [propia, perfil, necesidad] = await Promise.all([
      prisma.foto.findFirst({ where: { url, propietarioId: sesion.participanteId } }),
      prisma.participante.findFirst({ where: { eventoId: sesion.eventoId, fotoUrl: url }, select: { id: true } }),
      prisma.necesidad.findFirst({ where: { fotoUrl: url, participante: { eventoId: sesion.eventoId }, ...(sesion.esAdmin ? {} : { participanteId: { in: [sesion.participanteId, jugador.personaSecretaId ?? sesion.participanteId] } }) }, select: { id: true } }),
    ]);
    if (!propia && !perfil && !necesidad) return new Response(null, { status: 404 });
    const foto = await leerFoto(nombre);
    if (!foto) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(foto.bytes), { headers: { "Content-Type": foto.tipo, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return responderError(error); }
}

export async function DELETE(_peticion: Request, { params }: Contexto) {
  try {
    const sesion = await requiereSesion();
    const url = `/uploads/${(await params).archivo}`;
    await conEventoAbierto(sesion.eventoId, async (tx) => {
      const foto = await tx.foto.findFirst({ where: { url, propietarioId: sesion.participanteId } });
      if (!foto) throw NextResponse.json({ ok: false, error: "No encontramos esa foto entre tus subidas." }, { status: 404 });
      if (await tx.necesidad.count({ where: { fotoUrl: url } }) || await tx.participante.count({ where: { fotoUrl: url } })) throw NextResponse.json({ ok: false, error: "Esa foto está en uso." }, { status: 409 });
      await tx.foto.delete({ where: { url } });
    });
    await eliminarFoto(url);
    return NextResponse.json({ ok: true });
  } catch (error) { return responderError(error); }
}
