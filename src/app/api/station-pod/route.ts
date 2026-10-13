import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// In-memory queue for hardware/IR commands dispatched by reception (e.g., TV_POWER_OFF)
// Key: stationId -> pending command string (consumed once by the pod)
const pendingStationCommands: Map<string, string> = new Map();

/**
 * GET /api/station-pod?stationId=ps5-1
 * Polled by the ESP32 Station Pod every 2-4 seconds.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stationParam = searchParams.get('stationId') || searchParams.get('consoleId');

  if (!stationParam) {
    return NextResponse.json(
      { success: false, error: 'stationId parameter is required.' },
      { status: 400 }
    );
  }

  const cleanParam = stationParam.trim().toLowerCase();

  try {
    // 1. Locate console station matching ID, slug, or title
    const consoleStation = await prisma.console.findFirst({
      where: {
        OR: [
          { id: { equals: cleanParam, mode: 'insensitive' } },
          { hardwareSlug: { equals: cleanParam, mode: 'insensitive' } },
          { hardwareTitle: { contains: cleanParam, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        hardwareTitle: true,
        hardwareSlug: true
      }
    });

    if (!consoleStation) {
      return NextResponse.json(
        {
          success: true,
          stationId: stationParam,
          stationName: stationParam,
          status: 'IDLE',
          guestName: 'Available',
          remainingSeconds: 0,
          command: null
        }
      );
    }

    // 2. Fetch current active or paused session for this station
    const now = new Date();
    const activeSession = await prisma.gameSession.findFirst({
      where: {
        consoleId: consoleStation.id,
        status: { in: ['ACTIVE', 'PAUSED'] }
      },
      include: {
        user: {
          select: {
            fullName: true,
            username: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Pop any pending command for this station (e.g. TV_POWER_OFF)
    const command = pendingStationCommands.get(consoleStation.id) || null;
    if (command) {
      pendingStationCommands.delete(consoleStation.id);
    }

    // If no active session, station is IDLE
    if (!activeSession) {
      return NextResponse.json({
        success: true,
        stationId: consoleStation.id,
        stationName: consoleStation.hardwareTitle,
        status: 'IDLE',
        guestName: 'Available',
        remainingSeconds: 0,
        billingType: 'PREPAID',
        command
      });
    }

    // Resolve player name
    const guestName =
      activeSession.guestName?.trim() ||
      activeSession.user?.fullName?.trim() ||
      activeSession.user?.username?.trim() ||
      'Player';

    // 3. Compute remaining seconds
    let status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' = 'ACTIVE';
    let remainingSeconds = 0;

    if (activeSession.status === 'PAUSED') {
      status = 'PAUSED';
      remainingSeconds = Math.max(0, activeSession.pausedRemainingSeconds || 60);
    } else if (activeSession.billingType === 'POSTPAID') {
      // Open-ended postpaid session: count up elapsed seconds
      status = 'ACTIVE';
      remainingSeconds = Math.max(0, Math.floor((now.getTime() - activeSession.startTime.getTime()) / 1000));
    } else {
      // Fixed prepaid session: countdown to endTime
      const diffSec = Math.floor((new Date(activeSession.endTime).getTime() - now.getTime()) / 1000);
      if (diffSec <= 0) {
        status = 'EXPIRED';
        remainingSeconds = 0;
      } else {
        status = 'ACTIVE';
        remainingSeconds = diffSec;
      }
    }

    return NextResponse.json({
      success: true,
      stationId: consoleStation.id,
      stationName: consoleStation.hardwareTitle,
      status,
      guestName,
      remainingSeconds,
      billingType: activeSession.billingType,
      command
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/station-pod
 * Reception dispatch to queue commands to a station pod (e.g. TV_POWER_OFF / TV_POWER_ON)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stationId, command } = body;

    if (!stationId || !command) {
      return NextResponse.json(
        { success: false, error: 'stationId and command are required.' },
        { status: 400 }
      );
    }

    pendingStationCommands.set(stationId, command);
    return NextResponse.json({
      success: true,
      message: `Command '${command}' queued for station ${stationId}.`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
