import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { esquemaIngresoAdmin, esquemaNombreParticipante, normalizarNombre } from "@/lib/validaciones/participante";
import { hashPin } from "@/lib/pin";

if (existsSync(".env")) loadEnvFile(".env");

async function preparar() {
  const pin = process.env.PIN_ADMIN;
  if (!pin || !/^\d{4}$/.test(pin)) throw new Error("Configura PIN_ADMIN con cuatro dígitos.");
  if (process.env.NODE_ENV === "production" && pin === "1234") throw new Error("Cambia el PIN de demostración antes de publicar.");
  const admin = esquemaIngresoAdmin.parse({ nombre: process.env.NOMBRE_ADMIN || "Administrador", pin });
  const nombre = (process.env.NOMBRE_EVENTO || "Compartir Navideño").trim();
  if (nombre.length < 2 || nombre.length > 100) throw new Error("NOMBRE_EVENTO debe tener entre 2 y 100 caracteres.");
  const configurada = process.env.FECHA_LIMITE;
  const fechaLimite = configurada ? new Date(configurada) : new Date(Date.now() + 7 * 86400_000);
  const entrada = JSON.parse(process.env.PARTICIPANTES_JSON || "[]") as unknown;
  const invitados = z.array(esquemaNombreParticipante).parse(entrada);
  const claveNombre = (valor: string) => normalizarNombre(valor).toLocaleLowerCase("es");
  if (new Set(invitados.map((p) => claveNombre(p.nombre))).size !== invitados.length) {
    throw new Error("PARTICIPANTES_JSON contiene nombres repetidos.");
  }

  await prisma.$transaction(async (tx) => {
    // Los reinicios de producción preservan un evento previo, incluso cuando ya fue revelado.
    const actual = await tx.evento.findFirst({ orderBy: [{ cerrado: "asc" }, { creadoEn: "desc" }] });
    if (!actual && (configurada && !/(?:Z|[+-]\d{2}:\d{2})$/.test(configurada)
      || !Number.isFinite(fechaLimite.getTime()) || fechaLimite <= new Date())) {
      throw new Error("Configura FECHA_LIMITE como fecha ISO futura con zona horaria.");
    }
    const evento = actual ?? await tx.evento.create({ data: { nombre, fechaLimite } });
    const participantes = await tx.participante.findMany({
      where: { eventoId: evento.id }, select: { nombre: true, esAdmin: true },
    });
    const hayAdmin = participantes.some((p) => p.esAdmin);
    const clave = claveNombre(admin.nombre);
    const registrados = new Set(participantes.map((p) => claveNombre(p.nombre)));
    if (!hayAdmin && registrados.has(clave)) {
      throw new Error("NOMBRE_ADMIN ya pertenece a un participante. Elige otro nombre para el administrador.");
    }
    if (!hayAdmin && invitados.some((p) => claveNombre(p.nombre) === clave)) {
      throw new Error("El administrador se configura aparte de PARTICIPANTES_JSON.");
    }
    const nuevos = invitados.filter((p) => !registrados.has(claveNombre(p.nombre)));
    if (nuevos.length && (evento.cerrado || evento.fechaLimite <= new Date())) {
      throw new Error("El evento terminó. Retira de PARTICIPANTES_JSON los nombres aún no registrados.");
    }
    if (!hayAdmin) await tx.participante.create({ data: { ...admin, pin: hashPin(pin), eventoId: evento.id, esAdmin: true } });
    if (nuevos.length) await tx.participante.createMany({ data: nuevos.map((p) => ({ ...p, eventoId: evento.id, pin: "" })) });
  });
  console.log("Evento preparado. El organizador puede ingresar con su nombre y PIN.");
}

preparar().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "No pudimos preparar el evento.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
