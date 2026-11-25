"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Boton } from "@/componentes/ui/Boton";
import { Modal } from "@/componentes/ui/Modal";
import { conJSON, ErrorParticipante, pedir } from "./peticionesParticipante";

type Necesidad = { id: string; nombre: string };

/** Cambia o quita el regalo elegido desde el panel del participante. */
export function GestionarRegalo({ necesidades, regaloActual, puedeEditar }: {
  necesidades: Necesidad[]; regaloActual: Necesidad; puedeEditar: boolean;
}) {
  const router = useRouter();
  const [seleccion, cambiarSeleccion] = useState(regaloActual.id);
  const [guardando, cambiarGuardando] = useState(false);
  const [confirmarQuitar, cambiarConfirmarQuitar] = useState(false);
  const sinCambios = seleccion === regaloActual.id;

  async function cambiar() {
    if (sinCambios || guardando) return;
    cambiarGuardando(true);
    try {
      await pedir("/api/regalos/cambiar", conJSON("POST", { necesidadId: seleccion }));
      toast.success("Regalo actualizado.");
      router.refresh();
    } catch (fallo) {
      toast.error(fallo instanceof ErrorParticipante ? fallo.message : "No pudimos cambiar el regalo.");
    } finally {
      cambiarGuardando(false);
    }
  }

  async function quitar() {
    if (guardando) return;
    cambiarGuardando(true);
    try {
      await pedir("/api/regalos/cambiar", { method: "DELETE" });
      toast.success("Regalo quitado. Puedes elegir otro cuando quieras.");
      cambiarConfirmarQuitar(false);
      router.refresh();
    } catch (fallo) {
      toast.error(fallo instanceof ErrorParticipante ? fallo.message : "No pudimos quitar el regalo.");
    } finally {
      cambiarGuardando(false);
    }
  }

  if (!puedeEditar) return <p className="ayuda-participante">La elección está cerrada; ya no se puede cambiar.</p>;

  return <>
    <label className="mi-panel-cambiar">
      <span>Cambiar por otro regalo</span>
      <select value={seleccion} disabled={guardando} onChange={(evento) => cambiarSeleccion(evento.target.value)}>
        {necesidades.map((necesidad) => <option key={necesidad.id} value={necesidad.id}>{necesidad.nombre}</option>)}
      </select>
    </label>
    <div className="acciones-participante">
      <Boton variante="secundario" icono={Check} cargando={guardando} disabled={sinCambios} onClick={() => void cambiar()}>Guardar cambio</Boton>
      <Boton variante="fantasma" icono={Trash2} disabled={guardando} onClick={() => cambiarConfirmarQuitar(true)}>Quitar regalo</Boton>
    </div>
    <Modal abierto={confirmarQuitar} titulo="¿Quitar este regalo?" cerrable={!guardando} alCerrar={() => cambiarConfirmarQuitar(false)}>
      <p>Podrás elegir otro mientras el evento siga abierto.</p>
      <div className="acciones-participante">
        <Boton variante="fantasma" disabled={guardando} onClick={() => cambiarConfirmarQuitar(false)}>Conservar</Boton>
        <Boton variante="peligro" icono={RefreshCw} cargando={guardando} onClick={() => void quitar()}>Sí, quitarlo</Boton>
      </div>
    </Modal>
  </>;
}
