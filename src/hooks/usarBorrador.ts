"use client";

import { useEffect, useRef, useState } from "react";

type Actualizacion<T> = T | ((actual: T) => T);

/** Borrador local versionado: se restaura tras recargar y se limpia al guardar. */
export function usarBorrador<T>(clave: string, inicial: T, version: string | number = 1) {
  const [valor, cambiarValor] = useState<T>(inicial);
  const actual = useRef<T>(inicial);

  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(clave) ?? "null");
      if (guardado?.version === version && guardado.valor !== undefined) {
        actual.current = guardado.valor as T;
        cambiarValor(actual.current);
      }
    } catch { /* Sin borrador previo o almacenamiento bloqueado. */ }
  }, [clave, version]);

  function guardar(siguiente: Actualizacion<T>) {
    const resuelto = typeof siguiente === "function" ? (siguiente as (previo: T) => T)(actual.current) : siguiente;
    actual.current = resuelto;
    cambiarValor(resuelto);
    try { localStorage.setItem(clave, JSON.stringify({ version, valor: resuelto })); } catch { /* Solo afecta al borrador. */ }
  }

  function limpiar() {
    actual.current = inicial;
    cambiarValor(inicial);
    try { localStorage.removeItem(clave); } catch { /* No hay nada que quitar. */ }
  }

  return [valor, guardar, limpiar] as const;
}
