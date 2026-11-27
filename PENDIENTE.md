# Compartir Navideño — Pendiente

> Tareas abiertas y limitaciones conocidas. Estado funcional: [ESTADO.md](ESTADO.md) · Detalle técnico: [TECNICO.md](TECNICO.md)
> Actualizado: 26 de noviembre de 2026.

---

## Prioridad alta

| Pendiente | Por qué importa | Cómo cerrarlo |
|---|---|---|
| **Revisión visual real en navegador** a 320, 375, 768, 1024 y 1440 px. | El Sprint A pasó validación funcional sobre base temporal, pero sigue sin acreditar contraste renderizado, solapamientos ni comportamiento táctil. | Abrir `npm run dev` en Chromium y revisar todas las rutas del [ESTADO.md](ESTADO.md) en esos anchos, con teclado y movimiento reducido. Incluir el registro con DNI, el error amigable de DNI incorrecto, el panel del participante, cambiar/quitar regalo, la revelación animada con foto al confirmar, el carrusel de renos, las chispas del regalo, el avance cancelable y la revelación personal. |
| ✅ Despliegue en Railway y smoke test de producción | `https://compartir-production.up.railway.app` responde: `/` y `/ingresar` 200, API pública 200, assets 200, login admin 200 con PIN real, panel y revelación 200 con cookie, rutas protegidas sin sesión 307/401, fotos sin sesión 401 y con sesión 404, errores amigables y cookie `Secure; HttpOnly; SameSite=lax`. | — |
| **Prueba del recorrido completo con datos de la familia** (registro con DNI, foto, pistas, adivinanza, regalo, cierre y revelación). | El smoke test no creó participantes en producción; el recorrido completo se validó contra API y SQLite local. | Ejecutar el guion con 3–5 familiares reales en la URL de Railway. |
| **Persistencia real en Railway**. | El volumen y las variables están configurados, pero aún no se ha verificado con un redeploy y datos reales. | Subir una foto, hacer redeploy y comprobar que la foto y la base siguen ahí; verificar que `db:preparar` conserva registros y credenciales. |
| ✅ Auditoría por capas | Permisos, backend, frontend y persistencia revisados. Corregidos reasignación sobre asignaciones confirmadas, exposición de pistas reales, fotos sin sesión, admin como candidato, valores obsoletos tras guardar, DNI en `localStorage` y limpieza de borradores al salir. Verificado con dev server, tipos y 7/7 pruebas. No se ejecutó build completo por estar el dev abierto. | — |

## Prioridad media

| Pendiente | Detalle |
|---|---|
| **Contraste y teclado en navegador**. | Seis combinaciones de texto superan 4.5:1 por análisis de tokens; falta medir el render y recorrer formularios, modal y revelación solo con teclado. |
| **Firefox y Safari**. | Solo se ha comprobado la compilación y el servidor local en Chromium. Revisar audio, `dialog` y `color-mix()` en los otros navegadores. |
| **Detector de Impeccable desde npm**. | Está bloqueado por resolución DNS del registro. El detector local sí pasó sin hallazgos P0/P1; reintentar cuando haya red. |
| ✅ Historial de Git | Primer commit creado (`66b83f2`) con todo el sistema y la documentación consolidada. Árbol limpio. |

## Limitación conocida (no es una tarea de código)

- **Autoplay audible**: los navegadores impiden reproducir sonido sin una interacción previa. La música intenta arrancar al cargar, al enfocar la pestaña y ante el primer clic, toque, tecla o ajuste de volumen; en visita nueva necesita esa primera interacción. Para un kiosco con cero interacción haría falta lanzar el navegador con `--autoplay-policy=no-user-gesture-required` o configurar el sitio como fuente permitida. No se puede saltar esta regla desde una web normal.
- **Sin pantalla pública ni exportación**: decisiones de alcance, no tareas pendientes.

## Fuera del alcance

No se hará: email/SMS, recordatorios automáticos, multi-evento, roles complejos, WebSockets, análisis externo, pagos, app nativa ni internacionalización. Cualquier cambio de alcance debe registrarse primero en [ESTADO.md](ESTADO.md).

Los archivos `.md` dentro de `.agents/skills/` y `dashboard-design-skill/` se conservan por decisión del usuario: son definiciones de las skills instaladas, no documentación del proyecto.

## Alcance familiar confirmado

Los intentos de PIN sin límite y el acceso mediante el enlace compartido con la familia son decisiones aceptadas, no bloqueantes pendientes. Las correcciones de reparto, cierre, sesiones, archivos y validación se comprueban con `npm test`. Sigue pendiente probar el recorrido y la persistencia del volumen en Railway.
