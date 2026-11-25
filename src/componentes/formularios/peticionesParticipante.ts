import { MENSAJES } from "@/lib/constantes";
import type { RespuestaAPI } from "@/tipos/indice";

export class ErrorParticipante extends Error {
  constructor(mensaje: string, readonly estado: number) { super(mensaje); }
}

export async function pedir<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  const limite = AbortSignal.timeout(opciones?.body instanceof FormData ? 45_000 : 15_000);
  const signal = opciones?.signal ? AbortSignal.any([limite, opciones.signal]) : limite;
  let respuesta: Response | undefined;
  let resultado: RespuestaAPI<T> | null;
  try {
    respuesta = await fetch(ruta, { cache: "no-store", ...opciones, signal });
    resultado = await respuesta.json() as RespuestaAPI<T>;
  } catch {
    if (limite.aborted) {
      throw new ErrorParticipante("La respuesta tardó demasiado. Puedes revisar e intentar de nuevo.", 0);
    }
    if (respuesta) throw new ErrorParticipante(MENSAJES.ERROR_GENERICO, respuesta.status);
    throw new ErrorParticipante("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.", 0);
  }
  if (!respuesta.ok || !resultado?.ok) {
    throw new ErrorParticipante(resultado && !resultado.ok ? resultado.error : MENSAJES.ERROR_GENERICO, respuesta.status);
  }
  return resultado.datos;
}

export function conJSON(method: string, datos: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) };
}

export function rutaFoto(url: string | null | undefined): string | undefined {
  return url && /^\/uploads\/[\w-]+\.(?:jpe?g|png|webp)$/i.test(url) ? url : undefined;
}

export function srcFoto(url: string | null | undefined): string | undefined {
  const ruta = rutaFoto(url);
  const nombre = ruta?.match(/^\/uploads\/(\d+-[a-f0-9]{8}\.(?:jpg|png|webp))$/)?.[1];
  return nombre ? "/api/fotos/" + nombre : ruta;
}

export function mensajeParticipante(error: unknown, navegar: (ruta: string) => void): string {
  if (error instanceof ErrorParticipante) {
    if (error.estado === 401) navegar("/ingresar");
    if (error.estado === 403 && error.message === MENSAJES.EVENTO_CERRADO) {
      navegar("/participar/revelacion?evento=cerrado");
    }
    return error.message;
  }
  return MENSAJES.ERROR_GENERICO;
}
