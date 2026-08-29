'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '../../page.module.css';
import { ConsoleStation, DurationOption } from '../../types';
import { searchUsers } from '@/backend/actions';
import toast from 'react-hot-toast';
import MemberScannerModal from '../../modals/MemberScannerModal';
import AvailableGamesModal from '../../modals/AvailableGamesModal';

interface WalkInFormProps {
  consoles: ConsoleStation[];
  durations: DurationOption[];
  extraControllerRate: number;
  checkAvailability: (consoleId: string, durationSeconds: number) => {
    available: boolean;
    reason: string;
    isOccupied: boolean;
    isReserved: boolean;
  };
  onAddToCart: (item: {
    id?: string;
    type?: 'session' | 'waitlist' | 'snack';
    name: string;
    price: number;
    consoleId?: string;
    consoleName?: string;
    durationSeconds?: number;
    phone?: string;
    userId?: string;
    extraControllers?: number;
  }) => void;
  onAddToWaitlist?: (name: string, requestedStation: string) => Promise<void>;
  prefilledName?: string;
  onClearPrefill?: () => void;
}

interface CustomerSearchResult {
  id: string;
  username?: string | null;
  fullName?: string | null;
  phone?: string | null;
  rank?: string;
  loyaltyPoints?: number;
}

export default function WalkInForm({
  consoles,
  durations,
  extraControllerRate,
  checkAvailability,
  onAddToCart,
  prefilledName,
  onClearPrefill
}: WalkInFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [selectedConsoleId, setSelectedConsoleId] = useState<string>('');
  const [selectedDurationId, setSelectedDurationId] = useState<string>('3600');
  const [additionalControllers, setAdditionalControllers] = useState<number>(0);
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGamesModalOpen, setIsGamesModalOpen] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'PS5' | 'PC' | 'XBOX'>('ALL');

  // Search state
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync prefill from waitlist if triggered (pure render-time state adjustment)
  const [prevPrefilled, setPrevPrefilled] = useState(prefilledName);
  if (prefilledName !== prevPrefilled) {
    setPrevPrefilled(prefilledName);
    if (prefilledName) {
      setName(prefilledName);
      setSelectedUserId(undefined);
      if (onClearPrefill) onClearPrefill();
    }
  }

  // Click outside to dismiss search results
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    const val = typeof e === 'string' ? e : e.target.value;
    setName(val);
    setSelectedUserId(undefined);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchUsers(val.trim());
          setSearchResults(results as CustomerSearchResult[]);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 250);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectUser = (u: CustomerSearchResult) => {
    setSelectedUserId(u.id);
    setName(u.fullName || u.username || '');
    if (u.phone) setPhone(u.phone);
    setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Gamer Tag / Name is required');
      return;
    }
    if (!selectedConsoleId) {
      toast.error('Please assign a gaming station');
      return;
    }

    const durationObj = durations.find(d => d.id === selectedDurationId) || durations[1] || durations[0];
    const availability = checkAvailability(selectedConsoleId, durationObj.seconds);

    if (!availability.available) {
      toast.error(`Cannot start session: ${availability.reason}. Queue player on waitlist.`);
      return;
    }

    const consoleObj = consoles.find(c => c.id === selectedConsoleId);
    if (!consoleObj) return;

    const extraFee = additionalControllers * extraControllerRate;
    const sessionTitle = `${name.trim()} - ${durationObj.name}${additionalControllers > 0 ? ` (+${additionalControllers} Controller${additionalControllers > 1 ? 's' : ''})` : ''}`;

    onAddToCart({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'session',
      name: sessionTitle,
      price: durationObj.price + extraFee,
      consoleId: selectedConsoleId,
      consoleName: consoleObj.name,
      durationSeconds: durationObj.seconds,
      phone: phone.trim() || undefined,
      userId: selectedUserId,
      extraControllers: additionalControllers
    });

    // Reset form
    setName('');
    setPhone('');
    setSelectedUserId(undefined);
    setSelectedConsoleId('');
    setAdditionalControllers(0);
    setGameSearchQuery('');
  };

  const handleWaitlistClick = () => {
    if (!name.trim()) {
      toast.error('Gamer Tag / Name is required to join waitlist');
      return;
    }

    const durationObj = durations.find(d => d.id === selectedDurationId) || durations[1] || durations[0];
    const consoleObj = consoles.find(c => c.id === selectedConsoleId);
    const stationLabel = consoleObj ? consoleObj.name : 'Any Station';
    const extraFee = additionalControllers * extraControllerRate;
    const itemPrice = durationObj.price + extraFee;

    onAddToCart({
      id: `waitlist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'waitlist',
      name: `[Waitlist] ${name.trim()} - ${durationObj.name} (${stationLabel})`,
      price: itemPrice,
      consoleId: selectedConsoleId || undefined,
      consoleName: stationLabel,
      durationSeconds: durationObj.seconds,
      phone: phone.trim() || undefined,
      userId: selectedUserId,
      extraControllers: additionalControllers
    });

    toast.success(`Added ${name.trim()} to cart as Paid Waitlist! Complete checkout to confirm queue spot.`, { icon: '⏳' });

    setName('');
    setPhone('');
    setSelectedUserId(undefined);
    setSelectedConsoleId('');
    setAdditionalControllers(0);
    setGameSearchQuery('');
  };

  const filteredConsoles = consoles.filter(c => {
    if (platformFilter === 'PS5' && !c.name.toLowerCase().includes('ps5') && !c.id.startsWith('ps5')) return false;
    if (platformFilter === 'PC' && !c.name.toLowerCase().includes('pc') && !c.id.startsWith('pc')) return false;
    if (platformFilter === 'XBOX' && !c.name.toLowerCase().includes('xbox') && !c.id.startsWith('xbox')) return false;
    return true;
  });

  const selectedDuration = durations.find(d => d.id === selectedDurationId) || durations[1] || durations[0];
  const selectedConsoleAvailability = selectedConsoleId
    ? checkAvailability(selectedConsoleId, selectedDuration.seconds)
    : { available: true, reason: '', isOccupied: false, isReserved: false };

  const selectedConsoleObj = consoles.find(c => c.id === selectedConsoleId);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <h2 className={styles.panelHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>Walk-In Registration</h2>
        <span className={styles.panelBadge}>New Session</span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Gamer Tag / User Lookup */}
        <div className={styles.field} ref={searchContainerRef} style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className={styles.label}>
              Gamer Tag / Customer Name
              {selectedUserId ? (
                <span className={styles.verifiedMemberBadge}>[Verified Member]</span>
              ) : name.length >= 2 ? (
                <span className={styles.newAccountBadge}>(New Guest)</span>
              ) : null}
            </label>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className={styles.actionBtnPrimary}
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
              title="Scan Member Pass QR / Barcode"
            >
              <span>📷</span> Scan Pass / QR
            </button>
          </div>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            className={styles.input}
            placeholder="Search verified member, scan pass QR, or enter guest name"
            required
            autoComplete="off"
          />

          {searchResults.length > 0 && (
            <div className={styles.searchDropdown}>
              {searchResults.map(u => (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={styles.searchResultItem}
                >
                  <div className={styles.searchResultName}>{u.fullName || u.username}</div>
                  <div className={styles.searchResultMeta}>
                    <span>{u.phone || 'No phone'}</span>
                    <span>@{u.username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isSearching && <div className={styles.searchLoading}>Searching players...</div>}
        </div>

        {/* Contact Number */}
        <div className={styles.field}>
          <label className={styles.label}>Contact No (Optional)</label>
          <input
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className={styles.input}
            placeholder="e.g. 0300 1234567"
          />
        </div>

        {/* Game Title Filter */}
        <div className={styles.field}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className={styles.label}>Filter Installed Game</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {gameSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGameSearchQuery('')}
                  className={styles.textBtn}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsGamesModalOpen(true)}
                className={styles.actionBtnPrimary}
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                title="Browse all available games and assign stations"
              >
                🎮 Available Games Directory
              </button>
            </div>
          </div>
          <input
            type="text"
            value={gameSearchQuery}
            onChange={e => setGameSearchQuery(e.target.value)}
            className={styles.input}
            placeholder="Search games (e.g. FIFA, Tekken 8, Valorant, COD)..."
          />
        </div>

        {/* Station Platform Filter & Grid */}
        <div className={styles.field}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className={styles.label}>Select Station</label>
            <div className={styles.platformTabs}>
              <button
                type="button"
                className={`${styles.platformTab} ${platformFilter === 'ALL' ? styles.platformTabActive : ''}`}
                onClick={() => setPlatformFilter('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`${styles.platformTab} ${platformFilter === 'PS5' ? styles.platformTabActive : ''}`}
                onClick={() => setPlatformFilter('PS5')}
              >
                PS5
              </button>
              <button
                type="button"
                className={`${styles.platformTab} ${platformFilter === 'PC' ? styles.platformTabActive : ''}`}
                onClick={() => setPlatformFilter('PC')}
              >
                PC
              </button>
              <button
                type="button"
                className={`${styles.platformTab} ${platformFilter === 'XBOX' ? styles.platformTabActive : ''}`}
                onClick={() => setPlatformFilter('XBOX')}
              >
                Xbox
              </button>
            </div>
          </div>

          <div className={styles.gridOptions}>
            {filteredConsoles.map(c => {
              const availability = checkAvailability(c.id, selectedDuration.seconds);
              const isSelected = selectedConsoleId === c.id;
              const hasMatchingGame = gameSearchQuery.trim() !== ''
                ? c.games.some(g => g.toLowerCase().includes(gameSearchQuery.toLowerCase()))
                : false;

              let btnClass = styles.optionBtn;
              if (isSelected) {
                if (availability.isOccupied) btnClass += ` ${styles.optionBtnOccupiedActive}`;
                else if (availability.isReserved) btnClass += ` ${styles.optionBtnReservedActive}`;
                else btnClass += ` ${styles.optionBtnActive}`;
              } else {
                if (availability.isOccupied) btnClass += ` ${styles.optionBtnOccupied}`;
                else if (availability.isReserved) btnClass += ` ${styles.optionBtnReserved}`;
              }

              const [mainName, subName] = c.name.split(' - ');

              return (
                <button
                  key={c.id}
                  type="button"
                  className={btnClass}
                  onClick={() => setSelectedConsoleId(c.id)}
                >
                  <span className={styles.optionMainText}>{mainName}</span>
                  <span className={styles.optionSubText}>{subName || ''}</span>

                  {!availability.available && (
                    <span className={availability.isOccupied ? styles.stationBadgeOccupied : styles.stationBadgeReserved}>
                      {availability.reason}
                    </span>
                  )}
                  {hasMatchingGame && (
                    <span className={styles.stationBadgeGameFound}>GAME INSTALLED</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Installed Games List on Selected Station */}
          {selectedConsoleObj && selectedConsoleObj.games && selectedConsoleObj.games.length > 0 && (
            <div style={{ marginTop: '0.65rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Installed Games on {selectedConsoleObj.name}:</span>
              {selectedConsoleObj.games.map((g, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(193, 255, 28, 0.1)',
                    border: '1px solid rgba(193, 255, 28, 0.25)',
                    color: 'var(--primary-accent)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px'
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Duration Selector */}
        <div className={styles.field}>
          <label className={styles.label}>Duration</label>
          <div className={styles.gridOptions} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {durations.map(d => (
              <button
                key={d.id}
                type="button"
                className={`${styles.optionBtn} ${selectedDurationId === d.id ? styles.optionBtnActive : ''}`}
                onClick={() => setSelectedDurationId(d.id)}
              >
                <span className={styles.optionMainText}>{d.name.split(' (')[0]}</span>
                <span className={styles.optionSubText}>PKR {d.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Extra Controllers */}
        <div className={styles.field}>
          <label className={styles.label}>Additional Controllers (+PKR {extraControllerRate} flat fee)</label>
          <div className={styles.gridOptions} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[0, 1, 3].map(num => (
              <button
                key={num}
                type="button"
                className={`${styles.optionBtn} ${additionalControllers === num ? styles.optionBtnActive : ''}`}
                onClick={() => setAdditionalControllers(num)}
              >
                <span className={styles.optionMainText}>{num === 0 ? 'None' : `+${num} Controller${num > 1 ? 's' : ''}`}</span>
                <span className={styles.optionSubText}>{num === 0 ? '0 PKR' : `+${num * extraControllerRate} PKR`}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button Group */}
        <div className={styles.btnGroup}>
          <button
            type="submit"
            disabled={!selectedConsoleAvailability.available || !selectedConsoleId}
            className={`${styles.submitBtn} ${(!selectedConsoleAvailability.available || !selectedConsoleId) ? styles.submitBtnDisabled : ''}`}
            title={!selectedConsoleAvailability.available ? 'Selected station is occupied. Add player to waitlist.' : 'Add Session to Order'}
          >
            {!selectedConsoleAvailability.available ? 'Station Unavailable' : 'Add to Order'}
          </button>
          <button
            type="button"
            className={`${styles.waitlistBtn} ${!selectedConsoleAvailability.available && selectedConsoleId ? styles.waitlistBtnPrimary : ''}`}
            onClick={handleWaitlistClick}
            title="Add paid waitlist reservation to order cart"
          >
            {!selectedConsoleAvailability.available && selectedConsoleId
              ? `Queue on Waitlist (PKR ${selectedDuration.price + additionalControllers * extraControllerRate})`
              : 'Add to Waitlist'}
          </button>
        </div>

        {!selectedConsoleAvailability.available && selectedConsoleId && (
          <div className={styles.occupiedNotice}>
            <strong>Station In-Use:</strong> {consoles.find(c => c.id === selectedConsoleId)?.name} is {selectedConsoleAvailability.reason}. Use <strong>Add to Waitlist</strong> to queue player.
          </div>
        )}
      </form>

      <MemberScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectMember={(u) => handleSelectUser(u)}
      />

      <AvailableGamesModal
        isOpen={isGamesModalOpen}
        onClose={() => setIsGamesModalOpen(false)}
        consoles={consoles}
        onSelectStation={(id) => setSelectedConsoleId(id)}
      />
    </div>
  );
}
