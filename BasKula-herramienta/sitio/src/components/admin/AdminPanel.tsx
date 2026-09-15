"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Lock, Users, Activity, Settings, Plus, Copy, Check, Trash2, ExternalLink,
  Heart, Package, Eye, EyeOff, LogOut, RefreshCw, Link2, Pencil, AlertTriangle,
  MessageSquare, LogIn, Download, HeartPlus, HeartMinus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { adminFetch, setAdminPin, clearAdminPin, normalizeClientCode } from "@/lib/api-client";
import FullCatalogView, { type PublishCounts } from "./FullCatalogView";
import ProductPicker from "./ProductPicker";

// ═══════════════════ TIPOS ═══════════════════
interface AdminClient {
  id: string;
  code: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  notes?: string | null;
  active: boolean;
  visitCount: number;
  lastVisit?: string | null;
  adminLastSeen?: string | null;
  hasNewNote?: boolean;
  hasNewFavorite?: boolean;
  newNotesCount?: number;
  newFavoritesCount?: number;
  createdAt: string;
  favoritesCount: number;
  curatedCount: number;
  sharedListsCount: number;
  visitsCount: number;
  notesCount: number;
  clientNotes: {
    id: string;
    message: string;
    createdAt: string;
  }[];
  favorites: {
    productId: string;
    nameEs: string;
    slug: string;
    collection: string;
    quantity: number;
    addedAt: string;
    image: string;
    published: boolean;
  }[];
  curated: {
    productId: string;
    nameEs: string;
    slug: string;
    collection: string;
    sort: number;
    image: string;
    published: boolean;
    available: boolean;
  }[];
}

interface ActivityEvent {
  id: string;
  clientName: string;
  clientCode: string;
  type: string; // login | fav_add | fav_remove | note | download
  detail?: string | null;
  createdAt: string;
}

interface ActivitySummaryRow {
  id: string;
  name: string;
  code: string;
  active: boolean;
  logins: number;
  favorites: number;
  favAdds: number;
  favRemoves: number;
  notes: number;
  downloads: number;
  lastVisit?: string | null;
  lastEvent?: string | null;
}

interface ActivityData {
  events: ActivityEvent[];
  summary: ActivitySummaryRow[];
  sharedLists: {
    id: string;
    clientName: string;
    clientCode: string;
    message?: string | null;
    itemCount: number;
    createdAt: string;
    items: {
      nameEs: string;
      slug: string;
      quantity: number;
      image: string;
      reference: string;
      collection: string;
      productTypeLabel: string;
      diameter?: number | null;
      pieces?: number | null;
      colorBase: string;
    }[];
  }[];
  stats: {
    clients: number;
    totalFavorites: number;
    totalSharedLists: number;
    logins: number;
    downloads: number;
  };
}

