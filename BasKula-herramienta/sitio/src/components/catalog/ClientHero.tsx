"use client";

import { Sparkles } from "lucide-react";

interface ClientHeroProps {
  client: { code: string; name: string };
  curatedCount: number;
}

export default function ClientHero({ client, curatedCount }: ClientHeroProps) {
  const firstName = client.name.split(" ")[0];
  return (
    <div className="mb-8 text-center flex flex-col items-center justify-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f6e9c8] text-[#222222] border border-[#e2c9a8] text-xs font-medium mb-4 shadow-2xs">
        <Sparkles className="w-3.5 h-3.5 text-[#c28b17]" />
        <span>Experiencia personalizada · Cliente {client.code}</span>
      </div>
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium leading-tight mb-3 text-foreground text-center">
        Hola, {firstName}
        <br />
        <span className="italic">¿qué buscamos hoy?</span>
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base mb-2 max-w-xl mx-auto text-center leading-relaxed">
        Tu catálogo BasKula con tus piezas guardadas y nuestras recomendaciones.
      </p>
      {curatedCount > 0 ? (
        <p className="text-xs sm:text-sm text-[#c28b17] font-medium text-center">
          Tienes {curatedCount} {curatedCount === 1 ? "pieza preparada" : "piezas preparadas"} para
          ti ↓
        </p>
      ) : (
        <p className="text-xs sm:text-sm text-muted-foreground italic text-center max-w-lg mx-auto">
          Tu asesor aún está preparando tu selección personalizada. Mientras tanto, podés recorrer
          el catálogo y guardar tus piezas favoritas con el corazón ♥.
        </p>
      )}
    </div>
  );
}
