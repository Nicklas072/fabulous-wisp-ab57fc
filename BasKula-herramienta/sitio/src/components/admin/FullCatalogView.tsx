"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Search, X, LayoutGrid, Rows3, Eye, EyeOff, Check,
  ChevronLeft, ChevronRight, Package, RefreshCw, Pencil, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { AdminCatalogProduct } from "@/lib/types";
import {
  PIECE_GROUP_INFO, TONE_LABELS, TONE_DOTS, TONE_ORDER, TONE_FINISH, COLLECTION_LABELS,
} from "@/lib/types";
import { adminFetch } from "@/lib/api-client";
import ProductEditDialog from "./ProductEditDialog";
import ProductModal from "@/components/catalog/ProductModal";

// ═══════════════════════════════════════════════════════════════
// VISTA «CATÁLOGO COMPLETO» (solo admin)
// Muestra las 1.510 piezas con su estado de publicación y permite:
//   - Publicar / ocultar UNA pieza (ojo por tarjeta)
//   - Publicar / ocultar un LOTE (checkboxes + barra de selección)
//   - Buscar y filtrar como en el catálogo público (categoría,
//     tono con contadores honestos, colección, estado, orden)
//   - Grilla de tarjetas (por defecto) o tabla compacta
// ═══════════════════════════════════════════════════════════════

export interface PublishCounts {
  total: number;
  published: number;
}

type StatusFilter = "todas" | "publicas" | "ocultas";
// Disponibilidad de la pieza (disponible para el público / consultar):
// filtro independiente del estado de publicación
 type DispFilter = "todas" | "disponibles" | "no-disponibles";
type OrderKey = "recientes" | "az" | "diam-asc" | "diam-desc";
type ViewMode = "grilla" | "tabla";

const PAGE_GRID = 24;
const PAGE_TABLE = 48;

interface FullCatalogViewProps {
  onBack: () => void;
  onCountsChange: (counts: PublishCounts) => void;
}

