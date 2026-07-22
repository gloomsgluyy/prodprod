import { prisma } from "../src/lib/prisma";

async function test() {
  const sources = await prisma.source.findMany({ take: 2 });
  console.log("Sources length:", sources.length);
  if (sources.length > 0) {
    console.log("Source 0 keys:", Object.keys(sources[0]));
    console.log("Source 0 id:", sources[0].id);
    console.log("Source 0 isActive:", sources[0].isActive);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
