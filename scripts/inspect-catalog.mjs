import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const consoles = await prisma.console.findMany();
  const snacks = await prisma.snack.findMany();
  const products = await prisma.product.findMany();
  const settings = await prisma.settings.findMany();

  console.log('Consoles:', consoles);
  console.log('Snacks:', snacks);
  console.log('Products:', products);
  console.log('Settings:', settings);
}

main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
