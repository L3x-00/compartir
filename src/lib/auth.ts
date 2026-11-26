import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { MENSAJES } from "@/lib/constantes";
import { obtenerEventoActivo, verificarCierreAutomatico } from "@/lib/evento";
import { esSesionValida, NOMBRE_COOKIE, separarCookie } from "@/lib/firmaSesion";
import { leerCuerpoLimitado } from "@/lib/cuerpos";

export type SesionParticipante = {
  participanteId: string;
  eventoId: string;
  esAdmin: boolean;
};

function firmar(contenido: string): string {
  const secreto = process.env.SECRETO_SESION;
  if (!secreto) throw new Error("Falta configurar SECRETO_SESION.");
  return createHmac("sha256", secreto).update(contenido).digest("hex");
}

export async function crearSesion(participanteId: string, eventoId: string, esAdmin: boolean): Promise<void> {
  const participante = await prisma.participante.findUniqueOrThrow({ where: { id: participanteId, eventoId }, select: { versionSesion: true } });
  const contenido = JSON.stringify({ participanteId, eventoId, esAdmin, exp: Date.now() + 7 * 86400_000, version: participante.versionSesion });
  (await cookies()).set(NOMBRE_COOKIE, `${contenido}.${firmar(contenido)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function obtenerSesion(): Promise<SesionParticipante | null> {
  try {
    const valor = (await cookies()).get(NOMBRE_COOKIE)?.value;
    if (!valor) return null;
    const partes = separarCookie(valor);
    if (!partes) return null;
    // El tamaño ya está validado en separarCookie, como exige timingSafeEqual.
    if (!timingSafeEqual(Buffer.from(partes.firma, "hex"), Buffer.from(firmar(partes.contenido), "hex"))) return null;
    const sesion: unknown = JSON.parse(partes.contenido);
    if (!esSesionValida(sesion)) return null;
    const persona = await prisma.participante.findFirst({
      where: { id: sesion.participanteId, eventoId: sesion.eventoId, versionSesion: sesion.version }, select: { esAdmin: true },
    });
    if (!persona) return null;
    return { participanteId: sesion.participanteId, eventoId: sesion.eventoId, esAdmin: persona.esAdmin };
  } catch {
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  const sesion = await obtenerSesion();
  if (sesion) await prisma.participante.updateMany({ where: { id: sesion.participanteId, eventoId: sesion.eventoId }, data: { versionSesion: { increment: 1 } } });
  (await cookies()).delete(NOMBRE_COOKIE);
}

export async function requiereSesion(): Promise<SesionParticipante> {
  const sesion = await obtenerSesion();
  if (!sesion) throw NextResponse.json({ ok: false, error: MENSAJES.SESION_EXPIRADA }, { status: 401 });
  const participante = await prisma.participante.findFirst({
    where: { id: sesion.participanteId, eventoId: sesion.eventoId },
    select: { esAdmin: true, evento: true },
  });
  if (!participante) throw NextResponse.json({ ok: false, error: MENSAJES.SESION_EXPIRADA }, { status: 401 });
  await verificarCierreAutomatico(participante.evento);
  return { ...sesion, esAdmin: participante.esAdmin };
}

export async function requiereAdmin(): Promise<SesionParticipante> {
  const sesion = await requiereSesion();
  if (!sesion.esAdmin) throw NextResponse.json({ ok: false, error: "Solo el administrador puede realizar esta acción." }, { status: 403 });
  return sesion;
}

// El cierre se comprueba al recibir peticiones, sin cron ni servicios adicionales.
export async function requiereEventoAbierto(eventoId?: string) {
  const evento = eventoId
    ? await prisma.evento.findUnique({ where: { id: eventoId } })
    : await obtenerEventoActivo();
  if (!evento) throw NextResponse.json({ ok: false, error: "No hay evento activo." }, { status: 404 });
  const actualizado = await verificarCierreAutomatico(evento);
  if (actualizado.cerrado) {
    throw NextResponse.json({ ok: false, error: MENSAJES.EVENTO_CERRADO }, { status: 403 });
  }
  return actualizado;
}

export async function leerJSON(peticion: Request): Promise<unknown> {
  const bytes = await leerCuerpoLimitado(peticion, 64 * 1024);
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw NextResponse.json({ ok: false, error: "No pudimos leer los datos. Envía un JSON válido." }, { status: 400 });
  }
}

// Un manejo compartido evita exponer mensajes técnicos de Prisma en las rutas.
export function responderError(error: unknown): NextResponse {
  if (error instanceof NextResponse) return error;
  if (error instanceof ZodError) {
    const mensaje = error.issues[0]?.code === "invalid_union" ? MENSAJES.DATOS_INVALIDOS : error.issues[0]?.message;
    return NextResponse.json({ ok: false, error: mensaje || MENSAJES.DATOS_INVALIDOS }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return NextResponse.json({ ok: false, error: "Estos datos ya están registrados." }, { status: 409 });
    if (error.code === "P2025") return NextResponse.json({ ok: false, error: "No encontramos el registro solicitado." }, { status: 404 });
    if (["P2034", "P2028", "P1008"].includes(error.code)) return NextResponse.json({ ok: false, error: "Otra acción se está guardando. Intenta de nuevo." }, { status: 409 });
  }
  console.error("Error al procesar la petición:", error);
  return NextResponse.json({ ok: false, error: MENSAJES.ERROR_GENERICO }, { status: 500 });
}
