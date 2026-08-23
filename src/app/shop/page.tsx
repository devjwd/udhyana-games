import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ShopClientView from '@/components/features/ShopClientView';
import { getProducts } from '@/backend/actions';
import styles from './page.module.css';

export const revalidate = 60; // ISR cache revalidation every 60 seconds

export default async function ShopPage() {
  const products = await getProducts().catch(() => []);

  return (
    <>
      <Header />
      <main>
        {/* ─── HERO ─── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroContent}>
            <span className={styles.kicker}>The Armory</span>
            <h1 className={styles.headline}>
              Gear Up.<br />
              <span className={styles.headlineAccent}>Perform.</span>
            </h1>
            <p className={styles.sub}>
              Exclusive peripherals, merch, and fuel to power your sessions.{' '}
              <span className={styles.subAccent}>Purchase at the reception desk.</span>
            </p>
          </div>
        </section>

        {/* ─── INTERACTIVE CLIENT GRID & FILTERS ─── */}
        <ShopClientView initialProducts={products} />
      </main>
      <Footer />
    </>
  );
}

