import Image from "next/image";
import { srcFoto } from "@/componentes/formularios/peticionesParticipante";
import { AvatarInicial } from "./AvatarInicial";

/** Muestra la foto del participante registrado y cae a la inicial si no tiene. */
export function AvatarPersona({ nombre, fotoUrl, grande = false }: { nombre: string; fotoUrl?: string | null; grande?: boolean }) {
  const fuente = srcFoto(fotoUrl);
  if (!fuente) return <AvatarInicial nombre={nombre} grande={grande} />;
  return <span className={grande ? "avatar-persona avatar-grande" : "avatar-persona"}>
    <Image src={fuente} alt="" fill unoptimized sizes="40px" />
  </span>;
}
