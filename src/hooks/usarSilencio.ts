"use client";

import { useSyncExternalStore } from "react";

/** Estado de audio compartido por los efectos y la música de fondo. */
export const CLAVE_SILENCIO = "cn:silencio";
export const EVENTO_SILENCIO = "cn:sonido";

let silencioEnMemoria = false;

export function leerSilencio(): boolean {
  try {
    const guardado = localStorage.getItem(CLAVE_SILENCIO);
    return guardado === null ? silencioEnMemoria : guardado === "true";
  } catch {
    return silencioEnMemoria;
  }
}

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO_SILENCIO, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO_SILENCIO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

/**iOS y el resto de navegadores arrancan sin sonido: el servidor lo considera silenciado. */
export function usarSilencio() {
  return useSyncExternalStore(suscribir, leerSilencio, () => true);
}

export function fijarSilencio(silenciado: boolean) {
  silencioEnMemoria = silenciado;
  try { localStorage.setItem(CLAVE_SILENCIO, String(silenciado)); } catch { /* Sin almacenamiento, se mantiene en memoria. */ }
  window.dispatchEvent(new Event(EVENTO_SILENCIO));
}
