import type { Metadata, Viewport } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import { Toaster } from "sonner";
import { Gift, Info, TriangleAlert, CircleX } from "lucide-react";
import { Nieve } from "@/componentes/navideno/Nieve";
import { ReproductorGlobal } from "@/componentes/layout/ReproductorGlobal";
import { ProveedorSesion } from "@/hooks/usarSesion";
import { nombresSonido, type ArchivosSonido } from "@/lib/sonidos";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Compartir Navideño", template: "%s · Compartir Navideño" },
  description: "Un amigo secreto mágico para nuestra familia. Comparte tus deseos, descubre las pistas y prepara una sorpresa esta Navidad.",
  applicationName: "Compartir Navideño", manifest: "/manifest.json",
  icons: { icon: "/favicon.svg", apple: "/icon-192.png" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#165b33", colorScheme: "dark" };

export default function LayoutRaiz({ children }: Readonly<{ children: React.ReactNode }>) {
  const sonidos: ArchivosSonido = {};
  for (const nombre of nombresSonido) {
    const archivo = `${nombre}.mp3`;
    sonidos[nombre] = existsSync(path.join(process.cwd(), "public", "sonidos", archivo))
      ? `/sonidos/${archivo}` : `/sonidos/${nombre}.wav`;
  }
  return <html lang="es"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mountains+of+Christmas:wght@400;700&family=Nunito:wght@400..800&display=swap" />
  </head><body>
    <ProveedorSesion archivosSonido={sonidos}>
      <a href="#contenido" className="saltar-contenido">Saltar al contenido</a>
      <ReproductorGlobal />
      {children}<Nieve />
      <Toaster position="top-center" richColors theme="dark" closeButton icons={{ success: <Gift size={19} />, info: <Info size={19} />, warning: <TriangleAlert size={19} />, error: <CircleX size={19} /> }} toastOptions={{ duration: 4000, classNames: { toast: "toast-navidad", success: "toast-exito", info: "toast-info", warning: "toast-aviso", error: "toast-error" } }} />
    </ProveedorSesion>
  </body></html>;
}
