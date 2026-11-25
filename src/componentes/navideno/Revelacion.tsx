"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useId, useState, useTransition } from "react";
import { ArrowRight, Gift, RefreshCw, Snowflake } from "lucide-react";
import { Navegacion } from "@/componentes/layout/Navegacion";
import { Boton } from "@/componentes/ui/Boton";
import { CuentaRegresiva } from "@/componentes/ui/CuentaRegresiva";
import type { EventoVista } from "@/hooks/usarSesion";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { usarSonido } from "@/hooks/usarSonido";
import { mostrarFechaEvento, nombreZonaEvento } from "@/lib/fechasEvento";
import type { EleccionRegalo, Emparejamiento, MiRegalo } from "@/tipos/final";
import { CajaCierre } from "./CajaCierre";
import { DetalleRegalo } from "./DetalleRegalo";
import { Estrella } from "./Estrella";

const Contenido = dynamic(() => import("./ContenidoRevelacion").then((m) => m.ContenidoRevelacion), {
  loading: () => <div className="panel-participante estado-participante" role="status">Cargando los emparejamientos…</div>,
});

const copos = [
  [65, 148, 3, 59, -7], [78, 155, 2, 72, 15], [92, 166, 3, 47, -15],
  [105, 175, 2, 80, 22], [114, 156, 2, 92, -22], [123, 169, 3, 61, 11],
  [136, 172, 2, 99, -15], [150, 154, 3, 69, 17], [162, 168, 2, 81, -22],
  [172, 158, 3, 50, -9], [183, 151, 2, 75, 17], [194, 147, 2, 41, -3],
];

function EsferaEspera() {
  const recorte = useId().replaceAll(":", "");
  const [toques, contarToques] = useState(0);
  const reducido = usarReducirMovimiento();
  const { reproducir } = usarSonido();
  const agitada = toques > 0 && !reducido;

  function agitar() {
    contarToques((previos) => previos + 1);
    reproducir("whoosh");
  }

  return <div className="esfera-espera" data-agitada={toques > 0 ? "" : undefined}>
    <Estrella className="estrella-espera izquierda" tamano={26} />
    <Estrella className="estrella-espera derecha" tamano={21} demora={.6} />
    <button type="button" className="esfera-boton" onClick={agitar}>
      <svg viewBox="0 0 256 219" fill="none" aria-hidden="true">
        <defs><clipPath id={recorte}><circle cx="128" cy="104" r="83" /></clipPath></defs>
        <motion.g key={toques} style={{ transformOrigin: "128px 185px", transformBox: "view-box" }}
          initial={agitada ? { rotate: 0 } : false} animate={agitada ? { rotate: [0, -7, 6, -3, 0] } : { rotate: 0 }}
          transition={{ duration: agitada ? .52 : 0, ease: "easeInOut" }}>
          <circle cx="128" cy="104" r="85" className="esfera-cristal" />
          <g clipPath={"url(#" + recorte + ")"}>
            <path d="m128 50-29 45h15l-27 34h32v25h18v-25h32l-27-34h15Z" fill="var(--color-navidad-verde)" stroke="var(--color-navidad-verde-claro)" strokeWidth="2" />
            <path d="m128 40 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="var(--color-navidad-dorado)" />
            <path d="M58 154q37-21 72-10 41 19 68 0v44H58Z" fill="var(--color-navidad-nieve)" fillOpacity=".14" />
            <path d="M59 153q37-21 71-10 41 19 67 0" stroke="var(--color-navidad-nieve)" strokeOpacity=".52" strokeWidth="2" />
            {copos.map(([x, y, r, altura, desv], indice) => <motion.circle key={indice} cx={x} cy={y} r={r}
              fill="var(--color-navidad-nieve)" initial={{ x: 0, y: 0, opacity: .72 }}
              animate={agitada ? { x: [0, desv, desv / 2, 0], y: [0, -altura, -altura + 12, 0], opacity: [.72, 1, .9, .72] }
                : { x: 0, y: 0, opacity: .72 }}
              transition={{ duration: agitada ? 1.5 + (indice % 3) * .14 : 0, times: [0, .23, .55, 1], ease: "easeInOut" }} />)}
          </g>
          <path d="M77 66q11-19 34-26" stroke="var(--color-navidad-nieve)" strokeWidth="4" strokeOpacity=".62" strokeLinecap="round" />
          <path d="M68 174h120l13 35H55z" fill="var(--color-navidad-misterio)" stroke="var(--color-navidad-dorado)" strokeWidth="2" />
          <path d="M91 193h74" stroke="var(--color-navidad-dorado-claro)" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
      </svg>
      <span><Snowflake size={16} aria-hidden="true" /> Agitar la bola de nieve</span>
    </button>
    <span className="sr-only" role="status">{reducido && toques > 0 ? "Nieve agitada." : ""}</span>
  </div>;
}

