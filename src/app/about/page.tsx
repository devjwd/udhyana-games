import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'About | Udhyana Games',
  description: 'Learn about Udhyana Games — our locations, hours, FAQs, and what makes our gaming lounge the premier destination for local multiplayer.',
};

export default function About() {
  return (
    <>
      <Header />
      <main>

        {/* ─── HERO ─── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.kicker}>Our Story</span>
            <h1 className={styles.headline}>
              About<br />
              <span className={styles.headlineAccent}>Udhyana.</span>
            </h1>
            <p className={styles.sub}>
              Built for gamers. Designed for excellence. The premier destination for local
              multiplayer, competitive play, and the ultimate lounge experience.
            </p>
          </div>
        </section>

        {/* ─── BODY ─── */}
        <div className={styles.body}>

          {/* Location & Hours + Key Info */}
          <section>
            <div className={styles.sectionHeader}>
              <span className={styles.accentLine} aria-hidden="true" />
              <h2 className={styles.sectionHeading}>The Lounge</h2>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoBlock}>
                <span className={styles.infoAccentBar} aria-hidden="true" />
                <h3 className={styles.sectionTitle}>Location &amp; Hours</h3>
                <div className={styles.text}>
                  <p><strong>Address:</strong><br />123 Cyber Avenue<br />Neon District, Sector 4<br />NY 10001</p>
                  <br />
                  <p><strong>Hours of Operation:</strong><br />Monday – Thursday: 12:00 PM – 12:00 AM<br />Friday – Saturday: 12:00 PM – 3:00 AM<br />Sunday: 10:00 AM – 10:00 PM</p>
                </div>
              </div>

              <div className={styles.infoBlock}>
                <span className={styles.infoAccentBar} aria-hidden="true" />
                <h3 className={styles.sectionTitle}>Contact</h3>
                <div className={styles.text}>
                  <p><strong>Phone:</strong> (555) 019-8822</p>
                  <br />
                  <p><strong>Email:</strong> hello@udhyanagames.com</p>
                  <br />
                  <p><strong>Follow Us:</strong><br />Instagram · Twitter · Discord</p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <div className={styles.sectionHeader}>
              <span className={styles.accentLine} aria-hidden="true" />
              <h2 className={styles.sectionHeading}>Frequently Asked Questions</h2>
            </div>
            <div className={styles.faqList}>
              <div className={styles.faqItem}>
                <span className={styles.question}>Can I bring my own controller or mouse?</span>
                <span className={styles.answer}>Yes! We encourage players to bring their own peripherals for maximum comfort. We have USB hubs at every station.</span>
              </div>
              <div className={styles.faqItem}>
                <span className={styles.question}>Do you serve food and drinks?</span>
                <span className={styles.answer}>We have a fully stocked lounge offering energy drinks, snacks, and hot food. Outside food is not permitted.</span>
              </div>
              <div className={styles.faqItem}>
                <span className={styles.question}>Can I host a private event?</span>
                <span className={styles.answer}>Absolutely. The entire armory can be rented out for birthdays or private tournaments. Contact our support team for rates.</span>
              </div>
              <div className={styles.faqItem}>
                <span className={styles.question}>How do I book a station?</span>
                <span className={styles.answer}>Book online through our website or walk in. Online bookings require a registered account. Payment is made at the reception desk.</span>
              </div>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
