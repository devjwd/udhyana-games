'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Toaster, toast } from 'react-hot-toast';
import GamingIcon from '@/components/ui/GamingIcon';
import styles from './page.module.css';
import SyncStatusBadge from '@/components/SyncStatusBadge';
import { soundManager } from './utils/sound';
import {
  ConsoleStation,
  DurationOption,
  Session,
  WaitlistEntry,
  Sale,
  SnackItem,
  CartItem,
  ShiftSummary,
  UpcomingBooking,
  PrefilledCustomer
} from './types';
import {
  getUpcomingBookings,
  getActiveSessions,
  getRecentSales,
  getWaitlist,
  getSnacks,
  getConsoles,
  getBaseHourlyRate,
  getExtraControllerRate,
  addWaitlistEntry,
  removeWaitlistEntry,
  startSessionFromWaitlist,
  endGameSession,
  endAllExpiredSessions,
  addTimeToSession,
  pauseGameSession,
  resumeGameSession,
  transferGameSession,
  checkInOnlineBooking,
  acceptBooking,
  cancelBooking,
  processPosCheckout,
  getDailyShiftSummary,
  searchUsers,
  startPostpaidSession,
  settleAndEndPostpaidSession
} from '@/backend/actions';

// Modals & Feature Components
import ReceptionAuth from './components/ReceptionAuth';
import WalkInForm from './components/RegisterTab/WalkInForm';
import QuickSaleSnacks from './components/RegisterTab/QuickSaleSnacks';
import CurrentOrderCart from './components/RegisterTab/CurrentOrderCart';
import ShiftKpiGrid from './components/DashboardTab/ShiftKpiGrid';
import ActiveSessionsMonitor from './components/DashboardTab/ActiveSessionsMonitor';
import UpcomingReservationsTable from './components/DashboardTab/UpcomingReservationsTable';
import WaitlistQueueTable from './components/DashboardTab/WaitlistQueueTable';
import SalesHistoryTable from './components/DashboardTab/SalesHistoryTable';

import ReceiptSlipModal from './modals/ReceiptSlipModal';
import CheckInModal from './modals/CheckInModal';
import TransferModal from './modals/TransferModal';
import AddTimeModal from './modals/AddTimeModal';
import AssignWaitlistModal from './modals/AssignWaitlistModal';
import PostpaidCheckoutModal from './modals/PostpaidCheckoutModal';
import TvControlPanel from './components/TvControlTab/TvControlPanel';

