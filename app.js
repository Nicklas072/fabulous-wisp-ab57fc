// Ensure page always starts at top (0, 0) upon opening/reloading if no section hash is in URL
if (typeof window !== 'undefined' && !window.location.hash) {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
}

// --- Scroll handler with requestAnimationFrame and passive listener ---
let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
let ticking = false;

const updateScrollState = () => {
    if (lastScrollY > 50) {
        document.body.classList.add('scrolled');
    } else {
        document.body.classList.remove('scrolled');
    }
    ticking = false;
};

const onScroll = () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
    }
};

window.addEventListener('scroll', onScroll, { passive: true });

// Initialize Lucide Icons and AOS
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.hash) {
        window.scrollTo(0, 0);
    }
    lucide.createIcons();
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 50
        });
    }

    // Add ready class to body to trigger rollout animation
    setTimeout(() => {
        document.body.classList.add('ready');
    }, 50);

    // Initial check for scroll state on load
    lastScrollY = window.scrollY;
    updateScrollState();
});

// --- Tarifas por Categoría (USD por Kilo) ---
const CATEGORY_RATES = {
    platos: 16.50,
    fuentes: 16.50,
    vasos: 29.50,
    tazas: 29.50,
    bowls: 29.50,
    ensaladeras: 29.50
};

const CATEGORY_LABELS = {
    todos: 'Todas las piezas',
    platos: 'Platos',
    tazas: 'Tazas',
    vasos: 'Vasos',
    bowls: 'Bowls',
    ensaladeras: 'Ensaladeras',
    fuentes: 'Fuentes'
};

const getRateForCategory = (cat) => CATEGORY_RATES[cat] || 16.50;

// --- Catálogo de Piezas Oficial BasKula ---
const CATALOG_ITEMS = [
    {
        id: 'plato-rayas-navy',
        name: 'Plato Playo Rayas Navy',
        shortName: 'Plato Rayas Navy',
        category: 'platos',
        weight: 0.975,
        img: 'images/ceramics/plato-rayas-navy.webp',
        images: ['images/ceramics/plato-rayas-navy.webp'],
        dimensions: 'Ø 28 cm · Alto 2.2 cm',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Plato playo de inspiración mediterránea y estética marinera. Su composición de franjas azul índigo de trazo orgánico sobre fondo blanco puro viste cualquier mesa con frescura, elegancia y calidez artesanal.'
    },
    {
        id: 'bowl-rayas-navy',
        name: 'Bowl Cerealero Rayas Navy',
        shortName: 'Bowl Rayas Navy',
        category: 'bowls',
        weight: 0.480,
        img: 'images/ceramics/bowl-rayas-navy.webp',
        images: ['images/ceramics/bowl-rayas-navy.webp'],
        dimensions: 'Ø 14.5 cm · Alto 8 cm (550 ml)',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Bowl cónico con fileteado vertical en azul profundo sobre base cerámica blanca. Cómodo y versátil, ideal para desayunos, cereales, sopas, yogurt o dips en el centro de la mesa.'
    },
    {
        id: 'taza-rayas-navy',
        name: 'Taza Mug Rayas Navy',
        shortName: 'Taza Rayas Navy',
        category: 'tazas',
        weight: 0.360,
        img: 'images/ceramics/taza-rayas-navy.webp',
        images: ['images/ceramics/taza-rayas-navy.webp'],
        dimensions: 'Ø 9 cm · Alto 11 cm (350 ml)',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Mug cerámico con asa ergonómica modelada y franjas verticales azul marino. De tacto cálido y cómodo agarre, perfecto para café filtrado, té en hebras o infusiones matutinas.'
    },
    {
        id: 'ensaladera-rayas-navy',
        name: 'Ensaladera Honda Rayas Navy',
        shortName: 'Ensaladera Rayas Navy',
        category: 'ensaladeras',
        weight: 0.975,
        img: 'images/ceramics/ensaladera-rayas-navy.webp',
        images: ['images/ceramics/ensaladera-rayas-navy.webp'],
        dimensions: 'Ø 25 cm · Alto 9.5 cm',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Pieza central de generosa capacidad con perfil abierto y líneas que convergen hacia la base. Diseñada para lucir ensaladas frescas, pastas para compartir o como frutero de autor en la cocina.'
    },
    {
        id: 'plato-corona-floral',
        name: 'Plato Playo Corona Floral Terracota',
        shortName: 'Plato Corona Floral',
        category: 'platos',
        weight: 0.875,
        img: 'images/ceramics/plato-corona-floral.webp',
        images: ['images/ceramics/plato-corona-floral.webp'],
        dimensions: 'Ø 27 cm · Alto 2.2 cm',
        finish: 'Esmaltado Satinado Suave',
        story: 'Una pieza de inspiración campestre y calidez mediterránea. Su diseño presenta una corona circular de hojas y flores pinceladas en tonos terracota y rosa empolvado, enmarcando el centro del plato para destacar los colores vivos de cualquier creación culinaria.'
    },
    {
        id: 'plato-sol-botanico',
        name: 'Plato Entrada Sol Botánico Terracota',
        shortName: 'Plato Sol Botánico',
        category: 'platos',
        weight: 0.522,
        img: 'images/ceramics/plato-sol-botanico.webp',
        images: ['images/ceramics/plato-sol-botanico.webp'],
        dimensions: 'Ø 21 cm · Alto 2.0 cm',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'El complemento ideal para entradas, desayunos o postres. Destaca por su flor central y una delicada guarda radial en tonos arcilla tostada y rubor que irradia frescura, complementando a la perfección la vajilla principal de la colección.'
    }
];

// --- Persistencia del Pesaje (Carrito / Mini-Báscula en Nav) ---
const STORAGE_KEY = 'baskula_basket_v2';
let basket = [];
try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) basket = parsed;
    }
} catch (err) {
    basket = [];
}

const saveBasket = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(basket));
    } catch (err) {
        // ignore storage quota errors
    }
};

// --- DOM Elements ---
const scaleNeedle = document.getElementById('scale-needle');
const scaleTrayAssembly = document.getElementById('scale-tray-assembly');
const scaleStackedItems = document.getElementById('scale-stacked-items');
const basketItemsList = document.getElementById('basket-items-list');
const totalWeightDisplay = document.getElementById('total-weight-display');
const totalPriceDisplay = document.getElementById('total-price-display');
const basketPiecesPill = document.getElementById('basket-pieces-pill');
const btnToggleBasketDrawer = document.getElementById('btn-toggle-basket-drawer');
const btnCloseBasketDrawer = document.getElementById('btn-close-basket-drawer');
const basketDrawerPanel = document.getElementById('basket-drawer-panel');
const btnReset = document.getElementById('btn-reset');
const btnCheckout = document.getElementById('btn-checkout');

// Nav Mini-Báscula Elements (Present in both index.html and catalogo.html)
const navScaleWidget = document.getElementById('nav-scale-widget');
const navScaleCount = document.getElementById('nav-scale-count');
const navScaleWeight = document.getElementById('nav-scale-weight');

// Alacena Elements
const alacenaShelvesStage = document.getElementById('alacena-shelves-stage');
const alacenaFilterBar = document.getElementById('alacena-filter-bar');
const alacenaRateBadge = document.getElementById('alacena-rate-badge');

// Ficha Editorial Modal Elements
const pieceDetailModal = document.getElementById('piece-detail-modal');
const fichaCloseBtn = document.getElementById('ficha-close-btn');
const fichaCategoryPill = document.getElementById('ficha-category-pill');
const fichaPieceImg = document.getElementById('ficha-piece-img');
const fichaThumbsBar = document.getElementById('ficha-thumbs-bar');
const fichaTitle = document.getElementById('ficha-title');
const fichaStory = document.getElementById('ficha-story');
const fichaWeight = document.getElementById('ficha-weight');
const fichaUnitPrice = document.getElementById('ficha-unit-price');
const fichaDimensions = document.getElementById('ficha-dimensions');
const fichaFinish = document.getElementById('ficha-finish');
const fichaQtyMinus = document.getElementById('ficha-qty-minus');
const fichaQtyPlus = document.getElementById('ficha-qty-plus');
const fichaQtyVal = document.getElementById('ficha-qty-val');
const fichaAddToScaleBtn = document.getElementById('ficha-add-to-scale-btn');

// Checkout Modal Elements
const checkoutModal = document.getElementById('checkout-modal');
const modalClose = document.getElementById('modal-close');
const modalDoneBtn = document.getElementById('modal-done-btn');
const modalWeight = document.getElementById('modal-weight');
const modalPrice = document.getElementById('modal-price');
const modalItemsList = document.getElementById('modal-items-list');
const whatsappLink = document.getElementById('whatsapp-link');

// WhatsApp business config
const WHATSAPP_NUMBER = '59893658477';

// Drawer Menu Elements
const menuToggle = document.getElementById('menu-toggle');
const drawerClose = document.getElementById('drawerClose');
const drawerOverlay = document.getElementById('drawerOverlay');
const sidebarDrawer = document.getElementById('sidebarDrawer');

// --- Drawer Navigation Logic ---
if (menuToggle && sidebarDrawer && drawerOverlay) {
    const openDrawer = () => {
        sidebarDrawer.classList.add('open');
        drawerOverlay.classList.add('open');
        document.body.classList.add('drawer-open');
    };

    const closeDrawer = () => {
        sidebarDrawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
        document.body.classList.remove('drawer-open');
    };

    menuToggle.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);

    const drawerLinks = sidebarDrawer.querySelectorAll('.drawer-link, .drawer-link-secondary');
    drawerLinks.forEach(link => {
        link.addEventListener('click', closeDrawer);
    });
}

