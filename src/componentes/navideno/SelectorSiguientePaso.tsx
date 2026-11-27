"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Fingerprint, LayoutDashboard, Puzzle } from "lucide-react";
import { Boton } from "@/componentes/ui/Boton";
import { Modal } from "@/componentes/ui/Modal";
import { usarBorrador } from "@/hooks/usarBorrador";

/** Tres caminos claros tras las necesidades, reutilizable también en Mi panel. */
export function SelectorSiguientePaso({ pistasCompletas, respondidas = 0 }: {
  pistasCompletas: boolean; respondidas?: number;
}) {
  const [aviso, cambiarAviso] = useState(false);
  const [ultimo, guardarUltimo] = usarBorrador<"pistas" | "adivinar" | "panel" | "">("cn:paso-elegido", "");

  function elegir(ruta: "pistas" | "adivinar" | "panel") { guardarUltimo(ruta); }

  return <section className="selector-pasos" aria-labelledby="titulo-selector">
    <header className="selector-cabecera">
      <h2 id="titulo-selector">¿Qué quieres hacer ahora?</h2>
      <p>Ya tienes tus necesidades listas. Puedes continuar por donde prefieras.</p>
    </header>

    <div className="selector-tarjetas">
      <Link href="/participar/pistas" onClick={() => elegir("pistas")}
        className={`selector-tarjeta${ultimo === "pistas" ? " selector-elegido" : ""}`}>
        <span className="selector-icono"><Fingerprint size={24} aria-hidden="true" /></span>
        <h3>Completar mis características</h3>
        <p>Describe tus rasgos y gustos para que alguien te encuentre.</p>
        <span className="selector-estado">{pistasCompletas ? "Listo · 14/14" : `Pendiente · ${respondidas}/14`}</span>
        <ArrowRight className="selector-flecha" size={18} aria-hidden="true" />
      </Link>

      {pistasCompletas ? <Link href="/participar/adivinar" onClick={() => elegir("adivinar")}
        className={`selector-tarjeta${ultimo === "adivinar" ? " selector-elegido" : ""}`}>
        <span className="selector-icono"><Puzzle size={24} aria-hidden="true" /></span>
        <h3>Elegir a mi amigo secreto</h3>
        <p>Usa las pistas para descubrir a quién le regalarás.</p>
        <span className="selector-estado selector-estado-listo">Disponible</span>
        <ArrowRight className="selector-flecha" size={18} aria-hidden="true" />
      </Link> : <div className={`selector-tarjeta selector-tarjeta-bloqueada${ultimo === "adivinar" ? " selector-elegido" : ""}`}>
        <span className="selector-icono"><Puzzle size={24} aria-hidden="true" /></span>
        <h3>Elegir a mi amigo secreto</h3>
        <p>Usa las pistas para descubrir a quién le regalarás.</p>
        <span className="selector-estado">Requiere pistas · {respondidas}/14</span>
        <Boton variante="fantasma" icono={ArrowRight} onClick={() => { elegir("adivinar"); cambiarAviso(true); }}>Ver cómo hacerlo</Boton>
      </div>}

      <Link href="/participar/mi-panel" onClick={() => elegir("panel")}
        className={`selector-tarjeta selector-secundario${ultimo === "panel" ? " selector-elegido" : ""}`}>
        <span className="selector-icono"><LayoutDashboard size={24} aria-hidden="true" /></span>
        <h3>Mi panel</h3>
        <p>Revisa y corrige todos tus datos cuando quieras.</p>
        <span className="selector-estado">Siempre disponible</span>
        <ArrowRight className="selector-flecha" size={18} aria-hidden="true" />
      </Link>
    </div>

    <Modal abierto={aviso} titulo="Primero completa tus pistas" cerrable alCerrar={() => cambiarAviso(false)}>
      <p>Para que otros participantes puedan encontrarte, completa tus 14 características. Llevas <strong>{respondidas} de 14</strong>.</p>
      <div className="acciones-participante">
        <Boton variante="fantasma" onClick={() => cambiarAviso(false)}>Entendido</Boton>
        <Link className="boton boton-dorado" href="/participar/pistas" onClick={() => { elegir("pistas"); cambiarAviso(false); }}>
          Completar pistas <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </Modal>
  </section>;
}
