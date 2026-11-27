import { GET } from "@/app/api/necesidades/route";
import { GET as pistasActuales } from "@/app/api/pistas/route";
import { FormularioNecesidad, type NecesidadVista } from "@/componentes/formularios/FormularioNecesidad";
import type { Pistas } from "@/tipos/pistas";
import { consultar, sesionParticipante } from "../datos";

function contarRespondidas(pistas: Pistas | null) {
  if (!pistas) return 0;
  const plano = { ...pistas.fisico, ...pistas.personalidad, ...pistas.gustos, datoCurioso: pistas.datoCurioso };
  return Object.values(plano).filter((valor) => valor !== undefined && valor !== null && String(valor).trim() !== "").length;
}

export default async function PaginaNecesidades() {
  await sesionParticipante();
  const [necesidades, registradas] = await Promise.all([
    consultar<NecesidadVista[]>(await GET()),
    consultar<{ pistas: Pistas } | null>(await pistasActuales()),
  ]);
  const respondidas = contarRespondidas(registradas?.pistas ?? null);
  return <FormularioNecesidad iniciales={necesidades} respondidas={respondidas} pistasCompletas={respondidas === 14} />;
}
