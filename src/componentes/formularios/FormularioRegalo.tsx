"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useAnimationControls } from "framer-motion";
import { ArrowRight, Check, ExternalLink, Gift, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Navegacion } from "@/componentes/layout/Navegacion";
import { CajaCierre } from "@/componentes/navideno/CajaCierre";
import { DetalleRegalo } from "@/componentes/navideno/DetalleRegalo";
import { Regalo } from "@/componentes/navideno/Regalo";
import { AvanceAutomatico } from "@/componentes/ui/AvanceAutomatico";
import { Boton } from "@/componentes/ui/Boton";
import { Modal } from "@/componentes/ui/Modal";
import { usarBorrador } from "@/hooks/usarBorrador";
import { usarConfeti } from "@/hooks/usarConfeti";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { usarSonido } from "@/hooks/usarSonido";
import { mostrarFechaEvento, nombreZonaEvento } from "@/lib/fechasEvento";
import type { EleccionRegalo, NecesidadRegalo } from "@/tipos/final";
import { conJSON, ErrorParticipante, mensajeParticipante, pedir, srcFoto } from "./peticionesParticipante";

const destino = "/participar/revelacion";

/** Los datos y la etiqueta de cada regalo se limitan a la necesidad anónima. */
export function FormularioRegalo({ necesidades, pendientes, fechaLimite }: {
  necesidades: NecesidadRegalo[] | null; pendientes?: number; fechaLimite?: string;
}) {
  const router = useRouter();
  const reducido = usarReducirMovimiento();
  const { reproducir } = usarSonido();
  const { lanzarConfeti } = usarConfeti();
  const sacudir = useAnimationControls();
  const [id, elegir, limpiarSeleccion] = usarBorrador("cn:regalo-seleccion", "");
  const [modal, abrir] = useState<"regalo" | "reintentar" | null>(null);
  const [guardando, cambiarGuardando] = useState(false);
  const [eleccion, guardarEleccion] = useState<EleccionRegalo | null>(null);
  const [error, cambiarError] = useState("");
  const [revisarLista, cambiarRevision] = useState(false);
  const elegido = necesidades?.find((n) => n.id === id);
  const bloqueo = useRef(false);
  const exito = useRef<EleccionRegalo | null>(null);
  const tituloExito = useRef<HTMLHeadingElement>(null);

  async function confirmar() {
    if (bloqueo.current || (modal === "regalo" && !elegido)) return;
    bloqueo.current = true;
    cambiarGuardando(true);
    cambiarError("");
    cambiarRevision(false);
    try {
      if (modal === "reintentar") {
        await pedir("/api/adivinanza/reintentar", { method: "POST" });
        router.replace("/participar/adivinar");
      } else {
        exito.current = await pedir<EleccionRegalo>("/api/regalos/seleccionar", conJSON("POST", { necesidadId: elegido?.id }));
      }
      abrir(null);
    } catch (fallo) {
      const mensaje = mensajeParticipante(fallo, router.replace);
      if (fallo instanceof ErrorParticipante && fallo.estado === 409 && mensaje.startsWith("Ya elegiste")) {
        router.replace(destino);
        return;
      }
      if (fallo instanceof ErrorParticipante) {
        if (fallo.estado === 403 && mensaje.startsWith("Aún no has adivinado")) {
          router.replace("/participar/adivinar");
          return;
        }
        if (fallo.estado === 409 || (fallo.estado === 403 && mensaje.startsWith("Elige una necesidad"))) cambiarRevision(true);
      }
      cambiarError(mensaje);
      toast.error(mensaje);
      reproducir("error");
      if (!reducido) void sacudir.start({ x: [0, -6, 6, -3, 0] });
    } finally {
      bloqueo.current = false;
      cambiarGuardando(false);
    }
  }

  function mostrar(tipo: "regalo" | "reintentar") {
    cambiarError("");
    cambiarRevision(false);
    abrir(tipo);
  }

  return <section className="escena-participante regalo-etapa">
    <Navegacion pasoActual={3} />
    <LayoutGroup>
    <AnimatePresence initial={false} mode="popLayout">
      {eleccion ? <motion.div key="confirmado" className="panel-participante estado-participante regalo-confirmado"
        initial={reducido ? false : { opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <motion.div className="regalo-envoltura" layoutId={reducido ? undefined : "opcion-confirmada"}
          transition={{ layout: { duration: .45, ease: "easeInOut" } }} aria-hidden="true">
          {!reducido && <motion.div className="regalo-papel" initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: .76 }} transition={{ duration: .27, delay: .43 }}>
            <Gift size={24} /><span>{eleccion.regalo}</span>
            <span className="regalo-doblez regalo-doblez-izquierdo" />
            <span className="regalo-doblez regalo-doblez-derecho" />
          </motion.div>}
          <motion.div className="regalo-caja-resultante" initial={reducido ? false : { opacity: 0, scale: .8 }}
            animate={{ opacity: 1, scale: 1 }} transition={{ duration: reducido ? 0 : .32, delay: reducido ? 0 : .45 }}>
            <CajaCierre />
          </motion.div>
        </motion.div>
        <h1 tabIndex={-1} ref={(nodo) => { if (nodo && nodo !== tituloExito.current) { tituloExito.current = nodo; nodo.focus(); } }}>¡Regalo guardado!</h1>
        <DetalleRegalo eleccion={eleccion} />
        <AvanceAutomatico mensaje="Continuando a tu elección" alAvanzar={() => router.replace(destino)} />
        <Link className="boton boton-dorado" href={destino}>Ver mi elección <ArrowRight size={18} aria-hidden="true" /></Link>
      </motion.div> : <motion.div key="elegir" exit={reducido ? undefined : { opacity: 0, scale: .98 }}>
        <motion.header className="titulo-participante regalo-cabecera" initial={reducido ? false : { opacity: .7, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div><h1>¡Encontraste a tu persona secreta!</h1>
            <p>Elige una necesidad de su lista. Al confirmarla, sabrás a quién se la entregarás.</p>
          </div>
          <div className="regalo-emblema" aria-hidden="true"><Regalo /></div>
        </motion.header>
        {necesidades === null ? <div className="panel-participante estado-participante">
          <h2>No pudimos cargar la lista</h2>
          <Boton variante="fantasma" icono={RefreshCw} onClick={() => router.refresh()}>Reintentar</Boton>
        </div> : necesidades.length === 0 ? <div className="panel-participante estado-participante">
          <Gift size={42} aria-hidden="true" /><h2>La lista está vacía</h2>
          <p>Tu persona secreta aún no ha subido sus necesidades. Vuelve más tarde y actualiza la lista.</p>
          {pendientes !== undefined && <p role="status">{pendientes} {pendientes === 1 ? "persona sigue" : "personas siguen"} eligiendo regalo.</p>}
          {fechaLimite && <p>La elección cierra el <time dateTime={fechaLimite}>{mostrarFechaEvento(fechaLimite)}</time> ({nombreZonaEvento}).</p>}
          <Boton variante="fantasma" icono={RefreshCw} onClick={() => router.refresh()}>Actualizar lista</Boton>
        </div> : <>
          <fieldset className="contenedor-necesidades regalo-opciones">
            <legend className="sr-only">Elige una sola necesidad</legend>
            <div className="grid-necesidades">
              {necesidades.map((n, i) => {
                const activa = id === n.id;
                const foto = srcFoto(n.fotoUrl);
                const enlace = n.linkReferencia && /^https?:\/\//i.test(n.linkReferencia) ? n.linkReferencia : null;
                return <motion.label key={n.id} htmlFor={`regalo-${n.id}`} className={activa ? "opcion-regalo opcion-regalo-activa" : "opcion-regalo"}
                  layoutId={activa && !reducido ? "opcion-confirmada" : undefined}
                  initial={reducido ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} animate={{ scale: activa && !reducido ? 1.02 : 1 }}
                  transition={{ duration: reducido ? 0 : .24, delay: reducido ? 0 : Math.min(i, 4) * .06 }}>
                  <div className="foto-necesidad regalo-foto">
                    {foto ? <Image src={foto} alt="" fill unoptimized sizes="(max-width: 680px) 96vw, (max-width: 990px) 45vw, 340px" />
                      : <div className="foto-regalo-vacia" aria-hidden="true"><Gift size={40} strokeWidth={1.25} /></div>}
                  </div>
                  <h2>{n.nombre}</h2>
                  {n.descripcion && <p>{n.descripcion}</p>}
                  {enlace && <a className="enlace-necesidad" href={enlace} target="_blank" rel="noopener noreferrer">
                    Ver referencia <ExternalLink size={16} aria-hidden="true" /><span className="sr-only"> (abre en otra pestaña)</span>
                  </a>}
                  <span className="regalo-radio">
                    <input id={`regalo-${n.id}`} type="radio" className="sr-only" name="regalo" checked={activa}
                      aria-label={"Elegir " + n.nombre} onChange={() => { elegir(n.id); reproducir("click"); }} />
                    <AnimatePresence initial={false}>
                      {activa && <motion.svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"
                        initial={{ opacity: reducido ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: reducido ? 0 : .2 }}>
                        <motion.path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          initial={{ pathLength: reducido ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reducido ? 0 : .2 }} />
                      </motion.svg>}
                    </AnimatePresence>
                    {activa ? "Seleccionada" : "Elegir esta"}
                  </span>
                </motion.label>;
              })}
            </div>
          </fieldset>
          <div className="regalo-seleccion">
            <p role="status">{elegido ? "1 necesidad seleccionada" : "Selecciona una necesidad para continuar."}</p>
            <Boton variante="dorado" icono={Gift} disabled={!elegido} onClick={() => mostrar("regalo")}>Confirmar regalo</Boton>
          </div>
        </>}
        <Boton className="volver-regalo" variante="fantasma" icono={RefreshCw} onClick={() => mostrar("reintentar")}>Volver a adivinar</Boton>
      </motion.div>}
    </AnimatePresence>
    </LayoutGroup>

    <Modal abierto={modal !== null} titulo={modal === "reintentar" ? "¿Volver a adivinar?" : "¿Confirmar este regalo?"}
      cerrable={!guardando} alCerrar={() => { if (!bloqueo.current) abrir(null); }}
      alTerminarCierre={() => {
        if (!exito.current) return;
        guardarEleccion(exito.current);
        limpiarSeleccion();
        exito.current = null;
        reproducir("acierto");
        void lanzarConfeti({ particleCount: 65 });
      }}>
      <p>{modal === "reintentar" ? "Se liberará tu asignación actual para que puedas buscar otras coincidencias." :
        <>Vas a regalar <strong>{elegido?.nombre}</strong>. Esta elección queda guardada de forma definitiva.</>}</p>
      {error && <p className="error-participante" role="alert">{error}</p>}
      <motion.div className="acciones-participante" animate={sacudir}>
        <Boton variante="fantasma" disabled={guardando} onClick={() => abrir(null)}>{modal === "reintentar" ? "Conservar" : "Volver a elegir"}</Boton>
        {revisarLista && <Boton variante="fantasma" icono={RefreshCw} onClick={() => { abrir(null); elegir(""); router.refresh(); }}>Actualizar lista</Boton>}
        <Boton variante="secundario" icono={Check} cargando={guardando} onClick={() => void confirmar()}>{modal === "reintentar" ? "Sí, reintentar" : "Sí, confirmar"}</Boton>
      </motion.div>
    </Modal>
  </section>;
}
