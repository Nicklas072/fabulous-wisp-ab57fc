import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Identificación del cliente: header x-client-code (robusto contra
// bloqueo de cookies en iframes/previews) O cookie pb_client (legacy)
async function getClient(req: NextRequest) {
  let code = req.headers.get("x-client-code") || "";
  if (!code) {
    const store = await cookies();
    code = store.get("pb_client")?.value || "";
  }
  if (!code) return null;
  const client = await db.client.findUnique({ where: { code } });
  if (!client || !client.active) return null;
  return client;
}

// GET /api/client/favorites → lista de favoritos del cliente identificado
export async function GET(req: NextRequest) {
  try {
    const client = await getClient(req);
    if (!client) return NextResponse.json({ favorites: [] });

    // El cliente ve sus piezas favoritas y recomendadas aunque no estén en el catálogo general
    const favorites = await db.favorite.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            nameEs: true,
            images: true,
            reference: true,
            productTypeLabel: true,
            diameter: true,
            pieces: true,
            collection: true,
            colorBase: true,
            available: true,
          },
        },
      },
    });

    return NextResponse.json({
      client: { code: client.code, name: client.name },
      favorites: favorites.map((f) => {
        let image = "";
        try {
          image = f.product.images ? JSON.parse(f.product.images)[0]?.url || "" : "";
        } catch {
          /* ignore */
        }
        return {
          productId: f.productId,
          nameEs: f.product.nameEs,
          slug: f.product.slug,
          quantity: f.quantity,
          image,
          reference: f.product.reference || "",
          productTypeLabel: f.product.productTypeLabel || "",
          diameter: f.product.diameter,
          pieces: f.product.pieces,
          collection: f.product.collection || "",
          colorBase: f.product.colorBase || "",
          available: f.product.available,
          addedAt: f.createdAt.toISOString(),
        };
      }),
    });
  } catch (e) {
    console.error("favorites GET error:", e);
    return NextResponse.json({ error: "Error cargando favoritos" }, { status: 500 });
  }
}

// POST /api/client/favorites { productId, quantity? } → añade/actualiza
export async function POST(req: NextRequest) {
  try {
    const client = await getClient(req);
    if (!client) {
      return NextResponse.json({ error: "Necesita código de cliente" }, { status: 401 });
    }
    const body = await req.json();
    const productId = String(body.productId || "");
    const quantity = Math.max(1, parseInt(body.quantity) || 1);
    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    // Estricto: no se pueden guardar favoritos de piezas ocultas
    if (!product.published) {
      return NextResponse.json({ error: "Pieza no publicada" }, { status: 404 });
    }

    const existing = await db.favorite.findUnique({
      where: { clientId_productId: { clientId: client.id, productId } },
    });

    if (existing) {
      await db.favorite.update({
        where: { id: existing.id },
        data: { quantity },
      });
    } else {
      await db.favorite.create({
        data: { clientId: client.id, productId, quantity },
      });
      // Actividad: la pieza entró a su lista de interés
      try {
        await db.visit.create({
          data: { clientId: client.id, type: "fav_add", detail: product.nameEs },
        });
      } catch {
        /* la métrica nunca rompe el guardado */
      }
    }

    const count = await db.favorite.count({ where: { clientId: client.id } });
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    console.error("favorites POST error:", e);
    return NextResponse.json({ error: "Error guardando favorito" }, { status: 500 });
  }
}

// DELETE /api/client/favorites?productId=X → elimina favorito
export async function DELETE(req: NextRequest) {
  try {
    const client = await getClient(req);
    if (!client) {
      return NextResponse.json({ error: "Necesita código de cliente" }, { status: 401 });
    }
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }
    // Actividad: saber qué pieza quitó (best-effort, previo al borrado)
    let removedName: string | null = null;
    try {
      const fav = await db.favorite.findFirst({
        where: { clientId: client.id, productId },
        select: { product: { select: { nameEs: true } } },
      });
      removedName = fav?.product.nameEs || null;
    } catch {
      /* ignora */
    }
    await db.favorite.deleteMany({
      where: { clientId: client.id, productId },
    });
    if (removedName) {
      try {
        await db.visit.create({
          data: { clientId: client.id, type: "fav_remove", detail: removedName },
        });
      } catch {
        /* la métrica nunca rompe el borrado */
      }
    }
    const count = await db.favorite.count({ where: { clientId: client.id } });
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    console.error("favorites DELETE error:", e);
    return NextResponse.json({ error: "Error eliminando favorito" }, { status: 500 });
  }
}
