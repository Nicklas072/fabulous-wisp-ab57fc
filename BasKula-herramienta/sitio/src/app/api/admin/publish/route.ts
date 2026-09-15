import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { invalidateCatalogCache } from "@/lib/catalog";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

// GET /api/admin/publish → contadores de publicación (tarjeta del panel)
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const [total, published] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { published: true } }),
    ]);
    return NextResponse.json({ total, published });
  } catch (e) {
    console.error("publish GET error:", e);
    return NextResponse.json({ error: "Error contando piezas" }, { status: 500 });
  }
}

// POST /api/admin/publish { ids: string[], published: boolean }
// → publica u oculta UN LOTE de piezas (por selección con checkboxes,
// o una sola pieza con el ojo). Invalida la caché del catálogo para
// que la página principal refleje el cambio de inmediato.
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
    const published = Boolean(body.published);

    if (ids.length === 0) {
      return NextResponse.json({ error: "ids requerido (array)" }, { status: 400 });
    }
    if (ids.length > 2000) {
      return NextResponse.json({ error: "Máximo 2.000 piezas por lote" }, { status: 400 });
    }

    const result = await db.product.updateMany({
      where: { id: { in: ids } },
      data: { published },
    });

    // La página principal y el índice del panel deben reflejar el cambio
    invalidateCatalogCache();
    try {
      revalidatePath("/", "page");
      revalidatePath("/api/catalog");
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      ok: true,
      updated: result.count,
      published,
    });
  } catch (e) {
    console.error("publish POST error:", e);
    return NextResponse.json({ error: "Error actualizando publicación" }, { status: 500 });
  }
}
