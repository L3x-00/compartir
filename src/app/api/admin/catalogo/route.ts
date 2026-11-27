import { NextResponse } from "next/server";
import { leerCatalogo, guardarCatalogo, esquemaCatalogo } from "@/lib/catalogo";
import { leerJSON, requiereAdmin, responderError } from "@/lib/auth";

export async function GET() {
  try {
    await requiereAdmin();
    return NextResponse.json({ ok: true, datos: await leerCatalogo() });
  } catch (error) {
    return responderError(error);
  }
}

export async function PUT(peticion: Request) {
  try {
    await requiereAdmin();
    const datos = esquemaCatalogo.parse(await leerJSON(peticion));
    const catalogo = await guardarCatalogo(datos);
    return NextResponse.json({ ok: true, datos: catalogo });
  } catch (error) {
    return responderError(error);
  }
}
