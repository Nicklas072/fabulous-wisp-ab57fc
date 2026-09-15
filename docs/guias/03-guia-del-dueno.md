# 03 · Guía del dueño (panel de administración)

El panel es la cabina de mando del dueño. Desde acá se controla qué ve el mundo, qué se le prepara a cada cliente, y se lee toda la actividad del sitio. La clave de acceso de entrega es **`BASKULA2272`**.

## 1. Entrar al panel

Hay dos caminos, ambos terminan en el mismo lugar:

- **Desde el catálogo:** botón "Inicia sesión" → escribir la clave del panel (no distingue mayúsculas). El sistema detecta que es la clave del dueño, no de un cliente, y abre directamente el panel.
- **Directo a la dirección `/admin`** del sitio: aparece el candado de acceso, se escribe la clave y se entra.

La sesión del panel **sobrevive a la navegación**: la clave queda guardada en el navegador (localStorage), así que el dueño puede alternar entre su panel y el catálogo público sin volver a ingresarla. Mientras tenga sesión activa, el catálogo muestra el botón **"Mi panel"** en el encabezado para volver en un clic. Para cerrar la sesión, botón "Salir" del panel (esto limpia la clave guardada y la cookie de sesión).

## 2. Las cuatro pestañas

El panel se organiza en cuatro pestañas: **Clientes**, **Notas**, **Actividad** y **Configuración**. Encima de ellas hay una tarjeta destacada: **"Catálogo del sitio"**, con el contador en vivo "X de 1.510 piezas publicadas" y el botón grande **"Ver catálogo completo"**.

### Clientes

La lista de todos los clientes con sus métricas de un vistazo: visitas, favoritos guardados, piezas preparadas, notas pendientes (chip "N notas") y estado activo. En cada cliente se puede:

- **Crear** (botón "Nuevo cliente"): nombre (obligatorio), código de acceso (si se deja vacío se genera a partir del nombre), persona de contacto, teléfono y notas internas. El código se normaliza solo: mayúsculas, sin espacios ni tildes — escribir "caf 22" crea el código `CAF22`. Es la clave con la que ese cliente entrará al catálogo.
- **Ver el detalle**, que tiene a su vez sus propias pestañas:
  - **"Preparado para ti"** — el buscador de piezas para armar la selección del cliente: búsqueda por nombre, filtros por categoría y tono, y el interruptor "Solo disponibles". Al añadir una pieza **no disponible**, aparece un aviso claro ("Esta pieza no está disponible para el público") con las opciones *"Agregarlo al cliente de todas formas"* o *Cancelar*; las disponibles se añaden sin aviso. Las piezas se quitan con el tacho (siempre visible) y confirmación.
  - **Favoritos** — las piezas que el cliente marcó con corazón, con chips "No pública" si alguna dejó de estar publicada.
  - **Notas del cliente** — los mensajes que envió, con fecha y botón para eliminarlas al atenderlas.
- **Editar TODO** (incluido el código de acceso): si el código se cambia, el sistema valida que no lo use otro cliente y avisa que la clave anterior deja de funcionar.
- **Activar/desactivar** un cliente sin borrarlo (un cliente inactivo no puede entrar) y **eliminarlo** (borra en cascada sus favoritos, notas y registros).

### Notas (pestaña global)

Todas las notas de todos los clientes en una sola lista, las más recientes primero, con nombre, código, fecha y mensaje completo. El botón **"Ya la atendí"** elimina la nota una vez leída y respondida. Es la bandeja de entrada de la relación con los clientes.

### Actividad

La vista del conocimiento comercial, con cuatro tarjetas de resumen (clientes, ingresos, corazones guardados, descargas de PDF) y dos bloques:

- **"Actividad de cada cliente"** — tabla con ingresos totales, piezas guardadas (+) y quitadas (−), notas, descargas, favoritos actuales y última actividad. Tocar una fila filtra todo lo demás a ese cliente.
- **"Actividad reciente"** — la línea de tiempo de los últimos 150 eventos con icono y descripción por tipo: ingreso con código, guardó pieza (nombre), quitó pieza, envió nota (extracto), descargó su lista en PDF (con cantidad de referencias). Arriba hay un selector para filtrar por cliente.

Debajo permanece la lista de **listas compartidas**: cada vez que un cliente comparte su lista por WhatsApp, queda una copia en el panel con las piezas y cantidades de ese momento — útil para cotizar con exactitud lo que el cliente tenía en mente.

### Configuración

- **WhatsApp** de contacto (número al que salen los mensajes de los clientes) y mensaje predeterminado.
- **Cambiar la clave del panel**: alfanumérica de 4 a 16 caracteres. Recomendación práctica: cambiarla apenas recibir el paquete si se va a compartir la computadora.

## 3. El catálogo completo y la publicación

El botón "Ver catálogo completo (1.510)" abre la vista de gestión del catálogo total, con **dos modos**: grilla de tarjetas (24 por página) y tabla compacta (48 por página). Arriba hay pestañas **Todas / Públicas / Ocultas**, buscador por nombre, chips de categoría, de tono y de **disponibilidad** (Disponibles 717 / No disponibles 793), filtro por colección y cuatro órdenes. Cada pieza muestra su referencia de artículo — dato que solo existe en esta vista y en los listados del panel, nunca del lado del cliente.

**Publicar u ocultar se hace de tres maneras:**

1. **Por selección**: marcar casillas pieza por pieza (o "seleccionar página") → la barra flotante inferior muestra "N seleccionadas" → botón **Publicar** u **Ocultar**.
2. **Por pieza**: el icono del ojo en cada tarjeta alterna el estado de esa sola pieza.
3. **Desde la ficha**: si el dueño abre la ficha de una pieza oculta (los enlaces viejos funcionan para él), ve el rótulo "Oculta" y el botón **"Publicar ahora"**.

El contador del panel ("X de 1.510") se actualiza al instante, y la página pública refleja el cambio en la próxima recarga: no hay que esperar ni reconstruir nada. Los límites operativos del lote son de 2.000 piezas por acción, de sobra para este catálogo.

## 4. La regla de oro: público vs. oculto

Es la única regla conceptual que hay que interiorizar, porque gobierna todo el sistema:

- **`published` (pública/oculta)** lo controla el dueño: una pieza oculta no existe para el mundo — el catálogo no la lista, su ficha da "no encontrada" para cualquier persona y para todos los clientes, desaparece del "Preparado para ti" y de la "Mi lista" de cada cliente (sin perder los datos: al publicarse de nuevo, reaparece en todo, incluidos los corazones guardados).
- **`available` (disponible/consultar)** es el dato operativo del stock: la pieza se muestra, pero con la etiqueta "Consultar disponibilidad" en marrón en lugar de "Disponible" en verde.
- **El admin siempre ve todo**: la vista de 1.510, las fichas de piezas ocultas y todos los códigos. La restricción es únicamente hacia afuera.
