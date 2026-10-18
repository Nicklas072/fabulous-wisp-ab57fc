import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { invalidateCatalogCache } from "@/lib/catalog";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

import dailyCatalog from "@/data/daily_catalog.json";

export const dynamic = "force-dynamic";

// POST /api/admin/sync → sincroniza base de datos con dataset_final.json,
// invalida caché en memoria y revalida todas las rutas públicas
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();

    const body = await req.json().catch(() => ({}));

    if (body?.action === "seed_daily") {
      const allowedIds = (dailyCatalog as any[]).map((d) => d.id);
      if (body?.purgeOthers) {
        await db.product.deleteMany({
          where: { id: { notIn: allowedIds } },
        });
      }

      for (const item of dailyCatalog as any[]) {
        await db.product.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            slug: item.slug,
            nameEs: item.nameEs,
            namePt: item.namePt || null,
            reference: item.reference || null,
            categoryId: item.categoryId || null,
            collection: item.collection || null,
            line: item.line || null,
            material: item.material || null,
            materialEs: item.materialEs || null,
            colorDecor: item.colorDecor || null,
            colorBase: item.colorBase || null,
            colorGroup: item.colorGroup || null,
            tone: item.tone || null,
            pieceGroup: item.pieceGroup || null,
            productType: item.productType || null,
            productTypeLabel: item.productTypeLabel || null,
            diameter: item.diameter !== undefined ? item.diameter : null,
            height: item.height !== undefined ? item.height : null,
            capacity: item.capacity !== undefined ? item.capacity : null,
            pieces: item.pieces !== undefined ? item.pieces : null,
            available: item.available ?? true,
            published: item.published ?? false,
            releaseDate: item.releaseDate || null,
            manufacturerCode: item.manufacturerCode || null,
            boxComposition: item.boxComposition || null,
            packWeight: item.packWeight || null,
            packDim: item.packDim || null,
            packType: item.packType || null,
            descriptionEs: item.descriptionEs || null,
            careEs: item.careEs || null,
            infoEs: item.infoEs || null,
            images: typeof item.images === "string" ? item.images : JSON.stringify(item.images),
            moodImages: typeof item.moodImages === "string" ? item.moodImages : JSON.stringify(item.moodImages || []),
          },
          update: {
            nameEs: item.nameEs,
            published: item.published ?? false,
            available: item.available ?? true,
            pieceGroup: item.pieceGroup || null,
            productType: item.productType || null,
            productTypeLabel: item.productTypeLabel || null,
            diameter: item.diameter !== undefined ? item.diameter : null,
            colorBase: item.colorBase || null,
            colorGroup: item.colorGroup || null,
            tone: item.tone || null,
          },
        });
      }
    }

    // 1. Obtener todos los productos actuales de la base de datos
    const products = await db.product.findMany({
      orderBy: { id: "asc" },
    });

    const published = products.filter((p) => p.published).length;

    // 2. Sincronizar archivo dataset_final.json para persistencia en disco
    try {
      const datasetPath = path.resolve(process.cwd(), "scripts/dataset_final.json");
      fs.writeFileSync(datasetPath, JSON.stringify(products, null, 2), "utf8");
    } catch (fsErr) {
      console.warn("No se pudo escribir en scripts/dataset_final.json:", fsErr);
    }

    // 3. Invalidar caché en memoria del servidor
    invalidateCatalogCache();

    // 4. Revalidar rutas Next.js
    try {
      revalidatePath("/", "layout");
      revalidatePath("/api/catalog");
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      ok: true,
      total: products.length,
      published,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.error("admin sync error:", e);
    return NextResponse.json({ error: "Error durante la sincronización" }, { status: 500 });
  }
}
