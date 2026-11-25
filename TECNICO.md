# Compartir Navideño — Documentación técnica

> Arquitectura, datos, API, animaciones, audio, configuración y despliegue.
> Estado funcional y decisiones de producto: [ESTADO.md](ESTADO.md) · Tareas abiertas: [PENDIENTE.md](PENDIENTE.md)

---

## 1. Stack

| Capa | Tecnología | Versión instalada | Uso |
|---|---|---|---|
| Framework | Next.js (App Router) | ^15.1.4 | Frontend y backend en un solo proyecto. |
| Lenguaje | TypeScript | ^5.7.3 | Tipado fuerte. |
| Estilos | Tailwind CSS + PostCSS | ^4.0.0 | Utilidades y tema. |
| Animaciones | Framer Motion | ^12.0.6 | Transiciones, piezas, ceremonia. |
| Confeti | canvas-confetti | ^1.9.3 | Celebraciones. |
| Sonido | howler.js | ^2.2.4 | Seis efectos de audio. |
| Datos | SQLite + Prisma | ^6.2.1 | Una base de archivo único. |
| Validación | Zod | ^3.24.1 | Formularios y fronteras de API. |
| Formularios | React Hook Form | ^7.54.2 | Pistas y formularios. |
| Iconos | lucide-react | ^0.469.0 | Iconografía. |
| Notificaciones | sonner | ^1.7.2 | Toasts. |
| Pruebas | `node:test` vía `tsx` | — | Algoritmo de coincidencias. |
| Despliegue | Railway | — | Host con volumen persistente. |

Descartados: PostgreSQL, Redux/Zustand, GraphQL, Firebase, Vercel (sin volumen gratuito), Docker local, WebSockets y cron jobs.

---

## 2. Arquitectura

Monolito fullstack: un proceso, una base de datos, un despliegue. Capas:

```
Navegador → Páginas/Componentes → fetch → Route Handlers (/api)
          → validación Zod → lógica en src/lib → Prisma Client → SQLite
```

Reglas: los componentes no acceden a Prisma; las páginas son delgadas; la lógica de negocio vive en `src/lib/`; cada respuesta es `{ ok: true, datos }` o `{ ok: false, error }` con códigos 200/400/401/403/404/500. El cliente nunca decide reglas de negocio.

### Estructura relevante

```
prisma/            esquema.prisma, semilla.ts, preparar-evento.ts
public/            uploads/, sonidos/ (6 efectos + navidad.mp3), fuentes SVG
src/app/(publico)/ portada, ingreso y participar/*
src/app/(administrador)/ panel/*
src/app/api/       Route Handlers
src/componentes/   ui/, layout/, navideno/, formularios/
src/lib/           prisma.ts, auth.ts, coincidencias.ts, archivos.ts, sonidos.ts,
                   constantes.ts, evento.ts, fechasEvento.ts, validaciones/
src/hooks/         usarSesion, usarSonido, usarSilencio, usarConfeti,
                   usarReducirMovimiento
src/tipos/         indice.ts, pistas.ts, final.ts
src/middleware.ts  protección de rutas de administración
```

Documento raíz: `ESTADO.md` (producto/estado), `TECNICO.md` (este archivo) y `PENDIENTE.md` (tareas abiertas).

---

## 3. Modelo de datos

Seis entidades en `prisma/esquema.prisma`:

| Entidad | Campos clave |
|---|---|
| `Evento` | `id`, `nombre`, `fechaLimite`, `cerrado`, timestamps. |
| `Participante` | `id`, `eventoId`, `nombre`, `pin`, `fotoUrl?`, `esAdmin`, `personaSecretaId?`, timestamps. |
| `Necesidad` | `id`, `participanteId`, `nombre`, `descripcion?`, `fotoUrl?`, `linkReferencia?`, timestamps. |
| `Pistas` | `id`, `participanteId` único, `datos` (JSON string), timestamps. |
| `RegaloSeleccionado` | `id`, `participanteId` único, `necesidadId` único, `creadoEn`. |
| `IntentoAdivinanza` | `id`, `participanteId`, `candidatoId`, `acierto`, `creadoEn`. |

_relaciones_: `Evento 1—N Participante`, `Participante 1—N Necesidad`, `Participante 1—1 Pistas`, `Participante 0..1—0..1 Participante` (persona secreta), `Necesidad 0..1—0..1 RegaloSeleccionado`.

_integridad_: `personaSecretaId` y `RegaloSeleccionado.necesidadId` son únicos; `@@unique([eventoId, nombre])`; cascadas al borrar evento o participante; índices en `eventoId`, `participanteId` e historial de intentos.

