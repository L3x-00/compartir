import { z } from "zod";
import { LIMITES } from "@/lib/constantes";

export function normalizarNombre(nombre: string) {
  return nombre.trim().replace(/\s+/g, " ").normalize("NFC");
}

const esquemaNombre = z.object({
  nombre: z.string({ required_error: "Escribe tu nombre.", invalid_type_error: "Tu nombre debe ser un texto." })
    .transform(normalizarNombre)
    .pipe(z.string()
      .min(2, "Escribe un nombre de al menos 2 caracteres.")
      .max(50, "Tu nombre puede tener hasta 50 caracteres.")),
}, { required_error: "Escribe tu nombre.", invalid_type_error: "Revisa tus datos de ingreso." });

/** Nombre suelto: se usa en listas y comprobaciones, sin exigir DNI. */
export const esquemaNombreParticipante = esquemaNombre;

export const esquemaRegistroParticipante = esquemaNombre.extend({
  dni: z.string({ required_error: "Escribe tu DNI.", invalid_type_error: "El DNI debe ser un número de 8 dígitos." })
    .trim()
    .regex(/^\d{8}$/, "El DNI debe tener exactamente 8 números."),
});

export const esquemaIngresoAdmin = esquemaNombre.extend({
  // Se mantiene como texto para conservar PIN como «0123».
  pin: z.string({ required_error: "Ingresa el PIN del administrador.", invalid_type_error: "Ingresa el PIN como texto de 4 dígitos." })
    .length(LIMITES.PIN_LONGITUD, "El PIN debe tener exactamente 4 dígitos.")
    .regex(/^[0-9]{4}$/, "Usa solo 4 números para el PIN."),
});
