"use client";

import Image from "next/image";
import { forwardRef, useEffect, useId, useRef, useState, type DragEvent, type MutableRefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Trash2 } from "lucide-react";
import { LIMITES, MENSAJES } from "@/lib/constantes";
import { usarReducirMovimiento } from "@/hooks/usarReducirMovimiento";
import { Boton } from "./Boton";
import { srcFoto } from "@/componentes/formularios/peticionesParticipante";

const tipos = ["image/jpeg", "image/png", "image/webp"];

type PropiedadesFoto = {
  archivo: File | null; url?: string; alElegir: (archivo: File) => void; alQuitar: () => void; deshabilitado: boolean; requerida?: boolean;
};

/** Selecciona una foto local. La subida solo se hace al guardar el formulario. */
export const SubidorFoto = forwardRef<HTMLInputElement, PropiedadesFoto>(function SubidorFoto({ archivo, url, alElegir, alQuitar, deshabilitado, requerida = false }, referencia) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const ayudaId = `${id}-ayuda`;
  const reducido = usarReducirMovimiento();
  const [preview, cambiarPreview] = useState<string>();
  const [arrastrando, cambiarArrastre] = useState(false);
  const [error, cambiarError] = useState("");
  useEffect(() => {
    if (!archivo) { cambiarPreview(undefined); return; }
    const local = URL.createObjectURL(archivo);
    cambiarPreview(local);
    return () => URL.revokeObjectURL(local);
  }, [archivo]);

  function elegir(archivos: FileList | null) {
    cambiarError("");
    if (deshabilitado || !archivos?.length) return;
    const foto = archivos[0];
    if (archivos.length !== 1) return cambiarError("Elige una sola foto.");
    if (!tipos.includes(foto.type)) return cambiarError(MENSAJES.FOTO_TIPO_INVALIDO);
    if (foto.size > LIMITES.MAX_FOTO_BYTES) return cambiarError(MENSAJES.FOTO_MUY_GRANDE);
    if (!foto.size) return cambiarError("La foto está vacía. Elige otro archivo.");
    alElegir(foto);
  }

  function soltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    cambiarArrastre(false);
    elegir(evento.dataTransfer.files);
  }

  const imagen = (archivo ? preview : undefined) ?? srcFoto(url);
  return <div>
    <p className="etiqueta-participante">Foto <span className="texto-suave">({requerida ? "obligatoria" : "opcional"})</span></p>
    <motion.div className={`zona-foto ${arrastrando ? "zona-foto-activa" : ""}`} animate={{ scale: !reducido && arrastrando ? 1.02 : 1 }}
      transition={{ duration: reducido ? 0 : .2 }}
      onDragOver={(evento) => { evento.preventDefault(); if (!deshabilitado) cambiarArrastre(true); }}
      onDragLeave={(evento) => {
        if (!(evento.relatedTarget instanceof Node) || !evento.currentTarget.contains(evento.relatedTarget)) cambiarArrastre(false);
      }}
      onDrop={soltar}>
      <AnimatePresence initial={false}>
        {imagen && <motion.div key={imagen} className="preview-foto" initial={{ opacity: 0, scale: reducido ? 1 : .94 }}
          animate={{ opacity: 1, scale: 1 }} exit={{ opacity: reducido ? 1 : 0 }}
          transition={{ duration: reducido ? 0 : .2 }}>
          <Image src={imagen} alt="Vista previa de la foto elegida" fill unoptimized sizes="(max-width: 520px) 90vw, 480px"
            onError={() => cambiarError("No pudimos mostrar esta foto. Puedes elegir otra.")} />
        </motion.div>}
      </AnimatePresence>
      <div className="acciones-participante">
        <Boton icono={ImagePlus} variante="fantasma" disabled={deshabilitado} onClick={() => input.current?.click()}>
          {imagen ? "Cambiar foto" : "Elegir foto"}
        </Boton>
        {imagen && <Boton icono={Trash2} variante="fantasma" disabled={deshabilitado}
          onClick={() => { alQuitar(); cambiarError(""); }}>Quitar foto</Boton>}
      </div>
      <input hidden type="file" accept={tipos.join(",")} disabled={deshabilitado} aria-required={requerida || undefined}
        aria-describedby={ayudaId} ref={(nodo) => {
          input.current = nodo;
          if (typeof referencia === "function") referencia(nodo);
          else if (referencia) (referencia as MutableRefObject<HTMLInputElement | null>).current = nodo;
        }}
        onChange={(evento) => { elegir(evento.currentTarget.files); evento.currentTarget.value = ""; }} />
      <p className="ayuda-participante" id={ayudaId}>También puedes arrastrar una foto. JPG, PNG o WebP, hasta {LIMITES.MAX_FOTO_BYTES / 1024 / 1024} MB.</p>
    </motion.div>
    {error && <p className="error-participante" role="alert">{error}</p>}
  </div>;
});
