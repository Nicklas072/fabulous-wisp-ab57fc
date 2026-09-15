"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Heart, LayoutGrid, X, Sparkles, User, ArrowLeft, LogIn, LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { CatalogProduct } from "@/lib/types";
import {
  PIECE_GROUP_INFO,
  DIAM_RANGES,
  TONE_LABELS,
  TONE_DOTS,
  TONE_ORDER,
  TONE_FINISH,
} from "@/lib/types";
import { clientFetch, setClientCode, getClientCode, clearClientCode, clearAdminPin } from "@/lib/api-client";
import ProductGrid from "./ProductGrid";
import ProductModal from "./ProductModal";
import FilterPanel from "./FilterPanel";
import FavoritesView from "@/components/favorites/FavoritesView";
import ClientHero from "./ClientHero";
import LoginDialog, { type LoginResult } from "./LoginDialog";

export interface ClientInfo {
  code: string;
  name: string;
}

interface CatalogAppProps {
  initialProducts?: CatalogProduct[];
  client: ClientInfo | null;
  whatsapp: string;
  curated: CatalogProduct[];
  suggestions: CatalogProduct[];
  favoritesPreview: CatalogProduct[];
}

type View = "home" | "catalogo" | "favoritos";

// ═══ Botones de categoría (reemplazan los chips con errores "vajilla 30"/"Ø26") ═══
const CATEGORY_BUTTONS: { label: string; grupo: string | null; tipo: string | null }[] = [
  { label: "Bowls", grupo: "bowls", tipo: null },
  { label: "Cafetería", grupo: "tecafe", tipo: null },
  { label: "Platos hondos", grupo: null, tipo: "plato-hondo" },
  { label: "Platos llanos", grupo: null, tipo: "plato-llano" },
  { label: "Platos Postre", grupo: null, tipo: "plato-postre" },
];

