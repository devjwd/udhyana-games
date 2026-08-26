'use client';

import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { CartItem } from '../types';
import toast from 'react-hot-toast';
import { generateThermalReceiptBytes, printDirectWebSerial } from '../utils/escpos';

interface ReceiptSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  paymentMethod: string;
  isSubmitting: boolean;
  onConfirmPayment: () => void;
  staffName?: string;
}

export default function ReceiptSlipModal({
  isOpen,
  onClose,
  cart,
  paymentMethod,
  isSubmitting,
  onConfirmPayment,
  staffName = 'Staff'
}: ReceiptSlipModalProps) {
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [silentPrint, setSilentPrint] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const isDesktop = typeof window !== 'undefined' && Boolean((window as any).electronAPI?.isDesktop);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);

      // Load saved printer preference
      const savedPrinter = localStorage.getItem('pos_thermal_printer_name');
      const savedSilent = localStorage.getItem('pos_thermal_silent_print');
      if (savedPrinter) setSelectedPrinter(savedPrinter);
      if (savedSilent !== null) setSilentPrint(savedSilent === 'true');

      // Fetch installed printers if in Electron Desktop app
      if (isDesktop && (window as any).electronAPI?.getPrinters) {
        (window as any).electronAPI.getPrinters().then((list: any[]) => {
          if (Array.isArray(list) && list.length > 0) {
            setPrinters(list);
            if (!savedPrinter) {
              const defaultP = list.find(p => p.isDefault) || list[0];
              if (defaultP) setSelectedPrinter(defaultP.name);
            }
          }
        }).catch(console.error);
      }
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isDesktop, onClose]);

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handlePrinterChange = (name: string) => {
    setSelectedPrinter(name);
    localStorage.setItem('pos_thermal_printer_name', name);
  };

  const handleSilentToggle = (val: boolean) => {
    setSilentPrint(val);
    localStorage.setItem('pos_thermal_silent_print', val ? 'true' : 'false');
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      if (isDesktop && (window as any).electronAPI?.printReceipt) {
        const success = await (window as any).electronAPI.printReceipt({
          silent: silentPrint,
          deviceName: selectedPrinter || undefined,
        });
        if (success) {
          toast.success(silentPrint ? 'Direct receipt sent to thermal printer!' : 'Receipt printed.');
        } else {
          toast.error('Print command could not be completed.');
        }
      } else {
        // In standard browser: if print dialog fallback
        window.print();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to print receipt.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDirectWebSerialESC = async () => {
    setIsPrinting(true);
    try {
      const receiptBytes = generateThermalReceiptBytes({
        storeName: 'M80 GAMING LOUNGE',
        storeSub: 'Official POS Receipt',
        staffName,
        dateStr,
        timeStr,
        items: cart.map(i => ({ name: i.name, price: i.price, sub: i.consoleName })),
        totalAmount,
        paymentMethod
      });
      await printDirectWebSerial(receiptBytes);
      toast.success('ESC/POS direct print successful!');
    } catch (err: any) {
      toast.error(err?.message || 'Direct USB/Serial print failed.');
    } finally {
      setIsPrinting(false);
    }
  };

  const supportsWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator;

  return (
    <>
      {/* Printable Thermal Receipt (Visible Only In @media print) */}
      <div className={styles.printableReceipt}>
        <div className={styles.printHeader}>
          <div className={styles.printBrand}>M80 GAMING LOUNGE</div>
          <div className={styles.printSub}>Official Receipt & Game Pass</div>
          <div className={styles.printMeta}>
            <span>Date: {dateStr} {timeStr}</span>
            <span>Staff: {staffName}</span>
          </div>
        </div>

        <div className={styles.printDivider} />

        <div className={styles.printItems}>
          {cart.map((item, idx) => (
            <div key={idx} className={styles.printItemRow}>
              <div className={styles.printItemName}>
                <span>{item.name}</span>
                {item.consoleName && <small className={styles.printItemSub}>Station: {item.consoleName}</small>}
              </div>
              <span className={styles.printItemPrice}>PKR {item.price}</span>
            </div>
          ))}
        </div>

        <div className={styles.printDivider} />

        <div className={styles.printTotalRow}>
          <span>TOTAL AMOUNT</span>
          <span>PKR {totalAmount}</span>
        </div>
        <div className={styles.printMethodRow}>
          <span>Payment Method:</span>
          <span>{paymentMethod.toUpperCase()}</span>
        </div>

        <div className={styles.printDivider} />

        <div className={styles.printFooter}>
          <div>Thank you for playing with us!</div>
          <div>Please retain slip for console verification.</div>
        </div>
      </div>

      {/* Interactive Modal UI */}
      <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }} role="dialog" aria-modal="true">
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle} style={{ color: 'var(--primary-accent)' }}>Order Slip & Checkout</h2>
            <button className={styles.modalCloseBtn} onClick={onClose} disabled={isSubmitting}>✕</button>
          </div>

          <div className={styles.slipItemList}>
            {cart.map((item, i) => (
              <div key={i} className={styles.slipItemRow}>
                <div>
                  <div className={styles.slipItemName}>{item.name}</div>
                  {item.consoleName && <div className={styles.slipItemSub}>{item.consoleName}</div>}
                </div>
                <div className={styles.slipItemPrice}>PKR {item.price}</div>
              </div>
            ))}
          </div>

          <div className={styles.slipTotalRow}>
            <span>Total Payable:</span>
            <span className={styles.slipTotalAmount}>PKR {totalAmount}</span>
          </div>

          <div className={styles.slipMethodBanner}>
            Payment Method: <strong>{paymentMethod.toUpperCase()}</strong>
          </div>

          {/* Thermal Printer Settings in Modal */}
          {isDesktop && printers.length > 0 && (
            <div className={styles.field} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
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

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onConfirmPayment}
              disabled={isSubmitting}
              className={styles.submitBtn}
            >
              {isSubmitting ? 'Processing Order...' : 'Mark as Paid & Confirm'}
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handlePrint}
                disabled={isSubmitting || isPrinting}
                className={styles.actionBtnOutline}
                style={{ flex: 1, padding: '0.85rem' }}
              >
                {isPrinting ? 'Printing...' : isDesktop && silentPrint ? '⚡ Direct Thermal Print (Silent)' : '🖨️ Print Receipt / Slip'}
              </button>

              {!isDesktop && supportsWebSerial && (
                <button
                  type="button"
                  onClick={handleDirectWebSerialESC}
                  disabled={isSubmitting || isPrinting}
                  className={styles.actionBtnOutline}
                  style={{ color: 'var(--primary-accent)', borderColor: 'rgba(193, 255, 28, 0.3)', padding: '0.85rem' }}
                  title="Direct USB Serial ESC/POS Print"
                >
                  ⚡ Direct USB ESC/POS
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={styles.waitlistBtn}
            >
              Cancel / Return
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
