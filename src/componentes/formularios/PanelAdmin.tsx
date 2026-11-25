"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useTransition } from "react";
import { ArrowRight, Check, Clock3, Crown, Fingerprint, Gift, PackageCheck, RefreshCw, Search, Settings, Sparkles, Users } from "lucide-react";
import { Boton } from "@/componentes/ui/Boton";
import { ContadorAnimado } from "@/componentes/ui/ContadorAnimado";
import { CuentaRegresiva } from "@/componentes/ui/CuentaRegresiva";
import { AvatarInicial } from "@/componentes/ui/AvatarInicial";
import { AvatarPersona } from "@/componentes/ui/AvatarPersona";
import { Entrada } from "@/componentes/ui/Entrada";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { mostrarFechaEvento, nombreZonaEvento } from "@/lib/fechasEvento";
import type { ParticipantePanel, ResumenAdmin } from "@/tipos/final";
import { CerrarEvento } from "./CerrarEvento";
import { PanelPistasAdmin } from "./PanelPistasAdmin";
import { ReasignarPendientes } from "./ReasignarPendientes";

type Filtro = "Todos" | "Pendientes" | "Completos";
const filtros: Filtro[] = ["Todos", "Pendientes", "Completos"];

function completo(persona: ParticipantePanel) {
  return persona.tieneNecesidades && persona.tienePistas && !!persona.personaSecretaId && persona.tieneRegaloSeleccionado;
}

function normalizar(nombre: string) {
  return nombre.toLocaleLowerCase("es").normalize("NFD").replace(/\p{M}/gu, "").trim();
}

function Estado({ listo, texto }: { listo: boolean; texto: string }) {
  const Icono = listo ? Check : Clock3;
  return <span className={listo ? "admin-estado admin-estado-listo" : "admin-estado admin-estado-pendiente"}>
    <Icono size={15} aria-hidden="true" />{texto}
  </span>;
}

