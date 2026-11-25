"use client";

import { motion } from "framer-motion";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

/** La tapa desciende y el trazo dorado ata la caja en el momento de confirmar. */
export function CajaCierre({ animar = true }: { animar?: boolean }) {
  const reducido = usarReducirMovimiento();
  const enMovimiento = animar && !reducido;
  return <svg className="caja-cierre" viewBox="0 0 240 195" aria-hidden="true" fill="none">
    <rect x="50" y="88" width="140" height="89" rx="7" fill="var(--color-navidad-rojo-oscuro)" />
    <path d="M51 91h139v22H51Z" fill="var(--color-navidad-rojo)" />
    <path d="M110 90h20v87h-20Z" fill="var(--color-navidad-dorado)" />
    <motion.g initial={enMovimiento ? { y: -38, rotate: -7 } : false} animate={{ y: 0, rotate: 0 }}
      transition={enMovimiento ? { type: "spring", damping: 14, stiffness: 150, delay: .42 } : { duration: 0 }}>
      <rect x="43" y="74" width="154" height="23" rx="5" fill="var(--color-navidad-rojo)" />
      <path d="M110 74h20v23h-20Z" fill="var(--color-navidad-dorado-claro)" />
      <motion.path d="M120 74C82 74 70 58 79 45C89 31 112 44 120 74C129 44 151 33 161 46C169 60 153 74 120 74L101 97M120 74l20 23"
        stroke="var(--color-navidad-dorado-claro)" strokeWidth="5" strokeLinecap="round"
        initial={enMovimiento ? { pathLength: 0 } : false} animate={{ pathLength: 1 }}
        transition={{ duration: enMovimiento ? .42 : 0, delay: enMovimiento ? .66 : 0 }} />
    </motion.g>
  </svg>;
}
