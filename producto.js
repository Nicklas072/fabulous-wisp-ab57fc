// ==========================================================================
// BasKula — Lógica de la Página de Producto Individual (producto.js)
// Sincronización con Báscula (localStorage), Galería, Acordeones y WhatsApp
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener ID del producto desde la URL (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || 'plato-verde-musgo';

    // 2. Buscar datos de la pieza en products-data.js o catálogo global
    let item = null;
    if (typeof getBaskulaProductById === 'function') {
        item = getBaskulaProductById(productId);
    } else if (typeof BASKULA_PRODUCTS !== 'undefined') {
        item = BASKULA_PRODUCTS.find(p => p.id === productId);
    }

    // Soporte para productos creados con parámetros directos en la URL
    if (!item && urlParams.get('name')) {
        item = {
            id: productId,
            name: urlParams.get('name'),
            shortName: urlParams.get('shortName') || urlParams.get('name'),
            category: urlParams.get('category') || 'platos',
            weight: parseFloat(urlParams.get('weight')) || 0.5,
            img: urlParams.get('img') || 'images/cutouts/plato-verde-musgo.webp',
            images: [urlParams.get('img') || 'images/cutouts/plato-verde-musgo.webp'],
            dimensions: urlParams.get('dimensions') || 'Medida estándar',
            finish: urlParams.get('finish') || 'Cerámica artesanal',
            story: urlParams.get('story') || 'Pieza exclusiva de gres elaborada en Portugal.',
            care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno'],
            origin: 'Fabricado artesanalmente en Portugal · Gres Fino'
        };
    }

    const container = document.getElementById('pdp-dynamic-content');
    if (!item) {
        renderNotFound(container, productId);
        return;
    }

    // 3. Normalizar imágenes
    const imagesList = Array.isArray(item.images) && item.images.length > 0 
        ? item.images 
        : [item.img || 'images/cutouts/plato-verde-musgo.webp'];

    const isFixed = item.pricingType === 'fixed';
    const rate = isFixed
        ? 0
        : ((typeof getBaskulaRate === 'function') ? getBaskulaRate(item.category) : (item.rate || 16.50));
    const unitPrice = isFixed
        ? (item.price || 35)
        : ((item.weight || 0.5) * rate);
    const categoryName = (typeof BASKULA_CATEGORY_LABELS !== 'undefined' && BASKULA_CATEGORY_LABELS[item.category])
        ? BASKULA_CATEGORY_LABELS[item.category]
        : (item.category ? item.category.toUpperCase() : 'PIEZA');

    // Actualizar título, etiquetas SEO y Schema.org Product JSON-LD dinámico
    updateProductSEO(item, imagesList[0], unitPrice, rate, isFixed, categoryName);

    // 4. Renderizar contenido PDP
    renderProductPage(container, item, imagesList, unitPrice, rate, categoryName, isFixed);

    // 5. Inicializar interactividad
    initGallery(imagesList);
    initQuantityAndScale(item, unitPrice);
    initAccordions();
    initMobileNav();
    updateHeaderScaleBadge();
});

