import { NextResponse } from "next/server";
import { cerrarSesion, responderError } from "@/lib/auth";

export async function POST() {
  try {
    await cerrarSesion();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return responderError(error);
  }
}
