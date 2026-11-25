"use client";

import { motion } from "framer-motion";
import { Gift, Fingerprint, Puzzle, PackageCheck, Sparkles, Check } from "lucide-react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

const pasos = [{ nombre: "Necesidades", icono: Gift }, { nombre: "Pistas", icono: Fingerprint }, { nombre: "Adivinar", icono: Puzzle }, { nombre: "Regalar", icono: PackageCheck }, { nombre: "Tu regalo", icono: Sparkles }];
/** Indicador de estado: no permite saltarse requisitos del juego. */
export function Navegacion({ pasoActual = 0, completados }: { pasoActual?: number; completados?: number }) {
  const reducido = usarReducirMovimiento(); const actual = Math.min(4, Math.max(0, pasoActual));
  const hechos = completados ?? actual;
  return <nav className="pasos-navegacion" aria-label="Progreso del juego"><div className="pasos-linea"><motion.span animate={{ scaleX: hechos / 4 }} style={{ transformOrigin: "left" }} transition={reducido ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 26 }} /></div><ol>
    {pasos.map(({ nombre, icono: Icono }, indice) => <li key={nombre} className={indice < hechos || indice === actual ? "paso-alcanzado" : ""} aria-current={indice === actual ? "step" : undefined}><motion.span className="paso-icono" animate={{ scale: !reducido && indice === actual ? 1.08 : 1 }}>{indice < hechos ? <Check size={18} aria-label="Completado" /> : <Icono size={18} aria-hidden="true" />}</motion.span><span>{nombre}</span></li>)}
  </ol></nav>;
}
