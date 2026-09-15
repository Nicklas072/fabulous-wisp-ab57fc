import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Actividad del cliente: registra eventos generados desde el navegador
// que no pasan por otra API (hoy: la descarga del PDF de su lista).
// El `detail` lo calcula el SERVIDOR — el cliente solo indica el tipo,
// así el registro no se puede falsificar ni duplicar desde el cliente.

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

// POST /api/client/activity { type: "download" }
export async function POST(req: NextRequest) {
  try {
    const client = await getClient(req);
    if (!client) {
      return NextResponse.json({ error: "Necesita código de cliente" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const type = String(body.type || "");

    if (type === "download") {
      // El detalle lo arma el servidor con el estado real de la lista
      const count = await db.favorite
        .count({ where: { clientId: client.id, product: { published: true } } })
        .catch(() => 0);
      await db.visit.create({
        data: {
          clientId: client.id,
          type: "download",
          detail: `Descargó su lista de interés en PDF (${count} ${
            count === 1 ? "referencia" : "referencias"
          })`,
        },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Tipo de actividad no válido" }, { status: 400 });
  } catch (e) {
    console.error("client activity POST error:", e);
    return NextResponse.json({ error: "Error registrando actividad" }, { status: 500 });
  }
}
