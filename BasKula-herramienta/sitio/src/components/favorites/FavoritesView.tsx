"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Trash2,
  MessageCircle,
  Download,
  Share2,
  Package,
  Minus,
  Plus,
  Sparkles,
  Compass,
  LayoutGrid,
  Send,
  StickyNote,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { FavoriteItem, CatalogProduct } from "@/lib/types";
import { clientFetch } from "@/lib/api-client";
import ProductGrid from "@/components/catalog/ProductGrid";

interface FavoritesViewProps {
  client: { code: string; name: string } | null;
  whatsapp: string;
  onOpen: (slug: string) => void;
  onRefreshCount: (n: number) => void;
  /** Piezas que el asesor preparó para el cliente («Los recomendados para ti») */
  curated: CatalogProduct[];
  /** Sugerencias automáticas en base a los gustos del cliente */
  suggestions: CatalogProduct[];
  /** Corazones sincronizados con el resto del catálogo */
  favorites: Set<string>;
  onToggleFavorite: (productId: string) => void;
  /** Sincroniza el corazón cuando se quita una pieza desde esta lista */
  onRemoveFavorite: (productId: string) => void;
  /** Cerrar sesión de cliente */
  onLogout?: () => void;
  /** Abrir ventana de inicio de sesión */
  onOpenLogin?: () => void;
}

