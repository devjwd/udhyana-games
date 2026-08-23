'use server';

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ========================
// AUTHENTICATION & RBAC GUARDS
// ========================

async function getAuthenticatedSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Authentication required: Please sign in to proceed.');
  }
  return session;
}

async function requireAdminAuth() {
  const session = await getAuthenticatedSession();
  if (session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only Administrator accounts can perform this action.');
  }
  return session;
}

async function requireReceptionAuth() {
  const session = await getAuthenticatedSession();
  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'RECEPTIONIST') {
    throw new Error('Unauthorized: Only Admin or Receptionist staff can perform this action.');
  }
  return session;
}

async function requireUserOrStaff(targetUserId: string) {
  const session = await getAuthenticatedSession();
  const isStaff = session.user.role === 'ADMIN' || session.user.role === 'RECEPTIONIST';
  if (session.user.id !== targetUserId && !isStaff) {
    throw new Error('Unauthorized: You can only view or modify your own account.');
  }
  return session;
}

// ========================
// GLOBAL SETTINGS (Cached)
// ========================

export const getBaseHourlyRate = unstable_cache(
  async (): Promise<number> => {
    const setting = await prisma.settings.findUnique({ where: { key: 'baseHourlyRate' } });
    return setting ? parseInt(setting.value, 10) : 1000;
  },
  ['base-hourly-rate'],
  { tags: ['settings'] }
);

export async function setBaseHourlyRate(rate: number) {
  await requireAdminAuth();
  await prisma.settings.upsert({
    where: { key: 'baseHourlyRate' },
    update: { value: rate.toString() },
    create: { key: 'baseHourlyRate', value: rate.toString() }
  });
  revalidateTag('settings', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  revalidatePath('/book');
}

export const getExtraControllerRate = unstable_cache(
  async (): Promise<number> => {
    const setting = await prisma.settings.findUnique({ where: { key: 'extraControllerRate' } });
    return setting ? parseInt(setting.value, 10) : 200;
  },
  ['extra-controller-rate'],
  { tags: ['settings'] }
);

export async function setExtraControllerRate(rate: number) {
  await requireAdminAuth();
  await prisma.settings.upsert({
    where: { key: 'extraControllerRate' },
    update: { value: rate.toString() },
    create: { key: 'extraControllerRate', value: rate.toString() }
  });
  revalidateTag('settings', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  revalidatePath('/book');
}

export const getLoyaltyRates = unstable_cache(
  async (): Promise<{ pointsPerHour: number; spendPerPoint: number }> => {
    const [pointsPerHourSetting, spendPerPointSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: 'pointsPerHour' } }),
      prisma.settings.findUnique({ where: { key: 'spendPerPoint' } }),
    ]);
    return {
      pointsPerHour: pointsPerHourSetting ? parseInt(pointsPerHourSetting.value, 10) : 50,
      spendPerPoint: spendPerPointSetting ? parseInt(spendPerPointSetting.value, 10) : 10,
    };
  },
  ['loyalty-rates'],
  { tags: ['settings', 'loyalty'] }
);

export async function setLoyaltyRates(pointsPerHour: number, spendPerPoint: number) {
  await requireAdminAuth();
  await Promise.all([
    prisma.settings.upsert({
      where: { key: 'pointsPerHour' },
      update: { value: pointsPerHour.toString() },
      create: { key: 'pointsPerHour', value: pointsPerHour.toString() }
    }),
    prisma.settings.upsert({
      where: { key: 'spendPerPoint' },
      update: { value: spendPerPoint.toString() },
      create: { key: 'spendPerPoint', value: spendPerPoint.toString() }
    })
  ]);
  revalidateTag('settings', 'default');
  revalidateTag('loyalty', 'default');
  revalidatePath('/admin');
  revalidatePath('/profile');
}

export async function adjustUserLoyaltyPoints(userId: string, pointsDelta: number) {
  await requireAdminAuth();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const newPoints = Math.max(0, (user.loyaltyPoints || 0) + pointsDelta);

  let newRank = user.rank;
  if (newPoints >= 1000) newRank = 'Elite';
  else if (newPoints >= 500) newRank = 'Pro';
  else if (newPoints >= 100) newRank = 'Regular';
  else newRank = 'Rookie';

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      loyaltyPoints: newPoints,
      rank: newRank
    }
  });

  revalidatePath('/admin');
  revalidatePath('/profile');
  return updatedUser;
}

