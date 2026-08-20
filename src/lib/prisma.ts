import { PrismaClient } from '@prisma/client';


import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Singleton Prisma client — shared across auth.ts and actions.ts
// to avoid multiple database connections.

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// In development, reuse the global instance across hot-reloads
const prisma = global.__prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
