"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import {
  type ProductDetail,
  type CatalogProduct,
  COLLECTION_LABELS,
  COLOR_LABELS,
} from "@/lib/types";
import { Heart, Share2, MessageCircle, Sparkles, Pencil } from "lucide-react";
import { getCachedDetail, fetchDetail } from "@/lib/detail-cache";
import { getAdminPin, clearAdminPin } from "@/lib/api-client";
import ProductEditDialog from "@/components/admin/ProductEditDialog";

interface ProductModalProps {
  slug: string;
  client: { code: string; name: string } | null;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  whatsapp: string;
}

export default function ProductModal(props: ProductModalProps) {
  // key={slug} → el estado interno se reinicia en cada cambio de producto
  return <ProductModalInner key={props.slug} {...props} />;
}

function ProductModalInner({
  slug,
  client,
  isFavorite,
  onToggleFavorite,
  onClose,
  whatsapp,
}: ProductModalProps) {
  const router = useRouter();
  const [data, setData] = useState<ProductDetail | null>(() => getCachedDetail(slug)?.product ?? null);
  const [suggestions, setSuggestions] = useState<CatalogProduct[]>(
    () => getCachedDetail(slug)?.suggestions ?? []
  );
  const [loading, setLoading] = useState(!getCachedDetail(slug));
  const [error, setError] = useState("");
  const [imgIndex, setImgIndex] = useState(0);
  const [mainLoaded, setMainLoaded] = useState(false);
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);
  const isAdmin = !client && isVerifiedAdmin;
  const [showAdminEdit, setShowAdminEdit] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (client) return;
    const pin = getAdminPin();
    if (!pin) return;
    let active = true;
    fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    })
      .then((r) => {
        if (!active) return;
        if (r.ok) {
          setIsVerifiedAdmin(true);
        } else {
          setIsVerifiedAdmin(false);
          clearAdminPin();
        }
      })
      .catch(() => {
        if (active) setIsVerifiedAdmin(false);
      });

    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    let active = true;
    // Nota: si el slug ya está en caché, los inicializadores de useState
    // (arriba) ya poblaron data/suggestions con loading=false, y
    // fetchDetail() resuelve al instante desde la caché sin red.
    fetchDetail(slug).then((d) => {
      if (!active) return;
      if (!d) {
        setError(
          "Pieza no encontrada. Puede que ya no esté publicada o que el enlace sea incorrecto."
        );
      } else {
        setData(d.product);
        setSuggestions(d.suggestions || []);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [slug]);



  const shareProduct = () => {
    const url = `${window.location.origin}/?p=${slug}`;
    if (navigator.share) {
      navigator.share({ title: data?.nameEs || "Producto", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Enlace copiado", description: "Puedes pegarlo donde quieras." });
    }
  };

  const whatsappProduct = () => {
    if (!data) return;
    const clientStr = client
      ? `Soy *${client.name}* (código: ${client.code}).`
      : `Les escribo desde el catálogo web de BasKula:`;
    const refStr = data.reference ? ` [Ref: ${data.reference}]` : "";
    const colStr = data.collection ? ` (Colección ${data.collection.split(" - ")[0]})` : "";
    const specsStr = [
      data.diameter ? `Ø${data.diameter}cm` : null,
      data.capacity ? `${data.capacity}ml` : null,
      data.colorBase || null,
    ]
      .filter(Boolean)
      .join(" · ");

    const lines = [
      `Hola BasKula! 👋`,
      clientStr,
      ``,
      `Quisiera consultar disponibilidad y detalles sobre:`,
      `• *${data.nameEs}*${refStr}${colStr}`,
      specsStr ? `  _${specsStr}_` : "",
      ``,
      `¿Me podrían brindar información o cotización estimada?`,
    ]
      .filter(Boolean)
      .join("\n");

    const wa = whatsapp
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(lines)}`
      : `whatsapp://send?text=${encodeURIComponent(lines)}`;
    window.open(wa, "_blank");
  };

  const goToSuggestion = (sSlug: string) => {
    // Navegación SPA (sin recarga): cambia ?p= y el modal se reinicia
    const params = new URLSearchParams(window.location.search);
    params.set("p", sSlug);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const allImages = data
    ? [...data.images, ...data.moodImages.map((m) => ({ url: m, url1000: m }))]
    : [];
  const currentImage = allImages[imgIndex]?.url1000 || allImages[imgIndex]?.url || "";

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
      {/* Ficha a tamaño completo: w-[97vw] en móvil y 94vw / máx. 80rem
          (1280px) en escritorio, con altura fija de 94vh para que la
          galería y la columna de información se repartan la ventana.
          NOTA: se pasa sm:max-w-[80rem] explícito porque el DialogContent
          base incluye sm:max-w-lg (512px), que de otro modo ganaría a
          max-w-* base en ≥640px y dejaría la ficha diminuta. */}
      <DialogContent
        className="
          w-[97vw] sm:w-[94vw] max-w-[80rem] sm:max-w-[80rem]
          h-[92vh] md:h-[94vh] max-h-[92vh] md:max-h-[94vh]
          p-0 overflow-hidden bg-card gap-0 shadow-2xl flex flex-col
        "
      >
        <DialogTitle className="sr-only">
          {data?.nameEs || "Detalle de producto"}
        </DialogTitle>
        {/* Logo siempre visible: desde la ficha se puede volver al
            inicio en un clic (el header del sitio queda detrás del
            overlay, especialmente en móvil donde la ficha es 97vw) */}
        <button
          onClick={() => {
            onClose();
            router.push("/");
          }}
          aria-label="BasKula — volver al inicio"
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center px-2.5 sm:px-3 h-8 sm:h-9 rounded-full bg-white/95 backdrop-blur border border-border shadow-xs hover:opacity-90 transition-opacity"
        >
          <img src="/logo-baskula.png" alt="BasKula" className="h-5 sm:h-6 w-auto object-contain" />
        </button>
        {loading ? (
          <FichaSkeleton />
        ) : error ? (
          <div className="h-72 flex flex-col items-center justify-center gap-3 text-center px-6">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="font-medium">{error}</p>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        ) : data ? (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
            {/* ═══ Galería ═══ */}
            <div className="md:w-[52%] bg-[#f7f3ec] flex flex-col shrink-0 md:min-h-0">
              <div className="relative aspect-[4/3] max-h-[38vh] md:aspect-auto md:max-h-none md:flex-1 md:min-h-[280px] flex items-center justify-center p-3 sm:p-4 md:p-6">
                {!mainLoaded && <div className="absolute inset-8 skeleton-img rounded-xl" />}
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={data.nameEs}
                    onLoad={() => setMainLoaded(true)}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className={`relative max-w-full max-h-full object-contain rounded-lg transition-opacity duration-300 ${
                      mainLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif2 italic">
                    Sin imagen
                  </div>
                )}
                {!data.available && (
                  <div className="absolute bottom-5 left-5">
                    <Badge
                      variant="secondary"
                      className="bg-white/95 text-[#8b5a2b] border border-[#e2c9a8] shadow-sm"
                    >
                      Consultar disponibilidad
                    </Badge>
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto border-t border-border/60">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setImgIndex(i);
                        setMainLoaded(false);
                      }}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        i === imgIndex
                          ? "border-[#c28b17] shadow-sm"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      aria-label={`Ver imagen ${i + 1}`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ Info ═══ */}
            <div className="md:w-[48%] flex flex-col min-h-0">
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 pb-6">
                  {/* Título */}
                  <div className="text-center flex flex-col items-center">

                    <p className="eyebrow text-xs uppercase tracking-wider text-[#c28b17] mb-1.5 text-center">
                      {data.productTypeLabel}
                      {data.collection && ` · ${COLLECTION_LABELS[data.collection] || data.collection}`}
                    </p>
                    <h2 className="font-display text-2xl md:text-[1.75rem] font-medium leading-snug text-foreground text-center">
                      {data.nameEs}
                    </h2>
                    <div className="rule-mostaza w-14 h-[3px] rounded-full mt-2.5 mx-auto" />
                    {isAdmin && !client && (
                      <button
                        onClick={() => setShowAdminEdit(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-[#f6e9c8] text-[#8b5a2b] hover:bg-[#ebd8ab] border border-[#c28b17]/40 shadow-xs transition-colors cursor-pointer"
                        title="Editar ficha técnica como administrador"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#c28b17]" />
                        <span>Editar ficha (Admin)</span>
                      </button>
                    )}
                  </div>

                  {/* Specs clave */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Spec label="Diámetro" value={data.diameter ? `Ø ${data.diameter} cm` : "—"} />
                    <Spec label="Capacidad" value={data.capacity ? `${data.capacity} ml` : "—"} />
                    <Spec label="Material" value={data.material || "—"} />
                    <Spec
                      label={data.pieces && data.pieces > 1 ? "Piezas" : "Pieza"}
                      value={data.pieces ? `${data.pieces}` : "1"}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Spec label="Color" value={data.colorBase || COLOR_LABELS[data.colorGroup] || "—"} />
                    <Spec label="Línea" value={data.line || "—"} />
                  </div>

                  {/* Botones de acción desktop (en celular van fijos al pie) */}
                  <div className="hidden md:flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onToggleFavorite(data.id)}
                      className={`flex-1 h-8.5 rounded-full flex items-center justify-center gap-1.5 text-[12px] font-medium transition-all active:scale-[0.98] cursor-pointer shadow-xs ${
                        isFavorite(data.id)
                          ? "bg-foreground text-background"
                          : "border border-border/80 bg-card hover:border-[#c28b17] hover:text-[#c28b17]"
                      }`}
                      aria-pressed={isFavorite(data.id)}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isFavorite(data.id) ? "fill-[#e2a727] text-[#e2a727]" : ""
                        }`}
                      />
                      <span>{isFavorite(data.id) ? "En mi lista" : "Añadir a mi lista"}</span>
                    </button>
                    <button
                      onClick={shareProduct}
                      aria-label="Compartir"
                      className="w-8.5 h-8.5 shrink-0 rounded-full border border-border/80 bg-card flex items-center justify-center text-muted-foreground hover:border-[#c28b17] hover:text-[#c28b17] transition-colors shadow-xs cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    {whatsapp && (
                      <button
                        onClick={whatsappProduct}
                        className="h-8.5 px-3.5 rounded-full border border-border/80 bg-card flex items-center gap-1.5 text-[12px] font-medium hover:border-[#6e8058] hover:text-[#6e8058] transition-colors shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#6e8058]" />
                        <span>Consultar</span>
                      </button>
                    )}
                  </div>

                  {/* Información secundaria agrupada en un Acordeón limpio y compacto */}
                  <Accordion type="single" collapsible defaultValue="descripcion" className="w-full border-t border-border/60 pt-2">
                    {data.descriptionEs && (
                      <AccordionItem value="descripcion" className="border-b-border/60">
                        <AccordionTrigger className="text-[12px] uppercase tracking-wider text-[#c28b17] font-semibold py-2.5 hover:no-underline">
                          Descripción
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="prose-catalog text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: data.descriptionEs }} />
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {data.careEs && (
                      <AccordionItem value="cuidados" className="border-b-border/60">
                        <AccordionTrigger className="text-xs uppercase tracking-[0.14em] text-[#c28b17] font-semibold py-3">
                          Uso y Cuidados
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="prose-catalog text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: data.careEs }} />
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {data.infoEs && (
                      <AccordionItem value="info" className="border-b-border/60">
                        <AccordionTrigger className="text-xs uppercase tracking-[0.14em] text-[#c28b17] font-semibold py-3">
                          Detalles Artesanales
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="prose-catalog text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: data.infoEs }} />
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {(data.boxComposition || data.packWeight || data.packDim) && (
                      <AccordionItem value="empaque" className="border-b-border/60">
                        <AccordionTrigger className="text-xs uppercase tracking-[0.14em] text-[#c28b17] font-semibold py-3">
                          Datos Técnicos y Empaque
                        </AccordionTrigger>
                        <AccordionContent>
                          <table className="w-full text-xs">
                            <tbody>
                              {data.height && <Row label="Altura" value={`${data.height} cm`} />}
                              {data.boxComposition && (
                                <Row label="Composición de caja" value={data.boxComposition} />
                              )}
                              {data.packDim && <Row label="Dimensiones empaque" value={data.packDim} />}
                              {data.packWeight && <Row label="Peso empaque" value={`${data.packWeight} kg`} />}
                              {data.packType && <Row label="Tipo empaque" value={data.packType} />}
                            </tbody>
                          </table>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>

                  {/* Sugerencias: piezas similares */}
                  {suggestions.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c28b17] mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        También te puede gustar
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {suggestions.slice(0, 4).map((s) => (
                          <button
                            key={s.id}
                            onClick={() => goToSuggestion(s.slug)}
                            className="group text-left rounded-xl border border-border/70 overflow-hidden hover:border-[#c28b17]/50 hover:shadow-sm transition-all bg-card"
                          >
                            <div className="aspect-square bg-[#f7f3ec]">
                              {s.image ? (
                                <img
                                  src={s.image}
                                  alt={s.nameEs}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                                  Sin imagen
                                </div>
                              )}
                            </div>
                            <p className="text-[11px] leading-tight p-2 line-clamp-2">{s.nameEs}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        ) : null}

        {/* ═══ Barra de acciones fija abajo en celulares (Sticky Bottom) ═══ */}
        {data && (
          <div className="md:hidden sticky bottom-0 left-0 right-0 w-full bg-card/95 backdrop-blur-md border-t border-border/80 px-3 py-2.5 flex items-center gap-2 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] shrink-0">
            <button
              onClick={() => onToggleFavorite(data.id)}
              className={`flex-1 h-10 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs ${
                isFavorite(data.id)
                  ? "bg-foreground text-background"
                  : "border border-border/80 bg-card hover:border-[#c28b17] hover:text-[#c28b17]"
              }`}
              aria-pressed={isFavorite(data.id)}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite(data.id) ? "fill-[#e2a727] text-[#e2a727]" : ""
                }`}
              />
              <span>{isFavorite(data.id) ? "En mi lista" : "Añadir a mi lista"}</span>
            </button>
            {whatsapp && (
              <button
                onClick={whatsappProduct}
                className="h-10 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center gap-1.5 text-xs font-semibold active:scale-[0.98] transition-all shadow-xs cursor-pointer shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar</span>
              </button>
            )}
            <button
              onClick={shareProduct}
              aria-label="Compartir"
              className="w-10 h-10 shrink-0 rounded-full border border-border/80 bg-card flex items-center justify-center text-muted-foreground hover:border-[#c28b17] hover:text-[#c28b17] active:scale-[0.98] transition-colors shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {!client && isAdmin && showAdminEdit && data && (
      <ProductEditDialog
        productId={data.id}
        isOpen={showAdminEdit}
        onClose={() => setShowAdminEdit(false)}
        onSuccess={() => {
          fetchDetail(slug).then((d) => {
            if (d?.product) setData(d.product);
          });
        }}
      />
    )}
  </>
  );
}

// ── Sección plegable con estilo premium ──
function FichaSection({
  icon,
  title,
  children,
}: {
  icon: "care" | "info" | "tech";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-border/80 overflow-hidden">
      <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none hover:bg-[#f6e9c8]/40 text-sm font-medium list-none">
        <span className="w-1 h-4 rounded-full rule-mostaza" />
        {title}
        <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 pt-1 border-t border-border/60">{children}</div>
    </details>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <tr className="border-t border-border/70">
      <td className="px-4 py-2 text-muted-foreground">{label}</td>
      <td className={`px-4 py-2 ${mono ? "font-mono text-xs" : ""}`}>{value}</td>
    </tr>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#faf8f5] border border-border/70 p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
      <p className="text-[10px] uppercase tracking-wider text-[#c28b17] font-semibold text-center">{label}</p>
      <p className="text-[13px] font-medium mt-0.5 text-foreground text-center truncate max-w-full">{value}</p>
    </div>
  );
}

// ── Skeleton con la estructura real de la ficha (sin spinners) ──
function FichaSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:h-[94vh] overflow-y-auto md:overflow-hidden">
      <div className="md:w-[52%] bg-[#f7f3ec] p-4 md:p-6 shrink-0">
        <div className="aspect-square md:aspect-auto md:h-[calc(94vh-120px)] skeleton-img rounded-xl" />
        <div className="flex gap-2 mt-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-16 h-16 skeleton-img rounded-lg" />
          ))}
        </div>
      </div>
      <div className="md:w-1/2 p-6 md:p-8 space-y-5">
        <div className="h-4 w-24 skeleton-img rounded" />
        <div className="h-7 w-3/4 skeleton-img rounded" />
        <div className="w-14 h-[3px] rule-mostaza rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 skeleton-img rounded-xl" />
          ))}
        </div>
        <div className="h-11 w-full skeleton-img rounded-full" />
        <div className="space-y-2">
          <div className="h-3.5 w-full skeleton-img rounded" />
          <div className="h-3.5 w-11/12 skeleton-img rounded" />
          <div className="h-3.5 w-4/5 skeleton-img rounded" />
        </div>
        <div className="h-12 skeleton-img rounded-xl" />
        <div className="h-12 skeleton-img rounded-xl" />
      </div>
    </div>
  );
}