// ========================
// USER QUERIES (Staff Only)
// ========================

export async function searchUsers(query: string) {
  await requireReceptionAuth();
  if (!query || query.length < 2) return [];
  
  return await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { fullName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 5,
    select: { id: true, username: true, fullName: true, phone: true }
  });
}

// ========================
// PRODUCTS (Merchandise)
// ========================

export const getProducts = unstable_cache(
  async () => {
    return await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  },
  ['products-list'],
  { tags: ['products'] }
);

export async function addProduct(data: { name: string; price: number; category: string; imageUrl: string; description?: string }) {
  await requireAdminAuth();
  const newProduct = await prisma.product.create({ data });
  revalidateTag('products', 'default');
  revalidatePath('/admin');
  revalidatePath('/shop');
  return newProduct;
}

export async function deleteProduct(id: string) {
  await requireAdminAuth();
  await prisma.product.delete({ where: { id } });
  revalidateTag('products', 'default');
  revalidatePath('/admin');
  revalidatePath('/shop');
}

// ========================
// SNACKS
// ========================

export const getSnacks = unstable_cache(
  async () => {
    return await prisma.snack.findMany({ orderBy: { createdAt: 'asc' } });
  },
  ['snacks-list'],
  { tags: ['snacks'] }
);

export async function addSnack(data: { name: string; price: number; icon: string }) {
  await requireAdminAuth();
  const newSnack = await prisma.snack.create({ data });
  revalidateTag('snacks', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  return newSnack;
}

export async function deleteSnack(id: string) {
  await requireAdminAuth();
  await prisma.snack.delete({ where: { id } });
  revalidateTag('snacks', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
}

// ========================
// CONSOLES & GAMES
// ========================

export const getConsoles = unstable_cache(
  async () => {
    return await prisma.console.findMany({
      include: {
        games: {
          include: {
            game: true
          }
        }
      }
    });
  },
  ['consoles-list'],
  { tags: ['consoles'] }
);

export async function addConsole(data: { id: string; hardwareTitle: string; hardwareSlug: string; hourlyRate: number; imagePath: string; specs: string }) {
  await requireAdminAuth();
  const newConsole = await prisma.console.create({ data });
  revalidateTag('consoles', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  return newConsole;
}

export async function deleteConsole(id: string) {
  await requireAdminAuth();
  await prisma.console.delete({ where: { id } });
  revalidateTag('consoles', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
}

export async function toggleConsoleGame(consoleId: string, gameName: string) {
  await requireAdminAuth();
  let game = await prisma.game.findUnique({ where: { name: gameName } });
  if (!game) {
    game = await prisma.game.create({ data: { name: gameName } });
  }

  const existingMapping = await prisma.consoleGames.findUnique({
    where: {
      consoleId_gameId: { consoleId, gameId: game.id }
    }
  });

  if (existingMapping) {
    await prisma.consoleGames.delete({
      where: { consoleId_gameId: { consoleId, gameId: game.id } }
    });
  } else {
    await prisma.consoleGames.create({
      data: { consoleId, gameId: game.id }
    });
  }

  revalidateTag('consoles', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
}

// ========================
// SEEDING
// ========================

export async function seedAdminUser() {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount > 0) {
    await requireAdminAuth();
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@udhyanagames.com';
  const rawPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin#Initial2026';
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { username: 'admin' }
      ]
    }
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin',
        fullName: 'Admin',
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'APPROVED',
        rank: 'Elite'
      }
    });
  }
}

export async function seedInitialData() {
  await seedAdminUser();

  const snacks = await prisma.snack.count();
  if (snacks === 0) {
    await prisma.snack.createMany({
      data: [
        { name: 'Energy Drink', icon: '⚡', price: 500 },
        { name: 'Soda Can', icon: '🥤', price: 150 },
        { name: 'Chips / Lays', icon: '🍿', price: 200 },
        { name: 'Chocolate', icon: '🍫', price: 300 },
      ]
    });
  }

  const consoles = await prisma.console.count();
  if (consoles === 0) {
    await prisma.console.createMany({
      data: [
        { id: 'ps5-1', hardwareTitle: 'PS5 Pro - Station 1' },
        { id: 'ps5-2', hardwareTitle: 'PS5 Pro - Station 2' },
        { id: 'ps5-3', hardwareTitle: 'PS5 Pro - Station 3' },
        { id: 'pc-1', hardwareTitle: 'Esports PC - Station 4' },
        { id: 'pc-2', hardwareTitle: 'Esports PC - Station 5' },
        { id: 'xbox-1', hardwareTitle: 'Xbox Series X - Station 6' },
      ]
    });
  }
}

