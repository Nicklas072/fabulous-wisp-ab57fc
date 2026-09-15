"use client";

// ═══════════════════════════════════════════════════════════════
// Caché de fichas de producto (nivel módulo, sobrevive entre
// aperturas del modal) + prefetch en hover de las tarjetas.
//
// La ficha completa (galería, descripción, sugerencias) se pide a
// /api/products/[slug]; con esta caché la segunda apertura es
// instantánea y, si el usuario pasó el mouse por la tarjeta, la
// primera también.
// ═══════════════════════════════════════════════════════════════

import type { ProductDetail, CatalogProduct } from "@/lib/types";

export interface DetailResponse {
  product: ProductDetail;
  suggestions: CatalogProduct[];
}

const cache = new Map<string, DetailResponse>();
const inflight = new Map<string, Promise<DetailResponse | null>>();

export function getCachedDetail(slug: string): DetailResponse | undefined {
  return cache.get(slug);
}

export function clearDetailCache(slug?: string) {
  if (slug) {
    cache.delete(slug);
  } else {
    cache.clear();
  }
}

export function fetchDetail(slug: string): Promise<DetailResponse | null> {
  const cached = cache.get(slug);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(slug);
  if (pending) return pending;

  const p = fetch(`/api/products/${slug}`)
    .then((r) => r.json())
    .then((d: DetailResponse & { error?: string }) => {
      if (d.error || !d.product) return null;
      cache.set(slug, d);
      return d;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(slug);
    });

  inflight.set(slug, p);
  return p;
}

// Prefetch de baja prioridad (hover/touch en tarjetas del grid)
export function prefetchDetail(slug: string) {
  if (cache.has(slug) || inflight.has(slug)) return;
  const idle =
    typeof window !== "undefined" && "requestIdleCallback" in window
      ? (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 80);
  idle(() => {
    fetchDetail(slug);
  });
}
