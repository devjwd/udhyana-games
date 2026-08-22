'use client';
/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import styles from './page.module.css';
import { 
  getPendingUsers, getUpcomingBookings, getActiveSessions, getRecentSales, getWaitlist,
  getSnacks, getConsoles, getBaseHourlyRate, getExtraControllerRate,
  approveUser, addWaitlistEntry, endGameSession, addTimeToSession, 
  processPosCheckout, searchUsers, removeWaitlistEntry, assignWaitlistEntry,
  seedAdminUser, checkInOnlineBooking, transferGameSession, pauseGameSession, resumeGameSession,
  getDailyShiftSummary
} from '@/backend/actions';
import { Toaster, toast } from 'react-hot-toast';


const ALL_CONSOLES = [
  { id: 'ps5-1', name: 'PS5 Pro - Station 1', games: ['FIFA 24', 'Tekken 8', 'Spider-Man 2', 'Call of Duty'] },
  { id: 'ps5-2', name: 'PS5 Pro - Station 2', games: ['FIFA 24', 'Tekken 8', 'Mortal Kombat 1'] },
  { id: 'ps5-3', name: 'PS5 Pro - Station 3', games: ['Call of Duty', 'Fortnite', 'Apex Legends', 'EAFC 24'] },
  { id: 'pc-1', name: 'Esports PC - Station 4', games: ['Valorant', 'CS2', 'League of Legends', 'Dota 2'] },
  { id: 'pc-2', name: 'Esports PC - Station 5', games: ['Valorant', 'CS2', 'Rainbow Six Siege', 'Overwatch 2'] },
  { id: 'xbox-1', name: 'Xbox Series X - Station 6', games: ['Halo Infinite', 'Forza Horizon 5', 'Call of Duty', 'FIFA 24'] },
];



type Session = {
  id: number;
  name: string;
  consoleId: string;
  consoleName: string;
  remainingSeconds: number;
};

type WaitlistEntry = {
  id: number;
  name: string;
  requested: string;
  addedAt: number;
};

type Sale = {
  id: number;
  item: string;
  price: number;
  time: string;
};

type SnackItem = {
  id: string;
  name: string;
  icon: string;
  price: number;
};

type CartItem = {
  id: string;
  type: 'session' | 'snack';
  name: string;
  price: number;
  consoleId?: string;
  consoleName?: string;
  durationSeconds?: number;
  phone?: string;
  userId?: string;
};

const DEFAULT_SNACKS: SnackItem[] = [
  { id: '1', name: 'Energy Drink', icon: '⚡', price: 500 },
  { id: '2', name: 'Soda Can', icon: '🥤', price: 150 },
  { id: '3', name: 'Chips / Lays', icon: '🥔', price: 200 },
  { id: '4', name: 'Chocolate', icon: '🍫', price: 300 },
];

const INITIAL_SESSIONS: Session[] = [
  { id: 1, name: "JohnDoe99", consoleId: "ps5-1", consoleName: "PS5 Pro - Station 1", remainingSeconds: 6322 },
  { id: 2, name: "NeonNinja", consoleId: "pc-1", consoleName: "Esports PC - Station 4", remainingSeconds: 890 }, // ~14 mins, ending soon
  { id: 3, name: "Guest_4022", consoleId: "xbox-1", consoleName: "Xbox Series X - Station 6", remainingSeconds: 9000 },
];

const INITIAL_WAITLIST: WaitlistEntry[] = [
  { id: 101, name: "AlexM", requested: "Any Console", addedAt: Date.now() - 15 * 60000 },
  { id: 102, name: "TeamAlpha", requested: "Esports PC", addedAt: Date.now() - 45 * 60000 },
];

const INITIAL_HISTORY: Session[] = [
  { id: 1001, name: "EarlyBird", consoleId: "ps5-2", consoleName: "PS5 Pro - Station 2", remainingSeconds: 0 },
];

