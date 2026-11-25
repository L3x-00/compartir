"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

const contornos = [
  "M4 4H84V25C104 17 104 53 84 45V70H57C64 90 25 90 32 70H4Z",
  "M84 4H164V70H137C144 50 105 50 112 70H84V45C104 53 104 17 84 25Z",
  "M4 70H32C25 90 64 90 57 70H84V95C64 87 64 123 84 115V136H4Z",
  "M84 70H112C105 50 144 50 137 70H164V136H84V115C64 123 64 87 84 95Z",
];
const centros = [[37, 34], [130, 32], [39, 106], [129, 109]];

/** Cada contorno comparte su borde con la pieza vecina y encaja al completar la categoría. */
export function PiezaRompecabezas({ indice, completa }: { indice: number; completa: boolean }) {
  const reducido = usarReducirMovimiento();
  const completaAlMontar = useRef(completa);
  const encaja = completa && !completaAlMontar.current && !reducido;
  const [x, y] = centros[indice];
  return <motion.g className={completa ? "pieza-completa" : "pieza-pendiente"} initial={false}
    animate={{
      x: completa || reducido ? 0 : indice % 2 === 0 ? -4 : 4,
      y: completa || reducido ? 0 : indice < 2 ? -4 : 4,
      scale: encaja ? [1, 1.09, 1] : 1,
    }}
    transition={reducido ? { duration: 0 } : { type: "spring", stiffness: 290, damping: 24, scale: { duration: .3 } }}>
    <path d={contornos[indice]} strokeWidth="2.5" strokeLinejoin="round" />
    {encaja && <motion.path d={contornos[indice]} fill="none" stroke="var(--color-navidad-dorado-claro)"
      strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
      initial={{ opacity: 0, pathLength: .25 }} animate={{ opacity: [0, .95, 0], pathLength: 1 }}
      transition={{ duration: .55, opacity: { duration: .55, times: [0, .24, 1] } }} />}
    {completa ? <motion.path d={`M${x - 8} ${y}l6 6 11-12`} fill="none" stroke="currentColor"
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: encaja ? 0 : 1 }}
      animate={{ pathLength: 1 }} transition={{ duration: encaja ? .27 : 0 }} />
      : <text x={x} y={y} textAnchor="middle" dominantBaseline="central">{indice + 1}</text>}
  </motion.g>;
}
