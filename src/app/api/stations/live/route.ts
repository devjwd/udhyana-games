import { NextResponse } from 'next/server';
import { getLiveStationDisplayData } from '@/backend/actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getLiveStationDisplayData();
    return NextResponse.json({ success: true, ...data }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch live station data';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
