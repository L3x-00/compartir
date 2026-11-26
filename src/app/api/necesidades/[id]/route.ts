import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leerJSON, requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { esquemaNecesidad } from "@/lib/validaciones/necesidad";
import { eliminarFoto } from "@/lib/archivos";

type ContextoRuta = { params: Promise<{ id: string }> };

export async function PUT(peticion: Request, { params }: ContextoRuta) {
  try {
    const sesion = await requiereSesion();
    const { id } = await params;
    const existente = await prisma.necesidad.findUnique({ where: { id } });
    if (!existente) return NextResponse.json({ ok: false, error: "No encontramos esa necesidad." }, { status: 404 });
    if (existente.participanteId !== sesion.participanteId) return NextResponse.json({ ok: false, error: "Solo puedes editar tus propias necesidades." }, { status: 403 });
    await requiereEventoAbierto(sesion.eventoId);
    const datos = esquemaNecesidad.parse(await leerJSON(peticion));
    const necesidad = await prisma.necesidad.update({ where: { id }, data: {
      nombre: datos.nombre, descripcion: datos.descripcion || null, fotoUrl: datos.fotoUrl || null, linkReferencia: datos.linkReferencia || null,
    } });
    if (existente.fotoUrl && existente.fotoUrl !== necesidad.fotoUrl) await limpiarFotoSinUso(existente.fotoUrl);
    return NextResponse.json({ ok: true, datos: necesidad });
  } catch (error) {
    return responderError(error);
  }
}

export async function DELETE(_peticion: Request, { params }: ContextoRuta) {
  try {
    const sesion = await requiereSesion();
    const { id } = await params;
    const necesidad = await prisma.necesidad.findUnique({ where: { id } });
    if (!necesidad) return NextResponse.json({ ok: false, error: "No encontramos esa necesidad." }, { status: 404 });
    if (necesidad.participanteId !== sesion.participanteId) return NextResponse.json({ ok: false, error: "Solo puedes borrar tus propias necesidades." }, { status: 403 });
    await requiereEventoAbierto(sesion.eventoId);
    // El borrado en cascada no debe revertir una elección ya confirmada.
    const eliminada = await prisma.necesidad.deleteMany({
      where: { id, participanteId: sesion.participanteId, regalo: { is: null } },
    });
    if (!eliminada.count) {
      const existe = await prisma.necesidad.count({ where: { id, participanteId: sesion.participanteId } });
      if (!existe) return NextResponse.json({ ok: false, error: "No encontramos esa necesidad." }, { status: 404 });
      return NextResponse.json({ ok: false, error: "Esta necesidad está vinculada al intercambio. Todavía puedes editar sus detalles." }, { status: 409 });
    }
    if (necesidad.fotoUrl) await limpiarFotoSinUso(necesidad.fotoUrl);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return responderError(error);
  }
}

async function limpiarFotoSinUso(url: string) {
  try {
    // Una foto compartida por otra necesidad no debe borrarse del disco.
    const [enNecesidades, enPerfiles] = await Promise.all([
      prisma.necesidad.count({ where: { fotoUrl: url } }),
      prisma.participante.count({ where: { fotoUrl: url } }),
    ]);
    if (enNecesidades === 0 && enPerfiles === 0) await eliminarFoto(url);
  } catch (error) {
    // La necesidad ya se guardó; una limpieza fallida no debe informar lo contrario.
    console.error("No se pudo limpiar la foto anterior:", error);
  }
}
