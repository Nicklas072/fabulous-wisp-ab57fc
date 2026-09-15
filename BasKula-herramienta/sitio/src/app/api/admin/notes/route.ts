import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

// DELETE /api/admin/notes?id=X → eliminar una nota del cliente
// (el dueño la lee y la borra cuando ya la atendió)
export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    await db.clientNote.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin notes DELETE error:", e);
    return NextResponse.json({ error: "Error eliminando la nota" }, { status: 500 });
  }
}
