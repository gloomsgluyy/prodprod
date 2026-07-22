import { prisma } from "../src/lib/prisma";

async function test() {
  const count = await prisma.paymentRecord.count({ where: { status: "paid" } });
  console.log("Paid PaymentRecords:", count);
  
  if (count > 0) {
    const revenue = await prisma.paymentRecord.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    });
    console.log("Revenue Sum Object:", revenue._sum);
  } else {
    // See if there's ANY payment record
    const total = await prisma.paymentRecord.count();
    console.log("Total PaymentRecords (any status):", total);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
