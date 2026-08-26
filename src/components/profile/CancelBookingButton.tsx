ww'use client';

import React, { useState } from 'react';
import { cancelBooking } from '@/backend/actions';
import { useRouter } from 'next/navigation';

interface CancelBookingButtonProps {
  bookingId: string;
  stationTitle: string;
}

export default function CancelBookingButton({
  bookingId,
  stationTitle
}: CancelBookingButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel your reservation for ${stationTitle}? This will release your reserved slot.`)) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await cancelBooking(bookingId);
      if (res && 'error' in res && res.error) {
        alert(res.error);
        return;
      }
      alert('Reservation cancelled successfully. Your time slot has been released.');
      router.refresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isCancelling}
      style={{
        background: 'transparent',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        color: '#ef4444',
        padding: '0.4rem 0.85rem',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 700,
        cursor: isCancelling ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem'
      }}
      title="Cancel this reservation"
    >
      {isCancelling ? 'Cancelling...' : '✕ Cancel Reservation'}
    </button>
  );
}
