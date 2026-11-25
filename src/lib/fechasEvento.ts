export const zonaEvento = "America/Lima";
export const nombreZonaEvento = "hora de Lima";

export function mostrarFechaEvento(fecha: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long", timeStyle: "short", timeZone: zonaEvento,
  }).format(new Date(fecha));
}

const formatoPartes = new Intl.DateTimeFormat("en-CA", {
  timeZone: zonaEvento, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function aFechaLocal(fecha: string) {
  const p = Object.fromEntries(formatoPartes.formatToParts(new Date(fecha)).map(({ type, value }) => [type, value]));
  return [p.year, p.month, p.day].join("-") + "T" + p.hour + ":" + p.minute;
}

export function aFechaISO(valor: string) {
  // La fecha del evento se edita en la zona del organizador (Lima, UTC-5).
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;
  const fecha = new Date(valor + ":00-05:00");
  return Number.isFinite(fecha.getTime()) && aFechaLocal(fecha.toISOString()) === valor ? fecha.toISOString() : null;
}
