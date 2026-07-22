import { prisma } from "../src/lib/prisma";

async function test() {
  const source = await prisma.source.findUnique({ where: { id: 'cmnwp1uii0000x1ot52bnxjxt' } });
  console.log("Before isActive:", source?.isActive);
  
  if (source) {
    const updated = await prisma.source.update({
      where: { id: source.id },
      data: { isActive: false }
    });
    console.log("After update returned:", updated.isActive);
    
    // Check DB again directly using raw query
    const raw: any[] = await prisma.$queryRaw`SELECT "isActive" FROM "sources" WHERE "id" = 'cmnwp1uii0000x1ot52bnxjxt'`;
    console.log("Raw from DB:", raw[0].isActive);
    
    // Revert
    await prisma.source.update({
      where: { id: source.id },
      data: { isActive: true }
    });
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
