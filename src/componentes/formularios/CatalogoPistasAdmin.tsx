"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Boton } from "@/componentes/ui/Boton";
import { Cargador } from "@/componentes/ui/Cargador";
import { CATALOGO_POR_DEFECTO } from "@/lib/constantes";
import type { CatalogoPistas } from "@/tipos/catalogo";
import { conJSON, ErrorParticipante, pedir } from "./peticionesParticipante";

const CAMPOS = [
  { seccion: "fisico", campo: "altura", etiqueta: "Altura" },
  { seccion: "fisico", campo: "complexion", etiqueta: "Complexión" },
  { seccion: "fisico", campo: "cabello", etiqueta: "Cabello" },
  { seccion: "fisico", campo: "barba", etiqueta: "Barba" },
  { seccion: "personalidad", campo: "social", etiqueta: "Social" },
  { seccion: "personalidad", campo: "humor", etiqueta: "Humor" },
  { seccion: "personalidad", campo: "puntualidad", etiqueta: "Puntualidad" },
  { seccion: "personalidad", campo: "energia", etiqueta: "Energía" },
  { seccion: "gustos", campo: "comida", etiqueta: "Comida" },
  { seccion: "gustos", campo: "musica", etiqueta: "Música" },
  { seccion: "gustos", campo: "hobby", etiqueta: "Hobby" },
  { seccion: "gustos", campo: "lugar", etiqueta: "Lugar favorito" },
] as const;

type Seccion = "fisico" | "personalidad" | "gustos";
type Lineas = Record<string, string>;

function aLineas(catalogo: CatalogoPistas): Lineas {
  const lineas: Lineas = {};
  for (const { seccion, campo } of CAMPOS) {
    lineas[`${seccion}.${campo}`] = (catalogo[seccion as Seccion] as unknown as Record<string, string[]>)[campo].join("\n");
  }
  lineas["datoCurioso"] = catalogo.datoCurioso.join("\n");
  return lineas;
}

function aCatalogo(lineas: Lineas): CatalogoPistas {
  const opciones = (clave: string) => (lineas[clave] ?? "").split(/\r?\n/).map((valor) => valor.trim()).filter(Boolean);
  return {
    fisico: { altura: opciones("fisico.altura"), complexion: opciones("fisico.complexion"), cabello: opciones("fisico.cabello"), barba: opciones("fisico.barba") },
    personalidad: { social: opciones("personalidad.social"), humor: opciones("personalidad.humor"), puntualidad: opciones("personalidad.puntualidad"), energia: opciones("personalidad.energia") },
    gustos: { comida: opciones("gustos.comida"), musica: opciones("gustos.musica"), hobby: opciones("gustos.hobby"), lugar: opciones("gustos.lugar") },
    datoCurioso: opciones("datoCurioso"),
  };
}

/** Configura las opciones del formulario de pistas para todas las pantallas. */
export function CatalogoPistasAdmin({ alGuardar }: { alGuardar?: () => void }) {
  const [lineas, cambiarLineas] = useState<Lineas | null>(null);
  const [guardando, cambiarGuardando] = useState(false);
  const [error, cambiarError] = useState("");

  useEffect(() => {
    void pedir<CatalogoPistas>("/api/admin/catalogo")
      .then((catalogo) => cambiarLineas(aLineas(catalogo)))
      .catch((fallo: unknown) => cambiarError(fallo instanceof ErrorParticipante ? fallo.message : "No pudimos cargar el catálogo."));
  }, []);

  async function guardar(catalogo: CatalogoPistas) {
    if (guardando) return;
    cambiarGuardando(true);
    cambiarError("");
    try {
      const guardado = await pedir<CatalogoPistas>("/api/admin/catalogo", conJSON("PUT", catalogo));
      cambiarLineas(aLineas(guardado));
      toast.success("Catálogo de pistas actualizado.");
      alGuardar?.();
    } catch (fallo) {
      cambiarError(fallo instanceof ErrorParticipante ? fallo.message : "No pudimos guardar el catálogo.");
      toast.error("No pudimos guardar el catálogo.");
    } finally {
      cambiarGuardando(false);
    }
  }

  if (!lineas) return <section className="panel-participante admin-pistas" role="status">
    {error ? <><p className="error-participante" role="alert">{error}</p>
      <Boton variante="fantasma" onClick={() => cambiarLineas(aLineas(CATALOGO_POR_DEFECTO))}>Reintentar con valores iniciales</Boton></>
      : <Cargador etiqueta="Cargando catálogo" />}
  </section>;

  return <section className="panel-participante admin-pistas" aria-labelledby="titulo-catalogo-admin">
    <div className="admin-tabla-cabecera">
      <div className="titulo-participante">
        <h2 id="titulo-catalogo-admin">Catálogo de pistas</h2>
        <p>Edita las opciones que ven todos los participantes. Una opción por línea, entre 2 y 20 por campo.</p>
      </div>
    </div>
    <div className="admin-pistas-rejilla">
      <fieldset className="admin-pistas-grupo" disabled={guardando}>
        <legend>Rasgos físicos</legend>
        {CAMPOS.filter(({ seccion }) => seccion === "fisico").map(({ seccion, campo, etiqueta }) => <label key={campo} className="admin-pistas-campo admin-pistas-texto">
          <span>{etiqueta}</span>
          <textarea rows={4} value={lineas[`${seccion}.${campo}`] ?? ""}
            onChange={(evento) => cambiarLineas({ ...lineas, [`${seccion}.${campo}`]: evento.target.value })} />
        </label>)}
      </fieldset>
      <fieldset className="admin-pistas-grupo" disabled={guardando}>
        <legend>Personalidad</legend>
        {CAMPOS.filter(({ seccion }) => seccion === "personalidad").map(({ seccion, campo, etiqueta }) => <label key={campo} className="admin-pistas-campo admin-pistas-texto">
          <span>{etiqueta}</span>
          <textarea rows={4} value={lineas[`${seccion}.${campo}`] ?? ""}
            onChange={(evento) => cambiarLineas({ ...lineas, [`${seccion}.${campo}`]: evento.target.value })} />
        </label>)}
      </fieldset>
      <fieldset className="admin-pistas-grupo" disabled={guardando}>
        <legend>Gustos</legend>
        {CAMPOS.filter(({ seccion }) => seccion === "gustos").map(({ seccion, campo, etiqueta }) => <label key={campo} className="admin-pistas-campo admin-pistas-texto">
          <span>{etiqueta}</span>
          <textarea rows={4} value={lineas[`${seccion}.${campo}`] ?? ""}
            onChange={(evento) => cambiarLineas({ ...lineas, [`${seccion}.${campo}`]: evento.target.value })} />
        </label>)}
      </fieldset>
      <fieldset className="admin-pistas-grupo" disabled={guardando}>
        <legend>Datos curiosos sugeridos</legend>
        <label className="admin-pistas-campo admin-pistas-texto">
          <span>Opciones del dato curioso</span>
          <textarea rows={10} value={lineas.datoCurioso ?? ""} onChange={(evento) => cambiarLineas({ ...lineas, datoCurioso: evento.target.value })} />
        </label>
      </fieldset>
    </div>
    {error && <p className="error-participante" role="alert">{error}</p>}
    <div className="acciones-participante admin-pistas-acciones">
      <Boton variante="fantasma" icono={RotateCcw} disabled={guardando} onClick={() => void guardar(CATALOGO_POR_DEFECTO)}>Restablecer</Boton>
      <Boton variante="dorado" icono={Save} cargando={guardando} onClick={() => void guardar(aCatalogo(lineas))}>Guardar catálogo</Boton>
    </div>
  </section>;
}
