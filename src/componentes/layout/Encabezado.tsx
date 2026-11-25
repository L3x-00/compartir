"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { LogOut, Volume2, VolumeX, Pause, Play, ArrowUpRight, Crown } from "lucide-react";
import { toast } from "sonner";
import { usarSesion } from "@/hooks/usarSesion";
import { usarSonido } from "@/hooks/usarSonido";
import { usarReducirMovimiento, usarPausaManual } from "@/hooks/usarReducirMovimiento";

/** Navegación pequeña y controles explícitos para sonido y movimiento. */
export function Encabezado() {
  const { sesion, cerrar } = usarSesion(); const { silenciado, silenciar } = usarSonido();
  const pausado = usarPausaManual(); const [saliendo, cambiarSalida] = useState(false);
  const reducido = usarReducirMovimiento(); const { scrollY } = useScroll();
  const espacio = useTransform(scrollY, [0, 100], [22, 13]);
  const pausar = () => { document.documentElement.dataset.movimiento = pausado ? "activo" : "pausado"; window.dispatchEvent(new Event("cn:movimiento")); };
  const salir = async () => { cambiarSalida(true); try { await cerrar(); } catch { toast.error("No pudimos cerrar la sesión. Intenta otra vez."); } finally { cambiarSalida(false); } };
  return <motion.header className="encabezado" style={{ paddingBlock: reducido ? 16 : espacio }}>
    <div className="contenedor encabezado-interior">
      <Link href="/" className="marca" aria-label="Compartir Navideño, inicio"><Image src="/logo.svg" alt="" width={42} height={42} priority /><span>Compartir<span className="marca-segunda">Navideño</span></span></Link>
      <nav className="encabezado-acciones" aria-label="Navegación principal">
        <Link className="enlace-como" href="/#como-funciona">Cómo funciona</Link>
        {sesion?.esAdmin && <Link className="control-icono" href="/panel" aria-label="Panel de administrador"><Crown size={18} aria-hidden="true" /></Link>}
        <button className="control-icono" type="button" aria-label={silenciado ? "Activar sonido" : "Silenciar sonido"} onClick={silenciar}>{silenciado ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}</button>
        <button className="control-icono" type="button" aria-label={pausado ? "Reanudar efectos" : "Pausar efectos"} onClick={pausar}>{pausado ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}</button>
        {sesion ? <><span className="nombre-sesion">{sesion.nombre}</span><button type="button" className="control-icono" disabled={saliendo} aria-label="Cerrar sesión" onClick={() => void salir()}><LogOut size={19} aria-hidden="true" /></button></> : <Link href="/ingresar" className="enlace-ingresar">Ingresar <ArrowUpRight size={15} aria-hidden="true" /></Link>}
      </nav>
    </div>
  </motion.header>;
}
