import { NextResponse } from "next/server";

// POST /api/client/logout → limpia la cookie de identificación pb_client
// (el SPA también borra el código de localStorage al cerrar sesión)
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("pb_client", "", {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 0, // expira inmediatamente
    path: "/",
  });
  return res;
}
