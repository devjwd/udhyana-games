import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Validate terminal authorization: either via pre-shared secret or authenticated staff session
async function isAuthorized(req: NextRequest): Promise<boolean> {
  const secretHeader = req.headers.get('x-terminal-secret');
  const configuredSecret = process.env.NEXTAUTH_SECRET || 'super-secret-key-for-next-auth-123';

  if (secretHeader && secretHeader === configuredSecret) {
    return true;
  }

  // Fallback to NextAuth session
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    return role === 'ADMIN' || role === 'RECEPTIONIST';
  } catch {
    return false;
  }
}

// GET: Live data query & member search
export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized terminal access.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'catalog-and-live';

  try {
    // 1. Search Members by Name, Username, or Phone
    if (action === 'members') {
      const query = (searchParams.get('q') || '').trim();
      if (!query) {
        return NextResponse.json({ success: true, members: [] });
      }

      const members = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { fullName: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
          ],
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          phone: true,
          rank: true,
          loyaltyPoints: true,
          playtimeHours: true,
          sessionsCount: true,
        },
        take: 10,
        orderBy: { loyaltyPoints: 'desc' },
      });

      return NextResponse.json({ success: true, members });
    }

    // 2. Fetch Catalog, Rates, and Live Dashboard State
    if (action === 'catalog-and-live') {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const [consoles, snacks, activeSessions, bookings, baseRateSetting, extraRateSetting] = await Promise.all([
        prisma.console.findMany({
          include: { games: { include: { game: true } } },
          orderBy: { id: 'asc' },
        }),
        prisma.snack.findMany({ orderBy: { name: 'asc' } }),
        prisma.gameSession.findMany({
          where: {
            status: { in: ['ACTIVE', 'PAUSED'] },
          },
          include: {
            user: { select: { id: true, username: true, fullName: true, phone: true, rank: true, loyaltyPoints: true } },
            console: { select: { id: true, hardwareTitle: true } },
          },
          orderBy: { endTime: 'asc' },
        }),
        prisma.booking.findMany({
          where: {
            status: 'CONFIRMED',
            startTime: { gte: startOfDay },
          },
          include: {
            user: { select: { id: true, username: true, fullName: true, phone: true, rank: true } },
            console: { select: { id: true, hardwareTitle: true } },
          },
          orderBy: { startTime: 'asc' },
        }),
        prisma.settings.findUnique({ where: { key: 'baseHourlyRate' } }),
        prisma.settings.findUnique({ where: { key: 'extraControllerRate' } }),
      ]);

      const baseRate = baseRateSetting ? parseInt(baseRateSetting.value, 10) : 1000;
      const extraControllerRate = extraRateSetting ? parseInt(extraRateSetting.value, 10) : 200;

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        baseRate,
        extraControllerRate,
        consoles: consoles.map((c) => ({
          id: c.id,
          name: c.hardwareTitle,
          type: c.hardwareSlug || c.hardwareTitle,
          rate: c.hourlyRate,
          games: c.games.map((g) => g.game.name),
        })),
        snacks: snacks.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
        })),
        activeSessions: activeSessions.map((s) => ({
          id: s.id,
          consoleId: s.consoleId,
          playerName: s.guestName || s.user?.fullName || s.user?.username || 'Guest',
          phone: s.user?.phone || null,
          userId: s.userId || null,
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString(),
          status: s.status,
          pausedRemainingSeconds: s.pausedRemainingSeconds || 0,
        })),
        upcomingBookings: bookings.map((b: any) => ({
          id: b.id,
          consoleId: b.consoleId,
          consoleName: b.console.hardwareTitle,
          playerName: b.guestName || b.user?.fullName || b.user?.username || 'Reserved Player',
          phone: b.guestPhone || b.user?.phone || null,
          startTime: b.startTime.toISOString(),
          endTime: b.endTime.toISOString(),
        })),
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action parameter.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal terminal query error';
    console.error('[API /api/terminal GET Error]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST: POS Checkout, Session Control, and Profile Loyalty Sync
export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized terminal access.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // A. POS Checkout with Cloud Profile & Points Awarding
    if (action === 'CHECKOUT') {
      const {
        cartItems,
        totalAmount,
        paymentMethod = 'cash',
        sessionData = [],
        walkInName,
        walkInPhone,
        userId: providedUserId,
      } = body;

      const result = await prisma.$transaction(async (tx) => {
        let userId = providedUserId;

        // Auto-match user if not explicitly passed by ID
        if (!userId && walkInName && walkInName.trim()) {
          const cleanName = walkInName.trim();
          const matched = await tx.user.findFirst({
            where: {
              OR: [
                { username: { equals: cleanName, mode: 'insensitive' } },
                { fullName: { equals: cleanName, mode: 'insensitive' } },
                ...(walkInPhone?.trim() ? [{ phone: walkInPhone.trim() }] : []),
              ],
            },
            select: { id: true },
          });
          if (matched) userId = matched.id;
        }

        const now = new Date();

        // 1. Create Order & Line Items
        const calculatedSum = (cartItems || []).reduce((sum: number, it: { price: number }) => sum + (Number(it.price) || 0), 0);
        const finalAmount = totalAmount >= 0 && totalAmount <= calculatedSum ? totalAmount : calculatedSum;

        const order = await tx.order.create({
          data: {
            userId: userId || null,
            totalAmount: finalAmount,
            paymentMethod,
            status: 'COMPLETED',
            items: {
              create: (cartItems || []).map((item: { name: string; price: number; type?: string; quantity?: number }) => ({
                name: item.name,
                price: parseFloat(String(item.price)),
                type: item.type || 'session',
                quantity: item.quantity || 1,
              })),
            },
          },
        });

        // 2. Create Active Game Sessions in PostgreSQL
        const createdSessions: Array<{ id: string; consoleId: string; endTime: Date }> = [];
        for (const s of sessionData) {
          const durationSeconds = Number(s.durationSeconds) || (Number(s.durationHours) * 3600) || 3600;
          const endTime = new Date(now.getTime() + durationSeconds * 1000);

          const newSession = await tx.gameSession.create({
            data: {
              userId: userId || null,
              guestName: s.playerName || walkInName || 'Guest',
              consoleId: s.consoleId,
              startTime: now,
              endTime,
              status: 'ACTIVE',
              pausedRemainingSeconds: 0,
            },
          });
          createdSessions.push({ id: newSession.id, consoleId: newSession.consoleId, endTime });
        }

        // 3. Award Loyalty Points & Update Player Profile in Real-Time
        let updatedProfile: { loyaltyPoints: number; rank: string; playtimeHours: number } | null = null;
        if (userId) {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, loyaltyPoints: true, rank: true, sessionsCount: true, playtimeHours: true },
          });

          if (user) {
            const pointsEarned = Math.floor(finalAmount / 10);
            const newPoints = (user.loyaltyPoints || 0) + pointsEarned;
            const hoursAdded = Math.max(1, Math.round(sessionData.reduce((acc: number, s: { durationHours?: number; durationSeconds?: number }) => acc + (s.durationHours || (s.durationSeconds ? s.durationSeconds / 3600 : 1)), 0)));

            let newRank = user.rank;
            if (newPoints >= 1000) newRank = 'Elite';
            else if (newPoints >= 500) newRank = 'Pro';
            else if (newPoints >= 100) newRank = 'Regular';
            else newRank = 'Rookie';

            const updated = await tx.user.update({
              where: { id: userId },
              data: {
                loyaltyPoints: newPoints,
                rank: newRank,
                sessionsCount: { increment: sessionData.length },
                playtimeHours: { increment: hoursAdded },
              },
            });

            updatedProfile = {
              loyaltyPoints: updated.loyaltyPoints,
              rank: updated.rank,
              playtimeHours: updated.playtimeHours,
            };
          }
        }

        return {
          orderId: order.id,
          totalAmount: finalAmount,
          createdSessions,
          updatedProfile,
        };
      });

      return NextResponse.json({ success: true, ...result });
    }

    // B. Session Extension
    if (action === 'EXTEND') {
      const { sessionId, consoleId, addedSeconds, addedPrice, paymentMethod = 'cash', playerName } = body;

      const result = await prisma.$transaction(async (tx) => {
        const session = await tx.gameSession.findFirst({
          where: {
            OR: [
              ...(sessionId ? [{ id: sessionId }] : []),
              ...(consoleId ? [{ consoleId, status: { in: ['ACTIVE', 'PAUSED'] } }] : []),
            ],
          },
        });

        if (!session) throw new Error('Session not found to extend.');

        const addedMs = Number(addedSeconds) * 1000;
        const now = Date.now();
        let newEndTime: Date;

        if (session.status === 'PAUSED') {
          await tx.gameSession.update({
            where: { id: session.id },
            data: {
              pausedRemainingSeconds: (session.pausedRemainingSeconds || 0) + Number(addedSeconds),
            },
          });
          newEndTime = session.endTime;
        } else {
          const baseMs = session.endTime.getTime() < now ? now : session.endTime.getTime();
          newEndTime = new Date(baseMs + addedMs);
          await tx.gameSession.update({
            where: { id: session.id },
            data: { endTime: newEndTime },
          });
        }

        // Record Extension Order
        let orderId = '';
        if (addedPrice && addedPrice > 0) {
          const order = await tx.order.create({
            data: {
              userId: session.userId || null,
              totalAmount: addedPrice,
              paymentMethod,
              status: 'COMPLETED',
              items: {
                create: [
                  {
                    name: `Time Extension (+${Math.round(addedSeconds / 60)}m) - ${session.consoleId} (${playerName || 'Player'})`,
                    price: addedPrice,
                    type: 'session',
                    quantity: 1,
                  },
                ],
              },
            },
          });
          orderId = order.id;

          // Award loyalty points if registered member
          if (session.userId) {
            const pointsEarned = Math.floor(addedPrice / 10);
            if (pointsEarned > 0) {
              await tx.user.update({
                where: { id: session.userId },
                data: { loyaltyPoints: { increment: pointsEarned } },
              });
            }
          }
        }

        return { sessionId: session.id, newEndTime: newEndTime.toISOString(), orderId };
      });

      return NextResponse.json({ success: true, ...result });
    }

    // C. Pause & Resume Session
    if (action === 'PAUSE') {
      const { sessionId, consoleId, remainingSeconds } = body;
      const session = await prisma.gameSession.findFirst({
        where: {
          OR: [
            ...(sessionId ? [{ id: sessionId }] : []),
            ...(consoleId ? [{ consoleId, status: 'ACTIVE' }] : []),
          ],
        },
      });

      if (!session) throw new Error('Active session not found to pause.');

      const validRem = Math.max(
        1,
        remainingSeconds ? Number(remainingSeconds) : Math.floor((session.endTime.getTime() - Date.now()) / 1000)
      );

      await prisma.gameSession.update({
        where: { id: session.id },
        data: { status: 'PAUSED', pausedRemainingSeconds: validRem },
      });

      return NextResponse.json({ success: true, sessionId: session.id, pausedRemainingSeconds: validRem });
    }

    if (action === 'RESUME') {
      const { sessionId, consoleId } = body;
      const session = await prisma.gameSession.findFirst({
        where: {
          OR: [
            ...(sessionId ? [{ id: sessionId }] : []),
            ...(consoleId ? [{ consoleId, status: 'PAUSED' }] : []),
          ],
        },
      });

      if (!session) throw new Error('Paused session not found to resume.');

      const secToUse = session.pausedRemainingSeconds && session.pausedRemainingSeconds > 0 ? session.pausedRemainingSeconds : 60;
      const newEndTime = new Date(Date.now() + secToUse * 1000);

      await prisma.gameSession.update({
        where: { id: session.id },
        data: { status: 'ACTIVE', endTime: newEndTime, pausedRemainingSeconds: 0 },
      });

      return NextResponse.json({ success: true, sessionId: session.id, newEndTime: newEndTime.toISOString() });
    }

    // D. End Session Early
    if (action === 'END') {
      const { sessionId, consoleId } = body;
      const session = await prisma.gameSession.findFirst({
        where: {
          OR: [
            ...(sessionId ? [{ id: sessionId }] : []),
            ...(consoleId ? [{ consoleId, status: { in: ['ACTIVE', 'PAUSED'] } }] : []),
          ],
        },
      });

      if (!session) throw new Error('Session not found to end.');

      await prisma.gameSession.update({
        where: { id: session.id },
        data: { status: 'COMPLETED' },
      });

      return NextResponse.json({ success: true, sessionId: session.id });
    }

    return NextResponse.json({ success: false, error: 'Unknown action specified.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terminal operation failed.';
    console.error('[API /api/terminal POST Error]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
