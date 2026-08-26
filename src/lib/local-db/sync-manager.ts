import { localDb, SyncMutation, LocalGameSession, LocalOrder, LocalWaitlist } from './db';

export type SyncState = 'ONLINE' | 'OFFLINE' | 'SYNCING';

export interface SyncStatus {
  state: SyncState;
  pendingCount: number;
  lastSyncedAt: Date | null;
  lastError: string | null;
}

type SyncStatusListener = (status: SyncStatus) => void;

class SyncManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncedAt: Date | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncStatusListener> = new Set();
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      // Auto periodic sync every 30 seconds when online
      this.timer = setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.triggerSync();
        }
      }, 30000);
    }
  }

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    this.emitStatus(listener);
    return () => this.listeners.delete(listener);
  }

  private async getPendingCount(): Promise<number> {
    try {
      return await localDb.syncQueue.where('status').equals('PENDING').count();
    } catch {
      return 0;
    }
  }

  private async notify() {
    const pendingCount = await this.getPendingCount();
    const status: SyncStatus = {
      state: this.isSyncing ? 'SYNCING' : (this.isOnline ? 'ONLINE' : 'OFFLINE'),
      pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
    this.listeners.forEach((listener) => listener(status));
  }

  private async emitStatus(listener: SyncStatusListener) {
    const pendingCount = await this.getPendingCount();
    listener({
      state: this.isSyncing ? 'SYNCING' : (this.isOnline ? 'ONLINE' : 'OFFLINE'),
      pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    });
  }

  /**
   * Enqueues an action to be synchronized with the remote PostgreSQL database.
   */
  public async enqueue(actionType: SyncMutation['actionType'], payload: any): Promise<string> {
    const id = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const mutation: SyncMutation = {
      id,
      actionType,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: 'PENDING',
    };

    await localDb.syncQueue.add(mutation);
    await this.notify();

    // Trigger sync immediately if online
    if (this.isOnline) {
      this.triggerSync();
    }

    return id;
  }

  /**
   * Triggers a full bidirectional sync: Push pending mutations -> Pull latest data.
   */
  public async triggerSync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    this.lastError = null;
    await this.notify();

    try {
      // 1. Push local mutations
      await this.pushPendingMutations();

      // 2. Pull remote updates
      await this.pullRemoteUpdates();

      this.lastSyncedAt = new Date();
    } catch (err: any) {
      console.error('[SyncManager] Sync failed:', err);
      this.lastError = err.message || 'Sync failed';
    } finally {
      this.isSyncing = false;
      await this.notify();
    }
  }

  private async pushPendingMutations(): Promise<void> {
    const pendingMutations = await localDb.syncQueue
      .where('status')
      .equals('PENDING')
      .sortBy('createdAt');

    if (pendingMutations.length === 0) return;

    for (const mutation of pendingMutations) {
      try {
        await localDb.syncQueue.update(mutation.id, { status: 'SYNCING', attempts: mutation.attempts + 1 });

        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: mutation.actionType,
            payload: mutation.payload,
            mutationId: mutation.id,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with status ${res.status}`);
        }

        // Successfully synced
        await localDb.syncQueue.delete(mutation.id);
      } catch (error: any) {
        console.error(`[SyncManager] Failed to sync mutation ${mutation.id}:`, error);
        await localDb.syncQueue.update(mutation.id, {
          status: 'PENDING',
          lastError: error.message || 'Network error',
        });
        // Stop batch execution on network failure
        throw error;
      }
    }
  }

  private async pullRemoteUpdates(): Promise<void> {
    const res = await fetch('/api/sync?since=' + (this.lastSyncedAt ? this.lastSyncedAt.toISOString() : ''), {
      method: 'GET',
    });

    if (!res.ok) return;

    const data = await res.json();
    if (!data.success) return;

    // Cache remote state into local database
    if (data.consoles) {
      await localDb.consoles.bulkPut(data.consoles);
    }
    if (data.snacks) {
      await localDb.snacks.bulkPut(data.snacks);
    }
    if (data.activeSessions) {
      // Sync remote sessions to local
      const sessionsToPut: LocalGameSession[] = data.activeSessions.map((s: any) => ({
        id: s.id,
        userId: s.userId,
        guestName: s.guestName,
        consoleId: s.consoleId,
        startTime: new Date(s.startTime).toISOString(),
        endTime: new Date(s.endTime).toISOString(),
        status: s.status,
        synced: true,
        updatedAt: new Date().toISOString(),
      }));
      await localDb.gameSessions.bulkPut(sessionsToPut);
    }
    if (data.bookings) {
      await localDb.bookings.bulkPut(data.bookings);
    }
    if (data.waitlist) {
      const waitlistToPut: LocalWaitlist[] = data.waitlist.map((w: any) => ({
        id: w.id,
        name: w.name,
        requested: w.requested,
        status: w.status,
        createdAt: new Date(w.createdAt).toISOString(),
        synced: true,
      }));
      await localDb.waitlist.bulkPut(waitlistToPut);
    }
  }
}

export const syncManager = new SyncManager();
