import { NextResponse } from "next/server";
import { requiereAdmin, responderError } from "@/lib/auth";
import { cerrarEvento } from "@/lib/evento";

export async function POST() {
  try {
    const sesion = await requiereAdmin();
    return NextResponse.json({ ok: true, datos: await cerrarEvento(sesion.eventoId) });
  } catch (error) {
    return responderError(error);
  }
}
