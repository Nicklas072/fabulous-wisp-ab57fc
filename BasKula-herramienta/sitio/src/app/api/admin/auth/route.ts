import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { isValidPin } from "@/lib/admin-auth";

// POST /api/admin/auth { pin } → valida PIN y establece cookie de sesión
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pin = String(body.pin || "").trim();

    if (!(await isValidPin(pin))) {
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
  try {
    const cookieStore = await cookies();
    cookieStore.delete("pb_admin");
  } catch {
    /* ignore */
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("pb_admin");
  res.cookies.set("pb_admin", "", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });
  return res;
}
