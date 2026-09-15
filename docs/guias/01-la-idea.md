# 01 · La idea

## Qué es

**BasKula — Catálogo privado B2B** es la herramienta web del catálogo de vajillas de cerámica de BasKula (Punta Piedras, Uruguay). No es una tienda online: no hay precios, no hay carrito y no hay compras. Es un **catálogo de consulta y armado de listas** pensado para la relación comercial entre el dueño de BasKula y sus clientes gastronómicos — restaurantes, cafeterías, hoteles, casas de banquetes y tiendas del rubro Horeca.

El catálogo contiene **1.510 piezas** de vajilla de cerámica (stoneware y loza) organizadas en 16 colecciones, con fichas completas en español: fotografías, dimensiones, capacidad, composición de los sets, descripción, cuidados, datos de empaque y disponibilidad. Sobre ese catálogo funciona un sistema de acceso privado con código por cliente y un panel de administración para el dueño.

## El problema que resuelve

Antes de existir esta herramienta, el trabajo de catálogo se hacía de la manera clásica: PDFs sueltos que viajan por WhatsApp o correo, planillas desactualizadas y fotos sueltas. Esa forma de trabajar tiene cuatro problemas concretos que la herramienta ataca de frente.

**Primero, falta de control.** Cuando todos reciben el mismo PDF, todos ven todo: líneas que quizás no se quieren mostrar todavía, piezas discontinuadas, códigos de artículo del fabricante que exponen el canal de abastecimiento. En esta herramienta, en cambio, la página pública solo muestra lo que el dueño decide publicar, y cada cliente entra con su propio código. Publicar u ocultar una pieza toma un clic y el cambio es inmediato para todos los visitantes.

**Segundo, cero seguimiento.** Con un PDF enviado por WhatsApp no hay forma de saber si el cliente lo abrió, qué piezas le interesaron ni qué está pensando pedir. Acá, cada acción del cliente deja registro: sus ingresos, las piezas que guardó o quitó de su lista, las notas que le escribe al asesor y las descargas de su lista en PDF. Ese historial convierte la próxima conversación comercial en una conversación informada.

**Tercero, desorden en la consulta.** Los mensajes con consultas ("¿tenés algo azul de 26 cm?") se pierden en el chat. El catálogo tiene búsqueda instantánea por nombre, filtros por categoría, color (19 tonos), diámetro, colección y disponibilidad, con contadores honestos que reflejan el resultado real de cada filtro combinado. El cliente encuentra solo; el asesor responde menos preguntas repetidas.

**Cuarto, la lista del cliente era efímera.** Un cliente que hojeaba el PDF y anotaba "quiero esto, esto y esto" en un mensaje perdía el hilo al día siguiente. Con la herramienta, el cliente marca piezas con un corazón, ajusta cantidades, y esa lista queda guardada en su cuenta: la puede descargar como PDF prolijo o enviarla por WhatsApp al asesor cuando quiera.

## Los cuatro pilares de diseño

**1. Privado por código.** No hay registro público. Cada cliente entra con un código personal que el dueño le entrega (por ejemplo `DEMO`). El código es la identidad del cliente: no necesita contraseña, y el dueño lo crea, lo edita o lo desactiva desde el panel. Los enlaces antiguos del tipo `/c/CODIGO` siguen funcionando por compatibilidad, pero el flujo actual es entrar por el botón "Inicia sesión" del catálogo.

**2. Sin precios y sin códigos para el cliente.** El cliente nunca ve precios, referencias ni códigos de fabricante — ni en las fichas, ni en su lista, ni en el PDF que descarga, ni en el mensaje de WhatsApp. La cotización queda en el canal comercial, entre el asesor y el cliente. El dueño, en cambio, sí ve todos los códigos de artículo desde su panel.

**3. La lista es del cliente.** "Mi lista" es el corazón de la herramienta desde el lado del cliente: sus piezas guardadas con cantidades, la selección "Preparado para ti" que el asesor le armó, y 5 sugerencias automáticas "en base a tus gustos" que el sistema calcula a partir de las piezas que marcó. La lista se descarga como PDF A4 con la marca BasKula y se comparte por WhatsApp en un toque.

**4. El dueño lo ve todo.** Cada acción relevante del cliente se registra en el panel: quién ingresó, cuándo, qué guardó, qué quitó, qué nota mandó, si descargó su lista. El detalle de cada evento lo construye el servidor, así que el registro no se puede falsificar desde el navegador. A esto se suma la gestión completa del catálogo: publicar u ocultar piezas, armar selecciones por cliente y administrar los datos de cada cuenta.

## Breve historia del proyecto

El catálogo partió de la estructura de productos del proveedor (seis departamentos: platos, stoneware, complementos, conjuntos de té/café, colecciones y vajillas). Durante el desarrollo se construyó un pipeline de datos que estructuró las 1.510 piezas con sus especificaciones y fotografías, y tradujo al español nombres, descripciones (1.508 piezas con descripción) y cuidados (1.507 piezas con cuidados). Sobre esos datos se construyó la aplicación, se le aplicó la identidad de marca BasKula (paleta crema/carbón/mostaza, tipografías Lora, Lexend Deca y Cormorant Garamond, logo propio) y se verificó todo el funcionamiento con pruebas automatizadas de punta a punta en navegador real, versión escritorio y móvil.

La herramienta se entrega con 60 piezas ya publicadas en la página pública —variadas y disponibles, repartidas entre todas las categorías— para que el sitio se vea vivo desde el primer día, y con el resto del catálogo listo para publicarse desde el panel con un clic.
