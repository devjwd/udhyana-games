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
  if (!query || query.trim().length < 2) return [];
  const clean = query.trim().replace(/^UDH[-:]/i, '');

  return await prisma.user.findMany({
    where: {
      OR: [
        { id: { contains: clean, mode: 'insensitive' } },
        { username: { contains: clean, mode: 'insensitive' } },
        { fullName: { contains: clean, mode: 'insensitive' } },
        { phone: { contains: clean, mode: 'insensitive' } },
        { email: { contains: clean, mode: 'insensitive' } }
      ]
    },
    take: 5,
    select: { id: true, username: true, fullName: true, phone: true, rank: true, loyaltyPoints: true }
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

export async function updateProduct(id: string, data: { name?: string; price?: number; category?: string; imageUrl?: string; description?: string }) {
  await requireAdminAuth();
  const updated = await prisma.product.update({
    where: { id },
    data
  });
  revalidateTag('products', 'default');
  revalidatePath('/admin');
  revalidatePath('/shop');
  return updated;
}

export const getProductById = unstable_cache(
  async (id: string) => {
    return await prisma.product.findUnique({ where: { id } });
  },
  ['product-by-id'],
  { tags: ['products'] }
);

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

export async function updateSnack(id: string, data: { name?: string; price?: number; icon?: string }) {
  await requireAdminAuth();
  const updated = await prisma.snack.update({
    where: { id },
    data
  });
  revalidateTag('snacks', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  return updated;
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

export async function updateConsole(id: string, data: { hardwareTitle?: string; hourlyRate?: number; imagePath?: string; specs?: string }) {
  await requireAdminAuth();
  const updated = await prisma.console.update({
    where: { id },
    data,
    include: {
      games: {
        include: {
          game: true
        }
      }
    }
  });
  revalidateTag('consoles', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  revalidatePath('/consoles');
  revalidatePath('/book');
  return updated;
}

export async function getAllMasterGames() {
  await requireReceptionAuth();
  return await prisma.game.findMany({
    orderBy: { name: 'asc' },
    include: {
      consoles: {
        select: {
          consoleId: true,
          console: { select: { hardwareTitle: true } }
        }
      }
    }
  });
}

export async function createMasterGame(name: string) {
  await requireReceptionAuth();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Game title cannot be empty.');

  const existing = await prisma.game.findUnique({ where: { name: trimmed } });
  if (existing) throw new Error('A game with this title already exists.');

  const newGame = await prisma.game.create({
    data: { name: trimmed }
  });

  revalidateTag('consoles', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  revalidatePath('/consoles');
  return newGame;
}

export async function deleteMasterGame(id: string) {
  await requireReceptionAuth();
  await prisma.game.delete({ where: { id } });

  revalidateTag('consoles', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  revalidatePath('/consoles');
}

export async function updateMasterGame(id: string, newName: string) {
  await requireReceptionAuth();
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Game title cannot be empty.');

  const existing = await prisma.game.findFirst({
    where: { name: trimmed, NOT: { id } }
  });
  if (existing) throw new Error('Another game with this title already exists.');

  const updated = await prisma.game.update({
    where: { id },
    data: { name: trimmed }
  });

  revalidateTag('consoles', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  revalidatePath('/consoles');
  return updated;
}

export async function assignGameToConsole(consoleId: string, gameId: string) {
  await requireReceptionAuth();
  const mapping = await prisma.consoleGames.upsert({
    where: { consoleId_gameId: { consoleId, gameId } },
    update: {},
    create: { consoleId, gameId }
  });

  revalidateTag('consoles', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  revalidatePath('/consoles');
  return mapping;
}

export async function removeGameFromConsole(consoleId: string, gameId: string) {
  await requireReceptionAuth();
  await prisma.consoleGames.deleteMany({
    where: { consoleId, gameId }
  });

  revalidateTag('consoles', 'default');
  revalidatePath('/admin');
  revalidatePath('/reception');
  revalidatePath('/consoles');
}

export async function toggleConsoleGame(consoleId: string, gameName: string) {
  await requireReceptionAuth();
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
  revalidatePath('/consoles');
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
        status: 'APPROVED',
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
  await requireAdminAuth();
  return await prisma.user.findMany({
    where: { status: 'PENDING' },
    select: { id: true, username: true, fullName: true, email: true, phone: true },
    orderBy: { id: 'desc' },
    take: limit
  });
}

export async function approveUser(userId: string) {
  await requireAdminAuth();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'APPROVED' }
  });
  revalidatePath('/admin');
  revalidatePath('/reception');
  return updated;
}

export async function rejectUser(userId: string) {
  await requireAdminAuth();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'REJECTED' }
  });
  revalidatePath('/admin');
  revalidatePath('/reception');
  return updated;
}

export async function getAllUsersWithRoles() {
  await requireAdminAuth();
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      fullName: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      rank: true,
      loyaltyPoints: true,
      sessionsCount: true,
      playtimeHours: true
    },
    orderBy: [
      { role: 'asc' }, // ADMIN, RECEPTIONIST, USER
      { status: 'asc' },
      { username: 'asc' }
    ]
  });
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
  revalidatePath('/reception');
  return updated;
}

