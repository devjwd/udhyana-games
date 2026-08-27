'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';
import { getConsoles, getBookedSlots, createBooking, getBaseHourlyRate } from '@/backend/actions';
import { useRouter, useSearchParams } from 'next/navigation';

function getLocalTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_GAMES_BY_TYPE: Record<string, string[]> = {
  ps5: ['EA FC 24', 'Tekken 8', 'Spider-Man 2', 'Call of Duty: Warzone', 'GTA V', 'Mortal Kombat 1', 'God of War Ragnarök'],
  pc: ['Valorant', 'Counter-Strike 2', 'Call of Duty: Warzone', 'Dota 2', 'Apex Legends', 'Fortnite', 'Cyberpunk 2077'],
  xbox: ['Forza Horizon 5', 'Halo Infinite', 'EA FC 24', 'Starfield', 'Call of Duty: Warzone', 'Gears 5']
};

function getConsoleGamesList(consoleObj: any): string[] {
  if (consoleObj?.games && consoleObj.games.length > 0) {
    return consoleObj.games.map((g: any) => g.game?.name || g.name).filter(Boolean);
  }
  const title = (consoleObj?.hardwareTitle || '').toLowerCase();
  if (title.includes('pc')) return DEFAULT_GAMES_BY_TYPE.pc;
  if (title.includes('xbox')) return DEFAULT_GAMES_BY_TYPE.xbox;
  return DEFAULT_GAMES_BY_TYPE.ps5;
}

function BookPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const consoleParam = searchParams.get('console') || '';

  const [consoles, setConsoles] = useState<any[]>([]);
  const [baseRate, setBaseRate] = useState<number>(1000);
  const [selectedConsole, setSelectedConsole] = useState(consoleParam);
  
  // Game Search & Filtering State
  const [gameSearch, setGameSearch] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState('');

  const today = getLocalTodayString();
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookedSlots, setBookedSlots] = useState<{startTime: Date, endTime: Date}[]>([]);

  // 10 AM to 10 PM (22:00)
  const OPERATING_HOURS = Array.from({ length: 13 }, (_, i) => i + 10);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [fetchedConsoles, fetchedBaseRate] = await Promise.all([
          getConsoles(),
          getBaseHourlyRate()
        ]);
        setConsoles(fetchedConsoles || []);
        if (fetchedBaseRate) setBaseRate(fetchedBaseRate);

        if (consoleParam && fetchedConsoles?.some(c => c.id === consoleParam)) {
          setSelectedConsole(consoleParam);
        } else if (fetchedConsoles?.length && !selectedConsole) {
          setSelectedConsole(fetchedConsoles[0].id);
        }
      } catch (err) {
        console.error('Failed to load consoles catalog:', err);
      }
    }
    loadCatalog();
  }, [consoleParam]);

  useEffect(() => {
    async function fetchBookedSlots() {
      if (!selectedConsole || !date) return;
      try {
        const slots = await getBookedSlots(selectedConsole, date);
        setBookedSlots(slots || []);
        setTime('');
      } catch (err) {
        console.error('Failed to fetch booked slots:', err);
      }
    }
    fetchBookedSlots();
  }, [selectedConsole, date]);

  // Aggregate all unique games across all stations
  const allLoungeGames = useMemo(() => {
    const gameSet = new Set<string>();
    consoles.forEach(c => {
      getConsoleGamesList(c).forEach(g => gameSet.add(g));
    });
    return Array.from(gameSet).sort((a, b) => a.localeCompare(b));
  }, [consoles]);

  // Filter games based on search text
  const displayedGameFilters = useMemo(() => {
    if (!gameSearch.trim()) return allLoungeGames;
    return allLoungeGames.filter(g => g.toLowerCase().includes(gameSearch.toLowerCase()));
  }, [allLoungeGames, gameSearch]);

  // Selected console object & installed games
  const selectedConsoleObj = useMemo(() => {
    return consoles.find(c => c.id === selectedConsole) || consoles[0];
  }, [consoles, selectedConsole]);

  const installedGamesForSelected = useMemo(() => {
    return selectedConsoleObj ? getConsoleGamesList(selectedConsoleObj) : [];
  }, [selectedConsoleObj]);

  const currentHourlyRate = selectedConsoleObj?.hourlyRate || baseRate;
  const totalPrice = currentHourlyRate * duration;

  const isHourBooked = (hour: number) => {
    if (!date) return false;
    
    // Check if slot has already passed today in local time
    if (date === today) {
      const now = new Date();
      const currentHour = now.getHours();
      if (hour <= currentHour) return true;
    }

    const slotStart = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00`);
    const slotEnd = new Date(`${date}T${(hour + 1).toString().padStart(2, '0')}:00:00`);

    return bookedSlots.some(b => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return slotStart < bEnd && slotEnd > bStart;
    });
  };

  const isDurationValid = (d: number) => {
    if (!time) return true;
    const startHour = parseInt(time.split(':')[0], 10);
    // Closing time is 11 PM (23:00)
    if (startHour + d > 23) return false;
    for (let i = 0; i < d; i++) {
      if (isHourBooked(startHour + i)) return false;
    }
    return true;
  };

  const isSelectionValid = () => {
    return Boolean(time && isDurationValid(duration));
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (status === 'unauthenticated') {
      alert('Please log in or create a player profile to book a gaming station.');
      return;
    }
    if (!selectedConsole || !date || !time || !duration) {
      setError('Please fill in all booking fields.');
      return;
    }
    if (!isSelectionValid()) {
      setError('Your selected duration overlaps with an existing booking or closing time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const startTime = new Date(`${date}T${time}:00`);
      // @ts-ignore
      const res = await createBooking(session?.user?.id, selectedConsole, startTime, duration);
      if (res && 'error' in res && res.error) {
        setError(res.error);
        return;
      }
      alert(`Booking Confirmed for ${selectedConsoleObj?.hardwareTitle || 'Station'}! You can pay at the reception desk.`);
      router.push('/profile');
    } catch (err: any) {
      setError(err?.message || 'Failed to create booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main>

        {/* ─── HERO ─── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroInner}>
            <span className={styles.kicker}>
              <span>⚡</span> Live Station & Game Availability
            </span>
            <h1 className={styles.headline}>
              Book Your<br />
              <span className={styles.headlineAccent}>Station & Game.</span>
            </h1>
            <p className={styles.sub}>
              Select your favorite game, choose an equipped station, pick an available slot, and pay at the desk upon check-in.
            </p>
          </div>
        </section>

        {/* ─── MAIN BOOKING INTERFACE ─── */}
        <div className={styles.bookingContainer}>

          {/* LEFT: Game & Station Explorer */}
          <section className={styles.stationDiscoveryCard}>
            
            {/* Filter by Desired Game */}
            <div className={styles.filterBox}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <span>🎯</span> Filter by Game
                </h2>
                {selectedGameFilter && (
                  <button 
                    type="button" 
                    onClick={() => setSelectedGameFilter('')}
                    style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className={styles.searchWrapper}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search desired game (e.g. Tekken 8, Valorant, FC 24)..."
                  value={gameSearch}
                  onChange={(e) => setGameSearch(e.target.value)}
                  className={styles.searchInput}
                />
                {gameSearch && (
                  <button 
                    type="button"
                    onClick={() => setGameSearch('')} 
                    className={styles.clearSearchBtn}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Game Chips */}
              <div className={styles.gameChipsWrapper}>
                <button
                  type="button"
                  onClick={() => setSelectedGameFilter('')}
                  className={`${styles.gameChip} ${!selectedGameFilter ? styles.gameChipActive : ''}`}
                >
                  All Titles
                </button>
                {displayedGameFilters.map(gameName => {
                  const isSelected = selectedGameFilter === gameName;
                  return (
                    <button
                      key={gameName}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedGameFilter('');
                        } else {
                          setSelectedGameFilter(gameName);
                          // Auto select first matching console if current console doesn't have it
                          const currentHasIt = selectedConsoleObj && getConsoleGamesList(selectedConsoleObj).some(g => g.toLowerCase() === gameName.toLowerCase());
                          if (!currentHasIt) {
                            const firstMatch = consoles.find(c => getConsoleGamesList(c).some(g => g.toLowerCase() === gameName.toLowerCase()));
                            if (firstMatch) setSelectedConsole(firstMatch.id);
                          }
                        }
                      }}
                      className={`${styles.gameChip} ${isSelected ? styles.gameChipActive : ''}`}
                    >
                      <span>🎮</span> {gameName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Station Selector Cards */}
            <div>
              <div className={styles.sectionHeader} style={{ marginBottom: '0.75rem' }}>
                <h2 className={styles.sectionTitle}>
                  <span>🖥️</span> Select Gaming Station
                </h2>
                <span className={styles.badgeCount}>{consoles.length} Stations Available</span>
              </div>

              <div className={styles.stationGrid}>
                {consoles.map(c => {
                  const cGames = getConsoleGamesList(c);
                  const isSelected = selectedConsole === c.id;
                  const hasFilteredGame = selectedGameFilter ? cGames.some(g => g.toLowerCase() === selectedGameFilter.toLowerCase()) : false;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConsole(c.id)}
                      className={`${styles.stationCardItem} ${isSelected ? styles.stationCardSelected : ''}`}
                      style={{
                        opacity: selectedGameFilter && !hasFilteredGame ? 0.45 : 1,
                        borderStyle: hasFilteredGame ? 'solid' : undefined
                      }}
                    >
                      {hasFilteredGame && (
                        <div className={styles.hasGameBadge}>★ Ready</div>
                      )}
                      <div className={styles.stationCardName}>{c.hardwareTitle}</div>
                      <div className={styles.stationCardRate}>PKR {c.hourlyRate || baseRate}/hr</div>
                      <div className={styles.stationGameCount}>
                        <span>🎮</span> {cGames.length} Games Installed
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Station Spotlight & Installed Games Preview */}
            {selectedConsoleObj && (
              <div className={styles.activeStationSpotlight}>
                <div className={styles.spotlightHeader}>
                  <div>
                    <h3 className={styles.spotlightTitle}>{selectedConsoleObj.hardwareTitle}</h3>
                    <div className={styles.spotlightSpecs}>
                      {selectedConsoleObj.specs || '4K HDR High Refresh Gaming Setup · Ergonomic Pro Seating'}
                    </div>
                  </div>
                  <div className={styles.spotlightRateBadge}>
                    PKR {currentHourlyRate}/hr
                  </div>
                </div>

                <div>
                  <div className={styles.installedGamesHeader}>
                    <span>🎮</span> Installed Games Library ({installedGamesForSelected.length})
                  </div>
                  <div className={styles.installedGamesList}>
                    {installedGamesForSelected.map((gameName: string) => {
                      const isMatched = selectedGameFilter && gameName.toLowerCase() === selectedGameFilter.toLowerCase();
                      return (
                        <span 
                          key={gameName} 
                          className={`${styles.installedGameBadge} ${isMatched ? styles.installedGameBadgeMatched : ''}`}
                        >
                          {isMatched ? '⭐' : '•'} {gameName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </section>

          {/* RIGHT: Reservation Slot Form */}
          <div className={styles.formCard}>

            {error && (
              <div className={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleBooking} className={styles.form}>

              {/* Station select dropdown (for fallback / keyboard accessibility) */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <span>Station Hardware</span>
                  <span className={styles.labelHint}>PKR {currentHourlyRate}/hr</span>
                </label>
                <select
                  value={selectedConsole}
                  onChange={(e) => setSelectedConsole(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="" disabled>— Choose a Console —</option>
                  {consoles.map(c => {
                    const cGames = getConsoleGamesList(c);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.hardwareTitle} ({cGames.length} games) • PKR {c.hourlyRate || baseRate}/hr
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <span>Reservation Date</span>
                  <span className={styles.labelHint}>Open 10:00 AM – 11:00 PM</span>
                </label>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              {/* Time slots */}
              {selectedConsole && date && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    <span>Available Time Slots</span>
                    {time && <span className={styles.labelHint}>Selected: {time}</span>}
                  </label>
                  <div className={styles.timeGrid}>
                    {OPERATING_HOURS.map(hour => {
                      const isBooked = isHourBooked(hour);
                      const formattedTime = `${hour.toString().padStart(2, '0')}:00`;
                      const isSelected = time === formattedTime;
                      return (
                        <button
                          key={hour}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setTime(formattedTime)}
                          className={`${styles.timeSlot} ${isSelected ? styles.timeSlotSelected : ''} ${isBooked ? styles.timeSlotBooked : ''}`}
                          title={isBooked ? 'Slot unavailable or already booked' : `${hour}:00 Available`}
                        >
                          {hour > 12 ? `${hour - 12} PM` : (hour === 12 ? '12 PM' : `${hour} AM`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Duration */}
              {time && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    <span>Session Duration</span>
                    <span className={styles.labelHint}>{duration} Hour{duration > 1 ? 's' : ''}</span>
                  </label>
                  <div className={styles.durationGrid}>
                    {[1, 2, 3, 4, 5].map(h => {
                      const valid = isDurationValid(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={!valid}
                          onClick={() => setDuration(h)}
                          className={`${styles.durationBtn} ${duration === h ? styles.durationBtnActive : ''}`}
                          style={{ opacity: valid ? 1 : 0.35, cursor: valid ? 'pointer' : 'not-allowed' }}
                          title={!valid ? 'Duration exceeds closing time (11 PM) or overlaps with another reservation' : `${h} Hour(s)`}
                        >
                          {h} hr
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Price Summary Card */}
              {selectedConsole && time && (
                <div className={styles.summaryCard}>
                  <div>
                    <div className={styles.summaryLabel}>
                      Estimated Total <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>(Pay at Desk)</span>
                    </div>
                    <div className={styles.summarySub}>
                      {selectedConsoleObj?.hardwareTitle} • {duration} hr{duration > 1 ? 's' : ''} @ PKR {currentHourlyRate}/hr
                    </div>
                  </div>
                  <div className={styles.summaryPrice}>
                    PKR {totalPrice}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !isSelectionValid() || !time}
                className={styles.submitBtn}
              >
                {isSubmitting ? 'Reserving Station...' : 'Confirm Reservation'}
              </button>

            </form>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{ color: '#ffffff', padding: '5rem', textAlign: 'center' }}>Loading Booking Station...</div>}>
      <BookPageContent />
    </Suspense>
  );
}
