'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import styles from './page.module.css';

export default function EventsPage() {
  const [leaderboard, setLeaderboard] = useState<{ id: string; username: string | null; fullName: string | null; image: string | null; rank: string; playtimeHours: number; sessionsCount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const { getLeaderboard } = await import('@/backend/actions');
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const tournaments = [
    { id: 1, title: 'FIFA 24 Weekend Clash', date: 'August 20, 2026', prize: 'PKR 10,000', game: 'FIFA 24', status: 'Registering' },
    { id: 2, title: 'Valorant Local Scrims', date: 'August 25, 2026', prize: 'PKR 25,000', game: 'Valorant', status: 'Upcoming' },
    { id: 3, title: 'Tekken 8 Throwdown', date: 'September 2, 2026', prize: 'Custom Arcade Stick', game: 'Tekken 8', status: 'Upcoming' }
  ];

  return (
    <>
      <Header />
      <main>

        {/* ─── PAGE HERO ─── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroContent}>
            <span className={styles.kicker}>Compete &amp; Conquer</span>
            <h1 className={styles.headline}>
              Tournaments<br />
              <span className={styles.headlineAccent}>&amp; Rankings</span>
            </h1>
            <p className={styles.sub}>
              Prove your skills in upcoming tournaments and climb the global playtime leaderboard.
            </p>
          </div>
        </section>

        <div className={styles.pageBody}>

          {/* ─── UPCOMING TOURNAMENTS ─── */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.accentLine} aria-hidden="true" />
              <h2 className={styles.sectionTitle}>Upcoming Tournaments</h2>
            </div>

            <div className={styles.tournamentGrid}>
              {tournaments.map(t => (
                <div key={t.id} className={styles.tournamentCard}>
                  <div className={styles.tournamentDate}>{t.date}</div>
                  <h3 className={styles.tournamentTitle}>{t.title}</h3>

                  <div className={styles.tournamentMeta}>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>Game</span>
                      <span className={styles.metaValue}>{t.game}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>Prize Pool</span>
                      <span className={`${styles.metaValue} ${styles.metaAccent}`}>{t.prize}</span>
                    </div>
                  </div>

                  <button
                    className={t.status === 'Registering' ? styles.registerBtn : styles.upcomingBtn}
                    disabled={t.status !== 'Registering'}
                  >
                    {t.status === 'Registering' ? 'Register at Desk' : t.status}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ─── GLOBAL LEADERBOARD ─── */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.accentLine} aria-hidden="true" />
              <h2 className={styles.sectionTitle}>Global Leaderboard</h2>
            </div>
            <p className={styles.sectionSub}>Ranked by total hours logged at the cafe.</p>

            <div className={styles.leaderboardTable}>
              {loading ? (
                <div className={styles.emptyState}>Loading records...</div>
              ) : leaderboard.length === 0 ? (
                <div className={styles.emptyState}>No players ranked yet.</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHead}>
                      <th className={`${styles.th} ${styles.thCenter}`}>Rank</th>
                      <th className={styles.th}>Player</th>
                      <th className={styles.th}>Tier</th>
                      <th className={`${styles.th} ${styles.thRight}`}>Playtime (hrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((user, index) => (
                      <tr key={user.id} className={`${styles.tableRow} ${index < 3 ? styles.tableRowTop : ''}`}>
                        <td className={`${styles.td} ${styles.tdRank}`}>
                          <span className={index === 0 ? styles.rankGold : index === 1 ? styles.rankSilver : index === 2 ? styles.rankBronze : styles.rankDefault}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.playerCell}>
                            <Image
                              src={user.image || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.username || user.id}`}
                              alt={user.username || 'Player'}
                              width={40}
                              height={40}
                              className={`${styles.playerAvatar} ${index < 3 ? styles.playerAvatarTop : ''}`}
                              unoptimized
                            />
                            <div>
                              <div className={styles.playerName}>{user.username || 'Player'}</div>
                              <div className={styles.playerFullName}>{user.fullName}</div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.tierBadge}>{user.rank}</span>
                        </td>
                        <td className={`${styles.td} ${styles.tdPlaytime}`}>{user.playtimeHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
