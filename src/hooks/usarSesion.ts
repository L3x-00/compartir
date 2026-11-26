"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { useRouter } from "next/navigation";
import type { SesionParticipante } from "@/lib/auth";
import type { ArchivosSonido } from "@/lib/sonidos";
import { usarReducirMovimiento } from "./usarReducirMovimiento";

export type EventoVista = { id: string; nombre: string; fechaLimite: string; cerrado: boolean };
export type SesionVista = SesionParticipante & { nombre: string; evento: EventoVista; tieneRegaloSeleccionado: boolean };
type ContextoSesion = {
  sesion: SesionVista | null; cargando: boolean;
  refrescar: () => Promise<SesionVista | null>; cerrar: () => Promise<void>;
  archivosSonido: ArchivosSonido;
};
const Contexto = createContext<ContextoSesion | null>(null);
const sinAudio: ArchivosSonido = {};

/** Una sola consulta inicial de sesión para todas las pantallas. */
export function ProveedorSesion({ children, archivosSonido = sinAudio }: { children: ReactNode; archivosSonido?: ArchivosSonido }) {
  const [sesion, cambiarSesion] = useState<SesionVista | null>(null);
  const [cargando, cambiarCarga] = useState(true);
  const controlador = useRef<AbortController | null>(null);
  const router = useRouter();
  const reducido = usarReducirMovimiento();
  const refrescar = useCallback(async () => {
    controlador.current?.abort();
    const actual = new AbortController(); controlador.current = actual;
    cambiarCarga(true);
    try {
      const respuesta = await fetch("/api/auth/sesion", { cache: "no-store", signal: actual.signal });
      if (!respuesta.ok) throw new Error("No se pudo consultar la sesión.");
      const datos = await respuesta.json() as { ok: boolean; datos: Omit<SesionVista, "eventoId"> | null };
      const vista = datos.datos ? { ...datos.datos, eventoId: datos.datos.evento.id } : null;
      if (!actual.signal.aborted) cambiarSesion(vista);
      return vista;
    } catch {
      if (!actual.signal.aborted) cambiarSesion(null);
      return null;
    } finally {
      // Si otra petición aborta esta, su propio finally deja el loader en false.
      cambiarCarga(false);
    }
  }, []);
  useEffect(() => { void refrescar(); return () => controlador.current?.abort(); }, [refrescar]);
  const cerrar = useCallback(async () => {
    const respuesta = await fetch("/api/auth/salir", { method: "POST" });
    if (!respuesta.ok) throw new Error("No pudimos cerrar la sesión. Intenta otra vez.");
    try {
      const conservar = new Set(["cn:silencio", "cn:volumen-musica"]);
      for (const clave of Object.keys(localStorage)) {
        if (clave.startsWith("cn:") && !conservar.has(clave)) localStorage.removeItem(clave);
      }
    } catch { /* Dispositivo compartido sin almacenamiento: no hay borradores que limpiar. */ }
    cambiarSesion(null); router.replace("/"); router.refresh();
  }, [router]);
  // createElement conserva el archivo .ts y evita un proveedor adicional por pantalla.
  return createElement(MotionConfig, { reducedMotion: reducido ? "always" : "never", transition: { duration: 0.24 } },
    createElement(Contexto.Provider, { value: { sesion, cargando, refrescar, cerrar, archivosSonido } }, children));
}
export function usarSesion(): ContextoSesion {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("usarSesion debe utilizarse dentro de ProveedorSesion.");
  return contexto;
}
