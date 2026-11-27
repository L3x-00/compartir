import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Fingerprint, Gift, IdCard, PackageCheck, Puzzle, Sparkles, UserRound } from "lucide-react";
import { GestionarRegalo } from "@/componentes/formularios/GestionarRegalo";
import { AvatarPersona } from "@/componentes/ui/AvatarPersona";
import { prisma } from "@/lib/prisma";
import { leerPistasCompletas } from "@/lib/validaciones/adivinanza";
import { leerCatalogo } from "@/lib/catalogo";
import { LIMITES } from "@/lib/constantes";
import { sesionParticipante } from "../datos";

export const metadata: Metadata = { title: "Mi panel" };

/** Resumen personal con todo lo que el participante subió y puede corregir. */
export default async function PaginaMiPanel({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const { motivo } = await searchParams;
  const sesion = await sesionParticipante(true);
  const persona = await prisma.participante.findUnique({
    where: { id: sesion.participanteId },
    select: {
      nombre: true, fotoUrl: true, pin: true,
      necesidades: { orderBy: { creadoEn: "asc" }, select: { nombre: true } },
      pistas: { select: { datos: true } },
      personaSecretaId: true,
      personaSecreta: { select: { nombre: true, fotoUrl: true } },
      regaloSeleccionado: { select: { necesidad: { select: { id: true, nombre: true } } } },
      esPersonaSecretaDe: { select: { nombre: true, fotoUrl: true, regaloSeleccionado: { select: { necesidad: { select: { nombre: true } } } } } },
    },
  });
  if (!persona) redirect("/ingresar");

  const necesidadesDestino = persona.personaSecretaId ? await prisma.necesidad.findMany({
    where: { participanteId: persona.personaSecretaId }, orderBy: { creadoEn: "asc" }, select: { id: true, nombre: true },
  }) : [];
  const catalogo = await leerCatalogo();
  const pistas = persona.pistas ? leerPistasCompletas(persona.pistas.datos, catalogo) : null;
  const rasgos = pistas ? [
    ["Altura", pistas.fisico.altura], ["Cabello", pistas.fisico.cabello],
    ["Social", pistas.personalidad.social], ["Humor", pistas.personalidad.humor],
    ["Comida", pistas.gustos.comida], ["Música", pistas.gustos.musica],
    ["Dato curioso", pistas.datoCurioso],
  ] : [];
  const regalo = persona.regaloSeleccionado?.necesidad ?? null;
  const destinatario = sesion.tieneRegaloSeleccionado ? persona.personaSecreta?.nombre ?? null : null;
  const recibe = sesion.evento.cerrado ? persona.esPersonaSecretaDe : null;

  return <section className="escena-participante">
    {motivo && <p className="error-participante" role="alert">{motivo}</p>}
    <header className="titulo-participante">
      <h1>Mi panel</h1>
      <p>Todos tus datos en un solo lugar. Puedes corregirlos antes de que cierre la elección de regalos.</p>
    </header>

    <div className="mi-panel-rejilla">
      <article className="panel-participante mi-panel-tarjeta">
        <h2><UserRound size={20} aria-hidden="true" /> Mi perfil</h2>
        <div className="mi-panel-persona"><AvatarPersona nombre={persona.nombre} fotoUrl={persona.fotoUrl} grande />
          <div><strong>{persona.nombre}</strong><p>Foto {persona.fotoUrl ? "guardada" : "pendiente"} · DNI {persona.pin ? "configurado" : "pendiente"}</p></div>
        </div>
        <p className="ayuda-participante">Tu DNI es tu clave para volver a entrar. No se muestra por seguridad.</p>
      </article>

      <article className="panel-participante mi-panel-tarjeta">
        <h2><Gift size={20} aria-hidden="true" /> Mis necesidades</h2>
        <p><strong>{persona.necesidades.length}</strong> publicadas · mínimo {LIMITES.MIN_NECESIDADES}</p>
        {persona.necesidades.length ? <ul className="mi-panel-lista">{persona.necesidades.map((n, i) => <li key={`${n.nombre}-${i}`}>{n.nombre}</li>)}</ul>
          : <p className="texto-suave">Aún no publicaste ninguna.</p>}
        <Link className="boton boton-fantasma" href="/participar/necesidades">Editar necesidades <ArrowRight size={16} aria-hidden="true" /></Link>
      </article>

      <article className="panel-participante mi-panel-tarjeta">
        <h2><Fingerprint size={20} aria-hidden="true" /> Mis características</h2>
        <p>{pistas ? "14 de 14 pistas guardadas" : "Pistas pendientes"}</p>
        {rasgos.length > 0 && <ul className="mi-panel-lista">{rasgos.map(([etiqueta, valor]) => <li key={etiqueta}><strong>{etiqueta}:</strong> {valor}</li>)}</ul>}
        <Link className="boton boton-fantasma" href="/participar/pistas">Editar pistas <ArrowRight size={16} aria-hidden="true" /></Link>
      </article>

      <article className="panel-participante mi-panel-tarjeta">
        <h2><Puzzle size={20} aria-hidden="true" /> Mi persona secreta</h2>
        {destinatario && persona.personaSecreta ? <div className="mi-panel-persona">
            <AvatarPersona nombre={persona.personaSecreta.nombre} fotoUrl={persona.personaSecreta.fotoUrl} />
            <strong>{destinatario}</strong>
          </div> : <p>Aún no la conoces: termina de adivinar y elige tu regalo.</p>}
        {!destinatario && <Link className="boton boton-fantasma" href="/participar/adivinar">Ir a adivinar <ArrowRight size={16} aria-hidden="true" /></Link>}
      </article>

      <article className="panel-participante mi-panel-tarjeta">
        <h2><PackageCheck size={20} aria-hidden="true" /> Mi regalo elegido</h2>
        <p>{regalo ? <>Le regalas <strong>{regalo.nombre}</strong> a {destinatario ?? "tu persona secreta"}.</> : "Aún no elegiste qué regalar."}</p>
        {regalo ? <GestionarRegalo necesidades={necesidadesDestino} regaloActual={regalo} puedeEditar={!sesion.evento.cerrado} />
          : <Link className="boton boton-fantasma" href="/participar/regalar">Elegir regalo <ArrowRight size={16} aria-hidden="true" /></Link>}
      </article>

      <article className="panel-participante mi-panel-tarjeta">
        <h2><IdCard size={20} aria-hidden="true" /> Acceso</h2>
        <p>{persona.pin ? <><Check size={16} aria-hidden="true" /> DNI configurado. Puedes volver cuando quieras.</> : "Configura tu DNI ingresando de nuevo."}</p>
        <p className="ayuda-participante">Si olvidaste tu DNI, pídele al organizador que lo verifique.</p>
      </article>

      {recibe && <article className="panel-participante mi-panel-tarjeta">
        <h2><Sparkles size={20} aria-hidden="true" /> Lo que recibí</h2>
        <div className="mi-panel-persona"><AvatarPersona nombre={recibe.nombre} fotoUrl={recibe.fotoUrl} />
          <p>{recibe.nombre} te eligió{recibe.regaloSeleccionado ? <> y te regala <strong>{recibe.regaloSeleccionado.necesidad.nombre}</strong></> : " pero aún no eligió regalo"}.</p>
        </div>
        <Link className="boton boton-dorado" href="/participar/revelacion">Ver mi revelación <ArrowRight size={16} aria-hidden="true" /></Link>
      </article>}
    </div>
  </section>;
}
