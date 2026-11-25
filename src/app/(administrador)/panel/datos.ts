import "server-only";
import { redirect } from "next/navigation";
import { GET as resumen } from "@/app/api/admin/resumen/route";
import { sesionParticipante } from "@/app/(publico)/participar/datos";
import type { ResumenAdmin } from "@/tipos/final";
import type { RespuestaAPI } from "@/tipos/indice";

export async function cargarPanel() {
  const sesion = await sesionParticipante(true);
  if (!sesion.esAdmin) redirect("/participar/necesidades");
  const respuesta = await resumen();
  if (respuesta.status === 401) redirect("/ingresar");
  if (respuesta.status === 403) redirect("/participar/necesidades");
  const datos = await respuesta.json() as RespuestaAPI<ResumenAdmin>;
  return { resumen: datos.ok ? datos.datos : null, evento: sesion.evento };
}
