"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Fingerprint, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Boton } from "@/componentes/ui/Boton";
import { AvatarPersona } from "@/componentes/ui/AvatarPersona";
import { Cargador } from "@/componentes/ui/Cargador";
import { PISTAS_FISICO, PISTAS_GUSTOS, PISTAS_PERSONALIDAD } from "@/lib/constantes";
import { esquemaPistas } from "@/lib/validaciones/pistas";
import type { Pistas } from "@/tipos/pistas";
import { conJSON, ErrorParticipante, pedir } from "./peticionesParticipante";

const CLAVE_SELECCION = "cn:admin-pistas-seleccion";

type PersonaPistas = { id: string; nombre: string; fotoUrl: string | null; pistas: Pistas | null };
type Grupo = { titulo: string; campos: { seccion: string; campo: string; etiqueta: string; opciones: readonly (string | boolean)[] }[] };

const grupos: Grupo[] = [
  { titulo: "Rasgos físicos", campos: [
    { seccion: "fisico", campo: "altura", etiqueta: "Altura", opciones: PISTAS_FISICO.altura },
    { seccion: "fisico", campo: "complexion", etiqueta: "Complexión", opciones: PISTAS_FISICO.complexion },
    { seccion: "fisico", campo: "cabello", etiqueta: "Cabello", opciones: PISTAS_FISICO.cabello },
    { seccion: "fisico", campo: "lentes", etiqueta: "Lentes", opciones: ["Sí", "No"] },
    { seccion: "fisico", campo: "barba", etiqueta: "Barba", opciones: PISTAS_FISICO.barba },
  ] },
  { titulo: "Personalidad", campos: [
    { seccion: "personalidad", campo: "social", etiqueta: "Social", opciones: PISTAS_PERSONALIDAD.social },
    { seccion: "personalidad", campo: "humor", etiqueta: "Humor", opciones: PISTAS_PERSONALIDAD.humor },
    { seccion: "personalidad", campo: "puntualidad", etiqueta: "Puntualidad", opciones: PISTAS_PERSONALIDAD.puntualidad },
    { seccion: "personalidad", campo: "energia", etiqueta: "Energía", opciones: PISTAS_PERSONALIDAD.energia },
  ] },
  { titulo: "Gustos", campos: [
    { seccion: "gustos", campo: "comida", etiqueta: "Comida", opciones: PISTAS_GUSTOS.comida },
    { seccion: "gustos", campo: "musica", etiqueta: "Música", opciones: PISTAS_GUSTOS.musica },
    { seccion: "gustos", campo: "hobby", etiqueta: "Hobby", opciones: PISTAS_GUSTOS.hobby },
    { seccion: "gustos", campo: "lugar", etiqueta: "Lugar favorito", opciones: PISTAS_GUSTOS.lugar },
  ] },
];

function aValores(pistas: Pistas | null): Record<string, string> {
  if (!pistas) return {};
  const plano = { ...pistas.fisico, ...pistas.personalidad, ...pistas.gustos, datoCurioso: pistas.datoCurioso } as Record<string, string | boolean>;
  return Object.fromEntries(Object.entries(plano).map(([campo, valor]) => [campo, campo === "lentes" ? (valor ? "Sí" : "No") : String(valor)]));
}

function aPistas(valores: Record<string, string>): Pistas | null {
  const resultado = esquemaPistas.safeParse({
    fisico: {
      altura: valores.altura, complexion: valores.complexion, cabello: valores.cabello,
      lentes: valores.lentes === "Sí", barba: valores.barba,
    },
    personalidad: {
      social: valores.social, humor: valores.humor, puntualidad: valores.puntualidad, energia: valores.energia,
    },
    gustos: { comida: valores.comida, musica: valores.musica, hobby: valores.hobby, lugar: valores.lugar },
    datoCurioso: valores.datoCurioso ?? "",
  });
  return resultado.success ? resultado.data : null;
}

