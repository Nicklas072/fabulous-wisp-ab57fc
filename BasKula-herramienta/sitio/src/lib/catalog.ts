import { cookies } from "next/headers";
import type { Product } from "@prisma/client";
import { db } from "@/lib/db";

// ============ Identificación de cliente por cookie ============

export async function getClientFromCookie() {
  try {
    const cookieStore = await cookies();
    const code = cookieStore.get("pb_client")?.value;
    if (!code) return null;
    const client = await db.client.findUnique({
      where: { code },
      include: {
        _count: { select: { favorites: true, curated: true } },
      },
    });
    if (!client || !client.active) return null;
    return {
      code: client.code,
      name: client.name,
      contactName: client.contactName,
      hasCurated: client._count.curated > 0,
      curatedCount: client._count.curated,
      favoritesCount: client._count.favorites,
      lastVisit: client.lastVisit,
      visitCount: client.visitCount,
    };
  } catch {
    return null;
  }
}

// ============ Caché en Memoria (RAM) de Alto Rendimiento ============
interface SettingsCache {
  whatsapp: string;
  whatsappMessage: string;
  catalogTitle: string;
  adminPin: string;
}

let cachedSettings: { data: SettingsCache; exp: number } | null = null;
let cachedCatalogIndex: { data: CatalogProduct[]; exp: number } | null = null;
let cachedFullCatalogIndex: { data: AdminCatalogProduct[]; exp: number } | null = null;

const CACHE_TTL = 1000 * 60 * 5; // 5 minutos de respuesta instantánea (0.1ms)

export function invalidateCatalogCache() {
  cachedCatalogIndex = null;
  cachedFullCatalogIndex = null;
}

export function invalidateSettingsCache() {
  cachedSettings = null;
}

// ============ Configuración (WhatsApp, etc.) ============

export async function getSettings(): Promise<SettingsCache> {
  const now = Date.now();
  if (cachedSettings && cachedSettings.exp > now) {
    return cachedSettings.data;
  }

  try {
    const rows = await db.setting.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    const data: SettingsCache = {
      whatsapp: map.whatsapp || "",
      whatsappMessage: map.whatsappMessage || "",
      catalogTitle: map.catalogTitle || "Catálogo Gastronómico",
      adminPin: map.adminPin || "2026",
    };
    cachedSettings = { data, exp: now + CACHE_TTL };
    return data;
  } catch {
    return {
      whatsapp: "",
      whatsappMessage: "",
      catalogTitle: "Catálogo Gastronómico",
      adminPin: "2026",
    };
  }
}

// ============ Índice de catálogo (compacto, para el cliente) ============

import type { CatalogProduct, AdminCatalogProduct } from "@/lib/types";

// Índice PÚBLICO con caché en memoria: solo piezas publicadas por el admin
export async function getCatalogIndex(): Promise<CatalogProduct[]> {
  const now = Date.now();
  if (cachedCatalogIndex && cachedCatalogIndex.exp > now) {
    return cachedCatalogIndex.data;
  }

  const products = await db.product.findMany({
    where: { published: true },
    select: {
      id: true,
      slug: true,
      nameEs: true,
      collection: true,
      line: true,
      material: true,
      colorGroup: true,
      colorBase: true,
      tone: true,
      pieceGroup: true,
      productType: true,
      productTypeLabel: true,
      diameter: true,
      capacity: true,
      pieces: true,
      available: true,
      images: true,
      reference: true,
      releaseDate: true,
    },
    orderBy: [{ releaseDate: "desc" }, { nameEs: "asc" }],
  });

  const index: CatalogProduct[] = products.map((p) => {
    let image = "";
    try {
      const imgs = p.images ? JSON.parse(p.images) : [];
      image = imgs[0]?.url || "";
    } catch {
      image = "";
    }
    return {
      id: p.id,
      slug: p.slug,
      nameEs: p.nameEs,
      collection: p.collection || "",
      line: p.line || "",
      material: p.material || "",
      colorGroup: p.colorGroup || "",
      colorBase: p.colorBase || "",
      tone: p.tone || p.colorGroup || "",
      pieceGroup: p.pieceGroup || "",
      productType: p.productType || "",
      productTypeLabel: p.productTypeLabel || "",
      diameter: p.diameter,
      capacity: p.capacity,
      pieces: p.pieces,
      available: p.available,
      image,
      reference: p.reference || "",
    };
  });

  cachedCatalogIndex = { data: index, exp: now + CACHE_TTL };
  return index;
}

