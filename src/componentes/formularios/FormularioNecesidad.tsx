"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { ArrowRight, Check, ChevronDown, ExternalLink, Gift, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Navegacion } from "@/componentes/layout/Navegacion";
import { Regalo } from "@/componentes/navideno/Regalo";
import { SelectorSiguientePaso } from "@/componentes/navideno/SelectorSiguientePaso";
import { BarraProgreso } from "@/componentes/ui/BarraProgreso";
import { Boton } from "@/componentes/ui/Boton";
import { ContadorAnimado } from "@/componentes/ui/ContadorAnimado";
import { Entrada } from "@/componentes/ui/Entrada";
import { Modal } from "@/componentes/ui/Modal";
import { Tarjeta } from "@/componentes/ui/Tarjeta";
import { usarConfeti } from "@/hooks/usarConfeti";
import { usarBorrador } from "@/hooks/usarBorrador";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { usarSonido } from "@/hooks/usarSonido";
import { LIMITES } from "@/lib/constantes";
const { MAX_NECESIDADES } = LIMITES;
import { esquemaNecesidad } from "@/lib/validaciones/necesidad";
import { conJSON, ErrorParticipante, mensajeParticipante, pedir, rutaFoto, srcFoto } from "./peticionesParticipante";

const SubidorFoto = dynamic(() => import("@/componentes/ui/SubidorFoto").then((modulo) => modulo.SubidorFoto));
export type NecesidadVista = { id: string; nombre: string; descripcion: string | null; fotoUrl: string | null; linkReferencia: string | null };
type Borrador = { nombre: string; descripcion: string; linkReferencia: string; fotoUrl: string };
const vacio: Borrador = { nombre: "", descripcion: "", linkReferencia: "", fotoUrl: "" };
const minimo = LIMITES.MIN_NECESIDADES;

