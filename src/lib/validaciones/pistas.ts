import { z } from "zod";
import { CATALOGO_POR_DEFECTO } from "@/lib/constantes";
import type { CatalogoPistas } from "@/tipos/catalogo";
import type { Pistas } from "@/tipos/pistas";

const mensajeOpcion = { errorMap: () => ({ message: "Elige una de las opciones disponibles." }) };
const mensajeCategoria = {
  required_error: "Completa esta categoría de pistas.",
  invalid_type_error: "Revisa las opciones de esta categoría.",
};

function opciones(valores: string[]) {
  return z.enum(valores as [string, ...string[]], mensajeOpcion);
}

/** El catálogo puede cambiar en el panel, así que el esquema se construye con él. */
export function crearEsquemaPistas(catalogo: CatalogoPistas = CATALOGO_POR_DEFECTO) {
  return z.object({
    fisico: z.object({
      altura: opciones(catalogo.fisico.altura), complexion: opciones(catalogo.fisico.complexion),
      cabello: opciones(catalogo.fisico.cabello), lentes: z.boolean({ required_error: "Indica si usas lentes.", invalid_type_error: "Elige sí o no para el uso de lentes." }),
      barba: opciones(catalogo.fisico.barba),
    }, mensajeCategoria),
    personalidad: z.object({
      social: opciones(catalogo.personalidad.social), humor: opciones(catalogo.personalidad.humor),
      puntualidad: opciones(catalogo.personalidad.puntualidad), energia: opciones(catalogo.personalidad.energia),
    }, mensajeCategoria),
    gustos: z.object({
      comida: opciones(catalogo.gustos.comida), musica: opciones(catalogo.gustos.musica),
      hobby: opciones(catalogo.gustos.hobby), lugar: opciones(catalogo.gustos.lugar),
    }, mensajeCategoria),
    datoCurioso: z.enum(catalogo.datoCurioso as [string, ...string[]], mensajeOpcion),
  }, { required_error: "Completa tus pistas.", invalid_type_error: "Revisa los datos de tus pistas." }) satisfies z.ZodType<Pistas>;
}

export const esquemaPistas = crearEsquemaPistas();
