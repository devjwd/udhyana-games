'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Toaster, toast } from 'react-hot-toast';
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
  UpcomingBooking
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
  addTimeToSession,
  pauseGameSession,
  resumeGameSession,
  transferGameSession,
  checkInOnlineBooking,
  processPosCheckout,
  getDailyShiftSummary
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

const DEFAULT_SNACKS: SnackItem[] = [
  { id: '1', name: 'Energy Drink', price: 500 },
  { id: '2', name: 'Soda Can', price: 150 },
  { id: '3', name: 'Chips / Lays', price: 200 },
  { id: '4', name: 'Chocolate', price: 300 },
];

export default function ReceptionPortal() {
  const { data: session, status: authStatus } = useSession();
  const [activeTab, setActiveTab] = useState<'register' | 'data'>('register');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Business Rates & Catalog
  const [baseRate, setBaseRate] = useState<number>(1000);
  const [extraControllerRate, setExtraControllerRate] = useState<number>(200);
  const [consoles, setConsoles] = useState<ConsoleStation[]>([]);
  const [snacks, setSnacks] = useState<SnackItem[]>(DEFAULT_SNACKS);

  // Live Operational Data
  const [dbSessions, setDbSessions] = useState<Session[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [dbWaitlist, setDbWaitlist] = useState<WaitlistEntry[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null);

  // POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'account'>('cash');
  const [prefilledWaitlistName, setPrefilledWaitlistName] = useState<string>('');

  // Active Modals State
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [checkInModalBooking, setCheckInModalBooking] = useState<UpcomingBooking | null>(null);
  const [transferModalSession, setTransferModalSession] = useState<Session | null>(null);
  const [addTimeModalSession, setAddTimeModalSession] = useState<Session | null>(null);
  const [assignWaitlistModalWaiter, setAssignWaitlistModalWaiter] = useState<WaitlistEntry | null>(null);

  const expiredNotifiedRef = useRef<Set<string>>(new Set());

  const isStaff = session?.user && (
    (session.user as any).role === 'ADMIN' ||
    (session.user as any).role === 'RECEPTIONIST'
  );

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
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
    }
  }, []);

  // Initial Load & Polling Interval (15 seconds)
  useEffect(() => {
    setIsMuted(soundManager.getMuted());

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
      } catch (err: any) {
        console.error('Failed to load initial catalog:', err);
      }
    }

    if (isStaff) {
      loadCatalog();
      const interval = setInterval(fetchLiveDashboardData, 15000);
      return () => clearInterval(interval);
    }
  }, [isStaff, fetchLiveDashboardData]);

  // Console Station Availability Checker
  const checkConsoleAvailability = useCallback((consoleId: string, durationSeconds: number) => {
    // 1. Active walk-in sessions
    const active = dbSessions.find(s => {
      if (s.consoleId !== consoleId) return false;
      const rem = Math.max(0, Math.floor((new Date(s.endTime).getTime() - Date.now()) / 1000));
      return rem > 0 && s.status !== 'COMPLETED' && s.status !== 'CANCELLED';
    });

    if (active) {
      const rem = Math.max(0, Math.floor((new Date(active.endTime).getTime() - Date.now()) / 1000));
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
      return bStart < requestedEnd;
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
    userId?: string;
    extraControllers?: number;
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
      userId: item.userId,
      extraControllers: item.extraControllers
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
  };

  const handleConfirmPosPayment = async () => {
    if (cart.length === 0 || isSubmittingOrder) return;

    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

    const sessionItems = cart
      .filter(item => item.type === 'session')
      .map(item => ({
        guestName: item.name.split(' - ')[0],
        consoleId: item.consoleId!,
        durationSeconds: item.durationSeconds!
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
        waitlistItems
      );

      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }

      soundManager.playSuccessTone();
      const waitlistNotice = waitlistItems.length > 0 ? ` (${waitlistItems.length} queued on waitlist)` : '';
      toast.success(`Payment of PKR ${totalAmount} completed via ${paymentMethod.toUpperCase()}!${waitlistNotice}`, { id: 'checkout' });
      setCart([]);
      setIsSlipModalOpen(false);
      setIsSubmittingOrder(false);

      // Refresh live dashboard in background without blocking UI
      fetchLiveDashboardData().catch(console.error);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process checkout.', { id: 'checkout' });
      setIsSubmittingOrder(false);
    }
  };

  // Waitlist Handlers
  const handleAddToWaitlist = async (name: string, requestedStation: string) => {
    try {
      await addWaitlistEntry(name, requestedStation);
      toast.success(`${name} added to waitlist queue!`);
      await fetchLiveDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to waitlist.');
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign station from waitlist.');
    }
  };

  const handleRemoveWaitlist = async (id: string) => {
    try {
      await removeWaitlistEntry(id);
      toast.success('Waitlist entry removed.');
      await fetchLiveDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove waitlist entry.');
    }
  };

  // Active Session Handlers
  const handleTogglePause = async (s: Session) => {
    const rem = Math.max(0, Math.floor((new Date(s.endTime).getTime() - Date.now()) / 1000));
    try {
      if (s.status === 'PAUSED') {
        await resumeGameSession(s.id, rem);
        toast.success(`Session resumed on ${s.console.hardwareTitle}`);
      } else {
        await pauseGameSession(s.id, rem);
        toast.success(`Session paused on ${s.console.hardwareTitle}`);
      }
      await fetchLiveDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle session state.');
    }
  };

  const handleEndSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to end this game session early?')) {
      try {
        await endGameSession(sessionId);
        toast.success('Session ended.');
        await fetchLiveDashboardData();
      } catch (err: any) {
        toast.error(err.message || 'Failed to end session.');
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to extend session.');
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer station.');
    }
  };

  // Online Bookings Check-In
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to check in reservation.');
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
          <span>M80 // Reception</span>
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
              {activeTab === 'register' ? 'Walk-In Registration & POS' : 'Lounge Monitor & Data Dashboard'}
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
                  checkAvailability={checkConsoleAvailability}
                  onAddToCart={handleAddSessionToCart}
                  onAddToWaitlist={handleAddToWaitlist}
                  prefilledName={prefilledWaitlistName}
                  onClearPrefill={() => setPrefilledWaitlistName('')}
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
                onOpenAddTime={setAddTimeModalSession}
                onTogglePause={handleTogglePause}
                onOpenTransfer={setTransferModalSession}
                onEndSession={handleEndSession}
              />
              <UpcomingReservationsTable
                bookings={upcomingBookings}
                onOpenCheckIn={setCheckInModalBooking}
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
      />

      <CheckInModal
        booking={checkInModalBooking}
        baseRate={baseRate}
        onClose={() => setCheckInModalBooking(null)}
        onConfirm={handleConfirmCheckIn}
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
    </div>
  );
}
