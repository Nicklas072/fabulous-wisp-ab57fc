import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Notas del cliente para su asesor: el cliente escribe desde su panel
// «Mi lista» y el dueño las lee en el panel de administración.

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

// GET /api/client/notes → últimas notas enviadas por el cliente
// (para confirmarle que su mensaje quedó registrado)
export async function GET(req: NextRequest) {
  try {
    const client = await getClient(req);
    if (!client) return NextResponse.json({ notes: [] });

    const notes = await db.clientNote.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, message: true, createdAt: true },
    });

    return NextResponse.json({ notes });
  } catch (e) {
    console.error("client notes GET error:", e);
    return NextResponse.json({ notes: [] }, { status: 500 });
  }
}

// POST /api/client/notes { message } → dejar una nota para el asesor
export async function POST(req: NextRequest) {
  try {
    const client = await getClient(req);
    if (!client) {
      return NextResponse.json({ error: "Necesita código de cliente" }, { status: 401 });
    }
    const body = await req.json();
    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json({ error: "Escribí tu mensaje antes de enviarlo" }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "El mensaje es demasiado largo (máx. 2000 caracteres)" },
        { status: 400 }
      );
    }

    const note = await db.clientNote.create({
      data: { clientId: client.id, message },
    });

    // Actividad: registrar la nota enviada (extracto best-effort)
    try {
      await db.visit.create({
        data: {
          clientId: client.id,
          type: "note",
          detail: message.length > 90 ? `${message.slice(0, 90)}…` : message,
        },
      });
    } catch {
      /* la métrica nunca rompe el envío */
    }

    return NextResponse.json({
      ok: true,
      note: { id: note.id, message: note.message, createdAt: note.createdAt },
    });
  } catch (e) {
    console.error("client notes POST error:", e);
    return NextResponse.json({ error: "Error enviando la nota" }, { status: 500 });
  }
}
