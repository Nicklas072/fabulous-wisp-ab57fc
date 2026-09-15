import { NextResponse } from "next/server";
import { getCatalogIndex } from "@/lib/catalog";

// Siempre dinámico (prod incluida): el índice depende de la BD
export const dynamic = "force-dynamic";

// GET /api/catalog → índice compacto de productos (para filtros
// instantáneos en cliente). SOLO piezas publicadas por el admin.
// Sin caché de navegador: el admin publica/oculta desde el panel y
// al recargar la página principal ve el cambio al instante.
export async function GET() {
  try {
    const index = await getCatalogIndex();
    return NextResponse.json(
      { products: index },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("catalog error:", e);
    return NextResponse.json({ error: "Error cargando catálogo" }, { status: 500 });
  }
}
