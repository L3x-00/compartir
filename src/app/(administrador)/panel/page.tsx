import type { Metadata } from "next";
import { PanelAdmin } from "@/componentes/formularios/PanelAdmin";
import { cargarPanel } from "./datos";

export const metadata: Metadata = { title: "Panel de administrador" };

export default async function PaginaPanel() {
  const { resumen } = await cargarPanel();
  return <PanelAdmin resumen={resumen} />;
}
