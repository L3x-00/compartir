import { NextResponse } from "next/server";
import { requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { guardarFoto, prepararFoto, limpiarFotosVencidas, limpiarFotoSinUso } from "@/lib/archivos";
import { leerFormularioFoto } from "@/lib/cuerpos";
import { conEventoAbierto } from "@/lib/evento";

export async function POST(peticion: Request) {
  let url: string | undefined;
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    const formulario = await leerFormularioFoto(peticion);
    const archivos = formulario.getAll("foto");
    if (archivos.length !== 1 || !(archivos[0] instanceof File)) return NextResponse.json({ ok: false, error: "Selecciona una sola foto para subir." }, { status: 400 });
    const preparada = await prepararFoto(archivos[0]);
    await limpiarFotosVencidas();
    await conEventoAbierto(sesion.eventoId, async (tx) => { url = await guardarFoto(preparada, sesion.participanteId, tx); });
    return NextResponse.json({ ok: true, datos: { url } });
  } catch (error) {
    if (url) await limpiarFotoSinUso(url);
    return responderError(error);
  }
}
