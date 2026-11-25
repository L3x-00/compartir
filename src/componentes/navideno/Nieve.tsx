"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

/** 72 partículas CSS deterministas: no hay diferencias de hidratación ni trabajo por fotograma en React. */
export function Nieve() {
  const reducido = usarReducirMovimiento(); const [oculta, cambiarOculta] = useState(false);
  useEffect(() => { const actualizar = () => { cambiarOculta(document.hidden); document.documentElement.dataset.oculto = String(document.hidden); }; actualizar(); document.addEventListener("visibilitychange", actualizar); return () => document.removeEventListener("visibilitychange", actualizar); }, []);
  return <div className={`nieve ${reducido || oculta ? "nieve-pausada" : ""}`} aria-hidden="true">
    {Array.from({ length: 72 }, (_, indice) => <span key={indice} style={{ left: `${(indice * 37.53) % 100}%`, "--tamano": `${1.5 + (indice % 4) * 0.8}px`, "--duracion": `${15 + indice % 17}s`, "--demora": `${-(indice * 2.7)}s`, "--deriva": `${(indice % 2 ? 1 : -1) * (20 + indice % 40)}px`, opacity: 0.2 + (indice % 5) * 0.1 } as CSSProperties} />)}
  </div>;
}
