/**
 * BasKula — Pipeline Automatizado de Mejora y Estandarización de Imágenes (Fase 2: Home Completo)
 * Procesa todos los activos que se cargan y renderizan en index.html con respaldo previo no destructivo.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.resolve(__dirname, '..');
const BACKUP_ROOT = path.join(ROOT_DIR, '_assets_raw', 'backup_pre_sharp');

/**
 * Lista exhaustiva de todas las imágenes activas en index.html (Home)
 */
const HOME_IMAGE_TARGETS = [
    // 1. Hero Principal (1920px máx.)
    { src: 'images/hero-single.webp', out: 'images/hero-single.webp', maxWidth: 1920, role: 'hero' },

    // 2. Carrusel "Nuestra Casa" (800px máx., 4:3)
    { src: 'images/casa-origen-portugues.webp', out: 'images/casa-origen-portugues.webp', maxWidth: 800, role: 'casa' },
    { src: 'images/casa-colecciones-exclusivas.webp', out: 'images/casa-colecciones-exclusivas.webp', maxWidth: 800, role: 'casa' },
    { src: 'images/casa-diseno-europeo.webp', out: 'images/casa-diseno-europeo.webp', maxWidth: 800, role: 'casa' },
    { src: 'images/casa-venta-kilo.webp', out: 'images/casa-venta-kilo.webp', maxWidth: 800, role: 'casa' },

    // 3. Banners Navideños Split Editorial (1920px máx.)
    { src: 'images/navidad-banner-1.jpg', out: 'images/navidad-banner-1.webp', maxWidth: 1920, role: 'banner' },
    { src: 'images/navidad-banner-2.jpg', out: 'images/navidad-banner-2.webp', maxWidth: 1920, role: 'banner' },

    // 4. Carrusel y Visor "Selección Festiva" en Home (800px máx.)
    { src: 'images/festive/plato-arbol-verde-nuevo.jpg', out: 'images/festive/plato-arbol-verde-nuevo.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/plato-arbol-rojo-2.jpg', out: 'images/festive/plato-arbol-rojo-2.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/set-vajilla-blanco-perlado-1.jpg', out: 'images/festive/set-vajilla-blanco-perlado-1.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/set-vajilla-blanco-perlado-2.jpg', out: 'images/festive/set-vajilla-blanco-perlado-2.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/fuente-rectangular-perlas-1.jpg', out: 'images/festive/fuente-rectangular-perlas-1.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/fuente-rectangular-perlas-2.jpg', out: 'images/festive/fuente-rectangular-perlas-2.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/set-vajilla-rojo-puntille-1.jpg', out: 'images/festive/set-vajilla-rojo-puntille-1.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/set-vajilla-rojo-puntille-2.jpg', out: 'images/festive/set-vajilla-rojo-puntille-2.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/set-vajilla-verde-puntille-1.jpg', out: 'images/festive/set-vajilla-verde-puntille-1.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/set-vajilla-verde-puntille-2.jpg', out: 'images/festive/set-vajilla-verde-puntille-2.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/plato-arbol-rojo-1.webp', out: 'images/festive/plato-arbol-rojo-1.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/plato-arbolito-verde.webp', out: 'images/festive/plato-arbolito-verde.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/taza-plato-rojo-puntille.webp', out: 'images/festive/taza-plato-rojo-puntille.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/taza-plato-verde-puntille.webp', out: 'images/festive/taza-plato-verde-puntille.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/portavela-rojo-puntille.webp', out: 'images/festive/portavela-rojo-puntille.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/festive/portavela-verde-puntille.webp', out: 'images/festive/portavela-verde-puntille.webp', maxWidth: 800, role: 'catalog' },

    // 5. Sección "Tendencias / Nueva Temporada" (800px máx.)
    { src: 'images/trend1.webp', out: 'images/trend1.webp', maxWidth: 800, role: 'trend' },
    { src: 'images/trend2.webp', out: 'images/trend2.webp', maxWidth: 800, role: 'trend' },
    { src: 'images/trend3.webp', out: 'images/trend3.webp', maxWidth: 800, role: 'trend' },
    { src: 'images/trend4.webp', out: 'images/trend4.webp', maxWidth: 800, role: 'trend' },

    // 6. Cerámica de Autor — Carruseles, Catálogo y Modal de Ficha en Home (800px máx.)
    { src: 'images/ceramics/plato-rayas-navy.webp', out: 'images/ceramics/plato-rayas-navy.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/bowl-rayas-navy.webp', out: 'images/ceramics/bowl-rayas-navy.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/taza-rayas-navy.webp', out: 'images/ceramics/taza-rayas-navy.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/ensaladera-rayas-navy.webp', out: 'images/ceramics/ensaladera-rayas-navy.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/plato-corona-floral.webp', out: 'images/ceramics/plato-corona-floral.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/plato-sol-botanico.webp', out: 'images/ceramics/plato-sol-botanico.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/plato-sol-edicion-35usd.webp', out: 'images/ceramics/plato-sol-edicion-35usd.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/jarra-family-red.webp', out: 'images/ceramics/jarra-family-red.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/jarrita-family-red.webp', out: 'images/ceramics/jarrita-family-red.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/tabla-servir-28usd.webp', out: 'images/ceramics/tabla-servir-28usd.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/ensaladera-lechuga-42usd.webp', out: 'images/ceramics/ensaladera-lechuga-42usd.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/ensaladera-lechuga-stack.webp', out: 'images/ceramics/ensaladera-lechuga-stack.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/ceramics/ensaladera-lechuga-detalle.webp', out: 'images/ceramics/ensaladera-lechuga-detalle.webp', maxWidth: 800, role: 'catalog' },

    // 7. Piezas por Kilo BasKula en Home (800px máx.)
    { src: 'images/bask-040-plato-azul-esmaltado.webp', out: 'images/bask-040-plato-azul-esmaltado.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/bask-067-plato-postre-borde-azul.webp', out: 'images/bask-067-plato-postre-borde-azul.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/bask-068-plato-blanco-mate.webp', out: 'images/bask-068-plato-blanco-mate.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/bask-070-plato-grande-blanco.webp', out: 'images/bask-070-plato-grande-blanco.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/bask-071-plato-mediano-blanco.webp', out: 'images/bask-071-plato-mediano-blanco.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/bask-072-plato-verde-petroleo.webp', out: 'images/bask-072-plato-verde-petroleo.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/bask-073-plato-borde-negro.webp', out: 'images/bask-073-plato-borde-negro.webp', maxWidth: 800, role: 'catalog' },
    { src: 'images/bask-075-plato-chico-negro.webp', out: 'images/bask-075-plato-chico-negro.webp', maxWidth: 800, role: 'catalog' },

    // 8. Recortes Transparentes — Alacena Interactiva, Balanza y Wishlist (800px máx., alpha preservado)
    { src: 'images/cutouts/bowl-rosa-esmaltado.webp', out: 'images/cutouts/bowl-rosa-esmaltado.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/ensaladera-blanca.webp', out: 'images/cutouts/ensaladera-blanca.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/fuente-oval-blanca.webp', out: 'images/cutouts/fuente-oval-blanca.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/fuente-peugeot-negra.webp', out: 'images/cutouts/fuente-peugeot-negra.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/plato-azul-cobalto.webp', out: 'images/cutouts/plato-azul-cobalto.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/plato-hondo-hojas.webp', out: 'images/cutouts/plato-hondo-hojas.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/plato-negro-onix.webp', out: 'images/cutouts/plato-negro-onix.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/plato-postre-azul.webp', out: 'images/cutouts/plato-postre-azul.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/plato-postre-irregular.webp', out: 'images/cutouts/plato-postre-irregular.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/plato-verde-musgo.webp', out: 'images/cutouts/plato-verde-musgo.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/taza-azul-degrade.webp', out: 'images/cutouts/taza-azul-degrade.webp', maxWidth: 800, role: 'cutout' },
    { src: 'images/cutouts/vaso-gris.webp', out: 'images/cutouts/vaso-gris.webp', maxWidth: 800, role: 'cutout' }
];

