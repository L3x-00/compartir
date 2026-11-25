import Link from "next/link";
import { Heart, Sparkle } from "lucide-react";
import { CopoNieve } from "@/componentes/navideno/CopoNieve";

/** Un cierre familiar que conserva la identidad sin añadir navegación innecesaria. */
export function PiePagina() {
  return <footer className="pie"><div className="contenedor pie-interior"><Link href="/" className="pie-marca"><Sparkle size={17} aria-hidden="true" /> Compartir Navideño</Link><p>Hecho con <Heart className="corazon" size={13} aria-label="amor" /> para la familia <span className="pie-ano">· {new Date().getFullYear()}</span></p><CopoNieve tamano={25} rotacion={15} /></div></footer>;
}