export default function ReceptionPortal() {
  const [activeTab, setActiveTab] = useState('register');
  const [dbSessions, setDbSessions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    consoleId: '',
    duration: '3600',
    additionalControllers: 0,
    payment: 'cash'
  });

  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);

  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [baseRate, setBaseRate] = useState(1000);
  const [extraControllerRate, setExtraControllerRate] = useState(200);
  const [snacks, setSnacks] = useState<SnackItem[]>(DEFAULT_SNACKS);
  const [consoles, setConsoles] = useState(ALL_CONSOLES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [orderUsername, setOrderUsername] = useState('');
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [dbWaitlist, setDbWaitlist] = useState<any[]>([]);
  const { data: session, status: authStatus } = useSession();
  const [loginEmail, setLoginEmail] = useState('devjwdo@gmail.com');
  const [loginPassword, setLoginPassword] = useState('Matta1234cad');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Advanced features state
  const [shiftSummary, setShiftSummary] = useState<any>(null);
  const [transferModalSession, setTransferModalSession] = useState<any>(null);
  const [targetTransferConsole, setTargetTransferConsole] = useState('');
  const [checkInModalBooking, setCheckInModalBooking] = useState<any>(null);
  const [checkInPaymentMethod, setCheckInPaymentMethod] = useState('cash');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const expiredNotified = useRef<Set<string>>(new Set());

  const isStaff = session?.user && ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'RECEPTIONIST');

  const DURATIONS = [
    { id: '1800', name: `30 Mins (PKR ${baseRate * 0.5})`, seconds: 1800, price: baseRate * 0.5 },
    { id: '3600', name: `1 Hour (PKR ${baseRate})`, seconds: 3600, price: baseRate },
    { id: '7200', name: `2 Hours (PKR ${baseRate * 2})`, seconds: 7200, price: baseRate * 2 },
    { id: '10800', name: `3 Hours (PKR ${baseRate * 3})`, seconds: 10800, price: baseRate * 3 },
  ];

  const playTimeUpChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (err) {
      // Browser autoplay policy might silence initial audio until user clicks
    }
  };

  const fetchPending = async () => {
    const [users, bookings, activeSess, sales, wl, shift] = await Promise.all([
      getPendingUsers(),
      getUpcomingBookings(),
      getActiveSessions(),
      getRecentSales(),
      getWaitlist(),
      getDailyShiftSummary()
    ]);
    setPendingUsers(users);
    setUpcomingBookings(bookings);
    setDbSessions(activeSess);
    setRecentSales(sales);
    setDbWaitlist(wl);
    setShiftSummary(shift);

    // Check for expired sessions and play audio chime
    activeSess.forEach((s: any) => {
      const rem = getRemainingSeconds(s.endTime);
      if (rem <= 0 && s.status === 'ACTIVE' && !expiredNotified.current.has(s.id)) {
        expiredNotified.current.add(s.id);
        playTimeUpChime();
        toast.error(`⏰ Time is UP for ${s.console.hardwareTitle} (${s.guestName || s.user?.fullName || s.user?.username})!`, { duration: 6000 });
      }
    });
  };

  useEffect(() => {
    async function loadData() {
      await seedAdminUser();
      const [rate, extraRate, fetchedSnacks, fetchedConsoles] = await Promise.all([
        getBaseHourlyRate(),
        getExtraControllerRate(),
        getSnacks(),
        getConsoles()
      ]);
      setBaseRate(rate);
      setExtraControllerRate(extraRate);
      setSnacks(fetchedSnacks);
      
      const mappedConsoles = fetchedConsoles.map(c => ({
        id: c.id,
        name: c.hardwareTitle,
        games: c.games.map(g => g.game.name)
      }));
      if (mappedConsoles.length > 0) setConsoles(mappedConsoles);

      await fetchPending();
    }
    loadData();

    const interval = setInterval(() => {
      // Force re-render to update the calculated remaining times
      setDbSessions(prev => [...prev]);
    }, 1000);

    const dataInterval = setInterval(() => {
      fetchPending();
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(dataInterval);
    };
  }, []);

  const handleApproveUser = async (userId: string) => {
    if (confirm('Verify user ID in person. Approve this account?')) {
      await approveUser(userId);
      await fetchPending();
    }
  };

  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return '00:00:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatus = (remainingSeconds: number) => {
    if (remainingSeconds <= 0) return 'Time Up';
    if (remainingSeconds <= 900) return 'Ending Soon'; // 15 mins
    return 'Active';
  };

  const getWaitTime = (addedAt: string) => {
    const mins = Math.floor((Date.now() - new Date(addedAt).getTime()) / 60000);
    return `${mins} mins`;
  };

  const getRemainingSeconds = (endTime: string) => {
    return Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
  };

  const checkConsoleAvailability = (consoleId: string, durationSeconds: number) => {
    // 1. Check active sessions (Walk-ins with valid remaining time)
    const activeSession = dbSessions.find(s => s.consoleId === consoleId && getRemainingSeconds(s.endTime) > 0);
    if (activeSession) {
      const remSec = getRemainingSeconds(activeSession.endTime);
      const minsLeft = Math.ceil(remSec / 60);
      return { 
        available: false, 
        reason: `OCCUPIED (${minsLeft}m left)`,
        remainingSeconds: remSec,
        isOccupied: true,
        isReserved: false
      };
    }

    // 2. Check upcoming online bookings
    const now = new Date();
    const requestedEnd = new Date(now.getTime() + durationSeconds * 1000);
    
    const overlappingBooking = upcomingBookings.find(b => {
      if (b.consoleId !== consoleId) return false;
      const bStart = new Date(b.startTime);
      return bStart < requestedEnd;
    });

    if (overlappingBooking) {
      const bStart = new Date(overlappingBooking.startTime);
      const timeStr = bStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { 
        available: false, 
        reason: `RESERVED AT ${timeStr}`,
        isOccupied: false,
        isReserved: true 
      };
    }

    return { available: true, reason: '', isOccupied: false, isReserved: false };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, name: val });
    setSelectedUserId(undefined);
    
    if (val.length >= 2) {
      const results = await searchUsers(val);
      setUserSearchResults(results);
    } else {
      setUserSearchResults([]);
    }
  };

  const selectUser = (u: any) => {
    setSelectedUserId(u.id);
    setFormData({ ...formData, name: u.fullName || u.username, phone: u.phone || '' });
    setUserSearchResults([]);
  };

  const handleAddSessionToCart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Name is required');
    if (!formData.consoleId) return toast.error('Console is required for session');

    const durationObj = DURATIONS.find(d => d.id === formData.duration);
    if (!durationObj) return;

    const availability = checkConsoleAvailability(formData.consoleId, durationObj.seconds);
    if (!availability.available) {
      const selectedConsoleName = consoles.find(c => c.id === formData.consoleId)?.name || 'Any Console';
      toast.error(`Cannot start session: ${availability.reason}. Use 'Add to Waitlist' instead.`);
      return;
    }

    const selectedConsole = consoles.find(c => c.id === formData.consoleId);
    if (!selectedConsole) return;

    const extraControllerCharge = formData.additionalControllers * extraControllerRate;

    const newItem: CartItem = {
      id: Date.now().toString(),
      type: 'session',
      name: `${formData.name} - ${durationObj.name}${formData.additionalControllers > 0 ? ` (+${formData.additionalControllers} Controller)` : ''}`,
      price: durationObj.price + extraControllerCharge,
      consoleId: formData.consoleId,
      consoleName: selectedConsole.name,
      durationSeconds: durationObj.seconds,
      phone: formData.phone,
      userId: selectedUserId
    };

    setCart([...cart, newItem]);
    setFormData({ name: '', phone: '', consoleId: '', duration: '3600', additionalControllers: 0, payment: 'cash' });
    setGameSearchQuery('');
    toast.success(`Session for ${selectedConsole.name} added to order!`);
  };

  const handleWaitlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Name is required for waitlist');
    
    const req = formData.consoleId ? consoles.find(c => c.id === formData.consoleId)?.name || 'Any Console' : 'Any Console';

    await addWaitlistEntry(formData.name, req);
    await fetchPending();
    setFormData({ name: '', phone: '', consoleId: '', duration: '3600', additionalControllers: 0, payment: 'cash' });
    setGameSearchQuery('');
  };

  const handleTogglePause = async (session: any) => {
    const remaining = getRemainingSeconds(session.endTime);
    if (session.status === 'PAUSED') {
      await resumeGameSession(session.id, remaining);
      toast.success(`Session resumed for ${session.console.hardwareTitle}`);
    } else {
      await pauseGameSession(session.id, remaining);
      toast(`Session paused for ${session.console.hardwareTitle}`, { icon: '⏸️' });
    }
    await fetchPending();
  };

  const handleCheckInSubmit = async () => {
    if (!checkInModalBooking) return;
    setIsCheckingIn(true);
    try {
      const res = await checkInOnlineBooking(checkInModalBooking.id, checkInPaymentMethod);
      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }
      toast.success(`Booking checked in! Station activated.`);
      setCheckInModalBooking(null);
      await fetchPending();
    } catch (err: any) {
      toast.error(err.message || 'Failed to check in booking.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleTransferSubmit = async () => {
    if (!transferModalSession || !targetTransferConsole) return;
    setIsTransferring(true);
    try {
      const res = await transferGameSession(transferModalSession.id, targetTransferConsole);
      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }
      toast.success('Session transferred successfully!');
      setTransferModalSession(null);
      setTargetTransferConsole('');
      await fetchPending();
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer station.');
    } finally {
      setIsTransferring(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleEndSession = async (id: string) => {
    if(confirm('Are you sure you want to end this session early?')) {
      await endGameSession(id);
      await fetchPending(); // Refresh
    }
  };

  const handleAddTime = async (id: string) => {
    const hours = prompt('How many hours would you like to add?', '1');
    if (hours) {
      const parsedHours = parseFloat(hours);
      if (!isNaN(parsedHours) && parsedHours > 0) {
        await addTimeToSession(id, parsedHours * 3600);
        await fetchPending();
      } else {
        toast.error('Invalid number of hours entered.');
      }
    }
  };

  const handleAddSnackToCart = (name: string, price: number) => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      type: 'snack',
      name,
      price
    };
    setCart([...cart, newItem]);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return toast.error('Cart is empty!');
    setIsSlipModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (cart.length === 0) return toast.error('Cart is empty!');
    if (isSubmitting) return;
    
    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
    const sessionItems = cart
      .filter(item => item.type === 'session')
      .map(item => ({
        guestName: item.name.split(' - ')[0],
        consoleId: item.consoleId!,
        durationSeconds: item.durationSeconds!
      }));
    const orderItems = cart.map(item => ({ name: item.name, price: item.price, type: item.type }));

    const walkInSession = cart.find(item => item.type === 'session' && !item.userId);
    const walkInName = walkInSession ? walkInSession.name.split(' - ')[0] : (orderUsername.trim() || undefined);
    const walkInPhone = walkInSession?.phone;
    const existingUserId = cart.find(item => item.userId)?.userId;

    setIsSubmitting(true);
    try {
      toast.loading('Processing order...', { id: 'checkout' });
      const res = await processPosCheckout(
        orderItems, 
        totalAmount, 
        paymentMethod, 
        sessionItems, 
        walkInName, 
        walkInPhone, 
        existingUserId
      );

      if (res && 'error' in res && res.error) {
        throw new Error(res.error);
      }
      
      await fetchPending();
      toast.success(`Payment of PKR ${totalAmount} completed via ${paymentMethod}!`, { id: 'checkout' });
      setCart([]);
      setOrderUsername('');
      setIsSlipModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process checkout.', { id: 'checkout' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // handleCancelSale not used, removing to satisfy linter

  const handleRemoveWaitlist = async (id: string) => {
    await removeWaitlistEntry(id);
    await fetchPending();
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await seedAdminUser();
      const result = await signIn('credentials', {
        redirect: false,
        username: loginEmail.trim(),
        password: loginPassword,
      });

      if (result?.ok) {
        toast.success('Logged in to Reception Desk!');
        await fetchPending();
      } else {
        if (result?.error === 'PENDING') {
          setLoginError('This account is pending verification and cannot access reception.');
        } else {
          setLoginError('Invalid credentials. Please verify email and password.');
        }
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAssignWaitlist = async (waiter: any) => {
    setFormData({
      name: waiter.name,
      phone: '',
      consoleId: '', 
      duration: '3600',
      additionalControllers: 0,
      payment: 'cash'
    });
    
    await assignWaitlistEntry(waiter.id);
    await fetchPending();
  };

  const renderRegisterTab = () => {
    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

    return (
      <div className={styles.dashboard}>
        <div className={styles.leftCol}>
          {/* Registration Panel */}
          <div className={styles.panel}>
            <h2 className={styles.panelHeader}>Walk-In Registration</h2>
            <form className={styles.form} onSubmit={handleAddSessionToCart}>
              <div className={styles.field} style={{ position: 'relative' }}>
                <label className={styles.label}>
                  Gamer Tag / Name 
                  {!selectedUserId && formData.name.length > 2 && <span style={{fontSize:'0.7rem', color:'var(--primary-accent)', marginLeft:'0.5rem'}}>(New Account Will Be Created)</span>}
                  {selectedUserId && <span style={{fontSize:'0.7rem', color:'#c1ff1c', marginLeft:'0.5rem'}}>✓ Existing User</span>}
                </label>
                <input type="text" name="name" value={formData.name} onChange={handleNameChange} className={styles.input} placeholder="Search by name or phone, or enter new name" required autoComplete="off" />
                
                {userSearchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto', borderRadius: '4px', marginTop: '0.25rem' }}>
                    {userSearchResults.map(u => (
                      <div 
                        key={u.id} 
                        onClick={() => selectUser(u)}
                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}
                      >
                        <span style={{ fontWeight: 'bold' }}>{u.fullName || u.username}</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{u.phone || 'No phone'} | @{u.username}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Contact No</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className={styles.input} placeholder="Enter contact number" />
              </div>
              
              <div className={styles.field}>
                <label className={styles.label}>Search Game Availability</label>
                <input 
                  type="text" 
                  value={gameSearchQuery} 
                  onChange={e => setGameSearchQuery(e.target.value)} 
                  className={styles.input} 
                  placeholder="e.g. FIFA, Valorant, Tekken..." 
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Assign Console</label>
                <div className={styles.gridOptions}>
                  {consoles.map(c => {
                    const durationObj = DURATIONS.find(d => d.id === formData.duration);
                    const availability = durationObj ? checkConsoleAvailability(c.id, durationObj.seconds) : { available: true, reason: '', isOccupied: false, isReserved: false };
                    const isAvailable = availability.available;
                    const isSelected = formData.consoleId === c.id;
                    
                    const hasGame = gameSearchQuery.trim() !== '' 
                      ? c.games.some(g => g.toLowerCase().includes(gameSearchQuery.toLowerCase()))
                      : false;

                    let btnClass = styles.optionBtn;
                    if (isSelected) {
                      if (availability.isOccupied) {
                        btnClass += ' ' + styles.optionBtnOccupiedActive;
                      } else if (availability.isReserved) {
                        btnClass += ' ' + styles.optionBtnReservedActive;
                      } else {
                        btnClass += ' ' + styles.optionBtnActive;
                      }
                    } else {
                      if (availability.isOccupied) {
                        btnClass += ' ' + styles.optionBtnOccupied;
                      } else if (availability.isReserved) {
                        btnClass += ' ' + styles.optionBtnReserved;
                      }
                    }

                    return (
                      <button 
                        key={c.id}
                        type="button" 
                        className={btnClass}
                        onClick={() => setFormData({ ...formData, consoleId: c.id })}
                      >
                        {c.name.split(' - ')[0]}<br/><span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{c.name.split(' - ')[1]}</span>
                        {!isAvailable && (
                          <span style={{ 
                            fontSize: '0.65rem', 
                            color: availability.isOccupied ? '#ff4d4d' : '#60a5fa', 
                            marginTop: '0.25rem', 
                            fontWeight: 900,
                            background: availability.isOccupied ? 'rgba(255, 77, 77, 0.15)' : 'rgba(96, 165, 250, 0.15)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '3px'
                          }}>
                            {availability.reason}
                          </span>
                        )}
                        {hasGame && <span style={{ fontSize: '0.65rem', color: 'var(--primary-accent)', marginTop: '0.25rem', fontWeight: 900 }}>GAME FOUND</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Duration</label>
                <div className={styles.gridOptions} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {DURATIONS.map(d => (
                    <button 
                      key={d.id}
                      type="button" 
                      className={`${styles.optionBtn} ${formData.duration === d.id ? styles.optionBtnActive : ''}`}
                      onClick={() => setFormData({ ...formData, duration: d.id })}
                    >
                      {d.name.split(' (')[0]}<br/><span style={{ fontSize: '0.8rem', opacity: 0.7 }}>PKR {d.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Additional Controllers (+{extraControllerRate} PKR flat fee each)</label>
                <div className={styles.gridOptions} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {[0, 1, 3].map(num => (
                    <button 
                      key={num}
                      type="button" 
                      className={`${styles.optionBtn} ${formData.additionalControllers === num ? styles.optionBtnActive : ''}`}
                      onClick={() => setFormData({ ...formData, additionalControllers: num })}
                    >
                      {num === 0 ? 'None' : `+${num} Controller${num > 1 ? 's' : ''}`}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const selectedDurationObj = DURATIONS.find(d => d.id === formData.duration);
                const selectedConsoleAvailability = formData.consoleId && selectedDurationObj
                  ? checkConsoleAvailability(formData.consoleId, selectedDurationObj.seconds)
                  : { available: true, reason: '', isOccupied: false, isReserved: false };
                const isSelectedConsoleUnavailable = formData.consoleId ? !selectedConsoleAvailability.available : false;
                const selectedConsoleName = consoles.find(c => c.id === formData.consoleId)?.name || 'Selected Station';

                return (
                  <>
                    <div className={styles.btnGroup}>
                      <button 
                        type="submit" 
                        disabled={isSelectedConsoleUnavailable}
                        className={`${styles.submitBtn} ${isSelectedConsoleUnavailable ? styles.submitBtnDisabled : ''}`}
                        title={isSelectedConsoleUnavailable ? 'Station is occupied. Use Add to Waitlist instead.' : 'Add to Order'}
                      >
                        {isSelectedConsoleUnavailable ? '🚫 Station Occupied' : 'Add to Order'}
                      </button>
                      <button 
                        type="button" 
                        className={`${styles.waitlistBtn} ${isSelectedConsoleUnavailable ? styles.waitlistBtnPrimary : ''}`} 
                        onClick={handleWaitlist}
                      >
                        {isSelectedConsoleUnavailable ? '⚡ Add to Waitlist' : 'Add to Waitlist'}
                      </button>
                    </div>

                    {isSelectedConsoleUnavailable && (
                      <div style={{ fontSize: '0.8rem', color: '#ffb400', marginTop: '0.5rem', textAlign: 'center', background: 'rgba(255, 180, 0, 0.08)', padding: '0.6rem 1rem', borderRadius: '6px', border: '1px dashed rgba(255, 180, 0, 0.3)' }}>
                        ⚠️ <strong>{selectedConsoleName}</strong> is <strong>{selectedConsoleAvailability.reason}</strong>. Click <strong>Add to Waitlist</strong> to queue the player.
                      </div>
                    )}
                  </>
                );
              })()}
            </form>
          </div>



          {/* Quick Sale Panel */}
          <div className={styles.panel}>
            <h2 className={styles.panelHeader}>Quick Sale (Snacks)</h2>
            <div className={styles.snackGrid}>
              {snacks.map(snack => (
                <button key={snack.id} type="button" className={styles.snackBtn} onClick={() => handleAddSnackToCart(snack.name, snack.price)}>
                  {snack.icon} {snack.name}<br/><span>PKR {snack.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.leftCol}>
          {/* Checkout Panel */}
          <div className={styles.panel}>
            <h2 className={styles.panelHeader}>Current Order</h2>
            <div className={styles.cartItems}>
              {cart.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.5)', padding: '2rem 0', textAlign: 'center', fontStyle: 'italic' }}>Order is empty</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.cartItemDetails}>
                      <span className={styles.cartItemName}>{item.name}</span>
                      {item.type === 'session' && <span className={styles.cartItemSub}>{item.consoleName}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={styles.cartItemPrice}>PKR {item.price}</span>
                      <button onClick={() => handleRemoveFromCart(item.id)} className={styles.cartItemRemove}>✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.cartTotalSection}>
              <div className={styles.cartTotalRow}>
                <span>Total Amount:</span>
                <span className={styles.cartTotalAmount}>PKR {totalAmount}</span>
              </div>
              
              <div className={styles.field} style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
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
                    👤 Account
                  </button>
                </div>
              </div>



              <button 
                className={styles.checkoutBtn} 
                onClick={() => handleCheckout()} 
                disabled={cart.length === 0}
                style={{ opacity: cart.length === 0 ? 0.5 : 1 }}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDataTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Shift Summary KPIs */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Today's Revenue</span>
          <span className={styles.kpiValue} style={{ color: 'var(--primary-accent)' }}>PKR {shiftSummary?.grandTotal || 0}</span>
          <span className={styles.kpiSub}>{shiftSummary?.orderCount || 0} Total Orders</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Cash In Register</span>
          <span className={styles.kpiValue}>PKR {shiftSummary?.cashTotal || 0}</span>
          <span className={styles.kpiSub}>Drawer Balance</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Card Payments</span>
          <span className={styles.kpiValue}>PKR {shiftSummary?.cardTotal || 0}</span>
          <span className={styles.kpiSub}>POS Terminal</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Active Occupancy</span>
          <span className={styles.kpiValue} style={{ color: '#60a5fa' }}>{dbSessions.length} / {consoles.length}</span>
          <span className={styles.kpiSub}>Stations In-Use</span>
        </div>
      </div>

      {/* Pending Approvals Panel */}
      <div className={styles.panel}>
        <h2 className={styles.panelHeader} style={{ borderColor: 'var(--primary-accent)', color: 'var(--primary-accent)' }}>Pending Account Approvals</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Full Name</th>
              <th className={styles.th}>Gamer Tag</th>
              <th className={styles.th}>Phone</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map(user => (
              <tr key={user.id} className={styles.tr}>
                <td className={styles.td} style={{ fontWeight: 800 }}>{user.fullName}</td>
                <td className={styles.td}>{user.username}</td>
                <td className={styles.td}>{user.phone}</td>
                <td className={styles.td}>
                  <button className={styles.actionBtn} style={{ color: 'black', backgroundColor: 'var(--primary-accent)', borderColor: 'var(--primary-accent)' }} onClick={() => handleApproveUser(user.id)}>
                    Verify & Approve
                  </button>
                </td>
              </tr>
            ))}
            {pendingUsers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No pending accounts.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Upcoming Bookings Panel */}
      <div className={styles.panel}>
        <h2 className={styles.panelHeader} style={{ borderColor: '#60a5fa', color: '#60a5fa' }}>Upcoming Reservations (Online)</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Player</th>
              <th className={styles.th}>Station</th>
              <th className={styles.th}>Time</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {upcomingBookings.map((b: any) => {
              const start = new Date(b.startTime);
              const end = new Date(b.endTime);
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

              return (
                <tr key={b.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div style={{ fontWeight: 'bold' }}>{b.user.fullName || b.user.username}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{b.user.phone}</div>
                  </td>
                  <td className={styles.td}>{b.console.hardwareTitle}</td>
                  <td className={styles.td}>
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{hours} hrs</div>
                  </td>
                  <td className={styles.td}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      background: 'rgba(96, 165, 250, 0.2)', 
                      color: '#60a5fa',
                      fontSize: '0.8rem'
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <button 
                      className={styles.checkinBtn} 
                      onClick={() => setCheckInModalBooking(b)}
                    >
                      Check-In & Start
                    </button>
                  </td>
                </tr>
              );
            })}
            {upcomingBookings.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No upcoming reservations.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Active Sessions Panel */}
      <div className={styles.panel}>
        <h2 className={styles.panelHeader}>Active Sessions Monitor</h2>
        <div className={styles.sessionGrid}>
          {dbSessions.map(session => {
            const remainingSeconds = getRemainingSeconds(session.endTime);
            const status = session.status === 'PAUSED' ? 'Paused' : getStatus(remainingSeconds);
            const isDanger = remainingSeconds <= 0 && session.status !== 'PAUSED';
            const isPaused = session.status === 'PAUSED';

            return (
              <div key={session.id} className={`${styles.sessionCard} ${isDanger ? styles.sessionCardDanger : ''}`}>
                <div className={styles.sessionCardHeader}>
                  <h3 style={{ margin: 0 }}>{session.console.hardwareTitle}</h3>
                  <span className={isPaused ? styles.statusPaused : isDanger ? styles.statusDanger : styles.statusActive}>
                    {status}
                  </span>
                </div>
                
                <div style={{ margin: '1rem 0' }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Player</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{session.guestName || session.user?.fullName || session.user?.username}</div>
                </div>

                <div className={styles.timerDisplay}>
                  {formatTime(remainingSeconds)}
                </div>

                <div className={styles.sessionControls}>
                  <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => handleAddTime(session.id)}>
                    + Time
                  </button>
                  <button className={`${styles.actionBtn} ${styles.actionBtnWarning}`} onClick={() => handleTogglePause(session)}>
                    {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                  </button>
                  <button className={`${styles.actionBtn}`} onClick={() => { setTransferModalSession(session); setTargetTransferConsole(''); }}>
                    🔄 Transfer
                  </button>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleEndSession(session.id)}>
                    End
                  </button>
                </div>
              </div>
            );
          })}
          {dbSessions.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
              No active sessions.
            </div>
          )}
        </div>
      </div>

      {/* Waitlist Queue Panel */}
      <div className={styles.panel}>
        <h2 className={styles.panelHeader} style={{ borderColor: 'rgba(193, 255, 28, 0.3)' }}>Waitlist Queue</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Requested</th>
              <th className={styles.th}>Wait Time</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dbWaitlist.map(w => (
              <tr key={w.id} className={styles.tr}>
                <td className={styles.td} style={{ fontWeight: 800 }}>{w.name}</td>
                <td className={styles.td}>{w.requested}</td>
                <td className={styles.td}>
                  <span className={styles.badge} style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#fff', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                    {getWaitTime(w.createdAt)}
                  </span>
                </td>
                <td className={styles.td}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className={styles.actionBtn} style={{ color: 'var(--primary-accent)', borderColor: 'rgba(193, 255, 28, 0.3)' }} onClick={() => handleAssignWaitlist(w)}>Assign</button>
                    <button className={styles.actionBtn} onClick={() => handleRemoveWaitlist(w.id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {dbWaitlist.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>Waitlist is empty.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>



      {/* Sales History Panel */}
      <div className={styles.panel}>
        <h2 className={styles.panelHeader} style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>Recent Sales</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Items</th>
              <th className={styles.th}>Total</th>
              <th className={styles.th}>Time</th>
              <th className={styles.th}>Method</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map(sale => (
                <tr key={sale.id} className={styles.tr}>
                  <td className={styles.td}>
                    {sale.items.map((i: any) => i.name).join(', ')}
                  </td>
                  <td className={styles.td}>PKR {sale.totalAmount}</td>
                  <td className={styles.td}>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className={styles.td} style={{ textTransform: 'capitalize' }}>{sale.paymentMethod}</td>
                </tr>
              ))}
              {recentSales.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No recent sales.</td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (authStatus === 'loading') {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className={styles.loginContainer}>
        <Toaster position="top-right" />
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h1 className={styles.loginBrand}>M80 // Reception</h1>
            <p className={styles.loginSubtitle}>Staff & Admin Portal Authentication</p>
          </div>

          <div className={styles.credHintBox}>
            <div className={styles.credHintTitle}>
              <span>Default Admin Access</span>
              <button 
                type="button" 
                className={styles.autofillBtn}
                onClick={() => {
                  setLoginEmail('devjwdo@gmail.com');
                  setLoginPassword('Matta1234cad');
                }}
              >
                Autofill
              </button>
            </div>
            <div className={styles.credHintDetails}>
              Email: <strong>devjwdo@gmail.com</strong><br />
              Password: <strong>Matta1234cad</strong>
            </div>
          </div>

          {session?.user && (
            <div className={styles.loginError} style={{ borderColor: 'rgba(255, 180, 0, 0.4)', background: 'rgba(255, 180, 0, 0.1)', color: '#ffb400' }}>
              Logged in as <strong>{session.user.name || session.user.email}</strong> (Role: {(session.user as any).role || 'USER'}).<br />
              This account does not have Receptionist or Admin privileges.
            </div>
          )}

          {loginError && <div className={styles.loginError}>{loginError}</div>}

          <form onSubmit={handleStaffLogin} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Staff Email / Gamer Tag</label>
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className={styles.input}
                placeholder="e.g. devjwdo@gmail.com"
                required
              />
            </div>

            <div className={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={styles.label}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={styles.input}
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" disabled={isLoggingIn} className={styles.loginBtn}>
              {isLoggingIn ? 'Authenticating...' : '🔑 Access Reception Portal'}
            </button>

            {session?.user && (
              <button
                type="button"
                onClick={() => signOut()}
                className={styles.logoutBtn}
                style={{ marginTop: '0.5rem' }}
              >
                Sign Out Current Account
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toaster position="top-right" />
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>M80 // Reception</Link>
        </div>
        <nav className={styles.nav}>
          <div 
            className={`${styles.navItem} ${activeTab === 'register' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register & Order
          </div>
          <div 
            className={`${styles.navItem} ${activeTab === 'data' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Data Dashboard
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.staffInfo}>
            <span className={styles.staffRole}>{(session?.user as any)?.role || 'STAFF'}</span>
            <span className={styles.staffName}>{session?.user?.name || session?.user?.email}</span>
            <span className={styles.staffEmail}>{session?.user?.email}</span>
          </div>
          <button onClick={() => signOut()} className={styles.logoutBtn}>
            🚪 Log Out / Switch Staff
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>
            {activeTab === 'register' && 'Registration & POS'}
            {activeTab === 'data' && 'Lounge Monitor'}
          </h1>
          <div className={styles.systemStatus}>
            <div className={styles.statusDot}></div>
            System Online
          </div>
        </header>

        <div className={styles.content}>
          {activeTab === 'register' && renderRegisterTab()}
          {activeTab === 'data' && renderDataTab()}
        </div>

        {/* Order Slip Modal */}
        {isSlipModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#1a1a1a', padding: '3rem', borderRadius: '12px', width: '500px', maxWidth: '90%', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center', color: 'var(--primary-accent)' }}>Order Slip</h2>
              
              <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                {cart.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>{item.name}</span>
                    <span style={{ fontWeight: 600 }}>PKR {item.price}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--primary-accent)' }}>PKR {cart.reduce((sum, item) => sum + item.price, 0)}</span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '1.1rem', textTransform: 'capitalize' }}>
                Payment Method: <strong style={{ color: 'var(--primary-accent)' }}>{paymentMethod === 'card' ? '💳 Card' : paymentMethod === 'cash' ? '💵 Cash' : '👤 Account'}</strong>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button 
                  onClick={() => handleConfirmPayment()} 
                  disabled={isSubmitting}
                  style={{ 
                    background: isSubmitting ? '#666' : 'var(--primary-accent)', 
                    color: isSubmitting ? '#aaa' : 'black', 
                    padding: '1rem', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '1.2rem', 
                    fontWeight: 900, 
                    cursor: isSubmitting ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {isSubmitting ? 'Processing Order...' : 'Mark as Paid & Confirm'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => handlePrintReceipt()} 
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  🖨️ Print Receipt / Slip
                </button>

                <button 
                  onClick={() => setIsSlipModalOpen(false)} 
                  disabled={isSubmitting}
                  style={{ background: 'transparent', color: 'white', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
                >
                  Cancel / Return
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Check-In Reservation Modal */}
        {checkInModalBooking && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center', color: '#60a5fa' }}>
                Check-In Reservation
              </h2>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Player Name:</span>
                  <strong>{checkInModalBooking.user.fullName || checkInModalBooking.user.username}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Station:</span>
                  <strong>{checkInModalBooking.console.hardwareTitle}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Reserved Time:</span>
                  <span>{new Date(checkInModalBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  <span>Total Due:</span>
                  <span style={{ color: 'var(--primary-accent)' }}>
                    PKR {Math.round(((new Date(checkInModalBooking.endTime).getTime() - new Date(checkInModalBooking.startTime).getTime()) / (1000 * 3600)) * baseRate)}
                  </span>
                </div>
              </div>

              <div className={styles.field} style={{ marginBottom: '1.5rem' }}>
                <label className={styles.label}>Collect Payment Method</label>
                <div className={styles.paymentOptions}>
                  <button 
                    type="button" 
                    className={`${styles.paymentBtn} ${checkInPaymentMethod === 'cash' ? styles.paymentBtnActive : ''}`}
                    onClick={() => setCheckInPaymentMethod('cash')}
                  >
                    💵 Cash
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.paymentBtn} ${checkInPaymentMethod === 'card' ? styles.paymentBtnActive : ''}`}
                    onClick={() => setCheckInPaymentMethod('card')}
                  >
                    💳 Card
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.paymentBtn} ${checkInPaymentMethod === 'account' ? styles.paymentBtnActive : ''}`}
                    onClick={() => setCheckInPaymentMethod('account')}
                  >
                    👤 Account
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button 
                  onClick={handleCheckInSubmit} 
                  disabled={isCheckingIn}
                  className={styles.submitBtn}
                >
                  {isCheckingIn ? 'Activating Station...' : '✅ Mark Paid & Activate Station'}
                </button>
                <button 
                  type="button"
                  onClick={() => setCheckInModalBooking(null)}
                  disabled={isCheckingIn}
                  className={styles.waitlistBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Station Modal */}
        {transferModalSession && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', textAlign: 'center', color: '#ffb400' }}>
                Transfer Station
              </h2>

              <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: '1.5rem' }}>
                Move <strong>{transferModalSession.guestName || transferModalSession.user?.fullName || transferModalSession.user?.username}</strong> from <strong>{transferModalSession.console.hardwareTitle}</strong> to another station with remaining time intact.
              </p>

              <div className={styles.field} style={{ marginBottom: '1.5rem' }}>
                <label className={styles.label}>Select Destination Station</label>
                <select 
                  value={targetTransferConsole}
                  onChange={(e) => setTargetTransferConsole(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="">— Select Open Station —</option>
                  {consoles
                    .filter(c => c.id !== transferModalSession.consoleId)
                    .map(c => {
                      const avail = checkConsoleAvailability(c.id, 1800);
                      return (
                        <option key={c.id} value={c.id} disabled={!avail.available}>
                          {c.name} {!avail.available ? `(${avail.reason})` : '✓ Available'}
                        </option>
                      );
                    })
                  }
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button 
                  onClick={handleTransferSubmit} 
                  disabled={!targetTransferConsole || isTransferring}
                  className={styles.submitBtn}
                  style={{ background: '#ffb400', color: '#000' }}
                >
                  {isTransferring ? 'Moving Station...' : '🔄 Confirm Transfer'}
                </button>
                <button 
                  type="button"
                  onClick={() => setTransferModalSession(null)}
                  disabled={isTransferring}
                  className={styles.waitlistBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
