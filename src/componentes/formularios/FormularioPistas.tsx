"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, LayoutGroup, motion, useAnimationControls } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Fingerprint, Glasses, Lightbulb, Puzzle, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { Navegacion } from "@/componentes/layout/Navegacion";
import { Rompecabezas } from "@/componentes/navideno/Rompecabezas";
import { AvanceAutomatico } from "@/componentes/ui/AvanceAutomatico";
import { BarraProgreso } from "@/componentes/ui/BarraProgreso";
import { Boton } from "@/componentes/ui/Boton";
import { Casilla } from "@/componentes/ui/Casilla";
import { ChipSeleccion } from "@/componentes/ui/ChipSeleccion";
import { usarConfeti } from "@/hooks/usarConfeti";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { usarSonido } from "@/hooks/usarSonido";
import { DATOS_CURIOSOS_SUGERIDOS, PISTAS_FISICO, PISTAS_GUSTOS, PISTAS_PERSONALIDAD } from "@/lib/constantes";
import { esquemaPistas } from "@/lib/validaciones/pistas";
import type { Pistas } from "@/tipos/pistas";
import { conJSON, mensajeParticipante, pedir } from "./peticionesParticipante";

const secciones = [
  { titulo: "Rasgos físicos", icono: Glasses, campos: [
    ["altura", "Altura", PISTAS_FISICO.altura], ["complexion", "Complexión", PISTAS_FISICO.complexion],
    ["cabello", "Cabello", PISTAS_FISICO.cabello], ["lentes", "¿Usa lentes?", PISTAS_FISICO.lentes],
    ["barba", "Barba o bigote", PISTAS_FISICO.barba],
  ] },
  { titulo: "Personalidad", icono: Fingerprint, campos: [
    ["social", "Forma de socializar", PISTAS_PERSONALIDAD.social], ["humor", "Tipo de humor", PISTAS_PERSONALIDAD.humor],
    ["puntualidad", "Puntualidad", PISTAS_PERSONALIDAD.puntualidad], ["energia", "Nivel de energía", PISTAS_PERSONALIDAD.energia],
  ] },
  { titulo: "Gustos", icono: Star, campos: [
    ["comida", "Comida favorita", PISTAS_GUSTOS.comida], ["musica", "Música", PISTAS_GUSTOS.musica],
    ["hobby", "Pasatiempo", PISTAS_GUSTOS.hobby], ["lugar", "Lugar favorito", PISTAS_GUSTOS.lugar],
  ] },
  { titulo: "Dato curioso", icono: Lightbulb, campos: [["datoCurioso", "Dato curioso", []]] },
] as const;
type Campo = (typeof secciones)[number]["campos"][number][0];
export type BorradorPistas = Partial<Record<Campo, string | boolean>>;

function respondida(valor: BorradorPistas[Campo]) {
  return typeof valor === "string" ? Boolean(valor.trim()) : valor !== undefined;
}

function aPistas(borrador: BorradorPistas) {
  const { altura, complexion, cabello, lentes, barba, social, humor, puntualidad, energia, comida, musica, hobby, lugar, datoCurioso } = borrador;
  return esquemaPistas.safeParse({
    fisico: { altura, complexion, cabello, lentes, barba },
    personalidad: { social, humor, puntualidad, energia },
    gustos: { comida, musica, hobby, lugar },
    datoCurioso,
  });
}

function limpiarBorrador(dato: unknown): BorradorPistas | null {
  if (!dato || typeof dato !== "object") return null;
  const entrada = dato as Record<string, unknown>;
  const limpio: BorradorPistas = {};
  for (const seccion of secciones) for (const [campo, , opciones] of seccion.campos) {
    const valor = entrada[campo];
    if (campo === "datoCurioso" && DATOS_CURIOSOS_SUGERIDOS.some((opcion) => opcion === valor)) limpio[campo] = valor as string;
    else if (opciones.some((opcion) => opcion === valor)) limpio[campo] = valor as string | boolean;
  }
  return limpio;
}