// Format currency helper
const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
};

// --- Active State for Alacena & Ficha ---
let activeCategory = 'todos';
let currentFichaItem = null;
let currentFichaQty = 1;
let lastAddedItemId = null;

// --- Renderizado de Estantes en la Alacena Boutique ---
// --- Renderizado de Estantes en la Alacena (Opción 2: Exactamente 3 artículos por fila) ---
const renderAlacenaShelves = () => {
    if (!alacenaShelvesStage) return;

    const filtered = activeCategory === 'todos'
        ? CATALOG_ITEMS
        : CATALOG_ITEMS.filter(item => item.category === activeCategory);

    // Exactamente 3 artículos por fila
    const ITEMS_PER_ROW = 3;
    const shelves = [];
    for (let i = 0; i < filtered.length; i += ITEMS_PER_ROW) {
        shelves.push(filtered.slice(i, i + ITEMS_PER_ROW));
    }

    alacenaShelvesStage.innerHTML = '';

    shelves.forEach((shelfItems, shelfIdx) => {
        if (shelfItems.length === 0) return;

        const rowEl = document.createElement('div');
        rowEl.className = 'boutique-shelf-row';
        rowEl.setAttribute('data-shelf-index', shelfIdx);

        const itemsTrack = document.createElement('div');
        itemsTrack.className = 'boutique-shelf-track';

        shelfItems.forEach((item) => {
            const rate = getRateForCategory(item.category);
            const unitPrice = item.weight * rate;
            const inBasket = basket.find(b => b.id === item.id);
            const qtyInBasket = inBasket ? inBasket.qty : 0;

            const slot = document.createElement('div');
            slot.className = `shelf-piece-tile${qtyInBasket > 0 ? ' has-qty' : ''}`;
            slot.setAttribute('data-id', item.id);
            slot.setAttribute('role', 'button');
            slot.setAttribute('tabindex', '0');
            slot.setAttribute('aria-label', `Saber más sobre ${item.name}`);

            slot.innerHTML = `
                <div class="gallery-piece-frame" data-action="open-ficha" data-id="${item.id}">
                    <div class="passepartout-container">
                        <button type="button" class="card-heart-btn" data-id="${item.id}" aria-label="Guardar ${item.name} en mi balanza" title="Agregar a mi balanza">
                            <svg viewBox="0 0 24 24" class="card-heart-svg">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </button>
                        ${qtyInBasket > 0 ? `<span class="piece-qty-badge" title="En tu balanza">×${qtyInBasket}</span>` : ''}
                        <img src="${item.img}" alt="${item.name}" class="gallery-photo" loading="lazy" decoding="async" draggable="false">
                        <span class="gallery-view-hint"><i data-lucide="eye"></i> Saber más</span>
                    </div>
                    <div class="gallery-caption">
                        <div class="gallery-caption-meta">
                            <span class="gallery-item-name" title="${item.name}">${item.shortName}</span>
                            <span class="gallery-item-price">${Math.round(item.weight * 1000)}g · ${formatCurrency(unitPrice)}</span>
                        </div>
                        <button type="button" class="gallery-quick-add-btn" data-action="quick-add" data-id="${item.id}" aria-label="Agregar ${item.name} directo a la báscula" title="Poner en la báscula">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                </div>
            `;

            itemsTrack.appendChild(slot);
        });

        const plankEl = document.createElement('div');
        plankEl.className = 'boutique-oak-plank';

        rowEl.appendChild(itemsTrack);
        rowEl.appendChild(plankEl);
        alacenaShelvesStage.appendChild(rowEl);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

// --- Interacción en el Estante (Click directo en pieza abre Ficha, '+' agrega a báscula) ---
if (alacenaShelvesStage) {
    alacenaShelvesStage.addEventListener('click', (e) => {
        if (e.target.closest('.card-heart-btn')) return;

        const quickAddBtn = e.target.closest('[data-action="quick-add"]');
        if (quickAddBtn) {
            e.stopPropagation();
            const id = quickAddBtn.getAttribute('data-id');
            addItemToScale(id, 1, quickAddBtn);
            return;
        }

        const tile = e.target.closest('.shelf-piece-tile');
        if (tile) {
            const id = tile.getAttribute('data-id');
            openPieceFicha(id);
        }
    });

    alacenaShelvesStage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const tile = e.target.closest('.shelf-piece-tile');
            if (tile && !e.target.closest('.tile-quick-add-btn')) {
                e.preventDefault();
                openPieceFicha(tile.getAttribute('data-id'));
            }
        }
    });
}

// --- Filtros de Categoría en la Cornisa ---
if (alacenaFilterBar) {
    alacenaFilterBar.addEventListener('click', (e) => {
        const tab = e.target.closest('.alacena-filter-tab');
        if (!tab) return;

        const category = tab.getAttribute('data-category');
        activeCategory = category;

        alacenaFilterBar.querySelectorAll('.alacena-filter-tab').forEach(t => {
            const isAct = t === tab;
            t.classList.toggle('active', isAct);
            t.setAttribute('aria-selected', isAct ? 'true' : 'false');
        });

        if (alacenaRateBadge) {
            if (category === 'todos') {
                alacenaRateBadge.innerHTML = `Platos/Fuentes <strong>$16.50/kg</strong> · Tazas/Bowls/Vasos <strong>$29.50/kg</strong>`;
            } else {
                const rate = getRateForCategory(category);
                alacenaRateBadge.innerHTML = `${CATEGORY_LABELS[category]}: Tarifa <strong>USD ${rate.toFixed(2)} / kg</strong>`;
            }
        }

        renderAlacenaShelves();
    });
}

