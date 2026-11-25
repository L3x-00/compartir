import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GET as lista } from "@/app/api/regalos/necesidades-persona-secreta/route";
import { FormularioRegalo } from "@/componentes/formularios/FormularioRegalo";
import { MENSAJES } from "@/lib/constantes";
import { prisma } from "@/lib/prisma";
import type { NecesidadRegalo } from "@/tipos/final";
import type { RespuestaAPI } from "@/tipos/indice";
import { rutaRevelacion, sesionParticipante } from "../datos";

export const metadata: Metadata = { title: "Elegir regalo" };

export default async function PaginaRegalar() {
  const sesion = await sesionParticipante();
  if (sesion.tieneRegaloSeleccionado) redirect("/participar/revelacion");

  const respuesta = await lista();
  const resultado = await respuesta.json() as RespuestaAPI<{ necesidades: NecesidadRegalo[] }>;
  if (respuesta.status === 401) redirect("/ingresar");
  if (!resultado.ok && respuesta.status === 403) {
    redirect(resultado.error === MENSAJES.EVENTO_CERRADO ? rutaRevelacion : "/participar/adivinar");
  }
  const pendientes = await prisma.participante.count({
    where: { eventoId: sesion.evento.id, esAdmin: false, regaloSeleccionado: { is: null } },
  });
  return <FormularioRegalo necesidades={resultado.ok ? resultado.datos.necesidades : null}
    pendientes={pendientes} fechaLimite={sesion.evento.fechaLimite} />;
}
