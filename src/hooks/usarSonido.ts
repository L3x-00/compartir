"use client";

import { useCallback, useEffect } from "react";
import { Howl } from "howler";
import { nombresSonido, type NombreSonido } from "@/lib/sonidos";
import { usarSesion } from "./usarSesion";
import { fijarSilencio, leerSilencio, usarSilencio } from "./usarSilencio";

const sonidos = new Map<string, Howl>();
function preparar(url: string) {
  let sonido = sonidos.get(url);
  if (!sonido) {
    sonido = new Howl({ src: [url], volume: .48, mute: leerSilencio(), preload: true });
    sonidos.set(url, sonido);
  }
  return sonido;
}

export function usarSonido() {
  const { archivosSonido } = usarSesion();
  const silenciado = usarSilencio();
  useEffect(() => {
    for (const nombre of nombresSonido) {
      const archivo = archivosSonido[nombre];
      if (archivo) {
        try { preparar(archivo); } catch { /* El juego sigue disponible si el navegador no tiene audio. */ }
      }
    }
  }, [archivosSonido]);
  useEffect(() => { for (const sonido of sonidos.values()) sonido.mute(silenciado); }, [silenciado]);
  const reproducir = useCallback((nombre: NombreSonido) => {
    const archivo = archivosSonido[nombre];
    if (leerSilencio() || !archivo) return;
    try {
      const sonido = preparar(archivo);
      sonido.mute(false);
      sonido.play();
    } catch { /* El navegador puede impedir el audio. */ }
  }, [archivosSonido]);
  const detener = useCallback((nombre: NombreSonido) => {
    const archivo = archivosSonido[nombre];
    if (archivo) sonidos.get(archivo)?.stop();
  }, [archivosSonido]);
  const silenciar = useCallback(() => {
    const siguiente = !leerSilencio();
    fijarSilencio(siguiente);
    for (const sonido of sonidos.values()) {
      sonido.mute(siguiente);
      if (siguiente) sonido.stop();
    }
    if (!siguiente) reproducir("acierto");
  }, [reproducir]);
  return { reproducir, detener, silenciar, silenciado };
}
