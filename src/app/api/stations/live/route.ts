import { NextResponse } from 'next/server';
import { getLiveStationDisplayData } from '@/backend/actions';

export const dynamic = 'force-dynamic';

interface CachedBoard {
  success: boolean;
  [key: string]: unknown;
}

let cachedResponse: CachedBoard | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 4000; // 4-second in-memory server cache for instantaneous responses

export async function GET() {
  try {
    const now = Date.now();
    // Return cached in-memory response in 1ms if recent
    if (cachedResponse && now - lastFetchTime < CACHE_TTL_MS) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=8',
        }
      });
    }

    const data = await getLiveStationDisplayData();
    cachedResponse = { success: true, ...data };
    lastFetchTime = now;

    return NextResponse.json(cachedResponse, {
      headers: {
        'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=8',
      }
    });
  } catch (err: unknown) {
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }
    const msg = err instanceof Error ? err.message : 'Failed to fetch live station data';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
