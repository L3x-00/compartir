import type { CatalogoPistas } from "@/tipos/catalogo";

export const CATEGORIAS_PISTAS = {
  fisico: "Rasgos físicos",
  personalidad: "Personalidad",
  gustos: "Gustos",
  datoCurioso: "Dato curioso",
} as const;

export const PISTAS_FISICO = {
  altura: ["baja", "media", "alta"],
  complexion: ["delgada", "atlética", "robusta"],
  cabello: ["negro", "castaño", "rubio", "rojo", "canoso", "calvo"],
  lentes: [true, false],
  barba: ["sin barba", "bigote", "barba corta", "barba larga"],
} as const;

export const PISTAS_PERSONALIDAD = {
  social: ["introvertido", "ambivertido", "extrovertido"],
  humor: ["negro", "blanco", "sarcástico", "tierno", "ninguno"],
  puntualidad: ["muy puntual", "puntual", "impuntual", "siempre tarde"],
  energia: ["tranquilo", "moderado", "intenso"],
} as const;

export const PISTAS_GUSTOS = {
  comida: ["pizza", "sushi", "asado", "pasta", "comida casera", "dulces"],
  musica: ["rock", "pop", "reggaetón", "clásica", "baladas", "indie"],
  hobby: ["leer", "deporte", "cocinar", "videojuegos", "viajar", "series"],
  lugar: ["playa", "montaña", "ciudad", "campo"],
} as const;

export const DATOS_CURIOSOS_SUGERIDOS = [
  "Siempre llevo algo rico para compartir.",
  "Canto aunque no me sepa la letra.",
  "Nunca digo que no a un postre.",
  "Soy quien toma las fotos familiares.",
  "Me sé los diálogos de mi película favorita.",
  "Tengo una planta con nombre propio.",
  "Siempre llevo un libro en la mochila.",
  "Me encanta organizar juegos en familia.",
  "Puedo pasar horas hablando de recetas.",
  "Decoro la casa apenas empieza diciembre.",
] as const;

export const CATALOGO_POR_DEFECTO: CatalogoPistas = {
  fisico: {
    altura: [...PISTAS_FISICO.altura], complexion: [...PISTAS_FISICO.complexion],
    cabello: [...PISTAS_FISICO.cabello], barba: [...PISTAS_FISICO.barba],
  },
  personalidad: {
    social: [...PISTAS_PERSONALIDAD.social], humor: [...PISTAS_PERSONALIDAD.humor],
    puntualidad: [...PISTAS_PERSONALIDAD.puntualidad], energia: [...PISTAS_PERSONALIDAD.energia],
  },
  gustos: {
    comida: [...PISTAS_GUSTOS.comida], musica: [...PISTAS_GUSTOS.musica],
    hobby: [...PISTAS_GUSTOS.hobby], lugar: [...PISTAS_GUSTOS.lugar],
  },
  datoCurioso: [...DATOS_CURIOSOS_SUGERIDOS],
};

export const MENSAJES = {
  SESION_EXPIRADA: "Tu sesión expiró. Vuelve a ingresar.",
  PIN_INCORRECTO: "Ese PIN no es correcto. Intenta de nuevo.",
  DATOS_INVALIDOS: "Revisa los datos ingresados.",
  FOTO_MUY_GRANDE: "La foto es muy grande. Usa una de menos de 10 MB.",
  FOTO_TIPO_INVALIDO: "Solo se aceptan imágenes JPG, PNG o WebP.",
  EVENTO_CERRADO: "El evento ya se cerró. ¡Nos vemos en la revelación!",
  JUEGO_INCOMPLETO: "Completa tus necesidades y pistas antes de continuar.",
  PISTAS_FALTANTES: "Completa tus pistas para que otros participantes puedan encontrarte.",
  ERROR_GENERICO: "Algo salió mal. Intenta de nuevo en un momento.",
} as const;

export const LIMITES = {
  MAX_FOTO_BYTES: 10 * 1024 * 1024,
  MAX_NECESIDADES: 10,
  MIN_NECESIDADES: 3,
  PIN_LONGITUD: 4,
} as const;

export type CategoriaPistas = keyof typeof CATEGORIAS_PISTAS;
export type Altura = (typeof PISTAS_FISICO.altura)[number];
export type Complexion = (typeof PISTAS_FISICO.complexion)[number];
export type Cabello = (typeof PISTAS_FISICO.cabello)[number];
export type Lentes = (typeof PISTAS_FISICO.lentes)[number];
export type Barba = (typeof PISTAS_FISICO.barba)[number];
export type Social = (typeof PISTAS_PERSONALIDAD.social)[number];
export type Humor = (typeof PISTAS_PERSONALIDAD.humor)[number];
export type Puntualidad = (typeof PISTAS_PERSONALIDAD.puntualidad)[number];
export type Energia = (typeof PISTAS_PERSONALIDAD.energia)[number];
export type Comida = (typeof PISTAS_GUSTOS.comida)[number];
export type Musica = (typeof PISTAS_GUSTOS.musica)[number];
export type Hobby = (typeof PISTAS_GUSTOS.hobby)[number];
export type Lugar = (typeof PISTAS_GUSTOS.lugar)[number];
export type DatoCuriosoSugerido = (typeof DATOS_CURIOSOS_SUGERIDOS)[number];