/** Consulta y corrige las 14 pistas de cada familiar sin salir del panel. */
export function PanelPistasAdmin({ alGuardar }: { alGuardar?: () => void }) {
  const [personas, cambiarPersonas] = useState<PersonaPistas[] | null>(null);
  const [seleccion, cambiarSeleccion] = useState("");
  const [valores, cambiarValores] = useState<Record<string, string>>({});
  const [cargando, cambiarCarga] = useState(true);
  const [guardando, cambiarGuardando] = useState(false);
  const [guardado, cambiarGuardado] = useState(false);
  const [error, cambiarError] = useState("");

  async function cargar() {
    cambiarCarga(true);
    cambiarError("");
    let guardada: string | null = null;
    try { guardada = localStorage.getItem(CLAVE_SELECCION); } catch { /* Sin preferencia previa. */ }
    try {
      const datos = await pedir<PersonaPistas[]>("/api/admin/pistas");
      cambiarPersonas(datos);
      const inicial = guardada && datos.some((p) => p.id === guardada) ? guardada : datos[0]?.id ?? "";
      cambiarSeleccion(inicial);
      cambiarValores(aValores(datos.find((p) => p.id === inicial)?.pistas ?? null));
    } catch (fallo) {
      cambiarError(fallo instanceof ErrorParticipante ? fallo.message : "No pudimos cargar las pistas.");
    } finally {
      cambiarCarga(false);
    }
  }

  useEffect(() => { void cargar(); }, []);

  const persona = useMemo(() => personas?.find((p) => p.id === seleccion) ?? null, [personas, seleccion]);

  function elegir(id: string) {
    cambiarSeleccion(id);
    try { localStorage.setItem(CLAVE_SELECCION, id); } catch { /* Solo se pierde la preferencia. */ }
    cambiarGuardado(false);
    cambiarError("");
    cambiarValores(aValores(personas?.find((p) => p.id === id)?.pistas ?? null));
  }

  function editar(campo: string, valor: string) {
    cambiarValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    cambiarGuardado(false);
    cambiarError("");
  }

  async function guardar() {
    if (guardando || !persona) return;
    const pistas = aPistas(valores);
    if (!pistas) {
      cambiarError("Completa las 14 pistas con una opción válida antes de guardar.");
      toast.error("Faltan pistas por corregir.");
      return;
    }
    cambiarGuardando(true);
    cambiarError("");
    try {
      await pedir("/api/admin/pistas", conJSON("POST", { participanteId: persona.id, pistas }));
      cambiarPersonas((anteriores) => anteriores?.map((p) => p.id === persona.id ? { ...p, pistas } : p) ?? anteriores);
      cambiarGuardado(true);
      toast.success(`Pistas de ${persona.nombre} actualizadas.`);
      alGuardar?.();
    } catch (fallo) {
      const mensaje = fallo instanceof ErrorParticipante ? fallo.message : "No pudimos guardar la corrección.";
      cambiarError(mensaje);
      toast.error(mensaje);
    } finally {
      cambiarGuardando(false);
    }
  }

  if (cargando) return <section className="panel-participante admin-pistas" role="status"><Cargador etiqueta="Cargando pistas" /></section>;

  return <section className="panel-participante admin-pistas" aria-labelledby="titulo-pistas-admin">
    <div className="admin-tabla-cabecera">
      <div className="titulo-participante">
        <h2 id="titulo-pistas-admin">Corregir pistas</h2>
        <p>Aparecen las 14 características de cada familiar. Puedes rectificarlas y guardarlas.</p>
      </div>
      <Boton variante="fantasma" icono={RefreshCw} cargando={cargando} onClick={() => void cargar()}>Recargar</Boton>
    </div>

    {!personas?.length ? <p className="admin-vacio">Aún no hay participantes en el evento.</p> : <>
      <label className="admin-pistas-seleccion">
        <span>Participante</span>
        <select value={seleccion} onChange={(evento) => elegir(evento.target.value)} disabled={guardando}>
          {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.pistas ? " · Completas" : " · Pendientes"}</option>)}
        </select>
      </label>
      {persona && <div className="admin-pistas-persona">
        <AvatarPersona nombre={persona.nombre} fotoUrl={persona.fotoUrl} grande />
        <div><strong>{persona.nombre}</strong><p>{persona.pistas ? "Pistas guardadas" : "Este participante aún no completó sus pistas."}</p></div>
      </div>}
      <div className="admin-pistas-rejilla">
        {grupos.map((grupo) => <fieldset key={grupo.titulo} className="admin-pistas-grupo" disabled={guardando}>
          <legend>{grupo.titulo}</legend>
          {grupo.campos.map(({ campo, etiqueta, opciones }) => <label key={campo} className="admin-pistas-campo">
            <span>{etiqueta}</span>
            <select value={valores[campo] ?? ""} onChange={(evento) => editar(campo, evento.target.value)}>
              <option value="">Sin definir</option>
              {opciones.map((opcion) => <option key={String(opcion)} value={opcion === true ? "Sí" : opcion === false ? "No" : String(opcion)}>{opcion === true ? "Sí" : opcion === false ? "No" : String(opcion)}</option>)}
            </select>
          </label>)}
        </fieldset>)}
        <fieldset className="admin-pistas-grupo" disabled={guardando}>
          <legend>Dato curioso</legend>
          <label className="admin-pistas-campo admin-pistas-texto">
            <span>Frase que lo describe</span>
            <textarea rows={3} maxLength={200} value={valores.datoCurioso ?? ""} onChange={(evento) => editar("datoCurioso", evento.target.value)} />
          </label>
        </fieldset>
      </div>
      {error && <p className="error-participante" role="alert">{error}</p>}
      <div className="acciones-participante admin-pistas-acciones">
        <Boton variante="dorado" icono={guardado ? Check : Save} cargando={guardando} disabled={!persona} onClick={() => void guardar()}>
          {guardado ? "Corrección guardada" : "Guardar corrección"}
        </Boton>
      </div>
    </>}
  </section>;
}
