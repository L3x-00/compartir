"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, Pause, Play, Volume1, VolumeX } from "lucide-react";
import { usarSilencio } from "@/hooks/usarSilencio";

/** Música persistente en el layout raíz: sigue sonando al cambiar de pantalla. */
const RUTA = "/sonidos/navidad.mp3";
const CLAVE_VOLUMEN = "cn:volumen-musica";
const VOLUMEN_INICIAL = 16;
const GESTOS = ["pointerdown", "keydown", "touchstart", "input"] as const;

type Estado = "bloqueada" | "sonando" | "pausada" | "sin-audio";

function leerVolumen(): number {
  try {
    const guardado = localStorage.getItem(CLAVE_VOLUMEN);
    if (guardado === null) return VOLUMEN_INICIAL;
    const valor = Number(guardado);
    return Number.isFinite(valor) ? Math.min(100, Math.max(0, Math.round(valor))) : VOLUMEN_INICIAL;
  } catch {
    return VOLUMEN_INICIAL;
  }
}

export function ReproductorGlobal() {
  const elemento = useRef<HTMLAudioElement>(null);
  const sincronizarRef = useRef<() => void>(() => undefined);
  const escuchando = useRef(false);
  const sinAudioRef = useRef(false);
  const pausadaRef = useRef(false);
  const silenciadaRef = useRef(false);
  const [pausada, cambiarPausada] = useState(false);
  const [estado, cambiarEstado] = useState<Estado>("bloqueada");
  const [volumen, cambiarVolumen] = useState(VOLUMEN_INICIAL);
  const [mostrarVolumen, cambiarMostrarVolumen] = useState(false);
  const silenciado = usarSilencio();

  pausadaRef.current = pausada;
  silenciadaRef.current = silenciado;

  const dejarDeEscuchar = useCallback(() => {
    if (!escuchando.current) return;
    escuchando.current = false;
    for (const gesto of GESTOS) window.removeEventListener(gesto, sincronizarRef.current, { capture: true });
  }, []);

  const escucharGestos = useCallback(() => {
    if (escuchando.current) return;
    escuchando.current = true;
    // Los navegadores impiden audio audible sin interacción: se engancha a la primera que ocurra.
    for (const gesto of GESTOS) window.addEventListener(gesto, sincronizarRef.current, { capture: true, passive: true });
  }, []);

  const sincronizar = useCallback(() => {
    const audio = elemento.current;
    if (!audio || sinAudioRef.current) return;
    if (silenciadaRef.current || pausadaRef.current) {
      dejarDeEscuchar();
      audio.pause();
      cambiarEstado("pausada");
      return;
    }
    const reproduccion = audio.play();
    if (!reproduccion) {
      cambiarEstado("sonando");
      dejarDeEscuchar();
      return;
    }
    reproduccion.then(() => {
      cambiarEstado("sonando");
      dejarDeEscuchar();
    }).catch(() => {
      cambiarEstado("bloqueada");
      escucharGestos();
    });
  }, [dejarDeEscuchar, escucharGestos]);

  sincronizarRef.current = sincronizar;

  useEffect(() => {
    const audio = elemento.current;
    if (!audio) return;
    audio.volume = volumen / 100;
    audio.loop = true;
    const fallo = () => { sinAudioRef.current = true; dejarDeEscuchar(); cambiarEstado("sin-audio"); };
    const reintentar = () => { if (!document.hidden) sincronizar(); };
    audio.addEventListener("error", fallo);
    window.addEventListener("pageshow", reintentar);
    window.addEventListener("focus", reintentar);
    document.addEventListener("visibilitychange", reintentar);
    cambiarVolumen(leerVolumen());
    return () => {
      audio.removeEventListener("error", fallo);
      window.removeEventListener("pageshow", reintentar);
      window.removeEventListener("focus", reintentar);
      document.removeEventListener("visibilitychange", reintentar);
      dejarDeEscuchar();
      audio.pause();
    };
  }, [dejarDeEscuchar, sincronizar]);

  useEffect(() => {
    const audio = elemento.current;
    if (audio) audio.volume = volumen / 100;
  }, [volumen]);

  useEffect(() => { sincronizar(); }, [silenciado, pausada, sincronizar]);

  function ajustarVolumen(nuevo: number) {
    cambiarVolumen(nuevo);
    try { localStorage.setItem(CLAVE_VOLUMEN, String(nuevo)); } catch { /* Preferencia solo en esta visita. */ }
  }

  function alternar() {
    if (estado === "bloqueada") { sincronizar(); return; }
    if (estado === "sin-audio" || silenciado) return;
    cambiarPausada((valor) => !valor);
  }

  const audio = <audio ref={elemento} src={RUTA} preload="auto" loop autoPlay playsInline />;
  if (estado === "sin-audio") return audio;

  const etiqueta = silenciado ? "Música silenciada" : estado === "bloqueada" ? "Activar música"
    : pausada ? "Reanudar música" : "Pausar música";
  const Icono = silenciado ? VolumeX : estado === "bloqueada" ? Music2 : pausada ? Play : Pause;

  return <div className="musica-control">
    {audio}
    <div className="musica-botones">
      <button type="button" className="musica-global" onClick={alternar} disabled={silenciado}
        aria-label={etiqueta} title={etiqueta}>
        <Icono size={16} aria-hidden="true" /><span>{etiqueta}</span>
      </button>
      <button type="button" className="musica-volumen" aria-label="Control de volumen"
        aria-expanded={mostrarVolumen} aria-controls="musica-volumen-panel"
        onClick={() => cambiarMostrarVolumen((valor) => !valor)}>
        <Volume1 size={16} aria-hidden="true" />
      </button>
    </div>
    <div id="musica-volumen-panel" className="musica-volumen-panel" hidden={!mostrarVolumen}>
      <label htmlFor="musica-volumen-rango">Volumen de la música <output htmlFor="musica-volumen-rango">{volumen}%</output></label>
      <input id="musica-volumen-rango" type="range" min="0" max="100" step="1" value={volumen}
        onChange={(evento) => ajustarVolumen(Number(evento.target.value))} />
    </div>
  </div>;
}
