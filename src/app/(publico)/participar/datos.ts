import "server-only";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { MENSAJES } from "@/lib/constantes";
import { GET as sesionActual } from "@/app/api/auth/sesion/route";
import type { SesionVista } from "@/hooks/usarSesion";
import type { RespuestaAPI } from "@/tipos/indice";

export const rutaRevelacion = "/participar/revelacion?evento=cerrado";

// Reutiliza el GET existente en el contexto de cookies de la página, sin una petición al propio servidor.
export async function consultar<T>(respuesta: Response): Promise<T> {
  if (respuesta.status === 401) redirect("/ingresar");
  const resultado = await respuesta.json() as RespuestaAPI<T>;
  if (respuesta.status === 403) {
    const motivo = !resultado.ok ? resultado.error : MENSAJES.EVENTO_CERRADO;
    if (motivo === MENSAJES.EVENTO_CERRADO) redirect(rutaRevelacion);
    redirect(`/participar/mi-panel?motivo=${encodeURIComponent(motivo)}`);
  }
  if (!respuesta.ok || !resultado.ok) throw new Error(!resultado.ok ? resultado.error : "No pudimos cargar los datos de esta etapa.");
  return resultado.datos;
}

export async function sesionParticipante(permitirCerrado = false) {
  if (!await obtenerSesion()) redirect("/ingresar");
  const sesion = await consultar<Omit<SesionVista, "eventoId"> | null>(await sesionActual());
  if (!sesion) redirect("/ingresar");
  if (!permitirCerrado && sesion.evento.cerrado) redirect(rutaRevelacion);
  return sesion;
}
