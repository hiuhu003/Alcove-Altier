/**
 * Create or promote an admin account.
 *
 *   npx tsx prisma/make-admin.ts <email> <password> ["Full Name"]
 *
 * Safe to re-run: an existing account with that email is promoted to admin and
 * its password reset, rather than duplicated.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: npx tsx prisma/make-admin.ts <email> <password> ["Full Name"]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const normalised = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email: normalised },
    update: { role: "admin", passwordHash, ...(name ? { name } : {}) },
    create: {
      email: normalised,
      name: name || "Alcove Atelier",
      passwordHash,
      role: "admin",
    },
    select: { email: true, name: true, role: true },
  });

  // Attach any guest orders placed with this email to the account.
  const claimed = await prisma.order.updateMany({
    where: { email: normalised, userId: null },
    data: { userId: (await prisma.user.findUnique({ where: { email: normalised }, select: { id: true } }))!.id },
  });

  console.log(`Admin ready: ${user.name} <${user.email}> (role: ${user.role})`);
  if (claimed.count) console.log(`Linked ${claimed.count} existing order(s) to this account.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
