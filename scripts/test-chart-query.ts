import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testQuery() {
  try {
    const year = 2026;
    const shipments = await prisma.shipment.findMany({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      select: { type: true, qtyFinal: true, qtyLoaded: true, qtyPlan: true, createdAt: true },
    });
    console.log("Success:", shipments.length);
  } catch (error) {
    console.error("Prisma error:", error);
  }
}

testQuery()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