// --- Ventana Editorial: Ficha de Personalidad de la Pieza ---
const openPieceFicha = (id) => {
    const item = CATALOG_ITEMS.find(i => i.id === id);
    if (!item || !pieceDetailModal) return;

    currentFichaItem = item;
    currentFichaQty = 1;
    const rate = getRateForCategory(item.category);
    const unitPrice = item.weight * rate;

    if (fichaCategoryPill) {
        fichaCategoryPill.textContent = `${CATEGORY_LABELS[item.category]} · USD ${rate.toFixed(2)}/kg`;
    }
    if (fichaPieceImg) {
        fichaPieceImg.src = item.img;
        fichaPieceImg.alt = item.name;
    }

    // Mini galería de fotos si la pieza tiene más de una
    if (fichaThumbsBar) {
        fichaThumbsBar.innerHTML = '';
        const imgList = (item.images && item.images.length > 0) ? item.images : [item.img];
        if (imgList.length > 1) {
            imgList.forEach((imgSrc, idx) => {
                const thumb = document.createElement('button');
                thumb.type = 'button';
                thumb.className = `ficha-thumb-btn${idx === 0 ? ' active' : ''}`;
                thumb.setAttribute('aria-label', `Ver foto ${idx + 1}`);
                thumb.innerHTML = `<img src="${imgSrc}" alt="${item.name} vista ${idx + 1}">`;
                thumb.addEventListener('click', () => {
                    if (fichaPieceImg) fichaPieceImg.src = imgSrc;
                    fichaThumbsBar.querySelectorAll('.ficha-thumb-btn').forEach(b => b.classList.toggle('active', b === thumb));
                });
                fichaThumbsBar.appendChild(thumb);
            });
            fichaThumbsBar.style.display = 'flex';
        } else {
            fichaThumbsBar.style.display = 'none';
        }
    }

    if (fichaTitle) fichaTitle.textContent = item.name;
    if (fichaStory) fichaStory.textContent = item.story;
    if (fichaWeight) fichaWeight.textContent = `${item.weight.toFixed(2)} kg (${Math.round(item.weight * 1000)} g)`;
    if (fichaUnitPrice) fichaUnitPrice.textContent = formatCurrency(unitPrice);
    if (fichaDimensions) fichaDimensions.textContent = item.dimensions;
    if (fichaFinish) fichaFinish.textContent = item.finish;
    if (fichaQtyVal) fichaQtyVal.textContent = String(currentFichaQty);

    pieceDetailModal.classList.add('open');
    pieceDetailModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

const closePieceFicha = () => {
    if (!pieceDetailModal) return;
    pieceDetailModal.classList.remove('open');
    pieceDetailModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
};

if (fichaCloseBtn) fichaCloseBtn.addEventListener('click', closePieceFicha);
if (pieceDetailModal) {
    pieceDetailModal.addEventListener('click', (e) => {
        if (e.target === pieceDetailModal) closePieceFicha();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pieceDetailModal && pieceDetailModal.classList.contains('open')) {
        closePieceFicha();
    }
});

if (fichaQtyMinus) {
    fichaQtyMinus.addEventListener('click', () => {
        if (currentFichaQty > 1) {
            currentFichaQty -= 1;
            if (fichaQtyVal) fichaQtyVal.textContent = String(currentFichaQty);
        }
    });
}

if (fichaQtyPlus) {
    fichaQtyPlus.addEventListener('click', () => {
        if (currentFichaQty < 12) {
            currentFichaQty += 1;
            if (fichaQtyVal) fichaQtyVal.textContent = String(currentFichaQty);
        }
    });
}

if (fichaAddToScaleBtn) {
    fichaAddToScaleBtn.addEventListener('click', () => {
        if (!currentFichaItem) return;
        addItemToScale(currentFichaItem.id, currentFichaQty);
        closePieceFicha();
        renderAlacenaShelves();
    });
}

// --- Lógica de Pesaje, Apilado Físico en el Platillo y Mini-Contador Nav ---
const addItemToScale = (itemId, qtyToAdd = 1, sourceBtn = null) => {
    const catalogItem = CATALOG_ITEMS.find(i => i.id === itemId);
    if (!catalogItem) return;

    const rate = getRateForCategory(catalogItem.category);
    const existing = basket.find(b => b.id === catalogItem.id);

    if (existing) {
        existing.qty += qtyToAdd;
        existing.rate = rate;
        existing.weight = catalogItem.weight;
        existing.img = catalogItem.img;
    } else {
        basket.push({
            id: catalogItem.id,
            name: catalogItem.name,
            shortName: catalogItem.shortName,
            category: catalogItem.category,
            weight: catalogItem.weight,
            rate: rate,
            img: catalogItem.img,
            qty: qtyToAdd
        });
    }

    lastAddedItemId = catalogItem.id;

    if (sourceBtn && (sourceBtn.classList.contains('gallery-quick-add-btn') || sourceBtn.classList.contains('tile-quick-add-btn') || sourceBtn.classList.contains('btn-edge-quick-add'))) {
        sourceBtn.classList.add('just-added');
        setTimeout(() => sourceBtn.classList.remove('just-added'), 650);
    }

    updateScale();
    renderAlacenaShelves();
};

const changeBasketItemQty = (itemId, delta) => {
    const idx = basket.findIndex(b => b.id === itemId);
    if (idx === -1) return;
    basket[idx].qty += delta;
    if (basket[idx].qty <= 0) {
        basket.splice(idx, 1);
    }
    lastAddedItemId = null;
    updateScale();
    renderAlacenaShelves();
};

const resetScale = () => {
    basket = [];
    lastAddedItemId = null;
    if (basketDrawerPanel) basketDrawerPanel.classList.remove('open');
    if (btnToggleBasketDrawer) btnToggleBasketDrawer.setAttribute('aria-expanded', 'false');
    updateScale();
    renderAlacenaShelves();
};

if (btnReset) btnReset.addEventListener('click', resetScale);

// Toggle collapsible drawer of weighed items
if (btnToggleBasketDrawer && basketDrawerPanel) {
    btnToggleBasketDrawer.addEventListener('click', () => {
        const isOpen = basketDrawerPanel.classList.toggle('open');
        btnToggleBasketDrawer.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
}
if (btnCloseBasketDrawer && basketDrawerPanel) {
    btnCloseBasketDrawer.addEventListener('click', () => {
        basketDrawerPanel.classList.remove('open');
        if (btnToggleBasketDrawer) btnToggleBasketDrawer.setAttribute('aria-expanded', 'false');
    });
}

// Clicking Nav Mini-Báscula on catalogo.html toggles the weighed items list or scrolls to scale
if (navScaleWidget && navScaleWidget.tagName === 'BUTTON') {
    navScaleWidget.addEventListener('click', () => {
        if (basket.length > 0 && basketDrawerPanel) {
            basketDrawerPanel.classList.add('open');
            if (btnToggleBasketDrawer) btnToggleBasketDrawer.setAttribute('aria-expanded', 'true');
        }
        const simEl = document.getElementById('simulador');
        if (simEl) simEl.scrollIntoView({ behavior: 'smooth' });
    });
}

// Limpiar platillo de la balanza (sin artículos apilados sobre el plato físico)
const renderStackedTrayItems = () => {
    if (scaleStackedItems) {
        scaleStackedItems.innerHTML = '';
    }
};

// Update all scale readouts, needle, tray stack, and Nav Mini-Báscula
const updateScale = () => {
    let totalWeight = 0;
    let totalPrice = 0;
    let totalPieces = 0;

    basket.forEach(item => {
        const isFixed = item.pricingType === 'fixed';
        const rate = isFixed ? 0 : (item.rate || getRateForCategory(item.category));
        const w = isFixed ? 0 : ((item.weight || 0) * item.qty);
        const p = isFixed ? ((item.price || 0) * item.qty) : (w * rate);
        totalWeight += w;
        totalPrice += p;
        totalPieces += item.qty;
    });

    saveBasket();

    // Update Nav Mini-Báscula Widget (works on both index.html and catalogo.html)
    if (navScaleCount) {
        navScaleCount.textContent = String(totalPieces);
        navScaleCount.classList.toggle('has-items', totalPieces > 0);
    }
    if (navScaleWeight) {
        navScaleWeight.textContent = `${totalWeight.toFixed(2)} kg`;
    }
    if (navScaleWidget) {
        navScaleWidget.classList.toggle('has-items', totalPieces > 0);
    }

    // If we are on index.html (no scale DOM), we're done
    if (!basketItemsList) return;

    if (basketPiecesPill) {
        basketPiecesPill.textContent = totalPieces === 1 ? '1 pieza' : `${totalPieces} piezas`;
    }

    basketItemsList.innerHTML = '';

    if (basket.length === 0) {
        basketItemsList.innerHTML = '<li class="empty-basket-message">La balanza está vacía. Tocá una cerámica o el botón <strong>+</strong> para pesarla.</li>';
        if (btnCheckout) btnCheckout.disabled = true;
    } else {
        if (btnCheckout) btnCheckout.disabled = false;

        basket.forEach(item => {
            const isFixed = item.pricingType === 'fixed';
            const rate = isFixed ? 0 : (item.rate || getRateForCategory(item.category));
            const itemTotalWeight = isFixed ? 0 : ((item.weight || 0) * item.qty);
            const itemTotalPrice = isFixed ? ((item.price || 0) * item.qty) : (itemTotalWeight * rate);

            const li = document.createElement('li');
            li.className = 'basket-item';
            li.innerHTML = `
                <div class="basket-item-info">
                    <img src="${item.img || 'images/cutouts/plato-verde-musgo.webp'}" alt="" class="basket-item-thumb">
                    <div>
                        <span class="basket-item-name">${item.shortName || item.name}</span>
                        <span class="basket-item-weight">${isFixed ? 'Pieza especial · Precio único' : `${itemTotalWeight.toFixed(2)} kg · $${rate.toFixed(2)}/kg`}</span>
                    </div>
                </div>
                <div class="basket-item-actions">
                    <div class="basket-qty-controls">
                        <button type="button" class="btn-qty-mini" data-id="${item.id}" data-delta="-1" aria-label="Restar unidad">-</button>
                        <span>${item.qty}</span>
                        <button type="button" class="btn-qty-mini" data-id="${item.id}" data-delta="1" aria-label="Sumar unidad">+</button>
                    </div>
                    <strong class="basket-item-price">${formatCurrency(itemTotalPrice)}</strong>
                </div>
            `;
            basketItemsList.appendChild(li);
        });

        basketItemsList.querySelectorAll('.btn-qty-mini').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const delta = parseInt(btn.getAttribute('data-delta'), 10);
                changeBasketItemQty(id, delta);
            });
        });
    }

    if (totalWeightDisplay) totalWeightDisplay.textContent = `${totalWeight.toFixed(2)} kg`;
    if (totalPriceDisplay) totalPriceDisplay.textContent = formatCurrency(totalPrice);

    // Rotate Scale Needle (5kg = 300deg rotation, capped at 5.2kg)
    if (scaleNeedle) {
        const cappedWeight = Math.min(totalWeight, 5.2);
        const rotationAngle = (cappedWeight / 5) * 300;
        scaleNeedle.style.transform = `rotate(${rotationAngle}deg)`;
    }

    renderStackedTrayItems(totalWeight);
};

// Initialize Alacena & Scale on load
renderAlacenaShelves();
updateScale();

// --- Checkout / Store Visit Modal Logic ---
if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
        let totalWeight = 0;
        let totalPrice = 0;

        if (modalItemsList) modalItemsList.innerHTML = '';

        basket.forEach(item => {
            const rate = item.rate || getRateForCategory(item.category);
            const itemTotalWeight = item.weight * item.qty;
            const itemTotalPrice = itemTotalWeight * rate;
            totalWeight += itemTotalWeight;
            totalPrice += itemTotalPrice;

            const row = document.createElement('div');
            row.className = 'modal-item-row';
            row.innerHTML = `
                <span>${item.name} (×${item.qty} · ${itemTotalWeight.toFixed(2)} kg)</span>
                <span>${formatCurrency(itemTotalPrice)}</span>
            `;
            if (modalItemsList) modalItemsList.appendChild(row);
        });

        if (modalWeight) modalWeight.textContent = `${totalWeight.toFixed(2)} kg`;
        if (modalPrice) modalPrice.textContent = formatCurrency(totalPrice);

        // Build WhatsApp message encouraging in-store pickup in Punta Piedras
        let messageLines = [
            '¡Hola BasKula! 🌿⚖️',
            'Estuve probando la Báscula Interactiva en la web y me encantó esta selección para ir a ver y retirar en la tienda de Punta Piedras:',
            ''
        ];
        basket.forEach(item => {
            const rate = item.rate || getRateForCategory(item.category);
            const itemTotalWeight = item.weight * item.qty;
            const itemTotalPrice = itemTotalWeight * rate;
            messageLines.push(`• ${item.name} (x${item.qty}) — ${itemTotalWeight.toFixed(2)} kg ($${rate.toFixed(2)}/kg) = ${formatCurrency(itemTotalPrice)}`);
        });
        messageLines.push('');
        messageLines.push(`*Peso estimado en balanza:* ${totalWeight.toFixed(2)} kg`);
        messageLines.push(`*Total estimado:* ${formatCurrency(totalPrice)}`);
        messageLines.push('');
        messageLines.push('¿Tienen disponibilidad para apartarlas y pasar por el local?');

        const whatsappMessage = encodeURIComponent(messageLines.join('\n'));
        if (whatsappLink) whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

        if (checkoutModal) checkoutModal.classList.add('open');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

