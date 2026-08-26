'use client';

import React, { useEffect, useState } from 'react';
import { syncManager, SyncStatus } from '@/lib/local-db/sync-manager';

export default function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatus>({
    state: 'ONLINE',
    pendingCount: 0,
    lastSyncedAt: null,
    lastError: null,
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await syncManager.triggerSync();
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (status.state === 'OFFLINE') return 'bg-rose-500';
    if (status.state === 'SYNCING' || isManualSyncing) return 'bg-amber-400 animate-pulse';
    return 'bg-emerald-400';
  };

  const getStatusText = () => {
    if (status.state === 'OFFLINE') {
      return status.pendingCount > 0
        ? `Offline (${status.pendingCount} queued)`
        : 'Offline (Local Only)';
    }
    if (status.state === 'SYNCING' || isManualSyncing) {
      return status.pendingCount > 0
        ? `Syncing (${status.pendingCount})...`
        : 'Syncing...';
    }
    return status.pendingCount > 0
      ? `Online (${status.pendingCount} pending)`
      : 'Online (Hybrid Synced)';
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-700/60 shadow-inner backdrop-blur-md text-xs font-mono select-none">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status.state === 'OFFLINE' ? 'bg-rose-400' : 'bg-emerald-400'
          }`}
        />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getStatusColor()}`} />
      </span>

      <span
        className={`font-semibold ${
          status.state === 'OFFLINE'
            ? 'text-rose-400'
            : status.state === 'SYNCING' || isManualSyncing
            ? 'text-amber-300'
            : 'text-emerald-400'
        }`}
      >
        {getStatusText()}
      </span>

      <button
        onClick={handleManualSync}
        disabled={status.state === 'SYNCING' || isManualSyncing || status.state === 'OFFLINE'}
        title="Sync local changes with cloud database"
        className="ml-1 p-1 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
      >
        <svg
          className={`w-3.5 h-3.5 ${status.state === 'SYNCING' || isManualSyncing ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
