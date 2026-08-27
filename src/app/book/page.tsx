'use client';

import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
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

const HOT_GAMES = [
  'EA FC 24',
  'Tekken 8',
  'Valorant',
  'Call of Duty: Warzone',
  'GTA V',
  'Counter-Strike 2',
  'Spider-Man 2',
  'Forza Horizon 5'
];

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
  
  // Game Search & Selection State
  const [gameSearch, setGameSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const today = getLocalTodayString();
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookedSlots, setBookedSlots] = useState<{startTime: Date, endTime: Date}[]>([]);

  // 10 AM to 10 PM (22:00)
  const OPERATING_HOURS = Array.from({ length: 13 }, (_, i) => i + 10);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Aggregate all unique installed games across all stations
  const allInstalledGames = useMemo(() => {
    const gameMap = new Map<string, number>();
    consoles.forEach(c => {
      getConsoleGamesList(c).forEach(g => {
        gameMap.set(g, (gameMap.get(g) || 0) + 1);
      });
    });
    return Array.from(gameMap.entries()).map(([name, count]) => ({ name, count }));
  }, [consoles]);

  // Filtered games based on search text in dropdown
  const displayedGamesInDropdown = useMemo(() => {
    if (!gameSearch.trim()) return allInstalledGames;
    return allInstalledGames.filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()));
  }, [allInstalledGames, gameSearch]);

  // Filter stations based on chosen game
  const stationsForSelectedGame = useMemo(() => {
    if (!selectedGame || selectedGame === 'ALL') return consoles;
    return consoles.filter(c => {
      const games = getConsoleGamesList(c);
      return games.some(g => g.toLowerCase() === selectedGame.toLowerCase());
    });
  }, [consoles, selectedGame]);

  // Auto-switch selected console if current console isn't in filtered list
  useEffect(() => {
    if (stationsForSelectedGame.length > 0) {
      const isCurrentInList = stationsForSelectedGame.some(c => c.id === selectedConsole);
      if (!isCurrentInList) {
        setSelectedConsole(stationsForSelectedGame[0].id);
      }
    }
  }, [stationsForSelectedGame, selectedConsole]);

  const selectedConsoleObj = useMemo(() => {
    return consoles.find(c => c.id === selectedConsole) || consoles[0];
  }, [consoles, selectedConsole]);

  const currentHourlyRate = selectedConsoleObj?.hourlyRate || baseRate;
  const totalPrice = currentHourlyRate * duration;

  const isHourBooked = (hour: number) => {
    if (!date) return false;
    
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

  const selectGame = (gameName: string) => {
    setSelectedGame(gameName);
    setGameSearch('');
    setIsDropdownOpen(false);
  };

  return (
    <>
      <Header />
      <main className={styles.main}>

        {/* ─── HERO (Minimal) ─── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <span className={styles.kicker}>Station Reservation</span>
          <h1 className={styles.headline}>Book a Station</h1>
          <p className={styles.sub}>
            Search your favorite game to find available stations, select your slot, and pay at check-in.
          </p>
        </section>

        {/* ─── UNIFIED BOOKING CARD ─── */}
        <div className={styles.container}>
          <div className={styles.card}>

            {error && (
              <div className={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleBooking} className={styles.form}>

              {/* 1. SEARCH FOR GAME */}
              <div className={styles.section} ref={searchContainerRef}>
                <div className={styles.sectionTitleRow}>
                  <span className={styles.stepNum}>1</span>
                  <label className={styles.sectionLabel}>Search Game</label>
                  {selectedGame && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGame(null);
                        setGameSearch('');
                      }}
                      className={styles.resetGameBtn}
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Search Input */}
                <div className={styles.searchWrapper}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    type="text"
                    placeholder={selectedGame ? `Selected: ${selectedGame}` : "Click or type to search game (e.g. Tekken 8, Valorant, FC 24)..."}
                    value={gameSearch}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setGameSearch(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    className={`${styles.searchInput} ${selectedGame ? styles.searchInputSelected : ''}`}
                  />
                  {(gameSearch || selectedGame) && (
                    <button
                      type="button"
                      onClick={() => {
                        setGameSearch('');
                        setSelectedGame(null);
                        setIsDropdownOpen(false);
                      }}
                      className={styles.clearSearchBtn}
                    >
                      ✕
                    </button>
                  )}

                  {/* Recommendations & Autocomplete Dropdown */}
                  {isDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      
                      {/* Hot & Trending Section */}
                      {!gameSearch && (
                        <div className={styles.dropdownSection}>
                          <div className={styles.dropdownSectionTitle}>
                            <span>🔥</span> Popular / Hot Games
                          </div>
                          <div className={styles.hotGamesList}>
                            {HOT_GAMES.map(hotGame => (
                              <button
                                key={hotGame}
                                type="button"
                                onClick={() => selectGame(hotGame)}
                                className={styles.hotGameBadge}
                              >
                                {hotGame}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Installed Games List */}
                      <div className={styles.dropdownSection}>
                        <div className={styles.dropdownSectionTitle}>
                          <span>🎮</span> {gameSearch ? `Search Results (${displayedGamesInDropdown.length})` : 'All Installed Games'}
                        </div>
                        <div className={styles.gameResultsList}>
                          <button
                            type="button"
                            onClick={() => selectGame('ALL')}
                            className={`${styles.gameResultItem} ${selectedGame === 'ALL' ? styles.gameResultItemActive : ''}`}
                          >
                            <span>⚡ Browse all stations (No game filter)</span>
                            <span className={styles.stationCountTag}>{consoles.length} stations</span>
                          </button>

                          {displayedGamesInDropdown.map(({ name, count }) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => selectGame(name)}
                              className={`${styles.gameResultItem} ${selectedGame === name ? styles.gameResultItemActive : ''}`}
                            >
                              <span>🎮 {name}</span>
                              <span className={styles.stationCountTag}>{count} {count > 1 ? 'stations' : 'station'}</span>
                            </button>
                          ))}

                          {displayedGamesInDropdown.length === 0 && (
                            <div className={styles.noResults}>
                              No installed game found matching "{gameSearch}".
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* SHOW AVAILABLE STATIONS (Only shown when a game or all stations is selected) */}
                {selectedGame && (
                  <div className={styles.stationResultsContainer}>
                    <div className={styles.stationResultsHeader}>
                      <span>
                        {selectedGame === 'ALL' 
                          ? 'Available Stations:' 
                          : `Available Stations for "${selectedGame}":`}
                      </span>
                      <span className={styles.stationCountBadge}>
                        {stationsForSelectedGame.length} {stationsForSelectedGame.length > 1 ? 'Stations' : 'Station'} Ready
                      </span>
                    </div>

                    <div className={styles.stationTabs}>
                      {stationsForSelectedGame.map(c => {
                        const isSelected = selectedConsole === c.id;
                        const rate = c.hourlyRate || baseRate;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedConsole(c.id)}
                            className={`${styles.stationTab} ${isSelected ? styles.stationTabActive : ''}`}
                          >
                            <span className={styles.stationTabName}>{c.hardwareTitle}</span>
                            <span className={styles.stationTabRate}>PKR {rate}/hr</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. CHOOSE DATE */}
              <div className={styles.section}>
                <div className={styles.sectionTitleRow}>
                  <span className={styles.stepNum}>2</span>
                  <label className={styles.sectionLabel}>Choose Date</label>
                  <span className={styles.hint}>Open 10:00 AM – 11:00 PM</span>
                </div>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              {/* 3. TIME SLOTS */}
              {selectedConsole && date && (
                <div className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.stepNum}>3</span>
                    <label className={styles.sectionLabel}>
                      Select Time for {selectedConsoleObj?.hardwareTitle}
                    </label>
                    {time && <span className={styles.hintActive}>Selected: {time}</span>}
                  </div>
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
                          className={`${styles.timeBtn} ${isSelected ? styles.timeBtnActive : ''} ${isBooked ? styles.timeBtnBooked : ''}`}
                        >
                          {hour > 12 ? `${hour - 12} PM` : (hour === 12 ? '12 PM' : `${hour} AM`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. DURATION */}
              {time && (
                <div className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.stepNum}>4</span>
                    <label className={styles.sectionLabel}>Duration</label>
                    <span className={styles.hintActive}>{duration} Hour{duration > 1 ? 's' : ''}</span>
                  </div>
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
                        >
                          {h} hr
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. SUMMARY & SUBMIT */}
              {selectedConsole && time && (
                <div className={styles.summaryBar}>
                  <div>
                    <div className={styles.summaryText}>
                      {selectedConsoleObj?.hardwareTitle} {selectedGame && selectedGame !== 'ALL' ? `(${selectedGame})` : ''} • {duration} hr{duration > 1 ? 's' : ''}
                    </div>
                    <div className={styles.summaryNote}>Pay upon check-in at reception desk</div>
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
                {isSubmitting ? 'Confirming...' : 'Confirm Reservation'}
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
