import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const TARGET_IDS = [
  // Calm Daily (7)
  '8803', '8802', '8797', '8796', '8793', '8795', '8794',
  // Happy Daily (7)
  '8789', '8792', '8791', '8787', '8788', '8790', '8786',
  // Intense Daily (7)
  '8810', '8806', '8809', '8807', '8804', '8808', '8805',
  // Shiny Daily (5)
  '8871', '8869', '8867', '8870', '8868',
  // Snow Daily (5)
  '8874', '8873', '8872', '8875', '8876'
];

// Mapeos de traducción y clasificación
function getCollectionMeta(name) {
  const lower = name.toLowerCase();
  if (lower.includes('calm')) {
    return { variant: 'Calm', colorBase: 'Verde', colorGroup: 'verde', tone: 'verde' };
  }
  if (lower.includes('happy')) {
    return { variant: 'Happy', colorBase: 'Azul Oscuro', colorGroup: 'azul', tone: 'azul' };
  }
  if (lower.includes('intense')) {
    return { variant: 'Intense', colorBase: 'Gris Oscuro', colorGroup: 'gris', tone: 'gris' };
  }
  if (lower.includes('shiny')) {
    return { variant: 'Shiny', colorBase: 'Off White', colorGroup: 'blanco', tone: 'blanco' };
  }
  if (lower.includes('snow')) {
    return { variant: 'Snow', colorBase: 'Blanco', colorGroup: 'blanco', tone: 'blanco' };
  }
  return { variant: 'Daily', colorBase: 'Natural', colorGroup: 'blanco', tone: 'blanco' };
}

function getPieceMeta(name) {
  const lower = name.toLowerCase();
  if (lower.includes('aparelho') || lower.includes('vajilla')) {
    return {
      pieceGroup: 'vajillas',
      pieceGroupEs: 'Vajillas',
      productType: 'vajilla',
      productTypeLabel: 'Vajilla',
      pieces: 16
    };
  }
  if (lower.includes('raso') || lower.includes('llano')) {
    return {
      pieceGroup: 'platos',
      pieceGroupEs: 'Platos',
      productType: 'plato-llano',
      productTypeLabel: 'Plato llano',
      pieces: 12
    };
  }
  if (lower.includes('fundo') || lower.includes('hondo')) {
    return {
      pieceGroup: 'platos',
      pieceGroupEs: 'Platos',
      productType: 'plato-hondo',
      productTypeLabel: 'Plato hondo',
      pieces: 12
    };
  }
  if (lower.includes('sobremesa') || lower.includes('postre')) {
    return {
      pieceGroup: 'platos',
      pieceGroupEs: 'Platos',
      productType: 'plato-postre',
      productTypeLabel: 'Plato de postre',
      pieces: 12
    };
  }
  if (lower.includes('chá') || lower.includes('té')) {
    return {
      pieceGroup: 'tecafe',
      pieceGroupEs: 'Té y Café',
      productType: 'taza-te',
      productTypeLabel: 'Taza de té',
      pieces: 12
    };
  }
  if (lower.includes('café') || lower.includes('cafe')) {
    return {
      pieceGroup: 'tecafe',
      pieceGroupEs: 'Té y Café',
      productType: 'taza-cafe',
      productTypeLabel: 'Taza de café',
      pieces: 12
    };
  }
  return {
    pieceGroup: 'platos',
    pieceGroupEs: 'Platos',
    productType: 'plato',
    productTypeLabel: 'Plato',
    pieces: 12
  };
}

function translateName(namePt) {
  let name = namePt;
  name = name.replace(/^Conjunto com 12 Pratos? Rasos?/i, 'Juego de 12 Platos Llanos');
  name = name.replace(/^Conjunto com 12 Pratos? Fundos?/i, 'Juego de 12 Platos Hondos');
  name = name.replace(/^Conjunto com 12 Pratos? de Sobremesa/i, 'Juego de 12 Platos de Postre');
  name = name.replace(/^Conjunto com 12 Xícaras de Chá com Pires/i, 'Juego de 12 Tazas de Té con Platitos');
  name = name.replace(/^Conjunto com 12 Xícaras de Café com Pires/i, 'Juego de 12 Tazas de Café con Platitos');
  name = name.replace(/^Aparelho de Jantar 16 Peças/i, 'Vajilla de 16 Piezas');
  name = name.replace(/\(para 4 pessoas\)/i, '(para 4 personas)');
  return name;
}

function parseTable(html) {
  if (!html) return {};
  const res = {};
  const regex = /<tr>\s*<td>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/duracion>|<tr>\s*<td>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<\/tr>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const key = (match[1] || match[3] || '').trim();
    const val = (match[2] || match[4] || '').trim();
    if (key) res[key] = val;
  }
  return res;
}

