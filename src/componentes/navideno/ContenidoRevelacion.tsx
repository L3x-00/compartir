"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Gift, Heart, List, Sparkles, TreePine, Volume2 } from "lucide-react";
import { Navegacion } from "@/componentes/layout/Navegacion";
import { AvatarInicial } from "@/componentes/ui/AvatarInicial";
import { AvatarPersona } from "@/componentes/ui/AvatarPersona";
import { Boton } from "@/componentes/ui/Boton";
import { usarConfeti } from "@/hooks/usarConfeti";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { usarSonido } from "@/hooks/usarSonido";
import { usarSesion } from "@/hooks/usarSesion";
import { srcFoto } from "@/componentes/formularios/peticionesParticipante";
import type { Emparejamiento, MiRegalo } from "@/tipos/final";
import { Estrella } from "./Estrella";
import { Regalo } from "./Regalo";

type Fase = "entrada" | "personal" | "emparejamientos" | "final";

function Sobre() {
  const reducido = usarReducirMovimiento();
  return <motion.svg className="sobre-revelacion" width="320" height="192" viewBox="0 0 320 192" fill="none" aria-hidden="true"
    initial={reducido ? false : { x: -55, y: -30, rotate: -12, opacity: 0 }}
    animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }} transition={reducido ? { duration: 0 } : { type: "spring", stiffness: 130, damping: 18 }}>
    <rect x="30" y="48" width="260" height="132" rx="12" fill="var(--color-navidad-misterio-claro)" stroke="var(--color-navidad-dorado)" strokeWidth="2" />
    <motion.path d="M30 57 151 12a23 23 0 0 1 18 0l121 45-119 49c-7 3-15 3-22 0Z"
      fill="var(--color-navidad-misterio)" stroke="var(--color-navidad-dorado)" strokeWidth="2"
      style={{ transformOrigin: "center 57px", transformBox: "view-box" }}
      initial={reducido ? false : { scaleY: -.95 }} animate={{ scaleY: 1 }}
      transition={{ duration: reducido ? 0 : .42, delay: reducido ? 0 : .23 }} />
    <path d="m31 172 89-65m169 65-89-65" stroke="var(--color-navidad-dorado-claro)" strokeOpacity=".67" strokeWidth="2" />
    <motion.path d="M145 115h30m-15-15v30m-10-25 20 20m-20 0 20-20"
      stroke="var(--color-navidad-dorado-claro)" strokeWidth="2" strokeLinecap="round"
      initial={reducido ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
      transition={{ duration: reducido ? 0 : .4, delay: reducido ? 0 : .45 }} />
  </motion.svg>;
}

function ArbolFinal() {
  return <svg className="arbol-final" viewBox="0 0 240 245" aria-hidden="true" fill="none">
    <path d="M120 44 77 105h21l-43 49h27l-44 50h164l-44-50h27l-43-49h21Z"
      fill="var(--color-navidad-verde)" stroke="var(--color-navidad-verde-claro)" strokeWidth="3" strokeLinejoin="round" />
    <path d="M104 204h32v27h-32z" fill="var(--color-navidad-rojo-oscuro)" />
    <path d="M77 151c32-2 53-13 75-39m-87 72c53-1 86-14 105-32" stroke="var(--color-navidad-dorado)" strokeWidth="3" strokeLinecap="round" />
    <path d="m120 10 5 13 14 1-11 9 4 14-12-8-12 8 4-14-11-9 14-1Z" fill="var(--color-navidad-dorado-claro)" />
    <g fill="var(--color-navidad-rojo)"><circle cx="105" cy="125" r="7" /><circle cx="136" cy="161" r="7" /><circle cx="84" cy="182" r="7" /><circle cx="163" cy="184" r="7" /></g>
  </svg>;
}

const fraseEntrada = "Es hora de la revelación…";

