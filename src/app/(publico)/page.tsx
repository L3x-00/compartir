"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Gift, Fingerprint, Puzzle, Sparkles, ShieldCheck, Check, CalendarDays } from "lucide-react";
import { Encabezado } from "@/componentes/layout/Encabezado";
import { PiePagina } from "@/componentes/layout/PiePagina";
import { Boton } from "@/componentes/ui/Boton";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { Regalo } from "@/componentes/navideno/Regalo";
import { Estrella } from "@/componentes/navideno/Estrella";
import { usarConfeti } from "@/hooks/usarConfeti";
import { usarSonido } from "@/hooks/usarSonido";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import type { EventoVista } from "@/hooks/usarSesion";

const pasos = [
  { icono: Gift, titulo: "Comparte tus deseos", texto: "Cuéntanos tres cosas que te harían ilusión recibir." },
  { icono: Fingerprint, titulo: "Deja tus pistas", texto: "Tus gustos y pequeños detalles serán parte del misterio." },
  { icono: Puzzle, titulo: "Descubre el secreto", texto: "Une las pistas y encuentra a quien vas a sorprender." },
  { icono: Sparkles, titulo: "Regala una sonrisa", texto: "Elige qué regalar, confirma a quién le toca y prepara la entrega en familia." },
];
const reglas = [
  ["Tres deseos para inspirar", "Agrega al menos tres necesidades; una foto o un enlace pueden ayudar."],
  ["Una persona, una sorpresa", "Cada participante elige un único regalo para su persona secreta."],
  ["La sorpresa se entrega en persona", "El juego te dirá a quién regalar y guardará tu elección para cuando la necesites."],
];

