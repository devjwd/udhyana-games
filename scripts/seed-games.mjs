import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedGames() {
  console.log('🎮 Seeding Games Library and linking to stations...');

  const masterGameNames = [
    'EA Sports FC 25',
    'Tekken 8',
    'Mortal Kombat 1',
    'Forza Horizon 5',
    'Gran Turismo 7',
    'Need for Speed Unbound',
    'Assetto Corsa',
    'F1 24',
    'Dirt Rally 2.0',
    'Marvel’s Spider-Man 2',
    'God of War Ragnarök',
    'Call of Duty: Warzone',
    'GTA V (Grand Theft Auto 5)',
    'Valorant',
    'Counter-Strike 2',
    'Rocket League',
    'Fortnite',
    'Halo Infinite',
  ];

  const dbGames = [];
  for (const name of masterGameNames) {
    const existing = await prisma.game.findFirst({ where: { name } });
    if (!existing) {
      const created = await prisma.game.create({
        data: { name }
      });
      dbGames.push(created);
    } else {
      dbGames.push(existing);
    }
  }
  console.log(`✓ Master Games count: ${dbGames.length}`);

  const consoles = await prisma.console.findMany();
  console.log(`Found ${consoles.length} consoles in database:`);
  consoles.forEach(c => console.log(` - [${c.id}] ${c.hardwareTitle}`));

  // Clear existing mappings
  await prisma.consoleGames.deleteMany();

  for (const c of consoles) {
    const title = (c.hardwareTitle || c.hardwareSlug || '').toLowerCase();
    const idLower = c.id.toLowerCase();

    for (const g of dbGames) {
      const gName = g.name.toLowerCase();
      let assign = false;

      if (title.includes('wheel') || title.includes('steerin') || idLower.includes('wheel')) {
        // Steering wheel station
        if (gName.includes('forza') || gName.includes('gran turismo') || gName.includes('assetto') || 
            gName.includes('need for speed') || gName.includes('f1') || gName.includes('dirt rally') || 
            gName.includes('gta')) {
          assign = true;
        }
      } else if (title.includes('xbox') || idLower.includes('xbox')) {
        // Xbox stations
        if (gName.includes('fc 25') || gName.includes('tekken') || gName.includes('mortal') || 
            gName.includes('forza') || gName.includes('warzone') || gName.includes('gta') || 
            gName.includes('halo') || gName.includes('rocket league') || gName.includes('fortnite') ||
            gName.includes('need for speed')) {
          assign = true;
        }
      } else if (title.includes('ps5') || title.includes('ps4') || idLower.includes('ps5')) {
        // PlayStation stations
        if (gName.includes('fc 25') || gName.includes('tekken') || gName.includes('mortal') || 
            gName.includes('spider-man') || gName.includes('god of war') || gName.includes('warzone') || 
            gName.includes('gta') || gName.includes('rocket league') || gName.includes('fortnite') ||
            gName.includes('gran turismo')) {
          assign = true;
        }
      } else {
        // Default / PC
        assign = true;
      }

      if (assign) {
        await prisma.consoleGames.create({
          data: {
            consoleId: c.id,
            gameId: g.id,
          }
        });
      }
    }
  }

  console.log('✓ Successfully mapped games to all active stations!');
}

seedGames()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