// --- SEO Dinámico y Rich Snippets Schema.org (Product + Offer) ---
function updateProductSEO(item, mainImg, unitPrice, rate, isFixed, categoryName) {
    const baseUrl = 'https://www.baskula.com';
    const canonicalUrl = `${baseUrl}/producto.html?id=${encodeURIComponent(item.id)}`;
    const absoluteImgUrl = mainImg.startsWith('http') ? mainImg : `${baseUrl}/${mainImg.replace(/^\//, '')}`;
    const seoTitle = `${item.name} — Cerámica Portuguesa en Punta Piedras | BasKula`;
    const priceDesc = isFixed
        ? `Precio: USD ${unitPrice.toFixed(2)}`
        : `Peso aprox. ${item.weight.toFixed(2)} kg · Tarifa USD ${rate.toFixed(2)}/kg (USD ${unitPrice.toFixed(2)} aprox.)`;
    const seoDesc = `${item.name}: ${item.story || 'Cerámica artesanal portuguesa en gres fino.'} ${priceDesc}. Reservá online y retirá en nuestra tienda de Punta Piedras, Maldonado.`;

    document.title = seoTitle;

    const setMeta = (selector, attr, value) => {
        let el = document.querySelector(selector);
        if (!el) {
            el = document.createElement('meta');
            if (selector.includes('property=')) {
                const propMatch = selector.match(/property="([^"]+)"/);
                if (propMatch) el.setAttribute('property', propMatch[1]);
            } else if (selector.includes('name=')) {
                const nameMatch = selector.match(/name="([^"]+)"/);
                if (nameMatch) el.setAttribute('name', nameMatch[1]);
            }
            document.head.appendChild(el);
        }
        el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', seoDesc);
    setMeta('meta[property="og:title"]', 'content', seoTitle);
    setMeta('meta[property="og:description"]', 'content', seoDesc);
    setMeta('meta[property="og:image"]', 'content', absoluteImgUrl);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Inyectar JSON-LD Schema.org Product para Rich Snippets en Google
    let ldScript = document.getElementById('pdp-jsonld');
    if (!ldScript) {
        ldScript = document.createElement('script');
        ldScript.type = 'application/ld+json';
        ldScript.id = 'pdp-jsonld';
        document.head.appendChild(ldScript);
    }

    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": item.name,
        "sku": item.id,
        "category": categoryName,
        "image": [absoluteImgUrl],
        "description": item.story || seoDesc,
        "brand": {
            "@type": "Brand",
            "name": "BasKula"
        },
        "countryOfOrigin": {
            "@type": "Country",
            "name": "Portugal"
        },
        "material": "Gres cerámico artesanal portugués",
        "weight": {
            "@type": "QuantitativeValue",
            "value": item.weight || 0.5,
            "unitCode": "KGM"
        },
        "offers": {
            "@type": "Offer",
            "url": canonicalUrl,
            "priceCurrency": "USD",
            "price": unitPrice.toFixed(2),
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition",
            "availableDeliveryMethod": "https://schema.org/OnSitePickup",
            "seller": {
                "@type": "HomeGoodsStore",
                "name": "BasKula",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Ruta 10 Km 162, Calle 2, Punta Piedras",
                    "addressLocality": "Manantiales, Maldonado",
                    "addressCountry": "UY"
                }
            }
        }
    };

    ldScript.textContent = JSON.stringify(productSchema);
}

