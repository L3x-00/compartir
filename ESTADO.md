# Compartir Navideño — Estado actual del sistema

> Documento único de producto y estado. Última actualización: 25 de noviembre de 2026.
> Complementos: [TECNICO.md](TECNICO.md) · [PENDIENTE.md](PENDIENTE.md)

---

## 1. Resumen ejecutivo

**Compartir Navideño** es un sistema web privado de *amigo secreto* para una familia de menos de 30 personas. Cada participante publica sus deseos, describe su persona con pistas, adivina a quién le toca regalar y elige una necesidad de la lista de esa persona. Al cerrar el evento, el sistema revela los emparejamientos con una ceremonia animada.

**Estado: funcional y completo a nivel de código.** El recorrido principal está implementado, la compilación de producción pasa, las pruebas del algoritmo pasan y la integración se verificó con datos de prueba sobre SQLite. Falta la revisión visual en navegador y el despliegue real, detallados en [PENDIENTE.md](PENDIENTE.md).

La entrega y la apertura de los regalos **son presenciales**: el sistema entrega a cada participante un resumen con *a quién regalar* y *qué llevar* justo después de confirmar su elección, y ese resumen sigue disponible al volver a entrar, incluso tras el cierre.

---

## 2. Propósito, alcance y usuarios

### Propósito
Hacer que el intercambio sea divertido y anónimo durante el juego, con fricción mínima para familiares no técnicos y sin infraestructura adicional.

### Incluido
- Registro por **nombre + DNI de 8 dígitos + foto obligatoria**. El DNI es la clave del participante; al reingresar se pide el DNI, se conserva la foto y se abre su panel personal. PIN de 4 dígitos para el administrador.
- Acceso administrativo separado con nombre y PIN propios.
- Necesidades (mínimo 3 por persona) con nombre, descripción, foto opcional y enlace opcional.
- Pistas fijas e idénticas para todos: 14 campos en 4 secciones, 100 % selección.
- Adivinanza por coincidencia de pistas, con rompecabezas visual, top 3 anónimo, confirmación y reintento.
- Emparejamiento único: dos personas no pueden regalar a la misma.
- Elección de una sola necesidad de la persona secreta, sin revelar su nombre.
- Resumen personal con destinatario y regalo, consultable antes y después del cierre.
- Cierre automático por fecha límite o manual desde el panel.
- Revelación final con carta personal, emparejamientos y cierre festivo.
- Panel de administración con totales, búsqueda, filtros y parejas.
- Temática navideña, animaciones, efectos de sonido y música de fondo global.

### Fuera de alcance (por decisión)
Seguridad avanzada, email/SMS, recordatorios, exportación de datos, pantalla pública o proyector, pagos, app nativa, analíticas, multi-evento simultáneo, WebSockets e internacionalización.

### Roles
| Rol | Acceso |
|---|---|
| **Visitante** | Ve la portada y se registra por su nombre. |
| **Participante** | Gestiona sus necesidades y pistas, adivina, elige regalo y ve su resumen sin conocer identidades ajenas hasta la revelación. |
| **Administrador** | Ve todo, configura nombre y fecha, y cierra el evento. |

---

## 3. Flujo del juego

1. El administrador crea el evento y define la fecha límite.
2. Se comparte el enlace; cada persona elige su nombre y confirma su PIN.
3. Sube al menos tres necesidades (foto y enlace opcionales).
4. Completa las 14 pistas en cuatro secciones; al terminar cada sección su pieza encaja con un chasquido y un destello.
5. ARM el rompecabezas de pistas: selecciona rasgos, ve el top 3 anónimo con porcentajes y confirma a su persona secreta, o reintenta. Al confirmar, la identidad y la foto se revelan con una animación suave.
6. Ve las necesidades de esa persona y elige una. Al confirmar, la tarjeta se envuelve y se convierte en la caja de la pantalla de espera. Después puede cambiarla o quitarla desde su panel mientras el evento esté abierto.
7. Recibe un resumen con **a quién regalar** y **qué llevar**. Puede agitar la bola de nieve mientras espera; el reloj sigue visible.
8. Al vencer el plazo o cerrar el admin, se calculan los emparejamientos y se abre la revelación: carta personal, listado familiar y despedida.
9. La entrega y la apertura se hacen en persona.

---

## 4. Pantallas

