// Publica un lote curado de ~60 piezas disponibles y variadas para que
// el catálogo público deje de estar «en preparación».
// Criterios: available=true, con imagen, repartidas entre todos los
// grupos (platos, bowls, té/café, vajillas, complementos) y con variedad
// de colecciones dentro de cada grupo.
import { PrismaClient } from "@prisma/client";

const TARGET = 60;

const db = new PrismaClient();

function hasImage(p) {
  try {
    const imgs = p.images ? JSON.parse(p.images) : [];
    return Boolean(imgs[0]?.url);
  } catch {
    return false;
  }
}

async function main() {
  const products = await db.product.findMany({
    select: {
      id: true, nameEs: true, pieceGroup: true, collection: true,
      available: true, published: true, images: true, releaseDate: true,
    },
  });

  const alreadyPublished = products.filter((p) => p.published).length;
  const candidates = products.filter((p) => p.available && !p.published && hasImage(p));

  console.log(`Piezas ya publicadas: ${alreadyPublished}`);
  console.log(`Candidatas (disponibles + imagen + no publicadas): ${candidates.length}`);

  // Reparto proporcional por grupo (con mínimo de 3 por grupo si alcanza)
  const byGroup = new Map();
  for (const p of candidates) {
    const g = p.pieceGroup || "otros";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(p);
  }
  const groups = [...byGroup.entries()].map(([g, list]) => ({
    g,
    list: list.sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || "")),
  }));
  console.log("Grupos:", groups.map((x) => `${x.g}=${x.list.length}`).join(" | "));

  const remaining = Math.max(0, TARGET - alreadyPublished);
  const totalCand = candidates.length;
  const chosen = [];
  if (totalCand > 0) {
    const shares = groups.map((grp) => {
      const share = Math.floor((grp.list.length / totalCand) * remaining);
      return Math.max(Math.min(3, grp.list.length), Math.min(share, grp.list.length));
    });
    // Redondeo: si sobra cupo por los mínimos, se reparte secuencialmente
    let assigned = shares.reduce((a, b) => a + b, 0);
    let gi = 0;
    while (assigned < remaining && groups.length > 0) {
      const idx = gi % groups.length;
      if (shares[idx] < groups[idx].list.length) {
        shares[idx] += 1;
        assigned += 1;
      }
      gi += 1;
      if (gi > groups.length * 200) break; // salvaguarda
    }

    // Dentro de cada grupo, variedad de colecciones (round-robin)
    groups.forEach((grp, i) => {
      const n = Math.min(shares[i], remaining - chosen.length);
      if (n <= 0) return;
      const byCol = new Map();
      for (const p of grp.list) {
        const c = p.collection || "—";
        if (!byCol.has(c)) byCol.set(c, []);
        byCol.get(c).push(p);
      }
      const queues = [...byCol.values()];
      let taken = 0;
      let qi = 0;
      while (taken < n) {
        const q = queues[qi % queues.length];
        const item = q.shift();
        if (item) {
          chosen.push(item);
          taken += 1;
        } else {
          queues.splice(qi % queues.length, 1);
          if (queues.length === 0) break;
        }
        qi += 1;
      }
    });
  }

  console.log(`A publicar en esta tanda: ${chosen.length} → total ≈ ${alreadyPublished + chosen.length}`);
  const perGroup = {};
  chosen.forEach((p) => {
    const g = p.pieceGroup || "otros";
    perGroup[g] = (perGroup[g] || 0) + 1;
  });
  console.log("Reparto:", Object.entries(perGroup).map(([g, n]) => `${g}=${n}`).join(" | "));

  if (chosen.length > 0) {
    await db.product.updateMany({
      where: { id: { in: chosen.map((p) => p.id) } },
      data: { published: true },
    });
    console.log("✓ Publicadas");
  }

  const finalCount = await db.product.count({ where: { published: true } });
  console.log(`Total publicadas en el catálogo público: ${finalCount}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
