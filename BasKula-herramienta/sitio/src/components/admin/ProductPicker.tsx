"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Plus, Check, Package, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AdminCatalogProduct } from "@/lib/types";
import { PIECE_GROUP_INFO, TONE_LABELS, TONE_DOTS, TONE_ORDER } from "@/lib/types";
import { adminFetch } from "@/lib/api-client";

// ═══════════════════════════════════════════════════════════════
// PRODUCT PICKER (panel admin)
// Buscador de piezas del catálogo COMPLETO (las 1.510, públicas y
// ocultas) con los mismos filtros del catálogo: texto, categoría y
// tono con contadores honestos. Se usa en «Preparado para ti» para
// añadir piezas a la selección de un cliente.
// ═══════════════════════════════════════════════════════════════

interface ProductPickerProps {
  addedIds: Set<string>;
  onAdd: (productId: string) => void;
}

export default function ProductPicker({ addedIds, onAdd }: ProductPickerProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<AdminCatalogProduct[] | null>(null);
  const [search, setSearch] = useState("");
  const [grupo, setGrupo] = useState<string | null>(null);
  const [tone, setTone] = useState<string | null>(null);
  // Filtro rápido: solo piezas disponibles para el público
  const [soloDisp, setSoloDisp] = useState(false);
  // Confirmación al añadir una pieza NO disponible al cliente
  const [confirmAdd, setConfirmAdd] = useState<AdminCatalogProduct | null>(null);

  useEffect(() => {
    let active = true;
    adminFetch("/api/admin/catalog")
      .then(async (r) => {
        if (!r.ok) throw new Error("auth");
        const data = await r.json();
        if (active) setProducts(data.products || []);
      })
      .catch(() => {
        if (active) {
          setProducts([]);
          toast({
            title: "No se pudo cargar el catálogo",
            description: "Revisa tu sesión de admin.",
            variant: "destructive",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const baseFiltered = useMemo(() => {
    if (!products) return [];
    let list = products;
    if (search.trim()) {
      const words = search.toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const hay = `${p.nameEs} ${p.collection} ${p.line} ${p.colorBase} ${p.productTypeLabel} ${p.reference}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }
    if (grupo) list = list.filter((p) => p.pieceGroup === grupo);
    if (soloDisp) list = list.filter((p) => p.available);
    return list;
  }, [products, search, grupo, soloDisp]);

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

  const results = useMemo(() => filtered.slice(0, 18), [filtered]);

  // Piezas disponibles dentro del filtro actual (para el contador del chip)
  const availableCount = useMemo(
    () =>
      products
        ? products.filter(
            (p) =>
              p.available &&
              (!search.trim() ||
                `${p.nameEs} ${p.collection} ${p.line} ${p.colorBase} ${p.productTypeLabel} ${p.reference}`
                  .toLowerCase()
                  .includes(search.toLowerCase())) &&
              (!grupo || p.pieceGroup === grupo)
          ).length
        : 0,
    [products, search, grupo]
  );

  const hasFilters = Boolean(search.trim()) || grupo || tone || soloDisp;
  const clearFilters = () => {
    setSearch("");
    setGrupo(null);
    setTone(null);
    setSoloDisp(false);
  };

  // Añadir con aviso: si la pieza NO está disponible para el público,
  // el admin confirma antes («agregarlo al cliente de todas formas»)
  const handlePick = (p: AdminCatalogProduct) => {
    if (addedIds.has(p.id)) return;
    if (!p.available) {
      setConfirmAdd(p);
      return;
    }
    onAdd(p.id);
  };

  if (!products) {
    return (
      <p className="text-sm text-muted-foreground py-3 flex items-center gap-2">
        <Package className="w-4 h-4 animate-pulse" />
        Cargando catálogo completo…
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      {/* Búsqueda */}
      <div className="flex items-center gap-2 h-10 rounded-full border border-input bg-card px-3 focus-within:border-primary/50">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en las 1.510 piezas (nombre, color, referencia…)"
          className="flex-1 bg-transparent outline-none text-sm"
          aria-label="Buscar piezas para añadir"
        />
        {search && (
          <button onClick={() => setSearch("")} className="p-1 rounded-full hover:bg-accent" aria-label="Limpiar">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filtro de disponibilidad + categorías */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSoloDisp(!soloDisp)}
          className={`flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium transition-colors border ${
            soloDisp
              ? "bg-[#6e8058] text-white border-[#6e8058]"
              : "border-[#6e8058]/40 text-[#6e8058] hover:bg-[#6e8058]/10"
          }`}
          title="Mostrar solo las piezas marcadas como disponibles para el público"
        >
          {soloDisp ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          Solo disponibles
          <span className="opacity-70 ml-0.5">{availableCount}</span>
        </button>
      </div>

      {/* Categorías */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(PIECE_GROUP_INFO).map(([key, info]) => {
          const count = baseFiltered.length
            ? baseFiltered.filter((p) => p.pieceGroup === key).length
            : 0;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setGrupo(grupo === key ? null : key)}
              className={`px-3 h-7 rounded-full text-xs font-medium transition-colors ${
                grupo === key
                  ? "bg-foreground text-background"
                  : "border border-input text-muted-foreground hover:border-[#c28b17]/60 hover:text-[#c28b17]"
              }`}
            >
              {info.label} <span className="opacity-60 ml-0.5">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tonos */}
      {baseFiltered.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {TONE_ORDER.map((toneKey) => {
            const count = toneCounts.get(toneKey) || 0;
            if (count === 0) return null;
            return (
              <button
                key={toneKey}
                onClick={() => setTone(tone === toneKey ? null : toneKey)}
                title={`${TONE_LABELS[toneKey]} · ${count}`}
                className={`flex items-center gap-1 px-2 h-7 rounded-full border text-xs transition-all ${
                  tone === toneKey
                    ? "border-[#c28b17] bg-[#f6e9c8] text-foreground"
                    : "border-border text-muted-foreground hover:border-[#c28b17]/60 hover:text-foreground"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/10"
                  style={{ background: TONE_DOTS[toneKey] }}
                />
                {TONE_LABELS[toneKey]?.split(" /")[0]}
                <span className="text-[9px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Resultados */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          {filtered.length > 18 ? "Primeros 18 de " : ""}
          <span className="text-foreground font-medium">{filtered.length}</span> piezas
          {hasFilters && (
            <button onClick={clearFilters} className="ml-2 text-primary hover:underline">
              limpiar filtros
            </button>
          )}
        </p>
        {results.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-lg">
            Sin resultados. Prueba con otros términos.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-1">
            {results.map((p) => {
              const added = addedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => handlePick(p)}
                  disabled={added}
                  className={`group relative rounded-lg border overflow-hidden text-left transition-all ${
                    added
                      ? "border-[#6e8058]/50 bg-[#6e8058]/5 opacity-80"
                      : "border-border hover:border-[#c28b17]/60 hover:shadow-sm"
                  }`}
                >
                  <div className="aspect-square bg-muted relative">
                    {p.image && (
                      <img src={p.image} alt={p.nameEs} className="w-full h-full object-cover" loading="lazy" />
                    )}
                    {!p.available && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-white/95 text-[#8b5a2b] text-[9px] font-medium border border-[#e2c9a8] leading-none">
                        No disponible
                      </span>
                    )}
                    <span
                      className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${
                        added ? "bg-[#6e8058] text-white" : "bg-white/90 text-primary"
                      }`}
                    >
                      {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-medium line-clamp-2 leading-tight">{p.nameEs}</p>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="text-[10px] text-muted-foreground truncate">
                        {p.diameter ? `Ø${p.diameter}cm` : p.reference || p.collection || "—"}
                      </span>
                      {!p.published && (
                        <span className="text-[9px] font-medium text-[#8b5a2b] bg-[#8b5a2b]/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          No pública
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Aviso: la pieza NO está disponible para el público ═══ */}
      <AlertDialog
        open={confirmAdd !== null}
        onOpenChange={(o) => !o && setConfirmAdd(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-[#8b5a2b] shrink-0 mt-0.5" />
              Esta pieza no está disponible para el público
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="font-medium text-foreground">«{confirmAdd?.nameEs}»</p>
                <p className="mt-1">
                  Está marcada como <strong>no disponible</strong> en el catálogo. Si la añadís,
                  el cliente la verá en su selección con la etiqueta «Consultar disponibilidad».
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAdd) onAdd(confirmAdd.id);
                setConfirmAdd(null);
              }}
            >
              Agregarlo al cliente de todas formas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
