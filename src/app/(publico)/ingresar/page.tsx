"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, IdCard, LockKeyhole, UserRound } from "lucide-react";
import { Encabezado } from "@/componentes/layout/Encabezado";
import { PiePagina } from "@/componentes/layout/PiePagina";
import { Boton } from "@/componentes/ui/Boton";
import { Entrada } from "@/componentes/ui/Entrada";
import { SubidorFoto } from "@/componentes/ui/SubidorFoto";
import { Cargador } from "@/componentes/ui/Cargador";
import { Regalo } from "@/componentes/navideno/Regalo";
import { Estrella } from "@/componentes/navideno/Estrella";
import { conJSON, ErrorParticipante, pedir } from "@/componentes/formularios/peticionesParticipante";
import { usarSesion } from "@/hooks/usarSesion";
import { usarSonido } from "@/hooks/usarSonido";
import { usarConfeti } from "@/hooks/usarConfeti";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { MENSAJES } from "@/lib/constantes";
import { usarBorrador } from "@/hooks/usarBorrador";
import "../participar/participante.css";

function destino(admin: boolean, cerrado: boolean, regaloElegido: boolean) {
  if (admin) return "/panel";
  return cerrado || regaloElegido ? "/participar/revelacion" : "/participar/necesidades";
}

export default function PaginaIngreso() {
  const router = useRouter();
  const { sesion, cargando, refrescar } = usarSesion();
  const { reproducir } = usarSonido();
  const { lanzarConfeti } = usarConfeti();
  const reducido = usarReducirMovimiento();
  const controles = useAnimationControls();
  const [admin, cambiarAdmin] = useState(false);
  const [identidad, guardarIdentidad, limpiarIdentidad] = usarBorrador("cn:ingreso-identidad", { nombre: "", dni: "" });
  const nombre = identidad.nombre;
  const dni = identidad.dni;
  const [pin, cambiarPin] = useState("");
  const [foto, cambiarFoto] = useState<File | null>(null);
  const [reingreso, cambiarReingreso] = useState<{ existe: boolean; tieneFoto: boolean; esAdmin: boolean } | null>(null);
  const [errorFoto, cambiarErrorFoto] = useState("");
  const [errorNombre, cambiarErrorNombre] = useState("");
  const [errorPin, cambiarErrorPin] = useState("");
  const [errorDni, cambiarErrorDni] = useState("");
  const [error, cambiarError] = useState("");
  const [enviando, cambiarEnvio] = useState(false);
  const [exito, cambiarExito] = useState(false);
  const [irAPanel, cambiarIrAPanel] = useState(false);
  const entradaNombre = useRef<HTMLInputElement>(null);
  const entradaPin = useRef<HTMLInputElement>(null);
  const entradaDni = useRef<HTMLInputElement>(null);
  const entradaFoto = useRef<HTMLInputElement>(null);
  const peticion = useRef<AbortController | null>(null);

  function cambiarNombre(valor: string) { guardarIdentidad({ ...identidad, nombre: valor }); }
  function cambiarDni(valor: string) { guardarIdentidad({ ...identidad, dni: valor }); }

  useEffect(() => () => peticion.current?.abort(), []);
  useEffect(() => {
    if (sesion && !cargando && !enviando) {
      router.replace(irAPanel ? "/participar/mi-panel" : destino(sesion.esAdmin, sesion.evento.cerrado, sesion.tieneRegaloSeleccionado));
    }
  }, [sesion, cargando, enviando, router, irAPanel]);

  useEffect(() => {
    if (admin || nombre.trim().length < 2) { cambiarReingreso(null); return; }
    const control = new AbortController();
    const reloj = window.setTimeout(() => {
      void fetch(`/api/participantes/existe?nombre=${encodeURIComponent(nombre.trim())}`, { signal: control.signal })
        .then((respuesta) => respuesta.ok ? respuesta.json() : null)
        .then((datos: { ok?: boolean; datos?: { existe: boolean; tieneFoto: boolean; esAdmin: boolean } } | null) => {
          if (datos?.ok && datos.datos) cambiarReingreso(datos.datos);
        })
        .catch(() => undefined);
    }, 250);
    return () => { window.clearTimeout(reloj); control.abort(); };
  }, [nombre, admin]);

  function alternarModo() {
    cambiarAdmin(!admin);
    cambiarPin("");
    cambiarDni("");
    cambiarFoto(null);
    cambiarReingreso(null);
    cambiarIrAPanel(false);
    cambiarErrorFoto("");
    cambiarErrorNombre("");
    cambiarErrorPin("");
    cambiarErrorDni("");
    cambiarError("");
    reproducir("click");
    entradaNombre.current?.focus();
  }

  async function ingresar(formulario: FormEvent<HTMLFormElement>) {
    formulario.preventDefault();
    if (peticion.current) return;
    cambiarError("");
    cambiarErrorNombre("");
    cambiarErrorPin("");
    cambiarErrorDni("");
    cambiarErrorFoto("");
    const limpio = nombre.trim();
    if (limpio.length < 2 || limpio.length > 50) {
      cambiarErrorNombre("Escribe un nombre de 2 a 50 caracteres.");
      entradaNombre.current?.focus();
      reproducir("error");
      return;
    }
    if (admin && !/^\d{4}$/.test(pin)) {
      cambiarErrorPin("Escribe los cuatro números del PIN.");
      entradaPin.current?.focus();
      reproducir("error");
      return;
    }
    if (!admin && !/^\d{8}$/.test(dni)) {
      cambiarErrorDni("Escribe tu DNI de 8 números.");
      entradaDni.current?.focus();
      reproducir("error");
      return;
    }
    const fotoOpcional = !!reingreso?.existe && reingreso.tieneFoto && !reingreso.esAdmin;
    if (!admin && !foto && !fotoOpcional) {
      cambiarErrorFoto("Agrega una foto tuya para registrar tu nombre.");
      entradaFoto.current?.focus();
      reproducir("error");
      return;
    }
    const solicitud = new AbortController();
    peticion.current = solicitud;
    cambiarEnvio(true);
    reproducir("click");
    try {
      let opciones: RequestInit;
      if (admin) {
        opciones = conJSON("POST", { nombre: limpio, pin });
      } else {
        const cuerpo = new FormData();
        cuerpo.append("nombre", limpio);
        cuerpo.append("dni", dni);
        if (foto) cuerpo.append("foto", foto);
        opciones = { method: "POST", body: cuerpo };
      }
      const datos = await pedir<{ cerrado?: boolean; tieneRegaloSeleccionado?: boolean; esReingreso?: boolean }>(
        admin ? "/api/auth/ingresar" : "/api/participantes",
        { ...opciones, signal: solicitud.signal },
      );
      cambiarExito(true);
      cambiarEnvio(false);
      limpiarIdentidad();
      reproducir("acierto");
      void lanzarConfeti({ particleCount: 30 });
      if (!admin && datos.esReingreso) cambiarIrAPanel(true);
      await refrescar();
      if (!solicitud.signal.aborted) {
        router.replace(!admin && datos.esReingreso ? "/participar/mi-panel" : destino(admin, !!datos.cerrado, !!datos.tieneRegaloSeleccionado));
      }
    } catch (fallo) {
      if (solicitud.signal.aborted) return;
      if (admin && fallo instanceof ErrorParticipante && fallo.estado === 401) {
        cambiarErrorPin("Revisa el nombre del administrador y su PIN.");
      } else if (!admin && fallo instanceof ErrorParticipante && fallo.estado === 401) {
        cambiarErrorDni(fallo.message);
        entradaDni.current?.focus();
        entradaDni.current?.select();
      } else if (!admin && fallo instanceof ErrorParticipante && fallo.estado === 403 && fallo.message === MENSAJES.EVENTO_CERRADO) {
        cambiarError("La elección ya cerró. Si ya eras participante, ingresa con tu DNI para ver tu panel.");
      } else {
        cambiarError(fallo instanceof ErrorParticipante ? fallo.message : "No pudimos ingresar. Intenta otra vez.");
      }
      reproducir("error");
      if (!reducido) void controles.start({ x: [0, -7, 7, -4, 0], transition: { duration: .27 } });
      peticion.current = null;
      cambiarEnvio(false);
    }
  }

  useEffect(() => {
    if (errorPin && !enviando) { entradaPin.current?.focus(); entradaPin.current?.select(); }
  }, [errorPin, enviando]);
  useEffect(() => {
    if (errorDni && !enviando) { entradaDni.current?.focus(); entradaDni.current?.select(); }
  }, [errorDni, enviando]);

  const fotoOpcional = !admin && !!reingreso?.existe && reingreso.tieneFoto && !reingreso.esAdmin;
  return <><Encabezado /><main id="contenido" className="pagina-ingreso"><div className="contenedor ingreso-rejilla">
    <div className="ingreso-ambiente">
      <p className="display">Aquí empieza<br /><span className="texto-dorado">tu secreto.</span></p>
      <p>Comparte tus deseos y prepara una sorpresa para alguien de la familia.</p>
      <div className="escena-regalo"><div className="orbita" /><Regalo /><Estrella className="estrella-dos" tamano={20} /><Estrella className="estrella-cuatro" tamano={13} demora={2} /></div>
    </div>
    <motion.section className="ingreso-tarjeta" initial={false} animate={controles} aria-labelledby="titulo-ingreso">
      <h1 id="titulo-ingreso">{admin ? "Acceso del administrador" : "¿Cómo te llamas?"}</h1>
      <p>{admin ? "Escribe tu nombre y PIN para abrir el panel." : fotoOpcional
        ? "Tu nombre ya está registrado y tienes una foto guardada. Ingresa con tu DNI para abrir tu panel del participante."
        : "Escribe tu nombre, tu DNI de 8 números y agrega una foto tuya. El DNI será tu clave para volver a entrar."}</p>
      {!enviando && (sesion || exito) ? <div className="estado-ingreso" role="status">
        <Cargador tamano="lg" etiqueta="Preparando tu ingreso" />
        {exito && <Link className="boton boton-dorado" href={irAPanel ? "/participar/mi-panel" : admin ? "/panel" : "/participar/necesidades"}>
          Continuar <ArrowRight size={18} aria-hidden="true" />
        </Link>}
      </div> :
        <form className="ingreso-formulario" onSubmit={(formulario) => void ingresar(formulario)} noValidate>
          <Entrada ref={entradaNombre} etiqueta={admin ? "Nombre del administrador" : "Tu nombre completo"} name="nombre"
            autoComplete={admin ? "username" : "name"} maxLength={50} icono={UserRound} value={nombre} disabled={enviando}
            onChange={(e) => { cambiarNombre(e.target.value); cambiarErrorNombre(""); cambiarError(""); }} error={errorNombre} required />
          {admin && <Entrada ref={entradaPin} etiqueta="PIN del administrador" name="pin" variante="pin" inputMode="numeric"
            autoComplete="current-password" maxLength={4} value={pin} disabled={enviando}
            onChange={(e) => { cambiarPin(e.target.value.replace(/\D/g, "")); cambiarErrorPin(""); cambiarError(""); }} error={errorPin} required />}
          {!admin && <Entrada ref={entradaDni} etiqueta="Tu DNI" name="dni" icono={IdCard} inputMode="numeric"
            autoComplete="off" maxLength={8} value={dni} disabled={enviando}
            ayuda="Ocho números de tu documento. Te servirá para volver a entrar y editar tus datos."
            onChange={(e) => { cambiarDni(e.target.value.replace(/\D/g, "")); cambiarErrorDni(""); cambiarError(""); }} error={errorDni} required />}
          {!admin && <div className="ingreso-foto">
            <SubidorFoto ref={entradaFoto} archivo={foto} requerida={!fotoOpcional} deshabilitado={enviando}
              alElegir={(archivo) => { cambiarFoto(archivo); cambiarErrorFoto(""); reproducir("click"); }}
              alQuitar={() => { cambiarFoto(null); cambiarErrorFoto(""); }} />
            {errorFoto && <p className="campo-error" role="alert">{errorFoto}</p>}
          </div>}
          {error && <p className="campo-error" role="alert">{error}</p>}
          <Boton type="submit" variante="dorado" icono={exito ? Check : ArrowRight} cargando={enviando && !exito} disabled={exito}>
            {exito ? "¡Ya estás dentro!" : admin ? "Abrir panel" : reingreso?.existe ? "Abrir mi panel" : "Entrar al juego"}
          </Boton>
        </form>}
      <div className="ingreso-volver ingreso-enlaces">
        <Link href="/"><ArrowLeft size={16} aria-hidden="true" /> Volver al inicio</Link>
        <button type="button" disabled={enviando} onClick={alternarModo}>
          {admin ? <UserRound size={16} aria-hidden="true" /> : <LockKeyhole size={16} aria-hidden="true" />}
          {admin ? "Volver al registro" : "Soy administrador"}
        </button>
      </div>
    </motion.section>
  </div></main><PiePagina /></>;
}
