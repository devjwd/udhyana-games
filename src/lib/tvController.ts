import fs from 'node:fs';
import path from 'node:path';
import wol from 'wake_on_lan';
import LGTV from 'lgtv2';

export interface StationTvConfig {
  stationId: string;
  stationName: string;
  tvBrand: 'LG' | 'SONY';
  ip: string;
  mac: string;
  hdmiInput: string; // e.g. "HDMI_1" or "1"
  psk?: string;      // Sony pre-shared key
  enabled: boolean;
}

const CONFIG_PATH = path.join(process.cwd(), 'local_database', 'tv_config.json');
const LG_KEYS_PATH = path.join(process.cwd(), 'local_database', 'lg_tv_keys.json');

export function getTvConfigs(): StationTvConfig[] {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read tv_config.json:', err);
    return [];
  }
}

export function saveTvConfigs(configs: StationTvConfig[]): boolean {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configs, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write tv_config.json:', err);
    return false;
  }
}

export function getTvConfigForStation(stationId: string): StationTvConfig | undefined {
  const configs = getTvConfigs();
  return configs.find(
    c => c.stationId.toLowerCase() === stationId.toLowerCase() ||
         c.stationName.toLowerCase().includes(stationId.toLowerCase())
  );
}

/**
 * Broadcasts Wake-on-LAN magic packet to TV MAC address
 */
export function wakeTv(mac: string): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    if (!mac || !mac.trim()) {
      return resolve({ success: false, message: 'No MAC address configured for this TV.' });
    }
    wol.wake(mac.trim(), (err: Error | null) => {
      if (err) {
        resolve({ success: false, message: `Wake-on-LAN failed: ${err.message}` });
      } else {
        resolve({ success: true, message: `Wake-on-LAN magic packet broadcasted to ${mac}` });
      }
    });
  });
}

/**
 * Execute command on LG webOS Smart TV
 */
export function sendLgCommand(
  ip: string,
  uri: string,
  payload: Record<string, unknown> = {},
  timeoutMs = 7000
): Promise<{ success: boolean; message: string; data?: unknown }> {
  return new Promise((resolve) => {
    if (!ip || !ip.trim()) {
      return resolve({ success: false, message: 'LG TV IP address is missing.' });
    }

    let finished = false;
    let pairingPrompted = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        try { lgtv.disconnect(); } catch {}
        if (pairingPrompted) {
          resolve({
            success: false,
            message: `Pairing prompt was sent to LG TV (${ip}), but timed out waiting for you to click [Accept] with your LG remote.`
          });
        } else {
          resolve({
            success: false,
            message: `Connection timed out after ${timeoutMs / 1000}s. Ensure the TV is powered ON and on the same Wi-Fi (${ip}). Check TV screen for a pairing prompt!`
          });
        }
      }
    }, timeoutMs);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lgtv = (LGTV as any)({
      url: `ws://${ip}:3000`, // lgtv2 auto-negotiates 3001 (secure) and 3000
      timeout: timeoutMs,
      reconnect: false,
      keyFile: LG_KEYS_PATH
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lgtv.on('error', (err: any) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        try { lgtv.disconnect(); } catch {}
        resolve({
          success: false,
          message: `LG TV error: ${err?.message || String(err)}`
        });
      }
    });

    lgtv.on('prompt', () => {
      pairingPrompted = true;
      console.log(`[LG TV] Pairing prompt active on screen at ${ip}. Click Accept on remote.`);
    });

    lgtv.on('connect', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lgtv.request(uri, payload, (err: any, res: any) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          try { lgtv.disconnect(); } catch {}
          if (err) {
            resolve({
              success: false,
              message: `LG command error: ${err?.message || String(err)}`
            });
          } else {
            resolve({
              success: true,
              message: `LG TV command [${uri.replace('ssap://', '')}] executed successfully.`,
              data: res
            });
          }
        }
      });
    });
  });
}

/**
 * Execute command on Sony Bravia Smart TV (REST API)
 */
