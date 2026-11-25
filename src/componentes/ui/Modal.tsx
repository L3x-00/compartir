"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

/** dialog administra foco, Escape y bloqueo del contenido de fondo. */
export function Modal({ abierto, alCerrar, titulo, children, cerrable = true, alTerminarCierre }: {
  abierto: boolean; alCerrar: () => void; titulo: string; children: ReactNode;
  cerrable?: boolean; alTerminarCierre?: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null), identificador = useId(); const reducido = usarReducirMovimiento();
  useEffect(() => { if (abierto && !dialogo.current?.open) dialogo.current?.showModal(); }, [abierto]);
  return <dialog ref={dialogo} className="modal" aria-labelledby={identificador} onCancel={(evento) => { evento.preventDefault(); if (cerrable) alCerrar(); }} onClick={(evento) => { if (cerrable && evento.target === evento.currentTarget) alCerrar(); }}>
    <AnimatePresence onExitComplete={() => {
      if (!abierto) { dialogo.current?.close(); alTerminarCierre?.(); }
    }}>
      {abierto && <motion.div className="modal-contenido" initial={{ opacity: 0, scale: reducido ? 1 : 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reducido ? 1 : 0.97 }} transition={{ duration: reducido ? 0 : 0.2 }}>
        <div className="modal-cabecera"><h2 id={identificador}>{titulo}</h2>{cerrable && <motion.button type="button" className="control-icono" aria-label="Cerrar ventana" onClick={alCerrar} whileHover={reducido ? undefined : { rotate: 90 }}><X size={20} aria-hidden="true" /></motion.button>}</div>
        {children}
      </motion.div>}
    </AnimatePresence>
  </dialog>;
}
