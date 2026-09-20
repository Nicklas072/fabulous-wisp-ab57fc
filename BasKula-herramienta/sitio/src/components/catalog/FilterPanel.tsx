"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, ChevronDown, Search, RotateCcw, SlidersHorizontal, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { CatalogProduct, CatalogFilters } from "@/lib/types";
import {
  TONE_LABELS,
  TONE_DOTS,
  TONE_ORDER,
  TONE_FINISH,
  TONE_FAMILIES,
  DIAM_RANGES,
  CAP_RANGES,
  PIECES_RANGES,
  COLLECTION_LABELS,
  PIECE_GROUP_INFO,
} from "@/lib/types";
import ProductGrid from "./ProductGrid";

interface FilterPanelProps {
  products: CatalogProduct[];
  onOpen: (slug: string) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onGo: (params: Record<string, string | null>) => void;
  urlSearch?: string;
}

const PAGE_SIZE = 24;

export default function FilterPanel({
  products,
  onOpen,
  favorites,
  onToggleFavorite,
  onGo,
  urlSearch,
}: FilterPanelProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeParams = useMemo(() => {
    if (urlSearch !== undefined) return new URLSearchParams(urlSearch);
    return searchParams;
  }, [urlSearch, searchParams]);

  // Estado de filtros desde URL / memoria (instantáneo 0ms)
  const filters: CatalogFilters = useMemo(
    () => ({
      q: activeParams.get("q") || "",
      grupo: activeParams.get("grupo") || "",
      tipo: activeParams.get("tipo")?.split(",").filter(Boolean) || [],
      material: activeParams.get("material")?.split(",").filter(Boolean) || [],
      coleccion: activeParams.get("coleccion")?.split(",").filter(Boolean) || [],
      linea: activeParams.get("linea")?.split(",").filter(Boolean) || [],
      color: activeParams.get("color")?.split(",").filter(Boolean) || [],
      diam: activeParams.get("diam")?.split(",").filter(Boolean) || [],
      cap: activeParams.get("cap")?.split(",").filter(Boolean) || [],
      pzas: activeParams.get("pzas")?.split(",").filter(Boolean) || [],
      disp: (activeParams.get("disp") as "todos" | "disponibles") || "todos",
      ord: (activeParams.get("ord") as CatalogFilters["ord"]) || "relevancia",
    }),
    [activeParams]
  );

  const [searchInput, setSearchInput] = useState(filters.q);
  const [showAllLines, setShowAllLines] = useState(false);

  // Firma de filtros → clave de remount del grid (resetea paginación y scroll)
  const filterSig = useMemo(() => JSON.stringify(filters), [filters]);

  // ===== Aplicar filtros =====
  // applyFilters(list, f, { skipColor }): aplica todos los filtros
  // activos; con skipColor=true omite el filtro de tono. Se usa para
  // calcular contadores HONESTOS: el número que muestra cada chip de
  // color es exactamente el número de piezas que aparecerá al hacer
  // clic (faceta estándar: excluir la propia dimensión del conteo).
  const applyFilters = useCallback(
    (list: CatalogProduct[], f: CatalogFilters, opts?: { skipColor?: boolean }) => {
      let result = list;

      if (f.q) {
        const words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
        result = result.filter((p) => {
          const hay = `${p.nameEs} ${p.collection} ${p.line} ${p.colorBase} ${p.productTypeLabel} ${p.material} ${
            TONE_LABELS[p.tone] || ""
          }`.toLowerCase();
          return words.every((w) => hay.includes(w));
        });
      }
      if (f.grupo) {
        result = result.filter((p) => p.pieceGroup === f.grupo);
      }
      if (f.tipo?.length) {
        result = result.filter((p) => f.tipo!.includes(p.productType));
      }
      if (f.material?.length) {
        result = result.filter((p) => f.material!.includes(p.material));
      }
      if (f.coleccion?.length) {
        result = result.filter((p) => f.coleccion!.includes(p.collection));
      }
      if (f.linea?.length) {
        result = result.filter((p) => f.linea!.includes(p.line));
      }
      if (!opts?.skipColor && f.color?.length) {
        // Taxonomía de tonos: cada valor del filtro es un tono fino
        result = result.filter((p) => f.color!.includes(p.tone || p.colorGroup));
      }
      if (f.diam?.length) {
        result = result.filter((p) => {
          if (p.diameter === null || p.diameter === undefined) return false;
          return f.diam!.some((key) => {
            const r = DIAM_RANGES.find((x) => x.key === key);
            if (!r) return false;
            return p.diameter! >= r.min && p.diameter! < (r.max === 999 ? 9999 : r.max);
          });
        });
      }
      if (f.cap?.length) {
        result = result.filter((p) => {
          if (p.capacity === null || p.capacity === undefined) return false;
          return f.cap!.some((key) => {
            const r = CAP_RANGES.find((x) => x.key === key);
            if (!r) return false;
            return p.capacity! >= r.min && p.capacity! < (r.max === 99999 ? 999999 : r.max);
          });
        });
      }
      if (f.pzas?.length) {
        result = result.filter((p) => {
          const pieces = p.pieces || 1;
          return f.pzas!.some((key) => {
            const r = PIECES_RANGES.find((x) => x.key === key);
            if (!r) return false;
            if (key === "12") return pieces >= 12 && pieces < 18;
            return pieces >= r.min && pieces <= r.max;
          });
        });
      }
      if (f.disp === "disponibles") {
        result = result.filter((p) => p.available);
      }

      // Ordenamiento
      switch (f.ord) {
        case "az":
          result = [...result].sort((a, b) => a.nameEs.localeCompare(b.nameEs, "es"));
          break;
        case "diam-asc":
          result = [...result].sort((a, b) => (a.diameter ?? 999) - (b.diameter ?? 999));
          break;
        case "diam-desc":
          result = [...result].sort((a, b) => (b.diameter ?? 0) - (a.diameter ?? 0));
          break;
        case "recientes":
          // El índice ya viene ordenado por fecha desc
          break;
        default:
          // Relevancia: disponibles primero, luego índice original
          result = [...result].sort((a, b) => Number(b.available) - Number(a.available));
      }

      return result;
    },
    []
  );

  const filtered = useMemo(
    () => applyFilters(products, filters),
    [products, filters, applyFilters]
  );

  // Resultados SIN el filtro de color: base para los contadores de los
  // chips de tono (el conteo no debe verse afectado por el color activo)
  const filteredNoColor = useMemo(
    () => applyFilters(products, filters, { skipColor: true }),
    [products, filters, applyFilters]
  );

  // ===== Facetas dinámicas (contadores según filtros aplicados) =====
  const facets = useMemo(() => {
    const countBy = (fn: (p: CatalogProduct) => string) => {
      const map = new Map<string, number>();
      for (const p of filtered) {
        const key = fn(p);
        if (key) map.set(key, (map.get(key) || 0) + 1);
      }
      return map;
    };
    const countTones = (list: CatalogProduct[]) => {
      const map = new Map<string, number>();
      for (const p of list) {
        const t = p.tone || p.colorGroup;
        if (t) map.set(t, (map.get(t) || 0) + 1);
      }
      return map;
    };
    return {
      tipos: countBy((p) => p.productType),
      materiales: countBy((p) => p.material),
      colecciones: countBy((p) => p.collection),
      lineas: countBy((p) => p.line),
      // Conteos de tono sobre los resultados SIN el filtro de color:
      // el número del checkbox es el que se obtiene al marcarlo
      tonos: countTones(filteredNoColor),
    };
  }, [filtered, filteredNoColor]);

  const typeLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.productType) map.set(p.productType, p.productTypeLabel);
    }
    return map;
  }, [products]);

  // ===== Helpers de URL =====
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(window.location.search);
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const toggleArrayParam = useCallback(
    (key: string, value: string) => {
      const current = searchParams.get(key)?.split(",").filter(Boolean) || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setParam(key, next.length ? next.join(",") : null);
    },
    [searchParams, setParam]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    params.set("view", "catalogo");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router]);

  // Búsqueda con debounce
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout((onSearchChange as unknown as { _t?: ReturnType<typeof setTimeout> })._t);
    (onSearchChange as unknown as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => {
      setParam("q", value || null);
    }, 400);
  };

  const activeFilterCount =
    (filters.tipo?.length || 0) +
    (filters.material?.length || 0) +
    (filters.coleccion?.length || 0) +
    (filters.color?.length || 0) +
    (filters.diam?.length || 0) +
    (filters.cap?.length || 0) +
    (filters.pzas?.length || 0) +
    (filters.linea?.length || 0) +
    (filters.grupo ? 1 : 0) +
    (filters.disp === "disponibles" ? 1 : 0);

  const sortedColecciones = useMemo(
    () => [...facets.colecciones.entries()].sort((a, b) => b[1] - a[1]),
    [facets.colecciones]
  );
  const sortedLineas = useMemo(
    () => [...facets.lineas.entries()].sort((a, b) => b[1] - a[1]),
    [facets.lineas]
  );
  const shownLineas = showAllLines ? sortedLineas : sortedLineas.slice(0, 8);

  // Conteos por tono sobre los resultados actuales SIN aplicar el
  // filtro de color (búsqueda + demás filtros): honestos respecto al clic
  const colorCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filteredNoColor) {
      const t = p.tone || p.colorGroup;
      if (t) map.set(t, (map.get(t) || 0) + 1);
    }
    return map;
  }, [filteredNoColor]);

  // ═══════ CONTENIDO DEL PANEL DE FILTROS ═══════
  const filterContent = (
    <div className="space-y-3.5">
      {/* Búsqueda */}
      <div>
        <div className="flex items-center gap-2 h-9 rounded-xl border border-input bg-card px-3 focus-within:border-[#c28b17] focus-within:ring-2 focus-within:ring-[#c28b17]/20 transition-all shadow-xs">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar en resultados…"
            className="flex-1 bg-transparent outline-none text-[12px] placeholder:text-muted-foreground/70"
          />
          {searchInput && (
            <button onClick={() => onSearchChange("")} aria-label="Limpiar" className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grupo de pieza */}
      <FilterSection title="Tipo de pieza" defaultOpen={true}>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {Object.entries(PIECE_GROUP_INFO).map(([key, info]) => {
            const count = products.filter((p) => p.pieceGroup === key).length;
            if (count === 0) return null;
            const active = filters.grupo === key;
            return (
              <button
                key={key}
                onClick={() => setParam("grupo", active ? null : key)}
                className={`px-3 h-8 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? "bg-[#c28b17] text-white border-[#c28b17] shadow-xs"
                    : "border-border/80 bg-card text-muted-foreground hover:border-[#c28b17] hover:text-foreground"
                }`}
              >
                <span>{info.label}</span>
                <span className={`text-[11px] ${active ? "text-white/90" : "text-muted-foreground/75"}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Diámetro */}
      <FilterSection title="Diámetro" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-0.5">
          {DIAM_RANGES.map((r) => {
            const count = filtered.filter(
              (p) =>
                p.diameter !== null &&
                p.diameter >= r.min &&
                p.diameter < (r.max === 999 ? 9999 : r.max)
            ).length;
            if (count === 0) return null;
            return (
              <CheckboxRow
                key={r.key}
                checked={filters.diam?.includes(r.key) || false}
                onChange={() => toggleArrayParam("diam", r.key)}
                label={r.label}
                count={count}
              />
            );
          })}
        </div>
      </FilterSection>

      {/* Color y acabado (tonos, agrupados por familia) */}
      <FilterSection title="Color y acabado" defaultOpen={false}>
        {TONE_FAMILIES.map((fam) => {
          const famTones = fam.tones.filter((t) => facets.tonos.has(t));
          if (famTones.length === 0) return null;
          return (
            <div key={fam.label} className="mb-2 last:mb-0">
              <p className="text-[10px] uppercase tracking-wider text-[#c28b17] font-semibold mb-1 px-1">
                {fam.label}
              </p>
              <div className="grid grid-cols-1 gap-0.5">
                {famTones.map((tone) => (
                  <CheckboxRow
                    key={tone}
                    checked={filters.color?.includes(tone) || false}
                    onChange={() => toggleArrayParam("color", tone)}
                    label={TONE_LABELS[tone] || tone}
                    count={facets.tonos.get(tone) || 0}
                    toneDot={tone}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </FilterSection>

      {/* Material */}
      <FilterSection title="Material" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-0.5">
          {[...facets.materiales.entries()].sort((a, b) => b[1] - a[1]).map(([mat, count]) => (
            <CheckboxRow
              key={mat}
              checked={filters.material?.includes(mat) || false}
              onChange={() => toggleArrayParam("material", mat)}
              label={mat}
              count={count}
            />
          ))}
        </div>
      </FilterSection>

      {/* Colección */}
      {sortedColecciones.length > 0 && (
        <FilterSection title="Colección" defaultOpen={false}>
          <div className="grid grid-cols-1 gap-0.5">
            {sortedColecciones.map(([col, count]) => (
              <CheckboxRow
                key={col}
                checked={filters.coleccion?.includes(col) || false}
                onChange={() => toggleArrayParam("coleccion", col)}
                label={COLLECTION_LABELS[col] || col}
                count={count}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Capacidad */}
      <FilterSection title="Capacidad" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-0.5">
          {CAP_RANGES.map((r) => {
            const count = filtered.filter(
              (p) =>
                p.capacity !== null &&
                p.capacity >= r.min &&
                p.capacity < (r.max === 99999 ? 999999 : r.max)
            ).length;
            if (count === 0) return null;
            return (
              <CheckboxRow
                key={r.key}
                checked={filters.cap?.includes(r.key) || false}
                onChange={() => toggleArrayParam("cap", r.key)}
                label={r.label}
                count={count}
              />
            );
          })}
        </div>
      </FilterSection>

      {/* Piezas por set */}
      <FilterSection title="Piezas por juego" defaultOpen={false}>
        <div className="grid grid-cols-1 gap-0.5">
          {PIECES_RANGES.map((r) => {
            const count = filtered.filter((p) => {
              const pieces = p.pieces || 1;
              if (r.key === "12") return pieces >= 12 && pieces < 18;
              return pieces >= r.min && pieces <= r.max;
            }).length;
            if (count === 0) return null;
            return (
              <CheckboxRow
                key={r.key}
                checked={filters.pzas?.includes(r.key) || false}
                onChange={() => toggleArrayParam("pzas", r.key)}
                label={r.label}
                count={count}
              />
            );
          })}
        </div>
      </FilterSection>

      {/* Línea (colapsable) */}
      {sortedLineas.length > 0 && (
        <FilterSection title="Línea de diseño" defaultOpen={false}>
          <div className="grid grid-cols-1 gap-0.5">
            {shownLineas.map(([lin, count]) => (
              <CheckboxRow
                key={lin}
                checked={filters.linea?.includes(lin) || false}
                onChange={() => toggleArrayParam("linea", lin)}
                label={lin}
                count={count}
              />
            ))}
            {sortedLineas.length > 8 && (
              <button
                onClick={() => setShowAllLines(!showAllLines)}
                className="text-[11px] text-[#c28b17] hover:underline mt-1 text-left px-2"
              >
                {showAllLines
                  ? "Ver menos"
                  : `Ver todas las líneas (${sortedLineas.length})`}
              </button>
            )}
          </div>
        </FilterSection>
      )}

      {/* Disponibilidad */}
      <FilterSection title="Disponibilidad" defaultOpen={false}>
        <div className="flex gap-1.5 pt-0.5">
          <button
            onClick={() => setParam("disp", filters.disp === "disponibles" ? "todos" : "disponibles")}
            className={`px-3 h-7 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
              filters.disp === "disponibles"
                ? "bg-[#c28b17] text-white border-[#c28b17] shadow-xs"
                : "border-border/80 bg-card text-muted-foreground hover:border-[#c28b17] hover:text-foreground"
            }`}
          >
            Solo disponibles
          </button>
        </div>
      </FilterSection>

      {/* Limpiar */}
      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full gap-2 h-8.5 rounded-full text-[12px] font-medium border-border/80 shadow-xs" onClick={clearAll}>
          <RotateCcw className="w-3.5 h-3.5" />
          Limpiar filtros ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  // ═══════ VISTA PRINCIPAL ═══════
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      {/* Encabezado de resultados */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-medium truncate">
            {filters.q ? `“${filters.q}”` : "Catálogo"}
          </h1>
          <Badge variant="secondary" className="text-xs h-5.5 px-2 font-normal shrink-0">
            {filtered.length} piezas
          </Badge>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Orden */}
          <div className="flex-1 sm:flex-initial">
            <Select
              value={filters.ord}
              onValueChange={(v) => setParam("ord", v === "relevancia" ? null : v)}
            >
              <SelectTrigger className="w-full sm:w-44 h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevancia">Relevancia</SelectItem>
                <SelectItem value="az">Nombre A-Z</SelectItem>
                <SelectItem value="diam-asc">Diámetro ↑</SelectItem>
                <SelectItem value="diam-desc">Diámetro ↓</SelectItem>
                <SelectItem value="recientes">Más recientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros móvil */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden gap-1.5 h-9 text-xs sm:text-sm px-3 sm:px-4 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filtros</span>
                {activeFilterCount > 0 && (
                  <Badge className="h-4.5 min-w-4.5 px-1 bg-[#c28b17] text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto p-4 sm:p-6">
              <SheetHeader className="px-1 mb-4">
                <SheetTitle className="text-left font-display text-lg">Filtros de catálogo</SheetTitle>
              </SheetHeader>
              <div className="px-1 pb-6">{filterContent}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>



      <div className="flex gap-6">
        {/* Sidebar filtros (desktop) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 pb-6">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">Filtros</span>
            </div>
            {filterContent}
          </div>
        </aside>

        {/* Grid (o estado vacío con recuperación) */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <CircleAlert className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No se encontraron piezas con esos filtros</p>
              <p className="text-sm mt-1 text-muted-foreground">
                Prueba ampliando los criterios de búsqueda
              </p>
              <Button variant="outline" className="mt-5 gap-2" onClick={clearAll}>
                <RotateCcw className="w-4 h-4" />
                Limpiar filtros y ver todo el catálogo
              </Button>
            </div>
          ) : (
            <ResultsView
              key={filterSig}
              products={filtered}
              onOpen={onOpen}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════ BARRA DE FILTRO POR COLOR (TONOS) ═══════════
// Chips con muestra de color + conteo, siempre visibles sobre los
// resultados. Refleja la búsqueda activa (filters.q) y los demás
// filtros aplicados. Taxonomía de 19 tonos (máx ~300 c/u).
function ColorFilterBar({
  counts,
  active,
  onToggle,
  hasQuery,
}: {
  counts: Map<string, number>;
  active: string[];
  onToggle: (color: string) => void;
  hasQuery: boolean;
}) {
  const chips = TONE_ORDER.filter((c) => counts.has(c));
  if (chips.length === 0) return null;
  const colorChips = chips.filter((c) => !TONE_FINISH.includes(c));
  const finishChips = chips.filter((c) => TONE_FINISH.includes(c));
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c28b17]">
          {hasQuery ? "Filtrar resultados por color" : "Filtrar por color"}
        </h3>
        {active.length > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {active.length} activo{active.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {colorChips.map((toneKey) => {
          const count = counts.get(toneKey) || 0;
          const isActive = active.includes(toneKey);
          const label = (TONE_LABELS[toneKey] || toneKey).split(" /")[0];
          return (
            <button
              key={toneKey}
              onClick={() => onToggle(toneKey)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-8 sm:h-9 rounded-full border text-xs sm:text-[13px] font-medium transition-all active:scale-95 ${
                isActive
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:border-[#c28b17]/60 hover:text-foreground"
              }`}
              aria-pressed={isActive}
              title={`${TONE_LABELS[toneKey]} · ${count} piezas`}
            >
              <span
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border shrink-0 ${
                  isActive ? "border-white/60" : "border-black/10"
                }`}
                style={{ background: TONE_DOTS[toneKey] }}
              />
              {label}
              <span className={`text-[10px] sm:text-[11px] ${isActive ? "opacity-70" : "text-muted-foreground"}`}>
                {count}
              </span>
            </button>
          );
        })}
        {finishChips.length > 0 && (
          <span className="w-px h-5 sm:h-6 bg-border mx-1" aria-hidden />
        )}
        {finishChips.map((toneKey) => {
          const count = counts.get(toneKey) || 0;
          const isActive = active.includes(toneKey);
          const label = (TONE_LABELS[toneKey] || toneKey).split(" /")[0];
          return (
            <button
              key={toneKey}
              onClick={() => onToggle(toneKey)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-8 sm:h-9 rounded-full border border-dashed text-xs sm:text-[13px] font-medium transition-all active:scale-95 ${
                isActive
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "border-[#c28b17]/40 bg-card text-muted-foreground hover:border-[#c28b17] hover:text-foreground"
              }`}
              aria-pressed={isActive}
              title={`${TONE_LABELS[toneKey]} · ${count} piezas`}
            >
              <span
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border shrink-0 ${
                  isActive ? "border-white/60" : "border-black/10"
                }`}
                style={{ background: TONE_DOTS[toneKey] }}
              />
              {label}
              <span className={`text-[10px] sm:text-[11px] ${isActive ? "opacity-70" : "text-muted-foreground"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultsView({
  products,
  onOpen,
  favorites,
  onToggleFavorite,
}: {
  products: CatalogProduct[];
  onOpen: (slug: string) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  return (
    <>
      <ProductGrid
        products={products.slice(0, visibleCount)}
        onOpen={onOpen}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
      />

      {visibleCount < products.length && (
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Ver más piezas ({products.length - visibleCount} restantes)
          </Button>
        </div>
      )}
    </>
  );
}

function FilterSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/50 pb-2.5 mb-2.5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-1 text-left group cursor-pointer"
      >
        <span className="text-[12.5px] font-medium tracking-normal text-foreground/85 group-hover:text-[#c28b17] transition-colors">
          {title}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180 text-[#c28b17]" : ""}`} />
      </button>
      {open && <div className="mt-2 space-y-1">{children}</div>}
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  count,
  toneDot,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count: number;
  toneDot?: string;
}) {
  return (
    <label
      className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer text-xs hover:bg-accent/50 transition-colors ${
        checked ? "bg-[#f6e9c8]/70 font-medium text-foreground" : "text-muted-foreground"
      }`}
    >
      <Checkbox checked={checked} onCheckedChange={onChange} className="w-3.5 h-3.5 rounded-[3px] data-[state=checked]:bg-[#c28b17] data-[state=checked]:border-[#c28b17]" />
      {toneDot && (
        <span
          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
          style={{ background: TONE_DOTS[toneDot] || "#ccc" }}
        />
      )}
      <span className="flex-1 truncate">{label}</span>
      <span className="text-[10px] text-muted-foreground/70">{count}</span>
    </label>
  );
}
