import { Prisma } from "@prisma/client";

const dec = new Prisma.Decimal("10.5");
const num = Number(dec);
console.log("Number(dec) =", num);