const closeModal = () => {
    if (checkoutModal) checkoutModal.classList.remove('open');
};

if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalDoneBtn) modalDoneBtn.addEventListener('click', closeModal);
if (checkoutModal) {
    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) {
            closeModal();
        }
    });
}

// --- Postcard Form Logic (Netlify Forms via AJAX) ---
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const btnSubmit = contactForm.querySelector('.btn-postcard');
        const originalContent = btnSubmit.innerHTML;

        // Sending state
        btnSubmit.innerHTML = `<i data-lucide="loader"></i> Enviando...`;
        btnSubmit.disabled = true;
        lucide.createIcons();

        // Serialize form data (encodes "form-name" + honeypot + fields)
        const formData = new FormData(contactForm);

        fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        })
            .then(() => {
                btnSubmit.innerHTML = `<i data-lucide="check"></i> ¡Enviado!`;
                btnSubmit.style.backgroundColor = 'var(--color-olive)';
                btnSubmit.style.boxShadow = 'none';
                lucide.createIcons();

                alert(`¡Gracias por tu mensaje! Tu postal fue enviada con éxito. Nos pondremos en contacto muy pronto.`);

                setTimeout(() => {
                    contactForm.reset();
                    btnSubmit.innerHTML = originalContent;
                    btnSubmit.style.backgroundColor = 'var(--color-mustard)';
                    btnSubmit.style.boxShadow = '0 4px 15px rgba(226, 167, 39, 0.3)';
                    btnSubmit.disabled = false;
                    lucide.createIcons();
                }, 2000);
            })
            .catch((error) => {
                btnSubmit.innerHTML = originalContent;
                btnSubmit.disabled = false;
                lucide.createIcons();
                alert('Hubo un problema al enviar el mensaje. Por favor, intentá de nuevo o escribinos a info@baskula.com');
                console.error('Form submit error:', error);
            });
    });
}

// --- Hero Slider Logic (Costa Nova style + Responsive Crossfade) ---
function initHeroSlider() {
    const isMobile = window.innerWidth <= 768;
    const slides = isMobile
        ? document.querySelectorAll('.hero-slider .slide.mobile-only')
        : document.querySelectorAll('.hero-slider .slide.desktop-only');
    const pagination = isMobile
        ? document.querySelector('.slider-pagination.mobile-only')
        : document.querySelector('.slider-pagination.desktop-only');
    const dashes = pagination
        ? pagination.querySelectorAll('.pagination-dash')
        : [];

    if (slides.length <= 1) return null;

    let currentIndex = 0;
    let slideInterval = null;

    const showSlide = (index) => {
        slides.forEach(s => s.classList.remove('active'));
        dashes.forEach(d => d.classList.remove('active'));
        currentIndex = (index + slides.length) % slides.length;
        slides[currentIndex].classList.add('active');
        if (dashes[currentIndex]) dashes[currentIndex].classList.add('active');
    };

    const nextSlide = () => {
        showSlide(currentIndex + 1);
    };

    const startSlideShow = () => {
        if (slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, isMobile ? 4500 : 6000);
    };

    dashes.forEach((dash, idx) => {
        dash.addEventListener('click', () => {
            showSlide(idx);
            startSlideShow();
        });
    });

    showSlide(0);
    startSlideShow();

    return () => {
        if (slideInterval) clearInterval(slideInterval);
    };
}

let cleanupSlider = null;
if (document.querySelector('.hero-slider')) {
    cleanupSlider = initHeroSlider();
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        const currentIsMobile = window.innerWidth <= 768;
        const lastIsMobile = lastWidth <= 768;
        if (currentIsMobile !== lastIsMobile) {
            lastWidth = window.innerWidth;
            if (cleanupSlider) cleanupSlider();
            cleanupSlider = initHeroSlider();
        }
    });
}

// ==========================================================================
// COLECCIÓN FESTIVA / NAVIDAD (A la mesa, en las Fiestas)
// ==========================================================================
const HOLIDAY_ITEMS = [
    {
        id: 'holiday-pinitos-festivos',
        name: 'Set de Pinitos Esmaltados Festivos',
        shortName: 'Pinitos Esmaltados',
        pricingType: 'fixed',
        price: 28,
        priceFormatted: '$28',
        weight: 0.68,
        weightFormatted: '680g',
        badge: 'Edición Fiestas',
        img: 'images/navidad-banner-1.jpg',
        dimensions: '22 cm × 18 cm · Set Navideño',
        finish: 'Esmalte brillante verde pino y frutos rojos',
        story: 'Piezas artesanales en forma de pino ideales para entradas, frutos secos, confituras o como detalle central de la mesa navideña.'
    },
    {
        id: 'holiday-fuente-dorada',
        name: 'Fuente Oval Festiva Borde Dorado',
        shortName: 'Fuente Festiva',
        pricingType: 'weight',
        rate: 16.50,
        price: 19.80,
        priceFormatted: '$16.50 / kg',
        weight: 1.20,
        weightFormatted: '~1.2 kg ($19.80)',
        badge: 'Por Kilo',
        img: 'images/ceramics/tabla-servir-28usd.webp',
        dimensions: '36 cm × 24 cm · Fuente para servir',
        finish: 'Gres marfil con acabado satinado',
        story: 'La reina de la mesa familiar: fuente amplia para carnes, ensaladas de fiesta o postres navideños, cobrada exactamente por lo que pesa.'
    },
    {
        id: 'holiday-jarra-celebracion',
        name: 'Jarra Festiva Red Berry',
        shortName: 'Jarra Red Berry',
        pricingType: 'fixed',
        price: 35,
        priceFormatted: '$35',
        weight: 1.05,
        weightFormatted: '1.05 kg',
        badge: 'Ideal Regalo',
        img: 'images/ceramics/jarra-family-red.webp',
        dimensions: 'Alto 27 cm · Capacidad 1.5 L',
        finish: 'Gres esmaltado rojo intenso artesanal',
        story: 'Una presencia impactante en cualquier mesa de brindis. Su color rojo festivo aporta toda la calidez y el encanto de la Navidad portuguesa.'
    },
    {
        id: 'holiday-platos-degrade',
        name: 'Plato Playo Bicolor Verde & Rosa',
        shortName: 'Plato Bicolor Fiestas',
        pricingType: 'weight',
        rate: 16.50,
        price: 9.57,
        priceFormatted: '$16.50 / kg',
        weight: 0.58,
        weightFormatted: '~580g ($9.50 c/u)',
        badge: 'Por Kilo',
        img: 'images/navidad-banner-2.jpg',
        dimensions: 'Ø 27 cm · Plato Playo Principal',
        finish: 'Esmaltado degradé verde bosque y cereza',
        story: 'Ideal para armar tu vajilla festiva combinando tonos clásicos de fin de año con la suavidad del esmalte artesanal al peso.'
    },
    {
        id: 'holiday-plato-sol-dorado',
        name: 'Plato de Sol Terracota & Oro',
        shortName: 'Plato de Sol',
        pricingType: 'fixed',
        price: 35,
        priceFormatted: '$35',
        weight: 0.98,
        weightFormatted: '980g',
        badge: 'Pieza de Autor',
        img: 'images/ceramics/plato-sol-edicion-35usd.webp',
        dimensions: 'Ø 29 cm · Plato de Celebración',
        finish: 'Pintado a mano con detalles solares',
        story: 'Símbolo de luz y nuevos comienzos para la mesa de fin de año. Perfecto como centro de mesa o bandeja de servicio.'
    },
    {
        id: 'holiday-jarrita-regalo',
        name: 'Jarrita Individual Red & Cream',
        shortName: 'Jarrita Individual',
        pricingType: 'fixed',
        price: 22,
        priceFormatted: '$22',
        weight: 0.755,
        weightFormatted: '755g',
        badge: 'Detalle Especial',
        img: 'images/ceramics/jarrita-family-red.webp',
        dimensions: 'Alto 18 cm · Capacidad 600 ml',
        finish: 'Gres esmaltado artesanal',
        story: 'El regalo navideño ideal para amantes del diseño: práctica, hermosa y con el peso auténtico de la cerámica tradicional.'
    }
];

