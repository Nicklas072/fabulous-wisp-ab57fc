// ==========================================================================
// BasKula — Catálogo Centralizado de Productos y Tarifas por Kilo
// Este archivo permite que cualquier nuevo producto tenga automáticamente
// su página individual dedicada (producto.html?id=...)
// ==========================================================================

const BASKULA_RATES = {
    platos: 16.50,
    fuentes: 16.50,
    vasos: 29.50,
    tazas: 29.50,
    bowls: 29.50,
    ensaladeras: 29.50
};

const BASKULA_CATEGORY_LABELS = {
    todos: 'Todas las piezas',
    platos: 'Platos',
    tazas: 'Tazas',
    vasos: 'Vasos',
    bowls: 'Bowls',
    ensaladeras: 'Ensaladeras',
    fuentes: 'Fuentes'
};

const BASKULA_PRODUCTS = [
    {
        id: 'plato-verde-musgo',
        name: 'Plato Llano Verde Musgo',
        shortName: 'Plato Verde Musgo',
        category: 'platos',
        weight: 0.72,
        img: 'Plato llano con bordes.webp',
        images: [
            'Plato llano con bordes.webp'
        ],
        dimensions: 'Ø 27 cm · Alto 2.4 cm',
        finish: 'Esmalte Reactivo Mate-Satinado',
        story: 'Torneado con borde elevado y esmalte reactivo en tonos bosque húmedo. Durante la cocción a más de 1.200 °C en Portugal, el pigmento crea un halo oscuro único en el labio de cada plato.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C', 'Apto Congelador'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'plato-hondo-hojas',
        name: 'Plato Hondo Botánico Azul',
        shortName: 'Plato Hondo Botánico',
        category: 'platos',
        weight: 0.58,
        img: 'Plato hondo esmaltado.webp',
        images: [
            'Plato hondo esmaltado.webp'
        ],
        dimensions: 'Ø 23 cm · Profundidad 4.5 cm',
        finish: 'Esmalte Vitrificado Tradicional',
        story: 'Inspirado en los herbarios atlánticos portugueses. Su ala ancha enmarcada por hojas azules pintadas sobre esmalte crema lo convierte en el centro de cualquier mesa.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C', 'Apto Congelador'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'taza-azul-degrade',
        name: 'Taza Rústica Degradé Atlántico',
        shortName: 'Taza Degradé Azul',
        category: 'tazas',
        weight: 0.31,
        img: 'images/taza-azul-degrade.jpg',
        images: [
            'images/taza-azul-degrade.jpg'
        ],
        dimensions: 'Ø 9.2 cm · Alto 11 cm (340 ml)',
        finish: 'Doble Baño Reactivo Tostado y Bruma',
        story: 'Su borde funde tonos caramelo tostado que caen como espuma de mar sobre un cuerpo azul mineral. El asa ergonómica conserva el tacto cálido del gres portugués.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'vaso-gris-esmaltado',
        name: 'Vaso Degradado Gris Bruma',
        shortName: 'Vaso Gris Bruma',
        category: 'vasos',
        weight: 0.25,
        img: 'Vaso degradado Gris Esmaltado.webp',
        images: [
            'Vaso degradado Gris Esmaltado.webp'
        ],
        dimensions: 'Ø 8.5 cm · Alto 9.5 cm (280 ml)',
        finish: 'Gres Texturado + Interior Cristalino',
        story: 'Exterior de gres poroso al tacto en la base que se transforma en un esmalte profundo de grafito y mar en la boca. Ideal tanto para agua fresca como para un café de especialidad.',
        care: ['Apto Lavavajillas', 'Apto Microondas'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'bowl-rosa-esmaltado',
        name: 'Bowl Alba Rosa Cuarzo',
        shortName: 'Bowl Rosa Cuarzo',
        category: 'bowls',
        weight: 0.38,
        img: 'images/bowl-rosa.jpg',
        images: [
            'images/bowl-rosa.jpg'
        ],
        dimensions: 'Ø 15.5 cm · Alto 6.8 cm',
        finish: 'Interior Rosado Jaspeado · Exterior Crema',
        story: 'Un contraste delicado entre el exterior crema sereno y un interior de esmalte rosa mineral con vetas suaves que capturan la luz de la mañana.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'ensaladera-blanca',
        name: 'Ensaladera Convento con Posacubiertos',
        shortName: 'Ensaladera Blanca',
        category: 'ensaladeras',
        weight: 0.94,
        img: 'images/ensaladera-blanca.jpg',
        images: [
            'images/ensaladera-blanca.jpg'
        ],
        dimensions: 'Ø 25 cm · Alto 11.5 cm',
        finish: 'Blanco Nevado Jaspeado',
        story: 'Con sus dos calados semicirculares modelados en el borde para descansar los cubiertos de servir, esta pieza generosa está pensada para compartir en el centro de la mesa.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'fuente-oval-blanca',
        name: 'Fuente Oval Clásica Marfil',
        shortName: 'Fuente Oval Marfil',
        category: 'fuentes',
        weight: 0.86,
        img: 'images/fuente-oval-blanca.jpg',
        images: [
            'images/fuente-oval-blanca.jpg'
        ],
        dimensions: '34 cm × 23 cm · Alto 3.2 cm',
        finish: 'Gres Marfil de Alta Resistencia',
        story: 'Líneas puras y ala generosa para presentar desde carnes y pescados al horno hasta frutas de estación. Resiste el calor directo del horno a la mesa.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 250°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'fuente-peugeot-negra',
        name: 'Fuente Horno Noir Mate con Asas',
        shortName: 'Fuente Horno Negra',
        category: 'fuentes',
        weight: 0.78,
        img: 'images/fuente-peugeot-negra.jpg',
        images: [
            'images/fuente-peugeot-negra.jpg'
        ],
        dimensions: '26 cm × 16 cm · Alto 5.5 cm',
        finish: 'Gres Negro Carbón Satinado',
        story: 'Cuerpo robusto de gres horneado con asas laterales esculpidas y sello grabado. Conserva la temperatura durante todo el encuentro.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 250°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'plato-postre-irregular',
        name: 'Plato Postre Orgánico Nieve',
        shortName: 'Plato Postre Nieve',
        category: 'platos',
        weight: 0.42,
        img: 'Plato postre borde irregular Esmaltado.webp',
        images: [
            'Plato postre borde irregular Esmaltado.webp'
        ],
        dimensions: 'Ø 20.5 cm · Silueta Orgánica',
        finish: 'Blanco Hueso con Borde Tostado',
        story: 'Su silueta asimétrica celebra la huella de la mano del alfarero. Ninguno describe un círculo perfecto, haciendo que cada puesta de mesa sea irrepetible.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'plato-azul-cobalto',
        name: 'Plato Playo Azul Atlántico',
        shortName: 'Plato Azul Atlántico',
        category: 'platos',
        weight: 0.68,
        img: 'images/bask-040-plato-azul-esmaltado.webp',
        images: [
            'images/bask-040-plato-azul-esmaltado.webp'
        ],
        dimensions: 'Ø 26.5 cm · Alto 2.2 cm',
        finish: 'Azul Cobalto Profundo Satinado',
        story: 'Un tributo al océano de la costa portuguesa y uruguaya. Sus anillos sutiles en el centro realzan el contraste de cualquier preparación.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'plato-negro-onix',
        name: 'Plato Playo Ónix con Borde',
        shortName: 'Plato Negro Ónix',
        category: 'platos',
        weight: 0.74,
        img: 'images/bask-073-plato-borde-negro.webp',
        images: [
            'images/bask-073-plato-borde-negro.webp'
        ],
        dimensions: 'Ø 27 cm · Labio vertical 2.5 cm',
        finish: 'Negro Mate Mineral',
        story: 'Carácter contemporáneo y dramático. Su superficie oscura enmarca los colores de la comida como un lienzo de galería.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'plato-postre-azul',
        name: 'Plato Postre Guarda Portuguesa',
        shortName: 'Plato Guarda Azul',
        category: 'platos',
        weight: 0.35,
        img: 'Plato postre Esmaltado.webp',
        images: [
            'Plato postre Esmaltado.webp'
        ],
        dimensions: 'Ø 19.5 cm · Alto 2.0 cm',
        finish: 'Esmalte Brillante con Guarda Geométrica',
        story: 'Recrea las guardas arquitectónicas de Oporto y Lisboa en tonos azul índigo y gris piedra sobre porcelana luminosa.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    }
];

// Helpers para consultar productos
function getBaskulaProductById(id) {
    if (!id) return null;
    // Si en la página de catalogo se define CATALOG_ITEMS, busca ahí primero
    if (typeof window !== 'undefined' && Array.isArray(window.CATALOG_ITEMS)) {
        const found = window.CATALOG_ITEMS.find(p => p.id === id);
        if (found) return found;
    }
    return BASKULA_PRODUCTS.find(p => p.id === id) || null;
}

function getBaskulaRate(category) {
    return BASKULA_RATES[category] || 16.50;
}

// Exponer en el objeto global si estamos en navegador
if (typeof window !== 'undefined') {
    window.BASKULA_PRODUCTS = BASKULA_PRODUCTS;
    window.BASKULA_RATES = BASKULA_RATES;
    window.BASKULA_CATEGORY_LABELS = BASKULA_CATEGORY_LABELS;
    window.getBaskulaProductById = getBaskulaProductById;
    window.getBaskulaRate = getBaskulaRate;
}
