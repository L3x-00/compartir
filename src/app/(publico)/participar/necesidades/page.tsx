import { GET } from "@/app/api/necesidades/route";
import { FormularioNecesidad, type NecesidadVista } from "@/componentes/formularios/FormularioNecesidad";
import { consultar, sesionParticipante } from "../datos";

export default async function PaginaNecesidades() {
  await sesionParticipante();
  const necesidades = await consultar<NecesidadVista[]>(await GET());
  return <FormularioNecesidad iniciales={necesidades} />;
}
