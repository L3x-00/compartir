import { z } from "zod";
import { esquemaPistas } from "./pistas";

export const esquemaAdivinanza = z.object({
  seleccion: esquemaPistas,
}, { required_error: "Completa tu selección de pistas.", invalid_type_error: "Revisa tu selección de pistas." });

export const esquemaConfirmacion = z.object({
  candidatoId: z.string({ required_error: "Elige una persona antes de confirmar.", invalid_type_error: "Selecciona una persona válida." })
    .cuid("La persona seleccionada no es válida. Vuelve a elegir."),
}, { required_error: "Selecciona una persona para confirmar.", invalid_type_error: "Revisa la persona seleccionada." });

export type DatosAdivinanza = z.infer<typeof esquemaAdivinanza>;
export type DatosConfirmacion = z.infer<typeof esquemaConfirmacion>;

// Nombres usados por las rutas del juego; mantiene los exports del prompt anterior.
export const esquemaAdivinanzaSeleccion = esquemaAdivinanza;
export const esquemaAdivinanzaConfirmar = esquemaConfirmacion;

export function leerPistasCompletas(datos: string) {
  try {
    const resultado = esquemaPistas.safeParse(JSON.parse(datos));
    return resultado.success ? resultado.data : null;
  } catch {
    return null;
  }
}

// Las pistas antiguas se pueden editar sin perder los otros trece campos.
// Un dato libre nunca se convierte silenciosamente en una opción del catálogo.
export function leerPistasParaEditar(datos: string) {
  try {
    const entrada: unknown = JSON.parse(datos);
    const completas = esquemaPistas.safeParse(entrada);
    if (completas.success) return completas.data;
    const anteriores = esquemaPistas.omit({ datoCurioso: true }).safeParse(entrada);
    return anteriores.success ? { ...anteriores.data, datoCurioso: "" } : null;
  } catch { return null; }
}
