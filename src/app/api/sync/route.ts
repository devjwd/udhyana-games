import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
        const { consoleId, userId, guestName, startTime, endTime, totalAmount, paymentMethod, orderItems } = payload;
        
        // Upsert/create session
        const newSession = await prisma.gameSession.create({
          data: {
            consoleId,
            userId: userId || null,
            guestName: guestName || null,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: 'ACTIVE',
          },
        });

        // Create billing order if amount > 0
        if (totalAmount && totalAmount > 0) {
          await prisma.order.create({
            data: {
              userId: userId || null,
              totalAmount: parseFloat(totalAmount),
              paymentMethod: paymentMethod || 'cash',
              status: 'COMPLETED',
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

        return NextResponse.json({ success: true, mutationId, session: newSession });
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