export async function updateUserRole(userId: string, role: string) {
  await requireAdminAuth();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role }
  });
  revalidatePath('/admin');
  revalidatePath('/reception');
  return updated;
}

export async function getAllCustomersWithStats() {
  await requireAdminAuth();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      fullName: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      rank: true,
      loyaltyPoints: true,
      sessionsCount: true,
      playtimeHours: true,
      _count: {
        select: {
          orders: true,
          bookings: true,
          gameSessions: true
        }
      },
      orders: {
        select: {
          totalAmount: true
        }
      }
    },
    orderBy: [
      { loyaltyPoints: 'desc' },
      { username: 'asc' }
    ]
  });

  return users.map(u => {
    const totalSpend = u.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return {
      id: u.id,
      name: u.name,
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      rank: u.rank,
      loyaltyPoints: u.loyaltyPoints,
      sessionsCount: u.sessionsCount,
      playtimeHours: u.playtimeHours,
      ordersCount: u._count.orders,
      bookingsCount: u._count.bookings,
      gameSessionsCount: u._count.gameSessions,
      totalSpend
    };
  });
}

export async function getCustomerFullDossier(userId: string) {
  await requireAdminAuth();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      gameSessions: {
        take: 10,
        orderBy: { startTime: 'desc' },
        include: {
          console: { select: { hardwareTitle: true } }
        }
      },
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true
        }
      },
      bookings: {
        take: 10,
        orderBy: { startTime: 'desc' },
        include: {
          console: { select: { hardwareTitle: true } }
        }
      }
    }
  });

  if (!user) return null;

  const totalSpent = (user.orders || []).reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  return {
    ...user,
    totalSpent
  };
}

export async function updateCustomerProfile(userId: string, data: { fullName?: string; username?: string; phone?: string; email?: string; status?: string; rank?: string }) {
  await requireAdminAuth();
  if (data.username) {
    const cleanUsername = data.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const existing = await prisma.user.findFirst({
      where: { username: cleanUsername, NOT: { id: userId } }
    });
    if (existing) {
      throw new Error(`Username @${cleanUsername} is already taken.`);
    }
    data.username = cleanUsername;
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data
  });
  revalidatePath('/admin');
  revalidatePath('/reception');
  return updated;
}

export async function adminResetUserPassword(userId: string, newPassword?: string) {
  await requireAdminAuth();
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const hashedPassword = await bcrypt.hash(newPassword.trim(), 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  revalidatePath('/admin');
  revalidatePath('/reception');
  return { success: true };
}

export async function adminCreateUser(data: {
  username: string;
  fullName: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: string;
  rank?: string;
  status?: string;
}) {
  await requireAdminAuth();
  const cleanUsername = data.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 alphanumeric characters.');
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: cleanUsername },
        ...(data.email && data.email.trim() ? [{ email: data.email.trim() }] : [])
      ]
    }
  });
  if (existing) {
    throw new Error('A user with this username or email already exists.');
  }

  const hashedPassword = data.password && data.password.trim() ? await bcrypt.hash(data.password.trim(), 12) : null;

  const newUser = await prisma.user.create({
    data: {
      username: cleanUsername,
      fullName: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      password: hashedPassword,
      role: data.role || 'USER',
      rank: data.rank || 'Beginner',
      status: data.status || 'APPROVED'
    }
  });

  revalidatePath('/admin');
  revalidatePath('/reception');
  return newUser;
}

