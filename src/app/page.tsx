'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.heroSection} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 className={styles.sectionTitle} style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', marginBottom: '1rem', color: 'var(--accent)' }}>
              Udhyana Games
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
              Welcome. This is a basic setup so you can build out your sections one by one.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
