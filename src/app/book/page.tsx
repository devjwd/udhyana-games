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

  // Selected console object & installed games
  const selectedConsoleObj = useMemo(() => {
    return consoles.find(c => c.id === selectedConsole) || consoles[0];
  }, [consoles, selectedConsole]);

  const installedGames = useMemo(() => {
    return selectedConsoleObj ? getConsoleGamesList(selectedConsoleObj) : [];
  }, [selectedConsoleObj]);

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
            Select your gaming rig, pick an open time slot, and pay at the desk upon check-in.
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

              {/* 1. SELECT STATION */}
              <div className={styles.section}>
                <div className={styles.sectionTitleRow}>
                  <span className={styles.stepNum}>1</span>
                  <label className={styles.sectionLabel}>Select Station</label>
                </div>

                <div className={styles.stationTabs}>
                  {consoles.map(c => {
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

                {/* Installed Games under Selected Station */}
                {selectedConsoleObj && (
                  <div className={styles.gamesBanner}>
                    <div className={styles.gamesBannerHeader}>
                      <span className={styles.gamesBannerTitle}>
                        🎮 Available Games on {selectedConsoleObj.hardwareTitle}:
                      </span>
                      <span className={styles.gamesCount}>{installedGames.length} titles</span>
                    </div>
                    <div className={styles.gamesList}>
                      {installedGames.map((gameName) => (
                        <span key={gameName} className={styles.gamePill}>
                          {gameName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. PICK DATE */}
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
                    <label className={styles.sectionLabel}>Select Start Time</label>
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
                      {selectedConsoleObj?.hardwareTitle} • {duration} hr{duration > 1 ? 's' : ''}
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
