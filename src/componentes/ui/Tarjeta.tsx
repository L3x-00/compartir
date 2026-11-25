"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from "framer-motion";
import { Check } from "lucide-react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

type Propiedades = Omit<HTMLMotionProps<"article">, "children" | "onPointerMove" | "onPointerLeave" | "onPointerEnter"> & { children?: ReactNode; variante?: "normal" | "destacada" | "completada"; brillo?: boolean; inclinable?: boolean };
/** El marco permanece quieto; solo el contenido se inclina con un puntero preciso. */
export function Tarjeta({ variante = "normal", brillo = false, inclinable = false, children, className = "", ...propiedades }: Propiedades) {
  const reducido = usarReducirMovimiento(); const limites = useRef<DOMRect | null>(null);
  const x = useMotionValue(0), y = useMotionValue(0); const giroX = useSpring(x, { stiffness: 180, damping: 24 }), giroY = useSpring(y, { stiffness: 180, damping: 24 });
  return <motion.article {...propiedades} className={`tarjeta-marco ${className}`} onPointerEnter={(evento) => { limites.current = evento.currentTarget.getBoundingClientRect(); }}
    onPointerMove={(evento) => { if (!inclinable || reducido || evento.pointerType !== "mouse" || !limites.current) return; const caja = limites.current; x.set(-((evento.clientY - caja.top) / caja.height - 0.5) * 5); y.set(((evento.clientX - caja.left) / caja.width - 0.5) * 5); }}
    onPointerLeave={() => { x.set(0); y.set(0); }}>
    <motion.div className={`tarjeta tarjeta-${variante} ${brillo ? "tarjeta-brillo" : ""}`} style={{ rotateX: reducido ? 0 : giroX, rotateY: reducido ? 0 : giroY }} whileHover={reducido ? undefined : { y: -4 }}>
      {variante === "completada" && <motion.span className="tarjeta-check" initial={{ scale: reducido ? 1 : 0 }} animate={{ scale: 1 }}><Check size={18} aria-label="Completado" /></motion.span>}
      {children}
    </motion.div>
  </motion.article>;
}
