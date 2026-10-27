import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ConsoleItem {
  id: string;
  hardwareTitle: string;
  hardwareSlug?: string | null;
  hourlyRate?: number | null;
  games?: Array<{ game?: { name: string } } | string>;
}

interface RawSession {
  id: string;
  consoleId: string;
  status: string;
  billingType: string;
  startTime: Date | string;
  endTime: Date | string;
  pausedRemainingSeconds?: number | null;
  extraControllers?: number;
  guestName?: string | null;
  user?: { fullName?: string | null; username?: string | null } | null;
}

// Pending staff assistance calls map: stationId -> { stationName, time }
const activeStaffCalls: Map<string, { stationName: string; time: Date }> = new Map();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stationParam = searchParams.get('stationId') || searchParams.get('id');

  let dbConsoles: ConsoleItem[] = [];
  let dbSessions: RawSession[] = [];
  let isOffline = false;

  // 1. Fetch from Prisma or fallback to local JSON database
  try {
    const [consoles, sessions] = await Promise.all([
      prisma.console.findMany({
        include: {
          games: {
            include: { game: true }
          }
        },
        orderBy: { hardwareTitle: 'asc' }
      }),
      prisma.gameSession.findMany({
        where: {
          status: { in: ['ACTIVE', 'PAUSED'] }
        },
        include: {
          user: {
            select: { fullName: true, username: true }
          }
        },
        orderBy: { endTime: 'asc' }
      })
    ]);

    dbConsoles = consoles as unknown as ConsoleItem[];
    dbSessions = sessions as unknown as RawSession[];
  } catch (err) {
    isOffline = true;
    console.warn('[StationDisplayAPI] Database unreachable, reading local JSON fallback:', err);
    try {
      const localFilePath = path.join(process.cwd(), 'local_database', 'udhyana_local.json');
      if (fs.existsSync(localFilePath)) {
        const localData = JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
        if (localData.consoles) {
          dbConsoles = localData.consoles.map((c: { id: string; hardwareTitle: string; hourlyRate?: number; games?: string[] }) => ({
            id: c.id,
            hardwareTitle: c.hardwareTitle,
            hardwareSlug: c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            hourlyRate: c.hourlyRate || 300,
            games: (c.games || []).map((name: string) => ({ game: { name } }))
          }));
        }
        if (localData.sessions) {
          dbSessions = localData.sessions.filter((s: { status: string }) => s.status === 'ACTIVE' || s.status === 'PAUSED');
        }
      }
    } catch (fsErr) {
      console.error('[StationDisplayAPI] Failed reading local database:', fsErr);
    }
  }

  const allStationsSummary = dbConsoles.map((c) => ({
    id: c.id,
    name: c.hardwareTitle,
    slug: c.hardwareSlug || c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }));

  // If no stationId provided, return catalog of all stations for launcher
  if (!stationParam) {
    return NextResponse.json({
      success: true,
      allStations: allStationsSummary,
      offline: isOffline
    });
  }

  // 2. Locate target station
  const cleanParam = stationParam.trim().toLowerCase();
  const matchedConsole = dbConsoles.find((c) => {
    const idMatch = c.id.toLowerCase() === cleanParam;
    const slugMatch = c.hardwareSlug && c.hardwareSlug.toLowerCase() === cleanParam;
    const titleMatch = c.hardwareTitle.toLowerCase() === cleanParam;
    const partialMatch =
      c.hardwareTitle.toLowerCase().includes(cleanParam) ||
      cleanParam.includes(c.id.toLowerCase()) ||
      (c.hardwareSlug && cleanParam.includes(c.hardwareSlug.toLowerCase()));
    return idMatch || slugMatch || titleMatch || partialMatch;
  });

  const resolvedStation = matchedConsole || {
    id: stationParam,
    hardwareTitle: `Station (${stationParam})`,
    hardwareSlug: cleanParam,
    hourlyRate: 300,
    games: []
  };

  const gamesList: string[] = Array.isArray(resolvedStation.games)
    ? resolvedStation.games.map((g) => (typeof g === 'string' ? g : g?.game?.name || '')).filter(Boolean)
    : [];

  // 3. Find active session for this console
  const now = new Date();
  const activeSession = dbSessions.find((s) => s.consoleId === resolvedStation.id);

  if (!activeSession) {
    return NextResponse.json({
      success: true,
      station: {
        id: resolvedStation.id,
        name: resolvedStation.hardwareTitle,
        slug: resolvedStation.hardwareSlug || resolvedStation.id,
        hourlyRate: resolvedStation.hourlyRate || 300,
        games: gamesList
      },
      session: {
        id: null,
        status: 'IDLE',
        guestName: 'Available to Play',
        billingType: 'PREPAID',
        remainingSeconds: 0,
        elapsedSeconds: 0,
        totalDurationSeconds: 0,
        extraControllers: 0,
        startTime: null,
        endTime: null
      },
      allStations: allStationsSummary,
      offline: isOffline
    });
  }

  // 4. Compute session timer calculations
  const startTime = new Date(activeSession.startTime);
  const endTime = new Date(activeSession.endTime);
  const totalDurationSeconds = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000));

  let status: 'ACTIVE' | 'ENDING_SOON' | 'EXPIRED' | 'PAUSED' = 'ACTIVE';
  let remainingSeconds = 0;

  if (activeSession.status === 'PAUSED') {
    status = 'PAUSED';
    remainingSeconds = Math.max(0, activeSession.pausedRemainingSeconds ?? 60);
  } else if (activeSession.billingType === 'POSTPAID') {
    status = 'ACTIVE';
    remainingSeconds = elapsedSeconds; // counts up
  } else {
    // PREPAID countdown
    const diffSec = Math.floor((endTime.getTime() - now.getTime()) / 1000);
    if (diffSec <= 0) {
      status = 'EXPIRED';
      remainingSeconds = 0;
    } else {
      remainingSeconds = diffSec;
      if (diffSec <= 300) {
        status = 'ENDING_SOON';
      } else {
        status = 'ACTIVE';
      }
    }
  }

  const guestName =
    activeSession.guestName?.trim() ||
    activeSession.user?.fullName?.trim() ||
    activeSession.user?.username?.trim() ||
    'Player';

  return NextResponse.json({
    success: true,
    station: {
      id: resolvedStation.id,
      name: resolvedStation.hardwareTitle,
      slug: resolvedStation.hardwareSlug || resolvedStation.id,
      hourlyRate: resolvedStation.hourlyRate || 300,
      games: gamesList
    },
    session: {
      id: activeSession.id,
      status,
      guestName,
      billingType: activeSession.billingType || 'PREPAID',
      remainingSeconds,
      elapsedSeconds,
      totalDurationSeconds,
      extraControllers: activeSession.extraControllers || 0,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    },
    allStations: allStationsSummary,
    staffCallPending: activeStaffCalls.has(resolvedStation.id),
    offline: isOffline
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stationId, stationName, action } = body;

    if (!stationId) {
      return NextResponse.json({ success: false, error: 'stationId is required' }, { status: 400 });
    }

    if (action === 'DISMISS_CALL') {
      activeStaffCalls.delete(stationId);
      return NextResponse.json({ success: true, message: 'Call dismissed' });
    }

    // Default action: CALL_STAFF
    activeStaffCalls.set(stationId, {
      stationName: stationName || stationId,
      time: new Date()
    });

    console.log(`[StaffCall] 🛎️ Assistance requested by ${stationName || stationId} at ${new Date().toLocaleTimeString()}`);

    return NextResponse.json({
      success: true,
      message: `Staff called for ${stationName || stationId}`
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
