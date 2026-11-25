"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

type Propiedades = { etiqueta: string; seleccionada: boolean; alCambiar: (seleccionada: boolean) => void; descripcion?: string; icono?: LucideIcon; variante?: "simple" | "descripcion" | "icono"; deshabilitada?: boolean; grupo?: string };
/** Usa controles nativos para el teclado y dibuja el estado con un SVG. */
export function Casilla({ etiqueta, seleccionada, alCambiar, descripcion, icono: Icono, variante = "simple", deshabilitada = false, grupo }: Propiedades) {
  const id = useId(), reducido = usarReducirMovimiento();
  return <motion.label htmlFor={id} className={`casilla casilla-${variante} ${deshabilitada ? "casilla-deshabilitada" : ""}`} whileTap={reducido || deshabilitada ? undefined : { scale: 0.98 }}>
    <input id={id} type={grupo ? "radio" : "checkbox"} name={grupo} checked={seleccionada} onChange={(evento) => alCambiar(evento.target.checked)} disabled={deshabilitada} />
    <motion.span className="casilla-marca" animate={{ scale: !reducido && seleccionada ? [1, 1.12, 1] : 1 }}>
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><motion.path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" animate={{ pathLength: seleccionada ? 1 : 0 }} transition={{ duration: reducido ? 0 : 0.2 }} /></svg>
    </motion.span>
    {Icono && <Icono size={20} aria-hidden="true" />}<span><strong>{etiqueta}</strong>{descripcion && <small>{descripcion}</small>}</span>
  </motion.label>;
}
