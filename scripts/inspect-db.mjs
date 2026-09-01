import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Connecting to database...');

  const [
    orderCount,
    orderItemCount,
    sessionCount,
    bookingCount,
    waitlistCount,
    userCount,
    snackCount,
    consoleCount,
    gameCount,
    productCount
  ] = await Promise.all([
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.gameSession.count(),
    prisma.booking.count(),
    prisma.waitlist.count(),
    prisma.user.count(),
    prisma.snack.count(),
    prisma.console.count(),
    prisma.game.count(),
    prisma.product.count()
  ]);

  console.log('Current Database Record Counts:');
  console.log(`- Orders: ${orderCount}`);
  console.log(`- OrderItems: ${orderItemCount}`);
  console.log(`- GameSessions: ${sessionCount}`);
  console.log(`- Bookings: ${bookingCount}`);
  console.log(`- Waitlists: ${waitlistCount}`);
  console.log(`- Users: ${userCount}`);
  console.log(`- Snacks: ${snackCount}`);
  console.log(`- Consoles: ${consoleCount}`);
  console.log(`- Games: ${gameCount}`);
  console.log(`- Products: ${productCount}`);

  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true, fullName: true, rank: true, loyaltyPoints: true }
  });
  console.log('\nCurrent Users:');
  console.table(users);
}

main()
  .catch((e) => {
    console.error('Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
