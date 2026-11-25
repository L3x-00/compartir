"use client";

import { useSyncExternalStore } from "react";

/** Combina sistema, pausa manual y pestaña oculta sin mantener estados duplicados. */
function suscribir(avisar: () => void) {
  const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
  consulta.addEventListener("change", avisar);
  window.addEventListener("cn:movimiento", avisar);
  document.addEventListener("visibilitychange", avisar);
  return () => { consulta.removeEventListener("change", avisar); window.removeEventListener("cn:movimiento", avisar); document.removeEventListener("visibilitychange", avisar); };
}
function leerPreferencia() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.movimiento === "pausado" || document.hidden;
}
export function usarReducirMovimiento(): boolean {
  return useSyncExternalStore(suscribir, leerPreferencia, () => true);
}

/** El encabezado refleja la misma pausa manual incluso después de navegar. */
export function usarPausaManual(): boolean {
  return useSyncExternalStore(suscribir, () => document.documentElement.dataset.movimiento === "pausado", () => false);
}
