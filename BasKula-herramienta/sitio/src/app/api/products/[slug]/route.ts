import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCatalogIndex, getSuggestionsFor } from "@/lib/catalog";
import { isAdminRequest } from "@/lib/admin-auth";

// GET /api/products/[slug] → ficha completa del producto + sugerencias
// Piezas OCULTAS: 404 para cualquiera, EXCEPTO el admin (header
// x-admin-pin / cookie pb_admin), que la ve con published:false para
// mostrar el rótulo «Oculta» y el ojo para publicarla al instante.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const p = await db.product.findUnique({ where: { slug } });
    if (!p) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }



    const index = await getCatalogIndex();
    const compact = index.find((i) => i.slug === slug);
    const suggestions = compact ? getSuggestionsFor(compact, index, 8) : [];

    let images: { url: string; url1000: string }[] = [];
    let moodImages: string[] = [];
    try {
      images = p.images ? JSON.parse(p.images) : [];
      moodImages = p.moodImages ? JSON.parse(p.moodImages) : [];
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      product: {
        id: p.id,
        slug: p.slug,
        nameEs: p.nameEs,
        namePt: p.namePt,
        reference: p.reference,
        collection: p.collection,
        line: p.line,
        material: p.material,
        colorDecor: p.colorDecor,
        colorBase: p.colorBase,
        colorGroup: p.colorGroup,
        pieceGroup: p.pieceGroup,
        productType: p.productType,
        productTypeLabel: p.productTypeLabel,
        diameter: p.diameter,
        height: p.height,
        capacity: p.capacity,
        pieces: p.pieces,
        available: p.available,
        published: p.published,
        releaseDate: p.releaseDate,
        manufacturerCode: p.manufacturerCode,
        boxComposition: p.boxComposition,
        packWeight: p.packWeight,
        packDim: p.packDim,
        packType: p.packType,
        descriptionEs: p.descriptionEs,
        careEs: p.careEs,
        infoEs: p.infoEs,
        images,
        moodImages,
        image: images[0]?.url || "",
      },
      suggestions,
    });
  } catch (e) {
    console.error("product error:", e);
    return NextResponse.json({ error: "Error cargando producto" }, { status: 500 });
  }
}
