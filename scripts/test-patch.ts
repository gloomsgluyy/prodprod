import { prisma } from "../src/lib/prisma";

async function test() {
  const source = await prisma.source.findUnique({ where: { id: 'cmnwp1uii0000x1ot52bnxjxt' } });
  if (source) {
    const updated = await prisma.source.update({
      where: { id: source.id },
      data: { name: source.name + " Test" }
    });
    console.log("Updated name:", updated.name);
    
    // revert
    await prisma.source.update({
      where: { id: source.id },
      data: { name: source.name }
    });
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
