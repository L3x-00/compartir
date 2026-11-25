"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

/** Usa el reloj real para corregir retrasos al volver a una pestaña. El lector de pantalla no recibe anuncios cada segundo. */
export function CuentaRegresiva({ fecha, compacta = false, alVencer }: {
  fecha: string; compacta?: boolean; alVencer?: () => void;
}) {
  const [restante, cambiarRestante] = useState<number | null>(null);
  const vencimiento = useRef(alVencer);
  const reducido = usarReducirMovimiento();
  useEffect(() => { vencimiento.current = alVencer; }, [alVencer]);
  useEffect(() => {
    const limite = Date.parse(fecha);
    if (!Number.isFinite(limite)) return;
    let avisado = false;
    function actualizar() {
      const segundos = Math.max(0, Math.ceil((limite - Date.now()) / 1000));
      cambiarRestante(segundos);
      if (segundos === 0 && !avisado) {
        avisado = true;
        vencimiento.current?.();
      }
      return segundos;
    }
    if (actualizar() === 0) return;
    const reloj = window.setInterval(() => { if (actualizar() === 0) window.clearInterval(reloj); }, 1000);
    document.addEventListener("visibilitychange", actualizar);
    return () => { window.clearInterval(reloj); document.removeEventListener("visibilitychange", actualizar); };
  }, [fecha]);

  const segundos = restante ?? 0;
  const partes = [
    { etiqueta: "Días", valor: Math.floor(segundos / 86400) },
    { etiqueta: "Horas", valor: Math.floor(segundos / 3600) % 24 },
    { etiqueta: "Minutos", valor: Math.floor(segundos / 60) % 60 },
    { etiqueta: "Segundos", valor: segundos % 60 },
  ];
  return <div className={compacta ? "cuenta-regresiva cuenta-compacta" : "cuenta-regresiva"} role="group" aria-label="Cuenta regresiva">
    {partes.map(({ etiqueta, valor }) => {
      const digitos = restante === null ? "––" : String(valor).padStart(2, "0");
      return <div key={etiqueta} className="cuenta-unidad">
        <span className="sr-only">{restante === null ? "—" : valor} {etiqueta}</span>
        <div className="cuenta-numeros" aria-hidden="true">
          {digitos.split("").map((d, i) => <span className="cuenta-digito" key={i}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span key={d} initial={reducido ? false : { rotateX: -76, opacity: .35 }}
                animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: reducido ? 0 : 76, opacity: 0 }}
                transition={{ duration: reducido ? 0 : .25 }}>{d}</motion.span>
            </AnimatePresence>
          </span>)}
        </div>
        <span aria-hidden="true">{etiqueta}</span>
      </div>;
    })}
  </div>;
}
