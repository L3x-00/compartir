"use client";

import { motion } from "framer-motion";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

/** El valor accesible es inmediato y el relleno se mueve sin recalcular el ancho. */
export function BarraProgreso({ valor, etiqueta, texto }: { valor: number; etiqueta: string; texto?: string }) {
  const reducido = usarReducirMovimiento();
  const porcentaje = Math.max(0, Math.min(100, valor));
  return <div className="barra-participante" role="progressbar" aria-label={etiqueta}
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentaje} aria-valuetext={texto}>
    <motion.span initial={false} animate={{ scaleX: porcentaje / 100 }} transition={reducido
      ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 24 }} />
  </div>;
}