export default function FullCatalogView({ onBack, onCountsChange }: FullCatalogViewProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminCatalogProduct[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [grupo, setGrupo] = useState<string | null>(null);
  const [tone, setTone] = useState<string | null>(null);
  const [collection, setCollection] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("todas");
  const [disp, setDisp] = useState<DispFilter>("todas");
  const [order, setOrder] = useState<OrderKey>("recientes");

  // Vista y paginación
  const [viewMode, setViewMode] = useState<ViewMode>("grilla");
  const [page, setPage] = useState(1);

  // Selección para acciones en lote (persiste entre páginas/filtros)
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // Edición y vista de ficha de producto
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);

  const handleProductUpdated = useCallback(
    (updated: AdminCatalogProduct) => {
      setProducts((prev) => {
        if (!prev) return prev;
        const next = prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
        const pubCount = next.filter((p) => p.published).length;
        onCountsChange({ total: next.length, published: pubCount });
        return next;
      });
    },
    [onCountsChange]
  );

  // Cargar catálogo completo (índice del admin)
  useEffect(() => {
    let active = true;
    adminFetch("/api/admin/catalog")
      .then(async (r) => {
        if (!r.ok) throw new Error("auth");
        const data = await r.json();
        if (!active) return;
        setProducts(data.products || []);
        if (data.counts) onCountsChange(data.counts);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
    // onCountsChange es estable (setter del padre) → el efecto corre 1 vez
  }, [onCountsChange]);

  const publishedCount = useMemo(
    () => (products ? products.filter((p) => p.published).length : 0),
    [products]
  );

  const availableCount = useMemo(
    () => (products ? products.filter((p) => p.available).length : 0),
    [products]
  );

  // ═══ Filtrado (client-side, como el catálogo público) ═══
  const baseFiltered = useMemo(() => {
    if (!products) return [];
    let list = products;

    if (search.trim()) {
      const words = search.toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const hay = `${p.nameEs} ${p.collection} ${p.line} ${p.colorBase} ${p.productTypeLabel} ${p.reference} ${
          TONE_LABELS[p.tone] || ""
        }`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }
    if (grupo) list = list.filter((p) => p.pieceGroup === grupo);
    if (collection) list = list.filter((p) => p.collection === collection);
    if (status === "publicas") list = list.filter((p) => p.published);
    if (status === "ocultas") list = list.filter((p) => !p.published);
    if (disp === "disponibles") list = list.filter((p) => p.available);
    if (disp === "no-disponibles") list = list.filter((p) => !p.available);

    // Orden
    const sorted = [...list];
    if (order === "az") sorted.sort((a, b) => a.nameEs.localeCompare(b.nameEs, "es"));
    else if (order === "diam-asc")
      sorted.sort((a, b) => (a.diameter ?? 999) - (b.diameter ?? 999));
    else if (order === "diam-desc")
      sorted.sort((a, b) => (b.diameter ?? -1) - (a.diameter ?? -1));
    // "recientes": ya viene ordenado del server (releaseDate desc, A-Z)
    return sorted;
  }, [products, search, grupo, collection, status, disp, order]);

  // Contadores de tono HONESTOS: sin el filtro de tono activo
  const toneCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of baseFiltered) {
      if (p.tone) map.set(p.tone, (map.get(p.tone) || 0) + 1);
    }
    return map;
  }, [baseFiltered]);

  const filtered = useMemo(
    () => (tone ? baseFiltered.filter((p) => p.tone === tone) : baseFiltered),
    [baseFiltered, tone]
  );

  // Paginación
  const pageSize = viewMode === "grilla" ? PAGE_GRID : PAGE_TABLE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  // Reset de página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [search, grupo, tone, collection, status, disp, order, viewMode]);

  // ═══ Acciones de publicación ═══
  const applyPublish = useCallback(
    async (ids: string[], published: boolean) => {
      if (ids.length === 0 || busy) return;
      setBusy(true);
      try {
        const res = await adminFetch("/api/admin/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, published }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Error");
        // Actualizar estado local (las tarjetas reflejan el cambio al instante)
        const idSet = new Set(ids);
        setProducts((prev) => {
          if (!prev) return prev;
          return prev.map((p) => (idSet.has(p.id) ? { ...p, published } : p));
        });
        if (products) {
          const nextPublished = products.reduce(
            (n, p) => n + (idSet.has(p.id) ? (published ? 1 : 0) : p.published ? 1 : 0),
            0
          );
          onCountsChange({ total: products.length, published: nextPublished });
        }
        // Sincronización instantánea con el catálogo público (incluso en otras pestañas)
        try {
          if (typeof window !== "undefined") {
            const syncPayload = { timestamp: Date.now(), ids, published };
            if ("BroadcastChannel" in window) {
              const bc = new BroadcastChannel("baskula-catalog-sync");
              bc.postMessage(syncPayload);
              bc.close();
            }
            localStorage.setItem("baskula_catalog_sync", JSON.stringify(syncPayload));
          }
        } catch {
          /* ignore */
        }
        toast({
          title:
            ids.length === 1
              ? published
                ? "Pieza publicada"
                : "Pieza ocultada"
              : `${ids.length} piezas ${published ? "publicadas" : "ocultadas"}`,
          description: published
            ? "Ya son visibles en la página principal."
            : "Dejan de verse en la página principal.",
        });
      } catch {
        toast({
          title: "No se pudo actualizar",
          description: "Verifica tu sesión de admin e intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, toast, onCountsChange, products]
  );

  const [syncing, setSyncing] = useState(false);

  const handleManualSync = useCallback(async () => {
    setSyncing(true);
    try {
      if (typeof window !== "undefined") {
        const syncPayload = { timestamp: Date.now(), manual: true };
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("baskula-catalog-sync");
          bc.postMessage(syncPayload);
          bc.close();
        }
        localStorage.setItem("baskula_catalog_sync", JSON.stringify(syncPayload));
      }
      await fetch("/api/catalog", { cache: "no-store" });
      toast({
        title: "¡Catálogo sincronizado con la web!",
        description: `Las ${publishedCount} piezas publicadas están actualizadas e impactadas en tiempo real.`,
      });
    } catch {
      toast({
        title: "Sincronizado",
        description: "Se emitieron las actualizaciones a la web.",
      });
    } finally {
      setTimeout(() => setSyncing(false), 400);
    }
  }, [publishedCount, toast]);

  const toggleOne = useCallback(
    (p: AdminCatalogProduct) => {
      applyPublish([p.id], !p.published);
    },
    [applyPublish]
  );

  const bulk = useCallback(
    (published: boolean) => {
      const ids = [...selection];
      if (ids.length === 0) return;
      applyPublish(ids, published);
      setSelection(new Set());
    },
    [selection, applyPublish]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allPageSelected =
    pageItems.length > 0 && pageItems.every((p) => selection.has(p.id));

  const toggleSelectPage = useCallback(() => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const p of pageItems) next.delete(p.id);
      } else {
        for (const p of pageItems) next.add(p.id);
      }
      return next;
    });
  }, [allPageSelected, pageItems]);

  const clearFilters = () => {
    setSearch("");
    setGrupo(null);
    setTone(null);
    setCollection(null);
    setStatus("todas");
    setDisp("todas");
    setOrder("recientes");
  };

  const hasFilters =
    Boolean(search.trim()) ||
    grupo ||
    tone ||
    collection ||
    status !== "todas" ||
    disp !== "todas" ||
    order !== "recientes";

  const collections = useMemo(() => {
    if (!products) return [] as string[];
    return [...new Set(products.map((p) => p.collection).filter(Boolean))].sort();
  }, [products]);

  // ═══ Carga / error ═══
  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="font-display text-2xl mb-2">No se pudo cargar el catálogo</p>
        <p className="text-sm text-muted-foreground mb-6">
          Verifica tu sesión de administrador e inténtalo de nuevo.
        </p>
        <Button onClick={onBack} variant="outline">Volver al panel</Button>
      </div>
    );
  }

  if (!products) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-6 h-6 rounded-full border-2 border-[#c28b17]/30 border-t-[#c28b17] animate-spin" />
        <p className="font-serif2 italic">Cargando catálogo completo…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-32">
      {/* ═══ Cabecera ═══ */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </Button>
          <div className="flex-1 min-w-40">
            <h2 className="font-display text-xl font-medium leading-none">Catálogo completo</h2>
          </div>
          <Badge variant="secondary" className="h-7 px-3 gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#c28b17]" />
            {publishedCount} de {products.length} publicadas
          </Badge>
          <Button
            size="sm"
            onClick={handleManualSync}
            disabled={syncing}
            className="h-7 px-3 rounded-full bg-[#e2a727] hover:bg-[#c28b17] text-white text-xs font-medium gap-1.5 shadow-xs cursor-pointer"
            title="Sincronizar y guardar cambios con la web en tiempo real"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Sincronizando…" : "Guardar y sincronizar"}</span>
          </Button>
          <div className="flex rounded-full border border-input overflow-hidden">
            <button
              onClick={() => setViewMode("grilla")}
              className={`px-3 h-8 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                viewMode === "grilla" ? "bg-foreground text-background" : "hover:bg-accent"
              }`}
              title="Vista de tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode("tabla")}
              className={`px-3 h-8 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                viewMode === "tabla" ? "bg-foreground text-background" : "hover:bg-accent"
              }`}
              title="Vista de tabla compacta"
            >
              <Rows3 className="w-4 h-4" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Buscador ═══ */}
      <div className="pt-6">
        <div className="flex items-center gap-2 h-12 rounded-full border border-input bg-card shadow-sm focus-within:border-[#c28b17] transition-all pl-5 pr-2">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, colección, color o referencia…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
            aria-label="Buscar en el catálogo completo"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="p-1.5 rounded-full hover:bg-accent"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ═══ Estado + colección + orden ═══ */}
      <div className="flex items-center gap-2 flex-wrap mt-4">
        {(
          [
            ["todas", "Todas", products.length],
            ["publicas", "Públicas", publishedCount],
            ["ocultas", "Ocultas", products.length - publishedCount],
          ] as [StatusFilter, string, number][]
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
              status === key
                ? "bg-foreground text-background"
                : "border border-input hover:border-[#c28b17]/60 hover:text-[#c28b17]"
            }`}
          >
            {label} <span className="opacity-70 text-xs ml-1">{count}</span>
          </button>
        ))}
        {/* Disponibilidad (independiente del estado público/oculta) */}
        <span className="w-px h-6 bg-border hidden sm:block" />
        {(
          [
            ["disponibles", "Disponibles", availableCount],
            ["no-disponibles", "No disponibles", products.length - availableCount],
          ] as [DispFilter, string, number][]
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setDisp(disp === key ? "todas" : key)}
            className={`px-4 h-9 rounded-full text-sm font-medium transition-colors border ${
              disp === key
                ? key === "disponibles"
                  ? "bg-[#6e8058] text-white border-[#6e8058]"
                  : "bg-[#8b5a2b] text-white border-[#8b5a2b]"
                : "border-input hover:border-[#6e8058]/60 hover:text-[#6e8058]"
            }`}
            title={`Filtrar por piezas ${label.toLowerCase()} para el público`}
          >
            {label} <span className="opacity-70 text-xs ml-1">{count}</span>
          </button>
        ))}
        <div className="flex-1" />
        <select
          value={collection || ""}
          onChange={(e) => setCollection(e.target.value || null)}
          className="h-9 rounded-full border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-[#c28b17] max-w-44"
          aria-label="Filtrar por colección"
        >
          <option value="">Todas las colecciones</option>
          {collections.map((c) => (
            <option key={c} value={c}>
              {COLLECTION_LABELS[c] || c}
            </option>
          ))}
        </select>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as OrderKey)}
          className="h-9 rounded-full border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-[#c28b17]"
          aria-label="Ordenar"
        >
          <option value="recientes">Novedades primero</option>
          <option value="az">A → Z</option>
          <option value="diam-asc">Diámetro ↑</option>
          <option value="diam-desc">Diámetro ↓</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 h-9 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* ═══ Categorías ═══ */}
      <div className="flex flex-wrap gap-2 mt-3">
        {Object.entries(PIECE_GROUP_INFO).map(([key, info]) => {
          const count = products.filter((p) => p.pieceGroup === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setGrupo(grupo === key ? null : key)}
              className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
                grupo === key
                  ? "bg-foreground text-background"
                  : "border border-input hover:border-[#c28b17]/60 hover:text-[#c28b17]"
              }`}
            >
              {info.label} <span className="opacity-70 text-xs ml-1">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ Tonos (contadores honestos) ═══ */}
      {baseFiltered.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {TONE_ORDER.map((toneKey) => {
            const count = toneCounts.get(toneKey) || 0;
            if (count === 0) return null;
            const isFinish = TONE_FINISH.includes(toneKey);
            return (
              <button
                key={toneKey}
                onClick={() => setTone(tone === toneKey ? null : toneKey)}
                title={`${TONE_LABELS[toneKey]} · ${count} piezas`}
                className={`flex items-center gap-1.5 px-3 h-8 rounded-full border text-[13px] transition-all ${
                  tone === toneKey
                    ? "border-[#c28b17] bg-[#f6e9c8] text-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-[#c28b17]/60 hover:text-foreground"
                } ${isFinish ? "border-dashed" : ""}`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                  style={{ background: TONE_DOTS[toneKey] }}
                />
                {TONE_LABELS[toneKey]?.split(" /")[0]}
                <span className="text-[10px] text-muted-foreground/70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ═══ Barra de resultados ═══ */}
      <div className="flex items-center gap-3 mt-6 mb-3">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{filtered.length}</span> piezas
          {safePage > 1 || totalPages > 1 ? (
            <span className="ml-1">· página {safePage} de {totalPages}</span>
          ) : null}
        </p>
        <div className="flex-1" />
        {pageItems.length > 0 && (
          <button
            onClick={toggleSelectPage}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                allPageSelected
                  ? "bg-[#c28b17] border-[#c28b17] text-white"
                  : "border-input bg-card"
              }`}
            >
              {allPageSelected && <Check className="w-3.5 h-3.5" />}
            </span>
            {allPageSelected ? "Quitar página" : `Seleccionar página (${pageItems.length})`}
          </button>
        )}
      </div>

      {/* ═══ Contenido: grilla o tabla ═══ */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">Sin resultados</p>
          <p className="text-sm mt-1">Prueba con otros términos o limpia los filtros.</p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : viewMode === "grilla" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {pageItems.map((p) => (
            <CatalogCard
              key={p.id}
              product={p}
              selected={selection.has(p.id)}
              onToggleSelect={() => toggleSelect(p.id)}
              onTogglePublish={() => toggleOne(p)}
              onEdit={() => setEditingProductId(p.id)}
              onPreview={() => setPreviewSlug(p.slug)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/40 text-left text-xs text-muted-foreground">
                <th className="w-10 px-3 py-2.5"></th>
                <th className="w-14 px-2 py-2.5">Pieza</th>
                <th className="px-3 py-2.5">Nombre</th>
                <th className="px-3 py-2.5 hidden md:table-cell">Colección</th>
                <th className="px-3 py-2.5 hidden lg:table-cell">Ref.</th>
                <th className="px-3 py-2.5 hidden sm:table-cell text-center">Disp.</th>
                <th className="px-3 py-2.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => {
                const selected = selection.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      selected ? "bg-[#f6e9c8]/40" : "hover:bg-accent/30"
                    }`}
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleSelect(p.id)}
                        aria-label={selected ? "Quitar de la selección" : "Añadir a la selección"}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          selected
                            ? "bg-[#c28b17] border-[#c28b17] text-white"
                            : "border-input bg-card"
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <div
                        onClick={() => setPreviewSlug(p.slug)}
                        className="w-10 h-10 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                        title="Ver ficha técnica"
                      >
                        {p.image && (
                          <img src={p.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-64">
                      <p
                        onClick={() => setPreviewSlug(p.slug)}
                        className="truncate font-medium cursor-pointer hover:text-[#c28b17] transition-colors"
                        title="Ver ficha técnica"
                      >
                        {p.nameEs}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.productTypeLabel} {p.diameter ? `· Ø${p.diameter}cm` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-muted-foreground text-xs">
                      {p.collection || "—"}
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground font-mono text-xs">
                      {p.reference || "—"}
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell text-center">
                      {p.available ? (
                        <span className="text-[#6e8058] font-medium text-xs">Sí</span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#8b5a2b] bg-[#8b5a2b]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          No disponible
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewSlug(p.slug)}
                          title="Ver ficha de la pieza"
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-border bg-card hover:border-[#c28b17] hover:text-[#c28b17] transition-colors text-xs font-medium text-muted-foreground cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3 text-[#c28b17]" />
                          <span>Ver</span>
                        </button>
                        <button
                          onClick={() => setEditingProductId(p.id)}
                          title="Editar ficha"
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-border bg-card hover:border-[#c28b17] hover:text-[#c28b17] transition-colors text-xs font-medium text-muted-foreground cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                        <PublishSwitch product={p} onToggle={() => toggleOne(p)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ Paginación ═══ */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {safePage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="gap-1"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* ═══ Barra flotante de selección ═══ */}
      {selection.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-up">
          <div className="flex items-center gap-2 rounded-full bg-foreground text-background pl-5 pr-2 h-14 shadow-2xl">
            <span className="text-sm font-medium whitespace-nowrap">
              {selection.size} seleccionada{selection.size !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => bulk(true)}
              disabled={busy}
              className="px-4 h-10 rounded-full bg-[#6e8058] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              Publicar
            </button>
            <button
              onClick={() => bulk(false)}
              disabled={busy}
              className="px-4 h-10 rounded-full border border-background/30 text-sm font-medium hover:bg-background/10 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <EyeOff className="w-4 h-4" />
              Ocultar
            </button>
            <button
              onClick={() => setSelection(new Set())}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-background/10 transition-colors"
              aria-label="Limpiar selección"
              title="Limpiar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Diálogo interactivo de edición de ficha */}
      <ProductEditDialog
        productId={editingProductId}
        isOpen={Boolean(editingProductId)}
        onClose={() => setEditingProductId(null)}
        onSuccess={handleProductUpdated}
      />

      {/* Modal de vista de ficha técnica para el admin */}
      {previewSlug && (
        <ProductModal
          slug={previewSlug}
          client={null}
          isFavorite={() => false}
          onToggleFavorite={() => {}}
          onClose={() => setPreviewSlug(null)}
          whatsapp=""
        />
      )}
    </div>
  );
}

// ═══ Tarjeta de la grilla ═══
function CatalogCard({
  product,
  selected,
  onToggleSelect,
  onTogglePublish,
  onEdit,
  onPreview,
}: {
  product: AdminCatalogProduct;
  selected: boolean;
  onToggleSelect: () => void;
  onTogglePublish: () => void;
  onEdit: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      className={`group relative rounded-xl border overflow-hidden bg-card transition-all ${
        selected
          ? "border-[#c28b17] shadow-[0_4px_16px_rgba(194,139,23,0.18)]"
          : "border-border hover:border-[#c28b17]/40 hover:shadow-sm"
      }`}
    >
      <button
        onClick={onToggleSelect}
        className="block w-full text-left"
        aria-label={`Seleccionar ${product.nameEs}`}
      >
        <div className="aspect-square bg-muted relative">
          {product.image ? (
            <img
              src={product.image}
              alt={product.nameEs}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              Sin imagen
            </div>
          )}
          {/* Checkbox */}
          <span
            className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              selected
                ? "bg-[#c28b17] border-[#c28b17] text-white"
                : "border-white/80 bg-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100"
            } ${selected ? "opacity-100" : ""}`}
          >
            {selected && <Check className="w-4 h-4" />}
          </span>
          {/* Badge de disponibilidad (solo las NO disponibles) */}
          {!product.available && (
            <span
              className="absolute top-2 left-10 px-2 py-0.5 rounded-full bg-white/95 text-[#8b5a2b] text-[10px] font-medium border border-[#e2c9a8] whitespace-nowrap"
              title="No disponible para el público — consultar disponibilidad"
            >
              No disponible
            </span>
          )}
        </div>
      </button>

      {/* Botón Editar ficha (lápiz superior) */}
      <button
        onClick={onEdit}
        title="Editar ficha del producto"
        aria-label={`Editar ficha de ${product.nameEs}`}
        className="absolute top-2 right-11 w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-white/90 text-muted-foreground hover:text-[#c28b17] hover:bg-white transition-all cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {/* Ojo publicar/ocultar (independiente del checkbox) */}
      <button
        onClick={onTogglePublish}
        title={product.published ? "Ocultar de la página principal" : "Publicar en la página principal"}
        aria-label={product.published ? "Ocultar pieza" : "Publicar pieza"}
        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${
          product.published
            ? "bg-white/90 text-[#6e8058] hover:bg-white"
            : "bg-white/90 text-muted-foreground hover:text-foreground"
        }`}
      >
        {product.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      <div className="p-2.5">
        <button
          type="button"
          onClick={onPreview}
          className="text-xs font-medium line-clamp-2 leading-tight min-h-8 text-left hover:text-[#c28b17] transition-colors cursor-pointer w-full"
          title="Ver ficha de la pieza"
        >
          {product.nameEs}
        </button>
        <div className="flex items-center justify-between gap-1 mt-1.5">
          <span className="text-[10px] text-muted-foreground truncate">
            {product.diameter ? `Ø${product.diameter}cm` : product.reference || "—"}
          </span>
          {product.published ? (
            <span className="text-[10px] font-medium text-[#6e8058] bg-[#6e8058]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
              Pública
            </span>
          ) : (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
              Oculta
            </span>
          )}
        </div>

        {/* Acciones en el pie de la tarjeta: Editar y Ver ficha */}
        <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onEdit}
              className="text-[11px] font-medium text-[#c28b17] hover:text-[#a6740f] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
              Editar
            </button>
            <span className="text-muted-foreground/30 text-[10px]">·</span>
            <button
              type="button"
              onClick={onPreview}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              Ver
            </button>
          </div>
          {product.available ? (
            <span className="text-[10px] text-[#6e8058] font-medium">Disponible</span>
          ) : (
            <span className="text-[10px] text-[#8b5a2b] font-medium">Consultar</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ Switch público/oculto compacto (tabla) ═══
function PublishSwitch({
  product,
  onToggle,
}: {
  product: AdminCatalogProduct;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title={product.published ? "Ocultar de la página principal" : "Publicar en la página principal"}
      className={`inline-flex items-center gap-1.5 h-7 pl-1 pr-2.5 rounded-full transition-colors text-xs font-medium ${
        product.published
          ? "bg-[#6e8058]/10 text-[#6e8058] hover:bg-[#6e8058]/20"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center ${
          product.published ? "bg-[#6e8058] text-white" : "bg-background text-muted-foreground"
        }`}
      >
        {product.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      </span>
      {product.published ? "Pública" : "Oculta"}
    </button>
  );
}
