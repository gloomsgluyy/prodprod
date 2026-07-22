import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_USERS = [
  { name: "CEO Demo", email: "ceo@demo.com", password: "demo1234", role: "CEO" },
  { name: "Trader Demo", email: "trader@demo.com", password: "demo1234", role: "TRADERS_1" },
  { name: "Admin Marketing", email: "admin@demo.com", password: "demo1234", role: "ADMIN_MARKETING" },
  { name: "Traffic Head", email: "traffic@demo.com", password: "demo1234", role: "TRAFFIC_HEAD" },
  { name: "QC Manager", email: "qc@demo.com", password: "demo1234", role: "QC_MANAGER" },
  { name: "Finance", email: "finance@demo.com", password: "demo1234", role: "FINANCE" },
] as const;

async function main() {
  for (const u of DEMO_USERS) {
    const hashed = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password: hashed, role: u.role as never },
    });
  }
  console.log("✅ Seed complete:", DEMO_USERS.length, "users");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