`Pistas.datos` guarda un JSON con `fisico`, `personalidad`, `gustos` y `datoCurioso`. Zod valida la estructura antes de persistir y exige que el dato curioso no esté vacío, para que las 14 respuestas cuenten realmente.

`src/lib/reglas.ts` centraliza `participacionCompleta()` y la usan `coincidencias`, `confirmar` y `seleccionar`. Las reglas ya no dependen del orden en que el cliente visitó las pantallas.

Semilla: `npm run db:seed` crea un evento con fecha futura, 5–8 participantes con PIN `1234`, tres necesidades por persona, pistas completas y un emparejamiento de ejemplo.

---

## 4. API (Route Handlers)

| Método y ruta | Función |
|---|---|
| `POST /api/auth/ingresar`, `GET /api/auth/sesion`, `POST /api/auth/salir` | Sesión por nombre y PIN. |
| `GET /api/participantes` | Evento activo y su fecha límite. |
| `POST /api/participantes` | Registro o reingreso por `FormData` con `nombre` y `foto`. La foto es obligatoria solo si no existe o no tiene imagen; al reingresar se conserva. |
| `GET /api/participantes/existe?nombre=` | Consulta ligera para saber si el nombre ya está registrado y tiene foto, sin crear sesión. |
| `GET/POST /api/necesidades`, `GET/PATCH/DELETE /api/necesidades/[id]` | CRUD de necesidades. |
| `POST /api/necesidades/subir-foto`, `GET /api/fotos/[archivo]` | Subida y servicio de imágenes. |
| `GET/POST /api/pistas`, `GET /api/pistas/[participanteId]` | Guardado y consulta de pistas. |
| `GET /api/adivinanza/candidatos`, `POST /api/adivinanza/coincidencias` | Top anónimo. |
| `POST /api/adivinanza/confirmar`, `POST /api/adivinanza/reintentar` | Asignación única y liberación. |
| `GET /api/regalos/necesidades-persona-secreta`, `POST /api/regalos/seleccionar`, `GET /api/regalos/mi-regalo` | Lista anónima, elección y resumen. |
| `GET /api/revelacion` | Estado del evento y emparejamientos tras el cierre. |
| `GET /api/admin/resumen`, `POST /api/admin/evento`, `POST /api/admin/cerrar` | Panel y configuración. Los totales excluyen al administrador. |
| `GET /api/admin/pistas`, `POST /api/admin/pistas` | Consulta y corrección de las 14 pistas; solo participantes, no el administrador. |
| `POST /api/admin/reasignar` | Asigna manualmente una persona secreta pendiente, sin duplicar candidatos. |
| `DELETE /api/fotos/[archivo]` | Borra solo imágenes no referenciadas, tras una subida fallida. |

Cada handler verifica sesión, valida el cuerpo con Zod y delega la lógica a `src/lib/`. Las rutas de admin también se protegen en `middleware.ts` y con comprobación de rol en servidor.

---

## 5. Autenticación, sesión y evento

- Sin email: el participante elige su nombre y confirma un PIN de 4 dígitos. El admin usa nombre y PIN propios (`PIN_ADMIN`).
- El PIN del administrador se guarda como `sal:hash` con `scrypt` (`src/lib/pin.ts`); la comparación usa `timingSafeEqual`. Si existe un PIN antiguo en texto, el primer ingreso lo acepta y lo migra a hash automáticamente.
- `/api/revelacion` exige administrador: los participantes reciben su ceremonia personal desde `/api/regalos/mi-regalo` y nunca el listado completo.
- La cookie firmada con `SECRETO_SESION` es `HttpOnly`, `SameSite=Lax` y `Secure` en producción; contiene el id del participante o el rol de administrador.
- `middleware.ts` intercepta `(administrador)/*` y `api/admin/*`; las rutas de participación validan la sesión dentro de la página con `cookies()`.
- Ciclo del evento: `CREADO → ABIERTO → CERRADO → REVELADO`. No hay cron: cada petición comprueba si `Date.now() > fechaLimite` y cierra/revela. El cierre manual pide escribir `CERRAR` como segunda confirmación.
- Las fechas se muestran y editan en hora de Lima (`America/Lima`) y se guardan en ISO con zona horaria.

---

## 6. Algoritmo de coincidencias

`src/lib/coincidencias.ts` compara 14 campos (5 físicos, 4 de personalidad, 4 de gustos y 1 dato curioso). Cada coincidencia exacta suma 1; el resultado se normaliza a 0–100 y se ordena de mayor a menor con desempate estable. El cliente recibe solo porcentaje e identificador anónimo, nunca las pistas reales del candidato. Siete pruebas automatizadas cubren identidad, diferencia total, mitad, redondeo, dato curioso exacto, orden/estabilidad y lista vacía.

