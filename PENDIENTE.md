# Compartir Navideño — Pendiente

> Tareas abiertas y limitaciones conocidas. Estado funcional: [ESTADO.md](ESTADO.md) · Detalle técnico: [TECNICO.md](TECNICO.md)
> Actualizado: 25 de noviembre de 2026.

---

## Prioridad alta

| Pendiente | Por qué importa | Cómo cerrarlo |
|---|---|---|
| **Revisión visual real en navegador** a 320, 375, 768, 1024 y 1440 px. | El Sprint A pasó validación funcional sobre base temporal, pero sigue sin acreditar contraste renderizado, solapamientos ni comportamiento táctil. | Abrir `npm run dev` en Chromium y revisar todas las rutas del [ESTADO.md](ESTADO.md) en esos anchos, con teclado y movimiento reducido. Incluir el registro con DNI, el error amigable de DNI incorrecto, el panel del participante, el carrusel de renos, las chispas del regalo, el avance cancelable y la revelación personal. |
| **Prueba del recorrido completo en el servicio de prueba** (ingreso, foto, pistas, adivinanza, regalo, cierre y revelación). | El recorrido se validó contra API y SQLite local, no en el entorno de despliegue. | Desplegar en Railway con volumen propio y ejecutar el guion de la sección «Guía rápida» que había en el antiguo reporte: preparar evento, entrar con participante, cerrar y comprobar carta y pendientes. |
| **Persistencia real en Railway**. | El volumen y las variables aún no se han ejercitado con datos de la familia. | Verificar que las fotos sobreviven a un redeploy y que `db:preparar` conserva registros y credenciales. |
| ✅ Sprints A, B, C y D ejecutados | Reingreso sin foto, totales sin administrador, revelación personal, regla de juego completa, reasignación, validaciones, PIN hasheado con migración y revelación restringida pasaron en base temporal. Compilación, tipos y 7/7 pruebas verdes. Queda la validación visual en navegador. | — |

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
