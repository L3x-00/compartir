import type { EventoVista } from "@/hooks/usarSesion";

export type NecesidadRegalo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fotoUrl: string | null;
  linkReferencia: string | null;
};

export type EleccionRegalo = { destinatario: string; regalo: string };

export type Emparejamiento = {
  regaladorId: string;
  regaladorNombre: string;
  personaSecretaId: string | null;
  personaSecretaNombre: string | null;
  necesidadElegidaId: string | null;
  necesidadElegidaNombre: string | null;
};

export type DatosRevelacion =
  | { revelado: false; cerrado: false; fechaLimite: string }
  | { revelado: true; cerrado: true; emparejamientos: Emparejamiento[] };

export type MiRegalo = { necesidad: NecesidadRegalo; regalador: { participanteId: string; nombre: string; fotoUrl: string | null } };

export type ParticipantePanel = {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  esAdmin: boolean;
  tieneNecesidades: boolean;
  cantidadNecesidades: number;
  tienePistas: boolean;
  personaSecretaId: string | null;
  tieneRegaloSeleccionado: boolean;
  nombreRegalo: string | null;
  esPersonaSecretaDe: string | null;
};

export type ResumenAdmin = {
  evento: EventoVista;
  totalParticipantes: number;
  participantes: ParticipantePanel[];
  emparejamientosCompletos: number;
  regalosSeleccionados: number;
  participantesSinPistas: number;
  participantesSinNecesidades: number;
};
