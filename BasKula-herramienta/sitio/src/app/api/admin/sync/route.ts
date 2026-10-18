import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { invalidateCatalogCache } from "@/lib/catalog";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// POST /api/admin/sync → sincroniza base de datos con dataset_final.json,
// invalida caché en memoria y revalida todas las rutas públicas
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();

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