/** Lista y detalle con un solo conjunto de totales, una fila por familiar y estado visible de cada tarea. */
export function PanelAdmin({ resumen }: { resumen: ResumenAdmin | null }) {
  const router = useRouter();
  const ruta = usePathname();
  const reducido = usarReducirMovimiento();
  const [vista, cambiarVista] = useState<"resumen" | "participantes" | "pistas">("resumen");
  const [filtro, cambiarFiltro] = useState<Filtro>("Todos");
  const [busqueda, cambiarBusqueda] = useState("");
  const [consulta, cambiarConsulta] = useState("");
  const [actualizando, actualizar] = useTransition();

  useEffect(() => {
    const reloj = window.setTimeout(() => cambiarConsulta(normalizar(busqueda)), 170);
    return () => window.clearTimeout(reloj);
  }, [busqueda]);

  if (!resumen) return <section className="panel-participante estado-participante">
    <h1>No pudimos cargar el panel</h1>
    <Boton icono={RefreshCw} cargando={actualizando} onClick={() => actualizar(() => router.refresh())}>Reintentar</Boton>
  </section>;

  const { evento, participantes, totalParticipantes, emparejamientosCompletos, regalosSeleccionados } = resumen;
  const nombres = new Map(participantes.map((p) => [p.id, p.nombre] as const));
  const listado = participantes.filter((p) => normalizar(p.nombre).includes(consulta)
    && (filtro === "Todos" || (filtro === "Completos" ? completo(p) : !completo(p))));
  const stats = [
    { etiqueta: "Participantes", valor: totalParticipantes, icono: Users },
    { etiqueta: "Con pistas", valor: totalParticipantes - resumen.participantesSinPistas, icono: Fingerprint },
    { etiqueta: "Con 3 o más necesidades", valor: totalParticipantes - resumen.participantesSinNecesidades, icono: Gift },
    { etiqueta: "Con regalo elegido", valor: regalosSeleccionados, icono: PackageCheck },
  ];
  const faltan = totalParticipantes - emparejamientosCompletos;
  const regalosPendientes = totalParticipantes - regalosSeleccionados;

  return <section className="escena-participante admin-escena">
    <header className="panel-participante admin-cabecera">
      <div className="titulo-participante">
        <h1><Crown aria-hidden="true" /> Panel de administrador</h1>
        <p><strong>{evento.nombre}</strong> <span className="texto-suave">·</span> <time dateTime={evento.fechaLimite}>{mostrarFechaEvento(evento.fechaLimite)}</time> ({nombreZonaEvento})</p>
      </div>
      <div className="admin-cabecera-estado">
        <Estado listo={!evento.cerrado} texto={evento.cerrado ? "Evento cerrado" : "Evento abierto"} />
        {!evento.cerrado && <CuentaRegresiva fecha={evento.fechaLimite} compacta alVencer={() => router.refresh()} />}
      </div>
      <div className="acciones-participante">
        <Link href="/panel/evento" className="boton boton-fantasma"><Settings size={18} aria-hidden="true" /> Configurar evento</Link>
        {evento.cerrado ? <Link href="/participar/revelacion" className="boton boton-dorado"><Sparkles size={18} aria-hidden="true" /> Ver revelación</Link> :
          <CerrarEvento pendientes={{ asignaciones: faltan, regalos: regalosPendientes }} />}
      </div>
    </header>

    <div className="admin-barra">
      <nav className="admin-tabs" aria-label="Secciones del panel">
        <button type="button" aria-pressed={vista === "resumen"} onClick={() => cambiarVista("resumen")}>Resumen</button>
        <Link href="/panel/evento" aria-current={ruta === "/panel/evento" ? "page" : undefined}>Evento</Link>
        <button type="button" aria-pressed={vista === "participantes"} onClick={() => cambiarVista("participantes")}>Participantes</button>
        <button type="button" aria-pressed={vista === "pistas"} onClick={() => cambiarVista("pistas")}>Pistas</button>
      </nav>
      <Boton variante="fantasma" icono={RefreshCw} cargando={actualizando} onClick={() => actualizar(() => router.refresh())}>Actualizar datos</Boton>
    </div>

    <AnimatePresence initial={false}>
      {vista === "resumen" && <motion.dl className="admin-stats" key="stats"
        initial={reducido ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        exit={reducido ? undefined : { opacity: 0 }}>
        {stats.map(({ etiqueta, valor, icono: Icono }, i) => <motion.div key={etiqueta} className="panel-participante admin-stat"
          initial={reducido ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducido ? 0 : .2, delay: reducido ? 0 : i * .055 }}
          whileHover={reducido ? undefined : { y: -3 }}>
          <dt><Icono size={20} aria-hidden="true" />{etiqueta}</dt>
          <dd><ContadorAnimado valor={valor} desdeCero />{i > 0 && <small> / {totalParticipantes}</small>}</dd>
        </motion.div>)}
      </motion.dl>}
    </AnimatePresence>

    <section className="panel-participante admin-tabla-panel" aria-labelledby="titulo-participantes">
      <div className="admin-tabla-cabecera">
        <h2 id="titulo-participantes">Participantes</h2>
        <Entrada variante="texto" etiqueta="Buscar por nombre" type="search" icono={Search}
          value={busqueda} onChange={(e) => cambiarBusqueda(e.target.value)} />
      </div>
      <div className="admin-tabs admin-filtros" role="group" aria-label="Filtrar participantes">
        {filtros.map((valor) => <button key={valor} type="button" aria-pressed={filtro === valor}
          onClick={() => cambiarFiltro(valor)}>{valor}</button>)}
      </div>
      <p className="sr-only" role="status">{listado.length} de {totalParticipantes} participantes visibles.</p>
      {listado.length === 0 ? <div className="admin-vacio">
        <p>{totalParticipantes ? "No hay participantes con esos filtros." : "Aún no hay participantes en este evento."}</p>
        {totalParticipantes > 0 && <Boton variante="fantasma" onClick={() => { cambiarBusqueda(""); cambiarConsulta(""); cambiarFiltro("Todos"); }}>Restablecer filtros</Boton>}
      </div> :
        <table className="admin-tabla" role="table">
          <caption className="sr-only">Estado del intercambio por participante</caption>
          <thead role="rowgroup"><tr role="row">
            {["Nombre", "Necesidades", "Pistas", "Persona secreta", "Regalo elegido", "Recibe de"].map((t) => <th key={t} role="columnheader" scope="col">{t}</th>)}
          </tr></thead>
          <tbody role="rowgroup"><AnimatePresence initial={false}>
            {listado.map((p, i) => <motion.tr key={p.id} role="row" layout={reducido ? false : "position"}
              initial={reducido ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              exit={reducido ? undefined : { opacity: 0 }} transition={{ duration: reducido ? 0 : .19, delay: reducido ? 0 : Math.min(i, 7) * .023 }}>
              <th scope="row" role="rowheader"><span className="admin-nombre"><AvatarPersona nombre={p.nombre} fotoUrl={p.fotoUrl} /><span>{p.nombre}
                {p.esAdmin && <small>Admin</small>}</span></span></th>
              <td role="cell"><span className="admin-etiqueta-movil" aria-hidden="true">Necesidades</span><Estado listo={p.tieneNecesidades} texto={String(p.cantidadNecesidades) + (p.tieneNecesidades ? " · Completo" : " · Pendiente")} /></td>
              <td role="cell"><span className="admin-etiqueta-movil" aria-hidden="true">Pistas</span><Estado listo={p.tienePistas} texto={p.tienePistas ? "Completas" : "Pendientes"} /></td>
              <td role="cell"><span className="admin-etiqueta-movil" aria-hidden="true">Persona secreta</span>{(p.personaSecretaId && nombres.get(p.personaSecretaId)) || <span className="texto-suave">Sin asignar</span>}</td>
              <td role="cell"><span className="admin-etiqueta-movil" aria-hidden="true">Regalo elegido</span>{p.nombreRegalo ?? <span className="texto-suave">Sin elegir</span>}</td>
              <td role="cell"><span className="admin-etiqueta-movil" aria-hidden="true">Recibe de</span>{(p.esPersonaSecretaDe && nombres.get(p.esPersonaSecretaDe)) || <span className="texto-suave">Sin asignar</span>}</td>
            </motion.tr>)}
          </AnimatePresence></tbody>
        </table>}
    </section>

    {vista === "pistas" && <PanelPistasAdmin alGuardar={() => actualizar(() => router.refresh())} />}

    {vista === "resumen" && <section className="panel-participante admin-emparejamientos" aria-labelledby="admin-parejas">
      <div className="admin-tabla-cabecera"><h2 id="admin-parejas">Emparejamientos</h2><strong>{emparejamientosCompletos} de {totalParticipantes} emparejados</strong></div>
      {(faltan > 0 || regalosPendientes > 0) && <p className="admin-aviso"><Clock3 size={18} aria-hidden="true" />
        {faltan} sin asignación · {regalosPendientes} sin regalo elegido</p>}
      <ReasignarPendientes participantes={participantes} alAsignar={() => actualizar(() => router.refresh())} />
      {emparejamientosCompletos === 0 ? <p className="admin-vacio">Aún no hay parejas confirmadas.</p> :
        <ul className="admin-lista-parejas">
          {participantes.filter((p) => p.personaSecretaId).map((p) => {
            const secreta = nombres.get(p.personaSecretaId ?? "") ?? "Sin asignar";
            return <li key={p.id}><span><AvatarPersona nombre={p.nombre} fotoUrl={p.fotoUrl} />{p.nombre}</span>
              <ArrowRight size={17} aria-label="regala a" /><span><AvatarInicial nombre={secreta} />{secreta}</span></li>;
          })}
        </ul>}
    </section>}
  </section>;
}
