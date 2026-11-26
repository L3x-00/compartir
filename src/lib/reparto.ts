type PersonaReparto = { id: string; personaSecretaId: string | null };

/** Comprueba si se puede completar el reparto sin repetir destinatarios ni autorregalos. */
export function repartoCompletable(personas: PersonaReparto[], eleccion?: { participanteId: string; candidatoId: string }): boolean {
  const ids = new Set(personas.map((p) => p.id));
  const ocupados = new Set<string>();
  const pendientes: string[] = [];
  for (const persona of personas) {
    const destino = eleccion?.participanteId === persona.id ? eleccion.candidatoId : persona.personaSecretaId;
    if (!destino) { pendientes.push(persona.id); continue; }
    if (destino === persona.id || !ids.has(destino) || ocupados.has(destino)) return false;
    ocupados.add(destino);
  }
  const disponibles = [...ids].filter((id) => !ocupados.has(id));
  const asignados = new Map<string, string>();
  function buscar(jugador: string, visitados: Set<string>): boolean {
    for (const destino of disponibles) {
      if (destino === jugador || visitados.has(destino)) continue;
      visitados.add(destino);
      const anterior = asignados.get(destino);
      if (!anterior || buscar(anterior, visitados)) { asignados.set(destino, jugador); return true; }
    }
    return false;
  }
  return pendientes.every((jugador) => buscar(jugador, new Set()));
}
