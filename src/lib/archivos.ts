import { mkdir, readFile, writeFile, unlink, readdir, stat, rename } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LIMITES, MENSAJES } from "@/lib/constantes";

const TIPOS = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" } as const;
const NOMBRE_FOTO = /^\d+-[a-f0-9]{8}\.(jpg|png|webp)$/;
const CADUCIDAD = 24 * 3600_000;
type Cliente = Prisma.TransactionClient;
export type FotoPreparada = { bytes: Buffer; extension: "jpg" | "png" | "webp" };
export function carpetaFotos() { return process.env.CARPETA_FOTOS || path.join(process.cwd(), "datos", "fotos"); }

export async function leerFoto(nombre: string) {
  const coincidencia = nombre.match(NOMBRE_FOTO);
  if (!coincidencia) return null;
  try {
    let bytes: Buffer;
    try { bytes = await readFile(path.join(carpetaFotos(), nombre)); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT" || process.env.CARPETA_FOTOS) throw error;
      bytes = await readFile(path.join(process.cwd(), "public", "uploads", nombre));
    }
    return { bytes, tipo: coincidencia[1] === "jpg" ? "image/jpeg" : `image/${coincidencia[1]}` };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function prepararFoto(archivo: File): Promise<FotoPreparada> {
  const rechazar = (error: string) => NextResponse.json({ ok: false, error }, { status: 400 });
  if (!Object.hasOwn(TIPOS, archivo.type)) throw rechazar(MENSAJES.FOTO_TIPO_INVALIDO);
  if (archivo.size > LIMITES.MAX_FOTO_BYTES) throw rechazar(MENSAJES.FOTO_MUY_GRANDE);
  if (!archivo.size) throw rechazar("La foto está vacía. Selecciona otra imagen.");
  try {
    const imagen = sharp(Buffer.from(await archivo.arrayBuffer()), { limitInputPixels: 25_000_000, failOn: "warning" });
    const datos = await imagen.metadata();
    if (datos.format !== TIPOS[archivo.type as keyof typeof TIPOS] || (datos.pages ?? 1) > 1) throw new Error("Formato inválido");
    const bytes = await imagen.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    if (bytes.length > LIMITES.MAX_FOTO_BYTES) throw new Error("Imagen demasiado grande");
    return { bytes, extension: "webp" };
  } catch { throw rechazar("No pudimos leer esa imagen. Usa una foto JPG, PNG o WebP válida, de hasta 25 megapíxeles."); }
}

export async function guardarFoto(foto: FotoPreparada, propietarioId: string, tx: Cliente): Promise<string> {
  const fotos = await tx.foto.findMany({ where: { propietarioId } });
  const persona = await tx.participante.findUniqueOrThrow({ where: { id: propietarioId }, select: { fotoUrl: true, necesidades: { select: { fotoUrl: true } } } });
  const usadas = new Set([persona.fotoUrl, ...persona.necesidades.map((n) => n.fotoUrl)]);
  if (fotos.filter((f) => !usadas.has(f.url)).length >= 3 || fotos.length >= LIMITES.MAX_NECESIDADES + 5 || fotos.reduce((n, f) => n + f.bytes, 0) + foto.bytes.length > 100 * 1024 * 1024) {
    throw NextResponse.json({ ok: false, error: "Tienes varias fotos pendientes. Guarda o elimina las anteriores antes de subir otra." }, { status: 409 });
  }
  const nombre = `${Date.now()}-${randomBytes(4).toString("hex")}.${foto.extension}`;
  const url = `/uploads/${nombre}`;
  await mkdir(carpetaFotos(), { recursive: true });
  await writeFile(path.join(carpetaFotos(), nombre), foto.bytes, { flag: "wx" });
  try { await tx.foto.create({ data: { url, propietarioId, bytes: foto.bytes.length } }); }
  catch (error) { await eliminarFoto(url); throw error; }
  return url;
}

export async function validarFotoPropia(tx: Cliente, url: string | null | undefined, propietarioId: string, anterior?: string | null) {
  if (!url || url === anterior) return;
  if (!await tx.foto.findFirst({ where: { url, propietarioId } })) throw NextResponse.json({ ok: false, error: "Selecciona una foto que hayas subido tú." }, { status: 403 });
  if (!await leerFoto(url.slice(9))) throw NextResponse.json({ ok: false, error: "Esa foto ya no está disponible. Vuelve a subirla." }, { status: 404 });
}

export async function eliminarFoto(url: string): Promise<void> {
  const nombre = url.startsWith("/uploads/") ? url.slice(9) : "";
  if (!NOMBRE_FOTO.test(nombre)) return;
  const carpetas = process.env.CARPETA_FOTOS ? [carpetaFotos()] : [carpetaFotos(), path.join(process.cwd(), "public", "uploads")];
  for (const carpeta of carpetas) {
    try { await unlink(path.join(carpeta, nombre)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
}

export async function limpiarFotoSinUso(url: string) {
  try {
    const borrar = await prisma.$transaction(async (tx) => {
      await tx.foto.updateMany({ where: { url }, data: { url } });
      if (await tx.necesidad.count({ where: { fotoUrl: url } }) || await tx.participante.count({ where: { fotoUrl: url } })) return false;
      await tx.foto.deleteMany({ where: { url } });
      return true;
    });
    if (borrar) await eliminarFoto(url);
  } catch (error) { console.error("No se pudo limpiar la foto anterior:", error); }
}

/** Limpieza al subir, sin cron: descarta únicamente archivos huérfanos de más de un día. */
export async function limpiarFotosVencidas() {
  await mkdir(carpetaFotos(), { recursive: true });
  for (const nombre of await readdir(carpetaFotos())) {
    if (!NOMBRE_FOTO.test(nombre)) continue;
    try {
      if ((await stat(path.join(carpetaFotos(), nombre))).mtimeMs < Date.now() - CADUCIDAD) await limpiarFotoSinUso(`/uploads/${nombre}`);
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
}

/** Conserva las referencias anteriores y retira las fotos del directorio público local. */
export async function registrarFotosExistentes() {
  if (!process.env.CARPETA_FOTOS) {
    // También retira del directorio público las subidas antiguas sin referencias.
    const publica = path.join(process.cwd(), "public", "uploads");
    await mkdir(carpetaFotos(), { recursive: true });
    let nombres: string[] = [];
    try { nombres = await readdir(publica); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    for (const nombre of nombres) {
      if (!NOMBRE_FOTO.test(nombre)) continue;
      const origen = path.join(publica, nombre);
      const destino = path.join(carpetaFotos(), nombre);
      let existente: Buffer | undefined;
      try { existente = await readFile(destino); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      if (existente) {
        if (!existente.equals(await readFile(origen))) throw new Error("Hay dos fotos distintas con el mismo nombre; revisa la carpeta de fotos.");
        await unlink(origen);
      } else await rename(origen, destino);
    }
  }
  const perfiles = await prisma.participante.findMany({ where: { fotoUrl: { not: null } }, select: { id: true, fotoUrl: true } });
  const necesidades = await prisma.necesidad.findMany({ where: { fotoUrl: { not: null } }, select: { participanteId: true, fotoUrl: true } });
  for (const referencia of [...perfiles.map((p) => ({ propietarioId: p.id, url: p.fotoUrl! })), ...necesidades.map((n) => ({ propietarioId: n.participanteId, url: n.fotoUrl! }))]) {
    const nombre = referencia.url.startsWith("/uploads/") ? referencia.url.slice(9) : "";
    if (!NOMBRE_FOTO.test(nombre)) continue;
    const foto = await leerFoto(nombre);
    if (!foto) continue;
    await prisma.foto.upsert({ where: { url: referencia.url }, update: {}, create: { ...referencia, bytes: foto.bytes.length } });
  }
  await limpiarFotosVencidas();
}
