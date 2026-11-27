/** Catálogo editable de opciones del formulario de pistas. */
export type CatalogoPistas = {
  fisico: { altura: string[]; complexion: string[]; cabello: string[]; barba: string[] };
  personalidad: { social: string[]; humor: string[]; puntualidad: string[]; energia: string[] };
  gustos: { comida: string[]; musica: string[]; hobby: string[]; lugar: string[] };
  datoCurioso: string[];
};