const initHolidayCarousel = () => {
    const track = document.getElementById('holiday-track');
    const viewport = document.getElementById('holiday-viewport');
    const prevBtn = document.getElementById('holiday-prev-btn');
    const nextBtn = document.getElementById('holiday-next-btn');
    const dotsContainer = document.getElementById('holiday-mobile-dots');

    if (!track || !viewport) return;

    track.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    let wasDragging = false;

    HOLIDAY_ITEMS.forEach((item, idx) => {
        const card = document.createElement('article');
        card.className = 'bw-product-card';
        card.setAttribute('data-id', item.id);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Saber más sobre ${item.name}`);

        const metaText = item.pricingType === 'weight' ? 'Venta por kilo · Cerámica artesanal' : 'Edición especial · Lista para regalar';
        const badgeHTML = item.badge ? `<span class="holiday-card-badge">${item.badge}</span>` : '';

        card.innerHTML = `
            <div class="bw-product-card__figure">
                <div class="bw-product-card__media">
                    <button type="button" class="card-heart-btn" data-id="${item.id}" aria-label="Guardar ${item.name} en mi balanza" title="Agregar a mi balanza">
                        <svg viewBox="0 0 24 24" class="card-heart-svg">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>
                    <span class="holiday-transit-badge"><span class="badge-ship-icon">🚢</span> En viaje · Noviembre</span>
                    <img src="${item.img}" alt="${item.name}" class="bw-product-card__image" loading="lazy" decoding="async" draggable="false">
                    <span class="gallery-view-hint"><i data-lucide="eye"></i> Saber más</span>
                </div>
            </div>
            <div class="bw-product-card__info">
                <a href="javascript:void(0)" class="bw-product-title" title="${item.name}">${item.name}</a>
                <div class="bw-product-meta-row">
                    <span class="bw-weight-tag"><i data-lucide="scale"></i> ${item.weightFormatted}</span>
                    <span class="bw-price-pill">${item.priceFormatted}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (wasDragging || e.target.closest('.card-heart-btn')) return;
            openAparadorModal(item);
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.target.closest('.card-heart-btn')) return;
                e.preventDefault();
                openAparadorModal(item);
            }
        });

        track.appendChild(card);

        if (dotsContainer) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = `bw-dot${idx === 0 ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Ver producto ${idx + 1}`);
            dot.addEventListener('click', () => {
                const cardEl = track.querySelectorAll('.bw-product-card')[idx];
                if (cardEl) {
                    viewport.scrollTo({
                        left: cardEl.offsetLeft - track.offsetLeft,
                        behavior: 'smooth'
                    });
                }
            });
            dotsContainer.appendChild(dot);
        }
    });

    const updateNavButtons = () => {
        if (!prevBtn || !nextBtn) return;
        const maxScroll = viewport.scrollWidth - viewport.clientWidth - 4;

        if (viewport.scrollWidth <= viewport.clientWidth + 4) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = '';
            nextBtn.style.display = '';
            prevBtn.disabled = viewport.scrollLeft <= 4;
            nextBtn.disabled = viewport.scrollLeft >= maxScroll;
        }

        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.bw-dot');
            const cards = track.querySelectorAll('.bw-product-card');
            const scrollMiddle = viewport.scrollLeft + (viewport.clientWidth / 2);
            cards.forEach((card, i) => {
                const cLeft = card.offsetLeft - track.offsetLeft;
                const cRight = cLeft + card.offsetWidth;
                if (scrollMiddle >= cLeft && scrollMiddle < cRight) {
                    dots.forEach(d => d.classList.remove('active'));
                    if (dots[i]) dots[i].classList.add('active');
                }
            });
        }
    };

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const scrollDistance = viewport.clientWidth * 0.75;
            viewport.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const scrollDistance = viewport.clientWidth * 0.75;
            viewport.scrollBy({ left: scrollDistance, behavior: 'smooth' });
        });
    }

    viewport.addEventListener('scroll', updateNavButtons, { passive: true });
    window.addEventListener('resize', updateNavButtons, { passive: true });

    let isDown = false;
    let startX = 0;
    let initialScrollLeft = 0;

    viewport.addEventListener('mousedown', (e) => {
        isDown = true;
        wasDragging = false;
        startX = e.pageX - viewport.offsetLeft;
        initialScrollLeft = viewport.scrollLeft;
    });

    viewport.addEventListener('mouseleave', () => {
        isDown = false;
    });

    viewport.addEventListener('mouseup', () => {
        isDown = false;
        setTimeout(() => { wasDragging = false; }, 80);
    });

    viewport.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - viewport.offsetLeft;
        const walk = (x - startX) * 1.35;
        if (Math.abs(walk) > 4) {
            wasDragging = true;
            viewport.scrollLeft = initialScrollLeft - walk;
        }
    });

    setTimeout(updateNavButtons, 100);

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

// ==========================================================================
// BESTSELLERS · PIEZAS DE AUTOR (index.html)
// ==========================================================================
const FIXED_PRICE_ITEMS = [
    {
        id: 'plato-sol-edicion-fp',
        name: 'Plato de Sol Terracota Edición Especial',
        shortName: 'Plato de Sol',
        pricingType: 'fixed',
        price: 35,
        priceFormatted: '$35',
        weight: 0.98,
        weightFormatted: '980g',
        img: 'images/ceramics/plato-sol-edicion-35usd.webp',
        dimensions: 'Ø 29 cm · Pieza de Colección',
        finish: 'Esmaltado Satinado Terracota y Marfil',
        story: 'Edición exclusiva con motivo solar pintado a mano. Una pieza protagonista de centro de mesa o decoración mural de alta artesanía.'
    },
    {
        id: 'jarra-family-red-fp',
        name: 'Jarra Family Red',
        shortName: 'Jarra Family Red',
        pricingType: 'fixed',
        price: 35,
        priceFormatted: '$35',
        weight: 1.055,
        weightFormatted: '1.055 kg',
        img: 'images/ceramics/jarra-family-red.webp',
        dimensions: 'Alto 27 cm · Capacidad 1.5 L',
        finish: 'Gres Esmaltado Bicolor',
        story: 'Jarra de gran porte con asa ergonómica robusta y boquilla vertedora precisa. Ideal para servir agua fresca, limonadas o lucir como florero rústico.'
    },
    {
        id: 'jarrita-family-red-fp',
        name: 'Jarrita Individual Family Red',
        shortName: 'Jarrita Individual',
        pricingType: 'fixed',
        price: 35,
        priceFormatted: '$35',
        weight: 0.755,
        weightFormatted: '755g',
        img: 'images/ceramics/jarrita-family-red.webp',
        dimensions: 'Alto 18 cm · Capacidad 600 ml',
        finish: 'Gres Esmaltado Bicolor',
        story: 'Compañera individual de la colección Family Red. Perfecta para servir leche, almíbares, salsas o aceite en la mesa con encanto.'
    },
    {
        id: 'tabla-servir-fp',
        name: 'Tabla Amplia de Servir',
        shortName: 'Tabla Amplia',
        pricingType: 'fixed',
        price: 38,
        priceFormatted: '$38',
        weight: 1.350,
        weightFormatted: '1.350 kg',
        img: 'images/ceramics/tabla-servir-28usd.webp',
        dimensions: '38 cm × 22 cm · Formato Tabla',
        finish: 'Cerámica Rústica de Alta Densidad',
        story: 'Tabla cerámica plana con asa perforada para colgar. Diseñada para quesos, fiambres, panes artesanales y aperitivos de autor.'
    }
];

const initAparador = () => {
    const track = document.getElementById('aparador-track');
    const viewport = document.getElementById('aparador-viewport');
    const prevBtn = document.getElementById('aparador-prev-btn');
    const nextBtn = document.getElementById('aparador-next-btn');
    const dotsContainer = document.getElementById('bw-mobile-dots');

    if (!track || !viewport) return;

    // Renderizar tarjetas estilo Bone & White (Precios Fijos sin etiqueta de peso en la tarjeta)
    track.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    let wasDragging = false;

    FIXED_PRICE_ITEMS.forEach((item, idx) => {
        const card = document.createElement('article');
        card.className = 'bw-product-card';
        card.setAttribute('data-id', item.id);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Saber más sobre ${item.name}`);

        card.innerHTML = `
            <div class="bw-product-card__figure">
                <div class="bw-product-card__media">
                    <button type="button" class="card-heart-btn" data-id="${item.id}" aria-label="Guardar ${item.name} en mi balanza" title="Agregar a mi balanza">
                        <svg viewBox="0 0 24 24" class="card-heart-svg">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>
                    <img src="${item.img}" alt="${item.name}" class="bw-product-card__image" loading="lazy" decoding="async" draggable="false">
                    <span class="gallery-view-hint"><i data-lucide="eye"></i> Saber más</span>
                </div>
            </div>
            <div class="bw-product-card__info">
                <a href="javascript:void(0)" class="bw-product-title" title="${item.name}">${item.name}</a>
                <div class="bw-product-meta-row">
                    <span class="bw-price-pill">${item.priceFormatted}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (wasDragging || e.target.closest('.card-heart-btn')) return;
            openAparadorModal(item);
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.target.closest('.card-heart-btn')) return;
                e.preventDefault();
                openAparadorModal(item);
            }
        });

        track.appendChild(card);

        // Indicador dot para móviles
        if (dotsContainer) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = `bw-dot${idx === 0 ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Ver producto ${idx + 1}`);
            dot.addEventListener('click', () => {
                const cardEl = track.querySelectorAll('.bw-product-card')[idx];
                if (cardEl) {
                    viewport.scrollTo({
                        left: cardEl.offsetLeft - track.offsetLeft,
                        behavior: 'smooth'
                    });
                }
            });
            dotsContainer.appendChild(dot);
        }
    });

    // Controles de Navegación Flotantes estilo Bone & White
    const updateNavButtons = () => {
        if (!prevBtn || !nextBtn) return;
        const maxScroll = viewport.scrollWidth - viewport.clientWidth - 4;

        if (viewport.scrollWidth <= viewport.clientWidth + 4) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = '';
            nextBtn.style.display = '';
            prevBtn.disabled = viewport.scrollLeft <= 4;
            nextBtn.disabled = viewport.scrollLeft >= maxScroll;
        }

        // Actualizar dots en móvil
        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.bw-dot');
            const cards = track.querySelectorAll('.bw-product-card');
            const scrollMiddle = viewport.scrollLeft + (viewport.clientWidth / 2);
            cards.forEach((card, i) => {
                const cLeft = card.offsetLeft - track.offsetLeft;
                const cRight = cLeft + card.offsetWidth;
                if (scrollMiddle >= cLeft && scrollMiddle < cRight) {
                    dots.forEach(d => d.classList.remove('active'));
                    if (dots[i]) dots[i].classList.add('active');
                }
            });
        }
    };

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const scrollDistance = viewport.clientWidth * 0.75;
            viewport.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const scrollDistance = viewport.clientWidth * 0.75;
            viewport.scrollBy({ left: scrollDistance, behavior: 'smooth' });
        });
    }

    viewport.addEventListener('scroll', updateNavButtons, { passive: true });
    window.addEventListener('resize', updateNavButtons, { passive: true });

    // Drag to scroll en desktop (allow-drag como Bone & White)
    let isDown = false;
    let startX = 0;
    let initialScrollLeft = 0;

    viewport.addEventListener('mousedown', (e) => {
        isDown = true;
        wasDragging = false;
        startX = e.pageX - viewport.offsetLeft;
        initialScrollLeft = viewport.scrollLeft;
    });

    viewport.addEventListener('mouseleave', () => {
        isDown = false;
    });

    viewport.addEventListener('mouseup', () => {
        isDown = false;
        setTimeout(() => { wasDragging = false; }, 80);
    });

    viewport.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - viewport.offsetLeft;
        const walk = (x - startX) * 1.35;
        if (Math.abs(walk) > 4) {
            wasDragging = true;
            viewport.scrollLeft = initialScrollLeft - walk;
        }
    });

    // Estado inicial de botones
    setTimeout(updateNavButtons, 100);

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