| Ruta | Contenido |
|---|---|
| `/` | Portada: regalo SVG nevado con halo cálido e inclinación al cursor en escritorio, nieve, estrellas, reglas, fecha real del evento y acceso. |
| `/ingresar` | Registro por nombre, DNI de 8 dígitos y foto obligatoria (JPG/PNG/WebP, hasta 10 MB). Si el nombre ya existe, pide el DNI y abre el panel del participante; acceso administrativo aparte con PIN. |
| `/participar/necesidades` | Alta, edición y borrado de necesidades (mínimo 3), foto y enlace, progreso y vista previa. |
| `/participar/pistas` | Editor de 14 pistas en 4 pasos, borrador local, piezas del rompecabezas y contador. |
| `/participar/adivinar` | Rompecabezas, comparación anónima, top 3, confirmación y reintento. |
| `/participar/regalar` | Lista anónima de necesidades con foto/enlace, selección única, confirmación y envoltura animada. |
| `/participar/mi-panel` | Resumen editable del participante: perfil y foto, necesidades, 14 características, persona secreta con foto, regalo elegido (cambiar/quitar), DNI configurado y lo que recibe tras el cierre. |
| `/participar/revelacion` | Antes del cierre: resumen personal, caja, bola de nieve agitables y cuenta regresiva. Después: ceremonia personal para el participante (quién lo eligió y qué recibe) y emparejamientos completos solo para el administrador. |
| `/panel` | Totales, pendientes, tabla adaptable con foto de cada persona, búsqueda, filtros, emparejamientos y pestaña **Pistas** para corregir sus 14 características. |
| `/panel/evento` | Cambio de nombre y fecha en hora de Lima, vista previa y cierre con doble confirmación. |

---

## 5. Funcionalidades vigentes

- **Sesión**: cookie firmada `HttpOnly`/`SameSite=Lax`, PIN de 4 dígitos para el administrador, middleware para rutas de administración.
- **Foto del participante**: obligatoria en el registro nuevo; en el reingreso se conserva la guardada y solo se reemplaza si se elige una nueva. Se muestra en el panel. La foto anterior se elimina al reemplazarla.
- **Botones a prueba de doble toque**: todo botón del sistema bloquea pulsaciones repetidas durante 400 ms y se libera en cuanto termina una acción asíncrona.
- **Avance visible y cancelable**: después de guardar, una cuenta corta ofrece «Quedarse aquí» en vez de saltar sin aviso; funciona igual con movimiento reducido.
- **Ayudas concretas**: las pistas dicen qué campo falta, la adivinanza y el regalo muestran motivo y fecha límite cuando no hay opciones.
- **Reglas en servidor**: adivinar, confirmar y elegir regalo exigen al menos tres necesidades y las 14 pistas completas, aunque se llame a la API directamente.
- **Reasignación del organizador**: si el reparto libre deja personas sin candidato, el panel permite asignarlas manualmente.
- **Catálogo configurable**: el administrador puede editar desde el panel las opciones de todas las pistas (físico, personalidad, gustos y datos curiosos). Los formularios y las validaciones usan el catálogo vigente en cada momento.
- **Seguridad mínima**: PIN del administrador y DNI del participante hasheados; revelación completa restringida al panel; cada participante ve solo su propia ceremonia.
- **Persistencia al recargar**: nombre, DNI, pistas, borrador de necesidades y regalo seleccionado se guardan localmente y se restauran tras recargar. La foto del dispositivo no se puede conservar por seguridad del navegador y debe elegirse de nuevo si se recarga antes de guardar.
- **Detalles visuales**: los renos del cierre desfilan en un carrusel continuo, el regalo grande suelta chispas navideñas al tocarlo y la persona secreta se revela con foto y animación suave al confirmarla. Todo respeta movimiento reducido.
- **Responsividad**: diseño mobile-first de 320 px en adelante; tablas que se convierten en fichas, grillas adaptativas, controles táctiles de al menos 44 px y breakpoints unificados en 1024/768/375 px.
- **Corrección de pistas en el panel**: el administrador ve y edita las 14 pistas de cada familiar con controles nativos y guarda el cambio sin salir del panel.
- **Necesidades**: CRUD propio con validación Zod, subida JPG/PNG/WebP de hasta 10 MB, nombre de archivo generado, bloqueo de borrado si ya fue regalada.
- **Pistas**: 14 campos (físico, personalidad, gustos, dato curioso), guardado como JSON y validado en servidor.
- **Adivinanza**: puntaje 0–100 por coincidencia exacta, orden descendente con empates estables; el cliente solo ve porcentaje e identificador anónimo.
- **Regalo**: selección única persistida; al confirmar se reproduce el efecto de envoltura y se guarda el destinatario para el resumen.
- **Espera**: bola de nieve como botón accesible por teclado y toque; copos se levantan y vuelven a asentarse; reloj visible.
- **Cierre**: verificación lazy de `fechaLimite` en cada petición; cierre manual con confirmación; emparejamiento guardado.
- **Panel**: cuatro indicadores, tabla que pasa a fichas en contenedores estrechos y filtros por estado.
- **Audio**: seis efectos originales en WAV/MP3 y música de fondo `navidad.mp3` en bucle desde el layout raíz, con control de pausa y volumen (0–100 %, persistido en `cn:volumen-musica`). El altavoz del encabezado silencia todo el sistema.
- **Movimiento**: nieve, estrellas, flotación del regalo, encaje de piezas, confeti y ceremonia; siempre respeta `prefers-reduced-motion` y el control de pausa manual.

### Efectos añadidos al final del proyecto
| Pantalla | Efecto |
|---|---|
| Inicio | Nieve sobre la tapa, halo cálido bajo la caja e inclinación suave con el ratón en escritorio. |
| Pistas | Chasquido suave (`encaje.wav`) y destello dorado en el borde al completar una categoría. |
| Elección | La tarjeta elegida se envuelve y se convierte en la caja de la espera; el resumen personal aparece antes del encuentro. |
| Espera | Bola de nieve agitables con toque o teclado; copos y reloj simultáneos. |

