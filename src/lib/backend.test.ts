import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, utimes, mkdir, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHmac } from "node:crypto";
import sharp from "sharp";

// Cada archivo de node:test tiene su proceso: nunca se utiliza la base familiar.
test("regresiones de backend con SQLite aislado", async (t) => {
  const carpeta = await mkdtemp(path.join(tmpdir(), "compartir-regresion-"));
  process.env.DATABASE_URL = `file:${path.join(carpeta, "test.db").replaceAll("\\", "/")}`;
  process.env.CARPETA_FOTOS = path.join(carpeta, "fotos");
  process.env.SECRETO_SESION = "secreto-sintetico-exclusivo-para-las-pruebas";
  Object.assign(globalThis, { AsyncLocalStorage });
  const resultado = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "push", "--schema", "prisma/esquema.prisma", "--skip-generate"], { encoding: "utf8", env: process.env });
  assert.equal(resultado.status, 0, resultado.stdout + resultado.stderr);
  const { prisma } = await import("./prisma");
  const { hashPin, verificarPin } = await import("./pin");
  const { conEventoAbierto, verificarCierreAutomatico } = await import("./evento");
  const { sincronizarPinAdmin } = await import("./admin");
  const { leerFoto, limpiarFotosVencidas, carpetaFotos, registrarFotosExistentes } = await import("./archivos");
  const { esquemaPistas } = await import("./validaciones/pistas");
  const { leerPistasCompletas, leerPistasParaEditar } = await import("./validaciones/adivinanza");
  const req = createRequire(import.meta.url);
  const { createRequestStoreForAPI } = req("next/dist/server/async-storage/request-store.js");
  const { workAsyncStorage } = req("next/dist/server/app-render/work-async-storage.external.js");
  const { workUnitAsyncStorage } = req("next/dist/server/app-render/work-unit-async-storage.external.js");
  const ruta = (nombre: string) => req(path.join(process.cwd(), "src/app/api", nombre, "route.ts"));
  const pistas = { fisico: { altura: "baja", complexion: "delgada", cabello: "negro", lentes: true, barba: "sin barba" }, personalidad: { social: "introvertido", humor: "blanco", puntualidad: "puntual", energia: "tranquilo" }, gustos: { comida: "pizza", musica: "rock", hobby: "leer", lugar: "playa" }, datoCurioso: "Siempre llevo algo rico para compartir." };
  const evento = await prisma.evento.create({ data: { nombre: "Familia de prueba", fechaLimite: new Date(Date.now() + 86400_000) } });
  const personas = [];
  for (const nombre of ["Organizador", "Persona A", "Persona B", "Persona C"]) personas.push(await prisma.participante.create({ data: { nombre, eventoId: evento.id, esAdmin: nombre === "Organizador", pin: hashPin(nombre === "Organizador" ? "7391" : "12345678"), pistas: { create: { datos: JSON.stringify(pistas) } }, necesidades: { create: [{ nombre: "Libro" }, { nombre: "Taza" }, { nombre: "Mochila" }] } } }));
  const [admin, a, b, c] = personas;
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).png().toBuffer();
  const archivo = () => new File([new Uint8Array(png)], "foto.png", { type: "image/png" });
  const json = (datos: unknown) => new Request("http://prueba.local/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(datos) });
  const form = (datos: Record<string, string | File>) => { const f = new FormData(); for (const [k, v] of Object.entries(datos)) f.set(k, v); return new Request("http://prueba.local/api", { method: "POST", body: f }); };
  type Persona = typeof a;
  function firmada(persona: Persona, extras = {}) {
    const contenido = JSON.stringify({ participanteId: persona.id, eventoId: evento.id, esAdmin: persona.esAdmin, exp: Date.now() + 7 * 86400_000, version: 0, ...extras });
    return "sesion_cn=" + encodeURIComponent(contenido + "." + createHmac("sha256", process.env.SECRETO_SESION!).update(contenido).digest("hex"));
  }
  async function llamar(fn: (...args: any[]) => any, persona: Persona | null, peticion = json({}), contexto?: unknown, cookie?: string) {
    const headers = new Headers(cookie ? { cookie } : persona ? { cookie: firmada(persona) } : {});
    const cookies: string[] = [];
    const store = createRequestStoreForAPI({ headers }, new URL(peticion.url), { tags: [], expirations: [] }, (valores: string[]) => cookies.push(...valores), {});
    const respuesta = await workAsyncStorage.run({ isStaticGeneration: false, route: "/api/prueba" }, () => workUnitAsyncStorage.run(store, () => fn(peticion, contexto)));
    return { respuesta, cookies };
  }
  const contexto = (id: string) => ({ params: Promise.resolve({ id }) });
  const contextoFoto = (url: string) => ({ params: Promise.resolve({ archivo: url.split("/").pop() }) });
  async function subir(persona: Persona) { return llamar(ruta("necesidades/subir-foto").POST, persona, form({ foto: archivo() })); }
  try {
    await t.test("PIN sin bloqueo y acceso administrativo restringido", async () => {
      for (let i = 0; i < 25; i++) assert.equal((await llamar(ruta("auth/ingresar").POST, null, json({ nombre: admin.nombre, pin: "0000" }))).respuesta.status, 401);
      assert.equal((await llamar(ruta("admin/resumen").GET, null)).respuesta.status, 401);
      assert.equal((await llamar(ruta("admin/resumen").GET, a)).respuesta.status, 403);
      const ingreso = await llamar(ruta("auth/ingresar").POST, null, json({ nombre: admin.nombre, pin: "7391" }));
      assert.equal(ingreso.respuesta.status, 200);
      assert.ok(ingreso.cookies.some((cookie) => cookie.includes("HttpOnly") && cookie.includes("SameSite=lax")));
      assert.equal((await llamar(ruta("admin/resumen").GET, null, json({}), undefined, ingreso.cookies.at(-1)!.split(";")[0])).respuesta.status, 200);
    });
    await t.test("JSON nulo, listas y textos devuelven 400; el enlace familiar sigue registrando", async () => {
      for (const cuerpo of [null, [], "texto"]) assert.equal((await llamar(ruta("participantes").POST, null, json(cuerpo))).respuesta.status, 400);
      const registro = await llamar(ruta("participantes").POST, null, form({ nombre: "Tia Familia", dni: "87654321", foto: archivo() }));
      assert.equal(registro.respuesta.status, 201);
      const tia = await prisma.participante.findFirstOrThrow({ where: { nombre: "Tia Familia" } });
      assert.ok(tia.fotoUrl);
      await prisma.participante.delete({ where: { id: tia.id } });
    });
    await t.test("catálogo estricto y recuperación editable de pistas antiguas", () => {
      const antiguas = { ...pistas, datoCurioso: "Texto que no pertenece al catálogo" };
      assert.equal(esquemaPistas.safeParse(antiguas).success, false);
      assert.equal(leerPistasCompletas(JSON.stringify(antiguas)), null);
      const editables = leerPistasParaEditar(JSON.stringify(antiguas));
      assert.deepEqual(editables?.fisico, pistas.fisico);
      assert.equal(editables?.datoCurioso, "");
    });
    await t.test("fotos falsas, exceso de tamaño y múltiples archivos se rechazan", async () => {
      const falso = await llamar(ruta("necesidades/subir-foto").POST, a, form({ foto: new File(["no soy PNG"], "falso.png", { type: "image/png" }) }));
      assert.equal(falso.respuesta.status, 400);
      const grande = new Request("http://prueba.local/api", { method: "POST", headers: { "content-length": String(12 * 1024 * 1024) }, body: "x" });
      assert.equal((await llamar(ruta("necesidades/subir-foto").POST, a, grande)).respuesta.status, 413);
      const f = new FormData(); f.append("foto", archivo()); f.append("foto", archivo());
      assert.equal((await llamar(ruta("necesidades/subir-foto").POST, a, new Request("http://prueba.local/api", { method: "POST", body: f }))).respuesta.status, 400);
    });
    await t.test("propiedad, cuotas, borrado y referencias de fotos", async () => {
      const urls: string[] = [];
      for (let i = 0; i < 3; i++) { const r = await subir(a); assert.equal(r.respuesta.status, 200); urls.push((await r.respuesta.json()).datos.url); }
      assert.equal((await subir(a)).respuesta.status, 409);
      assert.equal((await llamar(ruta("fotos/[archivo]").GET, b, json({}), contextoFoto(urls[0]))).respuesta.status, 404);
      assert.equal((await llamar(ruta("fotos/[archivo]").DELETE, b, json({}), contextoFoto(urls[0]))).respuesta.status, 404);
      assert.equal((await llamar(ruta("necesidades").POST, b, json({ nombre: "Foto ajena", fotoUrl: urls[0] }))).respuesta.status, 403);
      const necesidad = await prisma.necesidad.findFirstOrThrow({ where: { participanteId: a.id } });
      assert.equal((await llamar(ruta("necesidades/[id]").PUT, a, json({ nombre: necesidad.nombre, fotoUrl: urls[0] }), contexto(necesidad.id))).respuesta.status, 200);
      assert.equal((await llamar(ruta("necesidades/[id]").PUT, b, json({ nombre: "No permitido" }), contexto(necesidad.id))).respuesta.status, 403);
      assert.equal((await llamar(ruta("fotos/[archivo]").DELETE, a, json({}), contextoFoto(urls[0]))).respuesta.status, 409);
      await prisma.participante.update({ where: { id: a.id }, data: { fotoUrl: urls[0] } });
      const ingreso = await llamar(ruta("participantes").POST, null, form({ nombre: a.nombre, dni: "12345678", foto: archivo() }));
      assert.equal(ingreso.respuesta.status, 200);
      assert.ok(await leerFoto(urls[0].split("/").pop()!));
      assert.equal((await llamar(ruta("fotos/[archivo]").DELETE, a, json({}), contextoFoto(urls[1]))).respuesta.status, 200);
      assert.equal(await leerFoto(urls[1].split("/").pop()!), null);
      const vieja = path.join(carpetaFotos(), urls[2].split("/").pop()!);
      const antes = new Date(Date.now() - 2 * 86400_000); await utimes(vieja, antes, antes);
      await limpiarFotosVencidas();
      assert.equal(await prisma.foto.findUnique({ where: { url: urls[2] } }), null);
      assert.ok(await leerFoto(urls[0].split("/").pop()!));
    });
    await t.test("dos elecciones simultáneas nunca reservan el mismo destinatario", async () => {
      const resultados = await Promise.all([a, b].map((persona) => llamar(ruta("adivinanza/confirmar").POST, persona, json({ candidatoId: c.id }))));
      assert.deepEqual(resultados.map((r) => r.respuesta.status).sort(), [200, 409]);
      assert.equal(await prisma.participante.count({ where: { personaSecretaId: c.id } }), 1);
      await prisma.participante.updateMany({ where: { eventoId: evento.id }, data: { personaSecretaId: null } });
      await prisma.intentoAdivinanza.deleteMany();
    });
    await t.test("el reparto de tres personas no se bloquea y la confirmación es idempotente", async () => {
      const confirmar = async (p: Persona, d: Persona) => (await llamar(ruta("adivinanza/confirmar").POST, p, json({ candidatoId: d.id }))).respuesta;
      assert.equal((await confirmar(a, b)).status, 200);
      assert.equal((await confirmar(a, b)).status, 200);
      assert.equal(await prisma.intentoAdivinanza.count({ where: { participanteId: a.id } }), 1);
      const opciones = (await (await llamar(ruta("adivinanza/candidatos").GET, b)).respuesta.json()).datos;
      assert.deepEqual(opciones.map((p: { participanteId: string }) => p.participanteId), [c.id]);
      assert.equal((await confirmar(b, a)).status, 409);
      assert.equal((await llamar(ruta("admin/reasignar").POST, admin, json({ participanteId: b.id, candidatoId: a.id }))).respuesta.status, 409);
      assert.equal((await confirmar(b, c)).status, 200);
      assert.equal((await confirmar(c, a)).status, 200);
      const necesidad = await prisma.necesidad.findFirstOrThrow({ where: { participanteId: b.id } });
      assert.equal((await llamar(ruta("regalos/seleccionar").POST, a, json({ necesidadId: necesidad.id }))).respuesta.status, 200);
      assert.equal((await llamar(ruta("necesidades/[id]").DELETE, b, json({}), contexto(necesidad.id))).respuesta.status, 409);
      const ajena = await prisma.necesidad.findFirstOrThrow({ where: { participanteId: c.id } });
      assert.equal((await llamar(ruta("regalos/cambiar").POST, a, json({ necesidadId: ajena.id }))).respuesta.status, 403);
    });
    await t.test("una incorporación tardía no crea un participante sin destinatario", async () => {
      assert.equal((await llamar(ruta("participantes").POST, null, form({ nombre: "Familiar tardio", dni: "87654321", foto: archivo() }))).respuesta.status, 409);
      assert.equal(await prisma.participante.count({ where: { nombre: "Familiar tardio" } }), 0);
    });
    await t.test("una fecha ampliada no se cierra por una lectura anterior", async () => {
      const desactualizado = { ...evento, fechaLimite: new Date(Date.now() - 1) };
      assert.equal((await verificarCierreAutomatico(desactualizado)).cerrado, false);
    });
    await t.test("los cambios que cruzan la fecha límite se revierten", async () => {
      const nombre = evento.nombre;
      await assert.rejects(conEventoAbierto(evento.id, async (tx) => {
        await tx.evento.update({ where: { id: evento.id }, data: { nombre: "No debe guardarse", fechaLimite: new Date(Date.now() - 1) } });
      }), (error: any) => error.status === 403);
      assert.equal((await prisma.evento.findUniqueOrThrow({ where: { id: evento.id } })).nombre, nombre);
      const stream = new ReadableStream<Uint8Array>({ async pull(controlador) {
        await prisma.evento.update({ where: { id: evento.id }, data: { cerrado: true } });
        controlador.enqueue(new TextEncoder().encode(JSON.stringify({ ...pistas, datoCurioso: "Canto aunque no me sepa la letra." }))); controlador.close();
      } }, { highWaterMark: 0 });
      const lenta = new Request("http://prueba.local/api", { method: "POST", body: stream, duplex: "half" } as RequestInit);
      assert.equal((await llamar(ruta("pistas").POST, c, lenta)).respuesta.status, 403);
      assert.deepEqual(JSON.parse((await prisma.pistas.findUniqueOrThrow({ where: { participanteId: c.id } })).datos), pistas);
    });
    await t.test("el cierre bloquea necesidades, regalos, fotos y cambios administrativos", async () => {
      const necesidad = await prisma.necesidad.findFirstOrThrow({ where: { participanteId: a.id } });
      for (const [fn, p, data, ctx] of [
        [ruta("necesidades").POST, a, { nombre: "Nueva" }, undefined],
        [ruta("necesidades/[id]").PUT, a, { nombre: "Editada" }, contexto(necesidad.id)],
        [ruta("necesidades/[id]").DELETE, a, {}, contexto(necesidad.id)],
        [ruta("regalos/cambiar").DELETE, a, {}, undefined],
        [ruta("admin/pistas").POST, admin, { participanteId: a.id, pistas }, undefined],
        [ruta("admin/reasignar").POST, admin, { participanteId: a.id, candidatoId: b.id }, undefined],
      ] as const) assert.equal((await llamar(fn, p, json(data), ctx)).respuesta.status, 403);
      assert.equal((await llamar(ruta("participantes").POST, null, json({ nombre: a.nombre, dni: "12345678" }))).respuesta.status, 200);
      assert.equal((await llamar(ruta("participantes").POST, null, form({ nombre: a.nombre, dni: "12345678", foto: archivo() }))).respuesta.status, 403);
    });
    await t.test("la sesión expira y salir invalida la cookie copiada", async () => {
      const { obtenerSesion } = await import("./auth");
      assert.equal((await llamar(obtenerSesion, null, json({}), undefined, firmada(a, { exp: Date.now() - 1 }))).respuesta, null);
      const cookie = firmada(a);
      assert.ok((await llamar(obtenerSesion, null, json({}), undefined, cookie)).respuesta);
      assert.equal((await llamar(ruta("auth/salir").POST, null, json({}), undefined, cookie)).respuesta.status, 200);
      assert.equal((await llamar(obtenerSesion, null, json({}), undefined, cookie)).respuesta, null);
    });
    await t.test("las fotos antiguas y huérfanas se retiran del directorio público", async () => {
      const cwd = process.cwd();
      const anterior = process.env.CARPETA_FOTOS;
      const raiz = path.join(carpeta, "instalacion-antigua");
      const publica = path.join(raiz, "public", "uploads");
      await mkdir(publica, { recursive: true });
      const nombre = "100-abcdef12.png";
      const huerfana = "101-abcdef12.png";
      await writeFile(path.join(publica, nombre), png);
      await writeFile(path.join(publica, huerfana), png);
      await prisma.participante.update({ where: { id: b.id }, data: { fotoUrl: `/uploads/${nombre}` } });
      try {
        process.chdir(raiz); delete process.env.CARPETA_FOTOS;
        await registrarFotosExistentes();
        assert.deepEqual(await readdir(publica), []);
        assert.ok(await leerFoto(nombre)); assert.ok(await leerFoto(huerfana));
        assert.equal((await prisma.foto.findUniqueOrThrow({ where: { url: `/uploads/${nombre}` } })).propietarioId, b.id);
      } finally { process.chdir(cwd); process.env.CARPETA_FOTOS = anterior; }
    });
    await t.test("rotar el PIN invalida sesiones y repetir la configuración es idempotente", async () => {
      await prisma.$transaction((tx) => sincronizarPinAdmin(tx, admin.id, "8462"));
      const cambiado = await prisma.participante.findUniqueOrThrow({ where: { id: admin.id } });
      assert.ok(verificarPin(cambiado.pin, "8462")); assert.equal(cambiado.versionSesion, 1);
      assert.equal((await llamar(ruta("admin/resumen").GET, admin)).respuesta.status, 401);
      await prisma.$transaction((tx) => sincronizarPinAdmin(tx, admin.id, "8462"));
      assert.equal((await prisma.participante.findUniqueOrThrow({ where: { id: admin.id } })).versionSesion, 1);
    });
  } finally {
    await prisma.$disconnect();
    assert.equal(path.dirname(carpeta), path.resolve(tmpdir()));
    assert.ok(path.basename(carpeta).startsWith("compartir-regresion-"));
    await rm(carpeta, { recursive: true, force: true });
  }
});
