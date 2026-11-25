"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AvanceAutomatico } from "@/componentes/ui/AvanceAutomatico";
import { Boton } from "@/componentes/ui/Boton";
import { Entrada } from "@/componentes/ui/Entrada";
import { Modal } from "@/componentes/ui/Modal";
import { usarConfeti } from "@/hooks/usarConfeti";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { usarSonido } from "@/hooks/usarSonido";
import { mensajeParticipante, pedir } from "./peticionesParticipante";

const destino = "/participar/revelacion";

export function CerrarEvento({ doble = false, pendientes }: { doble?: boolean; pendientes?: { asignaciones: number; regalos: number } }) {
  const router = useRouter();
  const reducido = usarReducirMovimiento();
  const { lanzarConfeti } = usarConfeti();
  const { reproducir } = usarSonido();
  const [abierto, abrir] = useState(false);
  const [palabra, cambiarPalabra] = useState("");
  const [entendido, cambiarEntendido] = useState(false);
  const [guardando, cambiarGuardando] = useState(false);
  const [cerrado, cambiarCerrado] = useState(false);
  const [error, cambiarError] = useState("");
  const bloqueo = useRef(false);
  const celebrar = useRef(false);
  const hayPendientes = !!pendientes && (pendientes.asignaciones > 0 || pendientes.regalos > 0);
  const valido = (!doble || palabra.trim().toLocaleUpperCase("es") === "CERRAR") && (!hayPendientes || entendido);

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!valido || bloqueo.current || cerrado) return;
    bloqueo.current = true;
    cambiarGuardando(true);
    cambiarError("");
    try {
      await pedir("/api/admin/cerrar", { method: "POST" });
      celebrar.current = true;
      abrir(false);
    } catch (fallo) {
      const mensaje = mensajeParticipante(fallo, router.replace);
      cambiarError(mensaje);
      toast.error(mensaje);
      reproducir("error");
    } finally {
      bloqueo.current = false;
      cambiarGuardando(false);
    }
  }

  return <>
    {cerrado ? <><AvanceAutomatico mensaje="Continuando a la revelación" alAvanzar={() => router.replace(destino)} />
      <Link className="boton boton-dorado" href={destino}><Sparkles size={18} aria-hidden="true" /> Ver revelación</Link></> :
      <Boton variante="peligro" icono={Lock} onClick={() => { cambiarPalabra(""); cambiarEntendido(false); cambiarError(""); abrir(true); }}>
        {doble ? "Cerrar evento ahora" : "Cerrar evento"}
      </Boton>}
    <Modal abierto={abierto} titulo="¿Cerrar el evento?" cerrable={!guardando}
      alCerrar={() => { if (!bloqueo.current) abrir(false); }}
      alTerminarCierre={() => {
        if (!celebrar.current) return;
        celebrar.current = false;
        cambiarCerrado(true);
        toast.success("Evento cerrado. Ya puedes consultar los emparejamientos.");
        reproducir("acierto");
        void lanzarConfeti({ preset: "revelacion" });
      }}>
      <form className="admin-formulario" onSubmit={(e) => void confirmar(e)}>
        <p>Esta acción cierra la elección de regalos. Cada participante podrá seguir consultando su elección. El cierre es definitivo.</p>
        {hayPendientes && <>
          <p className="admin-aviso">{pendientes?.asignaciones} sin asignación · {pendientes?.regalos} sin regalo elegido</p>
          <label className="cerrar-entendido">
            <input type="checkbox" checked={entendido} onChange={(e) => cambiarEntendido(e.target.checked)} disabled={guardando} />
            Entiendo que esas personas quedarán pendientes en la revelación.
          </label>
        </>}
        {doble && <Entrada etiqueta="Escribe CERRAR para continuar" value={palabra}
          onChange={(e) => cambiarPalabra(e.target.value)} disabled={guardando} autoComplete="off" />}
        {error && <p className="error-participante" role="alert">{error}</p>}
        <div className="acciones-participante">
          <Boton variante="fantasma" disabled={guardando} onClick={() => abrir(false)}>Mantener abierto</Boton>
          <Boton type="submit" variante="peligro" icono={Lock} cargando={guardando} disabled={!valido}>Sí, cerrar el evento</Boton>
        </div>
      </form>
    </Modal>
  </>;
}
