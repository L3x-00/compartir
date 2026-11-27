import { z } from "zod";
import { CATALOGO_POR_DEFECTO } from "@/lib/constantes";
import type { CatalogoPistas } from "@/tipos/catalogo";
import { crearEsquemaPistas } from "./pistas";

export function crearEsquemaAdivinanza(catalogo: CatalogoPistas = CATALOGO_POR_DEFECTO) {
  return z.object({
    seleccion: crearEsquemaPistas(catalogo),
  }, { required_error: "Completa tu selección de pistas.", invalid_type_error: "Revisa tu selección de pistas." });
}

export const esquemaAdivinanza = crearEsquemaAdivinanza();

export const esquemaConfirmacion = z.object({
  candidatoId: z.string({ required_error: "Elige una persona antes de confirmar.", invalid_type_error: "Selecciona una persona válida." })
    .cuid("La persona seleccionada no es válida. Vuelve a elegir."),
}, { required_error: "Selecciona una persona para confirmar.", invalid_type_error: "Revisa la persona seleccionada." });

export type DatosAdivinanza = z.infer<typeof esquemaAdivinanza>;
export type DatosConfirmacion = z.infer<typeof esquemaConfirmacion>;

export const esquemaAdivinanzaSeleccion = esquemaAdivinanza;
export const esquemaAdivinanzaConfirmar = esquemaConfirmacion;

export function leerPistasCompletas(datos: string, catalogo: CatalogoPistas = CATALOGO_POR_DEFECTO) {
  try {
    const resultado = crearEsquemaPistas(catalogo).safeParse(JSON.parse(datos));
    return resultado.success ? resultado.data : null;
  } catch {
    return null;
  }
}

/** Las pistas antiguas se pueden editar sin perder los otros trece campos. */
export function leerPistasParaEditar(datos: string, catalogo: CatalogoPistas = CATALOGO_POR_DEFECTO) {
  try {
    const entrada: unknown = JSON.parse(datos);
    const esquema = crearEsquemaPistas(catalogo);
    const completas = esquema.safeParse(entrada);
    if (completas.success) return completas.data;
    const anteriores = esquema.omit({ datoCurioso: true }).safeParse(entrada);
    return anteriores.success ? { ...anteriores.data, datoCurioso: "" } : null;
  } catch { return null; }
}
