import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

// POST /api/admin/auth { pin } → valida PIN y establece cookie de sesión
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pin = String(body.pin || "").trim();

    const setting = await db.setting.findUnique({ where: { key: "adminPin" } });
    const validPin = setting?.value || "2026";

    // Comparación tolerante (ignora mayúsculas/minúsculas): el código
    // de acceso propio puede ser alfanumérico, ej: BASKULA7431
    if (pin.toLowerCase() !== validPin.trim().toLowerCase()) {
      return NextResponse.json({ error: "Código incorrecto" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("pb_admin", pin, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("admin auth error:", e);
    return NextResponse.json({ error: "Error de autenticación" }, { status: 500 });
  }
}

// DELETE /api/admin/auth → cerrar sesión
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("pb_admin", "", { maxAge: 0, path: "/" });
  return res;
}
