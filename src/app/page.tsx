import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/features/HeroSection';
import { getHeroTrending, getHeroGallery } from '@/backend/actions';
import styles from './page.module.css';

export const revalidate = 60; // ISR cache revalidation every 60 seconds

export default async function Home() {
  const [initialTrending, initialGallery] = await Promise.all([
    getHeroTrending().catch(() => []),
    getHeroGallery().catch(() => []),
  ]);

  return (
    <>
      <Header />
      <main className={styles.main}>
        <HeroSection
          initialTrending={initialTrending}
          initialGallery={initialGallery}
        />
      </main>
      <Footer />
    </>
  );
}

