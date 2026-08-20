'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';
import { getConsoles, getBookedSlots, createBooking } from '@/backend/actions';

import { useRouter } from 'next/navigation';

export default function BookPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [consoles, setConsoles] = useState<any[]>([]);
  const [selectedConsole, setSelectedConsole] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookedSlots, setBookedSlots] = useState<{startTime: Date, endTime: Date}[]>([]);

  // 10 AM to 10 PM
  const OPERATING_HOURS = Array.from({ length: 13 }, (_, i) => i + 10);

  useEffect(() => {
    async function loadConsoles() {
      const fetched = await getConsoles();
      setConsoles(fetched);
    }
    loadConsoles();
  }, []);

  useEffect(() => {
    async function fetchBookedSlots() {
      if (!selectedConsole || !date) return;
      const slots = await getBookedSlots(selectedConsole, date);
      setBookedSlots(slots);
      setTime('');
    }
    fetchBookedSlots();
  }, [selectedConsole, date]);

  const isHourBooked = (hour: number) => {
    if (!date) return false;
    if (date === today) {
      const currentHour = new Date().getHours();
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

  const isSelectionValid = () => {
    if (!time) return true;
    const startHour = parseInt(time.split(':')[0]);
    for (let i = 0; i < duration; i++) {
      if (isHourBooked(startHour + i)) return false;
      if (startHour + i > 22) return false;
    }
    return true;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (status === 'unauthenticated') {
      alert('Please log in or create an account to book a console.');
      return;
    }
    if (!selectedConsole || !date || !time || !duration) {
      setError('Please fill in all fields.');
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
      if (res?.error) { setError(res.error); return; }
      alert('Booking Confirmed! You can pay at the reception desk.');
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
            <p className={styles.sub}>Choose your station, pick a time slot, and pay at the reception desk.</p>
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
                    <option key={c.id} value={c.id}>{c.hardwareTitle}</option>
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
                    {[1, 2, 3, 4, 5].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setDuration(h)}
                        className={`${styles.durationBtn} ${duration === h ? styles.durationBtnActive : ''}`}
                      >
                        {h} hr
                      </button>
                    ))}
                  </div>
                  {!isSelectionValid() && (
                    <p className={styles.warning}>
                      Warning: This duration overlaps with an existing booking.
                    </p>
                  )}
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
