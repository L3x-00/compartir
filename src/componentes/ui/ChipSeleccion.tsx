"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

type Props = { texto: string; seleccionado: boolean; alElegir: () => void; grupo?: string; icono?: LucideIcon; dorado?: boolean };

/** Usa radios nativos en los grupos, con selección visible y navegación por flechas. */
export function ChipSeleccion({ texto, seleccionado, alElegir, grupo, icono: Icono, dorado }: Props) {
  const reducido = usarReducirMovimiento();
  const clase = `chip-pista ${dorado ? "chip-pista-dorado" : ""} ${seleccionado ? "chip-pista-activo" : ""}`;
  const contenido = <>
    {Icono && <Icono size={17} aria-hidden="true" />}
    <span>{texto}</span>
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <motion.path d="m4 10 4 4 8-8" fill="none" stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" initial={false}
        animate={{ pathLength: seleccionado ? 1 : 0, opacity: seleccionado ? 1 : 0 }}
        transition={{ duration: reducido ? 0 : .22 }} />
    </svg>
  </>;
  const interaccion = {
    whileHover: reducido ? undefined : { y: -2 },
    whileTap: reducido ? undefined : { scale: .97 },
    animate: { scale: seleccionado && !reducido ? [1, 1.045, 1] : 1 },
  };
  if (grupo) return <motion.label className={clase} {...interaccion}>
    <input className="sr-only" type="radio" name={grupo} checked={seleccionado} onChange={alElegir} />
    {contenido}
  </motion.label>;
  return <motion.button type="button" className={clase} aria-pressed={seleccionado} onClick={alElegir} {...interaccion}>
    {contenido}
  </motion.button>;
}
