"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ConsoleCard from '@/components/ui/ConsoleCard';
import LocationCard from '@/components/ui/LocationCard';
import styles from './page.module.css';
import { getConsoles, getBaseHourlyRate } from '@/backend/actions';

export default function Consoles() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [dbConsoles, setDbConsoles] = useState<
    {
      id: string;
      hardwareTitle: string;
      hourlyRate?: number | null;
      imagePath?: string | null;
      specs?: string | null;
      games: { game: { name: string } }[];
    }[]
  >([]);
  const [baseRate, setBaseRate] = useState(1000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [consoles, rate] = await Promise.all([
          getConsoles(),
          getBaseHourlyRate(),
        ]);
        setDbConsoles(consoles);
        setBaseRate(rate);
      } catch (err) {
        console.error('Failed to load consoles:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const locations = [
    {
      id: "udhyana-matta",
      title: "Udhyana Gaming Lounge - Matta",
      specs: "Flagship Arena · 240Hz / 4K Gaming",
      description:
        "Our premier gaming lounge in Matta featuring high-end PS5 Pro stations, custom RTX 4090 esports rigs, luxury gaming chairs, and snack bar.",
      image: "/images/hero_side.jpg",
      status: "Open Now",
      statusColor: "#d6ff01",
      features: ["PS5 Pro Stations", "RTX 4090 Esports PCs", "Xbox Series X", "Snack Bar & Refreshments"],
    },
    {
      id: "udhyana-downtown",
      title: "Udhyana Esports Arena - Downtown",
      specs: "Tournament Center · VIP Booths",
      description:
        "Specialized competitive gaming facility equipped with private team practice booths, streaming setups, and live spectator lounge.",
      image: "/images/hero_main.jpg",
      status: "Open Now",
      statusColor: "#d6ff01",
      features: ["360Hz Monitors", "Team Booths", "Live Streaming Setup", "Console Stations"],
    },
  ];

  const currentLocation = locations.find((l) => l.id === selectedLocation);

  const getStationImage = (hardwareTitle: string, defaultImg?: string) => {
    if (defaultImg) return defaultImg;
    const title = hardwareTitle.toLowerCase();
    if (title.includes('pc')) return '/images/products/pc.png';
    if (title.includes('xbox')) return '/images/products/xbox.png';
    return '/images/products/ps5.png';
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* ─── HERO ─── */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <span className={styles.kicker}>Venues &amp; Hardware</span>
            <h1 className={styles.title}>
              The Gaming Lounges.<br />
              <span className={styles.titleAccent}>Built for performance.</span>
            </h1>
            <p className={styles.lead}>
              Explore our flagship spaces, inspect station hardware specifications,
              and select your venue to reserve your upcoming session.
            </p>
          </div>
        </section>

        {/* ─── LOUNGE VITALS (PILLARS) ─── */}
        <section className={styles.pillarsSection}>
          <div className={styles.container}>
            <div className={styles.pillarsGrid}>
              <div className={styles.pillar}>
                <span className={styles.pillarNumber}>01</span>
                <h2 className={styles.pillarTitle}>High-Refresh Displays</h2>
                <p className={styles.pillarText}>
                  240Hz and 360Hz low-latency panels tuned for competitive esports clarity and zero motion blur.
                </p>
              </div>

              <div className={styles.pillar}>
                <span className={styles.pillarNumber}>02</span>
                <h2 className={styles.pillarTitle}>Gigabit Fiber Network</h2>
                <p className={styles.pillarText}>
                  Dedicated symmetric gigabit lines with low ping routing to premier tournament servers.
                </p>
              </div>

              <div className={styles.pillar}>
                <span className={styles.pillarNumber}>03</span>
                <h2 className={styles.pillarTitle}>Ergonomic Stations</h2>
                <p className={styles.pillarText}>
                  Pro-grade ergonomic gaming chairs, modular desks, and premium peripheral support at every station.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── VENUES & STATIONS ─── */}
        <section className={styles.contentSection}>
          <div className={styles.container}>
            {/* Minimal Filter Tabs */}
            <div className={styles.filterBar}>
              <button
                className={`${styles.filterTab} ${selectedLocation === null ? styles.activeTab : ''}`}
                onClick={() => setSelectedLocation(null)}
              >
                All Lounges
              </button>
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  className={`${styles.filterTab} ${selectedLocation === loc.id ? styles.activeTab : ''}`}
                  onClick={() => setSelectedLocation(loc.id)}
                >
                  {loc.title.replace('Udhyana ', '')}
                </button>
              ))}
            </div>

            {/* Selected Location Banner (When filtered) */}
            {selectedLocation && currentLocation && (
              <div className={styles.selectedBanner}>
                <div className={styles.selectedBannerHeader}>
                  <div>
                    <span className={styles.selectedBadge}>Active Venue</span>
                    <h2 className={styles.selectedTitle}>{currentLocation.title}</h2>
                    <p className={styles.selectedSpecs}>{currentLocation.specs}</p>
                  </div>
                  <button
                    className={styles.resetBtn}
                    onClick={() => setSelectedLocation(null)}
                  >
                    View All Venues
                  </button>
                </div>
                <p className={styles.selectedDesc}>{currentLocation.description}</p>
              </div>
            )}

            {/* All Lounges Overview (When no specific location selected) */}
            {selectedLocation === null && (
              <div className={styles.sectionBlock}>
                <div className={styles.blockHeader}>
                  <h2 className={styles.blockTitle}>Our Venues</h2>
                  <span className={styles.blockSubtitle}>Select a venue to view dedicated stations</span>
                </div>
                <div className={styles.venuesGrid}>
                  {locations.map((loc) => (
                    <LocationCard
                      key={loc.id}
                      id={loc.id}
                      title={loc.title}
                      specs={loc.specs}
                      description={loc.description}
                      image={loc.image}
                      status={loc.status}
                      statusColor={loc.statusColor}
                      features={loc.features}
                      onClick={() => setSelectedLocation(loc.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stations Grid */}
            <div className={styles.sectionBlock}>
              <div className={styles.blockHeader}>
                <h2 className={styles.blockTitle}>
                  {selectedLocation && currentLocation
                    ? `Available Stations at ${currentLocation.title.replace('Udhyana ', '')}`
                    : 'All Available Stations'}
                </h2>
                <span className={styles.blockSubtitle}>
                  {loading
                    ? 'Loading stations...'
                    : `${dbConsoles.length} battle stations ready for booking`}
                </span>
              </div>

              <div className={styles.consolesGrid}>
                {dbConsoles.map((c) => (
                  <ConsoleCard
                    key={c.id}
                    id={c.id}
                    title={c.hardwareTitle}
                    specs={c.specs || `PKR ${c.hourlyRate || baseRate}/hr · High Refresh`}
                    description={`Equipped station available at ${
                      currentLocation ? currentLocation.title : 'Udhyana Lounges'
                    }. Play top competitive titles with low latency.`}
                    image={getStationImage(c.hardwareTitle, c.imagePath || undefined)}
                    status="Available"
                    statusColor="#d6ff01"
                    games={
                      c.games && c.games.length > 0
                        ? c.games.map((g: { game: { name: string } }) => g.game.name)
                        : ['Tekken 8', 'FC 24', 'Call of Duty', 'Valorant']
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
