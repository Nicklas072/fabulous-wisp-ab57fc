"use client";

import { useState } from "react";
import { Lock, Loader2, Eye, EyeOff, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setClientCode, setAdminPin, clearAdminPin, normalizeClientCode } from "@/lib/api-client";

export interface LoginResult {
  client: { code: string; name: string };
  curated: unknown[];
  suggestions: unknown[];
  favoritesPreview: unknown[];
}

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: LoginResult) => void;
  whatsapp?: string;
}

export default function LoginDialog({
  open,
  onClose,
  onSuccess,
  whatsapp,
}: LoginDialogProps) {
  const [code, setCode] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openingPanel, setOpeningPanel] = useState(false);

  const phone = (whatsapp || "59893658477").replace(/[^0-9]/g, "") || "59893658477";
  const waMsg = encodeURIComponent(
    "¡Hola BasKula! 👋 Quisiera solicitar mi código personal de acceso para ver mi catálogo y lista personalizada."
  );
  const waUrl = `https://wa.me/${phone}?text=${waMsg}`;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = normalizeClientCode(code);
    if (!clean) {
      setError("Escribe tu código de acceso");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // 1) Validar si es código de cliente
      const res = await fetch(`/api/client/${encodeURIComponent(clean)}`);
      if (!res.ok) {
        // 1b) ¿Es la clave del panel de administración?
        try {
          const adminRes = await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: clean }),
          });
          if (adminRes.ok) {
            setAdminPin(clean);
            setOpeningPanel(true);
            window.location.assign("/admin");
            return;
          }
        } catch {
          /* ignore */
        }

        setError("Código no reconocido. Verifícalo o pídelo por WhatsApp.");
        setLoading(false);
        return;
      }

      const identified = await res.json();

      // 2) Persistir en localStorage y cookie (limpiando cualquier sesión admin residual)
      clearAdminPin();
      setClientCode(clean);
      try {
        document.cookie = `pb_client=${encodeURIComponent(clean)}; path=/; max-age=${
          60 * 60 * 24 * 30
        }; SameSite=Lax`;
      } catch {
        /* ignore */
      }

      // 3) Cargar datos personalizados
      let home: (LoginResult & { client?: { code: string; name: string } | null }) | null = null;
      try {
        const homeRes = await fetch(`/api/client/home?code=${encodeURIComponent(clean)}`, {
          headers: { "x-client-code": clean },
        });
        if (homeRes.ok) {
          home = await homeRes.json();
        }
      } catch {
        /* best effort */
      }

      const clientData = home?.client || {
        code: identified.code || clean,
        name: identified.name || clean,
      };

      onSuccess({
        client: clientData,
        curated: home?.curated || [],
        suggestions: home?.suggestions || [],
        favoritesPreview: home?.favoritesPreview || [],
      });
      setCode("");
      onClose();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[92vw] sm:max-w-sm p-6 sm:p-8 bg-card border border-border shadow-2xl rounded-2xl">
        <div className="w-full">
          {/* Logo y Encabezado idéntico a la pantalla de acceso */}
          <div className="text-center mb-6">
            <a href="/" aria-label="BasKula" className="inline-block mb-4">
              <img
                src="/logo-baskula.png"
                alt="BasKula"
                className="h-12 sm:h-14 w-auto object-contain mx-auto hover:opacity-80 transition-opacity"
              />
            </a>
            <div className="w-12 h-12 rounded-full bg-[#f6e9c8] flex items-center justify-center mx-auto mb-3 shadow-2xs border border-[#c28b17]/20">
              <Lock className="w-5 h-5 text-[#c28b17]" />
            </div>
            <DialogTitle className="font-display text-2xl font-medium text-foreground text-center">
              Acceso al catálogo
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1 text-center">
              Catálogo BasKula
            </DialogDescription>
          </div>

          {/* Formulario con botón Entrar */}
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                value={code}
                onChange={(e) => {
                  setCode(normalizeClientCode(e.target.value));
                  setError("");
                }}
                placeholder="Tu código de acceso"
                className="h-11 rounded-xl text-center text-sm font-semibold tracking-wider pr-10 border-input bg-card shadow-2xs focus-visible:ring-[#c28b17]/20 focus-visible:border-[#c28b17]"
                autoFocus
                maxLength={24}
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

            {error && (
              <p className="text-xs text-destructive text-center font-medium animate-fade-in">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || code.trim().length < 2}
              className="w-full h-10 rounded-full bg-[#c28b17] hover:bg-[#a67410] text-white text-[13px] font-semibold shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>{openingPanel ? "Abriendo panel…" : "Verificando…"}</span>
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
            Código personal de acceso · se ignora mayúsculas/minúsculas
          </p>

          {/* Separador elegante */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/80"></div>
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-card px-2.5 text-muted-foreground">¿No tienes clave?</span>
            </div>
          </div>

          {/* Botón de WhatsApp para pedir clave */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-10 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <MessageCircle className="w-4 h-4 text-white" />
            <span>Pedir clave por WhatsApp</span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
