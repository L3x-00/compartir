"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Options } from "canvas-confetti";
import { usarReducirMovimiento } from "./usarReducirMovimiento";

type OpcionesConfeti = Options & { preset?: "exito" | "celebracion" | "revelacion" };
/** Carga el efecto al utilizarlo y limita la lluvia a menos de un segundo. */
export function usarConfeti() {
  const reducido = usarReducirMovimiento();
  const fotograma = useRef<number | null>(null);
  useEffect(() => () => { if (fotograma.current !== null) cancelAnimationFrame(fotograma.current); }, []);
  const lanzarConfeti = useCallback(async ({ preset = "exito", ...opciones }: OpcionesConfeti = {}) => {
    if (reducido || document.hidden) return;
    const { default: confeti } = await import("canvas-confetti");
    if (document.hidden || document.documentElement.dataset.movimiento === "pausado" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const estilo: Options = { colors: ["#f4c430", "#c1121f", "#2a9d5c", "#f7f9fc"], disableForReducedMotion: true, zIndex: 100, ...opciones };
    if (preset !== "celebracion") void confeti({ particleCount: preset === "revelacion" ? 100 : 38, spread: 65, origin: { y: 0.62 }, ...estilo });
    if (preset === "revelacion") {
      void confeti({ ...estilo, particleCount: 36, angle: 64, spread: 48, origin: { x: .04, y: .72 } });
      void confeti({ ...estilo, particleCount: 36, angle: 116, spread: 48, origin: { x: .96, y: .72 } });
    }
    if (preset !== "exito") {
      const fin = performance.now() + (preset === "revelacion" ? 800 : 500);
      const llover = () => {
        if (performance.now() >= fin || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.movimiento === "pausado") return;
        void confeti({ ...estilo, particleCount: 3, spread: 70, startVelocity: 12, origin: { x: Math.random(), y: 0 } });
        fotograma.current = requestAnimationFrame(llover);
      };
      llover();
    }
  }, [reducido]);
  return { lanzarConfeti };
}
