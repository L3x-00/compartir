import type {
  Evento,
  Participante,
  Necesidad,
  Pistas as PistasDB,
  RegaloSeleccionado,
  IntentoAdivinanza,
} from "@prisma/client";

export type { Evento, Participante, Necesidad, PistasDB, RegaloSeleccionado, IntentoAdivinanza };
export type { Pistas, PistasFisico, PistasPersonalidad, PistasGustos } from "./pistas";

export type ParticipantePublico = Pick<Participante, "id" | "nombre">;

export type RespuestaAPI<T = unknown> =
  | { ok: true; datos: T }
  | { ok: false; error: string };
