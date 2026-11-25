import { z } from "zod";
import { PISTAS_FISICO, PISTAS_PERSONALIDAD, PISTAS_GUSTOS } from "@/lib/constantes";
import type { Pistas } from "@/tipos/pistas";

const mensajeOpcion = { errorMap: () => ({ message: "Elige una de las opciones disponibles." }) };
const mensajeCategoria = {
  required_error: "Completa esta categoría de pistas.",
  invalid_type_error: "Revisa las opciones de esta categoría.",
};

export const esquemaPistas = z.object({
  fisico: z.object({
    altura: z.enum(PISTAS_FISICO.altura, mensajeOpcion),
    complexion: z.enum(PISTAS_FISICO.complexion, mensajeOpcion),
    cabello: z.enum(PISTAS_FISICO.cabello, mensajeOpcion),
    lentes: z.boolean({ required_error: "Indica si usas lentes.", invalid_type_error: "Elige sí o no para el uso de lentes." }),
    barba: z.enum(PISTAS_FISICO.barba, mensajeOpcion),
  }, mensajeCategoria),
  personalidad: z.object({
    social: z.enum(PISTAS_PERSONALIDAD.social, mensajeOpcion),
    humor: z.enum(PISTAS_PERSONALIDAD.humor, mensajeOpcion),
    puntualidad: z.enum(PISTAS_PERSONALIDAD.puntualidad, mensajeOpcion),
    energia: z.enum(PISTAS_PERSONALIDAD.energia, mensajeOpcion),
  }, mensajeCategoria),
  gustos: z.object({
    comida: z.enum(PISTAS_GUSTOS.comida, mensajeOpcion),
    musica: z.enum(PISTAS_GUSTOS.musica, mensajeOpcion),
    hobby: z.enum(PISTAS_GUSTOS.hobby, mensajeOpcion),
    lugar: z.enum(PISTAS_GUSTOS.lugar, mensajeOpcion),
  }, mensajeCategoria),
  datoCurioso: z.string({ required_error: "Agrega tu dato curioso.", invalid_type_error: "El dato curioso debe ser un texto." })
    .trim().min(1, "Agrega tu dato curioso.").max(200, "El dato curioso puede tener hasta 200 caracteres."),
}, { required_error: "Completa tus pistas.", invalid_type_error: "Revisa los datos de tus pistas." }) satisfies z.ZodType<Pistas>;