export default function ReceptionPortal() {
  const { data: session, status: authStatus } = useSession();
  const [activeTab, setActiveTab] = useState<'register' | 'data' | 'tv'>('register');
  const [isMuted, setIsMuted] = useState<boolean>(() => typeof window !== 'undefined' ? soundManager.getMuted() : false);

  // Business Rates & Catalog
  const [baseRate, setBaseRate] = useState<number>(300);
  const [extraControllerRate, setExtraControllerRate] = useState<number>(100);
  const [consoles, setConsoles] = useState<ConsoleStation[]>([]);
  const [snacks, setSnacks] = useState<SnackItem[]>([]);

  // Live Operational Data
  const [dbSessions, setDbSessions] = useState<Session[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [dbWaitlist, setDbWaitlist] = useState<WaitlistEntry[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null);

  // POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'account'>('cash');
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [prefilledCustomer, setPrefilledCustomer] = useState<PrefilledCustomer | null>(null);

  // Active Modals State
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [checkInModalBooking, setCheckInModalBooking] = useState<UpcomingBooking | null>(null);
  const [transferModalSession, setTransferModalSession] = useState<Session | null>(null);
  const [addTimeModalSession, setAddTimeModalSession] = useState<Session | null>(null);
  const [assignWaitlistModalWaiter, setAssignWaitlistModalWaiter] = useState<WaitlistEntry | null>(null);
  const [postpaidModalSession, setPostpaidModalSession] = useState<Session | null>(null);

  const expiredNotifiedRef = useRef<Set<string>>(new Set());

  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isStaff = userRole === 'ADMIN' || userRole === 'RECEPTIONIST';

  // Calculated Duration Options
  const durations: DurationOption[] = [
    { id: '1800', name: `30 Mins (PKR ${baseRate * 0.5})`, seconds: 1800, price: baseRate * 0.5 },
    { id: '3600', name: `1 Hour (PKR ${baseRate})`, seconds: 3600, price: baseRate },
    { id: '7200', name: `2 Hours (PKR ${baseRate * 2})`, seconds: 7200, price: baseRate * 2 },
    { id: '10800', name: `3 Hours (PKR ${baseRate * 3})`, seconds: 10800, price: baseRate * 3 },
  ];

  // Data Fetching
  const fetchLiveDashboardData = useCallback(async () => {
    try {
      const [bookings, activeSess, sales, wl, shift] = await Promise.all([
        getUpcomingBookings(),
        getActiveSessions(),
        getRecentSales(),
        getWaitlist(),
        getDailyShiftSummary()
      ]);

      setUpcomingBookings(bookings as unknown as UpcomingBooking[]);
      setDbSessions(activeSess as unknown as Session[]);
      setRecentSales(sales as unknown as Sale[]);
      setDbWaitlist(wl as unknown as WaitlistEntry[]);
      setShiftSummary(shift as unknown as ShiftSummary);

      // Prune expiredNotifiedRef of sessions that are no longer active
      const activeIds = new Set((activeSess as unknown as Session[]).map(s => s.id));
      expiredNotifiedRef.current.forEach(id => {
        if (!activeIds.has(id)) {
          expiredNotifiedRef.current.delete(id);
        }
      });

      // Check expired sessions for chime
      (activeSess as unknown as Session[]).forEach(s => {
        const rem = Math.max(0, Math.floor((new Date(s.endTime).getTime() - Date.now()) / 1000));
        if (rem <= 0 && s.status === 'ACTIVE' && !expiredNotifiedRef.current.has(s.id)) {
          expiredNotifiedRef.current.add(s.id);
          soundManager.playTimeUpChime();
          const pName = s.guestName || s.user?.fullName || s.user?.username || 'Player';
          toast.error(`Session Time Expired: ${s.console.hardwareTitle} (${pName})`, { duration: 6000 });
        }
      });
    } catch (err: unknown) {
      console.error('Failed to fetch dashboard data:', err);
    }
  }, []);

  // Initial Load & Polling Interval (15 seconds)
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [rate, extraRate, fetchedSnacks, fetchedConsoles] = await Promise.all([
          getBaseHourlyRate(),
          getExtraControllerRate(),
          getSnacks(),
          getConsoles()
        ]);
        setBaseRate(rate);
        setExtraControllerRate(extraRate);
        if (fetchedSnacks?.length) setSnacks(fetchedSnacks);

        if (fetchedConsoles?.length) {
          setConsoles(fetchedConsoles.map(c => ({
            id: c.id,
            name: c.hardwareTitle,
            games: c.games.map(g => g.game.name),
          })));
        }

        await fetchLiveDashboardData();
      } catch (err: unknown) {
        console.error('Failed to load initial catalog:', err);
      }
    }

    if (isStaff) {
      loadCatalog();
      const interval = setInterval(fetchLiveDashboardData, 15000);
      return () => clearInterval(interval);
    }
  }, [isStaff, fetchLiveDashboardData]);

  // Global USB Handheld Barcode Scanner Listener
  // Intercepts rapid keystrokes (<60ms per char) ending in Enter
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Do not intercept if user is typing into any input, textarea, select or contenteditable
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl as HTMLElement)?.isContentEditable
      ) {
        buffer = '';
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3 && timeDiff < 60) {
          const scannedCode = buffer.trim();
          buffer = '';
          try {
            const results = await searchUsers(scannedCode);
            if (results && results.length > 0) {
              const found = results[0];
              soundManager.playSuccessTone();
              toast.success(`Pass Scanned: ${found.fullName || found.username} (${found.rank || 'Member'})!`);
              setPrefilledCustomer({
                id: found.id,
                name: found.fullName || found.username || '',
                phone: found.phone,
                loyaltyPoints: found.loyaltyPoints,
                rank: found.rank
              });
            } else {
              toast.error(`No member pass found for: "${scannedCode}"`);
            }
          } catch {
            toast.error('Failed to verify scanned pass.');
          }
        } else {
          buffer = '';
        }
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff > 80) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Console Station Availability Checker
  const checkConsoleAvailability = useCallback((consoleId: string, durationSeconds: number) => {
    // 1. Active walk-in sessions (including paused or expired but not yet checked out)
    const active = dbSessions.find(s => {
      if (s.consoleId !== consoleId) return false;
      return s.status !== 'COMPLETED' && s.status !== 'CANCELLED';
    });

    if (active) {
      if (active.status === 'PAUSED') {
        return {
          available: false,
          reason: 'PAUSED',
          isOccupied: true,
          isReserved: false
        };
      }
      const rem = Math.floor((new Date(active.endTime).getTime() - Date.now()) / 1000);
      if (rem <= 0) {
        const overtimeSec = Math.abs(rem);
        const overtimeMins = Math.floor(overtimeSec / 60);
        const endTimeStr = new Date(active.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          available: false,
          reason: `EXPIRED (+${overtimeMins}m, Ended at ${endTimeStr})`,
          isOccupied: true,
          isReserved: false
        };
      }
      const minsLeft = Math.ceil(rem / 60);
      return {
        available: false,
        reason: `OCCUPIED (${minsLeft}m left)`,
        isOccupied: true,
        isReserved: false
      };
    }

    // 2. Upcoming online reservations
    const now = new Date();
    const requestedEnd = new Date(now.getTime() + durationSeconds * 1000);

    const overlapping = upcomingBookings.find(b => {
      if (b.consoleId !== consoleId) return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return now < bEnd && requestedEnd > bStart;
    });

    if (overlapping) {
      const bStart = new Date(overlapping.startTime);
      const timeStr = bStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        available: false,
        reason: `RESERVED AT ${timeStr}`,
        isOccupied: false,
        isReserved: true
      };
    }

    return { available: true, reason: '', isOccupied: false, isReserved: false };
  }, [dbSessions, upcomingBookings]);

  // POS Cart Handlers
  const handleAddSessionToCart = (item: {
    id?: string;
    type?: 'session' | 'waitlist' | 'snack';
    name: string;
    price: number;
    consoleId?: string;
    consoleName?: string;
    durationSeconds?: number;
    phone?: string;
    cnic?: string;
    isUnder18?: boolean;
    userId?: string;
    extraControllers?: number;
    billingType?: 'PREPAID' | 'POSTPAID';
    userLoyaltyPoints?: number;
    userRank?: string;
    userName?: string;
  }) => {
    const newItem: CartItem = {
      id: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: item.type || 'session',
      name: item.name,
      price: item.price,
      consoleId: item.consoleId,
      consoleName: item.consoleName,
      durationSeconds: item.durationSeconds,
      phone: item.phone,
      cnic: item.cnic,
      isUnder18: item.isUnder18,
      userId: item.userId,
      extraControllers: item.extraControllers,
      billingType: item.billingType,
      userLoyaltyPoints: item.userLoyaltyPoints,
      userRank: item.userRank,
      userName: item.userName
    };
    setCart(prev => [...prev, newItem]);
    if (item.type === 'waitlist') {
      toast.success(`Added waitlist queue spot to order!`, { icon: '⏳' });
    } else {
      toast.success(`Station ${item.consoleName || ''} added to order!`);
    }
  };

  const handleAddSnackToCart = (snack: SnackItem) => {
    const newItem: CartItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: 'snack',
      name: snack.name,
      price: snack.price
    };
    setCart(prev => [...prev, newItem]);
    toast.success(`Added ${snack.name}`);
  };

  const handleRemoveCartItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
    setPointsToRedeem(0);
  };

  const handleConfirmPosPayment = async () => {
    if (cart.length === 0 || isSubmittingOrder) return;

    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

    const sessionItems = cart
      .filter(item => item.type === 'session')
      .map(item => ({
        guestName: item.name.split(' - ')[0],
        consoleId: item.consoleId!,
        durationSeconds: item.durationSeconds || 3600,
        billingType: item.billingType || 'PREPAID',
        extraControllers: item.extraControllers || 0
      }));

    const waitlistItems = cart
      .filter(item => item.type === 'waitlist')
      .map(item => ({
        guestName: item.name.replace(/^\[Waitlist\]\s*/, '').split(' - ')[0],
        requestedConsoleName: item.consoleName || 'Any Station',
        durationSeconds: item.durationSeconds || 3600,
        phone: item.phone,
        userId: item.userId
      }));

    const orderItems = cart.map(item => ({ name: item.name, price: item.price, type: item.type }));

    const walkInGuest = cart.find(item => !item.userId);
    const walkInName = walkInGuest ? walkInGuest.name.replace(/^\[Waitlist\]\s*/, '').split(' - ')[0] : undefined;
    const walkInPhone = walkInGuest?.phone;
    const existingUserId = cart.find(item => item.userId)?.userId;

    setIsSubmittingOrder(true);
    try {
      toast.loading('Processing payment & assigning stations...', { id: 'checkout' });
      const res = await processPosCheckout(
        orderItems,
        totalAmount,
        paymentMethod,
        sessionItems,
        walkInName,
        walkInPhone,
        existingUserId,
        waitlistItems,
        pointsToRedeem
      );

      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }

      soundManager.playSuccessTone();
      const hasPostpaid = sessionItems.some(s => s.billingType === 'POSTPAID');
      const waitlistNotice = waitlistItems.length > 0 ? ` (${waitlistItems.length} queued on waitlist)` : '';
      const finalPaid = res && 'totalAmount' in res ? res.totalAmount : totalAmount;
      const pointsMsg = res && 'pointsRedeemed' in res && res.pointsRedeemed > 0 ? ` (used ${res.pointsRedeemed} XP)` : '';
      const successMsg = hasPostpaid && totalAmount === 0
        ? `Open session started! Slip generated. (Payment due on exit)`
        : hasPostpaid
          ? `Payment of PKR ${finalPaid}${pointsMsg} completed & Open session started!${waitlistNotice}`
          : `Payment of PKR ${finalPaid}${pointsMsg} completed via ${paymentMethod.toUpperCase()}!${waitlistNotice}`;

      toast.success(successMsg, { id: 'checkout' });
      setCart([]);
      setPointsToRedeem(0);
      setIsSlipModalOpen(false);
      setIsSubmittingOrder(false);

      // Refresh live dashboard in background without blocking UI
      fetchLiveDashboardData().catch(console.error);
    } catch (err: unknown) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const isNetworkErr = err instanceof TypeError || (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch')));

      if (isOffline || isNetworkErr) {
        try {
          const { syncManager } = await import('@/lib/local-db/sync-manager');
          for (const s of sessionItems) {
            await syncManager.enqueue('START_SESSION', {
              consoleId: s.consoleId,
              userId: existingUserId,
              guestName: s.guestName || walkInName || 'Guest',
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + (s.durationSeconds || 3600) * 1000).toISOString(),
              totalAmount,
              paymentMethod,
              orderItems,
              billingType: s.billingType || 'PREPAID',
              extraControllers: s.extraControllers || 0,
              pointsToRedeem: pointsToRedeem || 0,
            });
          }
          if (sessionItems.length === 0 && orderItems.length > 0) {
            await syncManager.enqueue('CREATE_ORDER', {
              userId: existingUserId,
              totalAmount,
              paymentMethod,
              items: orderItems,
            });
          }
          soundManager.playSuccessTone();
          toast.success('Network offline — Order saved locally! Will sync automatically when online.', { id: 'checkout', icon: '💾', duration: 5000 });
          setCart([]);
          setIsSlipModalOpen(false);
          setIsSubmittingOrder(false);
          return;
        } catch (queueErr) {
          console.error('Failed to queue offline order in IndexedDB:', queueErr);
        }
      }

      const message = err instanceof Error ? err.message : 'Failed to process checkout.';
      toast.error(message, { id: 'checkout' });
      setIsSubmittingOrder(false);
    }
  };

  // Waitlist Handlers
  const handleAddToWaitlist = async (name: string, requestedStation: string) => {
    try {
      await addWaitlistEntry(name, requestedStation);
      toast.success(`${name} added to waitlist queue!`);
      await fetchLiveDashboardData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add to waitlist.';
      toast.error(message);
    }
  };

  const handleAssignWaitlist = (waiter: WaitlistEntry) => {
    setAssignWaitlistModalWaiter(waiter);
  };

  const handleConfirmAssignWaitlist = async (
    waitlistId: string,
    consoleId: string,
    durationSeconds: number,
    guestName: string,
    isPrepaid: boolean,
    payMethod: string,
    amount: number
  ) => {
    try {
      const res = await startSessionFromWaitlist(
        waitlistId,
        consoleId,
        durationSeconds,
        guestName,
        undefined,
        isPrepaid,
        payMethod,
        amount
      );
      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }
      soundManager.playSuccessTone();
      const paymentNotice = !isPrepaid && amount > 0 ? ` (Paid PKR ${amount} via ${payMethod.toUpperCase()})` : '';
      toast.success(`Station assigned to ${guestName}! Gaming timer is now ACTIVE.${paymentNotice}`);
      setAssignWaitlistModalWaiter(null);
      await fetchLiveDashboardData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assign station from waitlist.';
      toast.error(message);
    }
  };

  const handleRemoveWaitlist = async (id: string) => {
    try {
      await removeWaitlistEntry(id);
      toast.success('Waitlist entry removed.');
      await fetchLiveDashboardData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove waitlist entry.';
      toast.error(message);
    }
  };

  // Active Session Handlers
  const handleTogglePause = async (s: Session) => {
    const rem = s.status === 'PAUSED'
      ? (s.pausedRemainingSeconds && s.pausedRemainingSeconds > 0 ? s.pausedRemainingSeconds : 60)
      : Math.max(1, Math.floor((new Date(s.endTime).getTime() - Date.now()) / 1000));

    try {
      if (s.status === 'PAUSED') {
        await resumeGameSession(s.id, rem);
        toast.success(`Session resumed on ${s.console.hardwareTitle}`);
      } else {
        await pauseGameSession(s.id, rem);
        toast.success(`Session paused on ${s.console.hardwareTitle} (${Math.round(rem / 60)}m frozen)`);
      }
      await fetchLiveDashboardData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle session state.';
      toast.error(message);
    }
  };

  const handleEndSession = async (sessionId: string, isExpired?: boolean) => {
    const promptText = isExpired
      ? 'Check out and complete this game session?'
      : 'Are you sure you want to end this game session early?';

    if (confirm(promptText)) {
      try {
        await endGameSession(sessionId);
        toast.success(isExpired ? 'Session completed & checked out.' : 'Session ended.');
        await fetchLiveDashboardData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to end session.';
        toast.error(message);
      }
    }
  };

  const handleEndAllExpired = async () => {
    if (confirm('End and check out all expired game sessions?')) {
      try {
        const res = await endAllExpiredSessions();
        soundManager.playSuccessTone();
        toast.success(`Closed ${res.count} expired session(s).`);
        await fetchLiveDashboardData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to end expired sessions.';
        toast.error(message);
      }
    }
  };

  const handleConfirmAddTime = async (
    sessionId: string,
    additionalSeconds: number,
    paymentMethod: string,
    amount: number
  ) => {
    try {
      const res = await addTimeToSession(sessionId, additionalSeconds, paymentMethod, amount);
      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }
      soundManager.playSuccessTone();
      toast.success(`Added +${Math.round(additionalSeconds / 60)} minutes (Paid PKR ${amount} via ${paymentMethod.toUpperCase()})!`);
      setAddTimeModalSession(null);
      await fetchLiveDashboardData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to extend session.';
      toast.error(message);
    }
  };

  const handleConfirmTransfer = async (sessionId: string, targetConsoleId: string) => {
    try {
      const res = await transferGameSession(sessionId, targetConsoleId);
      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }
      toast.success('Station transferred successfully!');
      setTransferModalSession(null);
      await fetchLiveDashboardData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to transfer station.';
      toast.error(message);
    }
  };

  // Postpaid Session Handlers
  const handleStartPostpaidSession = async (params: {
    consoleId: string;
    guestName: string;
    userId?: string;
    phone?: string;
    extraControllers?: number;
  }) => {
    try {
      toast.loading('Starting open session...', { id: 'start-postpaid' });
      const res = await startPostpaidSession(
        params.consoleId,
        params.guestName,
        params.userId,
        params.phone,
        params.extraControllers
      );

      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }

      soundManager.playSuccessTone();
      toast.success(`Open session ACTIVE for ${params.guestName}! Timer running.`, { id: 'start-postpaid' });
      await fetchLiveDashboardData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start postpaid session.';
      toast.error(message, { id: 'start-postpaid' });
      throw err;
    }
  };

  const handleConfirmPostpaidCheckout = async (
    sessionId: string,
    paymentMethod: string,
    customGamingAmount: number,
    snackItems: { name: string; price: number; quantity: number; type: string }[],
    pointsToRedeem: number = 0
  ) => {
    try {
      toast.loading('Settling bill & completing session...', { id: 'settle-postpaid' });
      const res = await settleAndEndPostpaidSession(
        sessionId,
        paymentMethod,
        customGamingAmount,
        snackItems,
        pointsToRedeem
      );

      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }

      soundManager.playSuccessTone();
      const finalTotal = res && 'totalAmount' in res ? res.totalAmount : 0;
      const pointsRedeemedNum = res && 'pointsRedeemed' in res && typeof res.pointsRedeemed === 'number' ? res.pointsRedeemed : 0;
      const pointsMsg = pointsRedeemedNum > 0 ? ` (used ${pointsRedeemedNum} XP)` : '';
      toast.success(`Session settled! Collected PKR ${finalTotal}${pointsMsg} via ${paymentMethod.toUpperCase()}. Station is now free.`, { id: 'settle-postpaid' });
      await fetchLiveDashboardData();
      return res;
    } catch (err: unknown) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const isNetworkErr = err instanceof TypeError || (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch')));
      if (isOffline || isNetworkErr) {
        try {
          const { syncManager } = await import('@/lib/local-db/sync-manager');
          const snacksCost = snackItems.reduce((acc, s) => acc + s.price * s.quantity, 0);
          const totalAfterDiscount = Math.max(0, customGamingAmount + snacksCost - pointsToRedeem);
          await syncManager.enqueue('SETTLE_POSTPAID_SESSION', {
            sessionId,
            paymentMethod,
            totalAmount: totalAfterDiscount,
            orderItems: [
              { name: 'Gaming Session (Postpaid)', price: customGamingAmount, quantity: 1, type: 'session' },
              ...snackItems
            ],
            pointsToRedeem: pointsToRedeem || 0
          });
          toast.success('Network offline — Settlement saved locally! Will sync automatically when online.', { id: 'settle-postpaid', icon: '💾', duration: 5000 });
          await fetchLiveDashboardData();
          return { success: true, isOffline: true };
        } catch {
          // fall through to normal error display
        }
      }
      const message = err instanceof Error ? err.message : 'Failed to settle session.';
      toast.error(message, { id: 'settle-postpaid' });
      throw err;
    }
  };

  // Online Bookings Check-In & Acceptance
  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const res = await acceptBooking(bookingId);
      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }
      soundManager.playSuccessTone();
      toast.success('Reservation accepted! Station is reserved for the scheduled time slot.');
      await fetchLiveDashboardData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to accept reservation.';
      toast.error(message);
    }
  };

  const handleConfirmCheckIn = async (bookingId: string, payMethod: string) => {
    try {
      const res = await checkInOnlineBooking(bookingId, payMethod);
      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }
      soundManager.playSuccessTone();
      toast.success('Reservation checked in! Station is now ACTIVE.');
      setCheckInModalBooking(null);
      await fetchLiveDashboardData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to check in reservation.';
      toast.error(message);
    }
  };

  const handleCancelReservation = async (bookingId: string, playerName: string) => {
    if (confirm(`Are you sure you want to cancel the reservation for ${playerName}? This will release the station.`)) {
      try {
        const res = await cancelBooking(bookingId);
        if (res && 'error' in res && res.error) {
          throw new Error(res.error);
        }
        toast.success(`Reservation for ${playerName} cancelled.`);
        await fetchLiveDashboardData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to cancel reservation.';
        toast.error(message);
      }
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
    toast(next ? 'Sound notifications muted' : 'Sound notifications enabled', { icon: next ? '🔇' : '🔔' });
  };

  // Authentication Guard Screen
  if (authStatus === 'loading') {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <>
        <Toaster position="top-right" />
        <ReceptionAuth
          sessionUser={session?.user}
          onLoginSuccess={fetchLiveDashboardData}
        />
      </>
    );
  }

  const actionItemCount = upcomingBookings.length + dbWaitlist.length;

  return (
    <div className={styles.container}>
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GamingIcon name="logo" size={28} />
            <span style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.06em', color: '#fff' }}>
              UDHYANA <span style={{ color: 'var(--accent, #d6ff01)' }}>GAMES</span>
            </span>
          </div>
          <span className={styles.receptionTag}>RECEPTION</span>
        </div>

        <nav className={styles.nav}>
          <div
            className={`${styles.navItem} ${activeTab === 'register' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <span>Register & POS</span>
            {cart.length > 0 && <span className={styles.navBadge}>{cart.length} in Cart</span>}
          </div>

          <div
            className={`${styles.navItem} ${activeTab === 'data' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <span>Lounge Monitor</span>
            {actionItemCount > 0 && <span className={styles.navBadge}>{actionItemCount}</span>}
          </div>

          <div
            className={`${styles.navItem} ${activeTab === 'tv' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('tv')}
          >
            <span>📺 Smart TV Test</span>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.staffInfo}>
            <span className={styles.staffRole}>{session?.user?.role || 'STAFF'}</span>
            <span className={styles.staffName}>{session?.user?.name || session?.user?.email}</span>
            <span className={styles.staffEmail}>{session?.user?.email}</span>
          </div>
          <button type="button" onClick={() => signOut()} className={styles.logoutBtn}>
            Sign Out Staff
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              {activeTab === 'register' && 'Walk-In Registration & POS'}
              {activeTab === 'data' && 'Lounge Monitor & Data Dashboard'}
              {activeTab === 'tv' && 'Smart TV Network Control & Testing'}
            </h1>
          </div>

          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleToggleMute}
              title={isMuted ? 'Unmute Audio Chime' : 'Mute Audio Chime'}
            >
              {isMuted ? '🔇 Muted' : '🔔 Audio On'}
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={fetchLiveDashboardData}
              title="Refresh Live Data"
            >
              🔄 Refresh
            </button>

            <SyncStatusBadge />
          </div>
        </header>

        <div className={styles.content}>
          {activeTab === 'register' && (
            <div className={styles.dashboard}>
              <div className={styles.leftCol}>
                <WalkInForm
                  consoles={consoles}
                  durations={durations}
                  extraControllerRate={extraControllerRate}
                  baseRate={baseRate}
                  checkAvailability={checkConsoleAvailability}
                  onAddToCart={handleAddSessionToCart}
                  prefilledCustomer={prefilledCustomer}
                  onClearPrefill={() => setPrefilledCustomer(null)}
                />
                <QuickSaleSnacks
                  snacks={snacks}
                  onAddSnack={handleAddSnackToCart}
                />
              </div>

              <div className={styles.rightCol}>
                <CurrentOrderCart
                  cart={cart}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={setPaymentMethod}
                  onRemoveItem={handleRemoveCartItem}
                  onClearCart={handleClearCart}
                  onCheckout={() => setIsSlipModalOpen(true)}
                  pointsToRedeem={pointsToRedeem}
                  onPointsToRedeemChange={setPointsToRedeem}
                />
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <ShiftKpiGrid
                shiftSummary={shiftSummary}
                activeSessionCount={dbSessions.length}
                totalConsoleCount={consoles.length}
              />
              <ActiveSessionsMonitor
                sessions={dbSessions}
                baseRate={baseRate}
                extraControllerRate={extraControllerRate}
                onOpenAddTime={setAddTimeModalSession}
                onTogglePause={handleTogglePause}
                onOpenTransfer={setTransferModalSession}
                onEndSession={handleEndSession}
                onOpenPostpaidCheckout={setPostpaidModalSession}
                onEndAllExpired={handleEndAllExpired}
              />
              <UpcomingReservationsTable
                bookings={upcomingBookings}
                onOpenCheckIn={setCheckInModalBooking}
                onAcceptBooking={handleAcceptBooking}
                onCancelBooking={handleCancelReservation}
              />
              <WaitlistQueueTable
                waitlist={dbWaitlist}
                onAssignWaitlist={handleAssignWaitlist}
                onRemoveWaitlist={handleRemoveWaitlist}
              />
              <SalesHistoryTable
                sales={recentSales}
              />
            </div>
          )}

          {activeTab === 'tv' && (
            <TvControlPanel />
          )}
        </div>
      </main>

      {/* Modals */}
      <ReceiptSlipModal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        cart={cart}
        paymentMethod={paymentMethod}
        isSubmitting={isSubmittingOrder}
        onConfirmPayment={handleConfirmPosPayment}
        staffName={session?.user?.name || 'Reception Staff'}
        pointsToRedeem={pointsToRedeem}
      />

      <CheckInModal
        booking={checkInModalBooking}
        baseRate={baseRate}
        onClose={() => setCheckInModalBooking(null)}
        onConfirm={handleConfirmCheckIn}
        onAccept={handleAcceptBooking}
      />

      <TransferModal
        session={transferModalSession}
        consoles={consoles}
        checkAvailability={checkConsoleAvailability}
        onClose={() => setTransferModalSession(null)}
        onConfirm={handleConfirmTransfer}
      />

      <AddTimeModal
        session={addTimeModalSession}
        baseRate={baseRate}
        onClose={() => setAddTimeModalSession(null)}
        onConfirm={handleConfirmAddTime}
      />

      <AssignWaitlistModal
        waiter={assignWaitlistModalWaiter}
        consoles={consoles}
        durations={durations}
        checkAvailability={checkConsoleAvailability}
        onClose={() => setAssignWaitlistModalWaiter(null)}
        onConfirm={handleConfirmAssignWaitlist}
      />

      <PostpaidCheckoutModal
        session={postpaidModalSession}
        baseRate={baseRate}
        extraControllerRate={extraControllerRate}
        snacks={snacks}
        onClose={() => setPostpaidModalSession(null)}
        onConfirm={handleConfirmPostpaidCheckout}
      />
    </div>
  );
}
