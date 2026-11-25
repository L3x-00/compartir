import type { Pistas } from "@/tipos/pistas";

export type ResultadoCoincidencia = {
  participanteId: string;
  puntaje: number;
  aciertos: number;
  totalCampos: number;
};

export function calcularCoincidenciaIndividual(pistasJugador: Pistas, pistasCandidato: Pistas) {
  const coincidencias = [
    pistasJugador.fisico.altura === pistasCandidato.fisico.altura,
    pistasJugador.fisico.complexion === pistasCandidato.fisico.complexion,
    pistasJugador.fisico.cabello === pistasCandidato.fisico.cabello,
    pistasJugador.fisico.lentes === pistasCandidato.fisico.lentes,
    pistasJugador.fisico.barba === pistasCandidato.fisico.barba,
    pistasJugador.personalidad.social === pistasCandidato.personalidad.social,
    pistasJugador.personalidad.humor === pistasCandidato.personalidad.humor,
    pistasJugador.personalidad.puntualidad === pistasCandidato.personalidad.puntualidad,
    pistasJugador.personalidad.energia === pistasCandidato.personalidad.energia,
    pistasJugador.gustos.comida === pistasCandidato.gustos.comida,
    pistasJugador.gustos.musica === pistasCandidato.gustos.musica,
    pistasJugador.gustos.hobby === pistasCandidato.gustos.hobby,
    pistasJugador.gustos.lugar === pistasCandidato.gustos.lugar,
    pistasJugador.datoCurioso === pistasCandidato.datoCurioso,
  ];
  const aciertos = coincidencias.filter(Boolean).length;
  const totalCampos = 14;
  return { puntaje: Math.round((aciertos / totalCampos) * 10000) / 100, aciertos, totalCampos };
}

export function calcularCoincidencias(
  pistasJugador: Pistas,
  candidatos: Array<{ participanteId: string; pistas: Pistas }>,
): ResultadoCoincidencia[] {
  // sort es estable y se aplica sobre un array nuevo: conserva empates y entradas.
  return candidatos.map((candidato) => ({
    participanteId: candidato.participanteId,
    ...calcularCoincidenciaIndividual(pistasJugador, candidato.pistas),
  })).sort((primero, segundo) => segundo.puntaje - primero.puntaje);
}
