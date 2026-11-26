"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useAnimationControls } from "framer-motion";
import { useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarClock, ChevronRight, Lock, Save, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AvanceAutomatico } from "@/componentes/ui/AvanceAutomatico";
import { Boton } from "@/componentes/ui/Boton";
import { CuentaRegresiva } from "@/componentes/ui/CuentaRegresiva";
import { Entrada } from "@/componentes/ui/Entrada";
import type { EventoVista } from "@/hooks/usarSesion";
import { usarBorrador } from "@/hooks/usarBorrador";
import { usarConfeti } from "@/hooks/usarConfeti";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { usarSonido } from "@/hooks/usarSonido";
import { aFechaISO, aFechaLocal, mostrarFechaEvento, nombreZonaEvento } from "@/lib/fechasEvento";
import { CerrarEvento } from "./CerrarEvento";
import { conJSON, ErrorParticipante, mensajeParticipante, pedir } from "./peticionesParticipante";

const entrada = { opacity: .65, y: 7 };
const visible = { opacity: 1, y: 0 };

export function FormularioEvento({ evento }: { evento: EventoVista }) {
  const router = useRouter();
  const reducido = usarReducirMovimiento();
  const { lanzarConfeti } = usarConfeti();
  const { reproducir } = usarSonido();
  const sacudir = useAnimationControls();
  const [config, guardarConfig, limpiarConfig] = usarBorrador(
    `cn:evento-config:${evento.id}`,
    { nombre: evento.nombre, fecha: aFechaLocal(evento.fechaLimite) },
    `${evento.nombre}|${evento.fechaLimite}`,
  );
  const nombre = config.nombre;
  const fecha = config.fecha;
  function cambiarNombre(valor: string) { guardarConfig({ ...config, nombre: valor }); }
  function cambiarFecha(valor: string) { guardarConfig({ ...config, fecha: valor }); }
  const [guardando, cambiarGuardando] = useState(false);
  const [guardado, cambiarGuardado] = useState(false);
  const [error, cambiarError] = useState("");
  const [errorNombre, cambiarErrorNombre] = useState("");
  const [errorFecha, cambiarErrorFecha] = useState("");
  const bloqueo = useRef(false);
  const nombreInput = useRef<HTMLInputElement>(null);
  const fechaInput = useRef<HTMLInputElement>(null);
  const iso = aFechaISO(fecha);
  const nuevaFecha = fecha !== aFechaLocal(evento.fechaLimite);
  const cambios = nombre.trim() !== evento.nombre || nuevaFecha;

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cambios || bloqueo.current || guardado || evento.cerrado) return;
    cambiarError("");
    cambiarErrorNombre("");
    cambiarErrorFecha("");
    const limpio = nombre.trim();
    if (limpio.length < 2 || limpio.length > 100) {
      cambiarErrorNombre("Escribe un nombre de 2 a 100 caracteres.");
      nombreInput.current?.focus();
      return;
    }
    if (nuevaFecha && (!iso || Date.parse(iso) <= Date.now())) {
      cambiarErrorFecha("Selecciona una fecha y hora futura.");
      fechaInput.current?.focus();
      return;
    }
    bloqueo.current = true;
    cambiarGuardando(true);
    try {
      await pedir<EventoVista>("/api/admin/evento", conJSON("PUT", {
        ...(limpio === evento.nombre ? {} : { nombre: limpio }), ...(nuevaFecha ? { fechaLimite: iso } : {}),
      }));
      cambiarGuardado(true);
      limpiarConfig();
      toast.success("Cambios guardados.");
      reproducir("acierto");
      void lanzarConfeti({ particleCount: 27 });
      router.prefetch("/panel");
    } catch (fallo) {
      if (fallo instanceof ErrorParticipante && fallo.estado === 403) router.refresh();
      const mensaje = mensajeParticipante(fallo, router.replace);
      cambiarError(mensaje);
      reproducir("error");
      if (!reducido) void sacudir.start({ x: [0, -5, 5, 0], transition: { duration: .22 } });
    } finally {
      bloqueo.current = false;
      cambiarGuardando(false);
    }
  }

  const preview = nuevaFecha ? iso : evento.fechaLimite;
  return <section className="escena-participante admin-evento">
    <motion.nav aria-label="Ruta" className="admin-migas" initial={reducido ? false : entrada} animate={visible}>
      <Link href="/panel">Panel</Link><ChevronRight size={17} aria-hidden="true" /><span aria-current="page">Configurar evento</span>
    </motion.nav>
    <header className="titulo-participante">
      <h1><Settings size={28} aria-hidden="true" /> Configurar evento</h1>
      <p>Ajusta el nombre y la fecha límite para elegir regalos.</p>
    </header>

    <div className="admin-ajustes">
      <div className="panel-participante">
        {evento.cerrado && <p className="admin-aviso"><Lock size={18} aria-hidden="true" /> El evento está cerrado. La configuración es de solo lectura.</p>}
        <form className="admin-formulario" noValidate onSubmit={(e) => void guardar(e)}>
          <motion.div initial={reducido ? false : entrada} animate={visible}>
            <Entrada ref={nombreInput} etiqueta="Nombre del evento" maxLength={100} required value={nombre} error={errorNombre}
              disabled={evento.cerrado || guardando || guardado} onChange={(e) => { cambiarNombre(e.target.value); cambiarErrorNombre(""); cambiarError(""); }} />
          </motion.div>
          <motion.div initial={reducido ? false : entrada} animate={visible} transition={{ delay: reducido ? 0 : .07 }}>
            <label htmlFor="fecha-evento" className="etiqueta-participante">Fecha y hora límite</label>
            <input className="admin-fecha" id="fecha-evento" ref={fechaInput} type="datetime-local" value={fecha}
              aria-invalid={!!errorFecha} aria-describedby="ayuda-fecha-evento" required disabled={evento.cerrado || guardando || guardado}
              onChange={(e) => { cambiarFecha(e.target.value); cambiarErrorFecha(""); cambiarError(""); }} />
            <p className={errorFecha ? "error-participante" : "ayuda-participante"} id="ayuda-fecha-evento" role={errorFecha ? "alert" : undefined}>
              {errorFecha || "Usa la hora de Lima, Perú."}
            </p>
          </motion.div>
          {error && <p className="error-participante" role="alert">{error}</p>}
          {guardado && <p className="admin-aviso" role="status">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <motion.path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2"
                initial={{ pathLength: reducido ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reducido ? 0 : .28 }} />
            </svg> Cambios guardados
          </p>}
          {guardado && <AvanceAutomatico mensaje="Continuando al panel" alAvanzar={() => router.replace("/panel")} />}
          <motion.div className="acciones-participante" animate={sacudir}>
            <Link className="boton boton-fantasma" href="/panel"><ArrowLeft size={18} aria-hidden="true" /> Volver al panel</Link>
            {!evento.cerrado && !guardado && <Boton type="submit" variante="dorado" icono={Save} disabled={!cambios} cargando={guardando}>Guardar cambios</Boton>}
          </motion.div>
        </form>
      </div>
      <aside className="panel-participante admin-preview" aria-labelledby="titulo-vista-previa">
        <CalendarClock size={28} aria-hidden="true" />
        <h2 id="titulo-vista-previa">Vista previa</h2>
        {preview ? <p><time dateTime={preview}>{mostrarFechaEvento(preview)}</time> ({nombreZonaEvento})</p> :
          <p>Elige una fecha y hora válidas.</p>}
        {preview && !evento.cerrado && <CuentaRegresiva fecha={preview} compacta />}
        {evento.cerrado && <Link className="boton boton-dorado" href="/participar/revelacion"><Sparkles size={18} aria-hidden="true" /> Ver revelación</Link>}
      </aside>
    </div>

    {!evento.cerrado && <section className="panel-participante admin-peligro" aria-labelledby="admin-peligro">
      <div><h2 id="admin-peligro"><Lock size={20} aria-hidden="true" /> Cierre manual</h2>
        <p>Usa esta opción si quieres revelar los emparejamientos antes de la fecha límite.</p></div>
      <CerrarEvento doble />
    </section>}
  </section>;
}