function enlaceWeb(valor: string | null): string | undefined {
  if (!valor) return undefined;
  try {
    const url = new URL(valor);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch { /* Un registro anterior puede tener un enlace inválido. */ }
}

/** El formulario conserva campos y foto si falla la conexión o la API rechaza un cambio. */
export function FormularioNecesidad({ iniciales, respondidas = 0, pistasCompletas = false }: {
  iniciales: NecesidadVista[]; respondidas?: number; pistasCompletas?: boolean;
}) {
  const router = useRouter();
  const reducido = usarReducirMovimiento();
  const { reproducir } = usarSonido();
  const { lanzarConfeti } = usarConfeti();
  const sacudir = useAnimationControls();
  const [necesidades, cambiarNecesidades] = useState(iniciales);
  const [modal, cambiarModal] = useState<"editar" | "eliminar" | null>(null);
  const [seleccionada, seleccionar] = useState<NecesidadVista | null>(null);
  const [borrador, guardarBorrador, limpiarBorrador] = usarBorrador("cn:necesidad-borrador", vacio);
  const cambiarBorrador = guardarBorrador;
  const [archivo, cambiarArchivo] = useState<File | null>(null);
  const [nueva, marcarNueva] = useState("");
  const [ocupado, cambiarOcupado] = useState(false);
  const [subiendo, cambiarSubida] = useState(false);
  const [error, cambiarError] = useState("");
  const [errores, cambiarErrores] = useState<Partial<Record<keyof Borrador, string>>>({});
  const bloqueo = useRef(false);
  const [borradoresGuardados, guardarBorradores] = usarBorrador<Record<string, Borrador>>("cn:necesidades-borradores", {});
  const borradores = useRef(new Map<string, File | null>());
  const botonAgregar = useRef<HTMLButtonElement>(null);
  const recuperarFoco = useRef(false);
  const faltan = Math.max(0, minimo - necesidades.length);
  const limiteAlcanzado = necesidades.length >= MAX_NECESIDADES;

  function abrir(tipo: "editar" | "eliminar", necesidad: NecesidadVista | null = null) {
    const clave = necesidad?.id ?? "";
    seleccionar(necesidad);
    cambiarBorrador(borradoresGuardados[clave] ?? (necesidad ? {
      nombre: necesidad.nombre, descripcion: necesidad.descripcion ?? "", linkReferencia: necesidad.linkReferencia ?? "",
      fotoUrl: rutaFoto(necesidad.fotoUrl) ?? "",
    } : vacio));
    cambiarArchivo(borradores.current.get(clave) ?? null);
    cambiarErrores({});
    cambiarError("");
    cambiarModal(tipo);
    reproducir("click");
  }

  function cerrar() {
    if (bloqueo.current) return;
    if (modal === "editar") {
      const clave = seleccionada?.id ?? "";
      guardarBorradores({ ...borradoresGuardados, [clave]: borrador });
      if (archivo) borradores.current.set(clave, archivo);
    }
    cambiarModal(null);
  }

  function editar(campo: keyof Borrador, valor: string) {
    cambiarBorrador((actual) => ({ ...actual, [campo]: valor }));
    cambiarErrores((actual) => ({ ...actual, [campo]: undefined }));
    cambiarError("");
  }

  function informar(fallo: unknown) {
    const mensaje = mensajeParticipante(fallo, router.replace);
    cambiarError(mensaje);
    toast.error(mensaje);
    reproducir("error");
    if (!reducido) void sacudir.start({ x: [0, -6, 6, -3, 0], transition: { duration: .28 } });
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (bloqueo.current) return;
    cambiarError("");
    const validacion = esquemaNecesidad.safeParse(borrador);
    const campos = validacion.success ? {} : validacion.error.flatten().fieldErrors;
    const erroresNuevos = {
      nombre: campos.nombre?.[0],
      descripcion: campos.descripcion?.[0],
      linkReferencia: campos.linkReferencia?.[0] ?? (borrador.linkReferencia.trim() && !enlaceWeb(borrador.linkReferencia.trim())
        ? "Ingresa un enlace que empiece con https:// o http://." : undefined),
    };
    cambiarErrores(erroresNuevos);
    const primero = Object.entries(erroresNuevos).find(([, mensaje]) => mensaje)?.[0];
    if (!validacion.success || primero) {
      if (primero) evento.currentTarget.querySelector<HTMLElement>(`[name="${primero}"]`)?.focus();
      reproducir("error");
      return;
    }

    bloqueo.current = true;
    cambiarOcupado(true);
    let subidaReciente: string | null = null;
    try {
      let fotoUrl = borrador.fotoUrl;
      // Un solo envío por acción explícita. Si el guardado falla después, el reintento reusa la subida.
      if (archivo) {
        cambiarSubida(true);
        const datos = new FormData();
        datos.set("foto", archivo);
        const subida = await pedir<{ url: string }>("/api/necesidades/subir-foto", { method: "POST", body: datos });
        fotoUrl = subida.url;
        subidaReciente = subida.url;
        cambiarBorrador((actual) => ({ ...actual, fotoUrl }));
        cambiarArchivo(null);
        cambiarSubida(false);
        void lanzarConfeti({ particleCount: 9, spread: 36 });
      }
      const ruta = seleccionada ? `/api/necesidades/${seleccionada.id}` : "/api/necesidades";
      const guardada = await pedir<NecesidadVista>(ruta, conJSON(seleccionada ? "PUT" : "POST", { ...validacion.data, fotoUrl }));
      const claveGuardada = seleccionada?.id ?? "";
      borradores.current.delete(claveGuardada);
      const { [claveGuardada]: _guardado, ...restoBorradores } = borradoresGuardados;
      guardarBorradores(restoBorradores);
      limpiarBorrador();
      // Refleja el resultado de inmediato mediante la respuesta, sin volver a consultar toda la lista.
      cambiarNecesidades((actuales) => seleccionada
        ? actuales.map((item) => item.id === guardada.id ? guardada : item) : [...actuales, guardada]);
      if (!seleccionada) {
        marcarNueva(guardada.id);
        if (!necesidades.length) recuperarFoco.current = true;
      }
      cambiarModal(null);
      toast.success(seleccionada ? "Necesidad actualizada." : "Necesidad agregada.");
      reproducir("acierto");
      void lanzarConfeti({ particleCount: 24 });
    } catch (fallo) {
      if (subidaReciente) {
        const nombre = subidaReciente.split("/").pop() ?? "";
        void fetch(`/api/fotos/${nombre}`, { method: "DELETE" }).catch(() => undefined);
        cambiarBorrador((actual) => ({ ...actual, fotoUrl: "" }));
        cambiarArchivo(null);
      }
      informar(fallo);
    }
    finally {
      cambiarOcupado(false);
      cambiarSubida(false);
      bloqueo.current = false;
    }
  }

  async function eliminar() {
    if (!seleccionada || bloqueo.current) return;
    bloqueo.current = true;
    cambiarOcupado(true);
    cambiarError("");
    const eliminada = seleccionada;
    try {
      await pedir(`/api/necesidades/${eliminada.id}`, { method: "DELETE" });
    } catch (fallo) {
      if (!(fallo instanceof ErrorParticipante && fallo.estado === 404)) {
        informar(fallo);
        return;
      }
    } finally {
      cambiarOcupado(false);
      bloqueo.current = false;
    }
    cambiarNecesidades((actuales) => actuales.filter((item) => item.id !== eliminada.id));
    borradores.current.delete(eliminada.id);
    const { [eliminada.id]: _eliminado, ...restoEliminados } = borradoresGuardados;
    guardarBorradores(restoEliminados);
    recuperarFoco.current = true;
    cambiarModal(null);
    toast.success("Necesidad eliminada.");
    reproducir("click");
  }

  return <motion.section className="escena-participante" initial={false} animate={reducido ? { opacity: 1 } : { opacity: [.65, 1], x: [12, 0] }}>
    <Navegacion pasoActual={0} />
    <header className="titulo-participante titulo-con-accion">
      <div><h1>Tus necesidades</h1><p>Comparte ideas para que tu amigo secreto sepa qué te haría ilusión recibir.</p></div>
      {necesidades.length > 0 && <Boton ref={botonAgregar} variante="dorado" icono={Plus} disabled={limiteAlcanzado}
        aria-describedby={limiteAlcanzado ? "limite-necesidades" : undefined} onClick={() => abrir("editar")}>Agregar necesidad</Boton>}
    </header>

    <motion.div layout={reducido ? false : "position"} className="panel-participante progreso-necesidades">
      <div className="progreso-cabecera">
        <span role="status">{faltan > 0
          ? `${faltan === 1 ? "Te falta 1 necesidad" : `Te faltan ${faltan} necesidades`}. Mínimo ${minimo} para participar.`
          : <><Check size={19} aria-hidden="true" /> Ya puedes continuar</>}</span>
        <strong>{necesidades.length} guardadas</strong>
      </div>
      <BarraProgreso valor={necesidades.length / minimo * 100} etiqueta="Necesidades para participar" texto={`${necesidades.length} guardadas, mínimo ${minimo}`} />
      {limiteAlcanzado && <p id="limite-necesidades" className="ayuda-participante">Tu lista llegó al máximo de {MAX_NECESIDADES} necesidades. Aún puedes editar las que ya tienes.</p>}
    </motion.div>

    <div className="contenedor-necesidades">
      {!necesidades.length && <div className="panel-participante estado-participante necesidad-vacia">
        <div className="regalo-vacio"><Regalo /></div>
        <h2>Tu lista está por comenzar</h2>
        <p>Piensa en algo que usarías, disfrutarías o te gustaría probar.</p>
        <Boton ref={botonAgregar} variante="dorado" icono={Plus} onClick={() => abrir("editar")}>Agregar mi primera necesidad</Boton>
      </div>}
      <div className="grid-necesidades">
        <AnimatePresence initial={false}>
          {necesidades.map((item, indice) => {
            const foto = srcFoto(item.fotoUrl);
            const enlace = enlaceWeb(item.linkReferencia);
            const recienAgregada = item.id === nueva;
            return <Tarjeta key={item.id} className="tarjeta-necesidad" layout={reducido ? false : true}
              initial={reducido ? false : { opacity: 0, scale: recienAgregada ? .9 : 1, y: 14 }}
              animate={recienAgregada ? { opacity: 1, scale: 1, y: 0 } : undefined}
              whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }}
              exit={reducido ? { opacity: 1, transition: { duration: 0 } } : { scale: 0, opacity: 0, transition: { duration: .2 } }}
              transition={reducido ? { duration: 0 } : recienAgregada ? { type: "spring", stiffness: 210, damping: 23 } : { duration: .28, delay: Math.min(indice * .055, .2) }}>
              {foto && <div className="foto-necesidad"><Image src={foto} alt={`Foto de ${item.nombre}`} fill
                sizes="(max-width: 690px) 100vw, (max-width: 990px) 50vw, 380px" unoptimized /></div>}
              <h2>{item.nombre}</h2>
              {item.descripcion && (item.descripcion.length > 112
                ? <details className="descripcion-necesidad"><summary><span className="descripcion-corta">{item.descripcion.slice(0, 112).trimEnd()}…</span><span className="ver-descripcion">Ver descripción <ChevronDown size={16} aria-hidden="true" /></span></summary><p>{item.descripcion}</p></details>
                : <p className="descripcion-necesidad">{item.descripcion}</p>)}
              {enlace && <a className="enlace-necesidad" href={enlace} target="_blank" rel="noopener noreferrer">Ver referencia <ExternalLink size={16} aria-hidden="true" /><span className="sr-only"> (abre en otra pestaña)</span></a>}
              <div className="acciones-participante acciones-necesidad">
                <Boton variante="fantasma" icono={Pencil} aria-label={`Editar ${item.nombre}`} onClick={() => abrir("editar", item)}>Editar</Boton>
                <Boton variante="fantasma" icono={Trash2} aria-label={`Eliminar ${item.nombre}`} onClick={() => abrir("eliminar", item)}>Eliminar</Boton>
              </div>
            </Tarjeta>;
          })}
        </AnimatePresence>
      </div>
    </div>

    <div className="continuar-necesidades">
      {faltan ? <><p id="ayuda-continuar" className="ayuda-participante">Agrega {faltan === 1 ? "una necesidad más" : `${faltan} necesidades más`} para avanzar.</p>
        <Boton variante="dorado" icono={ArrowRight} aria-describedby="ayuda-continuar" aria-disabled
          onClick={() => { toast.error(`Agrega ${faltan === 1 ? "una necesidad más" : `${faltan} necesidades más`} para avanzar.`); reproducir("error"); }}>Continuar a pistas</Boton></>
        : <SelectorSiguientePaso pistasCompletas={pistasCompletas} respondidas={respondidas} />}
    </div>

    <Modal abierto={modal === "editar"} titulo={seleccionada ? "Editar necesidad" : "Agregar necesidad"} alCerrar={cerrar} cerrable={!ocupado}
      alTerminarCierre={() => { if (recuperarFoco.current) { recuperarFoco.current = false; botonAgregar.current?.focus(); } }}>
      <form className="form-necesidad" onSubmit={(evento) => void guardar(evento)} noValidate>
        <Entrada etiqueta="Nombre" name="nombre" required maxLength={100} value={borrador.nombre} error={errores.nombre} disabled={ocupado}
          onChange={(evento) => editar("nombre", evento.target.value)} />
        <div><label htmlFor="descripcion-necesidad" className="etiqueta-participante">Descripción <span className="texto-suave">(opcional)</span></label>
          <textarea id="descripcion-necesidad" name="descripcion" rows={3} maxLength={500} value={borrador.descripcion}
            aria-describedby="contador-descripcion" disabled={ocupado} onChange={(evento) => editar("descripcion", evento.target.value)} />
          <p id="contador-descripcion" className="contador-participante"><ContadorAnimado valor={borrador.descripcion.length} /> / 500 caracteres</p>
        </div>
        <SubidorFoto archivo={archivo} url={borrador.fotoUrl} deshabilitado={ocupado} alElegir={(foto) => { cambiarArchivo(foto); reproducir("click"); }}
          alQuitar={() => { cambiarArchivo(null); editar("fotoUrl", ""); reproducir("click"); }} />
        <Entrada etiqueta="Enlace de referencia (opcional)" name="linkReferencia" type="url" inputMode="url" maxLength={2048}
          value={borrador.linkReferencia} error={errores.linkReferencia} disabled={ocupado} onChange={(evento) => editar("linkReferencia", evento.target.value)} />
        {error && <p className="error-participante" role="alert">{error}</p>}
        <motion.div className="acciones-participante" animate={sacudir}>
          <Boton variante="fantasma" onClick={cerrar} disabled={ocupado}>Cerrar</Boton>
          <Boton type="submit" variante="dorado" icono={Gift} cargando={ocupado}>{subiendo ? "Subiendo foto…" : ocupado ? "Guardando…" : "Guardar necesidad"}</Boton>
        </motion.div>
      </form>
    </Modal>
    <Modal abierto={modal === "eliminar"} titulo="¿Eliminar esta necesidad?" alCerrar={cerrar} cerrable={!ocupado}
      alTerminarCierre={() => { if (recuperarFoco.current) { recuperarFoco.current = false; botonAgregar.current?.focus(); } }}>
      <p className="texto-largo">Se quitará «{seleccionada?.nombre}» de tu lista.</p>
      {error && <p className="error-participante" role="alert">{error}</p>}
      <div className="acciones-participante">
        <Boton variante="fantasma" onClick={cerrar} disabled={ocupado}>Conservar</Boton>
        <Boton variante="peligro" icono={Trash2} cargando={ocupado} onClick={() => void eliminar()}>Eliminar</Boton>
      </div>
    </Modal>
  </motion.section>;
}