/** Mantiene la lista familiar fuera de la escena principal hasta que el participante la abre. */
export function ContenidoRevelacion({ emparejamientos, participanteId, regaloElegido, regalo, soloPersonal = false }: {
  emparejamientos: Emparejamiento[]; participanteId?: string; regaloElegido: boolean; regalo?: MiRegalo | null; soloPersonal?: boolean;
}) {
  const [fase, cambiarFase] = useState<Fase>("entrada");
  const reducido = usarReducirMovimiento();
  const { lanzarConfeti } = usarConfeti();
  const { reproducir, detener, silenciado } = usarSonido();
  const { archivosSonido } = usarSesion();
  const celebrada = useRef(false);
  const primera = useRef(true);
  const titulo = useRef<HTMLHeadingElement>(null);
  const siguienteFoco = useRef(false);

  const irAPersonal = useCallback(() => {
    siguienteFoco.current = true;
    cambiarFase("personal");
  }, []);

  useEffect(() => {
    if (fase !== "entrada") return;
    const omitir = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.movimiento === "pausado";
    if (omitir) { irAPersonal(); return; }
    const reloj = window.setTimeout(irAPersonal, 2450);
    return () => window.clearTimeout(reloj);
  }, [fase, reducido, irAPersonal]);

  useEffect(() => {
    if (fase !== "personal" || celebrada.current) return;
    const reloj = window.setTimeout(() => {
      celebrada.current = true;
      reproducir("revelacion");
      void lanzarConfeti({ preset: "revelacion" });
    }, reducido ? 0 : 560);
    return () => window.clearTimeout(reloj);
  }, [fase, lanzarConfeti, reducido, reproducir]);

  function cambiar(vista: Fase) {
    siguienteFoco.current = true;
    if (vista === "final") {
      reproducir("acierto");
      void lanzarConfeti({ preset: "revelacion" });
    } else if (vista === "emparejamientos") {
      reproducir("click");
      void lanzarConfeti({ preset: "celebracion" });
    }
    cambiarFase(vista);
  }

  function enfocar(nodo: HTMLHeadingElement | null) {
    if (nodo && nodo !== titulo.current && siguienteFoco.current) {
      siguienteFoco.current = false;
      nodo.focus({ preventScroll: true });
      nodo.scrollIntoView({ block: "nearest" });
    }
    titulo.current = nodo;
  }

  const vinculo = emparejamientos.find((p) => p.personaSecretaId === participanteId);
  const nombre = regalo?.regalador.nombre ?? vinculo?.regaladorNombre;
  const foto = srcFoto(regalo?.necesidad.fotoUrl);
  const animar = fase === "personal" && primera.current;
  return <section className="escena-participante revelacion-cerrada">
    {regaloElegido && <Navegacion pasoActual={4} />}
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => { if (fase === "emparejamientos" || fase === "final") primera.current = false; }}>
      {fase === "entrada" ? <motion.div key="entrada" className="revelacion-telon" exit={reducido ? undefined : { opacity: 0, scale: 1.045 }}
        transition={{ duration: reducido ? 0 : .28 }}>
        <motion.div className="revelacion-acercamiento" initial={false}
          animate={reducido ? undefined : { scale: [1, 1.13, 1.52], opacity: [1, 1, .8] }} transition={{ duration: 2.4, ease: "easeInOut" }}>
          <Regalo />
        </motion.div>
        <h1 aria-label={fraseEntrada} className="frase-revelacion">{Array.from(fraseEntrada).map((letra, i) =>
          <motion.span key={i} aria-hidden="true" initial={{ opacity: reducido ? 1 : 0 }} animate={{ opacity: 1 }}
            transition={{ duration: reducido ? 0 : .22, delay: reducido ? 0 : i * .044 }}>{letra}</motion.span>)}</h1>
        <Boton variante="fantasma" onClick={irAPersonal}>Omitir animación</Boton>
      </motion.div> : fase === "personal" ? <motion.div key="personal" className="revelacion-escena"
        initial={reducido ? false : { opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={reducido ? undefined : { opacity: 0 }}>
        <Estrella className="estrella-escena izquierda" tamano={34} /><Estrella className="estrella-escena derecha" tamano={25} demora={.55} />
        <motion.h1 ref={enfocar} tabIndex={-1} initial={animar && !reducido ? { scale: .92 } : false} animate={{ scale: 1 }}>
          {nombre ? "¡Tu amigo secreto es…!" : "¡Llegó la revelación!"}
        </motion.h1>
        <div className="escenario-carta">
          <Sobre />
          <motion.article className="carta-revelacion"
            initial={animar && !reducido ? { opacity: 0, y: 80, rotate: -5, scale: .9 } : false}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            transition={reducido ? { duration: 0 } : { delay: animar ? .48 : 0, type: "spring", stiffness: 170, damping: 19 }}>
            {nombre ? <>
              <AvatarPersona nombre={nombre} fotoUrl={regalo?.regalador.fotoUrl} grande />
              <h2>{nombre}</h2>
              {regalo ? <div className="detalle-regalo-revelado">
                {foto && <div className="foto-necesidad"><Image src={foto} alt="" fill unoptimized sizes="(max-width: 650px) 75vw, 290px" /></div>}
                <p><Gift size={18} aria-hidden="true" /> Eligió regalarte</p><strong>{regalo.necesidad.nombre}</strong>
              </div> : <p>Te eligió como su persona secreta. Quedó pendiente elegir un regalo.</p>}
            </> : <><Heart size={38} aria-hidden="true" /><h2>Gracias por jugar</h2><p>Esta vez nadie quedó asignado para regalarte. Puedes ver cómo terminó el intercambio.</p></>}
          </motion.article>
        </div>
        {!regaloElegido && <p className="aviso-revelacion">Tu regalo quedó pendiente. Aún puedes ver la revelación.</p>}
        <div className="acciones-participante acciones-revelacion">
          {!soloPersonal && <Boton variante="dorado" icono={List} onClick={() => cambiar("emparejamientos")}>Ver todos los emparejamientos</Boton>}
          {archivosSonido.revelacion && !silenciado && <Boton variante="fantasma" icono={Volume2}
            onClick={() => { detener("revelacion"); reproducir("revelacion"); }}>Reproducir fanfarria</Boton>}
          <Boton variante="fantasma" icono={Sparkles} onClick={() => cambiar("final")}>¡Feliz Navidad!</Boton>
        </div>
      </motion.div> : fase === "emparejamientos" ? <motion.div key="parejas" className="vista-parejas"
        initial={reducido ? false : { opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={reducido ? undefined : { opacity: 0 }}>
        <header className="titulo-participante"><h1 ref={enfocar} tabIndex={-1}>Los emparejamientos</h1><p>Así quedó el intercambio de la familia.</p></header>
        {emparejamientos.length === 0 ? <p>El evento cerró sin participantes.</p> : <ul className="lista-parejas">
          {emparejamientos.map((p, i) => <motion.li key={p.regaladorId} className="panel-participante pareja-revelada"
            initial={reducido ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            whileHover={reducido ? undefined : { y: -3 }} transition={{ duration: reducido ? 0 : .24, delay: reducido ? 0 : Math.min(i, 7) * .05 }}>
            <div className="pareja-nombres"><strong><AvatarInicial nombre={p.regaladorNombre} />{p.regaladorNombre}</strong>
              <ArrowRight size={18} aria-label="Le regala a" /><strong>{p.personaSecretaNombre && <AvatarInicial nombre={p.personaSecretaNombre} />}{p.personaSecretaNombre ?? "Sin asignación"}</strong></div>
            <p><Gift size={17} aria-hidden="true" />{p.necesidadElegidaNombre ?? "Regalo pendiente"}</p>
          </motion.li>)}
        </ul>}
        <div className="acciones-participante acciones-revelacion">
          <Boton variante="fantasma" icono={ArrowLeft} onClick={() => cambiar("personal")}>Volver</Boton>
          <Boton variante="dorado" icono={TreePine} onClick={() => cambiar("final")}>¡Feliz Navidad!</Boton>
        </div>
      </motion.div> : <motion.div key="feliz" className="panel-participante estado-participante final-navidad"
        initial={reducido ? false : { opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }}>
        <ArbolFinal /><h1 ref={enfocar} tabIndex={-1}>¡Feliz Navidad!</h1>
        <p>Gracias por participar. ¡Nos vemos en la entrega de regalos!</p>
        <div className="acciones-participante acciones-revelacion">
          <Boton variante="fantasma" icono={ArrowLeft} onClick={() => cambiar("personal")}>Volver a la revelación</Boton>
          <Link className="boton boton-dorado" href="/">Ir al inicio <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </motion.div>}
    </AnimatePresence>
  </section>;
}
