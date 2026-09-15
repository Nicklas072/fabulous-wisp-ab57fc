const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  console.log('--- STARTING RUNTIME & DATABASE AUDIT ---');
  
  // 1. Check Product counts & JSON schemas
  const totalProducts = await prisma.product.count();
  const publishedProducts = await prisma.product.count({ where: { published: true } });
  const availableProducts = await prisma.product.count({ where: { available: true } });
  
  console.log(`Products: ${totalProducts} total, ${publishedProducts} published, ${availableProducts} available`);



  const clients = await prisma.client.findMany({
    include: {
      _count: { select: { favorites: true, curated: true, visits: true, clientNotes: true, sharedLists: true } }
    }
  });
  console.log(`Clients count: ${clients.length}`);
  for (const c of clients) {
    console.log(`- Client [${c.code}] "${c.name}": ${c._count.favorites} favs, ${c._count.curated} curated, ${c._count.clientNotes} notes, ${c._count.visits} visits`);
  }

  // 3. Check Settings
  const settings = await prisma.setting.findMany();
  console.log('Settings:', settings);

  await prisma.$disconnect();
  console.log('--- AUDIT FINISHED ---');
}

audit().catch(err => {
  console.error('Audit failed:', err);
  prisma.$disconnect();
});
