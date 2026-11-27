import { redirect } from "next/navigation";
import { GET as personaSecreta } from "@/app/api/regalos/necesidades-persona-secreta/route";
import { GET as necesidadesActuales } from "@/app/api/necesidades/route";
import { GET as pistasActuales } from "@/app/api/pistas/route";
import { GET as candidatosActuales } from "@/app/api/adivinanza/candidatos/route";
import { FormularioAdivinanza } from "@/componentes/formularios/FormularioAdivinanza";
import { LIMITES, MENSAJES } from "@/lib/constantes";
import { consultar, rutaRevelacion, sesionParticipante } from "../datos";

export default async function PaginaAdivinar() {
  const sesion = await sesionParticipante();
  const asignacion = await personaSecreta();
  if (asignacion.ok) redirect("/participar/regalar");
  if (asignacion.status === 401) redirect("/ingresar");
  if (asignacion.status !== 403) throw new Error("No pudimos comprobar tu asignación.");
  const { error } = await asignacion.json() as { error: string };
  if (error === MENSAJES.EVENTO_CERRADO) redirect(rutaRevelacion);

  const necesidades = await consultar<{ id: string }[]>(await necesidadesActuales());
  if (necesidades.length < LIMITES.MIN_NECESIDADES) redirect("/participar/necesidades");
  const pistas = await consultar<unknown>(await pistasActuales());
  if (!pistas) redirect(`/participar/pistas?motivo=${encodeURIComponent(MENSAJES.PISTAS_FALTANTES)}`);
  const candidatos = await consultar<{ participanteId: string }[]>(await candidatosActuales());
  return <FormularioAdivinanza cantidadInicial={candidatos.length} fechaLimite={sesion.evento.fechaLimite} />;
}
