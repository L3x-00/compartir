import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GET as revelacion } from "@/app/api/revelacion/route";
import { GET as miRegalo } from "@/app/api/regalos/mi-regalo/route";
import { Revelacion } from "@/componentes/navideno/Revelacion";
import { prisma } from "@/lib/prisma";
import type { DatosRevelacion, EleccionRegalo, MiRegalo } from "@/tipos/final";
import type { RespuestaAPI } from "@/tipos/indice";
import { sesionParticipante } from "../datos";

export const metadata: Metadata = { title: "Tu elección de regalo" };

export default async function PaginaRevelacion() {
  const sesion = await sesionParticipante(true);
  const seleccion = sesion.tieneRegaloSeleccionado ? await prisma.regaloSeleccionado.findUnique({
    where: { participanteId: sesion.participanteId, participante: { eventoId: sesion.evento.id } },
    select: { necesidad: { select: { nombre: true, participante: { select: { nombre: true } } } } },
  }) : null;
  const eleccion: EleccionRegalo | null = seleccion ? {
    destinatario: seleccion.necesidad.participante.nombre,
    regalo: seleccion.necesidad.nombre,
  } : null;

  if (!sesion.esAdmin) {
    if (!sesion.evento.cerrado) return <Revelacion evento={sesion.evento} eleccion={eleccion} />;
    const recibido = await miRegalo();
    if (recibido.status === 401) redirect("/ingresar");
    if (!recibido.ok && recibido.status !== 404) return <Revelacion evento={null} />;
    const regalo = await recibido.json() as RespuestaAPI<MiRegalo>;
    return <Revelacion evento={sesion.evento} eleccion={eleccion} soloPersonal
      ceremonia={{ emparejamientos: [], participanteId: sesion.participanteId, regalo: regalo.ok ? regalo.datos : null }} />;
  }

  const respuesta = await revelacion();
  if (respuesta.status === 401) redirect("/ingresar");
  const resultado = await respuesta.json() as RespuestaAPI<DatosRevelacion>;
  if (!resultado.ok) return <Revelacion evento={null} />;

  if (!resultado.datos.revelado) {
    return <Revelacion evento={{ ...sesion.evento, cerrado: false, fechaLimite: resultado.datos.fechaLimite }} eleccion={eleccion} />;
  }

  // Solo solicitamos el regalo personal tras el cierre. Un 404 es un estado normal del juego.
  const recibido = await miRegalo();
  if (recibido.status === 401) redirect("/ingresar");
  if (!recibido.ok && recibido.status !== 404) return <Revelacion evento={null} />;
  const regalo = await recibido.json() as RespuestaAPI<MiRegalo>;
  return <Revelacion evento={sesion.evento} eleccion={eleccion}
    ceremonia={{ emparejamientos: resultado.datos.emparejamientos, participanteId: sesion.participanteId, regalo: regalo.ok ? regalo.datos : null }} />;
}
