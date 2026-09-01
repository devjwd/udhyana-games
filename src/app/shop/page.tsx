import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ShopClientView from '@/components/features/ShopClientView';
import { getProducts } from '@/backend/actions';
import { getMergedShopProducts } from '@/data/shopCatalog';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Official Pro Shop & Merch | Udhyana Games',
  description:
    'Equip tournament-grade peripherals, official Udhyana teamwear, and gaming session refreshments. Instant lounge pickup & loyalty XP rewards.',
};

export const revalidate = 60; // ISR cache revalidation every 60 seconds

export default async function ShopPage() {
  const dbProducts = await getProducts().catch(() => []);
  const initialProducts = getMergedShopProducts(dbProducts as any);

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* ─── HERO BANNER ─── */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <div className={styles.heroKickerWrap}>
                <span className={styles.pulseDot} />
                <span className={styles.kicker}>Official Udhyana Pro Store</span>
              </div>
              <h1 className={styles.title}>
                Tournament Gear.<br />
                <span className={styles.titleAccent}>Engineered To Win.</span>
              </h1>
              <p className={styles.lead}>
                Official team apparel, pro-tier wireless peripherals, and arena refreshments. 
                Order online for immediate reception pickup or doorstep delivery with guaranteed loyalty XP on every item.
              </p>
            </div>

            {/* ─── TRUST STATS / GUARANTEES BAR ─── */}
            <div className={styles.trustBar}>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>⚡</div>
                <div className={styles.trustText}>
                  <strong>Instant Lounge Pickup</strong>
                  <span>Collect in 2 mins at reception</span>
                </div>
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>🛡️</div>
                <div className={styles.trustText}>
                  <strong>100% Authentic Gear</strong>
                  <span>Official factory-backed warranty</span>
                </div>
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>💎</div>
                <div className={styles.trustText}>
                  <strong>Earn 10% Loyalty XP</strong>
                  <span>Redeemable for free game time</span>
                </div>
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>🎮</div>
                <div className={styles.trustText}>
                  <strong>Pro Arena Tested</strong>
                  <span>Approved by esports athletes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── INTERACTIVE CLIENT CATALOG WITH SEARCH, FILTERS & GRID ─── */}
        <ShopClientView initialProducts={initialProducts} />
      </main>
      <Footer />
    </>
  );
}



