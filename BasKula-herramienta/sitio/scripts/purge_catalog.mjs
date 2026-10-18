import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const TARGET_IDS = [
  // Calm (4)
  '8793', '8794', '8796', '8803',
  // Happy (2)
  '8790', '8789',
  // Intense (6)
  '8806', '8807', '8808', '8809', '8810', '8804',
  // Shiny (1)
  '8815',
  // Snow (3)
  '8775', '8774', '8773'
];

async function main() {
  console.log('=== INICIANDO PURGA DEL CATÁLOGO ===\n');

  const initialCount = await prisma.product.count();
  console.log(`Productos en base de datos antes: ${initialCount}`);

  // 1. Limpiar referencias foráneas que apunten a productos fuera de las 16 seleccionadas
  const delFavs = await prisma.favorite.deleteMany({
    where: { productId: { notIn: TARGET_IDS } }
  });
  const delCurated = await prisma.curatedItem.deleteMany({
    where: { productId: { notIn: TARGET_IDS } }
  });
  const delListItems = await prisma.listItem.deleteMany({
    where: { productId: { notIn: TARGET_IDS } }
  });
  console.log(`Referencias limpiadas: Favoritos=${delFavs.count}, Curados=${delCurated.count}, ListItems=${delListItems.count}`);

  // 2. Eliminar de la base de datos todos los productos que no sean los 16 seleccionados
  const delProducts = await prisma.product.deleteMany({
    where: { id: { notIn: TARGET_IDS } }
  });
  console.log(`Productos eliminados: ${delProducts.count}`);

  // 3. Asegurar que las 16 piezas queden publicadas y disponibles
  const updateResult = await prisma.product.updateMany({
    where: { id: { in: TARGET_IDS } },
    data: { published: true, available: true }
  });
  console.log(`Productos actualizados a publicados y disponibles: ${updateResult.count}`);

  // 4. Ejecutar VACUUM en SQLite para compactar el archivo en disco
  try {
    await prisma.$executeRawUnsafe('VACUUM;');
    console.log('Base de datos SQLite compactada (VACUUM ejecutado con éxito).');
  } catch (err) {
    console.warn('Nota: VACUUM no se ejecutó directamente:', err.message);
  }

  // 5. Verificar productos restantes
  const finalCount = await prisma.product.count();
  const remaining = await prisma.product.findMany({
    select: { id: true, nameEs: true, line: true, collection: true, pieceGroup: true }
  });
  console.log(`\nProductos restantes en base de datos: ${finalCount}`);
  remaining.forEach(p => console.log(`  - [ID ${p.id}] ${p.nameEs} (${p.line} / ${p.collection || 'Sin colección'})`));

  // 6. Sincronizar dataset_final.json
  const datasetPath = path.resolve('scripts/dataset_final.json');
  if (fs.existsSync(datasetPath)) {
    const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    const filteredDataset = rawData.filter(item => TARGET_IDS.includes(item.id)).map(item => ({
      ...item,
      published: true,
      available: true
    }));
    fs.writeFileSync(datasetPath, JSON.stringify(filteredDataset, null, 2), 'utf8');
    console.log(`\ndataset_final.json sincronizado: ahora contiene ${filteredDataset.length} productos.`);
  }

  console.log('\n=== PURGA COMPLETADA CON ÉXITO ===');
}

main()
  .catch(err => {
    console.error('Error durante la purga:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
