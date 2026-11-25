"use client";

import { motion } from "framer-motion";
import { Snowflake } from "lucide-react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

/** El copo estático conserva el estado de carga con movimiento reducido. */
export function Cargador({ tamano = "md", etiqueta = "Cargando" }: { tamano?: "sm" | "md" | "lg"; etiqueta?: string }) {
  const reducido = usarReducirMovimiento();
  const medida = { sm: 18, md: 28, lg: 42 }[tamano];
  return <motion.span role="status" aria-label={etiqueta} className="cargador" animate={reducido ? { rotate: 0, scale: 1 } : { rotate: 360, scale: [1, 1.1, 1] }} transition={{ rotate: { duration: 3, repeat: Infinity, ease: "linear" }, scale: { duration: 1.5, repeat: Infinity } }}>
    <Snowflake width={medida} height={medida} aria-hidden="true" />
  </motion.span>;
}
