/** Las opciones salen del catálogo configurable, así que se tipan como texto. */
export type PistasFisico = {
  altura: string;
  complexion: string;
  cabello: string;
  lentes: boolean;
  barba: string;
};

export type PistasPersonalidad = {
  social: string;
  humor: string;
  puntualidad: string;
  energia: string;
};

export type PistasGustos = {
  comida: string;
  musica: string;
  hobby: string;
  lugar: string;
};

export type Pistas = {
  fisico: PistasFisico;
  personalidad: PistasPersonalidad;
  gustos: PistasGustos;
  datoCurioso: string;
};