/** El mismo editor se usa para describirse y para armar la hipótesis. */
export function EditorPistas({ valores, alEditar, alEnviar, ocupado, puzzle = false, pasoInicial = 0, error }: {
  valores: BorradorPistas; alEditar: (valores: BorradorPistas) => void; alEnviar: (pistas: Pistas) => void;
  ocupado: boolean; puzzle?: boolean; pasoInicial?: number; error?: string;
}) {
  const [paso, cambiarPaso] = useState(pasoInicial);
  const [direccion, cambiarDireccion] = useState(1);
  const [sugerencia, cambiarSugerencia] = useState("");
  const enfocar = useRef(false);
  const id = useId();
  const reducido = usarReducirMovimiento();
  const { reproducir } = usarSonido();
  const { lanzarConfeti } = usarConfeti();
  const celebrada = useRef(false);
  const respondido = (campo: Campo) => respondida(valores[campo]);
  const cantidad = secciones.reduce((total, seccion) => total + seccion.campos.filter(([campo]) => respondido(campo)).length, 0);
  const completas = secciones.map((seccion) => seccion.campos.every(([campo]) => respondido(campo)));
  const completa = completas.every(Boolean);
  const dato = typeof valores.datoCurioso === "string" ? valores.datoCurioso : "";
  const Icono = secciones[paso].icono;
  const faltan = secciones[paso].campos.filter(([campo]) => !respondido(campo)).map(([, etiqueta]) => etiqueta);
  const textoFalta = faltan.length ? `Falta: ${faltan.join(", ")}.` : "";
  const variantes = {
    entra: (sentido: number) => ({ opacity: reducido ? 1 : 0, x: reducido ? 0 : sentido * 18 }),
    visible: { opacity: 1, x: 0 },
    sale: (sentido: number) => ({ opacity: reducido ? 1 : 0, x: reducido ? 0 : -sentido * 18 }),
  };

  function editar(campo: Campo, valor: string | boolean, sonar = true) {
    const siguiente = { ...valores, [campo]: valor };
    alEditar(siguiente);
    const encaja = puzzle && !completas[paso] && secciones[paso].campos.every(([clave]) => respondida(siguiente[clave]));
    if (encaja) reproducir("encaje");
    else if (sonar) reproducir("click");
    if (puzzle && !completa && !celebrada.current && aPistas(siguiente).success && String(siguiente.datoCurioso ?? "").trim()) {
      celebrada.current = true;
      void lanzarConfeti({ particleCount: 30 });
    }
  }

  function mover(pasoNuevo: number) {
    enfocar.current = true;
    cambiarDireccion(pasoNuevo > paso ? 1 : -1);
    cambiarPaso(pasoNuevo);
    reproducir("whoosh");
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado || !completas[paso]) return;
    if (paso < 3) { mover(paso + 1); return; }
    const resultado = aPistas(valores);
    if (resultado.success && completa) alEnviar(resultado.data);
  }

  return <div className={`panel-participante editor-pistas ${puzzle ? "editor-puzzle" : ""}`}>
    {puzzle && <div className={`puzzle-tablero ${completa ? "puzzle-listo" : ""}`}>
      <Rompecabezas completas={completas} />
      <p role="status"><strong>{completas.filter(Boolean).length} de 4 piezas</strong><br />{completa ? "¡Rompecabezas completo!" : "Completa una categoría para encajar su pieza."}</p>
    </div>}
    <ol className="etapas-pistas" aria-label="Secciones del formulario">
      {secciones.map(({ titulo }, indice) => <li key={titulo} aria-current={paso === indice ? "step" : undefined}>
        <span className={completas[indice] ? "etapa-completa" : ""}>{completas[indice] ? <Check size={16} aria-label="Completado" /> : indice + 1}</span>
        {titulo}
      </li>)}
    </ol>
    <div className="progreso-cabecera"><span>Pistas respondidas</span><strong>{cantidad} de 14</strong></div>
    <BarraProgreso valor={Math.round(cantidad / 14 * 100)} etiqueta="Pistas respondidas" texto={`${cantidad} de 14`} />

    <form onSubmit={enviar} noValidate>
      <fieldset className="campos-etapa" disabled={ocupado}>
        <legend className="sr-only">Paso {paso + 1} de 4</legend>
        <AnimatePresence mode="wait" initial={false} custom={direccion}>
          <motion.div key={paso} custom={direccion} variants={variantes} initial="entra" animate="visible" exit="sale"
            transition={{ duration: reducido ? 0 : .12 }}>
            <h2 className="etapa-titulo" tabIndex={-1} ref={(nodo) => {
              if (nodo && enfocar.current) { enfocar.current = false; nodo.focus(); }
            }}><Icono size={25} aria-hidden="true" />{secciones[paso].titulo}</h2>
            {paso === 3 ? <LayoutGroup id={id}><div className="dato-curioso-pista">
              <p>Elige una de las mismas opciones que ve toda la familia.</p>
              {sugerencia && !reducido && <motion.div aria-hidden="true" className="sugerencia-recibida" layoutId={sugerencia} />}
              <p className="etiqueta-participante">Dato curioso</p>
              <div className="chips-pistas">{DATOS_CURIOSOS_SUGERIDOS.map((texto) =>
                <motion.div key={texto} layoutId={!reducido && sugerencia !== texto ? texto : undefined}>
                  <ChipSeleccion texto={texto} seleccionado={dato === texto} dorado={puzzle}
                    alElegir={() => { cambiarSugerencia(texto); editar("datoCurioso", texto); }} />
                </motion.div>)}</div>
            </div></LayoutGroup> : secciones[paso].campos.map(([campo, etiqueta, opciones]) => <fieldset className="campo-pista" key={campo}>
              <legend>{etiqueta}</legend>
              <div className="chips-pistas">{campo === "lentes" ? <>
                <Casilla etiqueta="Sí" grupo={`${id}-lentes`} seleccionada={valores.lentes === true} alCambiar={() => editar("lentes", true)} />
                <Casilla etiqueta="No" grupo={`${id}-lentes`} seleccionada={valores.lentes === false} alCambiar={() => editar("lentes", false)} />
              </> : opciones.map((opcion) => <ChipSeleccion key={String(opcion)} grupo={`${id}-${campo}`}
                texto={String(opcion)} seleccionado={valores[campo] === opcion} dorado={puzzle} alElegir={() => editar(campo, opcion)} />)}</div>
            </fieldset>)}
          </motion.div>
        </AnimatePresence>
      </fieldset>
      {error && <p className="error-participante" role="alert">{error}</p>}
      <div className="acciones-participante edicion-navegacion">
        {paso > 0 && <Boton icono={ArrowLeft} variante="fantasma" disabled={ocupado} onClick={() => mover(paso - 1)}>Atrás</Boton>}
        <Boton type="submit" variante="dorado" icono={paso < 3 ? ArrowRight : puzzle ? Puzzle : Sparkles}
          aria-describedby={!completas[paso] ? "ayuda-pista-falta" : undefined}
          disabled={!completas[paso] || (paso === 3 && !completa)} cargando={ocupado}
          className={puzzle && paso === 3 && completa ? "pulso-participante" : ""}>
          {paso < 3 ? "Siguiente sección" : puzzle ? "Descubrir coincidencias" : "Guardar pistas"}
        </Boton>
      </div>
      {!completas[paso] && <p className="ayuda-participante" id="ayuda-pista-falta">{textoFalta} Completa esta sección para continuar.</p>}
    </form>
  </div>;
}

