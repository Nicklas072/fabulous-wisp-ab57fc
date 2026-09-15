import { NextRequest, NextResponse } from "next/server";
import { getFullCatalogIndex } from "@/lib/catalog";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

// GET /api/admin/catalog → índice COMPLETO (las 1.510 piezas) con su
// estado de publicación. Solo para el panel de administración:
// alimenta la vista «Catálogo completo» (grilla, filtros, selección).
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const products = await getFullCatalogIndex();
    const published = products.filter((p) => p.published).length;
    return NextResponse.json({
      products,
      counts: { total: products.length, published },
    });
  } catch (e) {
    console.error("admin catalog error:", e);
    return NextResponse.json({ error: "Error cargando catálogo completo" }, { status: 500 });
  }
}
