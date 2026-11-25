"use client";

import type { CSSProperties } from "react";

/** Estrella de cuatro puntas; el brillo se pausa con la preferencia global. */
export function Estrella({ className = "", tamano = 28, demora = 0 }: { className?: string; tamano?: number; demora?: number }) {
  return <svg className={`estrella ${className}`} width={tamano} height={tamano} viewBox="0 0 40 40" fill="currentColor" aria-hidden="true" style={{ "--demora": `${demora}s` } as CSSProperties}><path d="M20 0c2 13 7 18 20 20-13 2-18 7-20 20C18 27 13 22 0 20 13 18 18 13 20 0Z" /></svg>;
}
