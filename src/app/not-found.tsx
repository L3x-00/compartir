import Link from "next/link";

/** Salida sencilla para enlaces que no pertenecen al juego. */
export default function PaginaNoEncontrada() {
  return <main id="contenido" className="contenedor estado-ingreso"><h1 className="display">Este camino no lleva al regalo.</h1><p>No encontramos esa página. Volvamos a donde empieza la magia.</p><Link href="/" className="boton boton-dorado">Volver al inicio</Link></main>;
}
