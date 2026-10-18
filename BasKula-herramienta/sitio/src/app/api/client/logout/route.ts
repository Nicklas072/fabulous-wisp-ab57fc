import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST /api/client/logout → limpia la cookie de identificación pb_client
// (el SPA también borra el código de localStorage al cerrar sesión)
export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("pb_client");
  } catch {
    /* ignore */
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("pb_client");
  res.cookies.set("pb_client", "", {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 0, // expira inmediatamente
    expires: new Date(0),
    path: "/",
  });
  return res;
}