// ═══════════════════════════════════════════════════════════
// Índice COMPLETO (solo admin): las 1.510 piezas con su estado
// de publicación. Sirve a la vista «Catálogo completo» del panel.
// ═══════════════════════════════════════════════════════════
export async function getFullCatalogIndex(): Promise<AdminCatalogProduct[]> {
  const now = Date.now();
  if (cachedFullCatalogIndex && cachedFullCatalogIndex.exp > now) {
    return cachedFullCatalogIndex.data;
  }

  const products = await db.product.findMany({
    select: {
      id: true,
      slug: true,
      nameEs: true,
      collection: true,
      line: true,
      material: true,
      colorGroup: true,
      colorBase: true,
      tone: true,
      pieceGroup: true,
      productType: true,
      productTypeLabel: true,
      diameter: true,
      capacity: true,
      pieces: true,
      available: true,
      published: true,
      images: true,
      reference: true,
      releaseDate: true,
    },
    orderBy: [{ releaseDate: "desc" }, { nameEs: "asc" }],
  });

  const result = products.map((p) => {
    let image = "";
    try {
      const imgs = p.images ? JSON.parse(p.images) : [];
      image = imgs[0]?.url || "";
    } catch {
      image = "";
    }
    return {
      id: p.id,
      slug: p.slug,
      nameEs: p.nameEs,
      collection: p.collection || "",
      line: p.line || "",
      material: p.material || "",
      colorGroup: p.colorGroup || "",
      colorBase: p.colorBase || "",
      tone: p.tone || p.colorGroup || "",
      pieceGroup: p.pieceGroup || "",
      productType: p.productType || "",
      productTypeLabel: p.productTypeLabel || "",
      diameter: p.diameter,
      capacity: p.capacity,
      pieces: p.pieces,
      available: p.available,
      published: p.published,
      image,
      reference: p.reference || "",
    };
  });

  cachedFullCatalogIndex = { data: result, exp: now + CACHE_TTL };
  return result;
}

// ============ Datos personalizados del cliente ============
// Usado por page.tsx (server, cookie o searchParam) y por
// /api/client/home (header x-client-code o query ?code=)

export interface PersonalizedData {
  client: { code: string; name: string } | null;
  curated: CatalogProduct[];
  suggestions: CatalogProduct[];
  favoritesPreview: CatalogProduct[];
}

