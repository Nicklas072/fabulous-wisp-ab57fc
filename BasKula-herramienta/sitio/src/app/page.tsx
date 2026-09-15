import { getClientFromCookie, getSettings, getPersonalizedData, getCatalogIndex } from "@/lib/catalog";
import CatalogApp from "@/components/catalog/CatalogApp";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // Identificación del cliente:
  let code = "";
  try {
    const cookieClient = await getClientFromCookie();
    if (cookieClient) code = cookieClient.code;
  } catch {
    /* ignore */
  }
  if (!code && typeof params.client === "string") {
    code = params.client.toUpperCase();
  }

  // Carga paralela server-side ultrarrápida: configuración, datos de cliente e índice de productos
  const [settings, personalized, initialProducts] = await Promise.all([
    getSettings(),
    getPersonalizedData(code),
    getCatalogIndex(),
  ]);

  return (
    <CatalogApp
      initialProducts={initialProducts}
      client={personalized.client}
      whatsapp={settings.whatsapp}
      curated={personalized.curated}
      suggestions={personalized.suggestions}
      favoritesPreview={personalized.favoritesPreview}
    />
  );
}
