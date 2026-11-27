import type { Pistas } from "@/tipos/pistas";

/** Cuenta las 14 respuestas, tratando `false` en lentes como respondido. */
export function contarRespondidas(pistas: Pistas | null): number {
  if (!pistas) return 0;
  const plano = { ...pistas.fisico, ...pistas.personalidad, ...pistas.gustos, datoCurioso: pistas.datoCurioso };
  return Object.values(plano).filter((valor) => valor !== undefined && valor !== null && String(valor).trim() !== "").length;
}

export function pistasEstanCompletas(pistas: Pistas | null): boolean {
  return contarRespondidas(pistas) === 14;
}