function parseDimensions(dimStr) {
  let diameter = null;
  let height = null;
  if (!dimStr) return { diameter, height };
  const dMatch = dimStr.match(/Ø\s*([\d,.]+)\s*cm/i);
  if (dMatch) diameter = parseFloat(dMatch[1].replace(',', '.'));
  const hMatch = dimStr.match(/A\s*=\s*([\d,.]+)\s*cm/i);
  if (hMatch) height = parseFloat(hMatch[1].replace(',', '.'));
  return { diameter, height };
}

function formatImages(vtexImages) {
  if (!vtexImages || !Array.isArray(vtexImages)) return '[]';
  const imgs = vtexImages.map(img => {
    const cleanUrl = (img.imageUrl || '').split('?')[0];
    const match = cleanUrl.match(/\/ids\/(\d+)\/(.+)$/);
    if (match) {
      const id = match[1];
      const filename = match[2];
      return {
        url: `https://portobrasil.vteximg.com.br/arquivos/ids/${id}-500-500/${filename}`,
        url1000: `https://portobrasil.vteximg.com.br/arquivos/ids/${id}-1000-1000/${filename}`
      };
    }
    return { url: cleanUrl, url1000: cleanUrl };
  });
  return JSON.stringify(imgs);
}

const DEFAULT_CARE_ES = `<table><tr><td>Garantía</td><td style="padding-left: 20px;">Garantía de calidad BasKula: 90 días por defecto de fabricación y 9 meses por craquelado.</td></tr><tr><td>Uso</td><td style="padding-left: 20px;">Horno, freezer y microondas: El gres / stoneware posee una alta resistencia mecánica y térmica. Puede usarse con total seguridad en horno, microondas y congelador respetando cambios térmicos graduales. Nunca colocar directamente sobre fuego vivo.</td></tr><tr><td>Limpieza</td><td style="padding-left: 20px;">Apto para lavavajillas. Se recomienda retirar el exceso de alimentos antes de introducir las piezas.</td></tr><tr><td>Cuidados</td><td style="padding-left: 20px;">Los esmaltes cerámicos de alta temperatura tienen gran dureza. Para mantener el acabado impecable frente a roces de cubiertos, se recomienda limpiar periódicamente con esponja suave o limpiador cremoso para vajilla.</td></tr></table>`;

const DEFAULT_INFO_ES = `<table><tr><td colspan="2">Diseño distintivo e innovador con alta resistencia mecánica. Piezas artesanales en gres cerámico de alta temperatura, aptas para uso intensivo diario y gastronómico. Conforme a las normas internacionales de seguridad alimentaria libre de plomo y cadmio (Food Safe).</td></tr></table>`;

function generateDescriptionEs(nameEs, colMeta, pieceMeta) {
  return `El <strong>${nameEs}</strong> forma parte de la colección <strong>Day by Day</strong> (línea Daily ${colMeta.variant}), desarrollada para unir practicidad, diseño orgánico e impacto visual en la mesa diaria.<br/> Producido en <strong>stoneware de alta resistencia</strong>, garantiza durabilidad y excelente desempeño en el uso cotidiano.<br/> Su acabado realza la textura de la pieza y aporta sofisticación y estilo al servir.<br/> Puede ser utilizado en <strong>horno (hasta 180 °C), microondas, congelador y lavavajillas</strong>, garantizando máxima conveniencia en la rutina.<br/><strong>Composición:</strong><ul><li>Piezas según descripción del producto</li></ul>`;
}

