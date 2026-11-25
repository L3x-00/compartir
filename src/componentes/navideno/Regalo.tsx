"use client";

import { useId, useRef, type PointerEvent } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";

/** Regalo vectorial propio: caja lacada y cinta dorada, con IDs únicos para sus degradados. */
export function Regalo({ className = "", nevado = false }: { className?: string; nevado?: boolean }) {
  const id = useId().replaceAll(":", "");
  const referencia = useRef<SVGSVGElement>(null);
  const limites = useRef<DOMRect | null>(null);
  const visible = useInView(referencia);
  const reducido = usarReducirMovimiento();
  const horizontal = useMotionValue(0), vertical = useMotionValue(0);
  const rotateX = useSpring(vertical, { stiffness: 170, damping: 23 });
  const rotateY = useSpring(horizontal, { stiffness: 170, damping: 23 });
  const inclinable = nevado && !reducido;
  const flotando = !reducido && visible;

  function inclinar(evento: PointerEvent<SVGSVGElement>) {
    if (!inclinable || evento.pointerType !== "mouse") return;
    const caja = limites.current;
    if (!caja?.width || !caja.height) return;
    const x = (evento.clientX - caja.left) / caja.width - .5;
    const y = (evento.clientY - caja.top) / caja.height - .5;
    horizontal.set(Math.max(-7, Math.min(7, x * 12)));
    vertical.set(Math.max(-6, Math.min(6, -y * 10)));
  }

  return <motion.svg ref={referencia} className={`regalo ${className}`} viewBox="0 0 460 420" fill="none" role="img"
    aria-label={nevado ? "Regalo rojo con un lazo dorado y nieve sobre la tapa" : "Un regalo rojo con un gran lazo dorado"}
    style={inclinable ? { rotateX, rotateY, transformPerspective: 820 } : undefined}
    onPointerEnter={inclinable ? (evento) => { limites.current = evento.currentTarget.parentElement?.getBoundingClientRect() ?? null; } : undefined}
    onPointerMove={inclinable ? inclinar : undefined}
    onPointerLeave={inclinable ? () => { horizontal.set(0); vertical.set(0); } : undefined}
    animate={flotando ? { y: [0, -12, 0], rotate: [-3, 0, -3] } : { y: 0, rotate: -3 }}
    transition={flotando ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}>
    <defs>
      <linearGradient id={`${id}-caja`} x1="106" y1="190" x2="365" y2="380" gradientUnits="userSpaceOnUse"><stop stopColor="var(--color-navidad-rojo)" /><stop offset="1" stopColor="var(--color-navidad-rojo-oscuro)" /></linearGradient>
      <linearGradient id={`${id}-oro`} x1="145" y1="70" x2="285" y2="360" gradientUnits="userSpaceOnUse"><stop stopColor="var(--color-navidad-dorado-claro)" /><stop offset="0.5" stopColor="var(--color-navidad-dorado)" /><stop offset="1" stopColor="var(--color-navidad-dorado-claro)" /></linearGradient>
      {nevado && <>
        <radialGradient id={`${id}-luz`}>
          <stop stopColor="var(--color-navidad-dorado-claro)" stopOpacity=".68" />
          <stop offset=".56" stopColor="var(--color-navidad-dorado)" stopOpacity=".27" />
          <stop offset="1" stopColor="var(--color-navidad-dorado)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-nieve`} x2="0" y2="1">
          <stop stopColor="var(--color-navidad-nieve)" />
          <stop offset="1" stopColor="var(--color-navidad-nieve)" stopOpacity=".72" />
        </linearGradient>
      </>}
    </defs>
    {nevado && <ellipse cx="231" cy="374" rx="192" ry="37" fill={`url(#${id}-luz)`} />}
    <ellipse cx="235" cy="376" rx="145" ry="15" fill="var(--color-navidad-carbon)" opacity="0.22" />
    <g transform="rotate(-7 230 230)">
      <rect x="105" y="194" width="250" height="166" rx="10" fill={`url(#${id}-caja)`} />
      <path d="M342 205v144H117" stroke="var(--color-navidad-nieve)" strokeOpacity="0.1" strokeWidth="2" />
      <path d="M202 193h54v167h-54z" fill={`url(#${id}-oro)`} />
      <path d="M211 199v151" stroke="var(--color-navidad-nieve)" strokeOpacity="0.45" strokeWidth="2" />
      <rect x="93" y="165" width="274" height="47" rx="7" fill="var(--color-navidad-rojo)" />
      <path d="M101 172h257" stroke="var(--color-navidad-nieve)" strokeOpacity="0.23" strokeWidth="2" />
      <path d="M202 165h54v47h-54z" fill={`url(#${id}-oro)`} />
      {nevado && <g fill={`url(#${id}-nieve)`}>
        <path d="M93 165Q96 157 107 158Q117 151 132 157Q145 151 161 157Q182 151 194 158Q204 157 211 165V170Q204 174 197 170Q192 169 184 174Q176 175 169 171Q161 166 151 171Q143 177 137 172Q129 166 123 174Q117 181 112 174Q109 168 102 172Q94 173 93 168Z" />
        <path d="M250 166Q260 156 275 157Q293 150 307 158Q319 152 337 158Q354 152 363 160Q370 164 367 170Q361 175 355 170Q349 166 343 171Q338 179 330 174Q325 167 317 171Q306 176 299 171Q293 167 287 171Q280 176 273 171Q264 169 258 173Q252 173 250 169Z" />
        <circle cx="114" cy="181" r="2" /><circle cx="333" cy="181" r="1.8" />
      </g>}
      <path d="M225 162c-67-9-104-34-96-62 8-27 51-9 70 9 13 12 20 29 26 53Z" fill={`url(#${id}-oro)`} />
      <path d="M225 162c70-11 107-40 94-65-13-24-48-4-65 13-13 13-23 30-29 52Z" fill={`url(#${id}-oro)`} />
      <path d="M205 145c-43-8-66-25-61-36 6-13 32 1 44 13l17 23Zm39 0c41-10 67-29 60-40-7-10-29 3-43 17l-17 23Z" fill="var(--color-navidad-rojo-oscuro)" opacity="0.55" />
      <path d="m211 155-38 79 31-10 12 24 19-90m3-5 40 76-30-9-9 24-15-86" fill={`url(#${id}-oro)`} />
      <rect x="209" y="143" width="39" height="27" rx="12" fill="var(--color-navidad-dorado-claro)" />
      <path d="m297 226 11 8-1 35-36-3-5-27 31-13Z" fill="var(--color-navidad-nieve)" transform="rotate(13 285 245)" />
      <path d="m289 238 3 6 6 1-5 4 1 6-5-3-6 3 1-6-4-4 6-1 3-6Z" fill="var(--color-navidad-rojo)" />
    </g>
  </motion.svg>;
}
