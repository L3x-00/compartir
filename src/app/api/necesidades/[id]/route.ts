import { NextResponse } from "next/server";
import { leerJSON, requiereSesion, responderError } from "@/lib/auth";
import { esquemaNecesidad } from "@/lib/validaciones/necesidad";
import { limpiarFotoSinUso, validarFotoPropia } from "@/lib/archivos";
import { conEventoAbierto } from "@/lib/evento";

type ContextoRuta = { params: Promise<{ id: string }> };
export async function PUT(peticion: Request, { params }: ContextoRuta) {
  try {
    const sesion = await requiereSesion();
    const { id } = await params;
    const datos = esquemaNecesidad.parse(await leerJSON(peticion));
    const { necesidad, anterior } = await conEventoAbierto(sesion.eventoId, async (tx) => {
      const existente = await tx.necesidad.findUnique({ where: { id } });
      if (!existente) throw NextResponse.json({ ok: false, error: "No encontramos esa necesidad." }, { status: 404 });
      if (existente.participanteId !== sesion.participanteId) throw NextResponse.json({ ok: false, error: "Solo puedes editar tus propias necesidades." }, { status: 403 });
      const fotoUrl = datos.fotoUrl === undefined ? existente.fotoUrl : datos.fotoUrl;
      await validarFotoPropia(tx, fotoUrl, sesion.participanteId, existente.fotoUrl);
      const necesidad = await tx.necesidad.update({ where: { id }, data: {
        nombre: datos.nombre, descripcion: datos.descripcion || null, fotoUrl, linkReferencia: datos.linkReferencia || null,
      } });
      return { necesidad, anterior: existente.fotoUrl };
    });
    if (anterior && anterior !== necesidad.fotoUrl) await limpiarFotoSinUso(anterior);
    return NextResponse.json({ ok: true, datos: necesidad });
  } catch (error) { return responderError(error); }
}

export async function DELETE(_peticion: Request, { params }: ContextoRuta) {
  try {
    const sesion = await requiereSesion();
    const { id } = await params;
    const url = await conEventoAbierto(sesion.eventoId, async (tx) => {
      const necesidad = await tx.necesidad.findUnique({ where: { id }, include: { regalo: true } });
      if (!necesidad) throw NextResponse.json({ ok: false, error: "No encontramos esa necesidad." }, { status: 404 });
      if (necesidad.participanteId !== sesion.participanteId) throw NextResponse.json({ ok: false, error: "Solo puedes borrar tus propias necesidades." }, { status: 403 });
      if (necesidad.regalo) throw NextResponse.json({ ok: false, error: "Esta necesidad está vinculada al intercambio. Todavía puedes editar sus detalles." }, { status: 409 });
      await tx.necesidad.delete({ where: { id } });
      return necesidad.fotoUrl;
    });
    if (url) await limpiarFotoSinUso(url);
    return NextResponse.json({ ok: true });
  } catch (error) { return responderError(error); }
}
