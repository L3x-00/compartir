import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearSesion, leerJSON, responderError } from "@/lib/auth";
import { obtenerEventoActivo, verificarCierreAutomatico } from "@/lib/evento";
import { esquemaIngresoAdmin, normalizarNombre } from "@/lib/validaciones/participante";
import { MENSAJES } from "@/lib/constantes";
import { esPinHasheado, hashPin, verificarPin } from "@/lib/pin";

export async function POST(peticion: Request) {
  try {
    const { nombre, pin } = esquemaIngresoAdmin.parse(await leerJSON(peticion));
    const encontrado = await obtenerEventoActivo();
    if (!encontrado) return NextResponse.json({ ok: false, error: "No hay evento disponible." }, { status: 404 });
    const evento = await verificarCierreAutomatico(encontrado);
    const administradores = await prisma.participante.findMany({
      where: { eventoId: evento.id, esAdmin: true }, select: { id: true, nombre: true, pin: true },
    });
    const nombreBuscado = nombre.toLocaleLowerCase("es");
    const admin = administradores.find((persona) => normalizarNombre(persona.nombre).toLocaleLowerCase("es") === nombreBuscado);
    if (!admin || !verificarPin(admin.pin, pin)) return NextResponse.json({ ok: false, error: MENSAJES.PIN_INCORRECTO }, { status: 401 });
    if (!esPinHasheado(admin.pin)) {
      await prisma.participante.update({ where: { id: admin.id }, data: { pin: hashPin(pin) } });
    }
    await crearSesion(admin.id, evento.id, true);
    return NextResponse.json({ ok: true, datos: { participanteId: admin.id, nombre: admin.nombre, esAdmin: true } });
  } catch (error) {
    return responderError(error);
  }
}
