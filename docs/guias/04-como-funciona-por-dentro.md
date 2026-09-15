# 04 · Cómo funciona por dentro (arquitectura técnica)

Esta documentación técnica describe la implementación completa. Está pensada para quien vaya a instalar, mantener o extender la herramienta.

## 1. Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 16** (App Router) + React 19 | Rutas de página y API en un solo proyecto |
| Lenguaje | TypeScript (estricto) | 0 errores de compilación en entrega |
| Estilos | Tailwind CSS 4 + shadcn/ui (Radix) | Componentes accesibles: Dialog, AlertDialog, Tabs, Select… |
| Datos | **Prisma 6 + SQLite** | Base única `db/custom.db` (~22 MB), sin servidor de BD externo |
| PDF | jspdf 4.2 (import dinámico) | El PDF de "Mi lista" se genera en el navegador, no en el servidor |
| Iconos / UX | Lucide React, framer-motion, sonner (toasts) | |
| Fuentes | Lora, Lexend Deca, Cormorant Garamond (Google Fonts vía next/font) | Identidad BasKula |

La home renderiza en el servidor un shell mínimo y el índice del catálogo se carga por API desde el cliente (arquitectura SPA deliberada): así los filtros y la búsqueda son instantáneos sobre los datos ya en memoria, sin recargar páginas.

## 2. Modelo de datos (Prisma)

| Modelo | Qué representa | Puntos clave |
|---|---|---|
| `Product` | Una pieza del catálogo (1.510) | ~35 campos: identidad (id VTEX, slug, nombre ES/PT, referencia), clasificación (colección, línea, material, grupo, tipo, color base/grupo/tono), medidas (Ø, alto, capacidad, piezas), `available` (disponible/consultar), `published` (pública/oculta), empaques, `descriptionEs`/`careEs`/`infoEs`, imágenes en JSON |
| `Client` | Un cliente con código (1: DEMO) | `code` único normalizado, nombre, contacto, teléfono, notas internas, `active`, `visitCount`, `lastVisit` |
| `Favorite` | Corazón de un cliente | Par único cliente+pieza, con `quantity` |
| `ClientNote` | Nota del cliente al asesor | Texto libre ≤2.000 caracteres, con fecha |
| `SharedList` + `ListItem` | Copia de una lista compartida | Snapshot al momento de compartir por WhatsApp; para cotizar |
| `Visit` | **Evento de actividad** | `type`: `login` \| `fav_add` \| `fav_remove` \| `note` \| `download`; `detail` descriptivo; índices por cliente+fecha y por tipo+fecha |
| `CuratedItem` | Pieza de "Preparado para ti" | Por cliente, con orden (`sort`) y nota opcional |
| `Setting` | Configuración clave-valor | `adminPin`, `whatsapp`, `whatsappMessage` |

Las relaciones usan `onDelete: Cascade`: eliminar un cliente borra sus favoritos, notas, selecciones y eventos.

## 3. Rutas API

### Públicas (sin identificación)

| Método y ruta | Función |
|---|---|
| `GET /api/catalog` | Índice compacto **solo de piezas publicadas** (alimentación de la grilla). `Cache-Control: no-store` + `force-dynamic`: publicar se refleja al recargar |
| `GET /api/products/[slug]` | Ficha completa + 8 sugerencias. Pieza oculta → 404 para el mundo; el admin la ve (con `published:false` para el rótulo "Oculta") |
| `GET /c/[code]` | Enlace legacy: identifica al cliente, cookie 1 año, redirect a `/?welcome=1&client=CODE` |
| `POST /api/shared-lists` | Crea la lista compartible desde los favoritos públicos del cliente |

### Cliente (identificación: header `x-client-code`, cookie `pb_client` o query `?code=`)

| Método y ruta | Función |
|---|---|
| `GET /api/client/[code]` | Valida el código, registra el ingreso (evento `login`, best-effort) y devuelve nombre/contacto |
| `GET /api/client/home` | Personalización: selección curada, 5 sugerencias, preview de favoritos (8) |
| `GET / POST / DELETE /api/client/favorites` | Lista / agregar-actualizar (rechaza ocultas) / quitar. Eventos `fav_add` / `fav_remove` |
| `GET / POST /api/client/notes` | Historial / enviar nota (evento `note` con extracto) |
| `POST /api/client/logout` | Limpia la cookie `pb_client` |
| `POST /api/client/activity` | Registra la descarga del PDF. **El detalle lo construye el servidor** (consulta real de favoritos) — el registro no se puede falsificar |

