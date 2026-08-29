'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../page.module.css';
import { searchUsers } from '@/backend/actions';
import { soundManager } from '../utils/sound';
import toast from 'react-hot-toast';

interface MemberScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMember: (user: {
    id: string;
    username?: string | null;
    fullName?: string | null;
    phone?: string | null;
    rank?: string;
    loyaltyPoints?: number;
  }) => void;
}

interface BarcodeDetectorLike {
  detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
}

export default function MemberScannerModal({
  isOpen,
  onClose,
  onSelectMember
}: MemberScannerModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Handle scanned or typed code declared first to avoid hoisting/TDZ issues
  const handleProcessCode = useCallback(async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    setIsSearching(true);
    try {
      const results = await searchUsers(clean);
      if (results && results.length > 0) {
        const found = results[0];
        soundManager.playSuccessTone();
        toast.success(`Member Verified: ${found.fullName || found.username} (${found.rank || 'Member'})!`);
        onSelectMember(found);
        onClose();
      } else {
        toast.error(`No member account found for pass: "${clean}"`);
      }
    } catch {
      toast.error('Failed to verify member pass.');
    } finally {
      setIsSearching(false);
      setManualCode('');
    }
  }, [onSelectMember, onClose]);

  // Start Camera QR Scanner
  const initCamera = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera stream not supported in this browser.');
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    }).then(async (stream) => {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if ('BarcodeDetector' in window) {
        const BarcodeDetectorConstructor = (window as unknown as { BarcodeDetector: new (options?: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector;
        const barcodeDetector = new BarcodeDetectorConstructor({
          formats: ['qr_code', 'code_128', 'ean_13', 'code_39', 'data_matrix']
        });

        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                if (rawValue) {
                  stopCamera();
                  await handleProcessCode(rawValue);
                }
              }
            } catch {
              // Ignore detection frame error
            }
          }
        }, 250);
      }
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Camera permission denied or camera not found.';
      console.error('Camera access failed:', err);
      setCameraError(message);
    });
  }, [handleProcessCode, stopCamera]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isOpen) {
      timer = setTimeout(() => initCamera(), 0);
      if (manualInputRef.current) {
        manualInputRef.current.focus();
      }
    } else {
      stopCamera();
    }
    return () => {
      if (timer) clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, initCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={e => { if (e.target === e.currentTarget && !isSearching) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modalContent} style={{ width: '480px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📷</span> Scan Member Pass / QR
          </h2>
          <button className={styles.modalCloseBtn} onClick={onClose} disabled={isSearching}>✕</button>
        </div>

        {/* Camera Viewport with Cyber Target Reticle */}
        <div style={{ position: 'relative', width: '100%', height: '240px', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(193, 255, 28, 0.3)' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Targeting Laser Scanner Overlay */}
          <div style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            border: '2px dashed var(--primary-accent)',
            borderRadius: '12px',
            boxShadow: '0 0 25px rgba(193, 255, 28, 0.25)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '2px',
              background: 'var(--primary-accent)',
              boxShadow: '0 0 10px var(--primary-accent)'
            }} />
          </div>

          {cameraError && (
            <div style={{ position: 'absolute', background: 'rgba(0,0,0,0.85)', padding: '1rem', textAlign: 'center', color: '#ff6b6b', fontSize: '0.85rem' }}>
              <p>{cameraError}</p>
              <button
                type="button"
                onClick={() => {
                  setCameraError(null);
                  initCamera();
                }}
                className={styles.actionBtnOutline}
                style={{ marginTop: '0.5rem', color: '#fff' }}
              >
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Manual Barcode Wedge Input */}
        <div className={styles.form} style={{ marginTop: '0.5rem' }}>
          <div className={styles.field}>
            <label className={styles.label}>
              USB 2D Scanner / Pass Code Input
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                ref={manualInputRef}
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (manualCode.trim() && !isSearching) handleProcessCode(manualCode);
                  }
                }}
                placeholder="Scan barcode gun or type Member ID / Tag"
                className={styles.input}
                style={{ flex: 1 }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (manualCode.trim() && !isSearching) handleProcessCode(manualCode);
                }}
                disabled={!manualCode.trim() || isSearching}
                className={styles.submitBtn}
                style={{ padding: '0 1.25rem' }}
              >
                {isSearching ? '...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
          Point customer phone screen at camera or scan member card with hand-held laser gun.
        </div>
      </div>
    </div>
  );
}
