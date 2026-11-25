import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearSesion, leerJSON, obtenerSesion, requiereSesion, responderError } from "@/lib/auth";
import { obtenerEventoActivo, verificarCierreAutomatico } from "@/lib/evento";
import { esquemaRegistroParticipante, normalizarNombre } from "@/lib/validaciones/participante";
import { eliminarFoto, guardarFoto } from "@/lib/archivos";
import { MENSAJES } from "@/lib/constantes";
import { hashPin, verificarPin } from "@/lib/pin";

const DNI_INCORRECTO = "Ese nombre ya está registrado. Ingresa con tu DNI para abrir tu panel.";

export async function GET() {
  try {
    const cookie = await obtenerSesion();
    const sesion = cookie ? await requiereSesion() : null;
    const encontrado = sesion
      ? await prisma.evento.findUnique({ where: { id: sesion.eventoId } })
      : await obtenerEventoActivo();
    if (!encontrado) return NextResponse.json({ ok: false, error: "Aún no hay un evento creado. Pídele al organizador que lo cree." }, { status: 404 });
    const evento = await verificarCierreAutomatico(encontrado);
    return NextResponse.json({ ok: true, evento: { id: evento.id, nombre: evento.nombre, fechaLimite: evento.fechaLimite, cerrado: evento.cerrado } });
  } catch (error) {
    return responderError(error);
  }
}

export async function POST(peticion: Request) {
  try {
    let nombre: unknown;
    let foto: unknown;
    let dni: unknown;
    const tipo = peticion.headers.get("content-type") ?? "";
    if (tipo.includes("multipart/form-data")) {
      let formulario: FormData;
      try { formulario = await peticion.formData(); }
      catch { return NextResponse.json({ ok: false, error: "Envía tu nombre, tu foto y tu DNI como un formulario." }, { status: 400 }); }
      nombre = formulario.get("nombre");
      foto = formulario.get("foto");
      dni = formulario.get("dni");
    } else {
      const cuerpo = await leerJSON(peticion) as { nombre?: unknown; dni?: unknown };
      nombre = cuerpo.nombre;
      dni = cuerpo.dni;
      foto = null;
    }
    const { nombre: nombreLimpio, dni: dniLimpio } = esquemaRegistroParticipante.parse({ nombre, dni });

    const encontrado = await obtenerEventoActivo();
    if (!encontrado) return NextResponse.json({ ok: false, error: "Aún no hay un evento creado. Pídele al organizador que lo prepare." }, { status: 404 });
    const evento = await verificarCierreAutomatico(encontrado);
    const nombreBuscado = nombreLimpio.toLocaleLowerCase("es");
    const existentes = await prisma.participante.findMany({
      where: { eventoId: evento.id },
      select: { id: true, nombre: true, esAdmin: true, fotoUrl: true, pin: true, regaloSeleccionado: { select: { id: true } } },
    });
    const anterior = existentes.find((p) => normalizarNombre(p.nombre).toLocaleLowerCase("es") === nombreBuscado) ?? null;

    if (anterior?.esAdmin) {
      return NextResponse.json({ ok: false, error: "Ese nombre está reservado. Escribe tu propio nombre completo." }, { status: 409 });
    }
    if (!anterior && (evento.cerrado || evento.fechaLimite.getTime() <= Date.now())) {
      return NextResponse.json({ ok: false, error: MENSAJES.EVENTO_CERRADO }, { status: 403 });
    }
    if (anterior?.pin && !verificarPin(anterior.pin, dniLimpio)) {
      return NextResponse.json({ ok: false, error: DNI_INCORRECTO }, { status: 401 });
    }
    const pinInicial = anterior?.pin ? null : hashPin(dniLimpio);

    const usaFoto = foto instanceof File;
    if ((!anterior || !anterior.fotoUrl) && !usaFoto) {
      return NextResponse.json({ ok: false, error: "Agrega una foto tuya para registrarte." }, { status: 400 });
    }
    const guardado = usaFoto ? await guardarFoto(foto as File) : null;
    if (guardado && !guardado.ok) return NextResponse.json(guardado, { status: 400 });
    const urlFoto = guardado?.ok ? guardado.url : anterior?.fotoUrl ?? null;
    let confirmada = false;
    try {
      const participante = anterior
        ? await prisma.participante.update({
          where: { id: anterior.id },
          data: { ...(usaFoto ? { fotoUrl: urlFoto } : {}), ...(pinInicial ? { pin: pinInicial } : {}) },
          select: { id: true, nombre: true, fotoUrl: true },
        })
        : await prisma.participante.create({
          data: { nombre: nombreLimpio, eventoId: evento.id, esAdmin: false, pin: pinInicial ?? hashPin(dniLimpio), fotoUrl: urlFoto },
          select: { id: true, nombre: true, fotoUrl: true },
        });
      confirmada = true;
      if (guardado?.ok && anterior?.fotoUrl && anterior.fotoUrl !== urlFoto) await eliminarFoto(anterior.fotoUrl).catch(() => undefined);
      await crearSesion(participante.id, evento.id, false);
      return NextResponse.json({ ok: true, datos: {
        participanteId: participante.id, nombre: participante.nombre, cerrado: evento.cerrado,
        tieneRegaloSeleccionado: Boolean(anterior?.regaloSeleccionado), esReingreso: !!anterior,
      } }, { status: anterior ? 200 : 201 });
    } catch (error) {
      if (!confirmada && guardado?.ok) await eliminarFoto(guardado.url).catch(() => undefined);
      return responderError(error);
    }
  } catch (error) {
    return responderError(error);
  }
}
