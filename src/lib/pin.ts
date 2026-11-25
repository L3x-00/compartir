import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const LONGITUD = 32;

/** Guarda `sal:hash`; acepta PIN antiguos en texto para migrarlos en el primer ingreso. */
export function hashPin(pin: string): string {
  const sal = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, sal, LONGITUD).toString("hex");
  return `${sal}:${hash}`;
}

export function verificarPin(almacenado: string, propuesto: string): boolean {
  if (!almacenado || !propuesto) return false;
  if (/^\d{4}$/.test(almacenado)) return almacenado === propuesto;
  const [sal, hash] = almacenado.split(":");
  if (!sal || !hash || !/^[a-f0-9]+$/.test(hash)) return false;
  const esperado = Buffer.from(hash, "hex");
  const obtenido = scryptSync(propuesto, sal, esperado.length);
  return esperado.length === obtenido.length && timingSafeEqual(esperado, obtenido);
}

export function esPinHasheado(valor: string): boolean {
  return !/^\d{4}$/.test(valor);
}
