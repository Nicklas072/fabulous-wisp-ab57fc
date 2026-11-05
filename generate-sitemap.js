/**
 * generate-sitemap.js — BasKula
 * Genera y actualiza automáticamente el sitemap.xml
 * leyendo directamente desde products-data.js.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.baskula.com';
const TODAY = new Date().toISOString().split('T')[0];

// Cargar catálogo de productos desde products-data.js
const productsDataPath = path.join(__dirname, 'products-data.js');
const productsFileContent = fs.readFileSync(productsDataPath, 'utf8');

const products = (new Function(productsFileContent + '\nreturn typeof BASKULA_PRODUCTS !== "undefined" ? BASKULA_PRODUCTS : [];'))();

// URLs estáticas principales
const staticRoutes = [
    {
        loc: `${BASE_URL}/`,
        changefreq: 'weekly',
        priority: '1.0'
    },
    {
        loc: `${BASE_URL}/catalogo.html`,
        changefreq: 'weekly',
        priority: '0.9'
    },
    {
        loc: `${BASE_URL}/b2b.html`,
        changefreq: 'weekly',
        priority: '0.9'
    }
];

// URLs dinámicas de productos
const productRoutes = products.map((item) => {
    const isFixed = item.pricingType === 'fixed';
    return {
        loc: `${BASE_URL}/producto.html?id=${encodeURIComponent(item.id)}`,
        changefreq: 'monthly',
        priority: isFixed ? '0.85' : '0.8'
    };
});

// Documentos PDF
const documentRoutes = [
    {
        loc: `${BASE_URL}/Catalogo%20Baskula.pdf`,
        changefreq: 'monthly',
        priority: '0.6'
    }
];

const allRoutes = [...staticRoutes, ...productRoutes, ...documentRoutes];

const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <!-- Páginas Principales -->'
];

staticRoutes.forEach(route => {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${route.loc}</loc>`);
    xmlLines.push(`    <lastmod>${TODAY}</lastmod>`);
    xmlLines.push(`    <changefreq>${route.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${route.priority}</priority>`);
    xmlLines.push('  </url>');
});

xmlLines.push('');
xmlLines.push('  <!-- Fichas Individuales de Producto (Catálogo Centralizado) -->');

productRoutes.forEach(route => {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${route.loc}</loc>`);
    xmlLines.push(`    <lastmod>${TODAY}</lastmod>`);
    xmlLines.push(`    <changefreq>${route.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${route.priority}</priority>`);
    xmlLines.push('  </url>');
});

xmlLines.push('');
xmlLines.push('  <!-- Catálogo y Documentos Indexables -->');

documentRoutes.forEach(route => {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${route.loc}</loc>`);
    xmlLines.push(`    <lastmod>${TODAY}</lastmod>`);
    xmlLines.push(`    <changefreq>${route.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${route.priority}</priority>`);
    xmlLines.push('  </url>');
});

xmlLines.push('</urlset>');
xmlLines.push('');

const sitemapPath = path.join(__dirname, 'sitemap.xml');
fs.writeFileSync(sitemapPath, xmlLines.join('\n'), 'utf8');

console.log(`[BasKula SEO] sitemap.xml actualizado con éxito: ${allRoutes.length} URLs indexadas (${products.length} productos).`);
