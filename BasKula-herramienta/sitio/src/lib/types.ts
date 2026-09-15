// Tipos compartidos del catálogo BasKula

export interface CatalogProduct {
  id: string;
  slug: string;
  nameEs: string;
  collection: string;
  line: string;
  material: string;
  colorGroup: string;
  colorBase: string;
  tone: string;
  pieceGroup: string;
  productType: string;
  productTypeLabel: string;
  diameter: number | null;
  capacity: number | null;
  pieces: number | null;
  available: boolean;
  image: string; // primera imagen 425px
  reference: string;
}

export interface ProductImage {
  url: string;
  url1000: string;
}

// Pieza del catálogo COMPLETO que ve el admin: igual a la pública
// + su estado de publicación en la página principal.
export interface AdminCatalogProduct extends CatalogProduct {
  published: boolean;
}

export interface ProductDetail extends CatalogProduct {
  namePt?: string;
  colorDecor?: string;
  height?: number | null;
  releaseDate?: string | null;
  manufacturerCode?: string | null;
  boxComposition?: string | null;
  packWeight?: string | null;
  packDim?: string | null;
  packType?: string | null;
  descriptionEs?: string;
  careEs?: string;
  infoEs?: string;
  // Estado de publicación (solo relevante para el admin: una pieza
  // oculta solo llega hasta acá con PIN de admin válido)
  published?: boolean;
  images: ProductImage[];
  moodImages: string[];
  suggestions: CatalogProduct[];
}

export interface ClientPublic {
  code: string;
  name: string;
  contactName?: string | null;
  hasCurated: boolean;
  curatedCount: number;
  favoritesCount: number;
}

export interface FavoriteItem {
  productId: string;
  nameEs: string;
  slug: string;
  quantity: number;
  image: string;
  reference: string;
  productTypeLabel: string;
  diameter?: number | null;
  pieces?: number | null;
  collection: string;
  colorBase: string;
  available: boolean;
  addedAt: string;
}

export interface CatalogFilters {
  q?: string;
  grupo?: string; // pieceGroup: platos|bowls|tecafe|vajillas|complementos|kits
  tipo?: string[]; // productType
  material?: string[];
  coleccion?: string[];
  linea?: string[];
  color?: string[]; // colorGroup
  diam?: string[]; // rangos diámetro: lt20|20-24|24-27|27-30|gte30
  cap?: string[]; // rangos capacidad: lt300|300-600|gte600
  pzas?: string[]; // piezas: 1|2-4|6|8|12|18-42
  disp?: "todos" | "disponibles";
  ord?: "relevancia" | "az" | "diam-asc" | "diam-desc" | "recientes";
}

export const COLOR_LABELS: Record<string, string> = {
  blanco: "Blanco / Crudo",
  gris: "Gris",
  azul: "Azul",
  verde: "Verde",
  negro: "Negro",
  amarillo: "Amarillo",
  marron: "Terracota",
  naranja: "Naranja",
  multicolor: "Multicolor",
};

// Muestras de color para los chips de filtro (tonos y familias)
export const TONE_DOTS: Record<string, string> = {
  blanco: "#f7f4ee",
  crudo: "#e8e0d0",
  gris: "#a8a29a",
  "gris-oscuro": "#57524c",
  azul: "#4a6b8a",
  "azul-claro": "#9db8d2",
  "azul-oscuro": "#2c4359",
  verde: "#6d8a5a",
  "verde-menta": "#a3c4a8",
  negro: "#26221e",
  amarillo: "#d9b95c",
  terracota: "#a05c3a",
  arena: "#d4c5a8",
  "tierra-especias": "#8f6a4f",
  rosa: "#d9a8a0",
  naranja: "#c47a3a",
  multicolor: "linear-gradient(135deg,#4a6b8a,#6d8a5a,#c47a3a)",
  estampado: "repeating-linear-gradient(45deg,#e5dcc8 0 4px,#b9a98e 4px 8px)",
  esmaltado: "linear-gradient(160deg,#d4c5a8,#8f6a4f 55%,#57524c)",
  // Familias legacy (colorGroup)
  marron: "#a05c3a",
};

export const COLOR_ORDER = [
  "blanco",
  "gris",
  "azul",
  "verde",
  "negro",
  "amarillo",
  "marron",
  "naranja",
  "multicolor",
];

// ═══════════ TAXONOMÍA DE TONOS (búsqueda) ═══════════
// 19 tonos reales, todos ≤ 300 productos. Incluye separaciones por
// acabado/patrón (estampado, esmaltado) tal como pidió la marca.