/**
 * Calcula un ajuste suave de luminancia según las estadísticas reales de la foto
 * para equilibrar tomas ligeramente oscuras o sobreexpuestas sin quemar blancos cerámicos.
 */
function computeSoftLuminanceAdjustment(stats) {
    const rMean = stats.channels[0] ? stats.channels[0].mean : 128;
    const gMean = stats.channels[1] ? stats.channels[1].mean : 128;
    const bMean = stats.channels[2] ? stats.channels[2].mean : 128;
    const perceivedLum = 0.299 * rMean + 0.587 * gMean + 0.114 * bMean;

    let brightness = 1.01;
    let linearSlope = 1.015;
    let linearOffset = -1.5;

    if (perceivedLum < 105) {
        // Foto ligeramente subexpuesta: levantamos medios tonos con suavidad
        brightness = 1.035;
        linearSlope = 1.025;
        linearOffset = 1.0;
    } else if (perceivedLum > 205) {
        // Foto muy clara / fondo blanco intenso: protegemos las altas luces de la cerámica
        brightness = 0.995;
        linearSlope = 1.01;
        linearOffset = -1.0;
    }

    return { brightness, linearSlope, linearOffset, perceivedLum: perceivedLum.toFixed(1) };
}

async function runOptimization() {
    console.log('====================================================================');
    console.log(' BasKula Image Optimization Pipeline — Extensión Total: index.html');
    console.log('====================================================================\n');

    let totalBeforeBytes = 0;
    let totalAfterBytes = 0;

    for (const item of HOME_IMAGE_TARGETS) {
        const srcAbs = path.join(ROOT_DIR, item.src);
        const outAbs = path.join(ROOT_DIR, item.out);
        const backupAbs = path.join(BACKUP_ROOT, item.src);

        if (!fs.existsSync(srcAbs) && !fs.existsSync(backupAbs)) {
            console.warn(`[OMITIDO] No se encontró el archivo: ${item.src}`);
            continue;
        }

        // 1. Respaldo seguro e idempotente en _assets_raw/backup_pre_sharp/
        fs.mkdirSync(path.dirname(backupAbs), { recursive: true });
        if (!fs.existsSync(backupAbs)) {
            fs.copyFileSync(srcAbs, backupAbs);
        }

        const beforeStat = fs.statSync(backupAbs);
        totalBeforeBytes += beforeStat.size;

        // 2. Lectura desde el respaldo original para evitar re-compresión acumulativa
        const inputBuffer = fs.readFileSync(backupAbs);
        const image = sharp(inputBuffer);
        const metadata = await image.metadata();
        const stats = await image.stats();

        const lum = computeSoftLuminanceAdjustment(stats);

        // 3. Pipeline de procesamiento digital:
        //    - Redimensionado máximo inteligente según rol
        //    - Normalización suave de luminancia y fidelidad cromática (sepia 0)
        //    - Enfoque (sharpen) calibrado para esmaltes y relieves cerámicos sin ruido
        //    - Compresión WebP de alta fidelidad (calidad 86%, smartSubsample)
        const resizeOptions = item.role === 'casa'
            ? { width: 800, height: 600, fit: 'cover', position: 'centre' }
            : { width: item.maxWidth, height: item.maxWidth, fit: 'inside', withoutEnlargement: true };

        let pipeline = sharp(inputBuffer)
            .rotate() // Respeta orientación EXIF
            .resize(resizeOptions);

        if (item.role === 'cutout' || metadata.hasAlpha) {
            // Recortes transparentes: preservamos canal alfa puro, micro-contraste limpio y sin distorsión
            pipeline = pipeline
                .modulate({
                    brightness: 1.01,
                    saturation: 1.02
                })
                .sharpen({
                    sigma: 0.80,
                    m1: 0.7,
                    m2: 1.3,
                    x1: 2,
                    y2: 10,
                    y3: 15
                })
                .webp({
                    quality: 86,
                    alphaQuality: 95,
                    smartSubsample: true,
                    effort: 6
                });
        } else {
            // Imágenes con fondo / rectangulares:
            pipeline = pipeline
                .modulate({
                    brightness: lum.brightness,
                    saturation: item.role === 'catalog' ? 1.02 : 1.035
                })
                .linear(lum.linearSlope, lum.linearOffset)
                .sharpen({
                    sigma: 0.85,
                    m1: 0.7,
                    m2: 1.4,
                    x1: 2,
                    y2: 10,
                    y3: 15
                })
                .webp({
                    quality: 86,
                    smartSubsample: true,
                    effort: 6
                });
        }

        const outputBuffer = await pipeline.toBuffer();
        fs.mkdirSync(path.dirname(outAbs), { recursive: true });
        fs.writeFileSync(outAbs, outputBuffer);

        const outMeta = await sharp(outputBuffer).metadata();
        totalAfterBytes += outputBuffer.length;

        const beforeKB = (beforeStat.size / 1024).toFixed(1);
        const afterKB = (outputBuffer.length / 1024).toFixed(1);
        const diffPct = (((outputBuffer.length - beforeStat.size) / beforeStat.size) * 100).toFixed(1);

        console.log(
            `✔ ${item.out.padEnd(50)} | ${String(metadata.width + 'x' + metadata.height).padEnd(10)} -> ${String(outMeta.width + 'x' + outMeta.height).padEnd(10)} | ${beforeKB.padStart(6)} KB -> ${afterKB.padStart(6)} KB (${diffPct}%)`
        );
    }

    const totalBeforeKB = (totalBeforeBytes / 1024).toFixed(1);
    const totalAfterKB = (totalAfterBytes / 1024).toFixed(1);
    const savedPct = (((totalBeforeBytes - totalAfterBytes) / totalBeforeBytes) * 100).toFixed(1);

    console.log('\n--------------------------------------------------------------------');
    console.log(`Respaldo original seguro en: _assets_raw/backup_pre_sharp/`);
    console.log(`Total procesadas: ${HOME_IMAGE_TARGETS.length} imágenes`);
    console.log(`Peso total antes: ${totalBeforeKB} KB | Peso total después: ${totalAfterKB} KB (Ahorro global: ${savedPct}%)`);
    console.log('====================================================================');
}

runOptimization().catch((err) => {
    console.error('Error ejecutando optimize-images.js:', err);
    process.exit(1);
});
