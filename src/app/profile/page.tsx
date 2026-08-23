import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import styles from './page.module.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import {
  getUserBookings,
  getUserOrders,
  getUserSessions,
  getUserActivityStats
} from '@/backend/actions';

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!dbUser) redirect('/');
  const user = dbUser;

  // Gamified Rank Calculation
  const loyaltyPoints = user.loyaltyPoints || 0;
  let nextRankName = 'Pro';
  let targetPoints = 500;
  let progressPct = Math.min(100, Math.round((loyaltyPoints / 500) * 100));

  if (loyaltyPoints >= 1000) {
    nextRankName = 'Max Rank Reached';
    targetPoints = 1000;
    progressPct = 100;
  } else if (loyaltyPoints >= 500) {
    nextRankName = 'Elite';
    targetPoints = 1000;
    progressPct = Math.min(100, Math.round(((loyaltyPoints - 500) / 500) * 100));
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.dashboard}>
          {/* Left Column: Player Identity & Gamified Rank Card */}
          <div className={styles.profileCard}>
            <div className={styles.avatarWrapper}>
              <Image src={user.image || "/images/avatar.png"} alt="User Avatar" fill className={styles.avatar} />
            </div>
            <h1 className={styles.username}>{user.fullName || user.name || user.username}</h1>
            <span className={styles.userHandle}>@{user.username || 'player'}</span>
            
            <div className={styles.rankBadge}>
              ★ {user.rank || 'Rookie'} Member
            </div>

            {/* Loyalty XP Progress */}
            <div className={styles.rankProgressContainer}>
              <div className={styles.rankProgressHeader}>
                <span className={styles.rankProgressTitle}>Loyalty Progress</span>
                <span className={styles.rankProgressXP}>{loyaltyPoints} / {targetPoints} XP</span>
              </div>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} style={{ width: `${progressPct}%` }} />
              </div>
              <div className={styles.nextRankInfo}>
                {loyaltyPoints >= 1000 
                  ? '⭐ Top Tier Elite Member' 
                  : `${targetPoints - loyaltyPoints} XP needed for ${nextRankName}`}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className={styles.stats}>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{user.sessionsCount || 0}</span>
                <span className={styles.statLabel}>Sessions</span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{user.playtimeHours || 0}h</span>
                <span className={styles.statLabel}>Playtime</span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statValue} style={{ color: '#d6ff01' }}>{loyaltyPoints}</span>
                <span className={styles.statLabel}>Reward Pts</span>
              </div>
            </div>

            <Link href="/profile/edit" className={styles.editLink}>
              Edit Profile
            </Link>
          </div>

          {/* Right Column: Activity, Pass & History */}
          <div className={styles.activitySection}>
            
            {/* Playtime Chart */}
            <div className={styles.chartCard}>
              <h2 className={styles.sectionHeader}>Playtime Activity (Last 7 Days)</h2>
              <ActivityChart userId={user.id} />
            </div>

            {/* Active Passes & Reservations */}
            <div>
              <h2 className={styles.sectionHeader}>Active Reservations & Check-in Passes</h2>
              <BookingList userId={user.id} />
            </div>

            <div className={styles.gridSection}>
              <div>
                <h2 className={styles.sectionHeader}>Session History</h2>
                <SessionHistory userId={user.id} />
              </div>

              <div>
                <h2 className={styles.sectionHeader}>Recent Orders</h2>
                <OrderHistory userId={user.id} />
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// --------------------------------------------------------
// SUB-COMPONENTS
// --------------------------------------------------------

async function BookingList({ userId }: { userId: string }) {
  const bookings = await getUserBookings(userId);

  // Filter for future/active bookings
  const activeBookings = bookings.filter((b) => new Date(b.endTime) > new Date() && b.status === 'CONFIRMED');

  if (activeBookings.length === 0) {
    return (
      <div className={styles.emptyNote}>
        No upcoming reservations. <Link href="/book" className={styles.emptyLink}>Book a station now →</Link>
      </div>
    );
  }

  return (
    <div>
      {activeBookings.map((b) => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        const checkinCode = `PASS-${b.id.slice(-6).toUpperCase()}`;

        return (
          <div key={b.id} className={styles.bookingPassCard}>
            <div className={styles.bookingPassHeader}>
              <div>
                <div className={styles.stationName}>{b.console.hardwareTitle}</div>
                <div style={{ fontSize: '0.8rem', color: '#7f8388', marginTop: '2px' }}>Udhyana Gaming Lounge</div>
              </div>
              <span className={styles.stationPassBadge}>{b.status}</span>
            </div>

            <div className={styles.bookingPassDetails}>
              <div className={styles.passDetailItem}>
                <span className={styles.passDetailLabel}>Date</span>
                <span className={styles.passDetailValue}>{start.toLocaleDateString()}</span>
              </div>
              <div className={styles.passDetailItem}>
                <span className={styles.passDetailLabel}>Time</span>
                <span className={styles.passDetailValue}>
                  {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={styles.passDetailItem}>
                <span className={styles.passDetailLabel}>Duration</span>
                <span className={styles.passDetailValue}>{hours} Hours</span>
              </div>
            </div>

            <div className={styles.checkinCodeBox}>
              <span className={styles.checkinCodeLabel}>Show Check-in Pass at Reception:</span>
              <span className={styles.checkinCode}>{checkinCode}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function OrderHistory({ userId }: { userId: string }) {
  const orders = await getUserOrders(userId);

  if (!orders || orders.length === 0) {
    return (
      <div className={styles.emptyNote}>No recent orders.</div>
    );
  }

  return (
    <div>
      {orders.slice(0, 5).map((order) => (
        <div key={order.id} className={styles.activityBlock}>
          <div className={styles.activityInfo}>
            <span className={styles.activityTitle}>Order #{order.id.slice(-6).toUpperCase()}</span>
            <span className={styles.activityDetail}>
              PKR {order.totalAmount} • {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className={styles.activityStatus}>
            {order.paymentMethod || 'Paid'}
          </div>
        </div>
      ))}
    </div>
  );
}

async function SessionHistory({ userId }: { userId: string }) {
  const sessions = await getUserSessions(userId);

  if (!sessions || sessions.length === 0) {
    return (
      <div className={styles.emptyNote}>No past sessions.</div>
    );
  }

  return (
    <div>
      {sessions.slice(0, 5).map((session) => {
        const diffHours = session.endTime && session.startTime 
          ? ((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1)
          : '0';
        return (
          <div key={session.id} className={styles.activityBlock}>
            <div className={styles.activityInfo}>
              <span className={styles.activityTitle}>{session.consoleId || 'Console Session'}</span>
              <span className={styles.activityDetail}>
                {diffHours} Hours • {new Date(session.startTime).toLocaleDateString()}
              </span>
            </div>
            <div className={styles.activityStatus}>
              Completed
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function ActivityChart({ userId }: { userId: string }) {
  const stats = await getUserActivityStats(userId);

  const maxPlaytime = Math.max(...stats.data, 1);

  return (
    <div className={styles.chartContainer}>
      {stats.labels.map((label: string, i: number) => {
        const value = stats.data[i];
        const heightPct = Math.max((value / maxPlaytime) * 100, 4);

        return (
          <div key={label} className={styles.chartBarWrapper}>
            <div className={styles.chartValue}>{value > 0 ? value.toFixed(1) + 'h' : ''}</div>
            <div 
              className={styles.chartBar} 
              style={{ 
                height: `${heightPct}%`,
                backgroundColor: value > 0 ? '#d6ff01' : 'rgba(255,255,255,0.1)'
              }}
            />
            <div className={styles.chartLabel}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}
