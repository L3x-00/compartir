"use client";

import { useState } from "react";
import { ArrowRight, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { Boton } from "@/componentes/ui/Boton";
import { AvatarPersona } from "@/componentes/ui/AvatarPersona";
import type { ParticipantePanel } from "@/tipos/final";
import { conJSON, ErrorParticipante, pedir } from "./peticionesParticipante";

/** Cierra asignaciones pendientes cuando el reparto libre se quedó sin candidatos. */
export function ReasignarPendientes({ participantes, alAsignar }: {
  participantes: ParticipantePanel[]; alAsignar: () => void;
}) {
  const [elecciones, cambiarElecciones] = useState<Record<string, string>>({});
  const [guardando, cambiarGuardando] = useState("");
  const pendientes = participantes.filter((p) => !p.personaSecretaId);
  const disponibles = participantes.filter((p) => !p.esPersonaSecretaDe);

  if (!pendientes.length) return null;

  async function asignar(participanteId: string) {
    const candidatoId = elecciones[participanteId];
    if (!candidatoId || guardando) return;
    cambiarGuardando(participanteId);
    try {
      await pedir("/api/admin/reasignar", conJSON("POST", { participanteId, candidatoId }));
      toast.success("Asignación guardada.");
      alAsignar();
    } catch (fallo) {
      toast.error(fallo instanceof ErrorParticipante ? fallo.message : "No pudimos guardar la asignación.");
    } finally {
      cambiarGuardando("");
    }
  }

  return <section className="admin-reasignar" aria-labelledby="titulo-reasignar">
    <h3 id="titulo-reasignar"><UserRoundCheck size={18} aria-hidden="true" /> Asignaciones pendientes</h3>
    <p>Estas personas no encontraron candidato disponible. Elige a quién le regalarán.</p>
    <ul>
      {pendientes.map((persona) => {
        const opciones = disponibles.filter((p) => p.id !== persona.id);
        return <li key={persona.id}>
          <span className="admin-nombre"><AvatarPersona nombre={persona.nombre} fotoUrl={persona.fotoUrl} />{persona.nombre}</span>
          <ArrowRight size={16} aria-hidden="true" />
          <select aria-label={`Persona secreta para ${persona.nombre}`} value={elecciones[persona.id] ?? ""}
            onChange={(e) => cambiarElecciones((actual) => ({ ...actual, [persona.id]: e.target.value }))}>
            <option value="">Selecciona candidato</option>
            {opciones.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <Boton variante="secundario" icono={UserRoundCheck} cargando={guardando === persona.id}
            disabled={!elecciones[persona.id]} onClick={() => void asignar(persona.id)}>Asignar</Boton>
        </li>;
      })}
    </ul>
  </section>;
}
