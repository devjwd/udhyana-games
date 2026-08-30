import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ShopClientView from '@/components/features/ShopClientView';
import { getProducts } from '@/backend/actions';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Shop & Official Merch | Udhyana Games',
  description:
    'Explore official Udhyana Games merchandise, tournament-ready peripherals, and apparel.',
};

export const revalidate = 60; // ISR cache revalidation every 60 seconds

export default async function ShopPage() {
  const products = await getProducts().catch(() => []);

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* ─── HERO ─── */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <span className={styles.kicker}>Official Merch &amp; Gear</span>
            <h1 className={styles.title}>
              Gear Up.<br />
              <span className={styles.titleAccent}>Built to perform.</span>
            </h1>
            <p className={styles.lead}>
              Official Udhyana apparel, tournament-ready peripherals, and refreshments
              to power your gaming sessions. Reserve online or pick up directly at the reception desk.
            </p>
          </div>
        </section>

        {/* ─── SHOP VITALS (PILLARS) ─── */}
        <section className={styles.pillarsSection}>
          <div className={styles.container}>
            <div className={styles.pillarsGrid}>
              <div className={styles.pillar}>
                <span className={styles.pillarNumber}>01</span>
                <h2 className={styles.pillarTitle}>Official Merch</h2>
                <p className={styles.pillarText}>
                  High-grade esports jerseys, heavyweight hoodies, and custom desk accessories designed for gamers.
                </p>
              </div>

              <div className={styles.pillar}>
                <span className={styles.pillarNumber}>02</span>
                <h2 className={styles.pillarTitle}>Pro Peripherals</h2>
                <p className={styles.pillarText}>
                  Tournament-tested mechanical switches, low-latency controllers, and precision gaming mice.
                </p>
              </div>

              <div className={styles.pillar}>
                <span className={styles.pillarNumber}>03</span>
                <h2 className={styles.pillarTitle}>Instant Pickup</h2>
                <p className={styles.pillarText}>
                  Browse inventory in real time and collect your order directly at the reception desk during your visit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── INTERACTIVE CLIENT GRID & FILTERS ─── */}
        <ShopClientView initialProducts={products} />
      </main>
      <Footer />
    </>
  );
}


