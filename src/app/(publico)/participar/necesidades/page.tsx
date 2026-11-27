import { GET } from "@/app/api/necesidades/route";
import { GET as pistasActuales } from "@/app/api/pistas/route";
import { FormularioNecesidad, type NecesidadVista } from "@/componentes/formularios/FormularioNecesidad";
import { contarRespondidas } from "@/lib/progreso";
import type { Pistas } from "@/tipos/pistas";
import { consultar, sesionParticipante } from "../datos";

export default async function PaginaNecesidades() {
  await sesionParticipante();
  const [necesidades, registradas] = await Promise.all([
    consultar<NecesidadVista[]>(await GET()),
    consultar<{ pistas: Pistas } | null>(await pistasActuales()),
  ]);
  const respondidas = contarRespondidas(registradas?.pistas ?? null);
  return <FormularioNecesidad iniciales={necesidades} respondidas={respondidas} pistasCompletas={respondidas === 14} />;
}
