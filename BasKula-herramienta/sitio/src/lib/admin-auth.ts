import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// ═══════════════════════════════════════════════════════════════
// Autenticación de administrador
// Soporta DOS mecanismos (el primero que valide gana):
//   1. Header x-admin-pin con el PIN correcto (almacenado en
//      sessionStorage por el panel) → funciona en cualquier
//      contexto, incluso si el navegador bloquea cookies
//      (iframes, preview embeds, third-party cookie blocking).
//   2. Cookie pb_admin=1 (legacy) → para navegadores normales.
// ═══════════════════════════════════════════════════════════════

async function getValidPin(): Promise<string> {
  try {
    const setting = await db.setting.findUnique({ where: { key: "adminPin" } });
    return setting?.value || "2026";
  } catch {
    return "2026";
  }
}

export async function isValidPin(pin: string): Promise<boolean> {
  const valid = await getValidPin();
  // Comparación tolerante: ignora mayúsculas/minúsculas y espacios
  // (el código de acceso puede ser alfanumérico, ej: BASKULA7431)
  return Boolean(pin) && pin.trim().toLowerCase() === valid.trim().toLowerCase();
}

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  try {
    // 1) Header x-admin-pin (robusto contra bloqueo de cookies)
    const headerPin = req.headers.get("x-admin-pin");
    if (headerPin && (await isValidPin(headerPin))) return true;

    // 2) Cookie pb_admin con el PIN validado
    const store = await cookies();
    const cookiePin = store.get("pb_admin")?.value;
    if (cookiePin && (await isValidPin(cookiePin))) return true;

    return false;
  } catch {
    return false;
  }
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "No autorizado" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
