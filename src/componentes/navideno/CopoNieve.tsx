import type { SVGProps } from "react";

/** Copo geométrico que hereda el color y no añade información al lector de pantalla. */
export function CopoNieve({ tamano = 24, rotacion = 0, ...propiedades }: SVGProps<SVGSVGElement> & { tamano?: number; rotacion?: number }) {
  return <svg {...propiedades} width={tamano} height={tamano} viewBox="0 0 40 40" fill="none" aria-hidden="true"><g transform={`rotate(${rotacion} 20 20)`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 3v34M5.3 11.5l29.4 17M5.3 28.5l29.4-17M15 7l5 5 5-5M15 33l5-5 5 5M6 17l7-2-1-7M34 23l-7 2 1 7M6 23l7 2-1 7M34 17l-7-2 1-7" /></g></svg>;
}
