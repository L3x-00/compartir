"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Crown, Puzzle, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Navegacion } from "@/componentes/layout/Navegacion";
import { BolaNieve } from "@/componentes/navideno/BolaNieve";
import { Rompecabezas } from "@/componentes/navideno/Rompecabezas";
import { AvatarPersona } from "@/componentes/ui/AvatarPersona";
import { AvanceAutomatico } from "@/componentes/ui/AvanceAutomatico";
import { Boton } from "@/componentes/ui/Boton";
import { ContadorAnimado } from "@/componentes/ui/ContadorAnimado";
import { Modal } from "@/componentes/ui/Modal";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { usarBorrador } from "@/hooks/usarBorrador";
import { usarConfeti } from "@/hooks/usarConfeti";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { usarSonido } from "@/hooks/usarSonido";
import { mostrarFechaEvento, nombreZonaEvento } from "@/lib/fechasEvento";
import type { ResultadoCoincidencia } from "@/lib/coincidencias";
import type { Pistas } from "@/tipos/pistas";
import { EditorPistas, type BorradorPistas } from "./FormularioPistas";
import { conJSON, ErrorParticipante, mensajeParticipante, pedir } from "./peticionesParticipante";

type Coincidencias = { top3: ResultadoCoincidencia[]; totalCandidatos: number } | { yaConfirmado: true };
const etiquetas = ["A", "B", "C"];

