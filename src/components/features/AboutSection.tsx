import Link from 'next/link';
import styles from './AboutSection.module.css';

export default function AboutSection() {
  return (
    <section id="about" className={styles.aboutSection} aria-label="About Udhyana Games">
      {/* ─── Intro / Header ─── */}
      <div className={styles.intro}>
        <div className={styles.container}>
          <span className={styles.kicker}>About Udhyana</span>
          <h2 className={styles.title}>
            Built for gamers.<br />
            <span className={styles.titleAccent}>Designed for community.</span>
          </h2>
          <p className={styles.lead}>
            Udhyana Games is a modern gaming lounge and esports destination.
            We bring players together with next-generation consoles, esports-grade
            displays, and an atmosphere built for local multiplayer.
          </p>
        </div>
      </div>

      {/* ─── Pillars ─── */}
      <div className={styles.pillarsSection}>
        <div className={styles.container}>
          <div className={styles.pillarsGrid}>
            <div className={styles.pillar}>
              <span className={styles.pillarNumber}>01</span>
              <h3 className={styles.pillarTitle}>Next-Gen Hardware</h3>
              <p className={styles.pillarText}>
                High-performance PS5 stations, Xbox Series X, and custom racing rigs paired with high-refresh rate displays.
              </p>
            </div>

            <div className={styles.pillar}>
              <span className={styles.pillarNumber}>02</span>
              <h3 className={styles.pillarTitle}>Local Multiplayer</h3>
              <p className={styles.pillarText}>
                Relive the excitement of in-person gaming. From 4-player couch co-op to 1v1 fighting game brackets.
              </p>
            </div>

            <div className={styles.pillar}>
              <span className={styles.pillarNumber}>03</span>
              <h3 className={styles.pillarTitle}>Lounge &amp; Energy</h3>
              <p className={styles.pillarText}>
                Ergonomic seating, a fully stocked refreshment bar with snacks and energy drinks, and private event bookings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Visit & Contact ─── */}
      <div className={styles.detailsSection}>
        <div className={styles.container}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailBlock}>
              <h3 className={styles.sectionHeading}>Visit Us</h3>
              <div className={styles.detailContent}>
                <p className={styles.detailLabel}>Location</p>
                <p className={styles.detailValue}>
                  Udhyana Gaming Lounge<br />
                  Main Bazaar, Matta, Swat<br />
                  Khyber Pakhtunkhwa, Pakistan
                </p>

                <p className={styles.detailLabel}>Hours</p>
                <p className={styles.detailValue}>
                  Monday – Sunday<br />
                  10:00 AM – 12:00 AM (Midnight)
                </p>
              </div>
            </div>

            <div className={styles.detailBlock}>
              <h3 className={styles.sectionHeading}>Connect</h3>
              <div className={styles.detailContent}>
                <p className={styles.detailLabel}>Inquiries</p>
                <p className={styles.detailValue}>
                  Email: <Link href="mailto:info@udhyanagames.com" className={styles.link}>info@udhyanagames.com</Link><br />
                  Reception Desk: <Link href="tel:+923000000000" className={styles.link}>+92 (300) 000-0000</Link>
                </p>

                <p className={styles.detailLabel}>Community</p>
                <div className={styles.socialLinks}>
                  <Link href="#" className={styles.socialLink}>Discord</Link>
                  <span className={styles.separator}>·</span>
                  <Link href="#" className={styles.socialLink}>Instagram</Link>
                  <span className={styles.separator}>·</span>
                  <Link href="#" className={styles.socialLink}>Twitter</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FAQ ─── */}
      <div className={styles.faqSection}>
        <div className={styles.container}>
          <h3 className={styles.sectionHeading}>Frequently Asked Questions</h3>
          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>Can I bring my own controller or peripherals?</h4>
              <p className={styles.faqAnswer}>
                Yes. Every station is equipped with accessible USB ports so you can plug and play with your preferred controller, headset, or mouse.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>Do you serve food and refreshments?</h4>
              <p className={styles.faqAnswer}>
                Our lounge bar is stocked with energy drinks, cold beverages, quick snacks, and hot bites. Outside food and beverages are not allowed.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>Can I book the lounge for a private event?</h4>
              <p className={styles.faqAnswer}>
                Yes. We offer full venue and private booth rentals for birthday parties, corporate team-building, and tournament brackets.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>Do I need to book in advance?</h4>
              <p className={styles.faqAnswer}>
                Walk-ins are always welcome depending on availability. For peak weekend hours, we recommend reserving your station in advance online.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