export async function getPersonalizedData(code: string): Promise<PersonalizedData> {
  const empty: PersonalizedData = {
    client: null,
    curated: [],
    suggestions: [],
    favoritesPreview: [],
  };
  const codeNorm = (code || "").trim().toUpperCase();
  if (!codeNorm) return empty;

  const client = await db.client
    .findUnique({ where: { code: codeNorm } })
    .catch((e: unknown) => {
      console.error("getPersonalizedData: client lookup error:", e);
      return null;
    });
  if (!client || !client.active) return empty;

  // Las piezas recomendadas por el asesor y los favoritos del cliente
  // se muestran siempre para él, aunque no estén en el catálogo público.
  let curatedItems: { product: Product }[] = [];
  let favItems: { product: Product }[] = [];
  try {
    [curatedItems, favItems] = await Promise.all([
      db.curatedItem.findMany({
        where: { client: { code: client.code } },
        orderBy: { sort: "asc" },
        include: { product: true },
        take: 48,
      }),
      db.favorite.findMany({
        where: { client: { code: client.code } },
        orderBy: { createdAt: "desc" },
        include: { product: true },
        take: 60,
      }),
    ]);
  } catch (e) {
    console.error("getPersonalizedData: data queries error (degradado):", e);
  }

  const toCompact = (p: Product): CatalogProduct => {
    let image = "";
    try {
      image = p.images ? JSON.parse(p.images)[0]?.url || "" : "";
    } catch {
      /* ignore */
    }
    return {
      id: p.id,
      slug: p.slug,
      nameEs: p.nameEs,
      collection: p.collection || "",
      line: p.line || "",
      material: p.material || "",
      colorGroup: p.colorGroup || "",
      colorBase: p.colorBase || "",
      tone: p.tone || p.colorGroup || "",
      pieceGroup: p.pieceGroup || "",
      productType: p.productType || "",
      productTypeLabel: p.productTypeLabel || "",
      diameter: p.diameter,
      capacity: p.capacity,
      pieces: p.pieces,
      available: p.available,
      image,
      reference: p.reference || "",
    };
  };

  const curated = curatedItems.map((c) => toCompact(c.product));
  // Todos los corazones del cliente (hasta 60) alimentan las sugerencias
  // («en base a sus gustos»); la vista previa de la home muestra los 8 más
  // recientes para no alargar la página.
  const allFavorites = favItems.map((f) => toCompact(f.product));
  const favoritesPreview = allFavorites.slice(0, 8);

  // Sugerencias automáticas EN BASE A LOS GUSTOS del cliente: todos sus
  // corazones (más recientes primero). Si aún no marcó ninguno, reflejan
  // las piezas que su asesor le preparó (best-effort: si el índice falla,
  // se entregan sin sugerencias — no rompe el login). Se muestran solo 5
  // («5 recomendaciones que se ajusten a lo que le guste").
  let suggestions: CatalogProduct[] = [];
  if (allFavorites.length > 0 || curated.length > 0) {
    try {
      const index = await getCatalogIndex();
      const base = allFavorites.length > 0 ? allFavorites : curated.slice(0, 6);
      const baseIds = new Set([...allFavorites, ...curated].map((p) => p.id));
      const counts = new Map<string, number>();
      for (const b of base) {
        for (const p of index) {
          if (baseIds.has(p.id)) continue;
          let score = 0;
          if (p.collection && p.collection === b.collection) score += 3;
          if (p.colorGroup && p.colorGroup === b.colorGroup) score += 2;
          if (p.productType && p.productType === b.productType) score += 2;
          if (p.diameter && b.diameter && Math.abs(p.diameter - b.diameter) <= 2) score += 1;
          if (score >= 3) {
            counts.set(p.id, (counts.get(p.id) || 0) + score);
          }
        }
      }
      suggestions = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => index.find((p) => p.id === id)!)
        .filter(Boolean);
    } catch (e) {
      console.error("getPersonalizedData: suggestions error (degradado):", e);
    }
  }

  return { client: { code: client.code, name: client.name }, curated, suggestions, favoritesPreview };
}

// ============ Sugerencias automáticas ============
// Motor de similitud: misma colección, color, diámetro y tipo

export function scoreSimilar(a: CatalogProduct, b: CatalogProduct): number {
  let score = 0;
  if (a.collection && a.collection === b.collection) score += 3;
  if (a.colorGroup && a.colorGroup === b.colorGroup) score += 2;
  if (a.productType && a.productType === b.productType) score += 2;
  if (a.diameter && b.diameter) {
    const diff = Math.abs(a.diameter - b.diameter);
    if (diff === 0) score += 2;
    else if (diff <= 2) score += 1;
  }
  if (a.line && a.line === b.line) score += 1;
  if (a.pieceGroup && a.pieceGroup === b.pieceGroup) score += 0.5;
  return score;
}

export function getSuggestionsFor(
  product: CatalogProduct,
  all: CatalogProduct[],
  limit = 8
): CatalogProduct[] {
  const scored = all
    .filter((p) => p.id !== product.id)
    .map((p) => ({ p, score: scoreSimilar(product, p) }))
    .sort((x, y) => y.score - x.score);
  // Tomar top N con variedad: máximo 2 por misma colección+color para diversidad
  const seen = new Map<string, number>();
  const result: CatalogProduct[] = [];
  for (const { p, score } of scored) {
    if (score < 2) break;
    const key = `${p.collection}-${p.colorGroup}`;
    const count = seen.get(key) || 0;
    if (count >= 2) continue;
    seen.set(key, count + 1);
    result.push(p);
    if (result.length >= limit) break;
  }
  // Si faltan, completar con top score aunque repitan
  if (result.length < limit) {
    for (const { p } of scored) {
      if (result.length >= limit) break;
      if (!result.find((r) => r.id === p.id)) result.push(p);
    }
  }
  return result;
}
