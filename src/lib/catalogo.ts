import { z } from "zod";
import { CATALOGO_POR_DEFECTO } from "@/lib/constantes";
import { prisma } from "@/lib/prisma";
import type { CatalogoPistas } from "@/tipos/catalogo";

const lista = (campo: string) => z.array(
  z.string({ required_error: `${campo} no puede estar vacío.` }).trim().min(1, `Escribe opciones para ${campo}.`).max(80, "Cada opción puede tener hasta 80 caracteres."),
).min(2, `${campo} necesita al menos 2 opciones.`).max(20, `${campo} puede tener hasta 20 opciones.`)
  .refine((valores) => new Set(valores.map((valor) => valor.toLocaleLowerCase("es"))).size === valores.length,
    `${campo} tiene opciones repetidas.`);

export const esquemaCatalogo = z.object({
  fisico: z.object({ altura: lista("Altura"), complexion: lista("Complexión"), cabello: lista("Cabello"), barba: lista("Barba") }),
  personalidad: z.object({ social: lista("Social"), humor: lista("Humor"), puntualidad: lista("Puntualidad"), energia: lista("Energía") }),
  gustos: z.object({ comida: lista("Comida"), musica: lista("Música"), hobby: lista("Hobby"), lugar: lista("Lugar") }),
  datoCurioso: lista("Dato curioso"),
});

export function validarCatalogo(dato: unknown): CatalogoPistas {
  return esquemaCatalogo.parse(dato);
}

export async function leerCatalogo(): Promise<CatalogoPistas> {
  const fila = await prisma.catalogoPistas.findUnique({ where: { id: "principal" }, select: { datos: true } });
  if (!fila) return CATALOGO_POR_DEFECTO;
  try { return validarCatalogo(JSON.parse(fila.datos)); }
  catch { return CATALOGO_POR_DEFECTO; }
}

export async function guardarCatalogo(catalogo: CatalogoPistas): Promise<CatalogoPistas> {
  const valido = validarCatalogo(catalogo);
  await prisma.catalogoPistas.upsert({
    where: { id: "principal" },
    update: { datos: JSON.stringify(valido) },
    create: { id: "principal", datos: JSON.stringify(valido) },
  });
  return valido;
}
