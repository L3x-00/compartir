import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { eliminarFoto, leerFoto } from "@/lib/archivos";
import { requiereEventoAbierto, requiereSesion, responderError } from "@/lib/auth";

export async function GET(_peticion: Request, { params }: { params: Promise<{ archivo: string }> }) {
  try {
    await requiereSesion();
    const foto = await leerFoto((await params).archivo);
    if (!foto) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(foto.bytes), {
      headers: { "Content-Type": foto.tipo, "Cache-Control": "private, max-age=600", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    return responderError(error);
  }
}

/** Solo elimina imágenes que nadie referencia, para limpiar subidas fallidas. */
export async function DELETE(_peticion: Request, { params }: { params: Promise<{ archivo: string }> }) {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const nombre = (await params).archivo;
    const url = `/uploads/${nombre}`;
    if (!await leerFoto(nombre)) return NextResponse.json({ ok: false, error: "No encontramos esa foto." }, { status: 404 });
    const [necesidades, participantes] = await Promise.all([
      prisma.necesidad.count({ where: { fotoUrl: url } }),
      prisma.participante.count({ where: { fotoUrl: url } }),
    ]);
    if (necesidades || participantes) return NextResponse.json({ ok: false, error: "Esa foto está en uso." }, { status: 409 });
    await eliminarFoto(url);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return responderError(error);
  }
}
