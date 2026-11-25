import type { EleccionRegalo } from "@/tipos/final";

export function DetalleRegalo({ eleccion }: { eleccion: EleccionRegalo }) {
  return <dl className="detalle-eleccion">
    <div><dt>A quién regalar</dt><dd>{eleccion.destinatario}</dd></div>
    <div><dt>Qué regalar</dt><dd>{eleccion.regalo}</dd></div>
  </dl>;
}
