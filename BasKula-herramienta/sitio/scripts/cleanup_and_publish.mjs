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
  console.log('Iniciando proceso de depuración y publicación...');

  // 1. Contar antes
  const totalBefore = await prisma.product.count();
  const unavailableBefore = await prisma.product.count({ where: { available: false } });
  console.log('Total de productos antes:', totalBefore);
  console.log('Productos no disponibles a eliminar:', unavailableBefore);

  // 2. Eliminar permanentemente los no disponibles
  const deleteResult = await prisma.product.deleteMany({
    where: { available: false }
  });
  console.log('Productos eliminados definitivamente:', deleteResult.count);

  // 3. Ocultar todos los productos restantes
  const unpublishResult = await prisma.product.updateMany({
    data: { published: false }
  });
  console.log('Productos ocultados (published = false):', unpublishResult.count);

  // 4. Publicar exactamente los 16 artículos seleccionados
  const publishResult = await prisma.product.updateMany({
    where: { id: { in: TARGET_IDS } },
    data: { published: true }
  });
  console.log('Artículos de Calm, Happy, Intense, Shiny y Snow publicados:', publishResult.count);

  // 5. Verificar estado en base de datos
  const totalAfter = await prisma.product.count();
  const publishedAfter = await prisma.product.count({ where: { published: true } });
  const hiddenAvailable = await prisma.product.count({ where: { published: false, available: true } });
  console.log('\n--- RESUMEN EN BASE DE DATOS ---');
  console.log('Total en BD ahora:', totalAfter);
  console.log('Publicados activos en la web:', publishedAfter);
  console.log('Disponibles ocultos (en reserva):', hiddenAvailable);

  const publishedItems = await prisma.product.findMany({
    where: { published: true },
    select: { id: true, nameEs: true, line: true, collection: true, productTypeLabel: true }
  });
  console.log('\nLista de los 16 publicados:');
  publishedItems.forEach(p => console.log('  - [' + p.id + '] ' + p.nameEs + ' (' + p.line + ')'));

  // 6. Actualizar dataset_final.json para mantener sincronización
  const datasetPath = path.resolve('scripts/dataset_final.json');
  if (fs.existsSync(datasetPath)) {
    const rawData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    console.log('\nSincronizando dataset_final.json (total previo:', rawData.length, ')...');
    const filteredData = rawData
      .filter(item => item.available === true)
      .map(item => {
        return {
          ...item,
          published: TARGET_IDS.includes(item.id)
        };
      });
    fs.writeFileSync(datasetPath, JSON.stringify(filteredData, null, 2), 'utf8');
    console.log('dataset_final.json actualizado. Total de registros ahora:', filteredData.length);
  }
}

main()
  .catch(e => {
    console.error('Error durante la ejecución:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
