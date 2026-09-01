import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetAndSeedFresh() {
  console.log('🔄 Starting Clean Database Reset for Udhyana Games...\n');

  // 1. Clear Transactional & Operational Tables
  console.log('🗑️  Clearing transactional records...');
  await prisma.orderItem.deleteMany();
  console.log('   ✓ OrderItems cleared');
  
  await prisma.order.deleteMany();
  console.log('   ✓ Orders cleared');

  await prisma.gameSession.deleteMany();
  console.log('   ✓ GameSessions cleared');

  await prisma.booking.deleteMany();
  console.log('   ✓ Bookings cleared');

  await prisma.waitlist.deleteMany();
  console.log('   ✓ Waitlist cleared');

  // 2. Clear Test / Dummy Users (Preserve legitimate Admin accounts)
  console.log('👥 Cleaning user accounts...');
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: { not: 'ADMIN' }
    }
  });
  console.log(`   ✓ Removed ${deletedUsers.count} test/dummy user accounts`);

  // Reset Admin stats to clean state
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: {
      sessionsCount: 0,
      playtimeHours: 0,
      loyaltyPoints: 0,
      rank: 'Elite',
      status: 'APPROVED'
    }
  });
  console.log('   ✓ Reset Admin accounts playtime/loyalty/sessions counters');

  // Ensure primary admin accounts exist
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@udhyanagames.com';
  const defaultAdminPass = process.env.ADMIN_INITIAL_PASSWORD || 'Admin#Initial2026';
  const hashedAdminPass = await bcrypt.hash(defaultAdminPass, 12);

  const existingMainAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { username: 'admin' }]
    }
  });

  if (!existingMainAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin',
        fullName: 'Admin',
        name: 'Admin',
        password: hashedAdminPass,
        role: 'ADMIN',
        status: 'APPROVED',
        rank: 'Elite'
      }
    });
    console.log(`   ✓ Created primary Admin account (${adminEmail})`);
  }

  // 3. Clear & Reset Stations (Consoles)
  console.log('🎮 Resetting Console Stations...');
  await prisma.consoleGames.deleteMany();
  await prisma.console.deleteMany();

  const stationsData = [
    { id: 'ps5-1', hardwareTitle: 'PS5 Pro - Station 1', hardwareSlug: 'ps5-pro-station-1', hourlyRate: 300, specs: 'PlayStation 5 Pro | 4K 120Hz Sony Bravia OLED | DualSense Wireless' },
    { id: 'ps5-2', hardwareTitle: 'PS5 Pro - Station 2', hardwareSlug: 'ps5-pro-station-2', hourlyRate: 300, specs: 'PlayStation 5 Pro | 4K 120Hz Sony Bravia OLED | DualSense Wireless' },
    { id: 'ps5-3', hardwareTitle: 'PS5 Pro - Station 3', hardwareSlug: 'ps5-pro-station-3', hourlyRate: 300, specs: 'PlayStation 5 Pro | 4K 120Hz Sony Bravia OLED | DualSense Wireless' },
    { id: 'pc-1', hardwareTitle: 'Esports PC - Station 4', hardwareSlug: 'esports-pc-station-4', hourlyRate: 300, specs: 'RTX 4080 Super | Ryzen 7 7800X3D | 240Hz 1ms IPS Monitor | Mech Keyboard' },
    { id: 'pc-2', hardwareTitle: 'Esports PC - Station 5', hardwareSlug: 'esports-pc-station-5', hourlyRate: 300, specs: 'RTX 4080 Super | Ryzen 7 7800X3D | 240Hz 1ms IPS Monitor | Mech Keyboard' },
    { id: 'xbox-1', hardwareTitle: 'Xbox Series X - Station 6', hardwareSlug: 'xbox-series-x-station-6', hourlyRate: 300, specs: 'Xbox Series X 1TB | 4K HDR QLED Display | Xbox Elite Wireless' },
  ];

  for (const s of stationsData) {
    await prisma.console.create({ data: s });
  }
  console.log(`   ✓ Created ${stationsData.length} fresh stations (PS5 Pro 1-3, Esports PC 4-5, Xbox Series X 6)`);

  // 4. Reset & Seed Master Games Library
  console.log('🕹️  Resetting Master Games Library & Station Mappings...');
  await prisma.game.deleteMany();

  const masterGamesList = [
    {
      name: 'EA Sports FC 25',
      consoles: ['ps5-1', 'ps5-2', 'ps5-3', 'pc-1', 'pc-2', 'xbox-1']
    },
    {
      name: 'Tekken 8',
      consoles: ['ps5-1', 'ps5-2', 'ps5-3', 'pc-1', 'pc-2']
    },
    {
      name: 'Call of Duty: Warzone',
      consoles: ['ps5-1', 'ps5-2', 'ps5-3', 'pc-1', 'pc-2', 'xbox-1']
    },
    {
      name: 'Valorant',
      consoles: ['pc-1', 'pc-2']
    },
    {
      name: 'Counter-Strike 2',
      consoles: ['pc-1', 'pc-2']
    },
    {
      name: 'Grand Theft Auto V',
      consoles: ['ps5-1', 'ps5-2', 'ps5-3', 'pc-1', 'pc-2', 'xbox-1']
    },
    {
      name: 'Mortal Kombat 1',
      consoles: ['ps5-1', 'ps5-2', 'ps5-3', 'xbox-1']
    },
    {
      name: 'Marvel’s Spider-Man 2',
      consoles: ['ps5-1', 'ps5-2', 'ps5-3']
    },
    {
      name: 'God of War Ragnarök',
      consoles: ['ps5-1', 'ps5-2', 'ps5-3']
    },
    {
      name: 'Forza Horizon 5',
      consoles: ['pc-1', 'pc-2', 'xbox-1']
    },
    {
      name: 'Rocket League',
      consoles: ['ps5-1', 'ps5-2', 'ps5-3', 'pc-1', 'pc-2', 'xbox-1']
    }
  ];

  for (const g of masterGamesList) {
    const createdGame = await prisma.game.create({
      data: { name: g.name }
    });

    for (const cId of g.consoles) {
      await prisma.consoleGames.create({
        data: {
          consoleId: cId,
          gameId: createdGame.id
        }
      });
    }
  }
  console.log(`   ✓ Seeded ${masterGamesList.length} top game titles with station assignments`);

  // 5. Reset & Seed Snacks & Beverages Catalog
  console.log('🍿 Resetting Snacks & Beverages Catalog...');
  await prisma.snack.deleteMany();

  const snacksData = [
    { name: 'Red Bull Energy Drink', price: 500, icon: '⚡' },
    { name: 'Sting / Monster Energy', price: 250, icon: '🥤' },
    { name: 'Coca-Cola / Sprite (345ml)', price: 150, icon: '🥤' },
    { name: 'Lays / Kurkure Chips', price: 200, icon: '🍿' },
    { name: 'Dairy Milk / KitKat Bar', price: 300, icon: '🍫' },
    { name: 'Mineral Water (500ml)', price: 100, icon: '💧' },
  ];

  for (const snk of snacksData) {
    await prisma.snack.create({ data: snk });
  }
  console.log(`   ✓ Seeded ${snacksData.length} snacks & beverages`);

  // 6. Reset & Seed Shop Merchandise Catalog
  console.log('🛍️  Resetting Shop Merchandise Products...');
  await prisma.product.deleteMany();

  const productsData = [
    {
      name: 'Udhyana Official Pro Jersey 2026',
      price: 3500,
      category: 'apparel',
      imageUrl: '/images/shop/jersey.png',
      description: 'Official breathable polyester esports tournament jersey with ergonomic athletic fit.'
    },
    {
      name: 'Logitech G535 LIGHTSPEED Wireless Headset',
      price: 18500,
      category: 'accessories',
      imageUrl: 'https://resource.logitechg.com/w_2443,h_1374,ar_16:9,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/g535-wireless/g535-wireless-gallery-1.png',
      description: 'Ultra-lightweight 236g wireless gaming headset with 33-hour battery life and 40mm neodymium drivers.'
    },
    {
      name: 'Razer DeathAdder Essential Esports Mouse',
      price: 6500,
      category: 'accessories',
      imageUrl: '/images/shop/mouse.png',
      description: '6,400 DPI optical sensor, 5 Hyperesponse buttons, and classic ergonomic gaming chassis.'
    },
    {
      name: 'Udhyana Speed Edition Deskmat (900x400mm)',
      price: 2800,
      category: 'accessories',
      imageUrl: '/images/shop/deskmat.png',
      description: 'Anti-fray stitched micro-woven cloth surface with anti-slip textured natural rubber base.'
    }
  ];

  for (const prod of productsData) {
    await prisma.product.create({ data: prod });
  }
  console.log(`   ✓ Seeded ${productsData.length} shop catalog products`);

  // 7. Reset System Pricing & Loyalty Settings
  console.log('⚙️  Resetting Global System Settings...');
  const settingsData = [
    { key: 'baseHourlyRate', value: '300' },
    { key: 'extraControllerRate', value: '100' },
    { key: 'pointsPerHour', value: '50' },
    { key: 'spendPerPoint', value: '10' }
  ];

  for (const s of settingsData) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value }
    });
  }
  console.log('   ✓ Configured base rates (PKR 300/hr, +PKR 100 extra controller, 50 pts/hr, 1 pt per PKR 10 spent)');

  console.log('\n✨ COMPLETE! Database is 100% fresh, clean, and ready for live production operations.');
}

resetAndSeedFresh()
  .catch((e) => {
    console.error('❌ Reset error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
