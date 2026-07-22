import { prisma } from "../src/lib/prisma";

async function test() {
  const shipments = await prisma.shipment.findMany({
    take: 1,
    select: { type: true, qtyFinal: true, qtyLoaded: true, qtyPlan: true, createdAt: true },
  });
  
  console.log("Shipment:", shipments[0]);
  console.log("createdAt type:", typeof shipments[0].createdAt);
  console.log("createdAt is Date?", shipments[0].createdAt instanceof Date);
  
  const mp = await prisma.marketPrice.findFirst({
    select: { date: true, hba: true }
  });
  
  if (mp) {
    console.log("MarketPrice date is Date?", mp.date instanceof Date);
  }
}

test()
  .then(() => prisma.$disconnect())
  .catch(console.error);