// Modal para las piezas de Autor
const openAparadorModal = (item) => {
    const modal = document.getElementById('aparador-modal');
    if (!modal) return;

    const titleEl = document.getElementById('aparador-modal-title');
    const storyEl = document.getElementById('aparador-modal-story');
    const imgEl = document.getElementById('aparador-modal-img');
    const priceEl = document.getElementById('aparador-modal-price');
    const weightEl = document.getElementById('aparador-modal-weight');
    const dimEl = document.getElementById('aparador-modal-dimensions');
    const finishEl = document.getElementById('aparador-modal-finish');
    const wppEl = document.getElementById('aparador-modal-whatsapp');

    if (titleEl) titleEl.textContent = item.name;
    if (storyEl) storyEl.textContent = item.story;
    if (imgEl) {
        imgEl.src = item.img;
        imgEl.alt = item.name;
    }
    if (priceEl) priceEl.textContent = item.priceFormatted;
    if (weightEl) weightEl.textContent = item.weightFormatted;
    if (dimEl) dimEl.textContent = item.dimensions;
    if (finishEl) finishEl.textContent = item.finish;

    const badgeEl = document.getElementById('aparador-modal-badge');
    const originTagEl = modal.querySelector('.ficha-origin-tag');
    const isHoliday = HOLIDAY_ITEMS.some(h => h.id === item.id) || (item.id && item.id.startsWith('holiday-'));
    const isFixed = item.pricingType === 'fixed';

    if (badgeEl) {
        if (isHoliday) {
            badgeEl.innerHTML = '🚢 En viaje · Llegando en Noviembre';
        } else if (isFixed) {
            badgeEl.innerHTML = 'Pieza Especial';
        } else {
            badgeEl.innerHTML = 'Cerámica por Kilo';
        }
    }
    if (originTagEl) {
        if (isHoliday) {
            originTagEl.textContent = 'BasKula · Próximo Desembarco Navideño';
        } else if (isFixed) {
            originTagEl.textContent = 'BasKula · Piezas Especiales';
        } else {
            originTagEl.textContent = 'BasKula · Cerámica Portuguesa por Kilo';
        }
    }

    if (wppEl) {
        const wppTextSpan = wppEl.querySelector('span');
        if (isHoliday) {
            if (wppTextSpan) wppTextSpan.textContent = 'Avisarme al llegar';
            const text = encodeURIComponent(`Hola BasKula! Me gustaría anotarme en la lista de espera para cuando llegue la pieza navideña "${item.name}" (${item.priceFormatted}) que vi en su web.`);
            wppEl.href = `https://wa.me/59893658477?text=${text}`;
        } else if (isFixed) {
            if (wppTextSpan) wppTextSpan.textContent = 'Reserva por wpp!';
            const text = encodeURIComponent(`Hola BasKula, quisiera consultar disponibilidad para adquirir la pieza ${item.name} (${item.priceFormatted}) que vi en su web.`);
            wppEl.href = `https://wa.me/59893658477?text=${text}`;
        } else {
            if (wppTextSpan) wppTextSpan.textContent = 'Consultar por esta pieza';
            const text = encodeURIComponent(`Hola BasKula, quisiera consultar por la pieza "${item.name}" (${item.weightFormatted} · ${item.priceFormatted}) que vi en el catálogo de su web.`);
            wppEl.href = `https://wa.me/59893658477?text=${text}`;
        }
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

const closeAparadorModal = () => {
    const modal = document.getElementById('aparador-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
};

// ==========================================================================
// CARRUSEL DE PRODUCTOS POR KILO (DEBAJO DE "UNA EXPERIENCIA DIFERENTE")
// ==========================================================================
const PRODUCTS_CAROUSEL_ITEMS = [
    {
        id: 'plato-rayas-navy',
        name: 'Plato Playo Rayas Navy',
        shortName: 'Plato Rayas Navy',
        category: 'platos',
        weight: 0.975,
        weightFormatted: '0.98 kg',
        rate: 16.50,
        priceFormatted: '$16.50 / kg',
        pricingType: 'weight',
        img: 'images/ceramics/plato-rayas-navy.webp',
        dimensions: 'Ø 28 cm · Alto 2.2 cm',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Plato playo de inspiración mediterránea y estética marinera. Su composición de franjas azul índigo de trazo orgánico sobre fondo blanco puro viste cualquier mesa con frescura, elegancia y calidez artesanal.'
    },
    {
        id: 'bowl-rayas-navy',
        name: 'Bowl Cerealero Rayas Navy',
        shortName: 'Bowl Rayas Navy',
        category: 'bowls',
        weight: 0.480,
        weightFormatted: '0.48 kg',
        rate: 29.50,
        priceFormatted: '$29.50 / kg',
        pricingType: 'weight',
        img: 'images/ceramics/bowl-rayas-navy.webp',
        dimensions: 'Ø 14.5 cm · Alto 8 cm (550 ml)',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Bowl cónico con fileteado vertical en azul profundo sobre base cerámica blanca. Cómodo y versátil, ideal para desayunos, cereales, sopas, yogurt o dips en el centro de la mesa.'
    },
    {
        id: 'taza-rayas-navy',
        name: 'Taza Mug Rayas Navy',
        shortName: 'Taza Rayas Navy',
        category: 'tazas',
        weight: 0.360,
        weightFormatted: '0.36 kg',
        rate: 29.50,
        priceFormatted: '$29.50 / kg',
        pricingType: 'weight',
        img: 'images/ceramics/taza-rayas-navy.webp',
        dimensions: 'Ø 9 cm · Alto 11 cm (350 ml)',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Mug cerámico con asa ergonómica modelada y franjas verticales azul marino. De tacto cálido y cómodo agarre, perfecto para café filtrado, té en hebras o infusiones matutinas.'
    },
    {
        id: 'ensaladera-rayas-navy',
        name: 'Ensaladera Honda Rayas Navy',
        shortName: 'Ensaladera Rayas Navy',
        category: 'ensaladeras',
        weight: 0.975,
        weightFormatted: '0.98 kg',
        rate: 16.50,
        priceFormatted: '$16.50 / kg',
        pricingType: 'weight',
        img: 'images/ceramics/ensaladera-rayas-navy.webp',
        dimensions: 'Ø 25 cm · Alto 9.5 cm',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Pieza central de generosa capacidad con perfil abierto y líneas que convergen hacia la base. Diseñada para lucir ensaladas frescas, pastas para compartir o como frutero de autor en la cocina.'
    },
    {
        id: 'plato-corona-floral',
        name: 'Plato Playo Corona Floral',
        shortName: 'Plato Corona Floral',
        category: 'platos',
        weight: 0.875,
        weightFormatted: '0.88 kg',
        rate: 16.50,
        priceFormatted: '$16.50 / kg',
        pricingType: 'weight',
        img: 'images/ceramics/plato-corona-floral.webp',
        dimensions: 'Ø 27 cm · Alto 2.2 cm',
        finish: 'Esmaltado Satinado Suave',
        story: 'Una pieza de inspiración campestre y calidez mediterránea. Su diseño presenta una corona circular de hojas y flores pinceladas en tonos terracota y rosa empolvado, enmarcando el centro del plato para destacar los colores vivos.'
    },
    {
        id: 'plato-sol-botanico',
        name: 'Plato Entrada Sol Botánico',
        shortName: 'Plato Sol Botánico',
        category: 'platos',
        weight: 0.522,
        weightFormatted: '0.52 kg',
        rate: 16.50,
        priceFormatted: '$16.50 / kg',
        pricingType: 'weight',
        img: 'images/ceramics/plato-sol-botanico.webp',
        dimensions: 'Ø 21 cm · Alto 2.0 cm',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'El complemento ideal para entradas, desayunos o postres. Destaca por su flor central y una delicada guarda radial en tonos arcilla tostada y rubor que irradia frescura.'
    }
];

const initProductosKiloCarousel = () => {
    const track = document.getElementById('productos-kilo-track');
    const viewport = document.getElementById('productos-kilo-viewport');
    const prevBtn = document.getElementById('productos-kilo-prev-btn');
    const nextBtn = document.getElementById('productos-kilo-next-btn');
    const dotsContainer = document.getElementById('productos-kilo-dots');

    if (!track || !viewport) return;

    track.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    let wasDragging = false;

    PRODUCTS_CAROUSEL_ITEMS.forEach((item, idx) => {
        const card = document.createElement('article');
        card.className = 'bw-product-card';
        card.setAttribute('data-id', item.id);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Saber más sobre ${item.name}`);

        card.innerHTML = `
            <div class="bw-product-card__figure">
                <div class="bw-product-card__media">
                    <button type="button" class="card-heart-btn" data-id="${item.id}" aria-label="Pesar ${item.name} en mi balanza" title="Agregar a mi balanza">
                        <svg viewBox="0 0 24 24" class="card-heart-svg">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>
                    <img src="${item.img}" alt="${item.name}" class="bw-product-card__image" loading="lazy" decoding="async" draggable="false">
                    <span class="gallery-view-hint"><i data-lucide="eye"></i> Saber más</span>
                </div>
            </div>
            <div class="bw-product-card__info">
                <a href="javascript:void(0)" class="bw-product-title" title="${item.name}">${item.name}</a>
                <div class="bw-product-meta-row">
                    <span class="bw-price-pill">${item.priceFormatted}</span>
                    <span class="bw-weight-tag"><i data-lucide="scale"></i> ${item.weightFormatted}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (wasDragging || e.target.closest('.card-heart-btn')) return;
            openAparadorModal(item);
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.target.closest('.card-heart-btn')) return;
                e.preventDefault();
                openAparadorModal(item);
            }
        });

        track.appendChild(card);

        // Indicador dot para móviles
        if (dotsContainer) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = `bw-dot${idx === 0 ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Ver producto ${idx + 1}`);
            dot.addEventListener('click', () => {
                const cardEl = track.querySelectorAll('.bw-product-card')[idx];
                if (cardEl) {
                    viewport.scrollTo({
                        left: cardEl.offsetLeft - track.offsetLeft,
                        behavior: 'smooth'
                    });
                }
            });
            dotsContainer.appendChild(dot);
        }
    });

    const updateNavButtons = () => {
        if (!prevBtn || !nextBtn) return;
        const maxScroll = viewport.scrollWidth - viewport.clientWidth - 4;

        if (viewport.scrollWidth <= viewport.clientWidth + 4) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = '';
            nextBtn.style.display = '';
            prevBtn.disabled = viewport.scrollLeft <= 4;
            nextBtn.disabled = viewport.scrollLeft >= maxScroll;
        }

        if (dotsContainer) {
            const dots = dotsContainer.querySelectorAll('.bw-dot');
            const cards = track.querySelectorAll('.bw-product-card');
            const scrollMiddle = viewport.scrollLeft + (viewport.clientWidth / 2);
            cards.forEach((card, i) => {
                const cLeft = card.offsetLeft - track.offsetLeft;
                const cRight = cLeft + card.offsetWidth;
                if (scrollMiddle >= cLeft && scrollMiddle < cRight) {
                    dots.forEach(d => d.classList.remove('active'));
                    if (dots[i]) dots[i].classList.add('active');
                }
            });
        }
    };

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const scrollDistance = viewport.clientWidth * 0.75;
            viewport.scrollBy({ left: -scrollDistance, behavior: 'smooth' });
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const scrollDistance = viewport.clientWidth * 0.75;
            viewport.scrollBy({ left: scrollDistance, behavior: 'smooth' });
        });
    }

    viewport.addEventListener('scroll', updateNavButtons, { passive: true });
    window.addEventListener('resize', updateNavButtons, { passive: true });

    let isDown = false;
    let startX = 0;
    let initialScrollLeft = 0;

    viewport.addEventListener('mousedown', (e) => {
        isDown = true;
        wasDragging = false;
        startX = e.pageX - viewport.offsetLeft;
        initialScrollLeft = viewport.scrollLeft;
    });

    viewport.addEventListener('mouseleave', () => {
        isDown = false;
    });

    viewport.addEventListener('mouseup', () => {
        isDown = false;
        setTimeout(() => { wasDragging = false; }, 80);
    });

    viewport.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - viewport.offsetLeft;
        const walk = (x - startX) * 1.35;
        if (Math.abs(walk) > 4) {
            wasDragging = true;
            viewport.scrollLeft = initialScrollLeft - walk;
        }
    });

    setTimeout(updateNavButtons, 100);

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