// ========================
// USER REGISTRATION & APPROVAL
// ========================

export async function registerOnlineUser(data: {
  username: string;
  password: string;
  email: string;
  phone: string;
  fullName: string;
}) {
  const { username, password, email, phone, fullName } = data;

  if (!username.trim() || username.trim().length < 3) throw new Error('Gamer Tag must be at least 3 characters.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
  if (!email || !email.includes('@')) throw new Error('Valid email is required.');
  if (!phone.trim()) throw new Error('Phone number is required.');
  if (!fullName.trim()) throw new Error('Full name is required.');

  const hashedPassword = await bcrypt.hash(password, 12);
  
  try {
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        fullName: fullName.trim(),
        name: fullName.trim(),
        status: 'PENDING',
      }
    });
    return { success: true, userId: user.id };
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
      throw new Error('This Gamer Tag or Email is already registered.');
    }
    console.error('Registration error:', err);
    throw new Error('Registration failed. Please try again later.');
  }
}

export async function getPendingUsers(limit: number = 50) {
  await requireReceptionAuth();
  return await prisma.user.findMany({
    where: { status: 'PENDING' },
    select: { id: true, username: true, fullName: true, email: true, phone: true },
    orderBy: { id: 'desc' },
    take: limit
  });
}

export async function approveUser(userId: string) {
  await requireReceptionAuth();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'APPROVED' }
  });
  revalidatePath('/reception');
  return updated;
}

export async function promoteUserToStaff(userId: string, role: string) {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount > 0) {
    await requireAdminAuth();
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role, status: 'APPROVED' }
  });
  revalidatePath('/admin');
  return updated;
}

// ========================
// BOOKINGS
// ========================

export async function createBooking(userId: string, consoleId: string, startTime: Date, durationHours: number) {
  await requireUserOrStaff(userId);
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

  return await prisma.$transaction(async (tx) => {
    // Check for double bookings inside transaction
    const conflictingBooking = await tx.booking.findFirst({
      where: {
        consoleId,
        status: 'CONFIRMED',
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } }
        ]
      }
    });

    if (conflictingBooking) {
      return { error: 'Console is already booked for this time slot.' };
    }

    const booking = await tx.booking.create({
      data: {
        userId,
        consoleId,
        startTime,
        endTime,
        status: 'CONFIRMED'
      }
    });

    revalidatePath('/profile');
    revalidatePath('/reception');
    return { success: true, booking };
  });
}

