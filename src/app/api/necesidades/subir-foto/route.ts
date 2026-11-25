import { NextResponse } from "next/server";
import { requiereSesion, requiereEventoAbierto, responderError } from "@/lib/auth";
import { guardarFoto } from "@/lib/archivos";

export async function POST(peticion: Request) {
  try {
    const sesion = await requiereSesion();
    await requiereEventoAbierto(sesion.eventoId);
    let formulario: FormData;
    try {
      formulario = await peticion.formData();
    } catch {
      return NextResponse.json({ ok: false, error: "Envía la foto como un formulario de archivo." }, { status: 400 });
    }
    const archivo = formulario.get("foto");
    if (!(archivo instanceof File)) return NextResponse.json({ ok: false, error: "Selecciona una foto para subir." }, { status: 400 });
    const resultado = await guardarFoto(archivo);
    if (!resultado.ok) return NextResponse.json(resultado, { status: 400 });
    return NextResponse.json({ ok: true, datos: { url: resultado.url } });
  } catch (error) {
    return responderError(error);
  }
}
