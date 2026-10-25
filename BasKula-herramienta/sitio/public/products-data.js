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
    fuentes: 'Fuentes',
    especial: 'Piezas de Autor'
};

const BASKULA_PRODUCTS = [
    {
        id: 'plato-rayas-navy',
        name: 'Plato Playo Rayas Navy',
        shortName: 'Plato Rayas Navy',
        category: 'platos',
        weight: 0.975,
        img: 'images/ceramics/plato-rayas-navy.webp',
        images: [
            'images/ceramics/plato-rayas-navy.webp'
        ],
        dimensions: 'Ø 28 cm · Alto 2.2 cm',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Plato playo de inspiración mediterránea y estética marinera. Su composición de franjas azul índigo de trazo orgánico sobre fondo blanco puro viste cualquier mesa con frescura, elegancia y calidez artesanal.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C', 'Apto Congelador'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'bowl-rayas-navy',
        name: 'Bowl Cerealero Rayas Navy',
        shortName: 'Bowl Rayas Navy',
        category: 'bowls',
        weight: 0.480,
        img: 'images/ceramics/bowl-rayas-navy.webp',
        images: [
            'images/ceramics/bowl-rayas-navy.webp'
        ],
        dimensions: 'Ø 14.5 cm · Alto 8 cm (550 ml)',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Bowl cónico con fileteado vertical en azul profundo sobre base cerámica blanca. Cómodo y versátil, ideal para desayunos, cereales, sopas, yogurt o dips en el centro de la mesa.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'taza-rayas-navy',
        name: 'Taza Mug Rayas Navy',
        shortName: 'Taza Rayas Navy',
        category: 'tazas',
        weight: 0.360,
        img: 'images/ceramics/taza-rayas-navy.webp',
        images: [
            'images/ceramics/taza-rayas-navy.webp'
        ],
        dimensions: 'Ø 9 cm · Alto 11 cm (350 ml)',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Mug cerámico con asa ergonómica modelada y franjas verticales azul marino. De tacto cálido y cómodo agarre, perfecto para café filtrado, té en hebras o infusiones matutinas.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'ensaladera-rayas-navy',
        name: 'Ensaladera Honda Rayas Navy',
        shortName: 'Ensaladera Rayas Navy',
        category: 'ensaladeras',
        weight: 0.975,
        img: 'images/ceramics/ensaladera-rayas-navy.webp',
        images: [
            'images/ceramics/ensaladera-rayas-navy.webp'
        ],
        dimensions: 'Ø 25 cm · Alto 9.5 cm',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'Pieza central de generosa capacidad con perfil abierto y líneas que convergen hacia la base. Diseñada para lucir ensaladas frescas, pastas para compartir o como frutero de autor en la cocina.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'plato-corona-floral',
        name: 'Plato Playo Corona Floral Terracota',
        shortName: 'Plato Corona Floral',
        category: 'platos',
        weight: 0.875,
        img: 'images/ceramics/plato-corona-floral.webp',
        images: [
            'images/ceramics/plato-corona-floral.webp'
        ],
        dimensions: 'Ø 27 cm · Alto 2.2 cm',
        finish: 'Esmaltado Satinado Suave',
        story: 'Una pieza de inspiración campestre y calidez mediterránea. Su diseño presenta una corona circular de hojas y flores pinceladas en tonos terracota y rosa empolvado, enmarcando el centro del plato para destacar los colores vivos de cualquier creación culinaria.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C', 'Apto Congelador'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'plato-sol-botanico',
        name: 'Plato Entrada Sol Botánico Terracota',
        shortName: 'Plato Sol Botánico',
        category: 'platos',
        weight: 0.522,
        img: 'images/ceramics/plato-sol-botanico.webp',
        images: [
            'images/ceramics/plato-sol-botanico.webp'
        ],
        dimensions: 'Ø 21 cm · Alto 2.0 cm',
        finish: 'Esmaltado Brillante Vítreo',
        story: 'El complemento ideal para entradas, desayunos o postres. Destaca por su flor central y una delicada guarda radial en tonos arcilla tostada y rubor que irradia frescura, complementando a la perfección la vajilla principal de la colección.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C', 'Apto Congelador'],
        origin: 'Fabricado artesanalmente en Portugal · Gres Fino de alta resistencia'
    },
    {
        id: 'plato-sol-edicion-fp',
        name: 'Plato de Sol Terracota Edición Especial',
        shortName: 'Plato de Sol',
        category: 'especial',
        pricingType: 'fixed',
        price: 35,
        weight: 0.98,
        img: 'images/ceramics/plato-sol-edicion-35usd.webp',
        images: [
            'images/ceramics/plato-sol-edicion-35usd.webp'
        ],
        dimensions: 'Ø 29 cm · Pieza de Colección',
        finish: 'Esmaltado Satinado Terracota y Marfil',
        story: 'Edición exclusiva con motivo solar pintado a mano. Una pieza protagonista de centro de mesa o decoración mural de alta artesanía.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Pieza de Autor'
    },
    {
        id: 'jarra-family-red-fp',
        name: 'Jarra Family Red',
        shortName: 'Jarra Family Red',
        category: 'especial',
        pricingType: 'fixed',
        price: 35,
        weight: 1.055,
        img: 'images/ceramics/jarra-family-red.webp',
        images: [
            'images/ceramics/jarra-family-red.webp'
        ],
        dimensions: 'Alto 27 cm · Capacidad 1.5 L',
        finish: 'Gres Esmaltado Bicolor',
        story: 'Jarra de gran porte con asa ergonómica robusta y boquilla vertedora precisa. Ideal para servir agua fresca, limonadas o lucir como florero rústico.',
        care: ['Apto Lavavajillas', 'Apto Microondas'],
        origin: 'Fabricado artesanalmente en Portugal · Pieza de Autor'
    },
    {
        id: 'jarrita-family-red-fp',
        name: 'Jarrita Individual Family Red',
        shortName: 'Jarrita Individual',
        category: 'especial',
        pricingType: 'fixed',
        price: 35,
        weight: 0.755,
        img: 'images/ceramics/jarrita-family-red.webp',
        images: [
            'images/ceramics/jarrita-family-red.webp'
        ],
        dimensions: 'Alto 18 cm · Capacidad 600 ml',
        finish: 'Gres Esmaltado Bicolor',
        story: 'Compañera individual de la colección Family Red. Perfecta para servir leche, almíbares, salsas o aceite en la mesa con encanto.',
        care: ['Apto Lavavajillas', 'Apto Microondas'],
        origin: 'Fabricado artesanalmente en Portugal · Pieza de Autor'
    },
    {
        id: 'tabla-servir-fp',
        name: 'Tabla Amplia de Servir',
        shortName: 'Tabla Amplia',
        category: 'especial',
        pricingType: 'fixed',
        price: 38,
        weight: 1.350,
        img: 'images/ceramics/tabla-servir-28usd.webp',
        images: [
            'images/ceramics/tabla-servir-28usd.webp'
        ],
        dimensions: '38 cm × 22 cm · Formato Tabla',
        finish: 'Cerámica Rústica de Alta Densidad',
        story: 'Tabla cerámica plana con asa perforada para colgar. Diseñada para quesos, fiambres, panes artesanales y aperitivos de autor.',
        care: ['Apto Lavavajillas', 'Apto Microondas', 'Apto Horno hasta 220°C'],
        origin: 'Fabricado artesanalmente en Portugal · Pieza de Autor'
    },
    {
        id: 'plato-verde-musgo',
        name: 'Plato Llano Verde Musgo',
        shortName: 'Plato Verde Musgo',
        category: 'platos',
        weight: 0.72,
        img: 'images/cutouts/plato-verde-musgo.webp',
        images: [
            'images/cutouts/plato-verde-musgo.webp'
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
        img: 'images/cutouts/plato-hondo-hojas.webp',
        images: [
            'images/cutouts/plato-hondo-hojas.webp'
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
        img: 'images/cutouts/taza-azul-degrade.webp',
        images: [
            'images/cutouts/taza-azul-degrade.webp'
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
        img: 'images/cutouts/vaso-gris.webp',
        images: [
            'images/cutouts/vaso-gris.webp'
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
        img: 'images/cutouts/bowl-rosa-esmaltado.webp',
        images: [
            'images/cutouts/bowl-rosa-esmaltado.webp'
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
        img: 'images/cutouts/ensaladera-blanca.webp',
        images: [
            'images/cutouts/ensaladera-blanca.webp'
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
        img: 'images/cutouts/fuente-oval-blanca.webp',
        images: [
            'images/cutouts/fuente-oval-blanca.webp'
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
        img: 'images/cutouts/fuente-peugeot-negra.webp',
        images: [
            'images/cutouts/fuente-peugeot-negra.webp'
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
        img: 'images/cutouts/plato-postre-irregular.webp',
        images: [
            'images/cutouts/plato-postre-irregular.webp'
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
        img: 'images/cutouts/plato-postre-azul.webp',
        images: [
            'images/cutouts/plato-postre-azul.webp'
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
