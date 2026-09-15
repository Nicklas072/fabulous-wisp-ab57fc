import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

// GET /api/admin/activity → actividad COMPLETA de cada cliente:
// ingresos, corazones guardados/quitados, notas enviadas y descargas
// de su lista, más las listas compartidas (para cotizar).

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();

    const [events, clients, sharedLists, totalFavorites] = await Promise.all([
      // Timeline: últimos 150 eventos de cualquier tipo
      db.visit.findMany({
        take: 150,
        orderBy: { createdAt: "desc" },
        include: { client: { select: { name: true, code: true } } },
      }),
      // Totales por cliente (ingresos = visitCount, histórico completo)
      db.client.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          active: true,
          visitCount: true,
          lastVisit: true,
          _count: { select: { favorites: true } },
        },
        orderBy: { lastVisit: "desc" },
      }),
      db.sharedList.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true, code: true } },
          items: {
            include: {
              product: {
                select: {
                  nameEs: true,
                  slug: true,
                  images: true,
                  reference: true,
                  collection: true,
                  productTypeLabel: true,
                  diameter: true,
                  pieces: true,
                  colorBase: true,
                },
              },
            },
          },
        },
      }),
      db.favorite.count(),
    ]);

    // Conteos por cliente de los eventos registrados (histórico completo)
    const grouped = await db.visit
      .groupBy({
        by: ["clientId", "type"],
        _count: { _all: true },
        _max: { createdAt: true },
      })
      .catch(() => [] as { clientId: string; type: string; _count: { _all: number }; _max: { createdAt: Date | null } }[]);

    // Armado del resumen por cliente
    const stats = new Map<
      string,
      { favAdds: number; favRemoves: number; notes: number; downloads: number; lastEvent: Date | null }
    >();
    for (const g of grouped) {
      const cur =
        stats.get(g.clientId) || { favAdds: 0, favRemoves: 0, notes: 0, downloads: 0, lastEvent: null };
      if (g.type === "fav_add") cur.favAdds = g._count._all;
      else if (g.type === "fav_remove") cur.favRemoves = g._count._all;
      else if (g.type === "note") cur.notes = g._count._all;
      else if (g.type === "download") cur.downloads = g._count._all;
      if (g._max.createdAt && (!cur.lastEvent || g._max.createdAt > cur.lastEvent)) {
        cur.lastEvent = g._max.createdAt;
      }
      stats.set(g.clientId, cur);
    }

    const summary = clients.map((c) => {
      const s = stats.get(c.id);
      return {
        id: c.id,
        name: c.name,
        code: c.code,
        active: c.active,
        logins: c.visitCount,
        favorites: c._count.favorites,
        favAdds: s?.favAdds || 0,
        favRemoves: s?.favRemoves || 0,
        notes: s?.notes || 0,
        downloads: s?.downloads || 0,
        lastVisit: c.lastVisit,
        lastEvent: s?.lastEvent || c.lastVisit,
      };
    });

    return NextResponse.json({
      events: events.map((v) => ({
        id: v.id,
        clientName: v.client.name,
        clientCode: v.client.code,
        type: v.type,
        detail: v.detail,
        createdAt: v.createdAt,
      })),
      summary,
      sharedLists: sharedLists.map((l) => ({
        id: l.id,
        clientName: l.client.name,
        clientCode: l.client.code,
        message: l.message,
        itemCount: l.items.length,
        createdAt: l.createdAt,
        items: l.items.map((i) => {
          let image = "";
          try {
            image = i.product.images ? JSON.parse(i.product.images)[0]?.url || "" : "";
          } catch {
            /* ignore */
          }
          return {
            nameEs: i.product.nameEs,
            slug: i.product.slug,
            quantity: i.quantity,
            image,
            reference: i.product.reference,
            collection: i.product.collection,
            productTypeLabel: i.product.productTypeLabel,
            diameter: i.product.diameter,
            pieces: i.product.pieces,
            colorBase: i.product.colorBase,
          };
        }),
      })),
      stats: {
        clients: clients.length,
        totalFavorites,
        totalSharedLists: sharedLists.length,
        logins: summary.reduce((acc, c) => acc + c.logins, 0),
        downloads: summary.reduce((acc, c) => acc + c.downloads, 0),
      },
    });
  } catch (e) {
    console.error("admin activity error:", e);
    return NextResponse.json({ error: "Error cargando actividad" }, { status: 500 });
  }
}
