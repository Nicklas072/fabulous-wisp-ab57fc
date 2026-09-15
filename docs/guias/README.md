# Documentación de la herramienta BasKula

Esta carpeta contiene la documentación completa de **BasKula — Catálogo privado B2B**, la herramienta web del catálogo de vajillas para clientes gastronómicos. La documentación está escrita en español y cubre tanto la idea de negocio como el funcionamiento técnico del sistema en su totalidad.

## Cómo leer esta documentación

| Archivo | Contenido | Para quién |
|---|---|---|
| `01-la-idea.md` | Qué es la herramienta, a quién sirve, el problema que resuelve y sus 4 pilares de diseño | Todos |
| `02-guia-del-cliente.md` | Recorrido completo de lo que ve y hace un cliente: código, catálogo, corazones, Mi lista, PDF y notas | Dueño y asesor |
| `03-guia-del-dueno.md` | Recorrido completo del panel de administración: clientes, publicación del catálogo, notas, actividad y configuración | Dueño |
| `04-como-funciona-por-dentro.md` | Arquitectura técnica: stack, modelo de datos, las 17 rutas API, identificación, caché, motor de sugerencias y PDF | Desarrollador |
| `05-datos-y-estado-actual.md` | Origen de los datos y cifras exactas del estado en que se entrega la herramienta | Todos |
| `06-instalacion-y-despliegue.md` | Requisitos, pasos de instalación, scripts útiles, personalización y notas de despliegue | Desarrollador |

## Recomendación de orden de lectura

1. Empezá por `01-la-idea.md` para entender el propósito en dos minutos.
2. Seguí con `02-guia-del-cliente.md` y `03-guia-del-dueno.md` para conocer los dos roles del sistema.
3. Si vas a instalar, modificar o contratar mantenimiento del sitio, leé `04` y `06`.
4. `05` sirve como referencia rápida del estado de los datos de entrega.

## Dónde está el resto del paquete

- `manual/Manual-BasKula.pdf` — versión en PDF de toda esta documentación, con capturas reales de pantalla del sitio en funcionamiento. Es la forma más cómoda de leerla.
- `sitio/` — el código fuente completo de la herramienta (proyecto Next.js) con la base de datos SQLite incluida y lista para usar.
- `LEEME.txt` (en la raíz del paquete) — punto de partida con el mapa de carpetas y los primeros pasos.

## Datos de acceso de entrega

- Clave del panel de administración: `BASKULA2272` (se cambia desde la pestaña Configuración del propio panel).
- Cliente de demostración: código `DEMO`.
- WhatsApp configurado: +598 93 658 477.