export default function FavoritesView({
  client,
  whatsapp,
  onOpen,
  onRefreshCount,
  curated,
  suggestions,
  favorites,
  onToggleFavorite,
  onRemoveFavorite,
  onLogout,
  onOpenLogin,
}: FavoritesViewProps) {
  const [items, setItems] = useState<FavoriteItem[] | null>(null);
  // Datos frescos del panel: llegan como props (login/página) y se
  // revalidan al abrir «Mi lista» y al marcar corazones
  const [curatedItems, setCuratedItems] = useState<CatalogProduct[]>(curated);
  const [suggestionItems, setSuggestionItems] = useState<CatalogProduct[]>(suggestions);

  // Notas del cliente para el asesor
  const [noteText, setNoteText] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [myNotes, setMyNotes] = useState<{ id: string; message: string; createdAt: string }[]>([]);

  const { toast } = useToast();
  const router = useRouter();
  const firstName = client ? client.name.split(" ")[0] : "";

  // Cargar las notas ya enviadas (feedback para el cliente)
  useEffect(() => {
    if (!client) return;
    let active = true;
    clientFetch("/api/client/notes")
      .then((r) => r.json())
      .then((data) => {
        if (active) setMyNotes(data.notes || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [client]);

  const sendNote = async () => {
    const message = noteText.trim();
    if (!message) {
      toast({
        title: "Escribí tu nota primero",
        description: "Contale a tu asesor lo que necesitás y luego enviala.",
      });
      return;
    }
    setSendingNote(true);
    try {
      const res = await clientFetch("/api/client/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          title: "No se pudo enviar",
          description: data?.error || "Intenta de nuevo en unos segundos.",
          variant: "destructive",
        });
        return;
      }
      const data = await res.json();
      setMyNotes((prev) => [data.note, ...prev]);
      setNoteText("");
      toast({
        title: "Nota enviada ✓",
        description: "Tu asesor la verá en su panel de administración.",
      });
    } catch {
      toast({
        title: "No se pudo enviar",
        description: "Revisa tu conexión e intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSendingNote(false);
    }
  };

  const load = useCallback(async () => {
    // La lista propia es la pieza crítica del panel
    try {
      const res = await clientFetch("/api/client/favorites");
      const data = await res.json();
      setItems(data.favorites || []);
      onRefreshCount((data.favorites || []).length);
    } catch {
      setItems([]);
      return;
    }
    // Recomendaciones y sugerencias: revalidación best-effort para que el
    // panel siempre muestre lo que el asesor preparó (aunque lo haya
    // agregado después del login del cliente)
    try {
      const res = await clientFetch("/api/client/home");
      const data = await res.json();
      if (data?.client) {
        setCuratedItems((data.curated as CatalogProduct[]) || []);
        setSuggestionItems((data.suggestions as CatalogProduct[]) || []);
      }
    } catch {
      /* opcional: se conservan los datos del login */
    }
  }, [onRefreshCount]);

  // Carga inicial inmediata + revalidación (debounce 700 ms) cada vez que
  // el cliente marca o desmarca un corazón: su lista y las sugerencias
  // reflejan sus gustos al momento.
  const firstRun = useRef(true);
  useEffect(() => {
    if (!client) return;
    const delay = firstRun.current ? 0 : 700;
    firstRun.current = false;
    const t = setTimeout(load, delay);
    return () => clearTimeout(t);
  }, [client, favorites, load]);

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) quantity = 1;
    setItems((prev) =>
      prev ? prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)) : prev
    );
    await clientFetch("/api/client/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
  };

  const removeItem = async (productId: string) => {
    setItems((prev) => (prev ? prev.filter((i) => i.productId !== productId) : prev));
    onRefreshCount((items?.length || 1) - 1);
    // Mantener el corazón sincronizado en el resto del catálogo
    onRemoveFavorite(productId);
    await clientFetch(`/api/client/favorites?productId=${productId}`, { method: "DELETE" });
  };

  const buildMessage = () => {
    const lines: string[] = [];
    lines.push(`Hola BasKula! 👋`);
    if (client) {
      lines.push(`Soy *${client.name}* (código: ${client.code}).`);
    } else {
      lines.push(`Les comparto mi lista de interés del catálogo:`);
    }
    lines.push(`Estuve revisando el catálogo y me interesan las siguientes ${items?.length || 0} referencias:`);
    lines.push("");

    items?.forEach((i, idx) => {
      const specs = [
        i.diameter ? `Ø${i.diameter}cm` : null,
        i.pieces && i.pieces > 1 ? `${i.pieces} pzas` : null,
        i.collection ? i.collection.split(" - ")[0] : null,
        i.available ? "Disponible" : "Consultar stock",
      ]
        .filter(Boolean)
        .join(" · ");
      const qtyStr = i.quantity > 1 ? ` (x${i.quantity})` : "";
      lines.push(`${idx + 1}. *${i.nameEs}*${qtyStr}`);
      if (specs) lines.push(`   _${specs}_`);
    });

    lines.push("");
    lines.push(`Total: *${items?.length || 0} referencias* seleccionadas.`);
    lines.push(`¿Me podrían ayudar con la disponibilidad y presupuesto estimado?`);
    return lines.join("\n");
  };

  const shareWhatsApp = async () => {
    // Registrar la lista compartida (para el panel del administrador)
    await clientFetch("/api/shared-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `Lista compartida vía WhatsApp (${items?.length} piezas)` }),
    }).catch(() => {});

    const text = encodeURIComponent(buildMessage());
    const url = whatsapp ? `https://wa.me/${whatsapp}?text=${text}` : `whatsapp://send?text=${text}`;
    window.open(url, "_blank");
    toast({
      title: "Lista enviada a WhatsApp",
      description: "Tu asesor recibirá tus piezas de interés.",
    });
  };

  // ═══════ Descargar la lista como PDF ═══════
  // Documento prolijo con las piezas, cantidades y disponibilidad — SIN
  // códigos de artículo (el cliente no los ve). La descarga queda
  // registrada en la actividad que ve el admin desde su panel.
  const downloadPdf = async () => {
    if (!client || !items || items.length === 0) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = 210;
      const M = 16; // margen

      // Encabezado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(34, 34, 34);
      doc.text("BasKula", M, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Catálogo gastronómico · ${new Date().toLocaleDateString("es", { dateStyle: "long" })}`,
        W - M,
        18,
        { align: "right" }
      );
      doc.setDrawColor(194, 139, 23);
      doc.setLineWidth(0.8);
      doc.line(M, 22, W - M, 22);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(34, 34, 34);
      doc.text("Mi lista de interés", M, 32);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Cliente: ${client.name}  ·  Código: ${client.code}`, M, 38.5);

      let y = 48;
      const ensureSpace = (needed: number) => {
        if (y + needed > 278) {
          doc.addPage();
          y = 20;
        }
      };

      items.forEach((item, idx) => {
        const nameLines: string[] = doc.splitTextToSize(item.nameEs, W - 2 * M - 40);
        const blockH = 8 + nameLines.length * 5.5 + 12;
        ensureSpace(blockH);

        // Número y nombre
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(194, 139, 23);
        doc.text(`${idx + 1}.`, M, y);
        doc.setFontSize(10.5);
        doc.setTextColor(34, 34, 34);
        nameLines.forEach((line, li) => doc.text(line, M + 7, y + li * 5.5));

        // Cantidad a la derecha
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.text(`×${item.quantity}`, W - M, y, { align: "right" });
        y += nameLines.length * 5.5 + 3;

        // Especificaciones
        const specs = [
          item.productTypeLabel,
          item.diameter ? `Ø ${item.diameter} cm` : null,
          item.pieces && item.pieces > 1 ? `${item.pieces} pzas` : null,
          item.collection,
        ]
          .filter(Boolean)
          .join("  ·  ");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text(specs, M + 7, y);
        y += 5.5;

        // Disponibilidad
        if (item.available) {
          doc.setTextColor(46, 125, 50);
          doc.text("Disponible", M + 7, y);
        } else {
          doc.setTextColor(139, 90, 43);
          doc.text("Consultar disponibilidad", M + 7, y);
        }
        y += 5;

        // Divisor suave
        doc.setDrawColor(230, 224, 214);
        doc.setLineWidth(0.3);
        doc.line(M, y, W - M, y);
        y += 7;
      });

      // Pie del documento
      ensureSpace(18);
      doc.setDrawColor(194, 139, 23);
      doc.setLineWidth(0.6);
      doc.line(M, y, W - M, y);
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(34, 34, 34);
      doc.text(
        `Total: ${items.length} ${items.length === 1 ? "referencia" : "referencias"}`,
        M,
        y
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text("Los precios se gestionan por canal comercial.", M, y + 5);

      // Numeración de páginas
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`${i} / ${pages}`, W / 2, 291, { align: "center" });
      }

      const date = new Date().toISOString().slice(0, 10);
      doc.save(`mi-lista-baskula-${client.code}-${date}.pdf`);

      // Registrar la descarga en la actividad (best-effort)
      clientFetch("/api/client/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "download" }),
      }).catch(() => {});

      toast({
        title: "Lista descargada",
        description: "Guardamos tu lista de interés como archivo PDF.",
      });
    } catch {
      toast({
        title: "No se pudo generar el PDF",
        description: "Revisa tu conexión e intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  // ═══════ ESTADOS ═══════
  if (!client) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Heart className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
        <h1 className="font-display text-3xl font-medium mb-3">Tu lista de interés</h1>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Para ver tu lista personalizada, recomendaciones de tu asesor y tus piezas guardadas, ingresá con tu código de cliente.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
          {onOpenLogin && (
            <Button
              onClick={onOpenLogin}
              className="h-10 px-6 rounded-full bg-[#c28b17] hover:bg-[#b07b10] text-white text-[13px] font-medium gap-2 shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar mi código de cliente</span>
            </Button>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola, quiero mi código de cliente para el catálogo.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-[#25D366] text-white text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Solicitar código por WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Cargando tu lista…
      </div>
    );
  }

  // ═══════ PANEL DEL CLIENTE ═══════
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8" id="print-area">
      {/* Encabezado (siempre visible en print) */}
      <div className="mb-6 text-center flex flex-col items-center">
        <p className="text-xs uppercase tracking-[0.14em] text-[#c28b17] font-semibold mb-1 text-center inline-flex items-center justify-center gap-2">
          <span>{client.name} · Código {client.code}</span>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-[11px] font-normal lowercase tracking-normal text-muted-foreground hover:text-destructive underline cursor-pointer ml-1"
              title="Cerrar sesión de cliente"
            >
              (cerrar sesión)
            </button>
          )}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-medium text-foreground text-center">Mi lista de interés</h1>
        <p className="text-muted-foreground text-sm mt-1.5 text-center">
          {items.length === 0
            ? "Piezas que marques con el corazón ♡"
            : `${items.length} ${items.length === 1 ? "referencia" : "referencias"} · ${new Date().toLocaleDateString("es", { dateStyle: "long" })}`}
        </p>
      </div>

      {/* Acciones (ocultas en print) */}
      {items.length > 0 && (
        <div className="flex flex-wrap justify-center items-center gap-2 mb-6 no-print">
          <Button onClick={shareWhatsApp} className="h-8.5 px-3.5 rounded-full bg-[#25D366] hover:bg-[#25D366]/90 text-white text-[12px] font-medium gap-1.5 shadow-xs cursor-pointer">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Enviar por WhatsApp</span>
          </Button>
          <Button variant="outline" onClick={downloadPdf} className="h-8.5 px-3.5 rounded-full text-[12px] font-medium gap-1.5 border-border/80 shadow-xs cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("?view=catalogo")}
            className="h-8.5 px-3.5 rounded-full text-[12px] font-medium gap-1.5 border-border/80 shadow-xs cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Explorar catálogo</span>
          </Button>
        </div>
      )}

      {/* ═══ Mi lista: piezas que el cliente marcó con el corazón ═══ */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.productId}
              className="flex gap-3.5 p-3 sm:p-3.5 rounded-2xl border border-border bg-card hover:border-[#c28b17]/40 transition-colors"
            >
              {/* Número e imagen */}
              <div className="relative shrink-0">
                <span className="absolute top-1 left-1 z-10 w-5 h-5 rounded-full bg-[#c28b17] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {idx + 1}
                </span>
                <button
                  onClick={() => onOpen(item.slug)}
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-[#f7f3ec] block cursor-pointer"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.nameEs}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <button onClick={() => onOpen(item.slug)} className="text-left w-full cursor-pointer">
                  <h3 className="font-medium text-[13px] sm:text-[14px] leading-snug hover:text-[#c28b17] transition-colors line-clamp-2 text-foreground">
                    {item.nameEs}
                  </h3>
                </button>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                  {item.productTypeLabel && <span>{item.productTypeLabel}</span>}
                  {item.diameter && <span>· Ø{item.diameter}cm</span>}
                  {item.pieces && item.pieces > 1 && <span>· {item.pieces} pzas</span>}
                  {item.collection && <span>· {item.collection}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {item.available ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-medium h-5">
                      Disponible
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] font-medium h-5">
                      Consultar disponibilidad
                    </Badge>
                  )}
                </div>
              </div>

              {/* Cantidad + eliminar (ocultos en print) */}
              <div className="flex flex-col justify-between items-end gap-2 no-print">
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  aria-label="Eliminar"
                  title="Eliminar de mi lista"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center border border-input rounded-lg bg-card overflow-hidden shadow-2xs">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-6.5 h-6.5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                    aria-label="Menos"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-[12px] font-semibold text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-6.5 h-6.5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                    aria-label="Más"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-print rounded-2xl border border-dashed border-border bg-card/50 p-8 sm:p-10 text-center mb-4">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-display text-xl font-medium">Tu lista está vacía</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            Explora el catálogo y toca el corazón ♡ en las piezas que te interesen. Después
            comparte tu lista con un solo clic.
          </p>
          <Button size="lg" className="mt-5" onClick={() => router.push("?view=catalogo")}>
            <LayoutGrid className="w-4 h-4" />
            Explorar catálogo completo
          </Button>
        </div>
      )}

      {/* ═══ Los recomendados para ti: piezas que su asesor le eligió ═══ */}
      {curatedItems.length > 0 && (
        <section id="recomendados" className="mt-12 pt-8 border-t border-border/60 no-print">
          <div className="mb-5">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#c28b17] mb-2 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Tu asesor las eligió para ti
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
              Los recomendados para ti
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-serif2 italic">
              Una selección especial preparada para {firstName}
            </p>
          </div>
          <ProductGrid
            products={curatedItems}
            onOpen={onOpen}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            compact
          />
          <p className="text-xs text-muted-foreground mt-4">
            Toca el corazón ♡ en cualquiera de estas piezas para sumarla a tu lista de interés.
          </p>
        </section>
      )}

      {/* ═══ Sugerencias en base a sus gustos ═══ */}
      {suggestionItems.length > 0 && (
        <section id="sugerencias" className="mt-12 pt-8 border-t border-border/60 no-print">
          <div className="mb-5">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#c28b17] mb-2 font-semibold">
              <Compass className="w-3.5 h-3.5" />
              En base a tus gustos
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-medium text-foreground">
              También te puede gustar
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-serif2 italic">
              Piezas del catálogo que combinan con lo que elegiste
            </p>
          </div>
          <ProductGrid
            products={suggestionItems}
            onOpen={onOpen}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            compact
          />
        </section>
      )}

      {/* Nota informativa */}
      <div className="mt-8 rounded-2xl border border-border bg-accent/40 p-4 sm:p-5 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <Share2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
          <span>
            Al enviar tu lista por WhatsApp, tu asesor recibirá las referencias con tu código de
            cliente <strong className="text-foreground">{client.code}</strong> y podrá prepararte una
            cotización personalizada. Los precios se gestionan por canal comercial.
          </span>
        </p>
      </div>

      {/* ═══ Dejar una nota al asesor ═══ */}
      <section className="mt-8 rounded-2xl border border-[#c28b17]/30 bg-[#fdf8ec] p-5 sm:p-6 no-print">
        <div className="flex items-center gap-2 mb-2">
          <StickyNote className="w-5 h-5 text-[#c28b17]" />
          <h2 className="font-display text-xl sm:text-2xl font-medium text-foreground">
            ¿Querés decirle algo a tu asesor?
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Dejale una nota con lo que necesites: consultas sobre piezas, cantidades, plazos o
          cualquier detalle para tu pedido. La verá en su panel de administración.
        </p>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Ej: Hola! Me interesan 3 juegos de platos llanos, ¿tienen disponibilidad para fin de mes?"
          rows={4}
          maxLength={2000}
          aria-label="Nota para tu asesor"
          className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#c28b17] focus:ring-2 focus:ring-[#c28b17]/20 transition-all resize-y"
        />
        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <span className="text-xs text-muted-foreground">{noteText.length}/2000</span>
          <Button
            onClick={sendNote}
            disabled={sendingNote}
            className="gap-2"
            aria-label="Enviar nota al asesor"
          >
            {sendingNote ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-background/40 border-t-background animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar nota
              </>
            )}
          </Button>
        </div>

        {myNotes.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#c28b17]/20">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-3 font-semibold">
              Tus notas enviadas
            </p>
            <div className="space-y-2">
              {myNotes.slice(0, 5).map((n) => (
                <div key={n.id} className="rounded-xl bg-card border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    ✓ Enviada el{" "}
                    {new Date(n.createdAt).toLocaleDateString("es", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
