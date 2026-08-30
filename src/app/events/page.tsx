'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import styles from './page.module.css';

interface LeaderboardEntry {
  id: string;
  username: string | null;
  fullName: string | null;
  image: string | null;
  rank: string;
  playtimeHours: number;
  sessionsCount: number;
}

export default function EventsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Registering' | 'Upcoming'>('All');

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const { getLeaderboard } = await import('@/backend/actions');
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (e) {
        console.error('Failed to load leaderboard', e);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const tournaments = [
    {
      id: 1,
      title: 'FIFA 24 Weekend Clash',
      date: 'August 20, 2026',
      prize: 'PKR 10,000',
      game: 'FIFA 24',
      status: 'Registering',
    },
    {
      id: 2,
      title: 'Valorant Local Scrims',
      date: 'August 25, 2026',
      prize: 'PKR 25,000',
      game: 'Valorant',
      status: 'Upcoming',
    },
    {
      id: 3,
      title: 'Tekken 8 Throwdown',
      date: 'September 2, 2026',
      prize: 'Custom Arcade Stick',
      game: 'Tekken 8',
      status: 'Upcoming',
    },
  ];

  const filteredTournaments =
    activeFilter === 'All'
      ? tournaments
      : tournaments.filter((t) => t.status === activeFilter);

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* ─── HERO ─── */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <span className={styles.kicker}>Tournaments &amp; Rankings</span>
            <h1 className={styles.title}>
              Compete &amp; Conquer.<br />
              <span className={styles.titleAccent}>Claim your rank.</span>
            </h1>
            <p className={styles.lead}>
              Enter competitive LAN brackets, win verified prize pools, and climb
              the global lounge playtime leaderboard.
            </p>
          </div>
        </section>

        {/* ─── EVENT VITALS (PILLARS) ─── */}
        <section className={styles.pillarsSection}>
          <div className={styles.container}>
            <div className={styles.pillarsGrid}>
              <div className={styles.pillar}>
                <span className={styles.pillarNumber}>01</span>
                <h2 className={styles.pillarTitle}>Weekly Brackets</h2>
                <p className={styles.pillarText}>
                  Scheduled tournaments across fighting games, sports, and tactical shooters with double elimination formats.
                </p>
              </div>

              <div className={styles.pillar}>
                <span className={styles.pillarNumber}>02</span>
                <h2 className={styles.pillarTitle}>Cash &amp; Hardware</h2>
                <p className={styles.pillarText}>
                  Transparent cash prize pools, custom hardware peripherals, and lounge playtime credits awarded to top finalists.
                </p>
              </div>

              <div className={styles.pillar}>
                <span className={styles.pillarNumber}>03</span>
                <h2 className={styles.pillarTitle}>Verified Playtime</h2>
                <p className={styles.pillarText}>
                  Real-time session tracking syncing automatically with your player profile and global ladder standing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CONTENT BODY ─── */}
        <div className={styles.contentBody}>
          <div className={styles.container}>
            {/* ─── TOURNAMENTS SECTION ─── */}
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeaderRow}>
                <div>
                  <h2 className={styles.sectionTitle}>Tournaments</h2>
                  <p className={styles.sectionSubtitle}>
                    Register at the reception desk to secure your tournament slot
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className={styles.filterBar}>
                  {(['All', 'Registering', 'Upcoming'] as const).map((filter) => (
                    <button
                      key={filter}
                      className={`${styles.filterTab} ${
                        activeFilter === filter ? styles.activeTab : ''
                      }`}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.tournamentGrid}>
                {filteredTournaments.map((t) => (
                  <div key={t.id} className={styles.tournamentCard}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardDate}>{t.date}</span>
                      <span
                        className={`${styles.statusChip} ${
                          t.status === 'Registering'
                            ? styles.statusRegistering
                            : styles.statusUpcoming
                        }`}
                      >
                        <span className={styles.statusDot} />
                        {t.status}
                      </span>
                    </div>

                    <h3 className={styles.tournamentTitle}>{t.title}</h3>

                    <div className={styles.metaList}>
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Game Title</span>
                        <span className={styles.metaValue}>{t.game}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Prize Pool</span>
                        <span className={styles.prizeValue}>{t.prize}</span>
                      </div>
                    </div>

                    <button
                      className={
                        t.status === 'Registering'
                          ? styles.registerBtn
                          : styles.upcomingBtn
                      }
                      disabled={t.status !== 'Registering'}
                    >
                      {t.status === 'Registering'
                        ? 'Register at Desk →'
                        : 'Registration Closed'}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── GLOBAL LEADERBOARD SECTION ─── */}
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeaderRow}>
                <div>
                  <h2 className={styles.sectionTitle}>Global Leaderboard</h2>
                  <p className={styles.sectionSubtitle}>
                    Ranked by verified hours logged across all Udhyana gaming lounges
                  </p>
                </div>
              </div>

              <div className={styles.tableCard}>
                {loading ? (
                  <div className={styles.emptyState}>Loading records...</div>
                ) : leaderboard.length === 0 ? (
                  <div className={styles.emptyState}>No players ranked yet.</div>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr className={styles.tableHead}>
                          <th className={`${styles.th} ${styles.thCenter}`}>Rank</th>
                          <th className={styles.th}>Player</th>
                          <th className={styles.th}>Tier</th>
                          <th className={`${styles.th} ${styles.thRight}`}>
                            Playtime (hrs)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((user, index) => (
                          <tr
                            key={user.id}
                            className={`${styles.tableRow} ${
                              index < 3 ? styles.tableRowTop : ''
                            }`}
                          >
                            <td className={`${styles.td} ${styles.tdRank}`}>
                              <span
                                className={
                                  index === 0
                                    ? styles.rankGold
                                    : index === 1
                                    ? styles.rankSilver
                                    : index === 2
                                    ? styles.rankBronze
                                    : styles.rankDefault
                                }
                              >
                                #{index + 1}
                              </span>
                            </td>
                            <td className={styles.td}>
                              <div className={styles.playerCell}>
                                <Image
                                  src={
                                    user.image ||
                                    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${
                                      user.username || user.id
                                    }`
                                  }
                                  alt={user.username || 'Player'}
                                  width={36}
                                  height={36}
                                  className={`${styles.playerAvatar} ${
                                    index < 3 ? styles.playerAvatarTop : ''
                                  }`}
                                  unoptimized
                                />
                                <div>
                                  <div className={styles.playerName}>
                                    {user.username || 'Player'}
                                  </div>
                                  {user.fullName && (
                                    <div className={styles.playerFullName}>
                                      {user.fullName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className={styles.td}>
                              <span className={styles.tierBadge}>
                                {user.rank}
                              </span>
                            </td>
                            <td className={`${styles.td} ${styles.tdPlaytime}`}>
                              {user.playtimeHours}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

