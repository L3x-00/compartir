import type { ReactNode } from "react";
import { Encabezado } from "@/componentes/layout/Encabezado";
import { PiePagina } from "@/componentes/layout/PiePagina";
import "../../(publico)/participar/participante.css";
import "../../(publico)/participar/final.css";
import "./panel.css";

export default function LayoutAdministrador({ children }: { children: ReactNode }) {
  return <><Encabezado /><main id="contenido" className="contenedor participante admin-contenedor">{children}</main><PiePagina /></>;
}
