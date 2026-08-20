import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import styles from './page.module.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/');
  }

  const dbUser = await (await import('@/lib/prisma')).default.user.findUnique({
    where: { id: session.user.id }
  });

  if (!dbUser) redirect('/');
  const user = dbUser;

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.dashboard}>
          {/* Identity Column */}
          <div className={styles.profileCard}>
            <div className={styles.avatarWrapper}>
              <Image src={user.image || "/images/avatar.png"} alt="User Avatar" fill className={styles.avatar} />
            </div>
            <h1 className={styles.username}>{user.username || user.name}</h1>
            <span className={styles.rank}>{user.rank} Member</span>
            
            <div className={styles.stats}>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{user.sessionsCount}</span>
                <span className={styles.statLabel}>Sessions</span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{user.playtimeHours}h</span>
                <span className={styles.statLabel}>Playtime</span>
              </div>
              <div className={styles.statBlock}>
                <span className={`${styles.statValue}`} style={{ color: 'var(--accent)' }}>{(user as any).loyaltyPoints}</span>
                <span className={styles.statLabel}>Pts</span>
              </div>
            </div>

            <Link href="/profile/edit" className={styles.editLink}>
              Edit Profile
            </Link>
          </div>

          {/* Activity Column */}
          <div className={styles.activitySection}>
            
            <ActivityChart userId={user.id} />

            <div className={styles.gridSection}>
              <div>
                <h2 className={styles.sectionHeader}>Upcoming Reservations</h2>
                <BookingList userId={user.id} />
              </div>

              <div>
                <h2 className={styles.sectionHeader}>Session History</h2>
                <SessionHistory userId={user.id} />
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h2 className={styles.sectionHeader}>Recent Orders</h2>
              <OrderHistory userId={user.id} />
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// Separate async component for fetching bookings to keep the main page clean
async function BookingList({ userId }: { userId: string }) {
  const { getUserBookings } = await import('@/backend/actions');
  const bookings = await getUserBookings(userId);

  // Filter for future/active bookings
  const activeBookings = bookings.filter((b: any) => new Date(b.endTime) > new Date() && b.status === 'CONFIRMED');

  if (activeBookings.length === 0) {
    return (
      <div className={styles.emptyNote}>
        No upcoming reservations. <Link href="/book" className={styles.emptyLink}>Book a station now</Link>.
      </div>
    );
  }

  return (
    <>
      {activeBookings.map((b: any) => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        return (
          <div key={b.id} className={styles.activityBlock}>
            <div className={styles.activityInfo}>
              <span className={styles.activityTitle}>{b.console.hardwareTitle}</span>
              <span className={styles.activityDetail}>
                {start.toLocaleDateString()} @ {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {hours} Hours
              </span>
            </div>
            <div className={styles.activityStatus}>{b.status}</div>
          </div>
        );
      })}
    </>
  );
}

// --------------------------------------------------------
// NEW DYNAMIC COMPONENTS
// --------------------------------------------------------

async function OrderHistory({ userId }: { userId: string }) {
  const { getUserOrders } = await import('@/backend/actions');
  const orders = await getUserOrders(userId);

  if (!orders || orders.length === 0) {
    return (
      <div className={styles.emptyNote}>No recent orders.</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {orders.slice(0, 5).map((order: any) => (
        <div key={order.id} className={styles.activityBlock} style={{ borderLeftColor: 'rgba(255,255,255,0.2)' }}>
          <div className={styles.activityInfo}>
            <span className={styles.activityTitle}>Order #{order.id.slice(-6).toUpperCase()}</span>
            <span className={styles.activityDetail} style={{ color: 'rgba(255,255,255,0.5)' }}>
              PKR {order.totalAmount} • {new Date(order.createdAt).toLocaleDateString()}
            </span>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
              {order.items.map((i: any) => i.name).join(', ')}
            </div>
          </div>
          <div className={styles.activityStatus} style={{ color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.05)' }}>
            Paid via {order.paymentMethod}
          </div>
        </div>
      ))}
    </div>
  );
}

async function SessionHistory({ userId }: { userId: string }) {
  const { getUserSessions } = await import('@/backend/actions');
  const sessions = await getUserSessions(userId);

  if (!sessions || sessions.length === 0) {
    return (
      <div className={styles.emptyNote}>No past sessions.</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {sessions.slice(0, 5).map((session: any) => {
        const diffHours = session.endTime && session.startTime 
          ? ((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1)
          : '0';
        return (
          <div key={session.id} className={styles.activityBlock} style={{ borderLeftColor: 'rgba(193, 255, 28, 0.4)' }}>
            <div className={styles.activityInfo}>
              <span className={styles.activityTitle}>{session.consoleId}</span>
              <span className={styles.activityDetail} style={{ color: 'rgba(255,255,255,0.5)' }}>
                {diffHours} Hours • {new Date(session.startTime).toLocaleDateString()}
              </span>
            </div>
            <div className={styles.activityStatus} style={{ color: 'var(--primary-accent)', backgroundColor: 'rgba(193, 255, 28, 0.1)' }}>
              Completed
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function ActivityChart({ userId }: { userId: string }) {
  const { getUserActivityStats } = await import('@/backend/actions');
  const stats = await getUserActivityStats(userId);

  const maxPlaytime = Math.max(...stats.data, 1); // Avoid division by zero

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h2 className={styles.sectionHeader}>
        Playtime Activity (Last 7 Days)
      </h2>
      
      <div className={styles.chartContainer}>
        {stats.labels.map((label: string, i: number) => {
          const value = stats.data[i];
          const heightPct = Math.max((value / maxPlaytime) * 100, 2); // Minimum 2% height for visibility

          return (
            <div key={label} className={styles.chartBarWrapper}>
              <div className={styles.chartValue}>{value > 0 ? value.toFixed(1) + 'h' : ''}</div>
              <div 
                className={styles.chartBar} 
                style={{ 
                  height: `${heightPct}%`,
                  backgroundColor: value > 0 ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)'
                }}
              />
              <div className={styles.chartLabel}>{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
