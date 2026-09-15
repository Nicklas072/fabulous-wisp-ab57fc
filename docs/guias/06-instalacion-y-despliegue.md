# 06 · Instalación, personalización y despliegue

## 1. Qué hay en el paquete

```
BasKula-herramienta/
├── LEEME.txt                 ← punto de partida (mapa + primeros pasos)
├── manual/                   ← Manual-BasKula.pdf (+ versión HTML editable)
├── documentacion/            ← esta documentación en Markdown
└── sitio/                    ← LA HERRAMIENTA (proyecto Next.js completo)
    ├── package.json          ← dependencias y comandos
    ├── .env                  ← ruta de la base de datos (portátil)
    ├── prisma/schema.prisma  ← modelo de datos
    ├── db/custom.db          ← la base SQLite con TODO el estado actual
    ├── scripts/              ← seed.ts · publish_batch.mjs · update_admin_pin.ts · dataset_final.json
    ├── public/               ← logos BasKula y assets estáticos
    └── src/
        ├── app/              ← páginas (/, /admin) y las 17 rutas API
        ├── components/       ├── catalog/  (CatalogApp, filtros, ficha, login)
        │                     ├── favorites/ (Mi lista + PDF)
        │                     ├── admin/     (panel, catálogo completo, picker)
        │                     └── ui/        (componentes base shadcn/ui)
        └── lib/              ← db, catalog (motores), api-client, admin-auth
```

> **Nota:** `node_modules` (1,3 GB de dependencias) no viaja en el paquete por tamaño; `npm install` lo reconstruye idéntico usando el `package-lock.json` incluido.

## 2. Requisitos

- **Node.js 20 o superior** (probado con Node 24) — de nodejs.org o `nvm install 20`.
- ~2 GB libres de disco (por `node_modules`).
- Conexión a internet solo para la primera `npm install` y las fuentes de Google (Lora, Lexend, Cormorant), que se cachean en el navegador. El **catálogo funciona después sin internet externo**: las imágenes están referenciadas al CDN del proveedor, así que esas sí se benefician de conexión.

## 3. Puesta en marcha local (5 pasos)

```bash
cd sitio
npm install            # 1. dependencias (~2-4 min la primera vez)
npx prisma generate    # 2. genera el cliente Prisma (suele correr solo en el install)
npm run dev            # 3. abre http://localhost:3000
```

Para **producción local**:

```bash
npm run build          # 4. compila (crea .next/standalone)
npm start              # 5. sirve el build (usa bun .next/standalone/server.js)
```

> El comando `start` del `package.json` usa **bun** por el entorno original. Si preferís Node puro, cambiá la línea `"start"` por `"node .next/standalone/server.js"`, o serví el build con cualquier hosting Node. En desarrollo (`npm run dev`) no hace falta tocar nada.

**Verificación inmediata:** abrir `http://localhost:3000` → la home muestra "60 piezas"; botón "Inicia sesión" → `DEMO` entra como cliente, `BASKULA2272` abre el panel del dueño.

## 4. La base de datos y el archivo `.env`

El archivo `.env` del paquete ya viene portátil:

```
DATABASE_URL="file:../db/custom.db"
```

Esa ruta es relativa a `prisma/schema.prisma`, así que funciona en cualquier carpeta donde se descomprima el paquete. Si algún día querés apuntar a otra base (por ejemplo, una copia de prueba), se pone la ruta que sea — absoluta (`file:/ruta/a/prueba.db`) o relativa — y se reinicia el servidor.

**Backups:** copiar `sitio/db/custom.db` a otro lado. No hay más pasos: es un solo archivo con todo.

## 5. Scripts incluidos en `sitio/scripts/`

| Script | Para qué | Uso |
|---|---|---|
| `seed.ts` | Re-sembrar/actualizar el catálogo desde `dataset_final.json` | `npx tsx scripts/seed.ts` (re-ejecutable) |
| `publish_batch.mjs` | Publicar un lote curado de ~60 piezas variadas, disponibles y con imagen | `node scripts/publish_batch.mjs` |
| `update_admin_pin.ts` | Cambiar la clave del panel desde consola | `bun scripts/update_admin_pin.ts NUEVACLAVE` |

La clave del panel también se cambia desde **Configuración** del propio panel (sin consola), que es lo recomendado en operación normal.

## 6. Personalización habitual

- **Textos de la interfaz** (títulos, subtítulos, mensajes): viven directamente en los componentes de `src/components/` — editar y guardar; el servidor de desarrollo refleja el cambio al instante.
- **Marca y colores**: `src/app/globals.css` (variables `--background`, `--primary`, `--baskula-*`) y los logos de `public/`.
- **WhatsApp de contacto y clave del panel**: pestaña Configuración del panel (se guardan en la base, no en el código).
- **Metadatos del sitio** (título de pestaña, descripción): `src/app/layout.tsx`.

## 7. Ponerlo en internet (despliegue)

La herramienta es una aplicación Node estándar con una base SQLite de archivo, así que el despliegue más simple es un **VPS o hosting Node**:

1. Subir la carpeta `sitio/` (con `db/`) al servidor.
2. `npm install && npx prisma generate && npm run build`.
3. Servir el `standalone` con Node o bun detrás de un reverse proxy con **HTTPS** (se incluye un `Caddyfile` de ejemplo del proxy usado en el entorno original; Caddy gestiona el certificado solo).
4. Dominio propio apuntando al servidor. Recomendación: dejar `/admin` sin indexar (ya viene con `robots noindex`) y mantener `robots.txt` como está.
5. **Backup programado**: un copiado nocturno de `db/custom.db` (cron) alcanza para dormir tranquilo.

Para este volumen (miles de piezas, decenas de clientes), SQLite es más que suficiente y evita costo y complejidad de bases externas. Si el proyecto creciera mucho, el mismo esquema Prisma migra a PostgreSQL cambiando el `provider` y la `DATABASE_URL`.

## 8. Pruebas de que todo anda (chequeo rápido)

Después de instalar, esta secuencia de 2 minutos cubre el sistema entero:

1. Home anónima: búsqueda "platos llanos" → resultados al instante.
2. "Inicia sesión" → `DEMO` → chip de cliente visible, "Preparado para ti" con 1 pieza.
3. Corazón en cualquier pieza → "Mi lista" aparece el ítem → "Descargar" baja el PDF.
4. "Inicia sesión" → `BASKULA2272` → panel: contador "60 de 1.510 publicadas".
5. Panel → Actividad: se ven los eventos recientes del paso 2-3 (ingreso, guardó, descarga).
