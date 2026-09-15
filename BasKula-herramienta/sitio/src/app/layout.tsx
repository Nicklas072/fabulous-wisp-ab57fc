import type { Metadata } from "next";
import { Lora, Lexend_Deca, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Lora — títulos principales (elegancia, calidez, toque artesanal)
const lora = Lora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

// Lexend Deca — texto de presentación y UI
const lexendDeca = Lexend_Deca({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Cormorant Garamond — textos secundarios (serif fina, tipo revista)
const cormorant = Cormorant_Garamond({
  variable: "--font-serif2",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BasKula · Catálogo de Vajillas para Gastronomía",
  description:
    "Catálogo B2B de vajillas de cerámica para clientes gastronómicos. Stoneware y loza de alta resistencia: platos, bowls, tazas y vajillas completas. Punta Piedras, Uruguay.",
  keywords: [
    "BasKula",
    "vajillas",
    "cerámica",
    "stoneware",
    "catálogo gastronómico",
    "B2B",
    "Horeca",
    "Punta Piedras",
    "Uruguay",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${lora.variable} ${lexendDeca.variable} ${cormorant.variable} antialiased bg-background text-foreground font-sans`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