---

## 7. Archivos e imágenes

- Subida por `FormData` a `/public/uploads` (o `CARPETA_FOTOS` en producción).
- Se aceptan `image/jpeg`, `image/png`, `image/webp`; máximo 10 MB; nombre generado con timestamp y aleatorio.
- La API valida MIME y tamaño; las fotos se sirven por `/api/fotos/[archivo]`.
- El registro de participantes usa el mismo `guardarFoto`: recibe `FormData`, exige la foto y, al reingresar con el mismo nombre, reemplaza y borra la foto anterior. Si la transacción falla, la imagen recién subida se elimina.
- `AvatarPersona` muestra la foto del registrado y cae a la inicial cuando no hay imagen (participantes de la semilla).
- En Railway se monta un volumen persistente; sin él, los archivos se pierden en cada deploy.
- Una necesidad ya elegida como regalo no puede borrarse.

---

## 8. Animaciones, movimiento y audio

### Movimiento
Framer Motion para transiciones y estados; canvas-confetti en hitos; CSS para nieve, estrellas y bucles; regalo SVG propio con IDs únicos. Presupuesto: 150–240 ms en controles, hasta 300 ms en pasos y modales, 650 ms en entrada del título, menos de 800 ms en celebraciones. `usarReducirMovimiento` combina preferencia del sistema, pausa manual y documento oculto; el confeti se bloquea con movimiento reducido.

Efectos destacados: regalo nevado con halo e inclinación de ratón; piezas que encajan con destello al completar pistas; envoltura de la tarjeta confirmada convertida en caja; bola de nieve agitables por toque o teclado; ceremonia con sobre, carta y confeti.

`Boton` centraliza la protección contra doble toque: ignora clics repetidos durante 400 ms, deshabilita el control mientras se procesa y libera el bloqueo en cuanto `cargando` vuelve a `false`. `AvanceAutomatico` sustituye las redirecciones silenciosas por una cuenta visible y cancelable; se usa al guardar pistas, elegir regalo, confirmar candidato, cerrar evento y guardar ajustes.

Los toasts de éxito son verdes y los de error rojos; el foco visible cubre también `select`, `textarea` y `[tabindex]`; la tarjeta de regalo completa es un `label` que selecciona el radio.

`src/lib/reglas.ts`, `src/lib/firmaSesion.ts` y `DELETE /api/fotos/[archivo]` completan la robustez: reglas en servidor, formato de cookie compartido entre Node y Edge y limpieza de fotos huérfanas. Los enlaces se validan con protocolo `http/https` y los límites salen de `LIMITES`.

### Audio
- Seis efectos originales: `click`, `error`, `acierto`, `revelacion`, `whoosh`, `encaje` (WAV con alternativa MP3 del mismo nombre).
- `usarSonido` usa Howler, carga solo archivos existentes y respeta la preferencia de silencio en `cn:silencio`; `usarSilencio` centraliza el estado con `useSyncExternalStore`, localStorage y el evento `cn:sonido`.
- **Música global**: `public/sonidos/navidad.mp3` se reproduce en bucle desde `ReproductorGlobal.tsx`, montado en `src/app/layout.tsx`, por lo que persiste en todas las rutas. Volumen inicial 16 % y rango 0–100 % guardado en `cn:volumen-musica`.
- El reproductor intenta `autoPlay` + `play()` al cargar, `pageshow`, `focus`, `visibilitychange` y ante el primer `pointerdown`, `keydown`, `touchstart` o `input`. Los navegadores bloquean el audio audible sin interacción: en visita nueva la música arranca con la primera interacción; en visitas con confianza previa puede arrancar sola.
- El control flotante ofrece **Pausar/Reanudar/Activar música** y un botón de volumen con deslizador accesible. El altavoz del encabezado silencia también la música.

---

## 9. Diseño de tokens

- Colores y mezclas canónicas en `src/app/globals.css` y `design-system/compartir-navidena/tokens.css`; la paleta y fuentes de `ESTADO.md` son normativas.
- Fuentes: `--font-mountains` (títulos) y `--font-nunito` (cuerpo), cargadas con `display: swap`.
- Breakpoints: 1023 px, 767 px y 374 px. Contenedor máximo de 1160 px con gutter fluido.
- Botones base de 48 px, campos de 59 px y controles de icono de al menos 44 px. Foco global de 2 px en dorado claro con separación de 5 px.
- Estados de carga, error, deshabilitado y éxito con texto, no solo color; `aria-invalid`, `role="alert"` y `aria-busy` donde corresponde.
- Se prohíben emoji como icono, paletas automáticas y fuentes sustitutas; se permite solo la paleta aprobada y sus `color-mix()`.

