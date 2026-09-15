import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

// GET /api/admin/clients → lista de clientes con métricas
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const clients = await db.client.findMany({
      include: {
        _count: { select: { favorites: true, curated: true, sharedLists: true, visits: true, clientNotes: true } },
        favorites: {
          take: 100,
          orderBy: { createdAt: "desc" },
          include: {
            product: {
              select: { id: true, nameEs: true, slug: true, collection: true, images: true, published: true },
            },
          },
        },
        curated: {
          orderBy: { sort: "asc" },
          include: {
            product: {
              select: { id: true, nameEs: true, slug: true, collection: true, images: true, published: true, available: true },
            },
          },
        },
        clientNotes: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, message: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      clients: clients.map((c) => {
        const lastSeenTime = c.adminLastSeen
          ? new Date(c.adminLastSeen).getTime()
          : new Date(c.createdAt).getTime();
        const newNotesCount = c.clientNotes.filter(
          (n) => new Date(n.createdAt).getTime() > lastSeenTime
        ).length;
        const newFavoritesCount = c.favorites.filter(
          (f) => new Date(f.createdAt).getTime() > lastSeenTime
        ).length;
        const hasNewNote = newNotesCount > 0;
        const hasNewFavorite = newFavoritesCount > 0;

        return {
          id: c.id,
          code: c.code,
          name: c.name,
          contactName: c.contactName,
          phone: c.phone,
          notes: c.notes,
          active: c.active,
          visitCount: c.visitCount,
          lastVisit: c.lastVisit,
          adminLastSeen: c.adminLastSeen,
          hasNewNote,
          hasNewFavorite,
          newNotesCount,
          newFavoritesCount,
          createdAt: c.createdAt,
          favoritesCount: c._count.favorites,
          curatedCount: c._count.curated,
          sharedListsCount: c._count.sharedLists,
          visitsCount: c._count.visits,
          notesCount: c._count.clientNotes,
          clientNotes: c.clientNotes.map((n) => ({
            id: n.id,
            message: n.message,
            createdAt: n.createdAt,
          })),
        favorites: c.favorites.map((f) => {
          let image = "";
          try {
            image = f.product.images ? JSON.parse(f.product.images)[0]?.url || "" : "";
          } catch {
            /* ignore */
          }
          return {
            productId: f.productId,
            nameEs: f.product.nameEs,
            slug: f.product.slug,
            collection: f.product.collection,
            quantity: f.quantity,
            addedAt: f.createdAt,
            image,
            published: f.product.published,
          };
        }),
        curated: c.curated.map((cu) => {
          let image = "";
          try {
            image = cu.product.images ? JSON.parse(cu.product.images)[0]?.url || "" : "";
          } catch {
            /* ignore */
          }
          return {
            productId: cu.productId,
            nameEs: cu.product.nameEs,
            slug: cu.product.slug,
            collection: cu.product.collection,
            sort: cu.sort,
            image,
            published: cu.product.published,
            available: cu.product.available,
          };
        }),
      };
    }),
    });
  } catch (e) {
    console.error("admin clients GET error:", e);
    return NextResponse.json({ error: "Error cargando clientes" }, { status: 500 });
  }
}

// Normaliza un código de cliente a su forma canónica (server-side):
// mayúsculas, sin espacios, sin tildes, solo [A-Z0-9-].
function normalizeCode(raw: string): string {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

// POST /api/admin/clients → crear cliente
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const body = await req.json();
    const name = String(body.name || "").trim();
    let code = normalizeCode(body.code);

    if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    if (!code) {
      // Generar código automático
      code = name
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]+/g, "")
        .slice(0, 8);
    }
    // Validar formato del código
    if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
      return NextResponse.json(
        { error: "Código inválido: 3-20 caracteres, letras, números y guiones" },
        { status: 400 }
      );
    }

    const existing = await db.client.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: `El código ${code} ya existe` }, { status: 400 });
    }

    const client = await db.client.create({
      data: {
        code,
        name,
        contactName: body.contactName ? String(body.contactName).trim() : null,
        phone: body.phone ? String(body.phone).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
      },
    });

    return NextResponse.json({
      ok: true,
      client: { id: client.id, code: client.code, name: client.name },
      link: `/c/${client.code}`,
    });
  } catch (e) {
    console.error("admin clients POST error:", e);
    return NextResponse.json({ error: "Error creando cliente" }, { status: 500 });
  }
}

// PATCH /api/admin/clients → actualizar cliente (nombre, código,
// contacto, teléfono, notas, activo). El cambio de código valida
// unicidad y avisa implícitamente: el enlace /c/CODIGO anterior deja
// de funcionar y el nuevo pasa a ser la clave del cliente.
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const current = await db.client.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Cambio de código: normalizar, validar y comprobar unicidad
    if (body.code !== undefined) {
      const newCode = normalizeCode(body.code);
      if (!/^[A-Z0-9-]{3,20}$/.test(newCode)) {
        return NextResponse.json(
          { error: "Código inválido: 3-20 caracteres, letras, números y guiones" },
          { status: 400 }
        );
      }
      if (newCode !== current.code) {
        const existing = await db.client.findUnique({ where: { code: newCode } });
        if (existing && existing.id !== id) {
          return NextResponse.json(
            { error: `El código ${newCode} ya lo usa otro cliente (${existing.name})` },
            { status: 400 }
          );
        }
      }
    }

    const data: Record<string, unknown> = {};
    if (body.code !== undefined) data.code = normalizeCode(body.code);
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "El nombre no puede quedar vacío" }, { status: 400 });
      data.name = name;
    }
    if (body.contactName !== undefined) data.contactName = body.contactName ? String(body.contactName).trim() : null;
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
    if (body.active !== undefined) data.active = Boolean(body.active);
    if (body.markSeen) data.adminLastSeen = new Date();

    const client = await db.client.update({ where: { id }, data });
    return NextResponse.json({
      ok: true,
      code: client.code,
      name: client.name,
      codeChanged: client.code !== current.code,
      link: `/c/${client.code}`,
    });
  } catch (e) {
    console.error("admin clients PATCH error:", e);
    return NextResponse.json({ error: "Error actualizando cliente" }, { status: 500 });
  }
}

// DELETE /api/admin/clients?id=X → eliminar cliente
export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    await db.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin clients DELETE error:", e);
    return NextResponse.json({ error: "Error eliminando cliente" }, { status: 500 });
  }
}
