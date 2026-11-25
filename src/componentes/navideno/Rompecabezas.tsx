"use client";

import { motion } from "framer-motion";
import { PiezaRompecabezas } from "./PiezaRompecabezas";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

/** El destello final sucede solo cuando las cuatro piezas están encajadas. */
export function Rompecabezas({ completas }: { completas: boolean[] }) {
  const reducido = usarReducirMovimiento();
  const listo = completas.every(Boolean);
  return <motion.svg className="puzzle-piezas" viewBox="-8 -8 184 156" aria-hidden="true" initial={false}
    animate={listo && !reducido ? { rotate: [0, -6, 5, 0], scale: [1, 1.09, 1] } : { rotate: 0, scale: 1 }}
    transition={{ duration: reducido ? 0 : .58 }}>
    {completas.map((completa, indice) => <PiezaRompecabezas key={indice} indice={indice} completa={completa} />)}
  </motion.svg>;
}
