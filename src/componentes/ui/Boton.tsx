"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { Cargador } from "./Cargador";

const VENTANA_DOBLE_TOQUE = 400;

type Propiedades = Omit<HTMLMotionProps<"button">, "children"> & {
  children?: ReactNode;
  variante?: "primario" | "secundario" | "dorado" | "fantasma" | "peligro";
  cargando?: boolean; icono?: LucideIcon;
};
/** Botón táctil con respuesta breve, estados accesibles y protección contra doble toque. */
export function Boton({ variante = "primario", cargando = false, icono: Icono, children, className = "", disabled, type = "button", onClick, ...propiedades }: Propiedades) {
  const reducido = usarReducirMovimiento();
  const [pulsado, cambiarPulsado] = useState(false);
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cargandoAntes = useRef(cargando);
  const bloqueado = disabled || cargando;

  useEffect(() => () => { if (reloj.current) clearTimeout(reloj.current); }, []);
  useEffect(() => {
    if (cargandoAntes.current && !cargando && reloj.current) {
      clearTimeout(reloj.current);
      reloj.current = null;
      cambiarPulsado(false);
    }
    cargandoAntes.current = cargando;
  }, [cargando]);
  useEffect(() => {
    if (bloqueado && reloj.current) {
      clearTimeout(reloj.current);
      reloj.current = null;
      cambiarPulsado(false);
    }
  }, [bloqueado]);

  function alHacerClic(evento: MouseEvent<HTMLButtonElement>) {
    if (pulsado || bloqueado) {
      evento.preventDefault();
      evento.stopPropagation();
      return;
    }
    cambiarPulsado(true);
    reloj.current = setTimeout(() => { reloj.current = null; cambiarPulsado(false); }, VENTANA_DOBLE_TOQUE);
    if (type === "submit" && !onClick) {
      // El submit explícito evita que el cambio de disabled cancele la acción por defecto.
      evento.preventDefault();
      evento.currentTarget.form?.requestSubmit();
      return;
    }
    onClick?.(evento);
  }

  return <motion.button {...propiedades} type={type} onClick={alHacerClic} disabled={bloqueado || pulsado} aria-busy={cargando || undefined}
    className={`boton boton-${variante} ${className}`} whileHover={!reducido && !bloqueado ? { scale: 1.02 } : undefined} whileTap={!reducido && !bloqueado ? { scale: 0.97 } : undefined}>
    {cargando ? <Cargador tamano="sm" etiqueta="Procesando" /> : Icono ? <Icono size={19} aria-hidden="true" /> : null}
    <span>{children}</span>
  </motion.button>;
}
