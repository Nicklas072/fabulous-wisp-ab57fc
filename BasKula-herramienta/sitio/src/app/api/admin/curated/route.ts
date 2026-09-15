import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

// GET /api/admin/curated?clientId=X → selección curada del cliente
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const clientId = req.nextUrl.searchParams.get("clientId");
    if (!clientId) return NextResponse.json({ error: "clientId requerido" }, { status: 400 });

    const items = await db.curatedItem.findMany({
      where: { clientId },
      orderBy: { sort: "asc" },
      include: {
        product: {
          select: {
            id: true, nameEs: true, slug: true, collection: true, images: true,
            productTypeLabel: true, colorBase: true, diameter: true, published: true,
          },
        },
      },
    });
    return NextResponse.json({
      items: items.map((i) => {
        let image = "";
        try {
          image = i.product.images ? JSON.parse(i.product.images)[0]?.url || "" : "";
        } catch {
          /* ignore */
        }
        return {
          productId: i.productId,
          nameEs: i.product.nameEs,
          slug: i.product.slug,
          collection: i.product.collection,
          note: i.note,
          sort: i.sort,
          image,
          published: i.product.published,
        };
      }),
    });
  } catch (e) {
    console.error("curated GET error:", e);
    return NextResponse.json({ error: "Error cargando selección" }, { status: 500 });
  }
}

// POST /api/admin/curated { clientId, productId, note? } → añadir a selección
// Se permite añadir piezas aún ocultas (el admin decide), pero se
// devuelve notPublic:true para avisar en el panel: el cliente no la
// verá hasta que se publique en la página principal.
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const body = await req.json();
    const clientId = String(body.clientId || "");
    const productId = String(body.productId || "");
    if (!clientId || !productId) {
      return NextResponse.json({ error: "clientId y productId requeridos" }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { published: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const count = await db.curatedItem.count({ where: { clientId } });
    const item = await db.curatedItem.create({
      data: {
        clientId,
        productId,
        note: body.note ? String(body.note).slice(0, 300) : null,
        sort: count,
      },
    });
    return NextResponse.json({ ok: true, id: item.id, notPublic: !product.published });
  } catch (e) {
    console.error("curated POST error:", e);
    return NextResponse.json({ error: "Error añadiendo a selección" }, { status: 500 });
  }
}

// DELETE /api/admin/curated?clientId=X&productId=Y → quitar de selección
export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const clientId = req.nextUrl.searchParams.get("clientId");
    const productId = req.nextUrl.searchParams.get("productId");
    if (!clientId || !productId) {
      return NextResponse.json({ error: "Parámetros requeridos" }, { status: 400 });
    }
    await db.curatedItem.deleteMany({ where: { clientId, productId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("curated DELETE error:", e);
    return NextResponse.json({ error: "Error quitando de selección" }, { status: 500 });
  }
}