/** Conserva el borrador de cada participante hasta el siguiente guardado confirmado. */
export function FormularioPistas({ iniciales, version, claveBorrador }: { iniciales?: Pistas; version: string | null; claveBorrador: string }) {
  const router = useRouter();
  const reducido = usarReducirMovimiento();
  const { reproducir } = usarSonido();
  const { lanzarConfeti } = usarConfeti();
  const sacudir = useAnimationControls();
  const [valores, cambiarValores] = useState<BorradorPistas>(() => iniciales
    ? { ...iniciales.fisico, ...iniciales.personalidad, ...iniciales.gustos, datoCurioso: iniciales.datoCurioso } : {});
  const [guardando, cambiarGuardado] = useState(false);
  const [guardadas, cambiarExito] = useState(false);
  const [error, cambiarError] = useState("");
  const bloqueo = useRef(false);
  const montado = useRef(false);

  useEffect(() => {
    montado.current = true;
    try {
      const borrador = JSON.parse(localStorage.getItem(claveBorrador) ?? "null");
      if (borrador?.version === version) {
        const limpio = limpiarBorrador(borrador.valores);
        if (limpio && Object.keys(limpio).length) cambiarValores(limpio);
      }
    } catch { /* El editor sigue disponible si el navegador bloquea el almacenamiento. */ }
    return () => { montado.current = false; };
  }, [claveBorrador, version]);

  function editar(siguiente: BorradorPistas) {
    cambiarValores(siguiente);
    cambiarError("");
    try { localStorage.setItem(claveBorrador, JSON.stringify({ version, valores: siguiente })); } catch { /* Solo afecta al borrador local. */ }
  }

  async function guardar(pistas: Pistas) {
    if (bloqueo.current) return;
    bloqueo.current = true;
    cambiarGuardado(true);
    cambiarError("");
    try {
      await pedir("/api/pistas", conJSON("POST", pistas));
      if (!montado.current) return;
      try { localStorage.removeItem(claveBorrador); } catch { /* El guardado remoto ya terminó. */ }
      cambiarExito(true);
      reproducir("acierto");
      void lanzarConfeti({ particleCount: 50 });
    } catch (fallo) {
      if (!montado.current) return;
      const mensaje = mensajeParticipante(fallo, router.replace);
      cambiarError(mensaje);
      toast.error(mensaje);
      reproducir("error");
      if (!reducido) void sacudir.start({ x: [0, -5, 5, 0], transition: { duration: .27 } });
    } finally {
      cambiarGuardado(false);
      bloqueo.current = false;
    }
  }

  return <motion.section initial={false} animate={reducido ? { opacity: 1 } : { opacity: [.65, 1], x: [12, 0] }} className="escena-participante">
    <Navegacion pasoActual={1} />
    <header className="titulo-participante">
      <h1>Tus pistas</h1>
      <p>Elige lo que mejor te describe. Tus respuestas ayudarán a que alguien de la familia te encuentre.</p>
    </header>
    {guardadas ? <div className="panel-participante estado-participante" role="status" tabIndex={-1} ref={(nodo) => nodo?.focus()}>
      <svg width="68" height="68" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
        <motion.path d="m11 20 6 6 12-12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: reducido ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reducido ? 0 : .42 }} />
      </svg>
      <h2>¡Pistas guardadas!</h2>
      <p>Ya puedes armar el rompecabezas de tu persona secreta.</p>
      <AvanceAutomatico mensaje="Continuando a la adivinanza" alAvanzar={() => router.push("/participar/adivinar")} />
      <Link className="boton boton-dorado" href="/participar/adivinar">Ir a adivinar <ArrowRight size={18} aria-hidden="true" /></Link>
    </div> : <motion.div initial={false} animate={sacudir}>
      <EditorPistas valores={valores} alEditar={editar} alEnviar={(pistas) => void guardar(pistas)} ocupado={guardando} error={error} />
    </motion.div>}
    {!guardando && <Link className="volver-participante" href="/participar/necesidades"><ArrowLeft size={18} aria-hidden="true" /> Volver a necesidades</Link>}
  </motion.section>;
}