---

## 10. Configuración y comandos

Variables en `.env` (plantilla en `.env.example`):

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Ruta SQLite, por defecto `file:./dev.db`. |
| `SECRETO_SESION` | Firma de cookies; valor aleatorio largo y estable. |
| `NOMBRE_ADMIN`, `PIN_ADMIN` | Credenciales del organizador. |
| `NOMBRE_EVENTO`, `FECHA_LIMITE` | Primer evento; fecha ISO con zona horaria. |
| `PARTICIPANTES_JSON` | Lista opcional de nombres precargados. |
| `NEXT_PUBLIC_URL` | URL pública HTTPS. |
| `CARPETA_FOTOS` | Ruta de imágenes en producción. |

```powershell
Copy-Item .env.example .env
npm ci
npm run db:push
npm run db:preparar
npm run dev
```

Otros comandos: `npm run build` (incluye `prisma generate`), `npm run start`, `npm run db:seed`, `npm run db:studio`, `npx tsc --noEmit` y `npx tsx --test src/lib/coincidencias.test.ts`.

Para una demo con datos de ejemplo, usa una base separada (por ejemplo `DATABASE_URL="file:./demo.db"`) y ejecuta allí `db:push`, `db:seed` y `db:preparar`.

---

## 11. Despliegue

1. Repositorio conectado a Railway con Railpack y una sola réplica (SQLite).
2. Volumen montado en `/app/data`; `DATABASE_URL=file:/app/data/compartir.db` y `CARPETA_FOTOS=/app/data/fotos`.
3. Variables de entorno: `RAILPACK_NODE_VERSION=22`, `RAILPACK_PRUNE_DEPS=false`, `SECRETO_SESION`, `NOMBRE_ADMIN`, `PIN_ADMIN`, `NOMBRE_EVENTO`, `FECHA_LIMITE`, `PARTICIPANTES_JSON` y `NEXT_PUBLIC_URL`.
4. Build: `npm run build`. Start: `npm run db:push && npm run db:preparar && npm run start -- --hostname 0.0.0.0`.
5. La preparación es idempotente y conserva registros existentes. Probar primero en un servicio y volumen separados antes de compartir el enlace definitivo.

---

## 12. Decisiones registradas

| Decisión | Razón |
|---|---|
| Next.js en lugar de front+back separados | Un deploy, un repo, baja latencia. |
| SQLite en lugar de PostgreSQL | <30 usuarios, cero configuración, fácil respaldo. |
| Adivinanza por pistas, no sorteo | Es el corazón lúdico; algoritmo aislado y testeable. |
| Pistas fijas y 100 % selección | Usabilidad para familiares no técnicos y comparación sencilla. |
| PIN de 4 dígitos | Fricción mínima, seguridad suficiente para uso familiar. |
| Cookie firmada, no JWT ni tabla de sesiones | Simplicidad. |
| Sin cron para cerrar el evento | La fecha se comprueba en cada petición. |
| Volumen persistente en producción | Única forma de conservar fotos en un PaaS efímero. |
| Música en el layout raíz | Un solo reproductor compartido por todas las pantallas. |

Convenciones: carpetas kebab/camelCase, componentes en PascalCase, lógica en camelCase, constantes en MAYÚSCULAS, alias `@/* → src/*`, `use client` solo donde hay interactividad y `initial={false}` para que el contenido exista sin JavaScript.

---

## 13. Verificación técnica

- `npm run build`: correcto, 30 rutas, middleware de 34,4 kB; único aviso no bloqueante de Prisma sobre `package.json#prisma` (se migrará en Prisma 7).
- `npx tsc --noEmit`: sin errores.
- `npx tsx --test src/lib/coincidencias.test.ts`: 7/7.
- Prueba de integración sobre SQLite con datos reales: sesiones, roles, fotos, pistas, coincidencias, reintentos, regalo único, cierre automático y manual, revelación y resumen posterior al cierre.
- Servidor de producción local: `/` 200 con los controles de música y volumen, `/sonidos/navidad.mp3` 200 `audio/mpeg` (5.647.601 bytes).
- Auditoría estática: etiquetas, foco visible, temporizadores limpiados, carga diferida, consultas de contenedor y seis combinaciones de texto con contraste de tokens superior a 4.5:1.