---

## 6. Reglas de negocio

1. Entrada por enlace compartido, nombre y foto propia obligatoria; PIN de 4 dígitos para el administrador.
2. Emparejamiento por adivinanza de pistas, no por sorteo; se permite auto-regalo si el algoritmo lo arroja.
3. Reintento disponible si no se acierta; asignación única por persona.
4. Una persona elige una sola necesidad; un regalo no se elige dos veces.
5. Las necesidades de la persona secreta solo se muestran a quien le regala, sin revelar su nombre.
6. Edición permitida hasta el cierre; sin recordatorios ni bloqueos para participantes incompletos.
7. Fecha límite configurable y verificada en servidor en cada petición.
8. Revelación automática al cerrar; el administrador ve todo, los participantes solo lo que les corresponde.
9. Idioma español, tono familiar y experiencia mobile-first desde 320 px.

---

## 7. Identidad y experiencia

- **Paleta fija**: rojo `#c1121f`, rojo oscuro `#8b0a14`, verde `#165b33`, verde claro `#2a9d5c`, dorado `#f4c430`, dorado claro `#ffd966`, nieve `#f7f9fc`, carbón `#1a1a1a`, misterio `#2d1b3d`, misterio claro `#4a2d5e`.
- **Tipografías**: Mountains of Christmas para títulos festivos y Nunito para cuerpo y controles.
- **Componentes propios**: regalo SVG, caja de cierre, bola de nieve, rompecabezas, sobre y carta; iconos Lucide; toasts Sonner.
- **Accesibilidad**: foco visible dorado, controles nativos, `aria-label` en iconos, área táctil mínima de 44 px, navegación por teclado, textos de estado y movimiento reducido.
- **Comunicación de errores**: mensajes amigables, nunca técnicos; el error real se registra solo en servidor.

---

## 8. Calidad verificada

- `npm run build`: correcto, 30 páginas generadas y middleware compilado.
- `npx tsc --noEmit`: sin errores de tipos.
- `npx tsx --test src/lib/coincidencias.test.ts`: 7 pruebas, 7 superadas.
- Recorrido funcional con SQLite y datos de prueba: PIN, permisos, alta/edición/borrado con foto, pistas, coincidencias anónimas, exclusión de ocupados, reintento, regalo único, privacidad antes del cierre y revelación tras cierre manual o por fecha.
- Prueba en servidor de producción local: portada 200, controles de música y volumen presentes, `navidad.mp3` servido como `audio/mpeg`.
- Auditoría estática sin hallazgos P0/P1; contraste de tokens revisado por código.

La verificación visual real en navegador y el despliegue siguen pendientes en [PENDIENTE.md](PENDIENTE.md).

---

## 9. Glosario

| Término | Significado |
|---|---|
| Persona secreta | Participante a quien otro debe regalar, sin saberlo hasta la revelación. |
| Pistas | Rasgos físicos, personalidad, gustos y dato curioso que describen a un participante. |
| Rompecabezas | Interfaz de selección de pistas para adivinar la persona secreta. |
| Coincidencia | Puntaje de aciertos entre pistas jugadas y pistas reales. |
| Necesidad | Regalo deseado publicado por un participante. |
| Emparejamiento | Relación «X regala a Y» resultante de la adivinanza. |
| Revelación | Momento final en que se muestra quién regaló a quién. |
| Evento | Instancia activa del juego con nombre, fecha límite y estado. |

## Reglas de uso familiar y correcciones de backend

- El enlace se comparte dentro de la familia; el registro sigue disponible sin invitaciones individuales. Los intentos de PIN permanecen ilimitados por decisión del organizador.
- Conviene registrar a todos los familiares antes de empezar a elegir: cada elección comprueba que el reparto restante tenga solución. Una incorporación que dejaría a alguien sin destinatario se rechaza con un mensaje para el organizador. No se alteran regalos ya confirmados.
- Las mutaciones y el cierre se serializan en SQLite. Una operación que cruza la fecha límite se revierte. El reingreso sin cambios sigue permitido tras cerrar.
- Las sesiones expiran a los siete días en el servidor y se invalidan al salir o cambiar el PIN administrativo.
- Las 14 pistas son de catálogo cerrado también en la API y en el panel. Un dato curioso antiguo escrito libremente se conserva en la base, pero se debe volver a elegir entre las opciones para seguir jugando; los otros trece campos se recuperan en el editor.
- Las fotos tienen propietario y referencias registradas. Solo se asocian subidas propias; el borrado respeta imágenes compartidas y las necesidades elegidas como regalo.
- Máximo tres fotos pendientes por participante, quince archivos registrados y 100 MB por participante. Las imágenes huérfanas de más de 24 horas se limpian en la siguiente subida o preparación del evento, sin cron.
- Los cuerpos JSON y multipart están acotados; los datos inválidos devuelven 400 y los cuerpos excesivos 413.