async function main() {
  console.log('=== ACTUALIZACIÓN COMPLETA DEL CATÁLOGO (31 PIEZAS DAILY) ===\n');

  // 1. Cargar dataset existente como referencia de traducciones previas
  let existingBySlug = new Map();
  let existingById = new Map();
  const backupPath = path.resolve('scripts/dataset_final.json.bak');
  if (fs.existsSync(backupPath)) {
    const prev = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    prev.forEach(p => {
      existingById.set(p.id, p);
      if (p.slug) existingBySlug.set(p.slug, p);
    });
  }

  // 2. Limpiar productos viejos en la base de datos (e.g. 8775, 8774, 8773, 8815)
  console.log('Limpiando piezas que no pertenezcan a las 31 de la colección Daily...');
  await prisma.favorite.deleteMany({ where: { productId: { notIn: TARGET_IDS } } });
  await prisma.curatedItem.deleteMany({ where: { productId: { notIn: TARGET_IDS } } });
  await prisma.listItem.deleteMany({ where: { productId: { notIn: TARGET_IDS } } });
  const delRes = await prisma.product.deleteMany({ where: { id: { notIn: TARGET_IDS } } });
  console.log(`Piezas no pertenecientes eliminadas: ${delRes.count}`);

  // 3. Descargar y procesar cada una de las 31 piezas
  console.log('\nDescargando y procesando los 31 productos desde Porto Brasil...');
  const finalProducts = [];

  for (let i = 0; i < TARGET_IDS.length; i++) {
    const id = TARGET_IDS[i];
    process.stdout.write(`[${i + 1}/31] Procesando ID ${id}... `);

    const url = `https://www.portobrasilceramica.com.br/api/catalog_system/pub/products/search?fq=productId:${id}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    const vtex = data[0];

    if (!vtex) {
      console.log('❌ Error: no encontrado en VTEX');
      continue;
    }

    const namePt = vtex.productName;
    const nameEs = translateName(namePt);
    const colMeta = getCollectionMeta(namePt);
    const pieceMeta = getPieceMeta(namePt);

    // Parse specs
    const specsHtml = vtex['Características do produto']?.[0] || '';
    const specs = parseTable(specsHtml);

    const dimStr = specs['Dimensões do Produto'] || '';
    const dims = parseDimensions(dimStr);

    let capacity = null;
    const capMatch = namePt.match(/(\d+)\s*ml/i);
    if (capMatch) capacity = parseInt(capMatch[1], 10);

    const prevItem = existingById.get(id);

    const productRecord = {
      id: String(id),
      slug: vtex.linkText || prevItem?.slug || `daily-${id}`,
      nameEs: prevItem?.nameEs || nameEs,
      namePt: namePt,
      reference: vtex.productReference || prevItem?.reference || null,
      categoryId: vtex.categoryId || prevItem?.categoryId || '7',
      collection: 'DAY BY DAY',
      line: 'DAILY',
      material: 'Stoneware',
      materialEs: 'Gres / Stoneware',
      colorDecor: 'Colorido',
      colorBase: colMeta.colorBase,
      colorGroup: colMeta.colorGroup,
      tone: colMeta.tone,
      pieceGroup: pieceMeta.pieceGroup,
      pieceGroupEs: pieceMeta.pieceGroupEs,
      productType: pieceMeta.productType,
      productTypeLabel: pieceMeta.productTypeLabel,
      diameter: prevItem?.diameter ?? dims.diameter,
      height: prevItem?.height ?? dims.height,
      capacity: prevItem?.capacity ?? capacity,
      pieces: prevItem?.pieces ?? pieceMeta.pieces,
      available: true,
      published: true,
      releaseDate: vtex.releaseDate ? vtex.releaseDate.split('T')[0] : (prevItem?.releaseDate || '2026-03-03'),
      manufacturerCode: specs['Código do Fabricante'] || prevItem?.manufacturerCode || null,
      boxComposition: specs['Composição da Caixa'] || prevItem?.boxComposition || null,
      packWeight: specs['Peso da Embalagem'] || prevItem?.packWeight || null,
      packDim: specs['Dimensões da Embalagem'] || prevItem?.packDim || null,
      packType: specs['Tipo de embalagem'] || prevItem?.packType || 'Caixa Parda',
      descriptionEs: prevItem?.descriptionEs || generateDescriptionEs(nameEs, colMeta, pieceMeta),
      careEs: prevItem?.careEs || DEFAULT_CARE_ES,
      infoEs: prevItem?.infoEs || DEFAULT_INFO_ES,
      images: (vtex.items?.[0]?.images?.length) ? formatImages(vtex.items[0].images) : (prevItem?.images || '[]'),
      moodImages: prevItem?.moodImages || '[]'
    };

    // Upsert into Prisma DB
    const { pieceGroupEs, ...dbData } = productRecord;
    await prisma.product.upsert({
      where: { id: String(id) },
      update: dbData,
      create: dbData
    });

    finalProducts.push(productRecord);
    console.log(`✅ ${productRecord.nameEs}`);
  }

  // 4. Guardar dataset sincronizado
  const datasetPath = path.resolve('scripts/dataset_final.json');
  fs.writeFileSync(datasetPath, JSON.stringify(finalProducts, null, 2), 'utf8');
  console.log(`\n💾 scripts/dataset_final.json actualizado con ${finalProducts.length} productos.`);

  // 5. Compactar SQLite
  try {
    await prisma.$executeRawUnsafe('VACUUM;');
    console.log('Base de datos SQLite optimizada (VACUUM).');
  } catch (err) {
    // ignore
  }

  // 6. Resumen final
  const dbCount = await prisma.product.count();
  const byCol = {};
  finalProducts.forEach(p => {
    const variant = getCollectionMeta(p.namePt).variant;
    byCol[variant] = (byCol[variant] || 0) + 1;
  });

  console.log('\n=======================================');
  console.log(`TOTAL PRODUCTOS EN CATÁLOGO: ${dbCount}`);
  console.log('DISTRIBUCIÓN POR COLECCIÓN:');
  Object.entries(byCol).forEach(([col, count]) => {
    console.log(`  - Daily ${col}: ${count} productos`);
  });
  console.log('=======================================');
}

main()
  .catch(err => {
    console.error('Error durante la importación:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
