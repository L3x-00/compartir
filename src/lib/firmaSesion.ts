/** Formato compartido entre el servidor (Node) y el middleware (Edge). */
export const NOMBRE_COOKIE = "sesion_cn";

export function separarCookie(valor: string) {
  const separador = valor.lastIndexOf(".");
  if (separador < 1) return null;
  const contenido = valor.slice(0, separador);
  const firma = valor.slice(separador + 1);
  return /^[a-f0-9]{64}$/.test(firma) ? { contenido, firma } : null;
}

export function esSesionValida(sesion: unknown): sesion is { participanteId: string; eventoId: string; esAdmin: boolean; exp: number; version: number } {
  if (!sesion || typeof sesion !== "object") return false;
  const datos = sesion as Record<string, unknown>;
  return typeof datos.participanteId === "string" && !!datos.participanteId
    && typeof datos.eventoId === "string" && !!datos.eventoId
    && typeof datos.esAdmin === "boolean"
    && typeof datos.exp === "number" && Number.isSafeInteger(datos.exp) && datos.exp > Date.now()
    && typeof datos.version === "number" && Number.isSafeInteger(datos.version) && datos.version >= 0;
}
