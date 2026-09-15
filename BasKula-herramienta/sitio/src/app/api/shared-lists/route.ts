import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// POST /api/shared-lists → crea lista compartible desde los favoritos del cliente
export async function POST(req: NextRequest) {
  try {
    // Header x-client-code (robusto) O cookie pb_client (legacy)
    let code = req.headers.get("x-client-code") || "";
    if (!code) {
      const store = await cookies();
      code = store.get("pb_client")?.value || "";
    }
    if (!code) {
      return NextResponse.json({ error: "Necesita código de cliente" }, { status: 401 });
    }
    const client = await db.client.findUnique({ where: { code } });
    if (!client) {
      return NextResponse.json({ error: "Cliente no válido" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.slice(0, 500) : null;

    // Estricto: las listas compartidas solo incluyen piezas públicas
    // (las ocultas desaparecen de la vista del cliente)
    const favorites = await db.favorite.findMany({
      where: { clientId: client.id, product: { published: true } },
      include: { product: { select: { id: true } } },
      orderBy: { createdAt: "asc" },
    });

    if (favorites.length === 0) {
      return NextResponse.json({ error: "No hay favoritos para compartir" }, { status: 400 });
    }

    const list = await db.sharedList.create({
      data: {
        clientId: client.id,
        message,
        items: {
          create: favorites.map((f) => ({
            productId: f.productId,
            quantity: f.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({
      ok: true,
      listId: list.id,
      clientName: client.name,
      clientCode: client.code,
      itemCount: list.items.length,
    });
  } catch (e) {
    console.error("shared-lists POST error:", e);
    return NextResponse.json({ error: "Error creando lista" }, { status: 500 });
  }
}
