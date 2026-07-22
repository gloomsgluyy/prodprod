import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = process.argv[2];
  const email = process.argv[3];
  const name = process.argv[4];
  const role = process.argv[5] || "CEO";

  if (!password || !email || !name) {
    console.error(
      "Usage: npx tsx scripts/create-production-user.ts <password> <email> <name> [role]"
    );
    console.error(
      "Example: npx tsx scripts/create-production-user.ts 'MyStr0ng!Pass' ceo@company.com 'CEO Name' CEO"
    );
    console.error("\nAvailable roles:");
    console.error(
      "  CEO, DIRUT, ASS_DIRUT, COO, CMO, CPPO, TRADERS_1..4, JUNIOR_TRADER,"
    );
    console.error(
      "  ADMIN_MARKETING, TRAFFIC_HEAD, TRAFFIC_1..4, ADMIN_OPERATION,"
    );
    console.error(
      "  SPV_SOURCING, SOURCING_1..4, QQ_MANAGER, QC_MANAGER, QC_ADMIN_1..2,"
    );
    console.error("  FINANCE, STAFF");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("❌ Password must be at least 12 characters for production");
    process.exit(1);
  }

  // Higher bcrypt rounds for production (14 vs 12 in seed)
  const hashed = await bcrypt.hash(password, 14);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { password: hashed, name, role: role as never },
    create: {
      email: email.toLowerCase(),
      password: hashed,
      name,
      role: role as never,
    },
  });

  console.log(`✅ User created/updated:`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name:  ${user.name}`);
  console.log(`   Role:  ${user.role}`);
  console.log(`   ID:    ${user.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
