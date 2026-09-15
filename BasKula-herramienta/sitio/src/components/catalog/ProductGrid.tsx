"use client";

import { Heart, CircleAlert } from "lucide-react";
import type { CatalogProduct } from "@/lib/types";
import { prefetchDetail } from "@/lib/detail-cache";

interface ProductGridProps {
  products: CatalogProduct[];
  onOpen: (slug: string) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  compact?: boolean;
}

export default function ProductGrid({
  products,
  onOpen,
  favorites,
  onToggleFavorite,
  compact = false,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <CircleAlert className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No se encontraron piezas con esos filtros</p>
        <p className="text-sm mt-1">Prueba ampliando los criterios de búsqueda</p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3"
          : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4"
      }
    >
      {products.map((p) => {
        const isFav = favorites.has(p.id);
        return (
          <article
            key={p.id}
            className="group relative rounded-xl sm:rounded-2xl border border-border/70 bg-card overflow-hidden hover:shadow-[0_4px_18px_rgba(34,34,34,0.08)] hover:border-[#c28b17]/40 transition-all duration-200 cursor-pointer flex flex-col"
            onClick={() => onOpen(p.slug)}
            // Prefetch de la ficha al pasar el mouse: apertura casi instantánea
            onPointerEnter={() => prefetchDetail(p.slug)}
          >
            {/* Imagen */}
            <div className="aspect-square bg-[#f7f3ec] overflow-hidden relative">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.nameEs}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Sin imagen
                </div>
              )}

              {/* Badge disponibilidad */}
              {!p.available && (
                <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[#8b5a2b] text-[9px] sm:text-[10px] font-medium border border-[#e2c9a8] shadow-xs">
                  Consultar
                </span>
              )}

              {/* Botón favorito: tamaño compacto y balanceado */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(p.id);
                }}
                className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border shadow-xs backdrop-blur-xs transition-all active:scale-90 cursor-pointer ${
                  isFav
                    ? "bg-foreground text-background border-foreground"
                    : "bg-white/90 text-[#8d8677] border-border/70 hover:text-[#c28b17] hover:border-[#c28b17]"
                }`}
                aria-label={isFav ? `Quitar ${p.nameEs} de mi lista` : `Añadir ${p.nameEs} a mi lista`}
                aria-pressed={isFav}
                title={isFav ? "Quitar de mi lista" : "Añadir a mi lista"}
              >
                <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-[#e2a727] text-[#e2a727]" : ""}`} />
              </button>
            </div>

            {/* Info */}
            <div className={compact ? "p-2 sm:p-2.5 text-center flex flex-col items-center flex-1 justify-between" : "p-2.5 sm:p-3.5 text-center flex flex-col items-center flex-1 justify-between"}>
              <div className="w-full flex flex-col items-center">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#c28b17] mb-0.5 truncate font-semibold text-center w-full">
                  {p.productTypeLabel}
                  {p.collection ? ` · ${p.collection.split(" - ")[0]}` : ""}
                </p>
                <h3
                  className={`font-medium leading-snug line-clamp-2 text-foreground text-center w-full ${compact ? "text-[11px] sm:text-[12px]" : "text-[12px] sm:text-[13px]"}`}
                  title={p.nameEs}
                >
                  {p.nameEs}
                </h3>
              </div>
              <div className="w-full flex flex-col items-center mt-1">
                <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground w-full text-center">
                  {p.diameter && <span>Ø{p.diameter}cm</span>}
                  {p.capacity && <span>{p.capacity}ml</span>}
                  {p.pieces && p.pieces > 1 && <span>{p.pieces} pzas</span>}
                  {p.material && <span className="hidden sm:inline">· {p.material}</span>}
                </div>
                {!compact && p.colorBase && (
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-1 text-center w-full">
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground/80 truncate">{p.colorBase}</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
