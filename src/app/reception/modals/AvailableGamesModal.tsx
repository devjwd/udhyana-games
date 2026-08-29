'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from '../page.module.css';
import { getAllMasterGames, createMasterGame, toggleConsoleGame, deleteMasterGame } from '@/backend/actions';
import { ConsoleStation } from '../types';
import toast from 'react-hot-toast';

interface AvailableGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  consoles: ConsoleStation[];
  onSelectStation?: (consoleId: string) => void;
}

interface MasterGameItem {
  id: string;
  name: string;
  consoles?: { consoleId: string; console?: { hardwareTitle: string } }[];
}

export default function AvailableGamesModal({
  isOpen,
  onClose,
  consoles,
  onSelectStation
}: AvailableGamesModalProps) {
  const [games, setGames] = useState<MasterGameItem[]>([]);
  const [search, setSearch] = useState('');
  const [newGameTitle, setNewGameTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadGames = useCallback(async () => {
    try {
      const data = await getAllMasterGames();
      setGames(data as unknown as MasterGameItem[]);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      let active = true;
      getAllMasterGames()
        .then((data) => {
          if (active) setGames(data as unknown as MasterGameItem[]);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }
  }, [isOpen]);

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameTitle.trim()) return;

    setIsAdding(true);
    try {
      await createMasterGame(newGameTitle.trim());
      toast.success(`"${newGameTitle.trim()}" added to library!`);
      setNewGameTitle('');
      await loadGames();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add game.';
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStationGame = async (consoleId: string, gameName: string) => {
    try {
      await toggleConsoleGame(consoleId, gameName);
      toast.success('Station games updated!');
      await loadGames();
    } catch {
      toast.error('Failed to update station game.');
    }
  };

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (confirm(`Delete "${gameName}" from lounge library?`)) {
      try {
        await deleteMasterGame(gameId);
        toast.success(`"${gameName}" removed.`);
        await loadGames();
      } catch {
        toast.error('Failed to delete game.');
      }
    }
  };

  if (!isOpen) return null;

  const filteredGames = games.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={styles.modalOverlay}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modalContent} style={{ width: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🎮</span> Available Games Catalog & Station Directory
          </h2>
          <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        {/* Quick Add Game Form */}
        <form onSubmit={handleAddGame} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            className={styles.input}
            value={newGameTitle}
            onChange={e => setNewGameTitle(e.target.value)}
            placeholder="Add new game title (e.g. Black Myth: Wukong, FC 25)..."
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={!newGameTitle.trim() || isAdding}
            className={styles.actionBtnPrimary}
            style={{ padding: '0 1rem', whiteSpace: 'nowrap' }}
          >
            {isAdding ? 'Adding...' : '+ Add Game'}
          </button>
        </form>

        {/* Search Input */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            className={styles.input}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search available games..."
            autoFocus
          />
        </div>

        {/* Games List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
          {filteredGames.map(g => {
            const installedConsoleIds = g.consoles?.map((c: { consoleId: string }) => c.consoleId) || [];

            return (
              <div
                key={g.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                    {g.name}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: installedConsoleIds.length > 0 ? 'rgba(193, 255, 28, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: installedConsoleIds.length > 0 ? 'var(--primary-accent)' : 'rgba(255,255,255,0.4)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {installedConsoleIds.length} Stations Installed
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGame(g.id, g.name)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 107, 107, 0.6)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: '0.2rem'
                      }}
                      title="Delete game from lounge catalog"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Installed Station Badges with Quick Assign Click */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginRight: '0.25rem' }}>Installed on:</span>
                  {consoles.map(con => {
                    const isInstalled = installedConsoleIds.includes(con.id);
                    return (
                      <button
                        key={con.id}
                        type="button"
                        onClick={() => {
                          if (isInstalled && onSelectStation) {
                            onSelectStation(con.id);
                            toast.success(`Selected ${con.name}`);
                            onClose();
                          } else {
                            handleToggleStationGame(con.id, g.name);
                          }
                        }}
                        style={{
                          background: isInstalled ? 'rgba(193, 255, 28, 0.12)' : 'rgba(255,255,255,0.02)',
                          border: isInstalled ? '1px solid rgba(193, 255, 28, 0.3)' : '1px dashed rgba(255,255,255,0.15)',
                          color: isInstalled ? 'var(--primary-accent)' : 'rgba(255,255,255,0.3)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title={isInstalled ? `Click to assign ${con.name}` : `Click to install on ${con.name}`}
                      >
                        {isInstalled ? `✓ ${con.name}` : `+ ${con.name}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredGames.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
              No games found matching &quot;{search}&quot;. Type above to add it!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
