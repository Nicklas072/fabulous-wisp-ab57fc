import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { invalidateCatalogCache } from "@/lib/catalog";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";
import type { Prisma } from "@prisma/client";

// GET /api/admin/products/[id] → obtener la ficha completa de un producto para edición
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    let images = [];
    let moodImages = [];
    try {
      images = product.images ? JSON.parse(product.images) : [];
      moodImages = product.moodImages ? JSON.parse(product.moodImages) : [];
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      product: {
        ...product,
        parsedImages: images,
        parsedMoodImages: moodImages,
      },
    });
  } catch (e) {
    console.error("admin product GET error:", e);
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 });
  }
}

// PATCH /api/admin/products/[id] → actualizar campos de la ficha de un producto
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdminRequest(req))) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const existing = await db.product.findUnique({
      where: { id },
      select: { id: true, slug: true, published: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const data: Prisma.ProductUpdateInput = {};

    if (body.nameEs !== undefined) {
      data.nameEs = String(body.nameEs).trim();
    }
    if (body.productTypeLabel !== undefined) {
      data.productTypeLabel = body.productTypeLabel ? String(body.productTypeLabel).trim() : null;
    }
    if (body.productType !== undefined) {
      data.productType = body.productType ? String(body.productType).trim() : null;
    }
    if (body.pieceGroup !== undefined) {
      data.pieceGroup = body.pieceGroup ? String(body.pieceGroup).trim() : null;
    }
    if (body.collection !== undefined) {
      data.collection = body.collection ? String(body.collection).trim() : null;
    }
    if (body.line !== undefined) {
      data.line = body.line ? String(body.line).trim() : null;
    }
    if (body.colorBase !== undefined) {
      data.colorBase = body.colorBase ? String(body.colorBase).trim() : null;
    }
    if (body.colorGroup !== undefined) {
      data.colorGroup = body.colorGroup ? String(body.colorGroup).trim() : null;
    }
    if (body.tone !== undefined) {
      data.tone = body.tone ? String(body.tone).trim() : null;
    }
    if (body.material !== undefined) {
      data.material = body.material ? String(body.material).trim() : null;
    }
    if (body.materialEs !== undefined) {
      data.materialEs = body.materialEs ? String(body.materialEs).trim() : null;
    }
    if (body.reference !== undefined) {
      data.reference = body.reference ? String(body.reference).trim() : null;
    }
    if (body.diameter !== undefined) {
      data.diameter =
        body.diameter === null || body.diameter === "" || isNaN(Number(body.diameter))
          ? null
          : Number(body.diameter);
    }
    if (body.height !== undefined) {
      data.height =
        body.height === null || body.height === "" || isNaN(Number(body.height))
          ? null
          : Number(body.height);
    }
    if (body.capacity !== undefined) {
      data.capacity =
        body.capacity === null || body.capacity === "" || isNaN(Number(body.capacity))
          ? null
          : Math.round(Number(body.capacity));
    }
    if (body.pieces !== undefined) {
      data.pieces =
        body.pieces === null || body.pieces === "" || isNaN(Number(body.pieces))
          ? null
          : Math.round(Number(body.pieces));
    }
    if (body.available !== undefined) {
      data.available = Boolean(body.available);
    }
    if (body.published !== undefined) {
      data.published = Boolean(body.published);
    }
    if (body.descriptionEs !== undefined) {
      data.descriptionEs = body.descriptionEs ? String(body.descriptionEs).trim() : null;
    }
    if (body.careEs !== undefined) {
      data.careEs = body.careEs ? String(body.careEs).trim() : null;
    }
    if (body.infoEs !== undefined) {
      data.infoEs = body.infoEs ? String(body.infoEs).trim() : null;
    }
    if (body.boxComposition !== undefined) {
      data.boxComposition = body.boxComposition ? String(body.boxComposition).trim() : null;
    }
    if (body.packWeight !== undefined) {
      data.packWeight = body.packWeight ? String(body.packWeight).trim() : null;
    }
    if (body.packDim !== undefined) {
      data.packDim = body.packDim ? String(body.packDim).trim() : null;
    }
    if (body.packType !== undefined) {
      data.packType = body.packType ? String(body.packType).trim() : null;
    }

    const updated = await db.product.update({
      where: { id },
      data,
    });

    invalidateCatalogCache();
    try {
      revalidatePath("/", "page");
      revalidatePath("/api/catalog");
      revalidatePath(`/api/products/${existing.slug}`);
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      ok: true,
      product: updated,
    });
  } catch (e) {
    console.error("admin product PATCH error:", e);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}