export async function sendSonyCommand(
  ip: string,
  psk: string,
  endpoint: 'system' | 'avContent',
  method: string,
  params: unknown[]
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    if (!ip || !ip.trim()) {
      return { success: false, message: 'Sony TV IP address is missing.' };
    }

    const res = await fetch(`http://${ip}/sony/${endpoint}`, {
      method: 'POST',
      headers: {
        'X-Auth-PSK': psk || 'udhyana123',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method,
        version: '1.0',
        id: 1,
        params
      }),
      signal: AbortSignal.timeout(6000)
    });

    const data = await res.json();
    if (data.error) {
      return { success: false, message: `Sony API error: ${JSON.stringify(data.error)}` };
    }
    return { success: true, message: 'Sony TV command executed successfully.', data: data.result };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Sony TV connection failed: ${errorMsg}` };
  }
}

/**
 * Unified high-level trigger for TV actions per station
 */
export async function triggerTvAction(
  stationId: string,
  action: 'wake' | 'turnOff' | 'turnOn' | 'toast' | 'warning5Min' | 'switchHdmi' | 'screenOff' | 'screenOn' | 'showPhoto' | 'gallery',
  options?: { message?: string; hdmiPort?: string; imageUrl?: string }
): Promise<{ success: boolean; message: string; tv?: StationTvConfig; data?: unknown }> {
  const tv = getTvConfigForStation(stationId);
  if (!tv) {
    return { success: false, message: `No Smart TV configuration found for Station "${stationId}".` };
  }

  if (action === 'wake' || action === 'turnOn') {
    if (tv.tvBrand === 'LG') {
      const wolResult = await wakeTv(tv.mac);
      return { ...wolResult, tv };
    } else {
      // Sony REST power ON
      const sonyRes = await sendSonyCommand(tv.ip, tv.psk || '', 'system', 'setPowerStatus', [{ status: true }]);
      return { ...sonyRes, tv };
    }
  }

  if (tv.tvBrand === 'LG') {
    switch (action) {
      case 'toast': {
        const msg = options?.message || `🎮 Station ${tv.stationName}: Lounge Alert`;
        const res = await sendLgCommand(tv.ip, 'ssap://system.notifications/createToast', { message: msg });
        return { ...res, tv };
      }
      case 'warning5Min': {
        const msg = options?.message || `⚠️ 5 Minutes remaining on ${tv.stationName}! Please wrap up or extend at Reception.`;
        const res = await sendLgCommand(tv.ip, 'ssap://system.notifications/createToast', { message: msg });
        return { ...res, tv };
      }
      case 'turnOff': {
        const res = await sendLgCommand(tv.ip, 'ssap://system/turnOff');
        return { ...res, tv };
      }
      case 'screenOff': {
        // Try Method 1: tvpower turnOffScreen with standbyMode active
        const res1 = await sendLgCommand(tv.ip, 'ssap://com.webos.service.tvpower/power/turnOffScreen', { standbyMode: 'active' });
        if (res1.success) return { ...res1, tv };

        // Fallback Method 2: picture energySaving screen_off (compatible with webOS 3, 4, 4.5)
        const res2 = await sendLgCommand(tv.ip, 'ssap://settings/setSystemSettings', {
          category: 'picture',
          settings: {
            energySaving: 'screen_off',
            energySavingModified: 'true'
          }
        });
        if (res2.success) return { ...res2, tv, message: 'Screen blackout enabled via Energy Saving mode.' };

        return {
          success: false,
          message: `Screen blackout is restricted by this LG webOS firmware (${res1.message}). Use "Power OFF" instead to shut off the display!`,
          tv
        };
      }
      case 'screenOn': {
        // Try Method 1: turnOnScreen
        const res1 = await sendLgCommand(tv.ip, 'ssap://com.webos.service.tvpower/power/turnOnScreen', {});
        if (res1.success) return { ...res1, tv };

        // Fallback Method 2: energySaving off
        const res2 = await sendLgCommand(tv.ip, 'ssap://settings/setSystemSettings', {
          category: 'picture',
          settings: {
            energySaving: 'off',
            energySavingModified: 'true'
          }
        });
        return { ...res2, tv };
      }
      case 'switchHdmi': {
        const portStr = (options?.hdmiPort || tv.hdmiInput || '1').replace(/[^0-9]/g, '') || '1';
        const appId = `com.webos.app.hdmi${portStr}`;
        const res = await sendLgCommand(tv.ip, 'ssap://com.webos.applicationManager/launch', { id: appId });
        return { ...res, tv };
      }
      case 'showPhoto': {
        const url = options?.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920';
        const res = await sendLgCommand(tv.ip, 'ssap://system.launcher/open', { target: url });
        return { ...res, tv, message: 'Displaying poster photo on TV screen!' };
      }
      case 'gallery': {
        // Launches LG native framed gallery mode
        const res = await sendLgCommand(tv.ip, 'ssap://com.webos.applicationManager/launch', { id: 'com.webos.app.igallery' });
        if (res.success) return { ...res, tv, message: 'LG Art Gallery mode activated.' };
        // Fallback to Photo & Video viewer
        const res2 = await sendLgCommand(tv.ip, 'ssap://com.webos.applicationManager/launch', { id: 'com.webos.app.photovideo' });
        return { ...res2, tv, message: 'Opened LG Photo & Video viewer.' };
      }
      default:
        return { success: false, message: `Unknown action "${action}" for LG TV.`, tv };
    }
  } else if (tv.tvBrand === 'SONY') {
    switch (action) {
      case 'turnOff': {
        const res = await sendSonyCommand(tv.ip, tv.psk || '', 'system', 'setPowerStatus', [{ status: false }]);
        return { ...res, tv };
      }
      case 'switchHdmi': {
        const portNum = parseInt((options?.hdmiPort || tv.hdmiInput || '1').replace(/[^0-9]/g, '') || '1', 10);
        const res = await sendSonyCommand(tv.ip, tv.psk || '', 'avContent', 'setPlayContent', [{ uri: `extInput:hdmi?port=${portNum}` }]);
        return { ...res, tv };
      }
      default:
        return { success: false, message: `Action "${action}" not implemented for Sony TV.`, tv };
    }
  }

  return { success: false, message: `Unsupported TV brand: ${tv.tvBrand}` };
}

