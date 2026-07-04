
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  console.log("Seeded admin user:", admin.email);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