// Eventos de cierre del modal
document.addEventListener('DOMContentLoaded', () => {
    initHolidayCarousel();
    initAparador();
    initProductosKiloCarousel();
    initWishlistAndBalanzaSystem();

    const modal = document.getElementById('aparador-modal');
    const closeBtn = document.getElementById('aparador-modal-close');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeAparadorModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAparadorModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAparadorModal();
        }
    });
});

// ==========================================================================
// FEATURE: BALANZA FLOTANTE DE DOS PLATILLOS + CORAZONES + DRAWER DE RESERVA
// ==========================================================================

const getProductById = (id) => {
    return (
        (typeof PRODUCTS_CAROUSEL_ITEMS !== 'undefined' ? PRODUCTS_CAROUSEL_ITEMS.find(p => p.id === id) : null) ||
        HOLIDAY_ITEMS.find(p => p.id === id) ||
        FIXED_PRICE_ITEMS.find(p => p.id === id) ||
        (typeof CATALOG_ITEMS !== 'undefined' ? CATALOG_ITEMS.find(p => p.id === id) : null) ||
        basket.find(p => p.id === id) ||
        null
    );
};

const triggerScaleAnimation = () => {
    const floatingScaleBtn = document.getElementById('floatingScaleBtn');
    const sympatheticScale = document.querySelector('.sympathetic-scale');
    if (floatingScaleBtn) {
        floatingScaleBtn.classList.remove('scale-weighing-active');
        void floatingScaleBtn.offsetWidth;
        floatingScaleBtn.classList.add('scale-weighing-active');
        setTimeout(() => floatingScaleBtn.classList.remove('scale-weighing-active'), 1400);
    }
    if (sympatheticScale) {
        sympatheticScale.classList.remove('animating');
        void sympatheticScale.offsetWidth;
        sympatheticScale.classList.add('animating');
        setTimeout(() => sympatheticScale.classList.remove('animating'), 1400);
    }
};

