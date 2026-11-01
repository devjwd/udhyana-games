'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { getUserLoyaltyHistory } from '@/backend/actions';
import styles from './DigitalMemberPassModal.module.css';

interface DigitalMemberPassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoyaltyTransactionItem {
  id: string;
  amount: number;
  type: string;
  description: string;
  balanceAfter: number;
  reason?: string | null;
  createdAt: Date | string;
}

interface ProfileLoyaltyData {
  id: string;
  username: string | null;
  fullName: string | null;
  rank: string;
  loyaltyPoints: number;
  lifetimeEarnedXP: number;
}

export default function DigitalMemberPassModal({ isOpen, onClose }: DigitalMemberPassModalProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'pass' | 'history'>('pass');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [profileData, setProfileData] = useState<ProfileLoyaltyData | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransactionItem[]>([]);

  const userId = session?.user?.id;
  const sessionUsername = session?.user?.username;

  const handleManualRefresh = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await getUserLoyaltyHistory(userId);
      if (res.user) {
        setProfileData({
          id: res.user.id,
          username: res.user.username,
          fullName: res.user.fullName,
          rank: res.user.rank,
          loyaltyPoints: res.user.loyaltyPoints,
          lifetimeEarnedXP: res.user.lifetimeEarnedXP ?? 0,
        });
      }
      if (res.transactions) {
        setTransactions(res.transactions as unknown as LoyaltyTransactionItem[]);
      }
    } catch (err) {
      console.error('Failed to load loyalty details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on open
  useEffect(() => {
    let isMounted = true;
    if (isOpen && userId) {
      getUserLoyaltyHistory(userId)
        .then((res) => {
          if (!isMounted) return;
          if (res.user) {
            setProfileData({
              id: res.user.id,
              username: res.user.username,
              fullName: res.user.fullName,
              rank: res.user.rank,
              loyaltyPoints: res.user.loyaltyPoints,
              lifetimeEarnedXP: res.user.lifetimeEarnedXP ?? 0,
            });
          }
          if (res.transactions) {
            setTransactions(res.transactions as unknown as LoyaltyTransactionItem[]);
          }
        })
        .catch((err) => {
          console.error('Failed to load loyalty details:', err);
        });

      // Generate check-in QR code
      const qrPayload = sessionUsername || userId;
      QRCode.toDataURL(qrPayload, {
        width: 140,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => {
          if (isMounted) setQrCodeUrl(url);
        })
        .catch(err => console.error('Failed to generate pass QR code:', err));
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, sessionUsername]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !session?.user) return null;

  const currentRank = (profileData?.rank || session.user.rank || 'ROOKIE').toUpperCase();
  const spendableXP = profileData?.loyaltyPoints ?? session.user.loyaltyPoints ?? 0;
  const lifetimeXP = profileData?.lifetimeEarnedXP ?? session.user.lifetimeEarnedXP ?? spendableXP;
  const gamerTag = profileData?.username || session.user.username || session.user.name || 'Gamer';
  const fullName = profileData?.fullName || session.user.name || gamerTag;

  // Next VIP tier calculation
  let nextRankName = 'REGULAR';
  let targetLifetimeXP = 100;
  let prevThresholdXP = 0;
  let isMaxRank = false;

  if (lifetimeXP < 100) {
    nextRankName = 'REGULAR';
    prevThresholdXP = 0;
    targetLifetimeXP = 100;
  } else if (lifetimeXP < 500) {
    nextRankName = 'PRO';
    prevThresholdXP = 100;
    targetLifetimeXP = 500;
  } else if (lifetimeXP < 1000) {
    nextRankName = 'ELITE';
    prevThresholdXP = 500;
    targetLifetimeXP = 1000;
  } else {
    isMaxRank = true;
  }

  const progressPercent = isMaxRank
    ? 100
    : Math.min(100, Math.max(0, Math.round(((lifetimeXP - prevThresholdXP) / (targetLifetimeXP - prevThresholdXP)) * 100)));
  const xpNeeded = isMaxRank ? 0 : targetLifetimeXP - lifetimeXP;

  const handleCopyTag = () => {
    navigator.clipboard.writeText(gamerTag);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  const getRankBadgeClass = () => {
    switch (currentRank) {
      case 'ELITE': return styles.rankElite;
      case 'PRO': return styles.rankPro;
      case 'REGULAR': return styles.rankRegular;
      default: return styles.rankRookie;
    }
  };

  const getTransactionTypeInfo = (type: string) => {
    switch (type) {
      case 'WELCOME_BONUS':
        return { label: 'Welcome Gift', icon: '🎁', color: '#4ade80' };
      case 'EARNED_PLAYTIME':
        return { label: 'Game Playtime', icon: '🎮', color: '#4ade80' };
      case 'EARNED_SPEND':
        return { label: 'Cash Spend Reward', icon: '💰', color: '#4ade80' };
      case 'REDEEMED_GAMETIME':
        return { label: 'Game Time Discount', icon: '⏱️', color: '#f87171' };
      case 'REDEEMED_STORE':
        return { label: 'Point Store Reward', icon: '🛍️', color: '#f87171' };
      case 'ADMIN_ADD':
        return { label: 'Admin Grant', icon: '🛡️', color: '#4ade80' };
      case 'ADMIN_DEDUCT':
        return { label: 'Admin Adjustment', icon: '🛡️', color: '#f87171' };
      case 'EXPIRED_INACTIVITY':
        return { label: 'Inactivity Expiry', icon: '⏳', color: '#f87171' };
      default:
        return { label: type, icon: '⚡', color: '#d6ff01' };
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span style={{ color: '#d6ff01', fontSize: '1.25rem' }}>⚡</span>
            <h2>Udhyana VIP Pass</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'pass' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('pass')}
          >
            💳 Member Pass
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 XP Ledger ({transactions.length})
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'pass' ? (
            <div>
              {/* VIP Member Pass Card */}
              <div className={styles.passCard}>
                <div className={styles.cardGlow} />

                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.brandLabel}>UDHYANA GAMES ARENA</div>
                    <div className={styles.cardHolderName}>{fullName}</div>
                    <div className={styles.tagPill}>@{gamerTag}</div>
                  </div>
                  <div className={`${styles.rankBadge} ${getRankBadgeClass()}`}>
                    ★ {currentRank}
                  </div>
                </div>

                {/* Points Balance Grid */}
                <div className={styles.pointsGrid}>
                  <div className={styles.pointBox}>
                    <div className={styles.pointLabel}>
                      <span>⚡</span> Spendable XP
                    </div>
                    <div className={styles.pointValue}>{spendableXP} XP</div>
                    <div className={styles.pointWorth}>= PKR {spendableXP} game time value</div>
                  </div>

                  <div className={styles.pointBox}>
                    <div className={styles.pointLabel}>
                      <span>🏆</span> Lifetime Earned XP
                    </div>
                    <div className={styles.lifetimeValue}>{lifetimeXP} XP</div>
                    <div className={styles.lifetimeHint}>Tier never drops when spending</div>
                  </div>
                </div>

                {/* Tier Progress */}
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span>
                      {isMaxRank ? 'MAX VIP STATUS' : `Progress to ${nextRankName}`}
                    </span>
                    <span style={{ color: '#d6ff01' }}>{progressPercent}%</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className={styles.progressFooter}>
                    {isMaxRank ? (
                      'You have reached the elite master tier at Udhyana Games!'
                    ) : (
                      <>
                        Earn <strong>{xpNeeded} more XP</strong> to unlock <strong>{nextRankName}</strong> tier privileges.
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Code Desk Check-in */}
              <div className={styles.qrCard}>
                <div className={styles.qrContainer}>
                  {qrCodeUrl ? (
                    <Image
                      src={qrCodeUrl}
                      alt="Gamer QR Code"
                      width={110}
                      height={110}
                      className={styles.qrImage}
                      unoptimized
                    />
                  ) : (
                    <div style={{ width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                      Generating...
                    </div>
                  )}
                </div>
                <div className={styles.qrInfo}>
                  <div className={styles.qrTitle}>Reception Desk Pass</div>
                  <div className={styles.qrDesc}>
                    Show this QR code at the desk cashier scanner to load your gamer account, check in, and redeem Game Time instantly.
                  </div>
                  <button className={styles.copyTagBtn} onClick={handleCopyTag}>
                    {copiedTag ? '✓ Copied Gamer Tag' : `Copy @${gamerTag}`}
                  </button>
                </div>
              </div>

              {/* Loyalty Rules & Anti-Abuse Info */}
              <div className={styles.rulesCard}>
                <div className={styles.rulesTitle}>
                  <span>ℹ️</span> Loyalty Program Highlights
                </div>
                <div>• <strong>1 XP = 1 PKR</strong> discount on PS5/PC Game Time and official Reward Store items.</div>
                <div>• Snack/Drink inventory requires cash or card to protect wholesale margins.</div>
                <div>• Points stay valid with active visits. Inactive accounts expire after 180 days of no sessions.</div>
                <div>• Your VIP Rank is tied to your <strong>Lifetime Earned XP</strong> and is never downgraded when spending points.</div>
              </div>
            </div>
          ) : (
            /* XP History Ledger */
            <div>
              <div className={styles.historyHeader}>
                <div className={styles.historySummary}>
                  Showing recent XP transactions ({transactions.length})
                </div>
                <button
                  className={styles.refreshBtn}
                  onClick={handleManualRefresh}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : '↻ Refresh Ledger'}
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>🎮</span>
                  <div>No XP transactions recorded yet.</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Play console games, book sessions, or join events to earn XP!
                  </div>
                </div>
              ) : (
                <div className={styles.timelineList}>
                  {transactions.map((t) => {
                    const info = getTransactionTypeInfo(t.type);
                    const isPositive = t.amount > 0;
                    const dateStr = new Date(t.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={t.id} className={styles.timelineItem}>
                        <div className={styles.itemLeft}>
                          <div className={styles.typeIcon}>
                            {info.icon}
                          </div>
                          <div className={styles.itemMeta}>
                            <div className={styles.itemType} style={{ color: info.color }}>
                              {info.label}
                            </div>
                            <div className={styles.itemDesc}>{t.description}</div>
                            {t.reason && t.reason !== t.description && (
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                                Reason: {t.reason}
                              </div>
                            )}
                            <div className={styles.itemTime}>{dateStr}</div>
                          </div>
                        </div>

                        <div className={styles.itemRight}>
                          <div className={isPositive ? styles.amountPlus : styles.amountMinus}>
                            {isPositive ? `+${t.amount}` : t.amount} XP
                          </div>
                          <div className={styles.balanceAfter}>
                            Bal: {t.balanceAfter} XP
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