export default function CatalogApp({
  initialProducts,
  client,
  whatsapp,
  curated,
  suggestions,
  favoritesPreview,
}: CatalogAppProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Índice de productos (precargado desde el servidor para carga instantánea 0ms)
  const [products, setProducts] = useState<CatalogProduct[] | null>(initialProducts || null);
  const [loading, setLoading] = useState(!initialProducts);

  // Vista actual
  const view = (searchParams.get("view") as View) || "home";
  const urlProductSlug = searchParams.get("p");
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(() => urlProductSlug);

  useEffect(() => {
    setSelectedProductSlug(urlProductSlug);
  }, [urlProductSlug]);

  // Búsqueda desde el hero
  const [heroQuery, setHeroQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Identificación de cliente efectiva:
  //   - server props (cookie o ?client=CODE) → vía directa
  //   - fallback: código en localStorage (cuando el navegador bloquea
  //     cookies, p. ej. en iframes/previews embebidos)
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(() => {
    if (client) return client;
    if (typeof window !== "undefined") {
      const code = getClientCode();
      if (code) return { code, name: code };
    }
    return null;
  });
  const [curatedItems, setCuratedItems] = useState(curated);
  const [suggestionItems, setSuggestionItems] = useState(suggestions);
  const [favPreview, setFavPreview] = useState(favoritesPreview);

  // Favoritos
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesCount, setFavoritesCount] = useState(favoritesPreview.length);

  // Ventana "Inicia sesión"
  const [loginOpen, setLoginOpen] = useState(false);

  const welcome = searchParams.get("welcome") === "1";

  // Si hay sesión de cliente activa, asegurar que no queden credenciales admin residuales
  useEffect(() => {
    if (clientInfo) {
      clearAdminPin();
    }
  }, [clientInfo]);

  // Cargar índice del catálogo solo si no vino precargado del servidor
  useEffect(() => {
    if (products) return;
    let cancelled = false;
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.products) {
          setProducts(data.products);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [products]);

  // Sincronización instantánea (0s) con el Admin panel (incluso entre pestañas)
  const refreshCatalogProducts = useCallback(() => {
    fetch("/api/catalog", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.products) {
          setProducts(data.products);
        }
      })
      .catch(() => {});

    if (getClientCode()) {
      clientFetch("/api/client/home")
        .then((r) => r.json())
        .then((data) => {
          if (data?.curated) setCuratedItems(data.curated);
          if (data?.suggestions) setSuggestionItems(data.suggestions);
          if (data?.favoritesPreview) setFavPreview(data.favoritesPreview);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("baskula-catalog-sync");
        bc.onmessage = () => {
          refreshCatalogProducts();
        };
      }
    } catch {
      /* ignore */
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "baskula_catalog_sync") {
        refreshCatalogProducts();
      }
    };

    const onFocus = () => {
      const lastSync = localStorage.getItem("baskula_catalog_sync");
      if (lastSync) {
        try {
          const parsed = JSON.parse(lastSync);
          if (Date.now() - parsed.timestamp < 120000) {
            refreshCatalogProducts();
          }
        } catch {
          /* ignore */
        }
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshCatalogProducts]);

  // Persistir el código de cliente del URL (?client=CODE) en localStorage
  // y limpiarlo del URL (los datos ya llegaron server-side)
  useEffect(() => {
    const urlCode = searchParams.get("client");
    if (urlCode) {
      setClientCode(urlCode.toUpperCase());
      const params = new URLSearchParams(window.location.search);
      params.delete("client");
      router.replace(`${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`, {
        scroll: false,
      });
    }
  }, [searchParams, router]);

  // Fallback: sin cliente del server pero con código guardado (cookies
  // bloqueadas) → cargar datos personalizados vía header x-client-code
  useEffect(() => {
    if (client) return; // el server ya identificó (cookie o ?client=)
    const code = getClientCode();
    if (!code) return;
    let cancelled = false;
    clientFetch("/api/client/home")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.client) return;
        setClientInfo(data.client);
        setCuratedItems(data.curated || []);
        setSuggestionItems(data.suggestions || []);
        setFavPreview(data.favoritesPreview || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [client]);

  // Cargar favoritos del cliente
  useEffect(() => {
    if (!clientInfo) return;
    clientFetch("/api/client/favorites")
      .then((r) => r.json())
      .then((data) => {
        if (data.favorites) {
          setFavorites(new Set(data.favorites.map((f: { productId: string }) => f.productId)));
          setFavoritesCount(data.favorites.length);
        }
      })
      .catch(() => {});
  }, [clientInfo]);

  // Toast de bienvenida
  useEffect(() => {
    if (welcome && clientInfo) {
      toast({
        title: `¡Hola, ${clientInfo.name}!`,
        description: "Tus preferencias están listas. Bienvenido de nuevo.",
      });
      // Limpiar el query param sin recargar
      const params = new URLSearchParams(window.location.search);
      params.delete("welcome");
      router.replace(`?${params.toString()}`, { scroll: false });
    } else if (searchParams.get("invalid") === "1") {
      toast({
        title: "Código no reconocido",
        description: "Verifica tu enlace personalizado o contacta a tu asesor.",
        variant: "destructive",
      });
      const params = new URLSearchParams(window.location.search);
      params.delete("invalid");
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [welcome, clientInfo, toast, router, searchParams]);

  // Navegación que CONSERVA los parámetros actuales (para abrir/cerrar
  // la ficha de un producto sin perder la vista ni los filtros activos)
  const go = useCallback(
    (params: Record<string, string | null>) => {
      const current = new URLSearchParams(window.location.search);
      for (const [k, v] of Object.entries(params)) {
        if (v === null) current.delete(k);
        else current.set(k, v);
      }
      router.push(`?${current.toString()}`, { scroll: true });
    },
    [router]
  );

  // Navegación LIMPIA: construye el URL desde cero con solo los parámetros
  // dados. Evita que filtros anteriores (grupo, tipo, diam, cap, disp…)
  // queden "pegados" en la URL y produzcan combinaciones vacías del tipo
  // "No se encontraron piezas con esos filtros" al volver al inicio y
  // hacer clic en un color o categoría (bug reportado con el terracota).
  const goClean = useCallback(
    (params: Record<string, string | null | undefined>) => {
      const fresh = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== null && v !== undefined && v !== "") fresh.set(k, v);
      }
      router.push(`?${fresh.toString()}`, { scroll: true });
    },
    [router]
  );

  // Abrir producto
  const openProduct = useCallback(
    (slug: string) => {
      setSelectedProductSlug(slug);
      go({ p: slug });
    },
    [go]
  );

  // Cerrar producto
  const closeProduct = useCallback(() => {
    setSelectedProductSlug(null);
    go({ p: null });
  }, [go]);

  // ═══ Inicio / cierre de sesión del cliente ═══
  const handleLoginSuccess = useCallback(
    (data: LoginResult) => {
      clearAdminPin();
      setClientInfo(data.client);
      setCuratedItems((data.curated as CatalogProduct[]) || []);
      setSuggestionItems((data.suggestions as CatalogProduct[]) || []);
      setFavPreview((data.favoritesPreview as CatalogProduct[]) || []);
      toast({
        title: `¡Hola, ${data.client.name}!`,
        description: "Tu lista personalizada está lista.",
      });
    },
    [toast]
  );

  const handleLogout = useCallback(() => {
    clearClientCode();
    clearAdminPin();
    // También limpiar la cookie (si no, al recargar vuelve a identificarse)
    fetch("/api/client/logout", { method: "POST" }).catch(() => {});
    setClientInfo(null);
    setCuratedItems([]);
    setSuggestionItems([]);
    setFavPreview([]);
    setFavorites(new Set());
    setFavoritesCount(0);
    toast({ title: "Sesión cerrada", description: "Volverás al catálogo general." });
  }, [toast]);

  // Sincronizar el corazón cuando el cliente quita una pieza desde su
  // «Mi lista» (la vista usa su propio flujo de borrado)
  const removeFavoriteFromSet = useCallback((productId: string) => {
    setFavorites((prev) => {
      if (!prev.has(productId)) return prev;
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  // Toggle favorito
  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!clientInfo) {
        goClean({ view: "favoritos" });
        toast({
          title: "Tu lista de interés",
          description:
            "Ingresa con tu código de cliente o pídelo por WhatsApp para guardar y compartir tus favoritos.",
        });
        return;
      }
      const isFav = favorites.has(productId);
      // Optimistic update
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(productId);
        else next.add(productId);
        return next;
      });
      setFavoritesCount((c) => c + (isFav ? -1 : 1));

      try {
        if (isFav) {
          await clientFetch(`/api/client/favorites?productId=${productId}`, { method: "DELETE" });
        } else {
          await clientFetch("/api/client/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
        }
      } catch {
        // Revertir
        setFavorites((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(productId);
          else next.delete(productId);
          return next;
        });
        setFavoritesCount((c) => c + (isFav ? 1 : -1));
        toast({ title: "Error", description: "No se pudo guardar. Intenta de nuevo.", variant: "destructive" });
      }
    },
    [clientInfo, favorites, toast, goClean]
  );

  // Búsqueda del hero → ir a catálogo con query (URL limpia: sin
  // filtros previos arrastrados)
  const submitSearch = useCallback(
    (q: string) => {
      goClean({ view: "catalogo", q });
      setShowSuggestions(false);
    },
    [goClean]
  );

  // Sugerencias de búsqueda instantánea
  const searchSuggestions = useMemo(() => {
    if (!heroQuery.trim() || !products) return [];
    const q = heroQuery.toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    return products
      .filter((p) => {
        const hay = `${p.nameEs} ${p.collection} ${p.line} ${p.colorBase} ${p.productTypeLabel} ${
          TONE_LABELS[p.tone] || ""
        }`.toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .slice(0, 6);
  }, [heroQuery, products]);

  // Conteo de tonos (taxonomía ampliada, máx ~300 por tono)
  const toneCounts = useMemo(() => {
    const map = new Map<string, number>();
    if (!products) return map;
    for (const p of products) {
      if (p.tone) map.set(p.tone, (map.get(p.tone) || 0) + 1);
    }
    return map;
  }, [products]);

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <img src="/logo-baskula.png" alt="BasKula" className="h-16 w-auto object-contain opacity-90" />
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 rounded-full border-2 border-[#c28b17]/30 border-t-[#c28b17] animate-spin" />
          <span className="font-serif2 italic text-lg">Preparando el catálogo…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ══════════ HEADER ══════════ */}
      <header className="sticky top-0 z-40 w-full bg-[#f4eee2]/95 backdrop-blur-md border-b border-[#e2a727]/20 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center gap-1.5 sm:gap-3">
          {view !== "home" && (
            <button
              onClick={() => goClean({ view: "home" })}
              className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          <a
            href="https://baskula.netlify.app"
            className="flex items-center gap-2 group shrink-0"
            title="Volver a la web principal de BasKula"
          >
            <img
              src="/logo-baskula.png"
              alt="BasKula"
              className="h-8 sm:h-10 w-auto object-contain group-hover:opacity-80 transition-opacity"
            />
          </a>

          <div className="flex-1 min-w-0" />

          {clientInfo && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f6e9c8] text-[#8b5a2b] text-xs font-medium border border-[#c28b17]/30 shrink-0">
              {clientInfo.name.split(" ")[0]}
            </span>
          )}

          <button
            onClick={() => goClean({ view: "catalogo" })}
            className="inline-flex items-center justify-center px-2.5 sm:px-5 h-8.5 sm:h-10 rounded-full bg-[#e2a727] text-white font-medium text-xs sm:text-sm hover:bg-[#c28b17] transition-all shadow-xs cursor-pointer shrink-0"
            title="Abrir herramienta de Catálogo B2B Interactivo"
          >
            <span className="sm:hidden">Catálogo</span>
            <span className="hidden sm:inline">Catálogo B2B</span>
          </button>

          {!clientInfo && (
            <button
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4.5 h-8.5 sm:h-10 rounded-full bg-[#faf8f5] text-[#222222] border border-[#e5d5c5] text-xs sm:text-sm font-medium hover:border-[#c28b17] hover:text-[#c28b17] transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c28b17] shrink-0" />
              <span>Iniciar sesión</span>
            </button>
          )}

          <button
            onClick={() => goClean({ view: "favoritos" })}
            className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-4.5 h-8.5 sm:h-10 rounded-full bg-[#faf8f5] text-[#222222] border border-[#e5d5c5] text-xs sm:text-sm font-medium hover:border-[#c28b17] hover:text-[#c28b17] transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favoritesCount > 0 ? "fill-[#e2a727] text-[#e2a727]" : "text-[#8d8677]"}`} />
            <span className="hidden sm:inline">Mi lista</span>
            {favoritesCount > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4.5 min-w-4.5 px-1 bg-[#c28b17] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white rounded-full">
                {favoritesCount}
              </Badge>
            )}
          </button>
        </div>
      </header>

      {/* ══════════ CONTENIDO ══════════ */}
      <main className="flex-1 w-full flex flex-col items-center">
        {view === "home" && (
          <div className="animate-fade-up w-full flex flex-col items-center">
            {/* Hero con búsqueda protagonista */}
            <section className="w-full max-w-3xl mx-auto px-4 pt-8 sm:pt-20 pb-8 sm:pb-10 text-center flex flex-col items-center">
              {clientInfo ? (
                <ClientHero client={clientInfo} curatedCount={curatedItems.length} />
              ) : (
                <>
                  <p className="eyebrow text-xs sm:text-sm text-[#c28b17] mb-2 sm:mb-3 text-center">
                    Vajillas artesanales · Stoneware &amp; Loza
                  </p>
                  <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-medium leading-tight mb-3 sm:mb-4 text-foreground text-center">
                    ¡Bienvenido a nuestro catálogo!
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto text-center leading-relaxed">
                    Si tienes clave personal{" "}
                    <button
                      type="button"
                      onClick={() => setLoginOpen(true)}
                      className="font-semibold text-[#c28b17] underline decoration-[#c28b17]/60 underline-offset-4 hover:text-[#9e6d0a] hover:decoration-[#9e6d0a] transition-all cursor-pointer inline-block"
                    >
                      inicia sesión
                    </button>
                    .
                  </p>
                </>
              )}

              {/* Barra de búsqueda refinada */}
              <div className="relative w-full max-w-xl mx-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitSearch(heroQuery);
                  }}
                  className="w-full"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 h-12 sm:h-14 w-full rounded-full border border-input bg-card shadow-xs hover:shadow-sm focus-within:border-[#c28b17] focus-within:ring-2 focus-within:ring-[#c28b17]/20 transition-all pl-4 sm:pl-5 pr-1.5 sm:pr-2">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                    <input
                      value={heroQuery}
                      onChange={(e) => {
                        setHeroQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Ej: plato hondo 26 verde…"
                      className="flex-1 bg-transparent outline-none text-sm sm:text-base placeholder:text-muted-foreground/70 min-w-0"
                      aria-label="Buscar en el catálogo"
                    />
                    {heroQuery && (
                      <button
                        type="button"
                        onClick={() => setHeroQuery("")}
                        className="p-1.5 rounded-full hover:bg-accent text-muted-foreground cursor-pointer"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="rounded-full h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-medium bg-[#c28b17] hover:bg-[#b07b10] text-white shrink-0 transition-all shadow-xs cursor-pointer flex items-center justify-center self-center"
                    >
                      Buscar
                    </button>
                  </div>
                </form>


                {/* Sugerencias instantáneas */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute z-20 top-16 left-0 right-0 rounded-2xl border border-border bg-popover shadow-xl overflow-hidden text-left">
                    {searchSuggestions.map((s) => (
                      <button
                        key={s.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          openProduct(s.slug);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-accent/60 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#f7f3ec] shrink-0">
                          {s.image && (
                            <img src={s.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate text-foreground">{s.nameEs}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {s.collection} {s.diameter ? `· Ø${s.diameter}cm` : ""}
                          </p>
                        </div>
                      </button>
                    ))}
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        submitSearch(heroQuery);
                      }}
                      className="w-full px-4 py-2 text-[12px] text-[#c28b17] hover:bg-accent/60 border-t border-border flex items-center gap-2 justify-center font-medium"
                    >
                      Ver todos los resultados ({searchSuggestions.length === 6 ? "más" : ""})
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* ═══ Botones de categoría ═══ */}
              <div className="flex flex-wrap justify-center items-center gap-2 mt-6 w-full max-w-2xl mx-auto">
                {CATEGORY_BUTTONS.map((cat) => {
                  const count = cat.grupo
                    ? products?.filter((p) => p.pieceGroup === cat.grupo).length || 0
                    : products?.filter((p) => p.productType === cat.tipo).length || 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.label}
                      onClick={() =>
                        goClean({
                          view: "catalogo",
                          grupo: cat.grupo || undefined,
                          tipo: cat.tipo || undefined,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-4 h-8.5 rounded-full text-[13px] font-medium border border-border/80 bg-card text-foreground transition-all hover:border-[#c28b17] hover:text-[#c28b17] shadow-xs cursor-pointer"
                      title={`${cat.label} · ${count} piezas`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[11px] text-muted-foreground/80 font-normal">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* ═══ Gama de colores ampliada ═══ */}
              {products && (
                <div className="mt-5 w-full max-w-2xl mx-auto">
                  <div className="flex items-center justify-center gap-3 mb-2.5">
                    <span className="h-px w-8 bg-border" />
                    <p className="eyebrow text-xs text-muted-foreground">
                      Filtra por color y acabado
                    </p>
                    <span className="h-px w-8 bg-border" />
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-1.5 w-full mx-auto">
                    {TONE_ORDER.map((toneKey) => {
                      const count = toneCounts.get(toneKey) || 0;
                      if (count === 0) return null;
                      const isFinish = TONE_FINISH.includes(toneKey);
                      return (
                        <button
                          key={toneKey}
                          onClick={() =>
                            goClean({
                              view: "catalogo",
                              color: toneKey,
                              q: heroQuery.trim() || undefined,
                            })
                          }
                          title={`${TONE_LABELS[toneKey]} · ${count} piezas`}
                          className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-border bg-card text-[12px] text-muted-foreground hover:border-[#c28b17] hover:text-foreground hover:shadow-xs transition-all cursor-pointer ${
                            isFinish ? "border-dashed border-[#c28b17]/50" : ""
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                            style={{ background: TONE_DOTS[toneKey] }}
                          />
                          <span>{TONE_LABELS[toneKey]?.split(" /")[0]}</span>
                          <span className="text-[10px] text-muted-foreground/70">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Estado sin piezas publicadas: catálogo en preparación */}
            {products && products.length === 0 && (
              <div className="max-w-2xl mx-auto px-4 pb-10">
                <div className="rounded-2xl border border-dashed border-[#c28b17]/40 bg-card p-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#f6e9c8] flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-[#c28b17]" />
                  </div>
                  <p className="font-display text-2xl font-medium text-foreground">
                    Catálogo en preparación
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto">
                    Estamos seleccionando las piezas que se exhibirán aquí. Muy pronto vas a
                    poder explorar la colección completa de vajillas BasKula.
                  </p>
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-5 px-5 h-10 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Consultar por WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Secciones personalizadas del cliente */}
            {clientInfo && curatedItems.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-border/60">
                <SectionTitle
                  title="Preparado para ti"
                  subtitle={`Una selección especial armada para ${clientInfo.name}`}
                />
                <ProductGrid
                  products={curatedItems}
                  onOpen={openProduct}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  compact
                />
              </section>
            )}

            {clientInfo && favPreview.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-border/60">
                <SectionTitle
                  title="Tus favoritos guardados"
                  subtitle="Continúa donde lo dejaste"
                  action={
                    <button
                      onClick={() => goClean({ view: "favoritos" })}
                      className="text-sm text-[#c28b17] hover:underline"
                    >
                      Ver lista completa →
                    </button>
                  }
                />
                <ProductGrid
                  products={favPreview}
                  onOpen={openProduct}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  compact
                />
              </section>
            )}

            {clientInfo && suggestionItems.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 border-t border-border/60">
                <SectionTitle
                  title="También te puede gustar"
                  subtitle="Basado en tus piezas guardadas"
                />
                <ProductGrid
                  products={suggestionItems}
                  onOpen={openProduct}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  compact
                />
              </section>
            )}

            {/* Tiles por tipo de pieza */}
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 border-t border-border/60 flex flex-col items-center">
              <SectionTitle
                title="Explora por tipo de pieza"
                subtitle="Del plato llano a la vajilla completa"
              />
              <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {Object.entries(PIECE_GROUP_INFO).map(([key, info]) => {
                  const count = products?.filter((p) => p.pieceGroup === key).length || 0;
                  if (count === 0) return null;
                  const sample = products?.find((p) => p.pieceGroup === key && p.image);
                  return (
                    <button
                      key={key}
                      onClick={() => goClean({ view: "catalogo", grupo: key })}
                      className="group relative rounded-2xl overflow-hidden border border-border bg-card hover:shadow-[0_6px_24px_rgba(34,34,34,0.10)] hover:border-[#c28b17]/40 transition-all text-center cursor-pointer flex flex-col"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-[#f7f3ec] w-full">
                        {sample?.image && (
                          <img
                            src={sample.image}
                            alt={info.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="p-3 sm:p-3.5 text-center flex flex-col items-center justify-center flex-1">
                        <p className="font-medium text-[13px] sm:text-[14px] text-foreground text-center">{info.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 text-center leading-snug">
                          {count} productos · {info.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Navegación rápida por diámetro */}
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-16 flex flex-col items-center">
              <SectionTitle
                title="Búsqueda rápida por diámetro"
                subtitle="La medida exacta que tu cocina necesita"
              />
              <div className="flex flex-wrap justify-center items-center gap-2 max-w-3xl mx-auto w-full">
                {DIAM_RANGES.map((r) => {
                  const count =
                    products?.filter(
                      (p) =>
                        p.diameter !== null &&
                        p.diameter >= r.min &&
                        p.diameter < (r.max === 999 ? 999 : r.max)
                    ).length || 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={r.key}
                      onClick={() => goClean({ view: "catalogo", diam: r.key })}
                      className="inline-flex items-center gap-1.5 px-4 h-8.5 rounded-full border border-border/80 bg-card hover:border-[#c28b17] hover:text-[#c28b17] transition-all text-[13px] font-medium shadow-xs cursor-pointer"
                    >
                      <span>{r.label}</span>
                      <span className="text-muted-foreground text-[11px] font-normal">({count})</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {view === "catalogo" && (
          <FilterPanel
            products={products || []}
            onOpen={openProduct}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onGo={go}
          />
        )}

        {view === "favoritos" && (
          <FavoritesView
            client={clientInfo}
            whatsapp={whatsapp}
            onOpen={openProduct}
            onRefreshCount={setFavoritesCount}
            curated={curatedItems}
            suggestions={suggestionItems}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onRemoveFavorite={removeFavoriteFromSet}
            onLogout={handleLogout}
            onOpenLogin={() => setLoginOpen(true)}
          />
        )}
      </main>

      {/* ══════════ FOOTER BAS KULA (Minimalist & Modern) ══════════ */}
      <footer className="w-full bg-[#222222] text-[#faf8f5] mt-auto border-t border-white/10 py-5 sm:py-6 px-4 sm:px-8 z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-center text-center md:text-left">
            {/* Columna 1: Brand, Logo y Slogan */}
            <div className="flex flex-col items-center md:items-start gap-1.5">
              <a href="https://baskula.netlify.app" className="inline-block hover:opacity-85 transition-opacity">
                <img
                  src="/images/logo-white.png"
                  alt="BasKula Logo"
                  className="h-7 sm:h-8 w-auto object-contain"
                />
              </a>
              <p className="text-[11px] text-[#faf8f5]/45 font-serif2 italic tracking-wide">
                Elegí. Pesá. Llevate lo que te enamora.
              </p>
            </div>

            {/* Columna 2: Links minimalistas limpios */}
            <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-6 text-[11px] uppercase tracking-[1.5px] font-medium text-[#faf8f5]/65">
              <a href="https://baskula.netlify.app" className="hover:text-[#e2a727] transition-colors">Inicio</a>
              <button
                onClick={() => goClean({ view: "catalogo" })}
                className="hover:text-[#e2a727] transition-colors cursor-pointer uppercase tracking-[1.5px]"
              >
                Catálogo B2B
              </button>
              <a href="https://baskula.netlify.app/#servicios" className="hover:text-[#e2a727] transition-colors">Servicios</a>
              <a href="https://baskula.netlify.app/#contacto" className="hover:text-[#e2a727] transition-colors">Contacto</a>
            </div>

            {/* Columna 3: Copyright prolijo */}
            <div className="text-center md:text-right text-[11px] text-[#faf8f5]/45 leading-relaxed">
              &copy; {new Date().getFullYear()} BasKula. Todos los derechos reservados.
              <br className="hidden md:inline" />
              <span className="opacity-80"> Diseñado con ❤️ para conectar.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════ VENTANA INICIA SESIÓN ══════════ */}
      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        whatsapp={whatsapp}
      />

      {/* ══════════ MODAL DE PRODUCTO ══════════ */}
      {selectedProductSlug && (
        <ProductModal
          slug={selectedProductSlug}
          client={clientInfo}
          isFavorite={(id) => favorites.has(id)}
          onToggleFavorite={toggleFavorite}
          onClose={closeProduct}
          whatsapp={whatsapp}
        />
      )}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center mb-6 max-w-2xl mx-auto">
      <h2 className="font-display text-2xl sm:text-3xl font-medium text-foreground text-center">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1 font-serif2 italic text-center">{subtitle}</p>}
      {action && <div className="mt-2 text-center">{action}</div>}
    </div>
  );
}
