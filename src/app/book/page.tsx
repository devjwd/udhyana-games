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

  const selectedConsoleObj = useMemo(() => {
    return consoles.find(c => c.id === selectedConsole);
  }, [consoles, selectedConsole]);

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
            <span className={styles.kicker}>Reserve a Station</span>
            <h1 className={styles.headline}>
              Book Your<br />
              <span className={styles.headlineAccent}>Session.</span>
            </h1>
            <p className={styles.sub}>Choose your station, pick a time slot, and pay at the reception desk upon check-in.</p>
          </div>
        </section>

        {/* ─── FORM ─── */}
        <div className={styles.formWrapper}>
          <div className={styles.formCard}>

            {error && (
              <div className={styles.errorBox}>{error}</div>
            )}

            <form onSubmit={handleBooking} className={styles.form}>

              {/* Station select */}
              <div className={styles.field}>
                <label className={styles.label}>Select Station</label>
                <select
                  value={selectedConsole}
                  onChange={(e) => setSelectedConsole(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="" disabled>— Choose a Console —</option>
                  {consoles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.hardwareTitle} • PKR {c.hourlyRate || baseRate}/hr
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className={styles.field}>
                <label className={styles.label}>Date</label>
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
                  <label className={styles.label}>Available Time Slots</label>
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
                  <label className={styles.label}>Duration</label>
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
                          style={{ opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed' }}
                          title={!valid ? 'Duration exceeds closing time or overlaps with another reservation' : `${h} Hour(s)`}
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
                <div style={{
                  background: 'rgba(193, 255, 28, 0.05)',
                  border: '1px solid rgba(193, 255, 28, 0.2)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.5rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Estimated Total (Pay at Desk):</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                      {duration} hr{duration > 1 ? 's' : ''} × PKR {currentHourlyRate}/hr
                    </div>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-accent)' }}>
                    PKR {totalPrice}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !isSelectionValid() || !time}
                className={styles.submitBtn}
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
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
