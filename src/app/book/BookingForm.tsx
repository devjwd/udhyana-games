'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function BookingForm() {
  const searchParams = useSearchParams();
  const consoleParam = searchParams.get('console');
  
  const [selectedConsole, setSelectedConsole] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (consoleParam) {
      setSelectedConsole(consoleParam);
    }
  }, [consoleParam]);

  const timeSlots = [
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM",
    "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.formContainer} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: 'var(--primary-accent)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Booking Confirmed!
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          Your station has been reserved. We&apos;ll see you at the lounge — come ready to play.
        </p>
        <button
          className={styles.submitBtn}
          onClick={() => { setSubmitted(false); setSelectedConsole(''); setSelectedTime(null); }}
          style={{ marginTop: '2rem' }}
        >
          Make Another Booking
        </button>
      </div>
    );
  }

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label}>Select Station</label>
        <select 
          className={styles.select} 
          required 
          value={selectedConsole}
          onChange={(e) => setSelectedConsole(e.target.value)}
        >
          <option value="">Choose a setup...</option>
          <option value="ps5">PS5 Pro Setup ($10/hr)</option>
          <option value="xbox">Xbox Series X ($10/hr)</option>
          <option value="pc">Custom Esports PC ($15/hr)</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Select Date</label>
        <input type="date" className={styles.input} required />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Select Time</label>
        <div className={styles.timeGrid}>
          {timeSlots.map(time => (
            <div 
              key={time} 
              className={`${styles.timeSlot} ${selectedTime === time ? styles.active : ''}`}
              onClick={() => setSelectedTime(time)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedTime(time)}
              aria-pressed={selectedTime === time}
            >
              {time}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Duration</label>
        <select className={styles.select} required>
          <option value="1">1 Hour</option>
          <option value="2">2 Hours</option>
          <option value="3">3 Hours</option>
          <option value="4">4+ Hours (All Day Pass)</option>
        </select>
      </div>

      <button type="submit" className={styles.submitBtn}>Confirm Booking</button>
    </form>
  );
}

