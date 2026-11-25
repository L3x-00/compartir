import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { LIMITES, MENSAJES } from "@/lib/constantes";

const EXTENSIONES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
const NOMBRE_FOTO = /^\d+-[a-f0-9]{8}\.(jpg|png|webp)$/;

function carpetaFotos() {
  return process.env.CARPETA_FOTOS || path.join(process.cwd(), "public", "uploads");
}

/** Next puede servir archivos agregados durante la ejecución, incluso fuera de public. */
export async function leerFoto(nombre: string) {
  const coincidencia = nombre.match(NOMBRE_FOTO);
  if (!coincidencia) return null;
  const tipo = coincidencia[1] === "jpg" ? "image/jpeg" : `image/${coincidencia[1]}`;
  try {
    const bytes = await readFile(path.join(carpetaFotos(), nombre));
    return { bytes, tipo };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function guardarFoto(archivo: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!Object.hasOwn(EXTENSIONES, archivo.type)) return { ok: false, error: MENSAJES.FOTO_TIPO_INVALIDO };
  if (archivo.size > LIMITES.MAX_FOTO_BYTES) return { ok: false, error: MENSAJES.FOTO_MUY_GRANDE };
  if (archivo.size === 0) return { ok: false, error: "La foto está vacía. Selecciona otra imagen." };
  const extension = EXTENSIONES[archivo.type as keyof typeof EXTENSIONES];
  const nombre = `${Date.now()}-${randomBytes(4).toString("hex")}.${extension}`;
  const carpeta = carpetaFotos();
  try {
    await mkdir(carpeta, { recursive: true });
    await writeFile(path.join(carpeta, nombre), Buffer.from(await archivo.arrayBuffer()), { flag: "wx" });
    return { ok: true, url: `/uploads/${nombre}` };
  } catch (error) {
    console.error("No se pudo guardar la foto:", error);
    return { ok: false, error: "No pudimos guardar la foto. Intenta de nuevo." };
  }
}

export async function eliminarFoto(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;
  const nombre = url.slice("/uploads/".length);
  // Solo se borran nombres generados aquí: evita rutas relativas y archivos ajenos.
  if (!NOMBRE_FOTO.test(nombre)) return;
  try {
    await unlink(path.join(carpetaFotos(), nombre));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
