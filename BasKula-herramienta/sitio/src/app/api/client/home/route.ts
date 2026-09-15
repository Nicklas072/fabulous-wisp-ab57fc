import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPersonalizedData } from "@/lib/catalog";

// GET /api/client/home → datos personalizados del cliente identificado
// Acepta el código por header x-client-code (robusto contra bloqueo de
// cookies en iframes/previews), query ?code= o cookie pb_client (legacy).
// NO registra visita (eso lo hace /c/[code]).
export async function GET(req: NextRequest) {
  try {
    let code = req.headers.get("x-client-code") || req.nextUrl.searchParams.get("code") || "";
    if (!code) {
      const store = await cookies();
      code = store.get("pb_client")?.value || "";
    }
    code = code.toUpperCase().trim();

    const data = await getPersonalizedData(code);
    return NextResponse.json(data);
  } catch (e) {
    console.error("client home error:", e);
    return NextResponse.json(
      { client: null, curated: [], suggestions: [], favoritesPreview: [] },
      { status: 500 }
    );
  }
}
