import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
    
    const qty = (s: { qtyFinal: unknown; qtyLoaded: unknown; qtyPlan: unknown }) =>
      Number(s.qtyFinal ?? s.qtyLoaded ?? s.qtyPlan ?? 0);

    const chart = MONTHS.map((month, i) => ({
      month,
      local: 0,
      export: 0,
    }));

    for (const s of shipments) {
      const idx = new Date(s.createdAt).getMonth();
      const q = qty(s);
      if (s.type === "domestic") chart[idx].local += q;
      else chart[idx].export += q;
    }
    
    console.log("Chart length:", chart.length);
    console.log("Chart sample:", chart[0]);
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