/** Mantiene las pistas al reintentar y solo muestra etiquetas anónimas en los resultados. */
export function FormularioAdivinanza({ cantidadInicial, fechaLimite }: { cantidadInicial: number; fechaLimite?: string }) {
  const router = useRouter();
  const reducido = usarReducirMovimiento();
  const { reproducir } = usarSonido();
  const { lanzarConfeti } = usarConfeti();
  const [valores, cambiarValores, limpiarBorrador] = usarBorrador<BorradorPistas>("cn:adivinanza-borrador", {});
  const [cantidad, cambiarCantidad] = useState(cantidadInicial);
  const [resultados, cambiarResultados] = useState<ResultadoCoincidencia[] | null>(null);
  const [pasoInicial, cambiarPasoInicial, limpiarPaso] = usarBorrador<number>("cn:adivinanza-paso", 0);
  const [dialogo, cambiarDialogo] = useState<"confirmar" | "reintentar" | null>(null);
  const [seleccionado, elegir] = useState<ResultadoCoincidencia | null>(null);
  const [confirmado, confirmarEleccion] = useState(false);
  const [revelado, cambiarRevelado] = useState<{ nombre: string; fotoUrl: string | null } | null>(null);
  const [buscando, cambiarBusqueda] = useState(false);
  const [confirmando, cambiarConfirmacion] = useState(false);
  const [error, cambiarError] = useState("");
  const [errorDialogo, cambiarErrorDialogo] = useState("");
  const [ocupados, cambiarOcupados, limpiarOcupados] = usarBorrador<string[]>("cn:adivinanza-ocupados", []);
  const bloqueo = useRef(false);
  const celebrarPareja = useRef(false);
  const restaurarEditor = useRef(false);
  const focoResultados = useRef(false);
  const solicitud = useRef<AbortController | null>(null);
  const montado = useRef(false);
  const conflicto = !!seleccionado && ocupados.includes(seleccionado.participanteId);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      solicitud.current?.abort();
    };
  }, []);

  function abrir(tipo: "confirmar" | "reintentar", candidato?: ResultadoCoincidencia) {
    if (candidato) elegir(candidato);
    cambiarErrorDialogo("");
    cambiarDialogo(tipo);
    reproducir("click");
  }

  async function buscar(pistas: Pistas) {
    if (bloqueo.current) return;
    bloqueo.current = true;
    cambiarError("");
    cambiarBusqueda(true);
    reproducir("whoosh");
    const peticion = new AbortController();
    solicitud.current = peticion;
    try {
      const datos = await pedir<Coincidencias>("/api/adivinanza/coincidencias", {
        ...conJSON("POST", { seleccion: pistas }), signal: peticion.signal,
      });
      if (peticion.signal.aborted) return;
      if ("yaConfirmado" in datos) { router.replace("/participar/regalar"); return; }
      cambiarCantidad(datos.totalCandidatos);
      if (datos.top3.length) {
        focoResultados.current = true;
        cambiarResultados(datos.top3);
      }
      if (datos.top3[0]?.puntaje > 70) {
        reproducir("acierto");
        void lanzarConfeti({ particleCount: 36 });
      }
    } catch (fallo) {
      if (peticion.signal.aborted) return;
      const mensaje = mensajeParticipante(fallo, router.replace);
      cambiarError(mensaje);
      toast.error(mensaje);
      reproducir("error");
    } finally {
      solicitud.current = null;
      cambiarBusqueda(false);
      bloqueo.current = false;
    }
  }

  async function confirmar() {
    if (!seleccionado || bloqueo.current) return;
    bloqueo.current = true;
    cambiarConfirmacion(true);
    cambiarErrorDialogo("");
    try {
      const datos = await pedir<{ personaSecreta?: { nombre: string; fotoUrl: string | null } }>(
        "/api/adivinanza/confirmar", conJSON("POST", { candidatoId: seleccionado.participanteId }),
      );
      if (!montado.current) return;
      if (datos.personaSecreta) cambiarRevelado(datos.personaSecreta);
      limpiarBorrador();
      limpiarPaso();
      limpiarOcupados();
      confirmarEleccion(true);
      celebrarPareja.current = true;
      cambiarDialogo(null);
      reproducir("revelacion");
    } catch (fallo) {
      if (!montado.current) return;
      const mensaje = mensajeParticipante(fallo, router.replace);
      if (fallo instanceof ErrorParticipante && fallo.estado === 409) {
        if (mensaje.startsWith("Ya confirmaste")) {
          router.replace("/participar/regalar");
          return;
        }
        if (mensaje.startsWith("Esa persona ya fue elegida")) {
          cambiarOcupados((anteriores) => [...anteriores, seleccionado.participanteId]);
        }
      }
      cambiarErrorDialogo(mensaje);
      toast.error(mensaje);
      reproducir("error");
    } finally {
      cambiarConfirmacion(false);
      bloqueo.current = false;
    }
  }

  async function actualizarCandidatos() {
    if (bloqueo.current) return;
    bloqueo.current = true;
    cambiarError("");
    cambiarBusqueda(true);
    try {
      const candidatos = await pedir<{ participanteId: string }[]>("/api/adivinanza/candidatos");
      cambiarCantidad(candidatos.length);
    } catch (fallo) { cambiarError(mensajeParticipante(fallo, router.replace)); }
    finally { cambiarBusqueda(false); bloqueo.current = false; }
  }

  function reintentar() {
    cambiarPasoInicial(0);
    restaurarEditor.current = true;
    cambiarResultados(null);
    cambiarDialogo(null);
    elegir(null);
    cambiarError("");
    reproducir("whoosh");
  }

  return <motion.section className="escena-participante" initial={false} animate={reducido ? { opacity: 1 } : { opacity: [.65, 1], x: [12, 0] }}>
    <Navegacion pasoActual={2} />
    <header className="titulo-participante">
      <h1>¿Quién será tu persona secreta?</h1>
      <p>Selecciona las pistas que creas que la describen. Verás los perfiles con más coincidencias.</p>
      <p className="candidatos-disponibles"><Puzzle size={18} aria-hidden="true" /> {cantidad} {cantidad === 1 ? "candidato disponible" : "candidatos disponibles"}</p>
    </header>

    <AnimatePresence mode="wait" initial={false}>
      {!cantidad ? <motion.div key="vacio" className="panel-participante estado-participante" exit={{ opacity: reducido ? 1 : 0 }}>
        <Rompecabezas completas={[false, false, false, false]} />
        <h2>Faltan piezas</h2><p>Aún no hay candidatos disponibles: quienes ya fueron elegidos no pueden repetirse. Vuelve más tarde y actualiza la lista.</p>
        {fechaLimite && <p>La elección cierra el <time dateTime={fechaLimite}>{mostrarFechaEvento(fechaLimite)}</time> ({nombreZonaEvento}).</p>}
        {error && <p className="error-participante" role="alert">{error}</p>}
        <Boton variante="fantasma" icono={RefreshCw} cargando={buscando} onClick={() => void actualizarCandidatos()}>Actualizar candidatos</Boton>
      </motion.div> : resultados ? <motion.div key="resultados" exit={{ opacity: reducido ? 1 : 0 }} className="panel-resultados">
        <h2 id="titulo-coincidencias" tabIndex={-1} ref={(nodo) => { if (nodo && focoResultados.current) { focoResultados.current = false; nodo.focus(); } }}>
          {confirmado ? "¡Persona secreta elegida!" : "Tus mejores coincidencias"}
        </h2>
        {confirmado && revelado && <motion.div className="revelacion-persona" role="status"
          initial={reducido ? false : { opacity: 0, scale: .82, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={reducido ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 18 }}>
          <AvatarPersona nombre={revelado.nombre} fotoUrl={revelado.fotoUrl} grande />
          <div><span>Tu persona secreta es</span><strong>{revelado.nombre}</strong></div>
        </motion.div>}
        {confirmado ? <p role="status">Sabrás a quién le toca tu regalo cuando confirmes qué vas a llevar.</p>
          : <p>El porcentaje mide qué tan parecidas son las pistas. Dos perfiles pueden tener el mismo puntaje.</p>}
        {!confirmado && resultados.every(({ participanteId }) => ocupados.includes(participanteId)) &&
          <p role="status">Estas coincidencias ya fueron elegidas. Ajusta tus pistas y vuelve a buscar otras.</p>}
        <div className="resultados-coincidencias">
          {resultados.map((resultado, indice) => {
            const destacado = indice === 0;
            const elegido = confirmado && seleccionado?.participanteId === resultado.participanteId;
            const ocupado = ocupados.includes(resultado.participanteId);
            const puntaje = Math.max(0, Math.min(100, resultado.puntaje));
            return <Tarjeta key={resultado.participanteId} variante={elegido ? "completada" : destacado ? "destacada" : "normal"}
              className={elegido ? "coincidencia-elegida" : ""} brillo={destacado}
              initial={reducido ? false : { y: -24, opacity: 0 }}
              animate={elegido && !reducido ? { scale: [1, 1.07, 1], y: [0, -7, 0], opacity: 1 } : { y: 0, opacity: 1 }}
              transition={reducido ? { duration: 0 } : elegido ? { duration: .56, ease: "easeOut" }
                : { type: "spring", stiffness: 190, damping: 16, delay: indice * .095 }}>
              <div className="rango-coincidencia"><span>#{indice + 1}</span>
                {destacado && <motion.span initial={reducido ? false : { rotate: -20, y: -12, scale: .6 }}
                  animate={{ rotate: 0, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 170 }}>
                  <Crown size={25} aria-hidden="true" />
                </motion.span>}
              </div>
              <h3>Candidato {etiquetas[indice]}</h3>
              <div className="anillo-coincidencia">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="53" fill="none" strokeWidth="6" />
                  <motion.circle cx="60" cy="60" r="53" fill="none" strokeWidth="6"
                    initial={reducido ? false : { pathLength: 0 }} animate={{ pathLength: puntaje / 100 }}
                    transition={{ duration: reducido ? 0 : .7, delay: reducido ? 0 : indice * .09 }} />
                </svg>
                <strong><ContadorAnimado valor={puntaje} sufijo="%" desdeCero /></strong>
              </div>
              <p>{resultado.aciertos} de {resultado.totalCampos} pistas</p>
              <Boton variante="fantasma" icono={elegido ? Check : Sparkles}
                disabled={confirmado || ocupado} onClick={() => abrir("confirmar", resultado)}
                aria-label={elegido ? "Candidato elegido" : ocupado ? "Candidato ya elegido" : `Elegir este candidato ${etiquetas[indice]}`}>
                {elegido ? "Elegido" : ocupado ? "Ya fue elegido" : "Elegir este"}
              </Boton>
            </Tarjeta>;
          })}
        </div>
        {confirmado && <AvanceAutomatico mensaje="Continuando a elegir el regalo" alAvanzar={() => router.push("/participar/regalar")} />}
        <div className="acciones-participante edicion-navegacion">
          {confirmado ? <Link className="boton boton-dorado" href="/participar/regalar">Continuar a regalar <ArrowRight size={18} aria-hidden="true" /></Link>
            : <Boton variante="fantasma" icono={RefreshCw} onClick={() => abrir("reintentar")}>Reintentar</Boton>}
        </div>
      </motion.div> : <motion.div key="editor" ref={(nodo) => {
        if (nodo && restaurarEditor.current) { restaurarEditor.current = false; nodo.focus(); }
      }} tabIndex={-1} aria-label="Arma el rompecabezas" exit={{ opacity: reducido ? 1 : 0 }}>
        <EditorPistas valores={valores} alEditar={(siguiente) => { cambiarValores(siguiente); cambiarError(""); }}
          alEnviar={(pistas) => void buscar(pistas)} ocupado={buscando} pasoInicial={pasoInicial} puzzle error={error} />
      </motion.div>}
    </AnimatePresence>

    <Modal abierto={buscando && !!cantidad} titulo="Buscando coincidencias"
      alCerrar={() => solicitud.current?.abort()}
      alTerminarCierre={() => {
        const titulo = document.getElementById("titulo-coincidencias");
        if (titulo && resultados && !confirmado) titulo.focus();
      }}>
      <div className="estado-participante carga-coincidencias"><BolaNieve /><p role="status">Estamos comparando las pistas.</p>
        <Boton variante="fantasma" onClick={() => solicitud.current?.abort()}>Cancelar búsqueda</Boton>
      </div>
    </Modal>
    <Modal abierto={dialogo !== null} titulo={dialogo === "confirmar" ? "¿Elegir a este candidato?" : "¿Volver a intentar?"} cerrable={!confirmando}
      alCerrar={() => { if (!bloqueo.current) cambiarDialogo(null); }}
      alTerminarCierre={() => {
        if (celebrarPareja.current) {
          celebrarPareja.current = false;
          void lanzarConfeti({ preset: "revelacion", particleCount: 72 });
        }
      }}>
      {dialogo === "confirmar" ? <>
        <p>Podrás cambiar de persona hasta que elijas un regalo. Después, tu elección quedará guardada.</p>
        {errorDialogo && <motion.p role="alert" className="error-participante"
          animate={reducido ? {} : { x: [0, -6, 6, -3, 0] }}>{errorDialogo}</motion.p>}
        <div className="acciones-participante">
          <Boton variante="fantasma" onClick={() => cambiarDialogo(null)} disabled={confirmando}>Volver a las coincidencias</Boton>
          <Boton variante="secundario" icono={Check} cargando={confirmando} disabled={conflicto} onClick={() => void confirmar()}>Sí, elegir</Boton>
        </div>
      </> : <>
        <p>Puedes ajustar tus pistas y volver a buscar coincidencias.</p>
        <div className="acciones-participante">
          <Boton variante="fantasma" onClick={() => cambiarDialogo(null)}>Cancelar</Boton>
          <Boton variante="dorado" icono={RefreshCw} onClick={reintentar}>Volver a intentar</Boton>
        </div>
      </>}
    </Modal>
    {!confirmado && <Link className="volver-participante" href="/participar/pistas"><ArrowLeft size={18} aria-hidden="true" /> Volver a tus pistas</Link>}
  </motion.section>;
}
