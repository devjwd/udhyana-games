'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import styles from '../page.module.css';
import { Session, SnackItem } from '../types';
import { generatePostpaidSettlementReceiptBytes, printDirectWebSerial } from '../utils/escpos';

interface PostpaidCheckoutModalProps {
  session: Session | null;
  baseRate: number;
  extraControllerRate: number;
  snacks: SnackItem[];
  onClose: () => void;
  onConfirm: (
    sessionId: string,
    paymentMethod: string,
    customGamingAmount: number,
    snackItems: { name: string; price: number; quantity: number; type: string }[]
  ) => Promise<unknown>;
}

interface AddedSnack {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ElectronPrinter {
  name: string;
  isDefault?: boolean;
}

interface ElectronApi {
  isDesktop?: boolean;
  getPrinters?: () => Promise<ElectronPrinter[]>;
  printReceipt?: (options: { silent?: boolean; deviceName?: string }) => Promise<boolean>;
}

function getElectronApi(): ElectronApi | undefined {
  if (typeof window !== 'undefined') {
    return (window as unknown as { electronAPI?: ElectronApi }).electronAPI;
  }
  return undefined;
}

function PostpaidCheckoutDialog({
  session,
  baseRate,
  extraControllerRate,
  snacks,
  onClose,
  onConfirm
}: {
  session: Session;
  baseRate: number;
  extraControllerRate: number;
  snacks: SnackItem[];
  onClose: () => void;
  onConfirm: (
    sessionId: string,
    paymentMethod: string,
    customGamingAmount: number,
    snackItems: { name: string; price: number; quantity: number; type: string }[]
  ) => Promise<unknown>;
}) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'account'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [customGamingPrice, setCustomGamingPrice] = useState<string>('');
  const [addedSnacks, setAddedSnacks] = useState<AddedSnack[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSettled, setIsSettled] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>('');