/** Landing pública: presenta el juego y muestra únicamente fechas reales del evento. */
export default function PaginaPrincipal() {
  const reducido = usarReducirMovimiento(); const { lanzarConfeti } = usarConfeti(); const { reproducir } = usarSonido();
  const confetiUsado = useRef(false); const [evento, cambiarEvento] = useState<EventoVista | null>(null);
  useEffect(() => {
    const controlador = new AbortController();
    void fetch("/api/participantes", { cache: "no-store", signal: controlador.signal }).then(async (respuesta) => {
      if (respuesta.ok) { const datos = await respuesta.json() as { evento: EventoVista }; cambiarEvento(datos.evento); }
    }).catch(() => undefined);
    return () => controlador.abort();
  }, []);
  const celebrar = () => { reproducir("click"); if (!confetiUsado.current) { confetiUsado.current = true; void lanzarConfeti({ particleCount: 30 }); } };
  const entrada = reducido ? { opacity: 1, y: 0 } : { opacity: [0.5, 1], y: [18, 0] };
  return <><Encabezado /><main id="contenido">
    <section className="hero contenedor" aria-labelledby="titulo-principal">
      <div className="hero-rejilla">
        <div className="hero-texto">
          <h1 id="titulo-principal" aria-label="Compartir Navideño">{["Compartir", "Navideño"].map((palabra, indice) => <motion.span aria-hidden="true" className="hero-palabra" key={palabra} initial={false} animate={entrada} transition={{ duration: reducido ? 0 : 0.65, delay: reducido ? 0 : indice * 0.14, ease: "easeOut" }}>{palabra}</motion.span>)}</h1>
          <motion.div initial={false} animate={entrada} transition={{ duration: reducido ? 0 : 0.65, delay: reducido ? 0 : 0.2 }}>
            <p className="hero-subtitulo">Un amigo secreto mágico para nuestra familia.</p>
            <Link href="/ingresar" onClick={celebrar} className="boton boton-dorado boton-grande">Comenzar <ArrowRight size={20} aria-hidden="true" /></Link>
            <p className="hero-confianza"><ShieldCheck size={16} aria-hidden="true" /> Tu secreto, guardado hasta la revelación.</p>
          </motion.div>
        </div>
        <motion.div className="escena-regalo revelar" initial={false} animate={reducido ? { opacity: 1 } : { opacity: [0.3, 1], scale: [0.95, 1] }} transition={{ duration: reducido ? 0 : 0.8 }}>
          <div className="orbita" /><div className="orbita orbita-dos" /><Regalo nevado />
          <Estrella className="estrella-uno" tamano={28} /><Estrella className="estrella-dos" tamano={16} demora={1} /><Estrella className="estrella-tres" tamano={22} demora={2} /><Estrella className="estrella-cuatro" tamano={12} demora={3} />
          <span className="escena-nota">La magia está en compartir.</span>
        </motion.div>
      </div>
      <a href="#como-funciona" className="indicador-scroll">Descubre cómo se juega <motion.span animate={reducido ? { y: 0 } : { y: [0, 5, 0] }} transition={{ duration: 2, repeat: 2 }}><ArrowDown size={16} aria-hidden="true" /></motion.span></a>
    </section>
    <section id="como-funciona" className="seccion-pasos contenedor" aria-labelledby="titulo-pasos">
      <motion.div className="cabecera-seccion revelar" initial={false} whileInView={entrada} viewport={{ once: true, amount: 0.5 }} transition={{ duration: reducido ? 0 : 0.5 }}><h2 id="titulo-pasos">Un poquito de misterio.<br />Mucho cariño.</h2><p>Cuatro pasos para convertir un regalo en una historia que vamos a recordar.</p></motion.div>
      <div className="rejilla-pasos">{pasos.map(({ icono: Icono, titulo, texto }, indice) => <Tarjeta key={titulo} className="tarjeta-paso revelar" inclinable brillo initial={false} whileInView={entrada} viewport={{ once: true, amount: 0.2 }} transition={{ duration: reducido ? 0 : 0.45, delay: reducido ? 0 : indice * 0.06 }}><div className="paso-encabezado"><Icono size={30} strokeWidth={1.5} aria-hidden="true" /><span>Paso {indice + 1}</span></div><h3>{titulo}</h3><p>{texto}</p></Tarjeta>)}</div>
    </section>
    <section className="seccion-reglas" aria-labelledby="titulo-reglas"><div className="contenedor reglas-rejilla">
      <motion.div className="reglas-intro revelar" initial={false} whileInView={entrada} viewport={{ once: true, amount: 0.3 }}><h2 id="titulo-reglas">Una tradición.<br /><span className="texto-dorado">Nuestra propia magia.</span></h2><p>Lo importante no es el tamaño del regalo, sino pensar en esa persona. Nosotros ponemos el misterio; tú pones el cariño.</p>
        {evento && <div className="fecha-evento"><CalendarDays size={24} strokeWidth={1.5} aria-hidden="true" /><div>{evento.cerrado ? "La elección de regalos cerró" : "Fecha límite para elegir"}<strong><time dateTime={evento.fechaLimite}>{new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Lima" }).format(new Date(evento.fechaLimite))}</time></strong></div></div>}
      </motion.div>
      <ul className="lista-reglas">{reglas.map(([titulo, texto], indice) => <motion.li key={titulo} initial={false} whileInView={entrada} viewport={{ once: true }} transition={{ delay: reducido ? 0 : indice * 0.06 }}><motion.span initial={false} whileInView={{ scale: reducido ? 1 : [0.8, 1] }} viewport={{ once: true }}><Check size={20} aria-hidden="true" /></motion.span><div><strong>{titulo}</strong><p>{texto}</p></div></motion.li>)}</ul>
    </div></section>
    <section className="cta-final contenedor" aria-labelledby="titulo-final"><Estrella tamano={27} /><motion.h2 id="titulo-final" className="revelar" initial={false} whileInView={entrada} viewport={{ once: true }}>Hay una sonrisa<br />esperando por ti.</motion.h2><p>Que empiece nuestro amigo secreto.</p><motion.div initial={false} whileInView={reducido ? undefined : { scale: [1, 1.025, 1] }} viewport={{ once: true }} transition={{ duration: 1.2 }}><Link href="/ingresar" className="boton boton-primario boton-grande" onClick={() => reproducir("click")}>Ingresar al juego <ArrowRight size={19} aria-hidden="true" /></Link></motion.div>
      <svg className="renos" viewBox="0 0 210 60" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m20 37 13-5 20 2 8-14 9-4 5 5-9 8-3 12-10 1-6 13m-14-14-4 13m29-13 7 12m-5-31-2-13m2 6-7-5m10 9 5-11m-39 26-7-4m90 5 13-5 20 2 8-14 9-4 5 5-9 8-3 12-10 1-6 13m-14-14-4 13m29-13 7 12m-5-31-2-13m2 6-7-5m10 9 5-11m-39 26-7-4" /><path d="M3 57h204" opacity=".3" /></svg>
    </section>
  </main><PiePagina /></>;
}
