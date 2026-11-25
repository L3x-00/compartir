"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Boton } from "@/componentes/ui/Boton";

/** Recuperación visible sin exponer detalles internos del error. */
export default function ErrorPagina({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="contenido" className="contenedor estado-ingreso"><h1 className="display">Un pequeño imprevisto.</h1><p>La sorpresa puede esperar un momento. Intenta cargar la página otra vez.</p><Boton variante="dorado" icono={RefreshCw} onClick={reset}>Intentar de nuevo</Boton><p className="mt-6"><Link href="/">Volver al inicio</Link></p></main>;
}
