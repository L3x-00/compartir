import { z } from "zod";

function enlaceSeguro(valor: string) {
  if (!valor) return true;
  try {
    return ["http:", "https:"].includes(new URL(valor).protocol);
  } catch {
    return false;
  }
}

export const esquemaNecesidad = z.object({
  nombre: z.string({ required_error: "Escribe el nombre del regalo.", invalid_type_error: "El nombre del regalo debe ser un texto." })
    .trim()
    .min(2, "El nombre del regalo debe tener al menos 2 caracteres.")
    .max(100, "El nombre del regalo puede tener hasta 100 caracteres."),
  descripcion: z.string({ invalid_type_error: "La descripción debe ser un texto." })
    .trim().max(500, "La descripción puede tener hasta 500 caracteres.").optional(),
  // Un campo opcional vacío equivale a no haber agregado un enlace.
  linkReferencia: z.string({ invalid_type_error: "El enlace debe ser un texto." })
    .trim().max(2048, "El enlace puede tener hasta 2048 caracteres.")
    .refine(enlaceSeguro, "Usa un enlace http:// o https://.")
    .optional(),
  fotoUrl: z.string({ invalid_type_error: "La ruta de la foto debe ser un texto." })
    .trim()
    .transform((valor) => valor || null)
    .refine((valor) => valor === null || /^\/uploads\/\d+-[a-f0-9]{8}\.(jpg|png|webp)$/.test(valor), "La ruta de la foto no es válida.")
    .optional(),
}, { required_error: "Completa los datos del regalo.", invalid_type_error: "Revisa los datos del regalo." });

export type DatosNecesidad = z.infer<typeof esquemaNecesidad>;
