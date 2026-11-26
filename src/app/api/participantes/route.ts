import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearSesion, leerJSON, obtenerSesion, requiereSesion, responderError } from "@/lib/auth";
import { conEventoAbierto, obtenerEventoActivo, verificarCierreAutomatico } from "@/lib/evento";
import { esquemaRegistroParticipante, normalizarNombre } from "@/lib/validaciones/participante";
import { guardarFoto, prepararFoto, limpiarFotoSinUso, limpiarFotosVencidas } from "@/lib/archivos";
import { leerFormularioFoto } from "@/lib/cuerpos";
import { hashPin, verificarPin } from "@/lib/pin";
import { repartoCompletable } from "@/lib/reparto";

const DNI_INCORRECTO = "Ese nombre ya está registrado. Ingresa con tu DNI para abrir tu panel.";
export async function GET() {
  try {
    const cookie = await obtenerSesion();
    const sesion = cookie ? await requiereSesion() : null;
    const encontrado = sesion ? await prisma.evento.findUnique({ where: { id: sesion.eventoId } }) : await obtenerEventoActivo();
    if (!encontrado) return NextResponse.json({ ok: false, error: "Aún no hay un evento creado. Pídele al organizador que lo cree." }, { status: 404 });
    const evento = await verificarCierreAutomatico(encontrado);
    return NextResponse.json({ ok: true, evento: { id: evento.id, nombre: evento.nombre, fechaLimite: evento.fechaLimite, cerrado: evento.cerrado } });
  } catch (error) { return responderError(error); }
}

export async function POST(peticion: Request) {
  let subida: string | undefined;
  try {
    let entrada: unknown;
    let foto: File | null = null;
    if ((peticion.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const formulario = await leerFormularioFoto(peticion);
      entrada = { nombre: formulario.get("nombre"), dni: formulario.get("dni") };
      const fotos = formulario.getAll("foto");
      if (fotos.length > 1) return NextResponse.json({ ok: false, error: "Selecciona una sola foto." }, { status: 400 });
      if (fotos[0] instanceof File) foto = fotos[0];
    } else entrada = await leerJSON(peticion);
    const { nombre, dni } = esquemaRegistroParticipante.parse(entrada);
    const encontrado = await obtenerEventoActivo();
    if (!encontrado) return NextResponse.json({ ok: false, error: "Aún no hay un evento creado. Pídele al organizador que lo prepare." }, { status: 404 });
    const evento = await verificarCierreAutomatico(encontrado);
    const clave = (valor: string) => normalizarNombre(valor).toLocaleLowerCase("es");
    const existentes = await prisma.participante.findMany({ where: { eventoId: evento.id }, include: { regaloSeleccionado: { select: { id: true } } } });
    const anterior = existentes.find((p) => clave(p.nombre) === clave(nombre));
    if (anterior?.esAdmin) return NextResponse.json({ ok: false, error: "Ese nombre está reservado. Escribe tu propio nombre completo." }, { status: 409 });
    if (anterior?.pin && !verificarPin(anterior.pin, dni)) return NextResponse.json({ ok: false, error: DNI_INCORRECTO }, { status: 401 });
    if ((!anterior || !anterior.fotoUrl) && !foto) return NextResponse.json({ ok: false, error: "Agrega una foto tuya para registrarte." }, { status: 400 });
    // Reingresar sin editar sigue permitido después del cierre.
    let participante = anterior ? { id: anterior.id, nombre: anterior.nombre } : null;
    if (!anterior || !anterior.pin || foto) {
      const preparada = foto ? await prepararFoto(foto) : null;
      if (preparada) await limpiarFotosVencidas();
      const nuevoPin = hashPin(dni);
      participante = await conEventoAbierto(evento.id, async (tx) => {
        const actuales = await tx.participante.findMany({ where: { eventoId: evento.id }, select: { id: true, nombre: true, pin: true, esAdmin: true } });
        const actual = actuales.find((p) => clave(p.nombre) === clave(nombre));
        if (actual?.id !== anterior?.id || actual?.esAdmin) throw NextResponse.json({ ok: false, error: "Ese nombre acaba de registrarse. Vuelve a ingresar con su DNI." }, { status: 409 });
        if (actual?.pin && !verificarPin(actual.pin, dni)) throw NextResponse.json({ ok: false, error: DNI_INCORRECTO }, { status: 401 });
        const persona = actual ?? await tx.participante.create({ data: { nombre, eventoId: evento.id, pin: nuevoPin } });
        if (!actual) {
          const personas = await tx.participante.findMany({ where: { eventoId: evento.id, esAdmin: false }, select: { id: true, personaSecretaId: true } });
          if (personas.length > 1 && !repartoCompletable(personas)) throw NextResponse.json({ ok: false, error: "El reparto ya está completo. Pídele al organizador que revise tu incorporación antes de registrarte." }, { status: 409 });
        }
        if (preparada) subida = await guardarFoto(preparada, persona.id, tx);
        return tx.participante.update({ where: { id: persona.id }, data: { ...(subida ? { fotoUrl: subida } : {}), ...(!actual?.pin ? { pin: nuevoPin } : {}) }, select: { id: true, nombre: true } });
      });
    }
    if (!participante) throw new Error("No se pudo completar el ingreso");
    if (subida && anterior?.fotoUrl && anterior.fotoUrl !== subida) await limpiarFotoSinUso(anterior.fotoUrl);
    await crearSesion(participante.id, evento.id, false);
    return NextResponse.json({ ok: true, datos: { participanteId: participante.id, nombre: participante.nombre, cerrado: evento.cerrado, tieneRegaloSeleccionado: Boolean(anterior?.regaloSeleccionado), esReingreso: !!anterior } }, { status: anterior ? 200 : 201 });
  } catch (error) {
    if (subida) await limpiarFotoSinUso(subida);
    return responderError(error);
  }
}
