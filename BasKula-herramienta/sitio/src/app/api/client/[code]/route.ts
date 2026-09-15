import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/client/[code] → identifica al cliente y registra la visita
// El registro de la visita es best-effort: si falla (p. ej. bloqueo de
// SQLite), el cliente igual queda identificado — el login NUNCA se
// rompe por un problema de métricas.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: raw } = await params;
    const code = raw.trim().toUpperCase();
    const client = await db.client.findUnique({ where: { code } });
    if (!client || !client.active) {
      return NextResponse.json({ error: "Código no válido" }, { status: 404 });
    }

    // Registrar ingreso (sin afectar el resultado del login)
    try {
      await db.visit.create({
        data: { clientId: client.id, type: "login", detail: "Ingresó con su código de cliente" },
      });
      await db.client.update({
        where: { id: client.id },
        data: { lastVisit: new Date(), visitCount: { increment: 1 } },
      });
    } catch (visitErr) {
      console.error("visit log error (no bloquea login):", visitErr);
    }

    const res = NextResponse.json({
      code: client.code,
      name: client.name,
      contactName: client.contactName,
    });
    res.cookies.set("pb_client", client.code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
      sameSite: "lax",
    });
    return res;
  } catch (e) {
    console.error("client identify error:", e);
    return NextResponse.json({ error: "Error identificando cliente" }, { status: 500 });
  }
}
