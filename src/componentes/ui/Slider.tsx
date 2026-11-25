"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

type Propiedades = { etiqueta: string; valor: number; alCambiar: (valor: number) => void; min?: number; max?: number; paso?: number; textoValor?: string; deshabilitado?: boolean };
/** El range nativo conserva flechas, Home/End y soporte táctil. */
export function Slider({ etiqueta, valor, alCambiar, min = 0, max = 100, paso = 1, textoValor, deshabilitado = false }: Propiedades) {
  const id = useId(), reducido = usarReducirMovimiento(); const progreso = max > min ? Math.min(1, Math.max(0, (valor - min) / (max - min))) : 0;
  return <div className="slider"><div className="slider-etiqueta"><label htmlFor={id}>{etiqueta}</label><output htmlFor={id}>{textoValor || valor}</output></div>
    <div className="slider-control"><div className="slider-pista"><motion.span animate={{ scaleX: progreso }} style={{ transformOrigin: "left" }} transition={reducido ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 28 }} /></div>
      <input id={id} type="range" min={min} max={max} step={paso} value={valor} aria-valuetext={textoValor} disabled={deshabilitado} onChange={(evento) => alCambiar(Number(evento.target.value))} />
    </div></div>;
}