// --- Renderizado principal de la página ---
function renderProductPage(container, item, imagesList, unitPrice, rate, categoryName, isFixed) {
    const formattedPrice = `USD ${unitPrice.toFixed(2)}`;
    const formattedWeight = `${(item.weight || 0.5).toFixed(2)} kg (${Math.round((item.weight || 0.5) * 1000)} g)`;
    const whatsappText = encodeURIComponent(
        `¡Hola BasKula! Me interesa consultar disponibilidad de la pieza "${item.name}" (${formattedPrice}${isFixed ? ' · Pieza de Autor' : `, Peso aprox: ${item.weight} kg`}) para retirar en la tienda de Punta Piedras. Link: ${window.location.href}`
    );

    // Miniaturas solo si hay más de 1 imagen
    let thumbnailsHTML = '';
    if (imagesList.length > 1) {
        thumbnailsHTML = `
            <div class="pdp-thumbnails-strip" id="pdp-thumbnails">
                ${imagesList.map((src, idx) => `
                    <button type="button" class="pdp-thumbnail-item ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Ver foto ${idx + 1}">
                        <img src="${src}" alt="${item.name} — vista ${idx + 1} cerámica portuguesa BasKula" loading="lazy">
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Badges de cuidado
    const careBadges = Array.isArray(item.care) ? item.care : ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno'];
    const careBadgesHTML = careBadges.map(careText => `
        <span class="pdp-care-pill"><i data-lucide="check"></i> ${careText}</span>
    `).join('');

    container.innerHTML = `
        <!-- Miga de Pan / Breadcrumbs -->
        <nav class="pdp-breadcrumbs" aria-label="Ruta de navegación">
            <a href="index.html">Inicio</a>
            <span class="breadcrumb-separator">/</span>
            <a href="catalogo.html">Catálogo</a>
            <span class="breadcrumb-separator">/</span>
            <a href="catalogo.html#${item.category}">${categoryName}</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">${item.shortName || item.name}</span>
        </nav>

        <!-- Grid Principal Estilo Costa Nova -->
        <div class="pdp-layout-grid">
            <!-- Galería Izquierda -->
            <div class="pdp-gallery-column">
                <div class="pdp-gallery-stage" id="gallery-stage" title="Cerámica artesanal portuguesa BasKula">
                    <span class="pdp-stage-badge">
                        <i data-lucide="sparkles"></i> Cerámica Portuguesa
                    </span>
                    <img src="${imagesList[0]}" alt="${item.name} — Vajilla de cerámica artesanal portuguesa en BasKula Punta Piedras" class="pdp-main-image" id="pdp-active-img" fetchpriority="high" width="600" height="600">
                </div>
                ${thumbnailsHTML}
            </div>

            <!-- Información Editorial Derecha -->
            <div class="pdp-info-column">
                <span class="pdp-origin-tag">
                    <i data-lucide="map-pin"></i> ${item.origin || 'Artesanía de Portugal · Gres Fino'}
                </span>
                <h1 class="pdp-title">${item.name}</h1>

                <!-- Tarjeta de Precios y Peso -->
                <div class="pdp-price-card">
                    <div class="pdp-price-main-row">
                        <div>
                            <span class="pdp-unit-price">${formattedPrice}</span>
                            <span class="pdp-unit-price-label">${isFixed ? 'precio fijo por unidad' : 'aprox. por unidad'}</span>
                        </div>
                        <span class="pdp-rate-badge">
                            <i data-lucide="tag"></i> ${isFixed ? 'Pieza de Autor' : `Tarifa: USD ${rate.toFixed(2)}/kg`}
                        </span>
                    </div>
                    <div class="pdp-weight-row">
                        <i data-lucide="scale"></i>
                        <span>Peso promedio: <strong class="pdp-weight-val">${formattedWeight}</strong></span>
                    </div>
                    <div class="pdp-kilo-note">
                        <i data-lucide="info"></i>
                        <span>${isFixed ? 'Edición especial con valor fijo por pieza.' : 'En BasKula pagás exactamente lo que pesa tu pieza.'}</span>
                    </div>
                </div>

                <!-- Historia Editorial -->
                <p class="pdp-story">${item.story || 'Pieza torneada con acabados artesanales únicos cocidos a alta temperatura.'}</p>

                <!-- Acciones de Compra / Báscula -->
                <div class="pdp-actions-box">
                    <div class="pdp-qty-and-cta">
                        <div class="pdp-qty-stepper" aria-label="Selector de cantidad">
                            <button type="button" class="pdp-qty-btn" id="qty-minus" aria-label="Restar una pieza">−</button>
                            <span class="pdp-qty-display" id="qty-display">1</span>
                            <button type="button" class="pdp-qty-btn" id="qty-plus" aria-label="Sumar una pieza">+</button>
                        </div>
                        <button type="button" class="btn-add-scale" id="btn-add-to-scale">
                            <i data-lucide="scale"></i>
                            <span>Poner en la Báscula</span>
                        </button>
                    </div>

                    <a href="https://wa.me/59893658477?text=${whatsappText}" target="_blank" rel="noopener" class="btn-whatsapp-inquire">
                        <i data-lucide="message-circle"></i>
                        <span>Consultar por WhatsApp</span>
                    </a>
                </div>

                <!-- Acordeones de Especificaciones Estilo Costa Nova -->
                <div class="pdp-accordion-group">
                    <!-- Acordeón 1: Dimensiones y Acabado -->
                    <div class="pdp-accordion-item active">
                        <button type="button" class="pdp-accordion-header">
                            <span>Dimensiones y Acabado</span>
                            <span class="pdp-accordion-icon">+</span>
                        </button>
                        <div class="pdp-accordion-body">
                            <p><strong>Dimensiones:</strong> ${item.dimensions || 'No especificadas'}</p>
                            <p><strong>Acabado:</strong> ${item.finish || 'Esmalte reactivo artesanal'}</p>
                            <p><strong>Material:</strong> Gres fino cocido a más de 1.200 °C con baja porosidad y alta durabilidad.</p>
                        </div>
                    </div>

                    <!-- Acordeón 2: Cuidados y Uso -->
                    <div class="pdp-accordion-item">
                        <button type="button" class="pdp-accordion-header">
                            <span>Cuidados y Uso</span>
                            <span class="pdp-accordion-icon">+</span>
                        </button>
                        <div class="pdp-accordion-body">
                            <p>Esta pieza está fabricada para el uso cotidiano y la gastronomía profesional:</p>
                            <div class="pdp-care-badges-list">
                                ${careBadgesHTML}
                            </div>
                            <p style="margin-top:10px; font-size: 0.85rem; color:#777;">Evitar choque térmico brusco (del congelador directo a fuego vivo).</p>
                        </div>
                    </div>

                    <!-- Acordeón 3: Origen y Singularidad -->
                    <div class="pdp-accordion-item">
                        <button type="button" class="pdp-accordion-header">
                            <span>Origen Artesanal en Portugal</span>
                            <span class="pdp-accordion-icon">+</span>
                        </button>
                        <div class="pdp-accordion-body">
                            <p>Cada pieza es importada directamente desde los talleres cerámicos tradicionales de Portugal. Debido al proceso de esmaltado reactivo y la cocción a alta temperatura, cada pieza presenta variaciones de matiz irrepetibles que certifican su autenticidad.</p>
                        </div>
                    </div>

                    <!-- Acordeón 4: Retiro en Tienda y Proyectos B2B -->
                    <div class="pdp-accordion-item">
                        <button type="button" class="pdp-accordion-header">
                            <span>Retiro en Tienda y Proyectos B2B</span>
                            <span class="pdp-accordion-icon">+</span>
                        </button>
                        <div class="pdp-accordion-body">
                            <p><strong>Atención y retiro exclusivo en tienda:</strong> Reservá tu selección online por WhatsApp y retirala en nuestro local de Punta Piedras (Ruta 10 Km 162, Calle 2, entre Manantiales y José Ignacio, Maldonado), donde la pesamos juntos en el momento.</p>
                            <p><strong>Proyectos B2B:</strong> Para restaurantes, hoteles boutique, desarrollos inmobiliarios y home staging coordinamos atención personalizada y logística a medida.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sección de Piezas Sugeridas para Combinar -->
        <section class="pdp-related-section">
            <h2 class="pdp-related-title">Piezas sugeridas para combinar</h2>
            <p class="pdp-related-subtitle">Creá tu propia vajilla mezclando formas, colores y texturas por kilo</p>
            <div class="pdp-related-grid" id="pdp-related-grid"></div>
        </section>
    `;

    // Renderizar piezas relacionadas
    renderRelatedItems(item.id, item.category);

    // Inicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- Galería e interactividad de fotos ---
function initGallery(imagesList) {
    const mainImg = document.getElementById('pdp-active-img');
    const thumbnails = document.querySelectorAll('.pdp-thumbnail-item');
    if (!mainImg || thumbnails.length === 0) return;

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const idx = parseInt(thumb.getAttribute('data-index'), 10);
            if (imagesList[idx]) {
                mainImg.src = imagesList[idx];
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            }
        });
    });
}

