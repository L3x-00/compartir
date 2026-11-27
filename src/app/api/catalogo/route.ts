import { NextResponse } from "next/server";
import { leerCatalogo } from "@/lib/catalogo";
import { requiereSesion, responderError } from "@/lib/auth";

/** Catálogo vigente para los formularios de pistas. */
export async function GET() {
  try {
    await requiereSesion();
    return NextResponse.json({ ok: true, datos: await leerCatalogo() });
  } catch (error) {
    return responderError(error);
  }
}