// ═══════════════════ PANEL PRINCIPAL ═══════════════════
export default function AdminPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  // Vista «Catálogo completo» (botón grande) + contadores de publicación
  const [showCatalog, setShowCatalog] = useState(false);
  const [pubCounts, setPubCounts] = useState<PublishCounts | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar sesión existente (cookie o PIN en localStorage: la
    // sesión sobrevive a navegar por el catálogo y a cerrar el navegador)
    adminFetch("/api/admin/clients")
      .then((r) => {
        setAuthed(r.ok);
      })
      .catch(() => setAuthed(false));
  }, []);

  // Contadores de publicación para la tarjeta principal
  useEffect(() => {
    if (!authed) return;
    adminFetch("/api/admin/publish")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        setPubCounts({ total: d.total, published: d.published });
      })
      .catch(() => {});
  }, [authed]);

  const login = async () => {
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pin.trim() }),
    });
    if (res.ok) {
      // Guardar el código en localStorage: se envía como header en cada
      // petición de admin y SOBREVIVE a la navegación panel ⇄ catálogo
      // (incluso si el navegador bloquea las cookies en previews).
      setAdminPin(pin.trim());
      setAuthed(true);
      toast({ title: "Bienvenido", description: "Panel de administración activo." });
    } else {
      toast({ title: "Código incorrecto", variant: "destructive" });
    }
  };

  const logout = async () => {
    clearAdminPin();
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
    window.location.assign("/");
  };

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Verificando sesión…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <a href="/" aria-label="BasKula — volver al catálogo" className="inline-block mb-5">
              <img
                src="/logo-baskula.png"
                alt="BasKula"
                className="h-14 w-auto object-contain mx-auto hover:opacity-80 transition-opacity"
              />
            </a>
            <div className="w-12 h-12 rounded-full bg-[#f6e9c8] flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Lock className="w-5 h-5 text-[#c28b17]" />
            </div>
            <h1 className="font-display text-2xl font-medium text-foreground text-center">Panel de administración</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              Catálogo BasKula
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
            className="space-y-3"
          >
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Tu código de acceso"
                className="h-11 rounded-xl text-center text-sm font-semibold tracking-wider pr-10 border-input bg-card shadow-2xs focus-visible:ring-[#c28b17]/20 focus-visible:border-[#c28b17]"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPin ? "Ocultar código" : "Mostrar código"}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full h-10 rounded-full bg-[#c28b17] hover:bg-[#a67410] text-white text-[13px] font-semibold shadow-xs cursor-pointer" disabled={pin.trim().length < 4}>
              Entrar
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
            Código personal de acceso · se ignora mayúsculas/minúsculas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/80 bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          {/* Logo siempre visible: clic → volver al inicio del catálogo */}
          <a href="/" aria-label="BasKula — volver al inicio" className="flex items-center shrink-0 group">
            <img
              src="/logo-baskula.png"
              alt="BasKula"
              className="h-9 w-auto object-contain group-hover:opacity-80 transition-opacity"
            />
          </a>
          <div className="hidden sm:block pl-1 border-l border-border h-8" />
          <div className="min-w-0">
            <h1 className="font-display text-xl font-medium leading-none">Administración</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">BasKula · Catálogo B2B</p>
          </div>
          <div className="flex-1" />
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-full border border-[#e5d5c5] bg-[#faf8f5] text-[#222222] text-[12px] font-medium hover:border-[#c28b17] hover:text-[#c28b17] transition-all shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#c28b17]" />
            <span>Ver catálogo</span>
          </a>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3.5 h-8.5 rounded-full border border-[#e5d5c5] bg-[#faf8f5] text-[#222222] text-[12px] font-medium hover:text-destructive hover:border-destructive/40 transition-all shadow-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {showCatalog ? (
          <FullCatalogView onBack={() => setShowCatalog(false)} onCountsChange={setPubCounts} />
        ) : (
          <>
            {/* ═══ Tarjeta: catálogo del sitio (publicación) ═══ */}
            <div className="rounded-2xl border border-[#c28b17]/30 bg-gradient-to-br from-[#f6e9c8]/60 via-card to-card p-5 sm:p-6 mb-6 flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 rounded-2xl bg-[#c28b17]/15 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-[#c28b17]" />
              </div>
              <div className="flex-1 min-w-56">
                <h2 className="font-display text-xl font-medium leading-tight">
                  Catálogo del sitio
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {pubCounts ? (
                    <>
                      <span className="font-medium text-foreground">{pubCounts.published}</span> de{" "}
                      <span className="font-medium text-foreground">{pubCounts.total}</span> piezas
                      publicadas en la página principal
                    </>
                  ) : (
                    "Decidís qué piezas ven tus clientes"
                  )}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setShowCatalog(true)}
                className="gap-2 h-12 px-6 text-base"
              >
                <Eye className="w-5 h-5" />
                Ver catálogo completo
                {pubCounts && (
                  <span className="text-xs opacity-70 font-normal">
                    ({pubCounts.total})
                  </span>
                )}
              </Button>
            </div>

            <Tabs defaultValue="clientes">
              <TabsList className="mb-6">
                <TabsTrigger value="clientes" className="gap-2">
                  <Users className="w-4 h-4" />
                  Clientes
                </TabsTrigger>
                <TabsTrigger value="notas" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Notas
                </TabsTrigger>
                <TabsTrigger value="actividad" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Actividad
                </TabsTrigger>
                <TabsTrigger value="config" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Configuración
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clientes">
                <ClientsTab />
              </TabsContent>
              <TabsContent value="notas">
                <NotesTab />
              </TabsContent>
              <TabsContent value="actividad">
                <ActivityTab />
              </TabsContent>
              <TabsContent value="config">
                <SettingsTab />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════ TAB CLIENTES ═══════════════════
function ClientsTab() {
  const [clients, setClients] = useState<AdminClient[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const res = await adminFetch("/api/admin/clients");
    const data = await res.json();
    setClients(data.clients || []);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await adminFetch("/api/admin/clients");
        const data = await res.json();
        if (active) setClients(data.clients || []);
      } catch {
        if (active) setClients([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSelectClient = (clientId: string) => {
    setSelected(clientId);
    setClients((prev) =>
      prev
        ? prev.map((c) =>
            c.id === clientId ? { ...c, hasNewNote: false, hasNewFavorite: false } : c
          )
        : prev
    );
    adminFetch("/api/admin/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, markSeen: true }),
    }).catch(() => {});
  };

  const selectedClient = clients?.find((c) => c.id === selected) || null;

  if (clients === null) {
    return <p className="text-muted-foreground py-8 text-center">Cargando clientes…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-medium">Clientes</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona códigos personales, selecciones y favoritos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setShowNew(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </Button>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">Aún no hay clientes</p>
          <p className="text-sm mt-1">
            Crea el primer cliente y comparte su código de acceso
          </p>
          <Button className="mt-4 gap-2" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" />
            Crear cliente
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {clients.map((c) => {
            const hasAlert = Boolean(c.hasNewNote || c.hasNewFavorite);
            return (
              <button
                key={c.id}
                onClick={() => handleSelectClient(c.id)}
                className={`text-left rounded-2xl border p-4 transition-all hover:shadow-sm relative ${
                  hasAlert
                    ? "border-[#c28b17] bg-[#fdfaf3] shadow-xs"
                    : selected === c.id
                    ? "border-primary/50 bg-accent/50 shadow-sm"
                    : "border-border bg-card hover:border-primary/30"
                } ${!c.active ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{c.name}</p>
                      {hasAlert && (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{c.code}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {!c.active && <Badge variant="secondary">Inactivo</Badge>}
                    {c.hasNewNote && (
                      <Badge className="bg-[#f6e9c8] text-[#8a5b06] border-[#e5d5c5] text-[10.5px] font-semibold gap-1 py-0.5 px-2">
                        <MessageSquare className="w-3 h-3 text-[#c28b17]" />
                        <span>¡Nueva nota!</span>
                      </Badge>
                    )}
                    {c.hasNewFavorite && (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10.5px] font-semibold gap-1 py-0.5 px-2">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        <span>¡Nuevo favorito!</span>
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-primary" />
                    {c.favoritesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {c.curatedCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    {c.visitCount} visitas
                  </span>
                  {c.notesCount > 0 && (
                    <span className="flex items-center gap-1 text-[#c28b17] font-medium">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {c.notesCount} {c.notesCount === 1 ? "nota" : "notas"}
                    </span>
                  )}
                </div>
                {c.lastVisit && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Última visita:{" "}
                    {new Date(c.lastVisit).toLocaleDateString("es", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Formulario nuevo cliente */}
      {showNew && (
        <NewClientDialog
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
          }}
        />
      )}

      {/* Detalle del cliente seleccionado */}
      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function NewClientDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const create = async () => {
    setSaving(true);
    let res: Response;
    try {
      res = await adminFetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, contactName, phone, notes }),
      });
    } catch {
      setSaving(false);
      toast({
        title: "Sin conexión",
        description: "No se pudo crear el cliente. Revisa tu conexión y vuelve a intentar.",
        variant: "destructive",
      });
      return;
    }
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast({
        title: `Cliente creado: ${data.client.name}`,
        description: `Código de acceso del cliente: ${data.client.code} — pasaselo para que ingrese en «Inicia sesión»`,
      });
      onCreated();
    } else if (res.status === 401) {
      // Sesión del panel vencida (p. ej. tras cerrar el navegador en un
      // contexto sin cookies): mensaje claro en vez de un error genérico.
      toast({
        title: "Tu sesión del panel expiró",
        description:
          "Volvé a entrar con tu código de acceso y el cliente se creará sin problemas. Tus datos del formulario siguen acá.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nombre del cliente *</label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Auto-generar código si está vacío
                if (!code) {
                  setCode(
                    e.target.value
                      .toUpperCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^A-Z0-9]+/g, "")
                      .slice(0, 10)
                  );
                }
              }}
              placeholder="Ej: Hotel Plaza San Rafael"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Código de acceso del cliente *</label>
            <Input
              value={code}
              onChange={(e) => setCode(normalizeClientCode(e.target.value))}
              placeholder="HOTELPLAZA"
              className="font-mono"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Esta es la clave del cliente: la escribe en «Inicia sesión» desde el catálogo
              y accede a su lista personalizada. Se guarda en mayúsculas, sin espacios
              ni tildes.
            </p>
            {code.length > 0 && !/^[A-Z0-9-]{3,20}$/.test(code) && (
              <p className="text-xs text-destructive mt-1">
                El código debe tener 3-20 caracteres (letras, números y guiones).
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Contacto</label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nombre del contacto"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+598…"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Notas internas</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferencias: estilo, colores, diámetros de interés…"
              rows={2}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={create}
              disabled={!name.trim() || !/^[A-Z0-9-]{3,20}$/.test(code) || saving}
            >
              {saving ? "Creando…" : "Crear cliente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "¡Copiado!" : label || "Copiar"}
    </button>
  );
}

// ═══════════════════ DETALLE DE CLIENTE ═══════════════════
function ClientDetail({
  client,
  onClose,
  onChanged,
}: {
  client: AdminClient;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<"curada" | "favoritos" | "notas">("curada");
  // Confirmación antes de quitar una pieza de la selección
  const [confirmRemove, setConfirmRemove] = useState<{
    productId: string;
    nameEs: string;
  } | null>(null);
  // Edición de los datos del cliente
  const [showEdit, setShowEdit] = useState(false);

  const addCurated = async (productId: string) => {
    const res = await adminFetch("/api/admin/curated", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id, productId }),
    });
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      if (d.notPublic) {
        toast({
          title: "Añadida a la selección (aún no pública)",
          description:
            "La pieza está oculta en la página principal: el cliente no la verá hasta que la publiques desde «Ver catálogo completo».",
          duration: 7000,
        });
      } else {
        toast({ title: "Añadido a la selección del cliente" });
      }
      onChanged();
    }
  };

  const removeCurated = async (productId: string) => {
    const res = await adminFetch(
      `/api/admin/curated?clientId=${client.id}&productId=${productId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast({ title: "Pieza quitada de la selección" });
      onChanged();
    } else {
      toast({
        title: "No se pudo quitar la pieza",
        description: "Reintentá en unos segundos; si sigue fallando, recargá el panel.",
        variant: "destructive",
      });
    }
    setConfirmRemove(null);
  };

  const toggleActive = async () => {
    const res = await adminFetch("/api/admin/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: client.id, active: !client.active }),
    });
    if (res.ok) {
      toast({
        title: client.active ? "Cliente desactivado" : "Cliente reactivado",
      });
      onChanged();
    }
  };

  const deleteClient = async () => {
    if (!confirm(`¿Eliminar a ${client.name}? Se perderán sus favoritos, selección y notas.`)) return;
    const res = await adminFetch(`/api/admin/clients?id=${client.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Cliente eliminado" });
      onChanged();
      onClose();
    }
  };

  // Eliminar una nota del cliente (el dueño ya la atendió)
  const deleteNote = async (noteId: string) => {
    const res = await adminFetch(`/api/admin/notes?id=${noteId}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Nota eliminada", description: "Ya no aparecerá en el detalle del cliente." });
      onChanged();
    } else {
      toast({ title: "No se pudo eliminar la nota", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden animate-fade-up">
      {/* Cabecera */}
      <div className="p-5 border-b border-border bg-accent/30">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-display text-2xl font-medium">{client.name}</h3>
            <p className="text-sm text-muted-foreground">
              {client.contactName && <>{client.contactName} · </>}
              <span className="font-mono">{client.code}</span>
              {client.phone && <> · {client.phone}</>}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                Código de acceso
              </span>
              <code
                className="text-xs bg-muted px-2 py-1 rounded-lg border border-border font-mono"
                aria-label="Código de acceso del cliente"
              >
                {client.code}
              </code>
              <CopyButton text={client.code} label="Copiar código" />
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                El cliente lo escribe en «Inicia sesión» del catálogo
              </span>
            </div>
            {client.notes && (
              <p className="text-xs text-muted-foreground mt-2 italic max-w-lg">{client.notes}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2 flex-wrap justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-1">
                <Pencil className="w-4 h-4" />
                Editar datos
              </Button>
              <Button variant="outline" size="sm" onClick={toggleActive}>
                {client.active ? "Desactivar" : "Reactivar"}
              </Button>
              <Button variant="destructive" size="sm" onClick={deleteClient} className="gap-1">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cerrar detalle
            </Button>
          </div>
        </div>
      </div>

      {/* Pestañas internas */}
      <div className="flex gap-1 p-4 border-b border-border">
        <button
          onClick={() => setTab("curada")}
          className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
            tab === "curada" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          Selección preparada ({client.curated.length})
        </button>
        <button
          onClick={() => setTab("favoritos")}
          className={`px-4 h-9 rounded-full text-sm font-medium transition-colors ${
            tab === "favoritos" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          Favoritos del cliente ({client.favorites.length})
        </button>
        <button
          onClick={() => setTab("notas")}
          className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-medium transition-colors ${
            tab === "notas" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Notas del cliente{client.notesCount > 0 ? ` (${client.notesCount})` : ""}
        </button>
      </div>

      <div className="p-5">
        {tab === "curada" && (
          <div className="space-y-4">
            {/* Buscador unificado (mismos filtros del catálogo) sobre
                las 1.510 piezas — públicas y ocultas */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Buscar piezas para añadir
              </p>
              <ProductPicker
                addedIds={new Set(client.curated.map((c) => c.productId))}
                onAdd={addCurated}
              />
            </div>

            {/* Selección actual */}
            {client.curated.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">
                Aún no hay piezas seleccionadas para este cliente. Busca arriba y añade las piezas
                que quieres mostrarle.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {client.curated.map((item) => (
                  <div
                    key={item.productId}
                    className="group relative rounded-xl border border-border overflow-hidden bg-card"
                  >
                    <div className="aspect-square bg-muted">
                      {item.image && (
                        <img src={item.image} alt={item.nameEs} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <p className="text-[11px] p-2 line-clamp-2 leading-tight">{item.nameEs}</p>
                    <div className="px-2 pb-2 flex flex-col items-start gap-1">
                      {item.published ? (
                        <span className="text-[9px] font-medium text-[#6e8058] bg-[#6e8058]/10 px-1.5 py-0.5 rounded-full">
                          Pública
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-[#8b5a2b] bg-[#8b5a2b]/10 px-1.5 py-0.5 rounded-full">
                          No pública · el cliente no la ve
                        </span>
                      )}
                      {!item.available && (
                        <span
                          className="text-[9px] font-medium text-[#8b5a2b] bg-white/95 border border-[#e2c9a8] px-1.5 py-0.5 rounded-full"
                          title="El cliente la verá con la etiqueta «Consultar disponibilidad»"
                        >
                          No disponible
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmRemove({ productId: item.productId, nameEs: item.nameEs })}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/95 text-destructive shadow-sm border border-destructive/20 flex items-center justify-center hover:bg-destructive hover:text-white active:scale-95 transition-all"
                      aria-label={`Quitar ${item.nameEs} de la selección`}
                      title="Quitar de la selección"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "favoritos" && (
          <div>
            {client.favorites.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">
                El cliente aún no ha guardado favoritos.
              </p>
            ) : (
              <div className="space-y-2">
                {client.favorites.map((f) => (
                  <div
                    key={f.productId}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      {f.image && <img src={f.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.nameEs}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.collection} · guardado{" "}
                        {new Date(f.addedAt).toLocaleDateString("es", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      {!f.published && (
                        <span className="inline-block mt-1 text-[9px] font-medium text-[#8b5a2b] bg-[#8b5a2b]/10 px-1.5 py-0.5 rounded-full">
                          No pública · oculta para el cliente
                        </span>
                      )}
                    </div>
                    {f.quantity > 1 && (
                      <Badge variant="secondary" className="shrink-0">
                        ×{f.quantity}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "notas" && (
          <div>
            {client.clientNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl">
                {client.name} todavía no dejó notas. Cuando te escriba algo desde su
                «Mi lista» (botón «Enviar nota»), va a aparecer acá.
              </p>
            ) : (
              <div className="space-y-2">
                {client.clientNotes.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-[#c28b17]/30 bg-[#fdf8ec]"
                  >
                    <MessageSquare className="w-4 h-4 text-[#c28b17] shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(n.createdAt).toLocaleDateString("es", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{n.message}</p>
                    </div>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      aria-label="Eliminar nota"
                      title="Eliminar nota (ya la atendí)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Las notas se eliminan cuando ya las atendiste. El cliente ve su propio
                  historial en su «Mi lista» hasta que las borres de acá.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmación antes de quitar una pieza de la selección */}
      <AlertDialog
        open={confirmRemove !== null}
        onOpenChange={(o) => !o && setConfirmRemove(null)}
      >
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar esta pieza de la selección?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="font-medium text-foreground">«{confirmRemove?.nameEs}»</p>
                <p className="mt-1">
                  {client.name} dejará de verla en «Preparado para ti». Podés volver a
              añadírsela cuando quieras desde el buscador de arriba.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => confirmRemove && removeCurated(confirmRemove.productId)}
            >
              Sí, quitar pieza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edición de los datos del cliente */}
      {showEdit && (
        <EditClientDialog
          client={client}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════ EDITAR DATOS DEL CLIENTE ═══════════════════
function EditClientDialog({
  client,
  onClose,
  onSaved,
}: {
  client: AdminClient;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [code, setCode] = useState(client.code);
  const [contactName, setContactName] = useState(client.contactName || "");
  const [phone, setPhone] = useState(client.phone || "");
  const [notes, setNotes] = useState(client.notes || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const codeChanged = normalizeClientCode(code) !== client.code;
  const codeInvalid = !/^[A-Z0-9-]{3,20}$/.test(normalizeClientCode(code));

  const save = async () => {
    if (codeInvalid) return;
    setSaving(true);
    let res: Response;
    try {
      res = await adminFetch("/api/admin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: client.id, name, code, contactName, phone, notes }),
      });
    } catch {
      setSaving(false);
      toast({
        title: "Sin conexión",
        description: "No se pudieron guardar los cambios. Revisa tu conexión y vuelve a intentar.",
        variant: "destructive",
      });
      return;
    }
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast({
        title: "Datos actualizados",
        description: data.codeChanged
          ? `El código de acceso ahora es ${data.code} — avisale al cliente para que use su nueva clave`
          : `Los datos de ${data.name} quedaron guardados.`,
      });
      onSaved();
    } else if (res.status === 401) {
      toast({
        title: "Tu sesión del panel expiró",
        description: "Volvé a entrar con tu código de acceso y los cambios se guardarán sin problemas.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar datos del cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nombre del cliente *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Hotel Plaza San Rafael"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Código de acceso del cliente *</label>
            <Input
              value={code}
              onChange={(e) => setCode(normalizeClientCode(e.target.value))}
              placeholder="HOTELPLAZA"
              className="font-mono"
              maxLength={20}
            />
            {codeChanged ? (
              <p className="text-xs text-[#8b5a2b] mt-1.5 leading-relaxed flex gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                Estás cambiando la clave: el código anterior{" "}
                <code className="bg-muted px-1 rounded">{client.code}</code> dejará de
                funcionar. Avisale al cliente que use su nuevo código{" "}
                <code className="bg-muted px-1 rounded">{normalizeClientCode(code) || "…"}</code>{" "}
                en «Inicia sesión».
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Es la clave con la que el cliente entra en «Inicia sesión» desde el catálogo.
              </p>
            )}
            {codeInvalid && (
              <p className="text-xs text-destructive mt-1">
                El código debe tener 3-20 caracteres (letras, números y guiones).
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Contacto</label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nombre del contacto"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+598…"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Notas internas</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferencias: estilo, colores, diámetros de interés…"
              rows={2}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={!name.trim() || codeInvalid || code.trim().length < 3 || saving}
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════ TAB NOTAS (todas las notas de los clientes) ═══════════════════
// Vista global: todos los mensajes que los clientes dejaron desde su
// «Mi lista», más recientes primero, sin abrir cliente por cliente.
function NotesTab() {
  const [notes, setNotes] = useState<
    {
      id: string;
      message: string;
      createdAt: string;
      clientId: string;
      clientName: string;
      clientCode: string;
    }[] | null
  >(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/clients");
      const data = await res.json();
      const all = (data.clients || []).flatMap(
        (c: {
          id: string;
          name: string;
          code: string;
          clientNotes: { id: string; message: string; createdAt: string }[];
        }) =>
          (c.clientNotes || []).map((n) => ({
            id: n.id,
            message: n.message,
            createdAt: n.createdAt,
            clientId: c.id,
            clientName: c.name,
            clientCode: c.code,
          }))
      );
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotes(all);
    } catch {
      setNotes([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deleteNote = async (noteId: string) => {
    setDeleting(noteId);
    try {
      const res = await adminFetch(`/api/admin/notes?id=${noteId}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => (prev ? prev.filter((n) => n.id !== noteId) : prev));
        toast({
          title: "Nota eliminada",
          description: "Ya la atendiste. El cliente dejará de verla en su historial.",
        });
      } else {
        toast({ title: "No se pudo eliminar la nota", variant: "destructive" });
      }
    } catch {
      toast({
        title: "Sin conexión",
        description: "Revisa tu conexión e intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (notes === null) {
    return <p className="text-muted-foreground py-8 text-center">Cargando notas…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-medium">Notas de tus clientes</h2>
          <p className="text-sm text-muted-foreground">
            Mensajes que te dejaron desde su «Mi lista» — atiéndelos y eliminalos cuando quieras
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">Todavía no hay notas</p>
          <p className="text-sm mt-1">
            Cuando un cliente te escriba algo desde su «Mi lista», va a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 p-4 rounded-2xl border border-[#c28b17]/30 bg-[#fdf8ec]"
            >
              <MessageSquare className="w-4 h-4 text-[#c28b17] shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {n.clientName}{" "}
                  <span className="text-muted-foreground font-mono text-xs">({n.clientCode})</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                  {new Date(n.createdAt).toLocaleString("es", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{n.message}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteNote(n.id)}
                disabled={deleting === n.id}
                className="gap-1.5 shrink-0"
                aria-label={`Eliminar nota de ${n.clientName}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ya la atendí</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════ TAB ACTIVIDAD ═══════════════════
// Actividad COMPLETA de cada cliente: ingresos, corazones guardados y
// quitados, notas enviadas y descargas de su lista — con resumen por
// cliente, filtro y línea de tiempo.

const ACTIVITY_META: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  login: {
    label: "Ingresó",
    icon: <LogIn className="w-4 h-4" />,
    className: "bg-primary/10 text-primary",
  },
  fav_add: {
    label: "Guardó en su lista",
    icon: <HeartPlus className="w-4 h-4" />,
    className: "bg-rose-100 text-rose-700",
  },
  fav_remove: {
    label: "Quitó de su lista",
    icon: <HeartMinus className="w-4 h-4" />,
    className: "bg-muted text-muted-foreground",
  },
  note: {
    label: "Envió una nota",
    icon: <MessageSquare className="w-4 h-4" />,
    className: "bg-[#f6e9c8] text-[#8b5a2b]",
  },
  download: {
    label: "Descargó su lista",
    icon: <Download className="w-4 h-4" />,
    className: "bg-emerald-100 text-emerald-700",
  },
};

function eventDescription(e: ActivityEvent): string {
  switch (e.type) {
    case "login":
      return "Ingresó con su código de cliente";
    case "fav_add":
      return `Guardó «${e.detail || "una pieza"}» en su lista`;
    case "fav_remove":
      return `Quitó «${e.detail || "una pieza"}» de su lista`;
    case "note":
      return `Envió una nota: “${e.detail || ""}”`;
    case "download":
      return e.detail || "Descargó su lista en PDF";
    default:
      return e.detail || e.type;
  }
}

function ActivityTab() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [clientFilter, setClientFilter] = useState("all");

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await adminFetch("/api/admin/activity");
      const d = await res.json();
      if (active && !d.error) setData(d);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!data) return <p className="text-muted-foreground py-8 text-center">Cargando actividad…</p>;

  const filteredEvents =
    clientFilter === "all"
      ? data.events
      : data.events.filter((e) => e.clientCode === clientFilter);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("es", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Users className="w-5 h-5" />} label="Clientes" value={data.stats.clients} />
        <StatCard
          icon={<LogIn className="w-5 h-5" />}
          label="Ingresos totales"
          value={data.stats.logins}
        />
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          label="Corazones guardados"
          value={data.stats.totalFavorites}
        />
        <StatCard
          icon={<Download className="w-5 h-5" />}
          label="Descargas de listas"
          value={data.stats.downloads}
        />
      </div>

      {/* ═══ Actividad de cada cliente (resumen) ═══ */}
      <section>
        <h3 className="font-display text-xl font-medium mb-3">Actividad de cada cliente</h3>
        {data.summary.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 border border-dashed border-border rounded-xl text-center">
            Aún no hay clientes registrados.
          </p>
        ) : (
          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-2.5 font-medium">Cliente</th>
                  <th className="px-3 py-2.5 font-medium text-center">Ingresos</th>
                  <th className="px-3 py-2.5 font-medium text-center">Guardó</th>
                  <th className="px-3 py-2.5 font-medium text-center">Quitó</th>
                  <th className="px-3 py-2.5 font-medium text-center">Notas</th>
                  <th className="px-3 py-2.5 font-medium text-center">Descargas</th>
                  <th className="px-4 py-2.5 font-medium text-right">Última actividad</th>
                </tr>
              </thead>
              <tbody>
                {data.summary.map((c) => {
                  const last = c.lastEvent || c.lastVisit;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setClientFilter(c.code)}
                      className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                        clientFilter === c.code ? "bg-accent/50" : "hover:bg-accent/30"
                      } ${!c.active ? "opacity-50" : ""}`}
                      title={`Ver la actividad de ${c.name}`}
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{c.code}</p>
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium">{c.logins}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 text-rose-700">
                          <HeartPlus className="w-3.5 h-3.5" />+{c.favAdds}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <HeartMinus className="w-3.5 h-3.5" />−{c.favRemoves}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">{c.notes}</td>
                      <td className="px-3 py-2.5 text-center">{c.downloads}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                        {last ? fmtDate(last) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/20">
              Tocá un cliente para ver su actividad detallada.
            </p>
          </div>
        )}
      </section>

      {/* ═══ Línea de tiempo ═══ */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h3 className="font-display text-xl font-medium">Actividad reciente</h3>
          <div className="flex items-center gap-2">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              aria-label="Filtrar actividad por cliente"
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary/50"
            >
              <option value="all">Todos los clientes</option>
              {data.summary.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {clientFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClientFilter("all")}
                className="gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Quitar filtro
              </Button>
            )}
          </div>
        </div>
        {filteredEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 border border-dashed border-border rounded-xl text-center">
            {clientFilter === "all"
              ? "Sin actividad registrada todavía."
              : "Este cliente aún no tiene actividad registrada."}
          </p>
        ) : (
          <div className="space-y-1.5" id="actividad-timeline">
            {filteredEvents.slice(0, 60).map((e) => {
              const meta = ACTIVITY_META[e.type] || {
                label: e.type,
                icon: <Activity className="w-4 h-4" />,
                className: "bg-muted text-muted-foreground",
              };
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.className}`}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{e.clientName}</span>{" "}
                      <span className="text-muted-foreground text-xs font-mono">
                        {e.clientCode}
                      </span>
                      <span className="mx-1.5 text-border">·</span>
                      {eventDescription(e)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {fmtDate(e.createdAt)}
                  </span>
                </div>
              );
            })}
            {filteredEvents.length > 60 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                Mostrando los 60 eventos más recientes de {filteredEvents.length}.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ═══ Listas compartidas ═══ */}
      <section>
        <h3 className="font-display text-xl font-medium mb-3">Listas de interés compartidas</h3>
        {data.sharedLists.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 border border-dashed border-border rounded-xl text-center">
            Ningún cliente ha compartido su lista todavía.
          </p>
        ) : (
          <div className="space-y-3">
            {data.sharedLists.map((l) => (
              <SharedListCard key={l.id} list={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SharedListCard({ list }: { list: ActivityData["sharedLists"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-accent/40 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Link2 className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            {list.clientName}{" "}
            <span className="text-muted-foreground font-mono text-xs">({list.clientCode})</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {list.itemCount} referencias ·{" "}
            {new Date(list.createdAt).toLocaleString("es", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge variant="secondary">{list.itemCount} piezas</Badge>
      </button>
      {open && (
        <div className="border-t border-border p-4 space-y-2 bg-muted/30">
          {list.items.map((i, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                {i.image && <img src={i.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{i.nameEs}</p>
                <p className="text-xs text-muted-foreground">
                  {i.reference} · {i.collection}
                  {i.diameter ? ` · Ø${i.diameter}cm` : ""}
                </p>
              </div>
              {i.quantity > 1 && <Badge variant="secondary">×{i.quantity}</Badge>}
            </div>
          ))}
          <div className="pt-2">
            <CopyButton
              text={list.items.map((i) => `${i.quantity}x ${i.nameEs} (Ref: ${i.reference})`).join("\n")}
              label="Copiar referencias para cotizar"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-primary">
          {icon}
        </div>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

// ═══════════════════ TAB CONFIGURACIÓN ═══════════════════
function SettingsTab() {
  const [whatsapp, setWhatsapp] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await adminFetch("/api/admin/settings");
      const d = await res.json();
      if (active && !d.error) {
        setWhatsapp(d.whatsapp || "");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await adminFetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp, ...(pin ? { adminPin: pin } : {}) }),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) {
      toast({ title: "Configuración guardada" });
      setPin("");
    } else {
      toast({ title: "Error", description: d.error, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="font-display text-2xl font-medium">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Datos de contacto comercial y seguridad del panel
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <label className="text-sm font-medium">Número de WhatsApp comercial</label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="59893658477 (código país + número, sin +)"
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Aparecerá en los botones de contacto y en las listas compartidas de los clientes.
            Formato internacional sin el signo +: código de país seguido del número.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Cambiar código de acceso del panel</label>
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Nuevo código (4-16 letras y números)"
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Es el código con el que entras a este panel. Puede combinar letras y números;
            se ignora mayúsculas/minúsculas al ingresar. Déjalo vacío para no cambiarlo.
          </p>
        </div>

        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? "Guardando…" : "Guardar configuración"}
        </Button>
      </div>
    </div>
  );
}
