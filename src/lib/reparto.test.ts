import { test } from "node:test";
import assert from "node:assert/strict";
import { repartoCompletable } from "./reparto";

test("rechaza la segunda pareja que dejaría sola a la tercera persona", () => {
  const personas = [{ id: "a", personaSecretaId: "b" }, { id: "b", personaSecretaId: null }, { id: "c", personaSecretaId: null }];
  assert.equal(repartoCompletable(personas, { participanteId: "b", candidatoId: "a" }), false);
  assert.equal(repartoCompletable(personas, { participanteId: "b", candidatoId: "c" }), true);
});

test("acepta parejas recíprocas cuando los demás todavía pueden completar el reparto", () => {
  assert.equal(repartoCompletable([{ id: "a", personaSecretaId: "b" }, { id: "b", personaSecretaId: "a" }, { id: "c", personaSecretaId: null }, { id: "d", personaSecretaId: null }]), true);
});

test("coincide con la búsqueda exhaustiva para todos los repartos parciales de hasta cinco personas", () => {
  for (let n = 1; n <= 5; n++) {
    const ids = Array.from({ length: n }, (_, i) => String(i));
    function existe(destinos: (string | null)[], i = 0, usados = new Set<string>()): boolean {
      if (i === n) return true;
      return (destinos[i] ? [destinos[i]!] : ids).some((d) => d !== ids[i] && !usados.has(d) && existe(destinos, i + 1, new Set([...usados, d])));
    }
    function revisar(destinos: (string | null)[]) {
      if (destinos.length === n) {
        assert.equal(repartoCompletable(ids.map((id, i) => ({ id, personaSecretaId: destinos[i] }))), existe(destinos));
        return;
      }
      for (const d of [null, ...ids]) revisar([...destinos, d]);
    }
    revisar([]);
  }
});