// --- Selector de Cantidad y Guardado en Báscula (localStorage) ---
function initQuantityAndScale(item, unitPrice) {
    let currentQty = 1;
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyDisplay = document.getElementById('qty-display');
    const btnAdd = document.getElementById('btn-add-to-scale');

    if (qtyMinus && qtyPlus && qtyDisplay) {
        qtyMinus.addEventListener('click', () => {
            if (currentQty > 1) {
                currentQty--;
                qtyDisplay.textContent = currentQty;
            }
        });

        qtyPlus.addEventListener('click', () => {
            if (currentQty < 99) {
                currentQty++;
                qtyDisplay.textContent = currentQty;
            }
        });
    }

    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            addToBaskulaBasket(item, currentQty);
            
            // Feedback visual del botón
            const originalHTML = btnAdd.innerHTML;
            btnAdd.classList.add('added-feedback');
            btnAdd.innerHTML = `<i data-lucide="check"></i> <span>¡Agregado a la Báscula!</span>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            showToast(`${currentQty} ${currentQty > 1 ? 'piezas agregadas' : 'pieza agregada'} a tu báscula`);

            setTimeout(() => {
                btnAdd.classList.remove('added-feedback');
                btnAdd.innerHTML = originalHTML;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 2000);
        });
    }
}

// --- Acordeones colapsables ---
function initAccordions() {
    const items = document.querySelectorAll('.pdp-accordion-item');
    items.forEach(accItem => {
        const header = accItem.querySelector('.pdp-accordion-header');
        if (header) {
            header.addEventListener('click', () => {
                const isActive = accItem.classList.contains('active');
                // Si se desea acordeón exclusivo descomentar la siguiente línea:
                // items.forEach(i => i.classList.remove('active'));
                accItem.classList.toggle('active', !isActive);
            });
        }
    });
}

// --- Manejo del Carrito en localStorage (baskula_basket_v2) ---
const STORAGE_KEY = 'baskula_basket_v2';

function addToBaskulaBasket(item, qtyToAdd) {
    let basket = [];
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) basket = parsed;
        }
    } catch (e) {
        basket = [];
    }

    const isFixed = item.pricingType === 'fixed';
    const rate = isFixed ? 0 : ((typeof getBaskulaRate === 'function') ? getBaskulaRate(item.category) : (item.rate || 16.50));
    const unitPrice = isFixed ? (item.price || 35) : ((item.weight || 0.5) * rate);

    const existingIdx = basket.findIndex(b => b.id === item.id);
    if (existingIdx >= 0) {
        basket[existingIdx].qty = (basket[existingIdx].qty || 1) + qtyToAdd;
    } else {
        basket.push({
            id: item.id,
            name: item.name,
            shortName: item.shortName || item.name,
            category: item.category || 'platos',
            pricingType: item.pricingType || 'weight',
            rate: rate,
            price: unitPrice,
            qty: qtyToAdd,
            weight: item.weight,
            img: item.img || (Array.isArray(item.images) && item.images[0]) || 'images/cutouts/plato-verde-musgo.webp'
        });
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
    } catch (e) {
        console.error('Error guardando báscula:', e);
    }

    updateHeaderScaleBadge();
}

function updateHeaderScaleBadge() {
    let basket = [];
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) basket = parsed;
        }
    } catch (e) {
        basket = [];
    }

    let totalCount = 0;
    let totalWeight = 0;

    basket.forEach(item => {
        const qty = item.qty || 1;
        totalCount += qty;
        if (item.pricingType !== 'fixed') {
            totalWeight += (item.weight || 0.5) * qty;
        }
    });

    const countEl = document.getElementById('nav-scale-count');
    const weightEl = document.getElementById('nav-scale-weight');

    if (countEl) countEl.textContent = totalCount;
    if (weightEl) weightEl.textContent = `${totalWeight.toFixed(2)} kg`;
}

// --- Toast de notificación ---
function showToast(message) {
    let toast = document.getElementById('pdp-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pdp-toast';
        toast.className = 'pdp-toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i data-lucide="scale"></i> <span>${message}</span>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3200);
}

// --- Piezas sugeridas ---
function renderRelatedItems(currentId, currentCategory) {
    const grid = document.getElementById('pdp-related-grid');
    if (!grid) return;

    let allItems = (typeof BASKULA_PRODUCTS !== 'undefined') ? BASKULA_PRODUCTS : [];
    if (typeof window !== 'undefined' && Array.isArray(window.CATALOG_ITEMS) && window.CATALOG_ITEMS.length > 0) {
        allItems = window.CATALOG_ITEMS;
    }

    // Filtrar la pieza actual y tomar hasta 4
    const related = allItems.filter(p => p.id !== currentId).slice(0, 4);

    grid.innerHTML = related.map(rel => {
        const relIsFixed = rel.pricingType === 'fixed';
        const relRate = relIsFixed ? 0 : ((typeof getBaskulaRate === 'function') ? getBaskulaRate(rel.category) : 16.50);
        const relPrice = relIsFixed ? (rel.price || 35) : ((rel.weight || 0.5) * relRate);
        const relImg = (Array.isArray(rel.images) && rel.images[0]) || rel.img || 'images/cutouts/plato-verde-musgo.webp';

        return `
            <a href="producto.html?id=${rel.id}" class="pdp-related-card">
                <div class="pdp-related-img-wrap">
                    <img src="${relImg}" alt="${rel.name} — Cerámica portuguesa BasKula" loading="lazy" width="240" height="240">
                </div>
                <h3 class="pdp-related-card-title">${rel.shortName || rel.name}</h3>
                <div class="pdp-related-card-meta">${relIsFixed ? `${Math.round((rel.weight || 0.8) * 1000)}g · Pieza de Autor` : `${Math.round(rel.weight * 1000)}g · USD ${relRate.toFixed(2)}/kg`}</div>
                <div class="pdp-related-card-price">USD ${relPrice.toFixed(2)}</div>
            </a>
        `;
    }).join('');
}

// --- Drawer móvil ---
function initMobileNav() {
    const menuToggle = document.getElementById('menu-toggle');
    const drawer = document.getElementById('sidebarDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const drawerClose = document.getElementById('drawerClose');

    const openDrawer = () => {
        if (drawer) drawer.classList.add('open');
        if (overlay) overlay.classList.add('open');
        document.body.classList.add('drawer-open');
    };

    const closeDrawer = () => {
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.classList.remove('drawer-open');
    };

    if (menuToggle) menuToggle.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);
}

// --- Estado: Producto no encontrado ---
function renderNotFound(container, requestedId) {
    container.innerHTML = `
        <div class="pdp-not-found">
            <h2>Pieza no encontrada</h2>
            <p>La pieza con identificador "<strong>${requestedId}</strong>" aún no está cargada o cambió de enlace.</p>
            <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap;">
                <a href="catalogo.html" class="btn-back">
                    <i data-lucide="arrow-left"></i> Volver a la Tienda
                </a>
                <a href="https://wa.me/59893658477?text=${encodeURIComponent('Hola BasKula, estoy buscando la pieza: ' + requestedId)}" target="_blank" rel="noopener" class="btn-back" style="background-color:#25D366;">
                    <i data-lucide="message-circle"></i> Consultar por WhatsApp
                </a>
            </div>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
