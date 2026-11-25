import type { PISTAS_FISICO, PISTAS_PERSONALIDAD, PISTAS_GUSTOS } from "@/lib/constantes";

export type PistasFisico = {
  altura: (typeof PISTAS_FISICO.altura)[number];
  complexion: (typeof PISTAS_FISICO.complexion)[number];
  cabello: (typeof PISTAS_FISICO.cabello)[number];
  lentes: boolean;
  barba: (typeof PISTAS_FISICO.barba)[number];
};

export type PistasPersonalidad = {
  social: (typeof PISTAS_PERSONALIDAD.social)[number];
  humor: (typeof PISTAS_PERSONALIDAD.humor)[number];
  puntualidad: (typeof PISTAS_PERSONALIDAD.puntualidad)[number];
  energia: (typeof PISTAS_PERSONALIDAD.energia)[number];
};

export type PistasGustos = {
  comida: (typeof PISTAS_GUSTOS.comida)[number];
  musica: (typeof PISTAS_GUSTOS.musica)[number];
  hobby: (typeof PISTAS_GUSTOS.hobby)[number];
  lugar: (typeof PISTAS_GUSTOS.lugar)[number];
};

export type Pistas = {
  fisico: PistasFisico;
  personalidad: PistasPersonalidad;
  gustos: PistasGustos;
  datoCurioso: string;
};
