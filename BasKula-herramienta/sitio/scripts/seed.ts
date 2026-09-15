/**
 * Seed del catálogo Porto Brasil → Prisma SQLite
 * Lee scripts/dataset_final.json (con traducciones disponibles)
 * Re-ejecutable: actualiza productos existentes.
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface DatasetRow {
  id: string;
  slug: string;
  nameEs: string;
  namePt?: string;
  reference?: string;
  categoryId?: string;
  collection?: string;
  line?: string;
  material?: string;
  colorDecor?: string;
  colorBase?: string;
  colorGroup?: string;
  pieceGroup?: string;
  pieceGroupEs?: string;
  productType?: string;
  productTypeLabel?: string;
  diameter?: number | null;
  height?: number | null;
  capacity?: number | null;
  pieces?: number | null;
  available?: boolean;
  releaseDate?: string;
  manufacturerCode?: string;
  boxComposition?: string;
  packWeight?: string;
  packDim?: string;
  packType?: string;
  descriptionEs?: string;
  careEs?: string;
  infoEs?: string;
  images: string;
  moodImages: string;
}

async function main() {
  const datasetPath = path.join(__dirname, "dataset_final.json");
  const raw = fs.readFileSync(datasetPath, "utf-8");
  const dataset: DatasetRow[] = JSON.parse(raw);

  console.log(`📦 Seed: ${dataset.length} productos`);

  // Configuración inicial
  await prisma.setting.upsert({
    where: { key: "adminPin" },
    update: {},
    create: { key: "adminPin", value: "2026" },
  });
  await prisma.setting.upsert({
    where: { key: "whatsapp" },
    update: {},
    create: { key: "whatsapp", value: "" },
  });
  await prisma.setting.upsert({
    where: { key: "whatsappMessage" },
    update: {},
    create: { key: "whatsappMessage", value: "" },
  });

  let created = 0;
  let updated = 0;
  const BATCH = 200;

  for (let i = 0; i < dataset.length; i += BATCH) {
    const chunk = dataset.slice(i, i + BATCH);
    for (const row of chunk) {
      const data = {
        slug: row.slug,
        nameEs: row.nameEs,
        namePt: row.namePt || null,
        reference: row.reference || null,
        categoryId: row.categoryId || null,
        collection: row.collection || null,
        line: row.line || null,
        material: row.material || null,
        colorDecor: row.colorDecor || null,
        colorBase: row.colorBase || null,
        colorGroup: row.colorGroup || null,
        pieceGroup: row.pieceGroup || null,
        productType: row.productType || null,
        productTypeLabel: row.productTypeLabel || null,
        diameter: row.diameter ?? null,
        height: row.height ?? null,
        capacity: row.capacity ?? null,
        pieces: row.pieces ?? null,
        available: row.available ?? false,
        releaseDate: row.releaseDate || null,
        manufacturerCode: row.manufacturerCode || null,
        boxComposition: row.boxComposition || null,
        packWeight: row.packWeight || null,
        packDim: row.packDim || null,
        packType: row.packType || null,
        descriptionEs: row.descriptionEs || null,
        careEs: row.careEs || null,
        infoEs: row.infoEs || null,
        images: row.images || "[]",
        moodImages: row.moodImages || "[]",
      };

      const existing = await prisma.product.findUnique({ where: { id: row.id }, select: { id: true } });
      if (existing) {
        await prisma.product.update({ where: { id: row.id }, data });
        updated++;
      } else {
        await prisma.product.create({ data: { id: row.id, ...data } });
        created++;
      }
    }
    process.stdout.write(`  ${Math.min(i + BATCH, dataset.length)}/${dataset.length}\r`);
  }
  console.log("");

  // Cliente demo (para pruebas — puede eliminarse desde el panel)
  const demo = await prisma.client.findUnique({ where: { code: "DEMO" } });
  if (!demo) {
    await prisma.client.create({
      data: {
        code: "DEMO",
        name: "Restaurante La Demo",
        contactName: "Chef Demo",
        notes: "Cliente de ejemplo para pruebas. Elimínalo desde el panel cuando quieras.",
      },
    });
    console.log("👤 Cliente demo creado: /c/DEMO");
  }

  const total = await prisma.product.count();
  const conDesc = await prisma.product.count({ where: { descriptionEs: { not: null } } });
  const conCare = await prisma.product.count({ where: { careEs: { not: null } } });
  const disponibles = await prisma.product.count({ where: { available: true } });
  console.log(
    `📊 Total: ${total} | con descripción ES: ${conDesc} | con cuidados: ${conCare} | disponibles: ${disponibles}`
  );
  console.log(`✔ Seed completo: ${created} creados, ${updated} actualizados`);
}

main()
  .catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
