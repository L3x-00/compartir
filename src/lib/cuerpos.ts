import { NextResponse } from "next/server";
import { LIMITES } from "@/lib/constantes";

export async function leerCuerpoLimitado(peticion: Request, maximo: number): Promise<Uint8Array> {
  const grande = () => NextResponse.json({ ok: false, error: "Los datos enviados son demasiado grandes." }, { status: 413 });
  if (Number(peticion.headers.get("content-length")) > maximo) throw grande();
  if (!peticion.body) return new Uint8Array();
  const lector = peticion.body.getReader();
  const partes: Uint8Array[] = [];
  let cantidad = 0;
  try {
    while (true) {
      const { done, value } = await lector.read();
      if (done) break;
      cantidad += value.byteLength;
      if (cantidad > maximo) { await lector.cancel(); throw grande(); }
      partes.push(value);
    }
  } finally { lector.releaseLock(); }
  const cuerpo = new Uint8Array(cantidad);
  let posicion = 0;
  for (const parte of partes) { cuerpo.set(parte, posicion); posicion += parte.byteLength; }
  return cuerpo;
}

export async function leerFormularioFoto(peticion: Request): Promise<FormData> {
  const cuerpo = await leerCuerpoLimitado(peticion, LIMITES.MAX_FOTO_BYTES + 64 * 1024);
  try {
    return await new Response(cuerpo as BodyInit, { headers: { "Content-Type": peticion.headers.get("content-type") || "" } }).formData();
  } catch {
    throw NextResponse.json({ ok: false, error: "Envía la foto como un formulario de archivo válido." }, { status: 400 });
  }
}
