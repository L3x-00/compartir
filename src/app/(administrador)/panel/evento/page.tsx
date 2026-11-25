import type { Metadata } from "next";
import { FormularioEvento } from "@/componentes/formularios/FormularioEvento";
import { cargarPanel } from "../datos";

export const metadata: Metadata = { title: "Configurar evento" };

export default async function PaginaConfigurarEvento() {
  const { evento } = await cargarPanel();
  return <FormularioEvento evento={evento} />;
}
