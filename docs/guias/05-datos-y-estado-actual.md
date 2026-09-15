# 05 · Los datos incluidos y el estado actual

## 1. Origen del catálogo

Las 1.510 piezas provienen de la estructura de catálogo del proveedor de cerámica (plataforma VTEX, seis departamentos: platos, stoneware, complementos, conjuntos de té/café, colecciones y vajillas). Durante el desarrollo se construyó un pipeline de datos propio con estas etapas:

1. **Descarga estructurada** vía API con paginación: 1.510 productos únicos con imágenes de CDN redimensionadas y especificaciones extraídas de las tablas técnicas.
2. **Traducción al español**: nombres por reglas PT→ES refinadas en 5 rondas, más 822 descripciones únicas traducidas en lotes (traducción híbrida LLM + diccionario de reglas). Resultado: **1.508 piezas con descripción ES y 1.507 con cuidados ES**.
3. **Taxonomía de color**: 19 tonos calculados y acotados (máx. ~300 piezas por tono), con acabados separados (esmaltado, estampado) e inferencia por nombre y colección para las piezas "sin especificar".
4. **Rebranding completo**: los 2.528 textos que mencionaban al proveedor fueron reescritos a la voz BasKula.

El dataset consolidado (fuente para re-sembrar la base) se incluye en el paquete: `sitio/scripts/dataset_final.json`.

## 2. Cifras de entrega

| Dato | Valor |
|---|---|
| Piezas totales en la base | **1.510** (todas con imágenes) |
| Piezas disponibles (`available`) | 717 — el resto (793) figuran "Consultar disponibilidad" |
| Piezas publicadas (`published`) | **60** — la página pública muestra "60 piezas" |
| Publicadas por grupo | platos 27 · complementos 13 · té/café 10 · bowls 7 · vajillas 3 |
| Colecciones | 16 (AVANT GARDE, ESSENCIAS, HYGGE, SIGNATURE…) |
| Tonos de color | 19 con contadores honestos en la interfaz |
| Clientes | 1: **DEMO** (Restaurante La Demo), activo, 20 ingresos históricos |
| Selección curada | 1 pieza preparada para DEMO (demostración) |
| Listas compartidas | 1 (snapshot de demostración) |
| Favoritos / notas | 0 / 0 (base limpia) |
| Configuración | clave del panel `BASKULA2272` · WhatsApp `+598 93 658 477` |

Las 60 publicadas fueron elegidas con criterio curado: todas **disponibles y con imagen**, repartidas proporcionalmente entre todos los grupos y alternando colecciones dentro de cada grupo (script `scripts/publish_batch.mjs`, reutilizable).

## 3. Qué significa cada estado

- **Pública / Oculta** (`published`): decisión editorial del dueño. Oculta = no existe para el mundo exterior (ni catálogo, ni ficha, ni listas del cliente), pero se conserva en la base con todos sus datos y reaparece al publicarse.
- **Disponible / Consultar** (`available`): dato operativo. La pieza se muestra normalmente, solo cambia la etiqueta de estado. El panel filtra por esta dimensión al armar selecciones, y avisa antes de añadir una pieza no disponible a un cliente.

## 4. La base de datos del paquete

La entrega incluye `sitio/db/custom.db` (SQLite, ~22 MB) con el estado exacto descrito arriba. Es un solo archivo: **copiarlo es un backup completo** (clientes, corazones, notas, actividad, configuración). No requiere ningún motor externo, ni usuarios, ni contraseñas de base de datos — funciona con el archivo tal cual está.

Para volver a sembrar el catálogo desde el dataset (por ejemplo, en una base nueva): crear el esquema (`npx prisma db push`) y correr `sitio/scripts/seed.ts` con el `dataset_final.json` incluido. El seed es re-ejecutable: actualiza en lugar de duplicar.
