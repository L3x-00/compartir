"use client";

import { useEffect, useRef, useState } from "react";
import { Boton } from "./Boton";

/** Avance visible y cancelable: mantiene la fluidez sin interrumpir la lectura. */
export function AvanceAutomatico({ segundos = 3, alAvanzar, mensaje = "Continuando a la siguiente pantalla" }: {
  segundos?: number; alAvanzar: () => void; mensaje?: string;
}) {
  const [restante, cambiarRestante] = useState(segundos);
  const [cancelado, cambiarCancelado] = useState(false);
  const avanzar = useRef(alAvanzar);
  avanzar.current = alAvanzar;

  useEffect(() => {
    if (cancelado) return;
    const reloj = window.setInterval(() => cambiarRestante((valor) => Math.max(0, valor - 1)), 1000);
    return () => window.clearInterval(reloj);
  }, [cancelado]);

  useEffect(() => {
    if (cancelado || restante > 0) return;
    avanzar.current();
  }, [restante, cancelado]);

  if (cancelado) return null;
  return <p className="avance-automatico" role="status">
    <span>{mensaje} en {restante} s.</span>
    <Boton variante="fantasma" onClick={() => cambiarCancelado(true)}>Quedarse aquí</Boton>
  </p>;
}