### Administración (header `x-admin-pin` o cookie `pb_admin`; todo lo demás responde 401)

| Método y ruta | Función |
|---|---|
| `POST / DELETE /api/admin/auth` | Validar clave (case-insensitive) + cookie 7 días / cerrar sesión |
| `GET /api/admin/catalog` | Índice completo de 1.510 con estado de publicación |
| `GET / POST / PATCH / DELETE /api/admin/clients` | Lista con métricas / crear / editar todo (valida unicidad de código) / eliminar |
| `GET / POST / DELETE /api/admin/curated` | Selección de un cliente / añadir (avisa si no pública) / quitar |
| `DELETE /api/admin/notes` | Eliminar una nota atendida |
| `GET / POST /api/admin/publish` | Contadores de publicación / publicar-ocultar por lote (≤2.000) e **invalida la caché** |
| `GET / POST /api/admin/settings` | Leer / actualizar WhatsApp y clave del panel (alfanumérica 4-16) |
| `GET /api/admin/activity` | Actividad completa: 150 eventos + resumen por cliente + listas compartidas + totales |

## 4. Identificación y seguridad

La herramienta está pensada para verse en contextos hostiles a las cookies (iframes, previews embebidos), así que **cada identidad tiene doble vía**:

- **Cliente:** el código se guarda en `localStorage` y viaja como header `x-client-code` en cada petición (`clientFetch`); además existe la cookie `pb_client` (vía legacy). El servidor acepta cualquiera de las dos.
- **Admin:** la clave del panel vive en `localStorage` y viaja como header `x-admin-pin` (`adminFetch`); la cookie `pb_admin` (7 días) funciona como respaldo. Las rutas admin validan contra el `adminPin` de la tabla `Setting` (comparación tolerante a mayúsculas).
- **Normalización de códigos:** los códigos de cliente se normalizan (trim, mayúsculas, sin tildes, `[A-Z0-9-]`) tanto en los formularios como en el servidor — "caf 22", "Café 22" y "CAF22" son el mismo código.
- **Anti-falsificación de métricas:** los detalles de los eventos de actividad los construye el servidor (por ejemplo, la descarga del PDF cuenta los favoritos reales en la BD).
- **Degradación tolerante:** si el registro de una visita o el cálculo de sugerencias fallan, el login no se rompe — las métricas son best-effort por diseño.

## 5. Rendimiento y caché

- **Índice público y completo en caché de servidor (5 min)** en `lib/catalog.ts`; `invalidateCatalogCache()` se llama al publicar/ocultar, de modo que el cambio es visible al instante.
- `/api/catalog` se sirve con `no-store` para que el navegador nunca cachee el estado de publicación.
- **Ficha de producto:** caché de módulo en el navegador + *prefetch* al pasar el mouse por una tarjeta + esqueleto estructural. Primera apertura ~0,8 s; aperturas siguientes ~0,17 s.
- Búsqueda y filtros corren **en memoria** sobre el índice ya descargado: respuesta instantánea, cero llamadas extra.

## 6. El motor de sugerencias

Dos motores, ambos en `lib/catalog.ts`:

- **"También te puede gustar" (5 sugerencias):** parte de TODOS los corazones del cliente (hasta 60; si no hay, de su selección curada). Puntúa el catálogo público así: misma colección +3, mismo grupo de color +2, mismo tipo +2, diámetro a ±2 cm +1; descarta lo ya guardado/curado y lo que puntúa <3. Sin corazones ni curación, no muestra nada.
- **"Piezas similares" en la ficha (8):** `getSuggestionsFor` puntúa colección +3, color +2, tipo +2, Ø exacto +2 / ±2 +1, línea +1, grupo +0,5; con tope de 2 por combinación colección+color para variedad.

## 7. El PDF de "Mi lista"

Se genera **en el navegador** con jspdf cargado por import dinámico (no engorda el bundle inicial). A4: encabezado BasKula + filete mostaza, bloque cliente/código/fecha, ítems numerados (nombre multilínea, Ø/piezas/colección, cantidad ×N, disponibilidad en verde/marrón), pie con total y "precios por canal comercial", paginación. Sin referencias ni precios. Al completarse, se llama a `POST /api/client/activity {type:"download"}` para dejar el evento registrado.

## 8. Responsive y accesibilidad

La interfaz fue verificada en escritorio (1280×900) y móvil (390×844): grillas adaptativas, filtros en drawer, ficha a 97 vw, corazones y tachos siempre visibles con área táctil ≥28 px, `aria-label` en controles de icono, foco y contraste cuidadas. El panel también es operativo en móvil.
