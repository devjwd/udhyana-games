import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

const LOCAL_DB_DIR = path.join(process.cwd(), 'local_database');
const TERMINAL_STATE_PATH = path.join(LOCAL_DB_DIR, 'terminal_state.json');
const OFFLINE_QUEUE_PATH = path.join(LOCAL_DB_DIR, 'offline_sync_queue.json');
const LOCAL_MIRROR_PATH = path.join(LOCAL_DB_DIR, 'udhyana_local.json');

// Ensure local directory and files exist
function ensureFilesExist() {
  if (!fs.existsSync(LOCAL_DB_DIR)) {
    fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(OFFLINE_QUEUE_PATH)) {
    fs.writeFileSync(OFFLINE_QUEUE_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(TERMINAL_STATE_PATH)) {
    fs.writeFileSync(TERMINAL_STATE_PATH, JSON.stringify({
      lastSyncedAt: null,
      consoles: [],
      snacks: [],
      activeSessions: {},
      waitlist: [],
      pricing: { baseRate: 300, extraControllerRate: 100 }
    }, null, 2), 'utf-8');
  }
}

export type OfflineAction = {
  id: string;
  type: 'session_start' | 'session_end' | 'order_create' | 'snack_sale' | 'add_time' | 'customer_create';
  payload: any;
  timestamp: string;
};

// 1. Read Terminal State from local_database
export function getLocalTerminalState(): any {
  ensureFilesExist();
  try {
    const raw = fs.readFileSync(TERMINAL_STATE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[LocalDB] Failed to read terminal_state.json:', err);
    return null;
  }
}

// 2. Save Terminal State to local_database
export function saveLocalTerminalState(data: any): boolean {
  ensureFilesExist();
  try {
    fs.writeFileSync(TERMINAL_STATE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[LocalDB] Failed to save terminal_state.json:', err);
    return false;
  }
}

// 3. Read Offline Sync Queue
export function getOfflineQueue(): OfflineAction[] {
  ensureFilesExist();
  try {
    const raw = fs.readFileSync(OFFLINE_QUEUE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[LocalDB] Failed to read offline_sync_queue.json:', err);
    return [];
  }
}

// 4. Enqueue an offline action
export function enqueueOfflineAction(type: OfflineAction['type'], payload: any): OfflineAction {
  ensureFilesExist();
  const queue = getOfflineQueue();
  const action: OfflineAction = {
    id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    timestamp: new Date().toISOString()
  };

  queue.push(action);
  fs.writeFileSync(OFFLINE_QUEUE_PATH, JSON.stringify(queue, null, 2), 'utf-8');
  console.log(`[LocalDB] Enqueued offline action: ${type} (${action.id})`);
  return action;
}

// 5. Drain and sync all offline actions to Supabase cloud
export async function drainOfflineQueue(): Promise<{ processed: number; errors: number }> {
  ensureFilesExist();
  const queue = getOfflineQueue();
  if (queue.length === 0) return { processed: 0, errors: 0 };

  console.log(`[LocalDB] Starting offline sync flush: ${queue.length} pending items...`);
  let processed = 0;
  let errors = 0;
  const remainingQueue: OfflineAction[] = [];

  for (const action of queue) {
    try {
      if (action.type === 'session_start') {
        const { consoleId, userId, guestName, startTime, endTime, totalPaid, paymentMethod, notes } = action.payload;
        await prisma.gameSession.create({
          data: {
            consoleId,
            userId: userId || null,
            guestName: guestName || null,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: 'ACTIVE'
          }
        });

        if (totalPaid && totalPaid > 0) {
          await prisma.order.create({
            data: {
              userId: userId || null,
              totalAmount: totalPaid,
              paymentMethod: paymentMethod || 'cash',
              createdAt: new Date(startTime),
              items: {
                create: [{
                  name: `Session: ${guestName || 'Player'} (${consoleId})`,
                  price: totalPaid,
                  type: 'session',
                  quantity: 1
                }]
              }
            }
          });
        }
      } else if (action.type === 'session_end') {
        const { consoleId, endedAt } = action.payload;
        await prisma.gameSession.updateMany({
          where: { consoleId, status: { in: ['ACTIVE', 'PAUSED'] } },
          data: { status: 'COMPLETED', checkedOutAt: new Date(endedAt || Date.now()) }
        });
      } else if (action.type === 'order_create' || action.type === 'snack_sale') {
        const { userId, totalAmount, paymentMethod, items, createdAt } = action.payload;
        await prisma.order.create({
          data: {
            userId: userId || null,
            totalAmount: Number(totalAmount) || 0,
            paymentMethod: paymentMethod || 'cash',
            createdAt: new Date(createdAt || Date.now()),
            items: {
              create: (items || []).map((it: any) => ({
                name: it.name,
                price: Number(it.price) || 0,
                quantity: Number(it.quantity) || 1,
                type: it.type || 'snack'
              }))
            }
          }
        });
      } else if (action.type === 'add_time') {
        const { consoleId, additionalSeconds } = action.payload;
        const active = await prisma.gameSession.findFirst({
          where: { consoleId, status: { in: ['ACTIVE', 'PAUSED'] } }
        });
        if (active) {
          const newEndTime = new Date(active.endTime.getTime() + additionalSeconds * 1000);
          await prisma.gameSession.update({
            where: { id: active.id },
            data: { endTime: newEndTime }
          });
        }
      }
      processed++;
    } catch (err) {
      console.error(`[LocalDB] Error syncing action ${action.id} (${action.type}):`, err);
      errors++;
      remainingQueue.push(action);
    }
  }

  fs.writeFileSync(OFFLINE_QUEUE_PATH, JSON.stringify(remainingQueue, null, 2), 'utf-8');
  console.log(`[LocalDB] Sync complete: ${processed} synced, ${errors} remaining in queue.`);
  return { processed, errors };
}

// 6. Complete bi-directional sync (Flush offline queue + Pull cloud updates into local_database)
export async function syncLocalWithCloud(): Promise<{
  success: boolean;
  cloudConnected: boolean;
  offlineQueueCount: number;
  processedCount: number;
  lastSyncedAt: string;
}> {
  ensureFilesExist();
  const queueBefore = getOfflineQueue();

  try {
    // Test cloud connection
    await prisma.$queryRaw`SELECT 1`;

    // 1. Drain offline queue
    const { processed } = await drainOfflineQueue();

    // 2. Fetch fresh live state from Supabase
    const [consoles, snacks, activeSessions, pricingSettings] = await Promise.all([
      prisma.console.findMany({
        include: {
          games: {
            include: { game: true }
          }
        }
      }),
      prisma.snack.findMany({ orderBy: { price: 'asc' } }),
      prisma.gameSession.findMany({
        where: {
          status: { in: ['ACTIVE', 'PAUSED'] },
          endTime: { gt: new Date(Date.now() - 24 * 3600 * 1000) }
        },
        include: { console: true }
      }),
      prisma.settings.findMany({
        where: { key: { in: ['baseHourlyRate', 'extraControllerRate'] } }
      })
    ]);

    const formattedConsoles = consoles.map((c: any) => ({
      id: c.id,
      name: c.hardwareTitle,
      type: c.hardwareSlug || c.hardwareTitle,
      rate: c.hourlyRate || 300,
      games: (c.games || []).map((g: any) => g.game.name)
    }));

    const activeSessionsMap: Record<string, any> = {};
    activeSessions.forEach((s: any) => {
      activeSessionsMap[s.consoleId] = {
        sessionId: s.id,
        playerName: s.guestName || 'Player',
        startTime: s.startTime.getTime(),
        endTime: s.endTime.getTime(),
        isPaused: s.status === 'PAUSED',
        pausedRemainingMs: (s.pausedRemainingSeconds || 0) * 1000
      };
    });

    const baseRateSetting = pricingSettings.find((p: any) => p.key === 'baseHourlyRate');
    const extraCtrlSetting = pricingSettings.find((p: any) => p.key === 'extraControllerRate');

    const syncedSnapshot = {
      lastSyncedAt: new Date().toISOString(),
      cloudConnected: true,
      consoles: formattedConsoles,
      snacks: snacks.map((s: any) => ({ id: s.id, name: s.name, price: s.price, icon: s.icon || '🍿' })),
      activeSessions: activeSessionsMap,
      pricing: {
        baseRate: baseRateSetting ? Number(baseRateSetting.value) : 300,
        extraControllerRate: extraCtrlSetting ? Number(extraCtrlSetting.value) : 100
      }
    };

    // Save to local files
    saveLocalTerminalState(syncedSnapshot);
    fs.writeFileSync(LOCAL_MIRROR_PATH, JSON.stringify(syncedSnapshot, null, 2), 'utf-8');

    return {
      success: true,
      cloudConnected: true,
      offlineQueueCount: getOfflineQueue().length,
      processedCount: processed,
      lastSyncedAt: syncedSnapshot.lastSyncedAt
    };
  } catch (err) {
    console.warn('[LocalDB] Cloud Supabase unreachable, operating in offline mode with local_database/ files:', err);
    return {
      success: true,
      cloudConnected: false,
      offlineQueueCount: queueBefore.length,
      processedCount: 0,
      lastSyncedAt: new Date().toISOString()
    };
  }
}
