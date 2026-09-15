import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

// GET /api/admin/settings → configuración actual
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const rows = await db.setting.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return NextResponse.json({
      whatsapp: map.whatsapp || "",
      whatsappMessage: map.whatsappMessage || "",
      adminPin: map.adminPin || "2026",
    });
  } catch (e) {
    return NextResponse.json({ error: "Error cargando configuración" }, { status: 500 });
  }
}

// POST /api/admin/settings { whatsapp?, whatsappMessage?, adminPin? }
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const body = await req.json();

    const updates: { key: string; value: string }[] = [];
    if (body.whatsapp !== undefined) {
      const wa = String(body.whatsapp).replace(/[^\d+]/g, "");
      updates.push({ key: "whatsapp", value: wa });
    }
    if (body.whatsappMessage !== undefined) {
      updates.push({ key: "whatsappMessage", value: String(body.whatsappMessage).slice(0, 300) });
    }
    if (body.adminPin !== undefined) {
      const pin = String(body.adminPin).trim();
      // Código de acceso propio: alfanumérico, 4-16 caracteres
      if (!/^[a-zA-Z0-9]{4,16}$/.test(pin)) {
        return NextResponse.json(
          { error: "El código debe tener 4-16 caracteres (letras y números, sin espacios)" },
          { status: 400 }
        );
      }
      updates.push({ key: "adminPin", value: pin });
    }

    for (const u of updates) {
      await db.setting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin settings error:", e);
    return NextResponse.json({ error: "Error guardando configuración" }, { status: 500 });
  }
}