export const TONE_LABELS: Record<string, string> = {
  blanco: "Blanco",
  crudo: "Crudo / Off-White",
  gris: "Gris",
  "gris-oscuro": "Gris oscuro",
  azul: "Azul",
  "azul-claro": "Azul claro",
  "azul-oscuro": "Azul oscuro",
  verde: "Verde",
  "verde-menta": "Verde menta",
  negro: "Negro",
  amarillo: "Amarillo / Curry",
  terracota: "Terracota",
  arena: "Arena",
  "tierra-especias": "Canela / Nuez",
  rosa: "Rosa",
  naranja: "Naranja / Zumaque",
  multicolor: "Multicolor",
  estampado: "Estampado",
  esmaltado: "Esmaltado reactivo",
};

// Orden visual: neutros → azules → verdes → cálidos → rosa → variados | acabados
export const TONE_ORDER = [
  "blanco",
  "crudo",
  "gris",
  "gris-oscuro",
  "negro",
  "azul",
  "azul-claro",
  "azul-oscuro",
  "verde",
  "verde-menta",
  "amarillo",
  "naranja",
  "terracota",
  "arena",
  "tierra-especias",
  "rosa",
  "multicolor",
  "estampado",
  "esmaltado",
];

// Tonos de acabado/patrón (se muestran como grupo aparte)
export const TONE_FINISH = ["estampado", "esmaltado"];

// Agrupación por familia para el panel de filtros
export const TONE_FAMILIES: { label: string; tones: string[] }[] = [
  { label: "Neutros", tones: ["blanco", "crudo", "gris", "gris-oscuro", "negro"] },
  { label: "Azules", tones: ["azul", "azul-claro", "azul-oscuro"] },
  { label: "Verdes", tones: ["verde", "verde-menta"] },
  { label: "Cálidos y tierra", tones: ["amarillo", "naranja", "terracota", "arena", "tierra-especias"] },
  { label: "Rosa", tones: ["rosa"] },
  { label: "Variados", tones: ["multicolor"] },
  { label: "Acabados", tones: ["estampado", "esmaltado"] },
];

export const DIAM_RANGES: { key: string; label: string; min: number; max: number }[] = [
  { key: "lt20", label: "< 20 cm", min: 0, max: 20 },
  { key: "20-24", label: "20 – 24 cm", min: 20, max: 24 },
  { key: "24-27", label: "24 – 27 cm", min: 24, max: 27 },
  { key: "27-30", label: "27 – 30 cm", min: 27, max: 30 },
  { key: "gte30", label: "30 cm o más", min: 30, max: 999 },
];

export const CAP_RANGES: { key: string; label: string; min: number; max: number }[] = [
  { key: "lt250", label: "< 250 ml", min: 0, max: 250 },
  { key: "250-500", label: "250 – 500 ml", min: 250, max: 500 },
  { key: "500-800", label: "500 – 800 ml", min: 500, max: 800 },
  { key: "gte800", label: "800 ml o más", min: 800, max: 99999 },
];

export const PIECES_RANGES: { key: string; label: string; min: number; max: number }[] = [
  { key: "1", label: "Pieza individual", min: 1, max: 1 },
  { key: "2-4", label: "2 – 4 piezas", min: 2, max: 4 },
  { key: "6", label: "6 piezas", min: 6, max: 6 },
  { key: "12", label: "12 o más", min: 12, max: 12 },
  { key: "18-42", label: "Vajillas (18 – 42)", min: 18, max: 42 },
];

export const COLLECTION_LABELS: Record<string, string> = {
  "AVANT GARDE": "Avant Garde · esmalte reactivo",
  ESSENCIAS: "Essências · decorado",
  PLATINUM: "Platinum",
  EVERWHITE: "Everwhite",
  HYGGE: "Hygge",
  "CELEBRAÇÕES - NATAL": "Celebraciones · Navidad",
  "DAY BY DAY": "Day by Day",
  PANELINHA: "Panelinha",
  GEO: "Geo",
  "ECO STONE": "Eco Stone · reciclado",
  "CELEBRAÇÕES - PÁSCOA": "Celebraciones · Pascua",
  "GOLD COLLECTION": "Gold Collection · oro 10k",
  RAVENNA: "Ravenna",
  "CELEBRAÇÕES - HALLOWEEN": "Celebraciones · Halloween",
  SIGNATURE: "Signature",
};

export const PIECE_GROUP_INFO: Record<string, { label: string; emoji: string; desc: string }> = {
  platos: { label: "Platos", emoji: "🍽", desc: "Llanos, hondos y postre" },
  bowls: { label: "Bowls y cuencos", emoji: "🥣", desc: "Bowls, cuencos y ramequines" },
  tecafe: { label: "Té y café", emoji: "☕", desc: "Tazas, tazones y vasos" },
  vajillas: { label: "Vajillas", emoji: "✨", desc: "Juegos completos de mesa" },
  complementos: { label: "Complementos", emoji: "🫱", desc: "Bandejas, fuentes y salseras" },
  kits: { label: "Kits", emoji: "🎁", desc: "Kits especiales y combinados" },
};
