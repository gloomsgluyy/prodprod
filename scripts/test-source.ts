import { prisma } from "../src/lib/prisma";

async function test() {
  const source = await prisma.source.findFirst();
  console.log("Source from DB:", source);
  if (source) {
    console.log("isActive type:", typeof source.isActive);
    console.log("isActive value:", source.isActive);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
