import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordLoyaltyTransaction, getLoyaltyRates } from '@/backend/actions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    const isStaff = role === 'ADMIN' || role === 'RECEPTIONIST';

    // Public data: consoles & snacks (no PII)
    const [consoles, snacks] = await Promise.all([
      prisma.console.findMany({
        include: { games: { include: { game: true } } },
      }),
      prisma.snack.findMany(),
    ]);

    const formattedConsoles = consoles.map((c) => ({
      id: c.id,
      hardwareTitle: c.hardwareTitle,
      hardwareSlug: c.hardwareSlug,
      hourlyRate: c.hourlyRate,
      imagePath: c.imagePath,
      specs: c.specs,
      games: c.games.map((g) => g.game.name),
    }));

    // PII-containing data: only for authenticated staff
    if (!isStaff) {
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        consoles: formattedConsoles,
        snacks,
        activeSessions: [],
        bookings: [],
        waitlist: [],
      });
    }

    const [activeSessions, bookings, waitlist] = await Promise.all([
      prisma.gameSession.findMany({
        where: { status: 'ACTIVE' },
        include: {
          user: { select: { id: true, name: true, fullName: true, phone: true, rank: true } },
          console: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          startTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        include: {
          user: { select: { id: true, name: true, fullName: true, phone: true, rank: true } },
          console: true,
        },
      }),
      prisma.waitlist.findMany({
        where: { status: 'WAITING' },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      consoles: formattedConsoles,
      snacks,
      activeSessions,
      bookings,
      waitlist,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[API /api/sync GET Error]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (role !== 'ADMIN' && role !== 'RECEPTIONIST') {
      return NextResponse.json({ success: false, error: 'Unauthorized staff access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { action, payload, mutationId } = body;

    switch (action) {
      case 'START_SESSION': {
        const { consoleId, userId, guestName, startTime, endTime, totalAmount, paymentMethod, orderItems, billingType, extraControllers } = payload;
        
        // Upsert/create session
        const newSession = await prisma.gameSession.create({
          data: {
            consoleId,
            userId: userId || null,
            guestName: guestName || null,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: 'ACTIVE',
            billingType: billingType || 'PREPAID',
            extraControllers: Number(extraControllers) || 0,
          },
        });

        // Create billing order if amount > 0
        let createdOrder = null;
        if (totalAmount && totalAmount > 0) {
          createdOrder = await prisma.order.create({
            data: {
              userId: userId || null,
              totalAmount: parseFloat(totalAmount),
              paymentMethod: paymentMethod || 'cash',
              status: 'COMPLETED',
              pointsRedeemed: payload.pointsRedeemed ? Number(payload.pointsRedeemed) : 0,
              items: {
                create: (orderItems || []).map((item: { name: string; price: string | number; quantity?: number; type?: string }) => ({
                  name: item.name,
                  price: parseFloat(String(item.price)),
                  quantity: item.quantity || 1,
                  type: item.type || 'session',
                })),
              },
            },
          });
        }

        // Award loyalty points for prepaid session start
        if (userId && totalAmount && totalAmount > 0) {
          try {
            const { spendPerPoint } = await getLoyaltyRates();
            const pointsEarned = Math.floor(parseFloat(totalAmount) / spendPerPoint);
            await prisma.$transaction(async (tx) => {
              if (payload.pointsRedeemed && Number(payload.pointsRedeemed) > 0) {
                await recordLoyaltyTransaction(tx, {
                  userId,
                  amount: -Number(payload.pointsRedeemed),
                  type: 'REDEEMED_GAMETIME',
                  description: `Offline Session Loyalty Discount (-${payload.pointsRedeemed} XP)`,
                  orderId: createdOrder?.id,
                });
              }
              if (pointsEarned > 0) {
                await recordLoyaltyTransaction(tx, {
                  userId,
                  amount: pointsEarned,
                  type: 'EARNED_SPEND',
                  description: `Offline Session Prepayment (+${pointsEarned} XP)`,
                  orderId: createdOrder?.id,
                });
              }
            });
          } catch (syncLoyaltyErr) {
            console.error('[Sync] Failed to process loyalty points for START_SESSION:', syncLoyaltyErr);
          }
        }

        return NextResponse.json({ success: true, mutationId, session: newSession });
      }

      case 'START_POSTPAID_SESSION': {
        const { consoleId, userId, guestName, extraControllers } = payload;
        const now = new Date();
        const openEndTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const newSession = await prisma.gameSession.create({
          data: {
            consoleId,
            userId: userId || null,
            guestName: guestName || null,
            startTime: now,
            endTime: openEndTime,
            status: 'ACTIVE',
            billingType: 'POSTPAID',
            extraControllers: Number(extraControllers) || 0,
          },
        });

        return NextResponse.json({ success: true, mutationId, session: newSession });
      }

      case 'SETTLE_POSTPAID_SESSION': {
        const { sessionId, totalAmount, paymentMethod, orderItems, pointsToRedeem } = payload;
        const now = new Date();

        const updatedSession = await prisma.gameSession.update({
          where: { id: sessionId },
          data: { status: 'COMPLETED', checkedOutAt: now, endTime: now },
        });

        const parsedAmount = totalAmount ? parseFloat(String(totalAmount)) : 0;
        let createdOrder = null;

        if (parsedAmount > 0 || (orderItems && orderItems.length > 0)) {
          createdOrder = await prisma.order.create({
            data: {
              userId: updatedSession.userId,
              totalAmount: parsedAmount,
              paymentMethod: paymentMethod || 'cash',
              status: 'COMPLETED',
              pointsRedeemed: pointsToRedeem ? Number(pointsToRedeem) : 0,
              items: {
                create: (orderItems || []).map((item: { name: string; price: string | number; quantity?: number; type?: string }) => ({
                  name: item.name,
                  price: parseFloat(String(item.price)),
                  quantity: item.quantity || 1,
                  type: item.type || 'session',
                })),
              },
            },
          });
        }

        // Process loyalty points and playtime sync
        if (updatedSession.userId) {
          try {
            const { spendPerPoint, pointsPerHour } = await getLoyaltyRates();
            const startMs = updatedSession.startTime.getTime();
            const durationHours = Math.max(1, Math.ceil((now.getTime() - startMs) / (1000 * 3600)));

            await prisma.$transaction(async (tx) => {
              if (pointsToRedeem && Number(pointsToRedeem) > 0) {
                await recordLoyaltyTransaction(tx, {
                  userId: updatedSession.userId!,
                  amount: -Number(pointsToRedeem),
                  type: 'REDEEMED_GAMETIME',
                  description: `Offline Settle Discount (-${pointsToRedeem} XP)`,
                  orderId: createdOrder?.id,
                });
              }

              const spendPts = parsedAmount > 0 ? Math.floor(parsedAmount / spendPerPoint) : 0;
              const playPts = durationHours * pointsPerHour;

              if (playPts > 0) {
                await recordLoyaltyTransaction(tx, {
                  userId: updatedSession.userId!,
                  amount: playPts,
                  type: 'EARNED_PLAYTIME',
                  description: `Offline Playtime Reward: ${durationHours}h (+${playPts} XP)`,
                  orderId: createdOrder?.id,
                });
              }

              if (spendPts > 0) {
                await recordLoyaltyTransaction(tx, {
                  userId: updatedSession.userId!,
                  amount: spendPts,
                  type: 'EARNED_SPEND',
                  description: `Offline Payment Reward (+${spendPts} XP)`,
                  orderId: createdOrder?.id,
                });
              }

              await tx.user.update({
                where: { id: updatedSession.userId! },
                data: {
                  sessionsCount: { increment: 1 },
                  playtimeHours: { increment: durationHours },
                }
              });
            });
          } catch (syncLoyaltyErr) {
            console.error('[Sync] Failed to process loyalty points for SETTLE_POSTPAID_SESSION:', syncLoyaltyErr);
          }
        }

        return NextResponse.json({ success: true, mutationId, session: updatedSession });
      }

      case 'EXTEND_SESSION': {
        const { sessionId, newEndTime, additionalAmount, paymentMethod, itemName } = payload;
        const updatedSession = await prisma.gameSession.update({
          where: { id: sessionId },
          data: { endTime: new Date(newEndTime) },
        });

        if (additionalAmount && additionalAmount > 0) {
          await prisma.order.create({
            data: {
              userId: updatedSession.userId,
              totalAmount: parseFloat(additionalAmount),
              paymentMethod: paymentMethod || 'cash',
              status: 'COMPLETED',
              items: {
                create: [
                  {
                    name: itemName || 'Session Extension',
                    price: parseFloat(additionalAmount),
                    quantity: 1,
                    type: 'session',
                  },
                ],
              },
            },
          });
        }

        return NextResponse.json({ success: true, mutationId, session: updatedSession });
      }

      case 'END_SESSION': {
        const { sessionId } = payload;
        const endedSession = await prisma.gameSession.update({
          where: { id: sessionId },
          data: { status: 'COMPLETED' },
        });
        return NextResponse.json({ success: true, mutationId, session: endedSession });
      }

      case 'CREATE_ORDER': {
        const { userId, totalAmount, paymentMethod, items } = payload;
        const order = await prisma.order.create({
          data: {
            userId: userId || null,
            totalAmount: parseFloat(totalAmount),
            paymentMethod: paymentMethod || 'cash',
            status: 'COMPLETED',
            items: {
              create: (items || []).map((i: { name: string; price: string | number; quantity?: number; type?: string }) => ({
                name: i.name,
                price: parseFloat(String(i.price)),
                quantity: i.quantity || 1,
                type: i.type || 'snack',
              })),
            },
          },
        });
        return NextResponse.json({ success: true, mutationId, order });
      }

      case 'ADD_WAITLIST': {
        const { name, requested } = payload;
        const waitlistEntry = await prisma.waitlist.create({
          data: {
            name,
            requested: requested || 'Any Console',
            status: 'WAITING',
          },
        });
        return NextResponse.json({ success: true, mutationId, waitlist: waitlistEntry });
      }

      case 'UPDATE_WAITLIST_STATUS': {
        const { waitlistId, status } = payload;
        const updated = await prisma.waitlist.update({
          where: { id: waitlistId },
          data: { status },
        });
        return NextResponse.json({ success: true, mutationId, waitlist: updated });
      }

      case 'CANCEL_BOOKING': {
        const { bookingId } = payload;
        const cancelled = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' },
        });
        return NextResponse.json({ success: true, mutationId, booking: cancelled });
      }

    default:
        if (action === 'SYNC_LOCAL_QUEUE') {
          const { syncLocalWithCloud } = await import('@/backend/localDb');
          const syncResult = await syncLocalWithCloud();
          return NextResponse.json({ ...syncResult });
        }
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[API /api/sync POST Error]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

