import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /c/[code] → identifica al cliente, setea cookie y redirige al catálogo
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const codeUpper = code.toUpperCase();

  let valid = false;
  try {
    const client = await db.client.findUnique({ where: { code: codeUpper } });
    if (client && client.active) {
      valid = true;
      // Registrar visita
      await db.visit.create({
        data: { clientId: client.id, path: `/c/${codeUpper}` },
      });
      await db.client.update({
        where: { id: client.id },
        data: { lastVisit: new Date(), visitCount: { increment: 1 } },
      });
    }
  } catch (e) {
    console.error("identify error:", e);
  }

  if (valid) {
    // La cookie sigue siendo la vía principal; el parámetro client= en la
    // URL es el fallback para navegadores que bloquean cookies (iframes,
    // previews embebidos): el SPA lo persiste en localStorage y lo envía
    // como header x-client-code en cada petición.
    const res = NextResponse.redirect(new URL("/?welcome=1&client=" + codeUpper, _req.url));
    res.cookies.set("pb_client", codeUpper, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 año
      path: "/",
    });
    return res;
  }

  // Código inválido → catálogo con aviso
  return NextResponse.redirect(new URL("/?invalid=1", _req.url));
}
