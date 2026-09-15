"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/api-client";
import { clearDetailCache } from "@/lib/detail-cache";
import type { AdminCatalogProduct } from "@/lib/types";
import {
  COLLECTION_LABELS,
  COLOR_LABELS,
} from "@/lib/types";
import {
  Loader2,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  Package,
  Layers,
  Ruler,
  FileText,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";

interface ProductEditDialogProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: AdminCatalogProduct) => void;
}

export default function ProductEditDialog({
  productId,
  isOpen,
  onClose,
  onSuccess,
}: ProductEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Datos del producto
  const [id, setId] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");

  // Tab 1: Datos principales
  const [nameEs, setNameEs] = useState("");
  const [productTypeLabel, setProductTypeLabel] = useState("");
  const [collection, setCollection] = useState("");
  const [line, setLine] = useState("");
  const [colorBase, setColorBase] = useState("");
  const [material, setMaterial] = useState("");

  // Tab 2: Dimensiones y especificaciones
  const [diameter, setDiameter] = useState("");
  const [height, setHeight] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pieces, setPieces] = useState("");
  const [reference, setReference] = useState("");
  const [boxComposition, setBoxComposition] = useState("");
  const [packWeight, setPackWeight] = useState("");
  const [packDim, setPackDim] = useState("");

  // Tab 3: Textos y cuidados
  const [descriptionEs, setDescriptionEs] = useState("");
  const [careEs, setCareEs] = useState("");
  const [infoEs, setInfoEs] = useState("");

  // Tab 4: Publicación y disponibilidad
  const [published, setPublished] = useState(false);
  const [available, setAvailable] = useState(true);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (!isOpen || !productId) return;
    setLoading(true);

    adminFetch(`/api/admin/products/${productId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Error al obtener producto");
        const json = await res.json();
        const p = json.product;
        if (!p) throw new Error("Producto no encontrado");

        setId(p.id || "");
        setSlug(p.slug || "");
        setNameEs(p.nameEs || "");
        setProductTypeLabel(p.productTypeLabel || "");
        setCollection(p.collection || "");
        setLine(p.line || "");
        setColorBase(p.colorBase || "");
        setMaterial(p.material || "");
        setDiameter(p.diameter !== null && p.diameter !== undefined ? String(p.diameter) : "");
        setHeight(p.height !== null && p.height !== undefined ? String(p.height) : "");
        setCapacity(p.capacity !== null && p.capacity !== undefined ? String(p.capacity) : "");
        setPieces(p.pieces !== null && p.pieces !== undefined ? String(p.pieces) : "1");
        setReference(p.reference || "");
        setBoxComposition(p.boxComposition || "");
        setPackWeight(p.packWeight || "");
        setPackDim(p.packDim || "");
        setDescriptionEs(p.descriptionEs || "");
        setCareEs(p.careEs || "");
        setInfoEs(p.infoEs || "");
        setPublished(Boolean(p.published));
        setAvailable(Boolean(p.available));

        let imgUrl = "";
        try {
          const imgs = p.images ? JSON.parse(p.images) : [];
          imgUrl = imgs[0]?.url || "";
        } catch {
          imgUrl = "";
        }
        setImage(imgUrl);
      })
      .catch((err) => {
        console.error("Error loading product detail:", err);
        toast({
          title: "Error de carga",
          description: "No se pudo cargar la información del producto.",
          variant: "destructive",
        });
        onClose();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, productId, onClose, toast]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!productId) return;
    if (!nameEs.trim()) {
      toast({
        title: "Nombre requerido",
        description: "El producto debe tener un nombre comercial.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nameEs: nameEs.trim(),
        productTypeLabel: productTypeLabel.trim() || null,
        collection: collection.trim() || null,
        line: line.trim() || null,
        colorBase: colorBase.trim() || null,
        material: material.trim() || null,
        diameter: diameter.trim() ? Number(diameter) : null,
        height: height.trim() ? Number(height) : null,
        capacity: capacity.trim() ? Math.round(Number(capacity)) : null,
        pieces: pieces.trim() ? Math.round(Number(pieces)) : null,
        reference: reference.trim() || null,
        boxComposition: boxComposition.trim() || null,
        packWeight: packWeight.trim() || null,
        packDim: packDim.trim() || null,
        descriptionEs: descriptionEs.trim() || null,
        careEs: careEs.trim() || null,
        infoEs: infoEs.trim() || null,
        published,
        available,
      };

      const res = await adminFetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar");
      }

      const resData = await res.json();
      const updatedPrisma = resData.product;

      // Invalidador de caché local para que la ficha pública se refresque de inmediato
      clearDetailCache(slug);

      // Notificación por storage / broadcast para pestañas abiertas
      try {
        localStorage.setItem("baskula_catalog_sync", Date.now().toString());
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("baskula-catalog-sync");
          bc.postMessage({ type: "sync", productId, slug });
          bc.close();
        }
      } catch {
        /* ignore */
      }

      // Objeto compacto compatible con AdminCatalogProduct para actualizar la vista sin recargar
      const updatedAdminItem: AdminCatalogProduct = {
        id: updatedPrisma.id,
        slug: updatedPrisma.slug,
        nameEs: updatedPrisma.nameEs,
        collection: updatedPrisma.collection || "",
        line: updatedPrisma.line || "",
        material: updatedPrisma.material || "",
        colorGroup: updatedPrisma.colorGroup || "",
        colorBase: updatedPrisma.colorBase || "",
        tone: updatedPrisma.tone || "",
        pieceGroup: updatedPrisma.pieceGroup || "",
        productType: updatedPrisma.productType || "",
        productTypeLabel: updatedPrisma.productTypeLabel || "",
        diameter: updatedPrisma.diameter,
        capacity: updatedPrisma.capacity,
        pieces: updatedPrisma.pieces,
        available: updatedPrisma.available,
        published: updatedPrisma.published,
        image,
        reference: updatedPrisma.reference || "",
      };

      onSuccess(updatedAdminItem);

      toast({
        title: "Ficha actualizada",
        description: `Los cambios en "${updatedPrisma.nameEs}" se guardaron exitosamente.`,
      });

      onClose();
    } catch (err: unknown) {
      console.error("Save product error:", err);
      toast({
        title: "Error al guardar",
        description: err instanceof Error ? err.message : "No se pudo actualizar la ficha.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const collectionOptions = Object.keys(COLLECTION_LABELS);
  const colorOptions = [
    "Blanco",
    "Crudo",
    "Gris",
    "Azul",
    "Verde",
    "Negro",
    "Terracota",
    "Arena",
    "Amarillo",
    "Naranja",
    "Rosa",
    "Multicolor",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-2xl">
        {/* Encabezado con preview */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-card via-[#faf8f5] to-card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border shadow-xs">
              {image ? (
                <img src={image} alt={nameEs} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  <Package className="w-6 h-6 opacity-40" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-[11px] text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border">
                  ID: {id || productId}
                </span>
                {reference && (
                  <span className="font-mono text-[11px] text-[#8b5a2b] bg-[#f6e9c8]/70 px-2 py-0.5 rounded-md border border-[#c28b17]/30">
                    Ref: {reference}
                  </span>
                )}
                {published ? (
                  <Badge className="bg-[#6e8058] hover:bg-[#6e8058] text-white text-[10px] gap-1">
                    <Eye className="w-3 h-3" /> Pública
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-[10px] gap-1">
                    <EyeOff className="w-3 h-3" /> Oculta
                  </Badge>
                )}
                {available ? (
                  <Badge variant="outline" className="text-[#6e8058] border-[#6e8058]/40 text-[10px]">
                    Disponible
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[#8b5a2b] border-[#8b5a2b]/40 text-[10px]">
                    No disponible
                  </Badge>
                )}
                {slug && (
                  <a
                    href={`/?p=${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#c28b17] hover:text-[#a6740f] hover:underline font-medium ml-auto bg-[#f6e9c8]/60 px-2.5 py-0.5 rounded-full border border-[#c28b17]/30"
                  >
                    Ver en web <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <DialogTitle className="text-lg md:text-xl font-medium tracking-tight truncate text-foreground">
                {nameEs || "Editar Ficha de Artículo"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Modifica especificaciones, textos y visibilidad de forma dinámica con guardado instantáneo.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Cuerpo del formulario con pestañas */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#c28b17]" />
            <p className="text-sm font-medium">Cargando ficha técnica...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
            <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-3 border-b border-border bg-card">
                <TabsList className="flex items-center gap-1.5 w-full h-auto p-1 bg-muted/60 rounded-xl border border-border/40">
                  <TabsTrigger
                    value="general"
                    className="flex-1 h-9 px-3 text-xs font-medium gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span>General</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="medidas"
                    className="flex-1 h-9 px-3 text-xs font-medium gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5 shrink-0" />
                    <span>Medidas</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="textos"
                    className="flex-1 h-9 px-3 text-xs font-medium gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>Textos</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="visibilidad"
                    className="flex-1 h-9 px-3 text-xs font-medium gap-1.5 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                    <span>Visibilidad</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Contenedor scrolleable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* ═══ TAB 1: DATOS PRINCIPALES ═══ */}
                <TabsContent value="general" className="mt-0 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nameEs" className="text-xs font-semibold text-foreground">
                      Nombre comercial (Español) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nameEs"
                      value={nameEs}
                      onChange={(e) => setNameEs(e.target.value)}
                      placeholder="Ej. Plato Llano Orgânico Blanco"
                      className="bg-background text-sm font-medium"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Es el título visible principal en las tarjetas del catálogo y en la ficha del producto.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="productTypeLabel" className="text-xs font-semibold text-foreground">
                        Tipo de pieza / Rótulo
                      </Label>
                      <Input
                        id="productTypeLabel"
                        value={productTypeLabel}
                        onChange={(e) => setProductTypeLabel(e.target.value)}
                        placeholder="Ej. Plato Llano, Bowl, Taza de Café, Bandeja..."
                        className="bg-background text-sm"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {["Plato Llano", "Plato Hondo", "Plato Postre", "Bowl", "Taza de Café", "Taza de Té", "Bandeja"].map(
                          (t) => (
                            <button
                              type="button"
                              key={t}
                              onClick={() => setProductTypeLabel(t)}
                              className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                            >
                              {t}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="collection" className="text-xs font-semibold text-foreground">
                        Colección
                      </Label>
                      <Input
                        id="collection"
                        value={collection}
                        onChange={(e) => setCollection(e.target.value)}
                        placeholder="Ej. AVANT GARDE, ESSENCIAS, HYGGE..."
                        className="bg-background text-sm"
                        list="collection-list"
                      />
                      <datalist id="collection-list">
                        {collectionOptions.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {["AVANT GARDE", "ESSENCIAS", "HYGGE", "PLATINUM", "EVERWHITE", "DAY BY DAY"].map((c) => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => setCollection(c)}
                            className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="line" className="text-xs font-semibold text-foreground">
                        Línea
                      </Label>
                      <Input
                        id="line"
                        value={line}
                        onChange={(e) => setLine(e.target.value)}
                        placeholder="Ej. ORGÂNICO, BIO, COUP..."
                        className="bg-background text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="colorBase" className="text-xs font-semibold text-foreground">
                        Color base
                      </Label>
                      <Input
                        id="colorBase"
                        value={colorBase}
                        onChange={(e) => setColorBase(e.target.value)}
                        placeholder="Ej. Blanco, Azul, Terracota..."
                        className="bg-background text-sm"
                        list="color-list"
                      />
                      <datalist id="color-list">
                        {colorOptions.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="material" className="text-xs font-semibold text-foreground">
                        Material
                      </Label>
                      <Input
                        id="material"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        placeholder="Ej. Stoneware, Loza..."
                        className="bg-background text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* ═══ TAB 2: MEDIDAS Y ESPECIFICACIONES ═══ */}
                <TabsContent value="medidas" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="diameter" className="text-xs font-semibold text-foreground">
                        Diámetro (cm)
                      </Label>
                      <Input
                        id="diameter"
                        type="number"
                        step="0.1"
                        value={diameter}
                        onChange={(e) => setDiameter(e.target.value)}
                        placeholder="Ej. 26.5"
                        className="bg-background text-sm font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="height" className="text-xs font-semibold text-foreground">
                        Altura (cm)
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="Ej. 3.0"
                        className="bg-background text-sm font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="capacity" className="text-xs font-semibold text-foreground">
                        Capacidad (ml)
                      </Label>
                      <Input
                        id="capacity"
                        type="number"
                        step="1"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        placeholder="Ej. 350"
                        className="bg-background text-sm font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="pieces" className="text-xs font-semibold text-foreground">
                        Piezas por juego
                      </Label>
                      <Input
                        id="pieces"
                        type="number"
                        step="1"
                        value={pieces}
                        onChange={(e) => setPieces(e.target.value)}
                        placeholder="1"
                        className="bg-background text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                      <Label htmlFor="reference" className="text-xs font-semibold text-foreground">
                        Referencia / Código
                      </Label>
                      <Input
                        id="reference"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Ej. 123456"
                        className="bg-background text-sm font-mono"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Identificador de referencia para pedidos y consultas por WhatsApp.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="boxComposition" className="text-xs font-semibold text-foreground">
                        Composición de caja
                      </Label>
                      <Input
                        id="boxComposition"
                        value={boxComposition}
                        onChange={(e) => setBoxComposition(e.target.value)}
                        placeholder="Ej. Caja con 6 unidades"
                        className="bg-background text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="packDim" className="text-xs font-semibold text-foreground">
                        Dimensiones de empaque
                      </Label>
                      <Input
                        id="packDim"
                        value={packDim}
                        onChange={(e) => setPackDim(e.target.value)}
                        placeholder="Ej. 30 x 30 x 15 cm"
                        className="bg-background text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="packWeight" className="text-xs font-semibold text-foreground">
                        Peso de empaque (kg)
                      </Label>
                      <Input
                        id="packWeight"
                        value={packWeight}
                        onChange={(e) => setPackWeight(e.target.value)}
                        placeholder="Ej. 4.8"
                        className="bg-background text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* ═══ TAB 3: TEXTOS Y CUIDADOS ═══ */}
                <TabsContent value="textos" className="mt-0 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="descriptionEs" className="text-xs font-semibold text-foreground">
                      Descripción del artículo
                    </Label>
                    <Textarea
                      id="descriptionEs"
                      value={descriptionEs}
                      onChange={(e) => setDescriptionEs(e.target.value)}
                      placeholder="Escribe una descripción comercial o artesanal del producto..."
                      rows={4}
                      className="bg-background text-sm leading-relaxed"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Se muestra en la sección principal del acordeón de la ficha pública.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="careEs" className="text-xs font-semibold text-foreground">
                      Uso y Cuidados
                    </Label>
                    <Textarea
                      id="careEs"
                      value={careEs}
                      onChange={(e) => setCareEs(e.target.value)}
                      placeholder="Instrucciones para microondas, lavavajillas, lavado y conservación..."
                      rows={3}
                      className="bg-background text-sm leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="infoEs" className="text-xs font-semibold text-foreground">
                      Detalles Artesanales / Información Técnica
                    </Label>
                    <Textarea
                      id="infoEs"
                      value={infoEs}
                      onChange={(e) => setInfoEs(e.target.value)}
                      placeholder="Detalles sobre el esmaltado reactivo, variaciones naturales de color o tono..."
                      rows={3}
                      className="bg-background text-sm leading-relaxed"
                    />
                  </div>
                </TabsContent>

                {/* ═══ TAB 4: VISIBILIDAD Y DISPONIBILIDAD ═══ */}
                <TabsContent value="visibilidad" className="mt-0 space-y-5">
                  <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="published-switch" className="text-sm font-semibold cursor-pointer text-foreground">
                          Publicado en el catálogo público
                        </Label>
                        {published ? (
                          <Badge className="bg-[#6e8058] text-white text-[10px]">Visible</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">Oculto</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Si está activo, el artículo aparecerá en la página principal y búsquedas para todos los visitantes.
                        Si está oculto, solo el administrador o clientes con recomendación directa podrán verlo.
                      </p>
                    </div>
                    <Switch
                      id="published-switch"
                      checked={published}
                      onCheckedChange={setPublished}
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="available-switch" className="text-sm font-semibold cursor-pointer text-foreground">
                          Disponible para compra / entrega
                        </Label>
                        {available ? (
                          <Badge variant="outline" className="text-[#6e8058] border-[#6e8058]/40 text-[10px]">
                            Disponible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[#8b5a2b] border-[#8b5a2b]/40 text-[10px]">
                            Consultar
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Si está inactivo, el artículo mostrará una etiqueta de &quot;No disponible / Consultar disponibilidad&quot;.
                      </p>
                    </div>
                    <Switch
                      id="available-switch"
                      checked={available}
                      onCheckedChange={setAvailable}
                    />
                  </div>

                  <div className="rounded-xl p-4 bg-[#f6e9c8]/40 border border-[#c28b17]/30 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#c28b17] shrink-0" />
                    <p className="text-xs text-foreground">
                      Cualquier cambio guardado se sincroniza en <strong>0 segundos</strong> en la base de datos y se actualiza instantáneamente en el catálogo.
                    </p>
                  </div>
                </TabsContent>
              </div>

              {/* Barra inferior de acciones */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-full px-5 text-xs"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || !nameEs.trim()}
                  className="rounded-full px-6 text-xs bg-[#c28b17] hover:bg-[#a6740f] text-white gap-1.5 shadow-sm font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </Tabs>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
