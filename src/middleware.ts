import { NextRequest, NextResponse } from "next/server";
import { esSesionValida, NOMBRE_COOKIE, separarCookie } from "@/lib/firmaSesion";

export async function middleware(peticion: NextRequest) {
  let administrador = false;
  let autenticado = false;
  try {
    const valor = peticion.cookies.get(NOMBRE_COOKIE)?.value;
    const secreto = process.env.SECRETO_SESION;
    const partes = valor ? separarCookie(valor) : null;
    if (partes && secreto) {
      const clave = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
      );
      const bytesFirma = Uint8Array.from(partes.firma.match(/.{2}/g)!, (par) => parseInt(par, 16));
      const valida = await crypto.subtle.verify("HMAC", clave, bytesFirma, new TextEncoder().encode(partes.contenido));
      if (valida) {
        const sesion: unknown = JSON.parse(partes.contenido);
        autenticado = esSesionValida(sesion);
        administrador = autenticado && (sesion as { esAdmin: boolean }).esAdmin === true;
      }
    }
  } catch {
    administrador = false;
    autenticado = false;
  }

  if (administrador) return NextResponse.next();
  if (peticion.nextUrl.pathname.startsWith("/api/admin")) {
    return NextResponse.json({ ok: false, error: "Inicia sesión como administrador para continuar." }, { status: autenticado ? 403 : 401 });
  }
  return NextResponse.redirect(new URL(autenticado ? "/participar/necesidades" : "/ingresar", peticion.url));
}

// (administrador) es un grupo de carpetas: su página real se publica en /panel.
export const config = { matcher: ["/panel/:path*", "/api/admin/:path*"] };