const createHeartParticle = (sourceEl) => {
    if (!sourceEl) return;
    const rect = sourceEl.getBoundingClientRect();
    const particle = document.createElement('div');
    particle.className = 'floating-heart-particle';
    particle.innerHTML = `<svg viewBox="0 0 24 24" fill="#E0485A" stroke="#E0485A" width="22" height="22"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    particle.style.left = `${rect.left + rect.width / 2 - 11}px`;
    particle.style.top = `${rect.top + rect.height / 2 - 11}px`;
    particle.style.opacity = '1';
    particle.style.transform = 'scale(0.8)';
    document.body.appendChild(particle);

    requestAnimationFrame(() => {
        const destX = window.innerWidth - 60;
        const destY = window.innerHeight - 60;
        particle.style.left = `${destX}px`;
        particle.style.top = `${destY}px`;
        particle.style.transform = 'scale(1.4)';
        particle.style.opacity = '0';
    });

    setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, 800);
};

const toggleWishlistItem = (id, sourceEl) => {
    const existingIndex = basket.findIndex(b => b.id === id);
    if (existingIndex > -1) {
        basket.splice(existingIndex, 1);
    } else {
        const product = getProductById(id);
        if (product) {
            const isFixed = product.pricingType === 'fixed';
            const rate = isFixed ? 0 : (product.rate || 16.50);
            const unitPrice = isFixed ? (product.price || 35) : ((product.weight || 0.8) * rate);
            basket.push({
                id: product.id,
                name: product.name,
                shortName: product.shortName || product.name,
                category: product.category || 'especial',
                weight: product.weight || 0.8,
                weightFormatted: product.weightFormatted || `${product.weight} kg`,
                rate: rate,
                price: unitPrice,
                priceFormatted: product.priceFormatted || `$${unitPrice.toFixed(2)}`,
                pricingType: product.pricingType || 'weight',
                img: product.img,
                qty: 1
            });
            triggerScaleAnimation();
            createHeartParticle(sourceEl);
        }
    }
    saveBasket();
    updateWishlistUI();
    if (typeof updateScale === 'function') updateScale();
    if (typeof renderAlacenaShelves === 'function') renderAlacenaShelves();
};

const openWishlistDrawer = () => {
    const drawer = document.getElementById('wishlistDrawer');
    const overlay = document.getElementById('wishlistOverlay');
    if (!drawer || !overlay) return;
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateWishlistUI();
    triggerScaleAnimation();
};

const closeWishlistDrawer = () => {
    const drawer = document.getElementById('wishlistDrawer');
    const overlay = document.getElementById('wishlistOverlay');
    if (!drawer || !overlay) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
};

const updateWishlistUI = () => {
    let totalPieces = 0;
    let totalWeight = 0;
    let totalPrice = 0;

    basket.forEach(item => {
        const qty = item.qty || 1;
        totalPieces += qty;
        const isFixed = item.pricingType === 'fixed';
        if (!isFixed) {
            totalWeight += (item.weight || 0) * qty;
        }
        const itemPrice = item.price ? (item.price * qty) : ((item.weight || 0) * (item.rate || 16.50) * qty);
        totalPrice += itemPrice;
    });

    // 1. Botones de corazón en las tarjetas
    document.querySelectorAll('.card-heart-btn').forEach(btn => {
        const id = btn.getAttribute('data-id');
        const inBasket = basket.some(b => b.id === id);
        btn.classList.toggle('liked', inBasket);
    });

    // 2. Contador en el Nav
    const navHeartBtn = document.getElementById('navHeartBtn');
    const navHeartBadge = document.getElementById('navHeartBadge');
    if (navHeartBadge) {
        navHeartBadge.textContent = String(totalPieces);
        navHeartBadge.style.display = totalPieces > 0 ? 'inline-flex' : 'none';
        navHeartBadge.classList.remove('bump');
        void navHeartBadge.offsetWidth;
        navHeartBadge.classList.add('bump');
    }
    if (navHeartBtn) {
        navHeartBtn.classList.toggle('has-items', totalPieces > 0);
    }

    // 3. Balanza flotante abajo a la derecha
    const floatingScaleBadge = document.getElementById('floatingScaleBadge');
    const floatingScaleWeightText = document.getElementById('floatingScaleWeightText');
    const floatingScalePill = document.getElementById('floatingScalePill');
    if (floatingScaleBadge) {
        floatingScaleBadge.style.display = 'none';
    }
    if (floatingScaleWeightText) {
        floatingScaleWeightText.textContent = `${totalWeight.toFixed(2)} kg`;
    }
    if (floatingScalePill) {
        // Solo mostrar la píldora con peso si hay peso acumulado (artículos por peso)
        floatingScalePill.style.display = totalWeight > 0 ? 'block' : 'none';
    }

    // 4. Contenido del Drawer
    const drawerTotalWeight = document.getElementById('drawerTotalWeight');
    const drawerTotalPrice = document.getElementById('drawerTotalPrice');
    const drawerBody = document.getElementById('wishlistDrawerBody');
    const btnReserve = document.getElementById('btnReserveWhatsApp');

    if (drawerTotalWeight) drawerTotalWeight.textContent = `${totalWeight.toFixed(2)} kg`;
    if (drawerTotalPrice) drawerTotalPrice.textContent = `$${totalPrice.toFixed(2)} USD`;
    if (btnReserve) btnReserve.disabled = totalPieces === 0;

    if (drawerBody) {
        if (basket.length === 0) {
            drawerBody.innerHTML = `
                <div class="wishlist-empty-state">
                    <svg class="wishlist-empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor">
                        <path d="M22 58h20 M26 58c0-3 3-5 6-5s6 2 6 5 M32 16v37" stroke-width="2.5" stroke-linecap="round"/>
                        <circle cx="32" cy="14" r="3"/>
                        <path d="M12 18h40" stroke-width="2.5" stroke-linecap="round"/>
                        <line x1="14" y1="18" x2="8" y2="34" stroke-width="1.2"/>
                        <line x1="14" y1="18" x2="20" y2="34" stroke-width="1.2"/>
                        <path d="M6 34c1 4 7 6 8 6s7-2 8-6z" stroke-width="1"/>
                        <line x1="50" y1="18" x2="44" y2="34" stroke-width="1.2"/>
                        <line x1="50" y1="18" x2="56" y2="34" stroke-width="1.2"/>
                        <path d="M42 34c1 4 7 6 8 6s7-2 8-6z" stroke-width="1"/>
                    </svg>
                    <h4 class="wishlist-empty-title">Tu balanza está liviana</h4>
                    <p class="wishlist-empty-desc">
                        Hacé clic en el corazón ♥ de tus cerámicas favoritas para colocarlas en la balanza, pesarlas y reservarlas.
                    </p>
                </div>
            `;
        } else {
            drawerBody.innerHTML = '';
            basket.forEach(item => {
                const isFixed = item.pricingType === 'fixed';
                const itemTotalWeight = (item.weight || 0) * (item.qty || 1);
                const itemPrice = item.price ? (item.price * item.qty) : ((item.weight || 0) * (item.rate || 16.50) * item.qty);
                const weightStr = (item.weight || 0) >= 1 ? `${(item.weight || 0).toFixed(2)} kg` : `${Math.round((item.weight || 0) * 1000)}g`;

                const weightHTML = isFixed
                    ? `<span>Pieza especial · Precio único</span>`
                    : `<span>${weightStr} (×${item.qty} · ${itemTotalWeight.toFixed(2)} kg)</span>`;

                const card = document.createElement('div');
                card.className = 'wishlist-item-card';
                card.innerHTML = `
                    <img src="${item.img || 'images/ceramics/plato-sol-edicion-35usd.webp'}" alt="${item.name}" class="wishlist-item-thumb">
                    <div class="wishlist-item-details">
                        <h5 class="wishlist-item-name" title="${item.name}">${item.name}</h5>
                        <div class="wishlist-item-weight">
                            <i data-lucide="${isFixed ? 'sparkles' : 'scale'}"></i>
                            ${weightHTML}
                        </div>
                        <div class="wishlist-item-price">$${itemPrice.toFixed(2)} USD</div>
                    </div>
                    <div class="wishlist-item-actions">
                        <div class="wishlist-qty-group">
                            <button type="button" class="wishlist-qty-btn" data-action="dec" data-id="${item.id}" aria-label="Restar">−</button>
                            <span class="wishlist-qty-val">${item.qty}</span>
                            <button type="button" class="wishlist-qty-btn" data-action="inc" data-id="${item.id}" aria-label="Sumar">+</button>
                        </div>
                        <button type="button" class="wishlist-item-remove" data-action="remove" data-id="${item.id}" aria-label="Eliminar pieza" title="Quitar de la balanza">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                `;
                drawerBody.appendChild(card);
            });

            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }
    }
};

const handleWhatsAppReservation = () => {
    if (basket.length === 0) return;
    let totalPieces = 0;
    let totalWeight = 0;
    let totalPrice = 0;

    let lines = [
        '✨ *¡Hola BasKula! Me gustaría reservar estas piezas de mi balanza:*',
        ''
    ];

    basket.forEach((item) => {
        const qty = item.qty || 1;
        totalPieces += qty;
        const isFixed = item.pricingType === 'fixed';
        const itemWeight = isFixed ? 0 : ((item.weight || 0) * qty);
        const itemPrice = item.price ? (item.price * qty) : ((item.weight || 0) * (item.rate || 16.50) * qty);
        totalWeight += itemWeight;
        totalPrice += itemPrice;

        const weightStr = (item.weight || 0) >= 1 ? `${(item.weight || 0).toFixed(2)} kg` : `${Math.round((item.weight || 0) * 1000)}g`;
        const itemDetail = isFixed ? 'Pieza especial' : weightStr;
        lines.push(`• *${qty}x ${item.name}* (${itemDetail}) — $${itemPrice.toFixed(2)} USD`);
    });

    lines.push('');
    lines.push('─────────────────────');
    lines.push(`⚖️ *Total piezas:* ${totalPieces}`);
    if (totalWeight > 0) {
        lines.push(`⚖️ *Peso total en balanza:* ${totalWeight.toFixed(2)} kg`);
    }
    lines.push(`💰 *Total estimado:* $${totalPrice.toFixed(2)} USD`);
    lines.push('─────────────────────');
    lines.push('');
    lines.push('¿Podrían confirmarme disponibilidad para coordinar la entrega o retiro en Punta Piedras? ¡Muchas gracias!');

    const message = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/59893658477?text=${message}`;
    window.open(url, '_blank');
};

const initWishlistAndBalanzaSystem = () => {
    // 1. Delegación de clics en corazones de cualquier tarjeta
    document.addEventListener('click', (e) => {
        const heartBtn = e.target.closest('.card-heart-btn');
        if (heartBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = heartBtn.getAttribute('data-id');
            toggleWishlistItem(id, heartBtn);
            return;
        }

        // Acciones dentro del Drawer (+, -, trash)
        const qtyBtn = e.target.closest('.wishlist-qty-btn');
        if (qtyBtn) {
            e.preventDefault();
            const id = qtyBtn.getAttribute('data-id');
            const action = qtyBtn.getAttribute('data-action');
            const idx = basket.findIndex(b => b.id === id);
            if (idx > -1) {
                if (action === 'inc') {
                    basket[idx].qty = (basket[idx].qty || 1) + 1;
                } else if (action === 'dec') {
                    basket[idx].qty = (basket[idx].qty || 1) - 1;
                    if (basket[idx].qty <= 0) basket.splice(idx, 1);
                }
                saveBasket();
                updateWishlistUI();
                triggerScaleAnimation();
                if (typeof updateScale === 'function') updateScale();
            }
            return;
        }

        const removeBtn = e.target.closest('.wishlist-item-remove');
        if (removeBtn) {
            e.preventDefault();
            const id = removeBtn.getAttribute('data-id');
            const idx = basket.findIndex(b => b.id === id);
            if (idx > -1) {
                basket.splice(idx, 1);
                saveBasket();
                updateWishlistUI();
                triggerScaleAnimation();
                if (typeof updateScale === 'function') updateScale();
            }
            return;
        }
    });

    // 2. Disparadores de apertura del Drawer
    const navHeartBtn = document.getElementById('navHeartBtn');
    if (navHeartBtn) navHeartBtn.addEventListener('click', openWishlistDrawer);

    const floatingScaleBtn = document.getElementById('floatingScaleBtn');
    if (floatingScaleBtn) floatingScaleBtn.addEventListener('click', openWishlistDrawer);

    const floatingScalePill = document.getElementById('floatingScalePill');
    if (floatingScalePill) floatingScalePill.addEventListener('click', openWishlistDrawer);

    // 3. Disparadores de cierre del Drawer
    const wishlistCloseBtn = document.getElementById('wishlistCloseBtn');
    if (wishlistCloseBtn) wishlistCloseBtn.addEventListener('click', closeWishlistDrawer);

    const wishlistOverlay = document.getElementById('wishlistOverlay');
    if (wishlistOverlay) wishlistOverlay.addEventListener('click', closeWishlistDrawer);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeWishlistDrawer();
    });

    // 4. Botón de Reserva por WhatsApp
    const btnReserve = document.getElementById('btnReserveWhatsApp');
    if (btnReserve) btnReserve.addEventListener('click', handleWhatsAppReservation);

    // Sincronizar UI al inicio
    updateWishlistUI();
};
