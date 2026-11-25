import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularCoincidencias, calcularCoincidenciaIndividual } from "./coincidencias";
import type { Pistas } from "@/tipos/pistas";

const pistas: Pistas = {
  fisico: { altura: "baja", complexion: "delgada", cabello: "negro", lentes: true, barba: "sin barba" },
  personalidad: { social: "introvertido", humor: "blanco", puntualidad: "puntual", energia: "tranquilo" },
  gustos: { comida: "pizza", musica: "rock", hobby: "leer", lugar: "playa" },
  datoCurioso: "Siempre llevo un libro.",
};
const distintas: Pistas = {
  fisico: { altura: "alta", complexion: "robusta", cabello: "canoso", lentes: false, barba: "barba larga" },
  personalidad: { social: "extrovertido", humor: "negro", puntualidad: "siempre tarde", energia: "intenso" },
  gustos: { comida: "sushi", musica: "pop", hobby: "viajar", lugar: "montaña" },
  datoCurioso: "Siempre llevo una cámara.",
};

test("Pistas idénticas: 14 aciertos y 100 puntos", () => {
  assert.deepEqual(calcularCoincidenciaIndividual(pistas, structuredClone(pistas)), { puntaje: 100, aciertos: 14, totalCampos: 14 });
});
test("Todos los campos distintos: cero puntos", () => {
  assert.deepEqual(calcularCoincidenciaIndividual(pistas, distintas), { puntaje: 0, aciertos: 0, totalCampos: 14 });
});
test("Siete coincidencias: 50 puntos", () => {
  const parciales = { ...distintas, fisico: pistas.fisico, personalidad: { ...distintas.personalidad, social: pistas.personalidad.social, humor: pistas.personalidad.humor } };
  assert.deepEqual(calcularCoincidenciaIndividual(pistas, parciales), { puntaje: 50, aciertos: 7, totalCampos: 14 });
});
test("Un acierto se redondea a 7.14 puntos", () => {
  const parciales = { ...distintas, datoCurioso: pistas.datoCurioso };
  assert.equal(calcularCoincidenciaIndividual(pistas, parciales).puntaje, 7.14);
});
test("El dato curioso exige igualdad exacta", () => {
  assert.equal(calcularCoincidenciaIndividual(pistas, { ...pistas, datoCurioso: pistas.datoCurioso.toUpperCase() }).aciertos, 13);
});
test("Orden descendente, empates estables y entradas intactas", () => {
  const candidatos = [{ participanteId: "primero", pistas: distintas }, { participanteId: "segundo", pistas }, { participanteId: "tercero", pistas }];
  const copia = structuredClone(candidatos);
  assert.deepEqual(calcularCoincidencias(pistas, candidatos).map((resultado) => resultado.participanteId), ["segundo", "tercero", "primero"]);
  assert.deepEqual(candidatos, copia);
});
test("Una lista vacía produce una lista vacía", () => {
  assert.deepEqual(calcularCoincidencias(pistas, []), []);
});
