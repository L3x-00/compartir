import { redirect } from "next/navigation";
import { GET as necesidadesActuales } from "@/app/api/necesidades/route";
import { GET as pistasActuales } from "@/app/api/pistas/route";
import { FormularioPistas } from "@/componentes/formularios/FormularioPistas";
import { LIMITES } from "@/lib/constantes";
import type { Pistas } from "@/tipos/pistas";
import { consultar, sesionParticipante } from "../datos";

export default async function PaginaPistas({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const { motivo } = await searchParams;
  const sesion = await sesionParticipante();
  const necesidades = await consultar<{ id: string }[]>(await necesidadesActuales());
  if (necesidades.length < LIMITES.MIN_NECESIDADES) redirect("/participar/necesidades");
  const registradas = await consultar<{ pistas: Pistas; actualizadoEn: string } | null>(await pistasActuales());
  return <FormularioPistas iniciales={registradas?.pistas} version={registradas?.actualizadoEn ?? null}
    motivo={motivo} claveBorrador={`cn:pistas:${sesion.evento.id}:${sesion.participanteId}`} />;
}
