import type { ReactNode } from "react";
import { Encabezado } from "@/componentes/layout/Encabezado";
import { PiePagina } from "@/componentes/layout/PiePagina";
import "./participante.css";
import "./final.css";

export default function LayoutParticipante({ children }: { children: ReactNode }) {
  return <><Encabezado /><main id="contenido" className="contenedor participante">{children}</main><PiePagina /></>;
}
