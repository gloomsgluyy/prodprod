import { prisma } from "@/lib/prisma";

const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export async function nextFcoNumber(profile: "mse" | "camaraderie", buyer: string) {
  const year = new Date().getFullYear();
  const month = romanMonths[new Date().getMonth()];
  const prefix = profile === "camaraderie" ? "FCO.C" : "";
  const shortBuyer = buyer.replace(/[^A-Z0-9]/gi, "").slice(0, 4).toUpperCase() || "OFFER";
  const count = await prisma.fCORecord.count({ where: { generatedAt: { gte: new Date(`${year}-01-01`) } } });
  return prefix ? `${prefix}${String(count + 1).padStart(4, "0")}-${shortBuyer}` : `${String(count + 1).padStart(5, "0")}/FCOE/${month}/${year}`;
}