export async function deleteUserAccount(userId: string) {
  await requireAdminAuth();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User account not found.');

  if (user.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw new Error('Cannot delete the only remaining Administrator account.');
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath('/admin');
  revalidatePath('/reception');
  return { success: true };
}

// ========================
// BOOKINGS
// ========================

export async function createBooking(userId: string, consoleId: string, startTime: Date, durationHours: number) {
  await requireUserOrStaff(userId);
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
  const now = new Date();

  if (startTime < now) {
    return { error: 'Cannot book a time slot in the past.' };
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Check for double bookings inside transaction
    const conflictingBooking = await tx.booking.findFirst({
      where: {
        consoleId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } }
        ]
      }
    });

    if (conflictingBooking) {
      return { error: 'Console is already booked for this time slot.' };
    }

    // 2. Check for conflicting active walk-in game sessions
    const conflictingSession = await tx.gameSession.findFirst({
      where: {
        consoleId,
        status: 'ACTIVE',
        startTime: { lt: endTime },
        endTime: { gt: startTime }
      }
    });

    if (conflictingSession) {
      return { error: 'Console is occupied by an active walk-in session during this time.' };
    }

    const booking = await tx.booking.create({
      data: {
        userId,
        consoleId,
        startTime,
        endTime,
        status: 'PENDING'
      },
      include: {
        console: true
      }
    });

    revalidatePath('/profile');
    revalidatePath('/reception');
    revalidatePath('/book');
    return { success: true, booking };
  });
}

export async function getBookedSlots(consoleId: string, date: string) {
  // Date formatted as YYYY-MM-DD
  const [year, month, day] = date.split('-').map(Number);
  // Full 24-hour window spanning UTC and local day
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  // Also query local start and end of day
  const localStart = new Date(`${date}T00:00:00`);
  const localEnd = new Date(`${date}T23:59:59.999`);
  const minStart = startOfDay < localStart ? startOfDay : localStart;
  const maxEnd = endOfDay > localEnd ? endOfDay : localEnd;

  const bookings = await prisma.booking.findMany({
    where: {
      consoleId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      startTime: { lte: maxEnd },
      endTime: { gte: minStart }
    },
    select: { startTime: true, endTime: true }
  });

  const activeSessions = await prisma.gameSession.findMany({
    where: {
      consoleId,
      status: 'ACTIVE',
      startTime: { lte: maxEnd },
      endTime: { gte: minStart }
    },
    select: { startTime: true, endTime: true }
  });

  return [...bookings, ...activeSessions];
}

export async function cancelBooking(bookingId: string) {
  const session = await getAuthenticatedSession();
  const isStaff = session.user.role === 'ADMIN' || session.user.role === 'RECEPTIONIST';

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });

  if (!booking) {
    return { error: 'Booking not found.' };
  }

  if (booking.userId !== session.user.id && !isStaff) {
    throw new Error('Unauthorized: You cannot cancel this booking.');
  }

  if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
    return { error: `Booking is already ${booking.status.toLowerCase()}.` };
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' }
  });

  revalidatePath('/profile');
  revalidatePath('/reception');
  revalidatePath('/book');
  return { success: true, booking: updated };
}

export async function acceptBooking(bookingId: string) {
  await requireReceptionAuth();
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true, console: true }
  });

  if (!booking) {
    return { error: 'Booking not found.' };
  }

  if (booking.status !== 'PENDING') {
    return { error: `Booking is already ${booking.status.toLowerCase()}.` };
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED' }
  });

  revalidatePath('/profile');
  revalidatePath('/reception');
  revalidatePath('/book');
  return { success: true, booking: updated };
}

// ========================
// ACTIVE SESSIONS (GameSession)
// ========================

async function internalCompleteSessionRecord(session: {
  id: string;
  status: string;
  startTime: Date;
  endTime: Date;
  userId: string | null;
}) {
  if (session.status === 'COMPLETED') return null;

  const now = new Date();
  const endToUse = now > session.endTime ? session.endTime : now;
  const hoursPlayed = Math.max(0, Math.ceil((endToUse.getTime() - session.startTime.getTime()) / (1000 * 60 * 60)));

  const updatedSession = await prisma.gameSession.update({
    where: { id: session.id },
    data: {
      status: 'COMPLETED',
      checkedOutAt: now
    }
  });

  if (session.userId) {
    try {
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
    } catch (loyaltyErr) {
      console.error('Failed to update loyalty during session completion:', loyaltyErr);
    }
  }

  return updatedSession;
}

export async function getActiveSessions() {
  await requireReceptionAuth();
  const now = new Date();

  // Auto-complete stale sessions that have been expired for over 15 minutes
  const staleThreshold = new Date(now.getTime() - 15 * 60 * 1000);
  try {
    const staleSessions = await prisma.gameSession.findMany({
      where: {
        status: { in: ['ACTIVE', 'PAUSED'] },
        endTime: { lt: staleThreshold }
      }
    });

    for (const sess of staleSessions) {
      await internalCompleteSessionRecord(sess);
    }
  } catch (err) {
    console.error('Error auto-completing stale sessions in getActiveSessions:', err);
  }

  return await prisma.gameSession.findMany({
    where: { status: { in: ['ACTIVE', 'PAUSED'] } },
    include: {
      user: { select: { id: true, username: true, fullName: true, phone: true } },
      console: { select: { id: true, hardwareTitle: true } }
    },
    orderBy: { endTime: 'asc' }
  });
}

