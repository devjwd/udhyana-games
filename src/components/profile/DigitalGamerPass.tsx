'use client';

import React, { useState } from 'react';

interface DigitalGamerPassProps {
  userId: string;
  username: string;
  fullName?: string | null;
  rank?: string | null;
  loyaltyPoints?: number;
}

export default function DigitalGamerPass({
  userId,
  username,
  fullName,
  rank = 'Rookie'
}: DigitalGamerPassProps) {
  const [copied, setCopied] = useState(false);
  const passId = `UDH-${userId.slice(-8).toUpperCase()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR Code URL using offline SVG fallback or SVG matrix
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(userId)}&color=c1ff1c&bgcolor=08090d`;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(193, 255, 28, 0.08) 0%, rgba(14, 15, 20, 0.95) 100%)',
      border: '1px solid rgba(193, 255, 28, 0.25)',
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      marginTop: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '0.75rem'
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary-accent)', fontWeight: 900, letterSpacing: '0.1em' }}>
            M80 DIGITAL GAMER PASS
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
            {fullName || username}
          </div>
        </div>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 900,
          background: 'rgba(193, 255, 28, 0.15)',
          color: 'var(--primary-accent)',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          border: '1px solid rgba(193, 255, 28, 0.3)'
        }}>
          ★ {rank}
        </span>
      </div>

      {/* QR Code Container */}
      <div style={{
        background: '#08090D',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid rgba(193, 255, 28, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 20px rgba(193, 255, 28, 0.15)'
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt="Member Pass QR"
          width={150}
          height={150}
          style={{ display: 'block', borderRadius: '4px' }}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', fontWeight: 700 }}>
          PASS ID: {passId}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
          Show to reception staff for instant 1-second check-in
        </div>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: copied ? 'var(--primary-accent)' : '#fff',
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.4rem 0.75rem',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {copied ? '✓ Member ID Copied' : 'Copy Member ID'}
      </button>
    </div>
  );
}