export async function getBookedSlots(consoleId: string, date: string) {
  // Use date range spanning local time
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59.999`);

  const bookings = await prisma.booking.findMany({
    where: {
      consoleId,
      status: 'CONFIRMED',
      startTime: { gte: startOfDay, lte: endOfDay }
    },
    select: { startTime: true, endTime: true }
  });

  const activeSessions = await prisma.gameSession.findMany({
    where: {
      consoleId,
      status: 'ACTIVE',
      startTime: { gte: startOfDay, lte: endOfDay }
    },
    select: { startTime: true, endTime: true }
  });

  return [...bookings, ...activeSessions];
}

// ========================
// ACTIVE SESSIONS (GameSession)
// ========================

export async function getActiveSessions() {
  await requireReceptionAuth();
  return await prisma.gameSession.findMany({
    where: { status: 'ACTIVE' },
    include: {
      user: { select: { id: true, username: true, fullName: true, phone: true } },
      console: { select: { id: true, hardwareTitle: true } }
    },
    orderBy: { endTime: 'asc' }
  });
}

export async function addTimeToSession(sessionId: string, additionalSeconds: number) {
  await requireReceptionAuth();
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
  if (!session || session.status !== 'ACTIVE') return null;

  const newEndTime = new Date(session.endTime.getTime() + additionalSeconds * 1000);
  
  const updatedSession = await prisma.gameSession.update({
    where: { id: sessionId },
    data: { endTime: newEndTime }
  });

  revalidatePath('/reception');
  return updatedSession;
}

export async function endGameSession(sessionId: string) {
  await requireReceptionAuth();
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
  if (!session || session.status === 'COMPLETED') return null;

  const now = new Date();
  const endToUse = now > session.endTime ? session.endTime : now;
  const hoursPlayed = Math.max(0, Math.ceil((endToUse.getTime() - session.startTime.getTime()) / (1000 * 60 * 60)));

  const updatedSession = await prisma.gameSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED' }
  });

  if (session.userId) {
    const { pointsPerHour } = await getLoyaltyRates();
    const pointsEarned = Math.max(1, hoursPlayed * pointsPerHour);
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        sessionsCount: { increment: 1 },
        playtimeHours: { increment: hoursPlayed },
        loyaltyPoints: { increment: pointsEarned }
      }
    });

    let newRank = user.rank;
    if (user.loyaltyPoints >= 1000) newRank = 'Elite';
    else if (user.loyaltyPoints >= 500) newRank = 'Pro';
    else if (user.loyaltyPoints >= 100) newRank = 'Regular';
    else newRank = 'Rookie';

    if (newRank !== user.rank) {
      await prisma.user.update({
        where: { id: user.id },
        data: { rank: newRank }
      });
    }
  }

  revalidatePath('/reception');
  revalidatePath('/profile');
  return updatedSession;
}

// ========================
// USER DATA QUERIES (Protected)
// ========================

export async function getUserBookings(userId: string) {
  await requireUserOrStaff(userId);
  return await prisma.booking.findMany({
    where: { userId },
    include: { console: true },
    orderBy: { startTime: 'asc' }
  });
}

export async function getUserOrders(userId: string) {
  await requireUserOrStaff(userId);
  return await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getUserSessions(userId: string) {
  await requireUserOrStaff(userId);
  return await prisma.gameSession.findMany({
    where: { userId, status: 'COMPLETED' },
    orderBy: { startTime: 'desc' }
  });
}

export async function getUserActivityStats(userId: string) {
  await requireUserOrStaff(userId);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSessions = await prisma.gameSession.findMany({
    where: { 
      userId, 
      status: 'COMPLETED',
      startTime: { gte: sevenDaysAgo }
    },
    select: { startTime: true, endTime: true }
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  const sortedDays: string[] = [];
  for (let i = 6; i >= 0; i--) {
    sortedDays.unshift(days[(today - i + 7) % 7]);
  }
  const sortedPlaytime = Array(7).fill(0);

  recentSessions.forEach(session => {
    if (!session.startTime || !session.endTime) return;
    const diffHours = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);
    const sessionDay = session.startTime.getDay();
    
    const dayName = days[sessionDay];
    const idx = sortedDays.indexOf(dayName);
    if (idx !== -1) {
      sortedPlaytime[idx] += diffHours;
    }
  });

  return { labels: sortedDays, data: sortedPlaytime };
}

// ========================
// WAITLIST
// ========================

export async function addWaitlistEntry(name: string, requested: string) {
  await requireReceptionAuth();
  const entry = await prisma.waitlist.create({
    data: { name, requested }
  });
  revalidatePath('/reception');
  return entry;
}

export async function getWaitlist() {
  await requireReceptionAuth();
  return await prisma.waitlist.findMany({
    where: { status: 'WAITING' },
    orderBy: { createdAt: 'asc' }
  });
}

export async function removeWaitlistEntry(id: string) {
  await requireReceptionAuth();
  const entry = await prisma.waitlist.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });
  revalidatePath('/reception');
  return entry;
}

export async function assignWaitlistEntry(id: string) {
  await requireReceptionAuth();
  const entry = await prisma.waitlist.update({
    where: { id },
    data: { status: 'ASSIGNED' }
  });
  revalidatePath('/reception');
  return entry;
}

// ========================
// POINT OF SALE (POS)
// ========================

export async function processPosCheckout(
  orderItems: { name: string; price: number; type: string }[],
  totalAmount: number,
  paymentMethod: string,
  sessionItems: { guestName: string; consoleId: string; durationSeconds: number }[],
  walkInName?: string,
  walkInPhone?: string,
  existingUserId?: string
) {
  try {
    await requireReceptionAuth();
    
    const result = await prisma.$transaction(async (tx) => {
      let userId = existingUserId;

      if (!userId && walkInName && walkInName.trim()) {
        const cleanName = walkInName.trim();
        let user = await tx.user.findFirst({
          where: {
            OR: [
              { username: { equals: cleanName, mode: 'insensitive' } },
              { fullName: { equals: cleanName, mode: 'insensitive' } },
              ...(walkInPhone?.trim() ? [{ phone: walkInPhone.trim() }] : [])
            ]
          }
        });

        if (!user) {
          try {
            user = await tx.user.create({
              data: {
                username: cleanName,
                name: cleanName,
                fullName: cleanName,
                status: 'APPROVED',
                ...(walkInPhone?.trim() ? { phone: walkInPhone.trim() } : {})
              }
            });
          } catch {
            user = await tx.user.findFirst({
              where: { username: { equals: cleanName, mode: 'insensitive' } }
            });
          }
        }
        if (user) {
          userId = user.id;
        }
      }

      const now = new Date();

      await tx.gameSession.updateMany({
        where: {
          status: 'ACTIVE',
          endTime: { lte: now }
        },
        data: { status: 'COMPLETED' }
      });

      for (const item of sessionItems) {
        const endTime = new Date(now.getTime() + item.durationSeconds * 1000);
        
        const active = await tx.gameSession.findFirst({
          where: {
            consoleId: item.consoleId,
            status: 'ACTIVE',
            endTime: { gt: now }
          }
        });
        if (active) {
          throw new Error(`Console is currently occupied until ${active.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
        }
        
        const overlappingBooking = await tx.booking.findFirst({
          where: {
            consoleId: item.consoleId,
            status: 'CONFIRMED',
            startTime: { lt: endTime },
            endTime: { gt: now }
          }
        });
        if (overlappingBooking) {
          throw new Error(`Console is booked for a reservation at ${overlappingBooking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
        }

        const consoleRecord = await tx.console.findUnique({ where: { id: item.consoleId } });
        if (!consoleRecord) {
          await tx.console.create({
            data: {
              id: item.consoleId,
              hardwareTitle: item.consoleId.toUpperCase()
            }
          });
        }
      }

      const order = await tx.order.create({
        data: {
          userId: userId || null,
          totalAmount,
          paymentMethod,
          items: {
            create: orderItems.map(item => ({
              name: item.name,
              price: item.price,
              type: item.type,
              quantity: 1
            }))
          }
        }
      });

      if (userId) {
        const spendPerPointSetting = await tx.settings.findUnique({ where: { key: 'spendPerPoint' } });
        const spendPerPoint = spendPerPointSetting ? Math.max(1, parseInt(spendPerPointSetting.value, 10)) : 10;
        const pointsEarned = Math.floor(totalAmount / spendPerPoint);

        const user = await tx.user.update({
          where: { id: userId },
          data: { loyaltyPoints: { increment: pointsEarned } }
        });

        let newRank = user.rank;
        if (user.loyaltyPoints >= 1000) newRank = 'Elite';
        else if (user.loyaltyPoints >= 500) newRank = 'Pro';
        else if (user.loyaltyPoints >= 100) newRank = 'Regular';
        else newRank = 'Rookie';

        if (newRank !== user.rank) {
          await tx.user.update({
            where: { id: user.id },
            data: { rank: newRank }
          });
        }
      }

      for (const item of sessionItems) {
        const endTime = new Date(now.getTime() + item.durationSeconds * 1000);
        await tx.gameSession.create({
          data: {
            userId: userId || null,
            guestName: item.guestName,
            consoleId: item.consoleId,
            endTime,
            status: 'ACTIVE'
          }
        });
      }

      return { success: true, orderId: order.id };
    });

    revalidatePath('/reception');
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred during checkout.';
    return { error: message };
  }
}

// ========================
// SECURE ONLINE SHOP ORDER (Server-Side Price Recalculation)
// ========================

export async function createOnlineShopOrder(
  userId: string,
  items: { id: string; name: string; price: number; quantity: number }[],
  _clientTotalAmount: number,
  paymentMethod: string = 'ONLINE'
) {
  try {
    await requireUserOrStaff(userId);

    if (!items || items.length === 0) {
      return { error: 'No items in order.' };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify item prices against DB to prevent client-side price tampering
      const productIds = items.map(i => i.id);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } }
      });
      const productMap = new Map(dbProducts.map(p => [p.id, p]));

      let serverTotalAmount = 0;
      const verifiedItems = items.map(item => {
        const dbProduct = productMap.get(item.id);
        const unitPrice = dbProduct ? dbProduct.price : item.price;
        const lineTotal = unitPrice * item.quantity;
        serverTotalAmount += lineTotal;
        return {
          name: `${dbProduct?.name || item.name} (x${item.quantity})`,
          price: lineTotal,
          type: 'PRODUCT',
          quantity: item.quantity
        };
      });

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount: serverTotalAmount,
          paymentMethod,
          items: {
            create: verifiedItems
          }
        }
      });

      // 3. Award loyalty points based on server-verified total
      const spendPerPointSetting = await tx.settings.findUnique({ where: { key: 'spendPerPoint' } });
      const spendPerPoint = spendPerPointSetting ? Math.max(1, parseInt(spendPerPointSetting.value, 10)) : 10;
      const pointsEarned = Math.max(1, Math.floor(serverTotalAmount / spendPerPoint));

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { increment: pointsEarned }
        }
      });

      let newRank = updatedUser.rank;
      if (updatedUser.loyaltyPoints >= 1000) newRank = 'Elite';
      else if (updatedUser.loyaltyPoints >= 500) newRank = 'Pro';
      else if (updatedUser.loyaltyPoints >= 100) newRank = 'Regular';
      else newRank = 'Rookie';

      if (newRank !== updatedUser.rank) {
        await tx.user.update({
          where: { id: userId },
          data: { rank: newRank }
        });
      }

      return { 
        success: true, 
        orderId: order.id, 
        totalAmount: serverTotalAmount,
        pointsEarned, 
        totalPoints: updatedUser.loyaltyPoints, 
        rank: newRank 
      };
    });

    revalidatePath('/profile');
    revalidatePath('/admin');
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Checkout failed.';
    console.error('Error creating online shop order:', message);
    return { error: message };
  }
}

export async function getRecentSales() {
  await requireReceptionAuth();
  return await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });
}

export async function getUpcomingBookings() {
  await requireReceptionAuth();
  return await prisma.booking.findMany({
    where: { 
      status: 'CONFIRMED',
      startTime: { gte: new Date() }
    },
    include: { 
      user: { select: { fullName: true, username: true, phone: true } },
      console: { select: { hardwareTitle: true } }
    },
    orderBy: { startTime: 'asc' }
  });
}

// ========================
// PROFILE EDITING
// ========================

export async function updateUserProfile(userId: string, data: { fullName: string; phone: string; image: string }) {
  await requireUserOrStaff(userId);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: data.fullName,
      phone: data.phone,
      image: data.image
    }
  });
  
  revalidatePath('/profile');
  revalidatePath('/profile/edit');
  return { success: true, user: updatedUser };
}

export async function updateUserPassword(userId: string, currentPassword?: string, newPassword?: string) {
  const session = await getAuthenticatedSession();
  if (session.user.id !== userId) {
    throw new Error('Unauthorized: You can only change your own password.');
  }

  if (!currentPassword || !newPassword) {
    return { error: 'Both current and new password are required.' };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user || !user.password) {
    return { error: 'Account not found or has no password set.' };
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { error: 'Incorrect current password.' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return { success: true };
}

// ========================
// LEADERBOARD (Public)
// ========================

export async function getLeaderboard() {
  return await prisma.user.findMany({
    where: { status: 'APPROVED' },
    orderBy: [
      { playtimeHours: 'desc' },
      { sessionsCount: 'desc' }
    ],
    take: 10,
    select: {
      id: true,
      username: true,
      fullName: true,
      image: true,
      rank: true,
      playtimeHours: true,
      sessionsCount: true
    }
  });
}

// ========================
// HERO SECTION (Cached)
// ========================

export type HeroTrendingSlide = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
};

export type HeroGalleryImage = {
  id: string;
  imageUrl: string;
  label: string;
};

const DEFAULT_TRENDING: HeroTrendingSlide[] = [
  {
    id: '1',
    badge: 'NOW OPEN',
    title: 'UDHYANA',
    subtitle: 'GAMES',
    description: 'The ultimate gaming lounge experience. Book your session today.',
    ctaText: 'BOOK NOW',
    ctaLink: '/book',
    imageUrl: '/images/hero_main.jpg',
  },
  {
    id: '2',
    badge: 'NEW ARRIVAL',
    title: 'PS5 PRO',
    subtitle: 'AVAILABLE',
    description: 'Experience next-gen gaming on our PS5 Pro stations.',
    ctaText: 'VIEW CONSOLES',
    ctaLink: '/consoles',
    imageUrl: '/images/hero_slide2.jpg',
  },
  {
    id: '3',
    badge: 'SHOP',
    title: 'MERCH',
    subtitle: 'DROP',
    description: 'Check out our latest gaming peripherals and accessories.',
    ctaText: 'SHOP NOW',
    ctaLink: '/shop',
    imageUrl: '/images/hero_slide3.jpg',
  },
];

const DEFAULT_GALLERY: HeroGalleryImage[] = [
  { id: '1', imageUrl: '/images/hero_side.jpg', label: 'GAMING LOUNGE' },
  { id: '2', imageUrl: '/images/champs.jpg', label: 'CHAMPIONS' },
  { id: '3', imageUrl: '/images/lounge_interior.png', label: 'THE SETUP' },
  { id: '4', imageUrl: '/images/strip1_single.jpg', label: 'TOURNAMENT' },
];

export const getHeroTrending = unstable_cache(
  async (): Promise<HeroTrendingSlide[]> => {
    const setting = await prisma.settings.findUnique({ where: { key: 'hero_trending' } });
    if (setting) {
      try { return JSON.parse(setting.value); } catch { /* fall through */ }
    }
    return DEFAULT_TRENDING;
  },
  ['hero-trending-slides'],
  { tags: ['hero', 'settings'] }
);

export async function setHeroTrending(data: HeroTrendingSlide[]) {
  await requireAdminAuth();
  await prisma.settings.upsert({
    where: { key: 'hero_trending' },
    update: { value: JSON.stringify(data) },
    create: { key: 'hero_trending', value: JSON.stringify(data) },
  });
  revalidateTag('hero', 'default');
  revalidatePath('/');
  revalidatePath('/admin');
}

export const getHeroGallery = unstable_cache(
  async (): Promise<HeroGalleryImage[]> => {
    const setting = await prisma.settings.findUnique({ where: { key: 'hero_gallery' } });
    if (setting) {
      try { return JSON.parse(setting.value); } catch { /* fall through */ }
    }
    return DEFAULT_GALLERY;
  },
  ['hero-gallery-images'],
  { tags: ['hero', 'settings'] }
);

export async function setHeroGallery(data: HeroGalleryImage[]) {
  await requireAdminAuth();
  await prisma.settings.upsert({
    where: { key: 'hero_gallery' },
    update: { value: JSON.stringify(data) },
    create: { key: 'hero_gallery', value: JSON.stringify(data) },
  });
  revalidateTag('hero', 'default');
  revalidatePath('/');
  revalidatePath('/admin');
}

// ========================
// ADMIN ANALYTICS
// ========================

export async function getAnalyticsData() {
  await requireAdminAuth();
  const orders = await prisma.order.findMany({
    select: { totalAmount: true, createdAt: true, status: true }
  });

  const sessionsCount = await prisma.gameSession.count();

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;

  const revenueByDay: Record<string, number> = {};
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    revenueByDay[dateString] = 0;
  }

  orders.forEach(order => {
    const dateString = new Date(order.createdAt).toISOString().split('T')[0];
    if (revenueByDay[dateString] !== undefined) {
      revenueByDay[dateString] += order.totalAmount;
    }
  });

  return {
    totalRevenue,
    totalOrders,
    totalSessions: sessionsCount,
    revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount }))
  };
}

// ========================
// RECEPTION OPERATIONS
// ========================

export async function checkInOnlineBooking(bookingId: string, paymentMethod: string = 'card') {
  await requireReceptionAuth();
  
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, console: true }
  });

  if (!booking || booking.status !== 'CONFIRMED') {
    return { error: 'Booking not found or not in confirmed status.' };
  }

  const now = new Date();
  const durationMs = booking.endTime.getTime() - booking.startTime.getTime();
  const durationSeconds = Math.max(1800, Math.floor(durationMs / 1000));
  const durationHours = durationSeconds / 3600;

  const baseRate = await getBaseHourlyRate();
  const totalAmount = Math.round(durationHours * baseRate);

  const activeSession = await prisma.gameSession.findFirst({
    where: { consoleId: booking.consoleId, status: 'ACTIVE', endTime: { gt: now } }
  });

  if (activeSession) {
    return { error: `Cannot check in: Station ${booking.console.hardwareTitle} is currently occupied.` };
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: booking.userId,
        totalAmount,
        paymentMethod,
        items: {
          create: [{
            name: `${booking.user.fullName || booking.user.username} - ${durationHours} Hr Booking`,
            price: totalAmount,
            type: 'session',
            quantity: 1
          }]
        }
      }
    });

    const sessionEndTime = new Date(now.getTime() + durationSeconds * 1000);
    const session = await tx.gameSession.create({
      data: {
        userId: booking.userId,
        guestName: booking.user.fullName || booking.user.username,
        consoleId: booking.consoleId,
        startTime: now,
        endTime: sessionEndTime,
        status: 'ACTIVE'
      }
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' }
    });

    const pointsEarned = Math.floor(totalAmount / 10);
    await tx.user.update({
      where: { id: booking.userId },
      data: { loyaltyPoints: { increment: pointsEarned } }
    });

    return { success: true, sessionId: session.id, orderId: order.id };
  });

  revalidatePath('/reception');
  return result;
}

export async function transferGameSession(sessionId: string, newConsoleId: string) {
  await requireReceptionAuth();

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: { console: true }
  });

  if (!session || (session.status !== 'ACTIVE' && session.status !== 'PAUSED')) {
    return { error: 'Active session not found.' };
  }

  if (session.consoleId === newConsoleId) {
    return { error: 'Session is already on this station.' };
  }

  const now = new Date();
  const destActive = await prisma.gameSession.findFirst({
    where: { consoleId: newConsoleId, status: 'ACTIVE', endTime: { gt: now } }
  });

  if (destActive) {
    return { error: 'Target station is currently occupied.' };
  }

  const destConsole = await prisma.console.findUnique({ where: { id: newConsoleId } });
  if (!destConsole) {
    await prisma.console.create({
      data: { id: newConsoleId, hardwareTitle: newConsoleId.toUpperCase() }
    });
  }

  const updated = await prisma.gameSession.update({
    where: { id: sessionId },
    data: { consoleId: newConsoleId }
  });

  revalidatePath('/reception');
  return { success: true, session: updated };
}

export async function pauseGameSession(sessionId: string, remainingSeconds: number) {
  await requireReceptionAuth();

  const updated = await prisma.gameSession.update({
    where: { id: sessionId },
    data: { 
      status: 'PAUSED',
      endTime: new Date(Date.now() + remainingSeconds * 1000)
    }
  });

  revalidatePath('/reception');
  return { success: true, session: updated };
}

export async function resumeGameSession(sessionId: string, remainingSeconds: number) {
  await requireReceptionAuth();

  const newEndTime = new Date(Date.now() + remainingSeconds * 1000);
  const updated = await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      status: 'ACTIVE',
      endTime: newEndTime
    }
  });

  revalidatePath('/reception');
  return { success: true, session: updated };
}

export async function getDailyShiftSummary() {
  await requireReceptionAuth();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay }
    },
    include: { items: true }
  });

  let cashTotal = 0;
  let cardTotal = 0;
  let accountTotal = 0;
  let grandTotal = 0;

  todayOrders.forEach(o => {
    grandTotal += o.totalAmount;
    if (o.paymentMethod === 'cash') cashTotal += o.totalAmount;
    else if (o.paymentMethod === 'card') cardTotal += o.totalAmount;
    else accountTotal += o.totalAmount;
  });

  const activeSessionsCount = await prisma.gameSession.count({
    where: { status: 'ACTIVE', endTime: { gt: new Date() } }
  });

  return {
    grandTotal,
    cashTotal,
    cardTotal,
    accountTotal,
    orderCount: todayOrders.length,
    activeSessionsCount
  };
}