export async function addTimeToSession(
  sessionId: string,
  additionalSeconds: number,
  paymentMethod: string = 'cash',
  amount?: number
) {
  try {
    await requireReceptionAuth();
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { console: true, user: true }
    });
    if (!session || (session.status !== 'ACTIVE' && session.status !== 'PAUSED')) {
      return { error: 'Active session not found.' };
    }

    const baseRate = await getBaseHourlyRate();
    const calculatedAmount = amount !== undefined ? amount : Math.round((additionalSeconds / 3600) * baseRate);
    const baseEndTime = Math.max(session.endTime.getTime(), Date.now());
    const newEndTime = new Date(baseEndTime + additionalSeconds * 1000);
    const durationMinutes = Math.round(additionalSeconds / 60);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Game Session
      const updateData: { endTime: Date; pausedRemainingSeconds?: number } = { endTime: newEndTime };
      if (session.status === 'PAUSED') {
        updateData.pausedRemainingSeconds = (session.pausedRemainingSeconds || 0) + additionalSeconds;
      }

      const updatedSession = await tx.gameSession.update({
        where: { id: sessionId },
        data: updateData,
        include: { console: true, user: true }
      });

      // 2. Create Order & OrderItem to record the extension revenue
      const playerName = session.guestName || session.user?.fullName || session.user?.username || 'Player';
      const order = await tx.order.create({
        data: {
          userId: session.userId || null,
          totalAmount: calculatedAmount,
          paymentMethod,
          items: {
            create: [{
              name: `Time Extension (+${durationMinutes}m) - ${session.console.hardwareTitle} (${playerName})`,
              price: calculatedAmount,
              type: 'session',
              quantity: 1
            }]
          }
        }
      });

      // 3. Award loyalty points if registered user
      if (session.userId) {
        const pointsEarned = Math.floor(calculatedAmount / 10);
        if (pointsEarned > 0) {
          const user = await tx.user.update({
            where: { id: session.userId },
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
      }

      return { success: true, session: updatedSession, orderId: order.id };
    });

    revalidatePath('/reception');
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to extend session.';
    return { error: message };
  }
}

export async function endGameSession(sessionId: string) {
  await requireReceptionAuth();
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
  if (!session || session.status === 'COMPLETED') return null;

  const updatedSession = await internalCompleteSessionRecord(session);

  revalidatePath('/reception');
  revalidatePath('/profile');
  return updatedSession;
}

