import { NextRequest, NextResponse } from 'next/server';
import {
  getTvConfigs,
  saveTvConfigs,
  triggerTvAction,
  StationTvConfig
} from '@/lib/tvController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configs = getTvConfigs();
    return NextResponse.json({ success: true, configs });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // If updating configuration
    if ((body.updateConfigs || body.action === 'save_configs') && Array.isArray(body.configs)) {
      const saved = saveTvConfigs(body.configs as StationTvConfig[]);
      return NextResponse.json({ success: saved, message: 'TV configurations saved successfully.', configs: getTvConfigs() });
    }

    // If updating a single station's TV configuration
    if (body.action === 'save_station_tv' && body.stationId) {
      const current = getTvConfigs();
      let matched = false;
      const updated = current.map((tv) => {
        if (tv.stationId.toLowerCase() === body.stationId.toLowerCase()) {
          matched = true;
          return {
            ...tv,
            ip: body.ip !== undefined ? String(body.ip).trim() : tv.ip,
            mac: body.mac !== undefined ? String(body.mac).trim() : tv.mac,
            tvBrand: body.tvBrand || tv.tvBrand,
            hdmiInput: body.hdmiInput || tv.hdmiInput,
            psk: body.psk !== undefined ? String(body.psk) : tv.psk,
            enabled: body.enabled !== undefined ? Boolean(body.enabled) : tv.enabled,
          };
        }
        return tv;
      });

      if (!matched) {
        // Station not in current list, add it
        updated.push({
          stationId: body.stationId,
          stationName: body.stationName || `Station ${body.stationId}`,
          tvBrand: body.tvBrand || 'LG',
          ip: body.ip ? String(body.ip).trim() : '',
          mac: body.mac ? String(body.mac).trim() : '',
          hdmiInput: body.hdmiInput || 'HDMI_1',
          psk: body.psk ? String(body.psk) : '',
          enabled: true,
        });
      }

      const saved = saveTvConfigs(updated);
      return NextResponse.json({
        success: saved,
        message: `Network settings saved for Station "${body.stationId}".`,
        configs: getTvConfigs()
      });
    }

    const { stationId, action, message, hdmiPort } = body;

    if (!stationId || !action) {
      return NextResponse.json(
        { success: false, message: 'Missing stationId or action parameter.' },
        { status: 400 }
      );
    }

    const result = await triggerTvAction(stationId, action, { message, hdmiPort });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Server error: ${errorMsg}` },
      { status: 500 }
    );
  }
}

