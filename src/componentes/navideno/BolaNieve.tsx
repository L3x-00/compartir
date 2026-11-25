"use client";

import { motion } from "framer-motion";
import { CopoNieve } from "./CopoNieve";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

/** La esfera queda quieta si el usuario pausa los efectos o reduce el movimiento. */
export function BolaNieve() {
  const reducido = usarReducirMovimiento();
  return <span className="bola-nieve" aria-hidden="true">
    <motion.span key={String(reducido)} animate={reducido ? { rotate: 0 } : { rotate: 360 }}
      transition={reducido ? { duration: 0 } : { duration: 3, repeat: Infinity, ease: "linear" }}>
      <CopoNieve tamano={42} />
    </motion.span>
    <svg className="bola-nieve-fondo" viewBox="0 0 90 90" fill="none">
      <circle cx="45" cy="39" r="33" stroke="currentColor" strokeWidth="2" />
      <path d="M24 24Q30 15 40 13M17 67h56l7 13H10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  </span>;
}
