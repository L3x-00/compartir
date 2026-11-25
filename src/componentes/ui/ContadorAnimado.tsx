"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

const formato = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });

/** Solo actualiza el texto visual por fotograma. Los lectores reciben el valor final. */
export function ContadorAnimado({ valor, sufijo = "", desdeCero = false }: { valor: number; sufijo?: string; desdeCero?: boolean }) {
  const reducido = usarReducirMovimiento();
  const numero = useMotionValue(desdeCero ? 0 : valor);
  const texto = useTransform(numero, (actual) => formato.format(Math.round(actual * 100) / 100) + sufijo);
  useEffect(() => {
    if (reducido) { numero.set(valor); return; }
    const animacion = animate(numero, valor, { duration: desdeCero ? .7 : .16, ease: "easeOut" });
    return () => animacion.stop();
  }, [desdeCero, numero, reducido, valor]);
  return <><span className="sr-only">{formato.format(valor)}{sufijo}</span><motion.span aria-hidden="true">{texto}</motion.span></>;
}
