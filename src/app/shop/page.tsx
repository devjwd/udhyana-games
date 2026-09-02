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
    'Equip gaming peripherals, official Udhyana teamwear, and gaming session refreshments. Instant lounge pickup & loyalty XP rewards.',
};

export const revalidate = 60; // ISR cache revalidation every 60 seconds

export default async function ShopPage() {
  const dbProducts = await getProducts().catch(() => []);
  const initialProducts = getMergedShopProducts(dbProducts as any);

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* ─── INTERACTIVE CLIENT CATALOG WITH SEARCH, FILTERS & GRID ─── */}
        <ShopClientView initialProducts={initialProducts} />
      </main>
      <Footer />
    </>
  );
}