  // Printer support
  const [printers, setPrinters] = useState<ElectronPrinter[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_thermal_printer_name') || '';
    }
    return '';
  });
  const [silentPrint, setSilentPrint] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_thermal_silent_print') !== 'false';
    }
    return true;
  });
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const electronApi = getElectronApi();
  const isDesktop = Boolean(electronApi?.isDesktop);

  // Calculate elapsed time from session start
  const startTime = useMemo(() => new Date(session.startTime), [session.startTime]);
  const [nowTime] = useState<Date>(() => new Date());

  const elapsedSeconds = useMemo(() => {
    return Math.max(60, Math.floor((nowTime.getTime() - startTime.getTime()) / 1000));
  }, [nowTime, startTime]);

  const totalMinutes = Math.ceil(elapsedSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const durationLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`;

  // Minimum 15 mins billable
  const billableMinutes = Math.max(15, totalMinutes);
  const calculatedTimeCharge = Math.round((billableMinutes / 60) * baseRate);
  const controllersCount = session.extraControllers || 0;
  const controllerFee = controllersCount * extraControllerRate;
  const calculatedGamingTotal = calculatedTimeCharge + controllerFee;

  const finalGamingAmount = isCustomAmount && customGamingPrice !== ''
    ? Math.max(0, parseInt(customGamingPrice, 10) || 0)
    : calculatedGamingTotal;

  const snacksTotal = addedSnacks.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const grandTotal = finalGamingAmount + snacksTotal;

  const changeDue = useMemo(() => {
    const tendered = parseFloat(cashTendered);
    if (isNaN(tendered) || tendered < grandTotal) return 0;
    return tendered - grandTotal;
  }, [cashTendered, grandTotal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Fetch installed printers if in Electron Desktop
    if (isDesktop && electronApi?.getPrinters) {
      electronApi.getPrinters().then(list => {
        if (Array.isArray(list) && list.length > 0) {
          setPrinters(list);
          setSelectedPrinter(curr => {
            if (curr) return curr;
            const def = list.find(p => p.isDefault) || list[0];
            return def ? def.name : '';
          });
        }
      }).catch(console.error);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, isDesktop, electronApi, onClose]);

  const handlePrinterChange = (name: string) => {
    setSelectedPrinter(name);
    localStorage.setItem('pos_thermal_printer_name', name);
  };

  const handleSilentToggle = (val: boolean) => {
    setSilentPrint(val);
    localStorage.setItem('pos_thermal_silent_print', val ? 'true' : 'false');
  };

  const handleAddSnack = (snack: SnackItem) => {
    setAddedSnacks(prev => {
      const existing = prev.find(s => s.id === snack.id);
      if (existing) {
        return prev.map(s => s.id === snack.id ? { ...s, quantity: s.quantity + 1 } : s);
      }
      return [...prev, { id: snack.id, name: snack.name, price: snack.price, quantity: 1 }];
    });
  };

  const handleUpdateSnackQty = (id: string, delta: number) => {
    setAddedSnacks(prev => {
      return prev
        .map(s => {
          if (s.id === id) {
            const nextQty = s.quantity + delta;
            return nextQty > 0 ? { ...s, quantity: nextQty } : null;
          }
          return s;
        })
        .filter((s): s is AddedSnack => s !== null);
    });
  };

  const handlePrintReceipt = async () => {
    setIsPrinting(true);
    try {
      if (isDesktop && electronApi?.printReceipt) {
        const success = await electronApi.printReceipt({
          silent: silentPrint,
          deviceName: selectedPrinter || undefined
        });
        if (success) {
          toast.success(silentPrint ? 'Receipt sent directly to thermal printer!' : 'Receipt printed.');
        } else {
          toast.error('Print command failed.');
        }
      } else {
        window.print();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Print failed.';
      toast.error(msg);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDirectWebSerialESC = async () => {
    setIsPrinting(true);
    try {
      const receiptBytes = generatePostpaidSettlementReceiptBytes({
        storeName: 'UDHYANA GAMES',
        storeSub: 'Open Session Final Receipt',
        orderId,
        dateStr: nowTime.toLocaleDateString(),
        startTimeStr: startTimeFormatted,
        endTimeStr: endTimeFormatted,
        durationLabel,
        stationName: session.console.hardwareTitle,
        playerName,
        timeCharge: finalGamingAmount,
        controllerCharge: controllerFee,
        snacks: addedSnacks.map(s => ({ name: s.name, price: s.price, quantity: s.quantity })),
        totalAmount: grandTotal,
        paymentMethod,
        cashTendered: parseFloat(cashTendered) || undefined,
        changeDue: changeDue > 0 ? changeDue : undefined
      });
      await printDirectWebSerial(receiptBytes);
      toast.success('ESC/POS direct print successful!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Direct USB/Serial print failed.';
      toast.error(msg);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const snackPayload = addedSnacks.map(s => ({
        name: s.name,
        price: s.price,
        quantity: s.quantity,
        type: 'snack'
      }));

      const res = await onConfirm(session.id, paymentMethod, finalGamingAmount, snackPayload);
      if (res && typeof res === 'object' && 'orderId' in res && res.orderId) {
        setOrderId(res.orderId as string);
      }
      setIsSettled(true);

      // Auto-trigger silent print on desktop if enabled
      if (isDesktop && electronApi?.printReceipt && silentPrint) {
        electronApi.printReceipt({ silent: true, deviceName: selectedPrinter || undefined }).catch(console.error);
      }
    } catch {
      // Toast handled by parent onConfirm
    } finally {
      setIsSubmitting(false);
    }
  };

  const playerName = session.guestName || session.user?.fullName || session.user?.username || 'Guest Player';
  const startTimeFormatted = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTimeFormatted = nowTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const supportsWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;

  return (
    <>
      {/* Printable Thermal Receipt Slip (Visible Only In @media print) */}
      <div className={styles.printableReceipt}>
        <div className={styles.printHeader}>
          <div className={styles.printLogo}>
            <Image
              src="/images/logo.png"
              alt="Udhyana Games"
              width={140}
              height={42}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div className={styles.printBrand}>UDHYANA GAMES</div>
          <div className={styles.printSub}>Open Session Final Receipt</div>
          <div className={styles.printMeta}>
            <span>Date: {nowTime.toLocaleDateString()} {nowTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>Station: {session.console.hardwareTitle}</span>
            <span>Player: {playerName}</span>
          </div>
        </div>

        <div className={styles.printDivider} />

        {/* Time Record */}
        <div style={{ fontSize: '11px', lineHeight: 1.4, margin: '4px 0' }}>
          <div>Check-In: <strong>{startTimeFormatted}</strong></div>
          <div>Check-Out: <strong>{endTimeFormatted}</strong></div>
          <div>Total Playtime: <strong>{durationLabel}</strong> ({billableMinutes}m billed)</div>
        </div>

        <div className={styles.printDivider} />

        {/* Items Table */}
        <div className={styles.printItems}>
          <div className={styles.printItemRow}>
            <div className={styles.printItemName}>
              <span>Gaming Time Fee ({durationLabel})</span>
              <small className={styles.printItemSub}>Rate: PKR {baseRate}/hr</small>
            </div>
            <span className={styles.printItemPrice}>PKR {finalGamingAmount}</span>
          </div>

          {controllersCount > 0 && (
            <div className={styles.printItemRow}>
              <div className={styles.printItemName}>
                <span>Extra Controllers ({controllersCount}x)</span>
              </div>
              <span className={styles.printItemPrice}>PKR {controllerFee}</span>
            </div>
          )}

          {addedSnacks.map(snack => (
            <div key={snack.id} className={styles.printItemRow}>
              <div className={styles.printItemName}>
                <span>{snack.name} (x{snack.quantity})</span>
              </div>
              <span className={styles.printItemPrice}>PKR {snack.price * snack.quantity}</span>
            </div>
          ))}
        </div>

        <div className={styles.printDivider} />

        <div className={styles.printTotalRow}>
          <span>TOTAL PAID</span>
          <span>PKR {grandTotal}</span>
        </div>
        <div className={styles.printMethodRow}>
          <span>Payment Method:</span>
          <span>{paymentMethod.toUpperCase()}</span>
        </div>

        {paymentMethod === 'cash' && parseFloat(cashTendered) >= grandTotal && (
          <div style={{ fontSize: '10px', marginTop: '3px' }}>
            <div>Cash Tendered: PKR {cashTendered}</div>
            <div>Change Returned: PKR {changeDue}</div>
          </div>
        )}

        <div className={styles.printDivider} />

        <div className={styles.printFooter}>
          <div>Thank you for gaming with us!</div>
          <div>Hope to see you again soon.</div>
          <div className={styles.printWeb}>🌐 udhyana.com</div>
        </div>
      </div>

      {/* Interactive Modal UI */}
      <div
        className={styles.modalOverlay}
        onClick={e => {
          if (e.target === e.currentTarget && !isSubmitting) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.modalContent} style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
          {isSettled ? (
            /* =======================================
               SETTLED & RECEIPT CONFIRMATION VIEW
               ======================================= */
            <div>
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🧾</span>
                  <div>
                    <h2 className={styles.modalTitle} style={{ color: 'var(--primary-accent)', margin: 0, fontSize: '1.2rem' }}>
                      Session Settled & Receipt
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                      Station Cleared • Customer Receipt Ready
                    </span>
                  </div>
                </div>
                <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
              </div>

              {/* Success Badge */}
              <div style={{
                background: 'rgba(193, 255, 28, 0.1)',
                border: '1px solid rgba(193, 255, 28, 0.35)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}>
                <span style={{ fontSize: '1.4rem' }}>✅</span>
                <div>
                  <strong style={{ color: 'var(--primary-accent)', fontSize: '0.9rem' }}>Payment Collected & Completed</strong>
                  <div style={{ fontSize: '0.74rem', color: '#fff' }}>
                    PKR {grandTotal} settled via {paymentMethod.toUpperCase()}. Station {session.console.hardwareTitle} is now available.
                  </div>
                </div>
              </div>

              {/* On-Screen Official Receipt Card */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                fontFamily: 'monospace, sans-serif'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary-accent)', letterSpacing: '0.05em' }}>
                    UDHYANA GAMES
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                    Open Session Settlement Slip
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Player:</span>
                    <strong>{playerName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Station:</span>
                    <strong>{session.console.hardwareTitle}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Check-In Time:</span>
                    <span>{startTimeFormatted}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Check-Out Time:</span>
                    <span>{endTimeFormatted}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-accent)', fontWeight: 800 }}>
                    <span>Total Playtime:</span>
                    <span>{durationLabel} ({billableMinutes}m billed)</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gaming Time Charge ({durationLabel}):</span>
                    <strong>PKR {finalGamingAmount}</strong>
                  </div>
                  {controllersCount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Extra Controllers ({controllersCount}x):</span>
                      <strong>PKR {controllerFee}</strong>
                    </div>
                  )}
                  {addedSnacks.map(snack => (
                    <div key={snack.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.85)' }}>
                      <span>{snack.name} (x{snack.quantity}):</span>
                      <strong>PKR {snack.price * snack.quantity}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: 'var(--primary-accent)' }}>
                  <span>TOTAL PAID:</span>
                  <span>PKR {grandTotal}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Payment Method: {paymentMethod.toUpperCase()}</span>
                  {paymentMethod === 'cash' && parseFloat(cashTendered) >= grandTotal && (
                    <span>Change: PKR {changeDue}</span>
                  )}
                </div>
              </div>

              {/* Thermal Printer Settings in Modal */}
              {isDesktop && printers.length > 0 && (
                <div className={styles.field} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className={styles.label} style={{ margin: 0 }}>Target POS Thermal Printer</label>
                    <label style={{ fontSize: '0.75rem', color: silentPrint ? 'var(--primary-accent)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <input
                        type="checkbox"
                        checked={silentPrint}
                        onChange={e => handleSilentToggle(e.target.checked)}
                      />
                      Silent Direct Print (No Dialog)
                    </label>
                  </div>
                  <select
                    value={selectedPrinter}
                    onChange={e => handlePrinterChange(e.target.value)}
                    className={styles.select}
                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                  >
                    {printers.map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name} {p.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Modal Actions */}
              <div className={styles.modalActions}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    disabled={isPrinting}
                    className={styles.actionBtnOutline}
                    style={{ flex: 1, padding: '0.85rem', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    {isPrinting ? 'Printing...' : isDesktop && silentPrint ? '⚡ Direct Thermal Print' : '🖨️ Print Final Receipt'}
                  </button>

                  {!isDesktop && supportsWebSerial && (
                    <button
                      type="button"
                      onClick={handleDirectWebSerialESC}
                      disabled={isPrinting}
                      className={styles.actionBtnOutline}
                      style={{ color: 'var(--primary-accent)', borderColor: 'rgba(193, 255, 28, 0.4)', padding: '0.85rem' }}
                      title="Direct USB Serial ESC/POS Print"
                    >
                      ⚡ Direct USB ESC/POS
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={styles.submitBtn}
                  style={{ background: 'var(--primary-accent)', color: '#000', fontWeight: 900, padding: '0.85rem' }}
                >
                  ✓ Done & Close
                </button>
              </div>
            </div>
          ) : (
            /* =======================================
               ACTIVE BILLING & SETTLEMENT FORM VIEW
               ======================================= */
            <div>
              {/* Header */}
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🧾</span>
                  <div>
                    <h2 className={styles.modalTitle} style={{ color: 'var(--primary-accent)', margin: 0 }}>
                      End & Bill Open Session
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                      Open Session • Real-Time Calculation & Checkout
                    </span>
                  </div>
                </div>
                <button className={styles.modalCloseBtn} onClick={onClose} disabled={isSubmitting}>✕</button>
              </div>

              {/* Station & Player Summary */}
              <div className={styles.detailCard} style={{ marginBottom: '1rem', background: 'rgba(193, 255, 28, 0.04)', borderColor: 'rgba(193, 255, 28, 0.2)' }}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Station:</span>
                  <span className={styles.detailValue} style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>
                    {session.console.hardwareTitle}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Player:</span>
                  <span className={styles.detailValue}>
                    {playerName} {session.user?.phone ? `(${session.user.phone})` : ''}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Session Time:</span>
                  <span className={styles.detailValue}>
                    {startTimeFormatted} → {endTimeFormatted}
                  </span>
                </div>
                <div className={styles.detailRow} style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                  <span className={styles.detailLabel} style={{ fontWeight: 700, color: '#fff' }}>Total Playtime:</span>
                  <span className={styles.detailValue} style={{ color: 'var(--primary-accent)', fontWeight: 800, fontSize: '0.95rem' }}>
                    {durationLabel} ({billableMinutes}m billed @ PKR {baseRate}/hr)
                  </span>
                </div>
              </div>

              {/* Gaming Charges Breakdown */}
              <div className={styles.field} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className={styles.label} style={{ margin: 0 }}>Gaming Time Charge</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomAmount(!isCustomAmount);
                      if (!isCustomAmount) setCustomGamingPrice(calculatedGamingTotal.toString());
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary-accent)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {isCustomAmount ? 'Reset to Auto Calculation' : '✏️ Custom / Discount'}
                  </button>
                </div>

                {!isCustomAmount ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Playtime Fee: PKR {calculatedTimeCharge}</div>
                      {controllersCount > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                          +{controllersCount} Extra Controller{controllersCount > 1 ? 's' : ''}: PKR {controllerFee}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-accent)' }}>
                      PKR {calculatedGamingTotal}
                    </span>
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="Enter custom gaming amount in PKR"
                      value={customGamingPrice}
                      onChange={e => setCustomGamingPrice(e.target.value)}
                      className={styles.input}
                      style={{ fontSize: '0.95rem', borderColor: 'var(--primary-accent)' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem', display: 'block' }}>
                      Auto-calculated was PKR {calculatedGamingTotal}. Enter adjusted final gaming amount.
                    </span>
                  </div>
                )}
              </div>

              {/* Add Snacks & Drinks Tab */}
              <div className={styles.field} style={{ marginBottom: '1rem' }}>
                <label className={styles.label}>Add Snacks / Drinks to Tab</label>

                {/* Quick Snack Badges */}
                {snacks.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    {snacks.map(snack => (
                      <button
                        key={snack.id}
                        type="button"
                        onClick={() => handleAddSnack(snack)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '5px',
                          padding: '0.3rem 0.6rem',
                          color: '#fff',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-accent)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                      >
                        <span>{snack.icon || '🥤'}</span>
                        <span>{snack.name}</span>
                        <span style={{ color: 'var(--primary-accent)', fontWeight: 700 }}>(+PKR {snack.price})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Added Snacks List */}
                {addedSnacks.length > 0 && (
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}>
                    {addedSnacks.map(snack => (
                      <div key={snack.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span>{snack.name} (PKR {snack.price} × {snack.quantity})</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary-accent)', marginRight: '0.4rem' }}>
                            PKR {snack.price * snack.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateSnackQty(snack.id, -1)}
                            style={{
                              background: 'rgba(255, 59, 48, 0.2)',
                              border: '1px solid rgba(255, 59, 48, 0.4)',
                              color: '#ff4d4f',
                              borderRadius: '3px',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem'
                            }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '14px', textAlign: 'center', fontWeight: 700 }}>{snack.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateSnackQty(snack.id, 1)}
                            style={{
                              background: 'rgba(193, 255, 28, 0.2)',
                              border: '1px solid rgba(193, 255, 28, 0.4)',
                              color: 'var(--primary-accent)',
                              borderRadius: '3px',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className={styles.field} style={{ marginBottom: '1rem' }}>
                <label className={styles.label}>Payment Method</label>
                <div className={styles.paymentOptions}>
                  <button
                    type="button"
                    className={`${styles.paymentBtn} ${paymentMethod === 'cash' ? styles.paymentBtnActive : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    className={`${styles.paymentBtn} ${paymentMethod === 'card' ? styles.paymentBtnActive : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    💳 Card
                  </button>
                  <button
                    type="button"
                    className={`${styles.paymentBtn} ${paymentMethod === 'account' ? styles.paymentBtnActive : ''}`}
                    onClick={() => setPaymentMethod('account')}
                  >
                    👤 Member Account
                  </button>
                </div>
              </div>

              {/* Cash Tendered & Change Calculator */}
              {paymentMethod === 'cash' && (
                <div className={styles.field} style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className={styles.label} style={{ margin: 0 }}>Cash Tendered (PKR)</label>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {[grandTotal, Math.ceil(grandTotal / 500) * 500, Math.ceil(grandTotal / 1000) * 1000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 3).map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashTendered(amt.toString())}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '4px',
                            padding: '0.15rem 0.4rem',
                            color: '#fff',
                            fontSize: '0.68rem',
                            cursor: 'pointer'
                          }}
                        >
                          PKR {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder={`Enter cash given (e.g. ${grandTotal})`}
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value)}
                    className={styles.input}
                  />

                  {parseFloat(cashTendered) >= grandTotal && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.4rem 0.6rem',
                      background: 'rgba(193, 255, 28, 0.1)',
                      border: '1px solid rgba(193, 255, 28, 0.3)',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-accent)' }}>Return Change:</span>
                      <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary-accent)' }}>
                        PKR {changeDue}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Final Total Summary */}
              <div className={styles.slipTotalRow} style={{
                marginBottom: '1.25rem',
                background: 'rgba(193, 255, 28, 0.08)',
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid rgba(193, 255, 28, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Total Amount to Collect</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                    Gaming: PKR {finalGamingAmount} {addedSnacks.length > 0 ? `+ Snacks: PKR ${snacksTotal}` : ''}
                  </div>
                </div>
                <span className={styles.slipTotalAmount} style={{ fontSize: '1.5rem', color: 'var(--primary-accent)', fontWeight: 900 }}>
                  PKR {grandTotal}
                </span>
              </div>

              {/* Modal Actions */}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || grandTotal < 0}
                  className={styles.submitBtn}
                  style={{ flex: 1, padding: '0.85rem' }}
                >
                  {isSubmitting ? 'Processing Settlement & Clearing Station...' : `✓ Settle & View Receipt (PKR ${grandTotal})`}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={styles.waitlistBtn}
                  style={{ padding: '0.85rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function PostpaidCheckoutModal(props: PostpaidCheckoutModalProps) {
  if (!props.session) return null;
  return <PostpaidCheckoutDialog key={props.session.id} {...props} session={props.session} />;
}