type CeremoniaAdmin = {
  emparejamientos: Emparejamiento[];
  participanteId: string;
  regalo: MiRegalo | null;
};

export function Revelacion({ evento, eleccion = null, ceremonia, soloPersonal = false }: {
  evento: EventoVista | null; eleccion?: EleccionRegalo | null; ceremonia?: CeremoniaAdmin; soloPersonal?: boolean;
}) {
  const router = useRouter();
  const [actualizando, actualizar] = useTransition();
  const espera = evento?.cerrado === false;

  useEffect(() => {
    if (!espera) return;
    const revisar = () => { if (!document.hidden) router.refresh(); };
    const reloj = window.setInterval(revisar, 20_000);
    document.addEventListener("visibilitychange", revisar);
    return () => { window.clearInterval(reloj); document.removeEventListener("visibilitychange", revisar); };
  }, [espera, router]);

  if (ceremonia) return <Contenido emparejamientos={ceremonia.emparejamientos} participanteId={ceremonia.participanteId}
    regaloElegido={!!eleccion} regalo={ceremonia.regalo} soloPersonal={soloPersonal} />;

  return <section className="escena-participante">
    {eleccion && <Navegacion pasoActual={4} />}
    {evento === null ? <div className="panel-participante estado-participante">
      <h1>No pudimos cargar tu elección</h1>
      <Boton variante="dorado" icono={RefreshCw} cargando={actualizando}
        onClick={() => actualizar(() => router.refresh())}>Reintentar</Boton>
    </div> : <div className="panel-participante espera-revelacion">
      <div className="espera-texto">
        <h1>{eleccion ? "Tu regalo está elegido" : evento.cerrado ? "Cerró la elección de regalos" : "Elige tu regalo"}</h1>
        <p>{eleccion ? "Ya tienes a quién regalarle y qué llevar. La entrega será en persona."
          : evento.cerrado ? "Tu elección quedó pendiente."
          : "Confirma tu elección antes del cierre."}</p>
      </div>
      {eleccion && <div className="regalo-recuerdo">
        <CajaCierre animar={false} />
        <DetalleRegalo eleccion={eleccion} />
      </div>}
      <div className={espera ? "espera-ambiente espera-con-reloj" : "espera-ambiente"}>
        <EsferaEspera />
        {espera && <div className="espera-reloj">
          <p>La elección de regalos cierra el <time dateTime={evento.fechaLimite}>{mostrarFechaEvento(evento.fechaLimite)}</time> ({nombreZonaEvento}).</p>
          <CuentaRegresiva fecha={evento.fechaLimite} alVencer={() => router.refresh()} />
        </div>}
      </div>
      <div className="acciones-participante espera-acciones">
        {!eleccion && espera && <Link className="boton boton-dorado" href="/participar/regalar"><Gift size={18} aria-hidden="true" /> Ir al juego <ArrowRight size={16} aria-hidden="true" /></Link>}
        {espera && <Boton variante="fantasma" icono={RefreshCw} cargando={actualizando} onClick={() => actualizar(() => router.refresh())}>Actualizar estado</Boton>}
      </div>
    </div>}
  </section>;
}