export async function endAllExpiredSessions() {
  await requireReceptionAuth();
  const now = new Date();
  const expiredSessions = await prisma.gameSession.findMany({
    where: {
      status: { in: ['ACTIVE', 'PAUSED'] },
      endTime: { lte: now }
    }
  });

  for (const sess of expiredSessions) {
    await internalCompleteSessionRecord(sess);
  }

  revalidatePath('/reception');
  revalidatePath('/profile');
  return { success: true, count: expiredSessions.length };
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
    include: { console: { select: { hardwareTitle: true } } },
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
  existingUserId?: string,
  waitlistItems?: { guestName: string; requestedConsoleName: string; durationSeconds: number; phone?: string; userId?: string }[]
) {
  try {
    await requireReceptionAuth();

    const result = await prisma.$transaction(async (tx) => {
      let userId = existingUserId;

      // 1. Resolve existing user if match is found; do not spam create empty stub user rows for pure guests
      if (!userId && walkInName && walkInName.trim()) {
        const cleanName = walkInName.trim();
        const existing = await tx.user.findFirst({
          where: {
            OR: [
              { username: { equals: cleanName, mode: 'insensitive' } },
              { fullName: { equals: cleanName, mode: 'insensitive' } },
              ...(walkInPhone?.trim() ? [{ phone: walkInPhone.trim() }] : [])
            ]
          },
          select: { id: true }
        });

        if (existing) {
          userId = existing.id;
        }
      }

      const now = new Date();

      // 2. Expire finished sessions & validate requested stations in parallel
      const cleanupPromise = tx.gameSession.updateMany({
        where: {
          status: 'ACTIVE',
          endTime: { lte: now }
        },
        data: { status: 'COMPLETED' }
      });

      if (sessionItems.length > 0) {
        const consoleIds = sessionItems.map(s => s.consoleId);
        const maxDuration = Math.max(...sessionItems.map(s => s.durationSeconds));
        const maxEndTime = new Date(now.getTime() + maxDuration * 1000);

        const [activeSessions, overlappingBookings] = await Promise.all([
          tx.gameSession.findMany({
            where: {
              consoleId: { in: consoleIds },
              status: { in: ['ACTIVE', 'PAUSED'] },
              endTime: { gt: now }
            },
            select: { consoleId: true, endTime: true }
          }),
          tx.booking.findMany({
            where: {
              consoleId: { in: consoleIds },
              status: 'CONFIRMED',
              startTime: { lt: maxEndTime },
              endTime: { gt: now }
            },
            select: { consoleId: true, startTime: true }
          }),
          cleanupPromise
        ]);

        if (activeSessions.length > 0) {
          const occupied = activeSessions[0];
          throw new Error(`Station is currently occupied until ${occupied.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
        }

        if (overlappingBookings.length > 0) {
          const booking = overlappingBookings[0];
          throw new Error(`Station is reserved for an online booking at ${booking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
        }

        // Auto-complete any expired sessions currently on these consoles to prevent stacking
        await tx.gameSession.updateMany({
          where: {
            consoleId: { in: consoleIds },
            status: { in: ['ACTIVE', 'PAUSED'] },
            endTime: { lte: now }
          },
          data: {
            status: 'COMPLETED',
            checkedOutAt: now
          }
        });
      } else {
        await cleanupPromise;
      }

      // 3. Create Order & Game Sessions & Waitlist entries in parallel
      const calculatedSum = orderItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
      const verifiedTotal = (totalAmount >= 0 && totalAmount <= calculatedSum) ? totalAmount : calculatedSum;

      const orderPromise = tx.order.create({
        data: {
          userId: userId || null,
          totalAmount: verifiedTotal,
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

      const sessionsPromise = sessionItems.length > 0
        ? tx.gameSession.createMany({
            data: sessionItems.map(item => ({
              userId: userId || null,
              guestName: item.guestName,
              consoleId: item.consoleId,
              endTime: new Date(now.getTime() + item.durationSeconds * 1000),
              status: 'ACTIVE' as const
            }))
          })
        : Promise.resolve();

      // Create paid Waitlist queue entries
      const waitlistPromise = (waitlistItems && waitlistItems.length > 0)
        ? tx.waitlist.createMany({
            data: waitlistItems.map(w => {
              const durationHrs = Math.round((w.durationSeconds / 3600) * 10) / 10;
              return {
                name: w.guestName,
                requested: `${w.requestedConsoleName} • ${durationHrs}h (PAID)`,
                status: 'WAITING'
              };
            })
          })
        : Promise.resolve();

      // 4. Calculate loyalty & rank update in a single pass if member is attached
      const loyaltyPromise = userId
        ? (async () => {
            const user = await tx.user.findUnique({
              where: { id: userId },
              select: { id: true, loyaltyPoints: true, rank: true }
            });
            if (user) {
              const pointsEarned = Math.floor(totalAmount / 10);
              const newPoints = (user.loyaltyPoints || 0) + pointsEarned;
              let newRank = user.rank;
              if (newPoints >= 1000) newRank = 'Elite';
              else if (newPoints >= 500) newRank = 'Pro';
              else if (newPoints >= 100) newRank = 'Regular';
              else newRank = 'Rookie';

              await tx.user.update({
                where: { id: userId },
                data: {
                  loyaltyPoints: newPoints,
                  rank: newRank
                }
              });
            }
          })()
        : Promise.resolve();

      const [order] = await Promise.all([orderPromise, sessionsPromise, waitlistPromise, loyaltyPromise]);

      return { success: true, orderId: order.id };
    });

    revalidatePath('/reception');
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred during checkout.';
    return { error: message };
  }
}

export async function startSessionFromWaitlist(
  waitlistId: string,
  consoleId: string,
  durationSeconds: number,
  guestName: string,
  userId?: string,
  isPrepaid: boolean = false,
  paymentMethod: string = 'cash',
  amount?: number
) {
  try {
    await requireReceptionAuth();
    const now = new Date();
    const endTime = new Date(now.getTime() + durationSeconds * 1000);

    // Check if station is occupied or reserved
    const [activeSession, overlappingBooking] = await Promise.all([
      prisma.gameSession.findFirst({
        where: {
          consoleId,
          status: { in: ['ACTIVE', 'PAUSED'] },
          endTime: { gt: now }
        },
        include: { console: true }
      }),
      prisma.booking.findFirst({
        where: {
          consoleId,
          status: 'CONFIRMED',
          startTime: { lt: endTime },
          endTime: { gt: now }
        }
      })
    ]);

    if (activeSession) {
      throw new Error(`Station is currently occupied until ${activeSession.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    }
    if (overlappingBooking) {
      throw new Error(`Station is reserved for an online booking at ${overlappingBooking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    }

    const baseRate = await getBaseHourlyRate();
    const calculatedAmount = amount !== undefined ? amount : Math.round((durationSeconds / 3600) * baseRate);
    const durationHours = Math.round((durationSeconds / 3600) * 10) / 10;

    const result = await prisma.$transaction(async (tx) => {
      const consoleObj = await tx.console.findUnique({ where: { id: consoleId } });
      const consoleName = consoleObj?.hardwareTitle || consoleId;

      // 1. If NOT prepaid, create order & invoice
      let orderId: string | undefined;
      if (!isPrepaid && calculatedAmount > 0) {
        const order = await tx.order.create({
          data: {
            userId: userId || null,
            totalAmount: calculatedAmount,
            paymentMethod,
            items: {
              create: [{
                name: `${guestName} - ${durationHours} Hr Session (${consoleName})`,
                price: calculatedAmount,
                type: 'session',
                quantity: 1
              }]
            }
          }
        });
        orderId = order.id;

        if (userId) {
          const pointsEarned = Math.floor(calculatedAmount / 10);
          if (pointsEarned > 0) {
            await tx.user.update({
              where: { id: userId },
              data: { loyaltyPoints: { increment: pointsEarned } }
            });
          }
        }
      }

      // Auto-complete any expired session on this console before starting
      await tx.gameSession.updateMany({
        where: {
          consoleId,
          status: { in: ['ACTIVE', 'PAUSED'] },
          endTime: { lte: now }
        },
        data: {
          status: 'COMPLETED',
          checkedOutAt: now
        }
      });

      // 2. Create Active GameSession
      const createdSession = await tx.gameSession.create({
        data: {
          consoleId,
          userId: userId || null,
          guestName,
          endTime,
          status: 'ACTIVE'
        },
        include: { console: true }
      });

      // 3. Mark Waitlist as ASSIGNED
      await tx.waitlist.update({
        where: { id: waitlistId },
        data: { status: 'ASSIGNED' }
      });

      return { session: createdSession, orderId };
    });

    revalidatePath('/reception');
    return { success: true, session: result.session, orderId: result.orderId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start session from waitlist.';
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
      status: { in: ['CONFIRMED', 'PENDING'] },
      endTime: { gte: new Date() }
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

export async function updateHeroGalleryImage(id: string, data: { label?: string; imageUrl?: string }) {
  await requireAdminAuth();
  const current = await getHeroGallery();
  const updated = current.map(item => item.id === id ? { ...item, ...data } : item);
  await setHeroGallery(updated);
  return updated;
}

// ========================
// ADMIN ANALYTICS ENGINE
// ========================

export async function getAnalyticsData(timeframe: '7d' | '30d' | 'all' = '7d') {
  await requireAdminAuth();

  const now = new Date();
  let startDate: Date | undefined;
  let totalDays = 7;

  if (timeframe === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    totalDays = 7;
  } else if (timeframe === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    totalDays = 30;
  } else {
    totalDays = 30;
  }

  const [orders, sessions, consoles] = await Promise.all([
    prisma.order.findMany({
      where: startDate ? { createdAt: { gte: startDate } } : {},
      include: { items: true },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.gameSession.findMany({
      where: startDate ? { startTime: { gte: startDate } } : {},
      include: { console: true }
    }),
    prisma.console.findMany({
      select: { id: true, hardwareTitle: true, hourlyRate: true }
    })
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const totalSessions = sessions.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // 1. Calculate Total Playtime Hours
  let totalPlaytimeMinutes = 0;
  sessions.forEach(s => {
    const start = new Date(s.startTime).getTime();
    const end = new Date(s.endTime).getTime();
    const mins = Math.max(0, Math.round((end - start) / 60000));
    totalPlaytimeMinutes += mins;
  });
  const totalPlaytimeHours = Math.round((totalPlaytimeMinutes / 60) * 10) / 10;

  // 2. Station-by-Station Revenue & Utilization
  const stationStatsMap: Record<string, {
    id: string;
    name: string;
    revenue: number;
    sessionsCount: number;
    playtimeMinutes: number;
  }> = {};

  consoles.forEach(c => {
    stationStatsMap[c.id] = {
      id: c.id,
      name: c.hardwareTitle,
      revenue: 0,
      sessionsCount: 0,
      playtimeMinutes: 0
    };
  });

  sessions.forEach(s => {
    if (!stationStatsMap[s.consoleId]) {
      stationStatsMap[s.consoleId] = {
        id: s.consoleId,
        name: s.console?.hardwareTitle || s.consoleId,
        revenue: 0,
        sessionsCount: 0,
        playtimeMinutes: 0
      };
    }

    const start = new Date(s.startTime).getTime();
    const end = new Date(s.endTime).getTime();
    const mins = Math.max(0, Math.round((end - start) / 60000));
    const hours = mins / 60;
    const rate = consoles.find(c => c.id === s.consoleId)?.hourlyRate || 1000;

    stationStatsMap[s.consoleId].sessionsCount += 1;
    stationStatsMap[s.consoleId].playtimeMinutes += mins;
    stationStatsMap[s.consoleId].revenue += Math.round(hours * rate);
  });

  // Calculate station utilization % (assumes 12 active lounge hours per day)
  const availableLoungeMinutesPerStation = totalDays * 12 * 60;
  const stationPerformance = Object.values(stationStatsMap).map(st => {
    const playtimeHours = Math.round((st.playtimeMinutes / 60) * 10) / 10;
    const utilizationPct = Math.min(100, Math.round((st.playtimeMinutes / Math.max(1, availableLoungeMinutesPerStation)) * 100));
    return {
      ...st,
      playtimeHours,
      utilizationPct
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // 3. Hourly Peak Time Distribution (24 Hours: 00:00 - 23:00)
  const hourlyRevenue: { hour: number; label: string; revenue: number; ordersCount: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    hourlyRevenue.push({
      hour: h,
      label: `${displayH} ${period}`,
      revenue: 0,
      ordersCount: 0
    });
  }

  orders.forEach(order => {
    const orderHour = new Date(order.createdAt).getHours();
    if (hourlyRevenue[orderHour]) {
      hourlyRevenue[orderHour].revenue += order.totalAmount;
      hourlyRevenue[orderHour].ordersCount += 1;
    }
  });

  // Find Peak Hour
  const sortedHours = [...hourlyRevenue].sort((a, b) => b.revenue - a.revenue);
  const peakHour = sortedHours[0] || { label: '6 PM - 10 PM', revenue: 0 };
  const peakHourShare = totalRevenue > 0 ? Math.round((peakHour.revenue / totalRevenue) * 100) : 0;

  // 4. Day-Part Time-of-Day Distribution
  const dayParts = {
    Morning: { name: 'Morning (8 AM – 12 PM)', revenue: 0, count: 0 },
    Afternoon: { name: 'Afternoon (12 PM – 5 PM)', revenue: 0, count: 0 },
    Evening: { name: 'Peak Evening (5 PM – 9 PM)', revenue: 0, count: 0 },
    Night: { name: 'Late Night (9 PM – 2 AM)', revenue: 0, count: 0 }
  };

  orders.forEach(order => {
    const h = new Date(order.createdAt).getHours();
    if (h >= 8 && h < 12) {
      dayParts.Morning.revenue += order.totalAmount;
      dayParts.Morning.count += 1;
    } else if (h >= 12 && h < 17) {
      dayParts.Afternoon.revenue += order.totalAmount;
      dayParts.Afternoon.count += 1;
    } else if (h >= 17 && h < 21) {
      dayParts.Evening.revenue += order.totalAmount;
      dayParts.Evening.count += 1;
    } else {
      dayParts.Night.revenue += order.totalAmount;
      dayParts.Night.count += 1;
    }
  });

  // 5. Revenue Streams (Sessions vs Snacks vs Products)
  let sessionsRevenue = 0;
  let snacksRevenue = 0;
  let productsRevenue = 0;

  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.type === 'session') sessionsRevenue += item.price * (item.quantity || 1);
      else if (item.type === 'snack') snacksRevenue += item.price * (item.quantity || 1);
      else productsRevenue += item.price * (item.quantity || 1);
    });
  });

  // 6. Payment Methods Split
  let cashRevenue = 0;
  let cardRevenue = 0;
  let accountRevenue = 0;

  orders.forEach(order => {
    const method = (order.paymentMethod || 'cash').toLowerCase();
    if (method === 'cash') cashRevenue += order.totalAmount;
    else if (method === 'card') cardRevenue += order.totalAmount;
    else accountRevenue += order.totalAmount;
  });

  // 7. Daily Timeline
  const revenueByDay: Record<string, number> = {};
  for (let i = totalDays - 1; i >= 0; i--) {
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
    timeframe,
    totalRevenue,
    totalOrders,
    totalSessions,
    totalPlaytimeHours,
    avgOrderValue,
    peakHour: {
      label: peakHour.label,
      revenue: peakHour.revenue,
      sharePct: peakHourShare
    },
    stationPerformance,
    hourlyRevenue,
    dayParts: Object.entries(dayParts).map(([key, val]) => ({
      key,
      name: val.name,
      revenue: val.revenue,
      count: val.count,
      pct: totalRevenue > 0 ? Math.round((val.revenue / totalRevenue) * 100) : 0
    })),
    revenueStreams: {
      sessions: sessionsRevenue,
      snacks: snacksRevenue,
      products: productsRevenue,
      sessionsPct: totalRevenue > 0 ? Math.round((sessionsRevenue / totalRevenue) * 100) : 0,
      snacksPct: totalRevenue > 0 ? Math.round((snacksRevenue / totalRevenue) * 100) : 0,
      productsPct: totalRevenue > 0 ? Math.round((productsRevenue / totalRevenue) * 100) : 0
    },
    paymentMethods: {
      cash: cashRevenue,
      card: cardRevenue,
      account: accountRevenue,
      cashPct: totalRevenue > 0 ? Math.round((cashRevenue / totalRevenue) * 100) : 0,
      cardPct: totalRevenue > 0 ? Math.round((cardRevenue / totalRevenue) * 100) : 0,
      accountPct: totalRevenue > 0 ? Math.round((accountRevenue / totalRevenue) * 100) : 0
    },
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

  if (!booking || (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING')) {
    return { error: 'Booking not found or not in confirmed/pending status.' };
  }

  const now = new Date();
  const durationMs = booking.endTime.getTime() - booking.startTime.getTime();
  const durationSeconds = Math.max(1800, Math.floor(durationMs / 1000));
  const durationHours = durationSeconds / 3600;

  const baseRate = await getBaseHourlyRate();
  const hourlyRateToUse = booking.console.hourlyRate || baseRate;
  const totalAmount = Math.round(durationHours * hourlyRateToUse);

  const activeSession = await prisma.gameSession.findFirst({
    where: { consoleId: booking.consoleId, status: { in: ['ACTIVE', 'PAUSED'] }, endTime: { gt: now } }
  });

  if (activeSession) {
    return { error: `Cannot check in: Station ${booking.console.hardwareTitle} is currently occupied.` };
  }

  const result = await prisma.$transaction(async (tx) => {
    // Auto-complete any expired session on this console
    await tx.gameSession.updateMany({
      where: {
        consoleId: booking.consoleId,
        status: { in: ['ACTIVE', 'PAUSED'] },
        endTime: { lte: now }
      },
      data: {
        status: 'COMPLETED',
        checkedOutAt: now
      }
    });

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
    return { error: 'Active or paused session not found.' };
  }

  if (session.consoleId === newConsoleId) {
    return { error: 'Session is already on this station.' };
  }

  const now = new Date();
  const sessionEndTime = session.endTime;

  const [destActive, overlappingBooking, destConsole] = await Promise.all([
    prisma.gameSession.findFirst({
      where: {
        consoleId: newConsoleId,
        status: { in: ['ACTIVE', 'PAUSED'] },
        endTime: { gt: now }
      }
    }),
    prisma.booking.findFirst({
      where: {
        consoleId: newConsoleId,
        status: 'CONFIRMED',
        startTime: { lt: sessionEndTime },
        endTime: { gt: now }
      }
    }),
    prisma.console.findUnique({ where: { id: newConsoleId } })
  ]);

  if (!destConsole) {
    return { error: 'Target station was not found in catalog.' };
  }

  if (destActive) {
    return { error: `Target station is currently occupied until ${destActive.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` };
  }

  if (overlappingBooking) {
    return { error: `Target station is reserved for an online booking at ${overlappingBooking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` };
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

  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) return { error: 'Session not found.' };

  const validRemaining = Math.max(
    1,
    remainingSeconds > 0
      ? remainingSeconds
      : Math.floor((session.endTime.getTime() - Date.now()) / 1000)
  );

  const updated = await prisma.gameSession.update({
    where: { id: sessionId },
    data: { 
      status: 'PAUSED',
      pausedRemainingSeconds: validRemaining
    }
  });

  revalidatePath('/reception');
  return { success: true, session: updated };
}

export async function resumeGameSession(sessionId: string, remainingSeconds?: number) {
  await requireReceptionAuth();

  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) return { error: 'Session not found.' };

  const secToUse = (session.pausedRemainingSeconds && session.pausedRemainingSeconds > 0)
    ? session.pausedRemainingSeconds
    : (remainingSeconds && remainingSeconds > 0 ? remainingSeconds : 60);

  const newEndTime = new Date(Date.now() + secToUse * 1000);
  const updated = await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      status: 'ACTIVE',
      endTime: newEndTime,
      pausedRemainingSeconds: 0
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
