"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

type Propiedades = InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; error?: string; ayuda?: string; icono?: LucideIcon; variante?: "texto" | "pin" };
/** Un solo input permite pegar el PIN y utilizar gestores de contraseñas. */
export const Entrada = forwardRef<HTMLInputElement, Propiedades>(function Entrada({ etiqueta, error, ayuda, icono: Icono, variante = "texto", id, className = "", type, ...propiedades }, referencia) {
  const generado = useId(); const identificador = id || generado; const reducido = usarReducirMovimiento();
  const ids = [ayuda ? `${identificador}-ayuda` : null, error ? `${identificador}-error` : null].filter(Boolean).join(" ");
  return <div className={`campo ${variante === "pin" ? "campo-pin" : ""} ${Icono ? "campo-icono" : ""} ${error ? "campo-invalido" : ""} ${className}`}>
    <div className="campo-control">
      {Icono && <Icono className="campo-simbolo" size={20} aria-hidden="true" />}
      <input {...propiedades} ref={referencia} id={identificador} type={type || (variante === "pin" ? "password" : "text")} placeholder=" " aria-invalid={!!error} aria-describedby={ids || undefined} />
      <label htmlFor={identificador}>{etiqueta}</label>
    </div>
    {ayuda && <p className={error ? "sr-only" : "campo-ayuda"} id={`${identificador}-ayuda`}>{ayuda}</p>}
    <AnimatePresence initial={false}>{error && <motion.p key="error" id={`${identificador}-error`} className="campo-error" role="alert" initial={{ opacity: 0, y: reducido ? 0 : -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducido ? 0 : 0.15 }}>{error}</motion.p>}</AnimatePresence>
  </div>;
});
