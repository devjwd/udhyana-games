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
  const [dbConsoles, setDbConsoles] = useState<any[]>([]);
  const [baseRate, setBaseRate] = useState(1000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [consoles, rate] = await Promise.all([
          getConsoles(),
          getBaseHourlyRate()
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
      description: "Our premier gaming lounge in Matta featuring high-end PS5 Pro stations, custom RTX 4090 esports rigs, luxury gaming chairs, and snack bar.",
      image: "/images/hero_side.jpg",
      status: "Open Now",
      statusColor: "#d6ff01",
      features: ["PS5 Pro Stations", "RTX 4090 Esports PCs", "Xbox Series X", "Snack Bar & Energy Drinks"],
    },
    {
      id: "udhyana-downtown",
      title: "Udhyana Esports Arena - Downtown",
      specs: "Tournament Center · VIP Booths",
      description: "Specialized competitive gaming facility equipped with private team practice booths, streaming setups, and live spectator lounge.",
      image: "/images/hero_main.jpg",
      status: "Open Now",
      statusColor: "#d6ff01",
      features: ["360Hz Monitors", "Team Booths", "Live Streaming Setup", "Console Stations"],
    }
  ];

  const currentLocation = locations.find(l => l.id === selectedLocation);

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
      <main>

        {/* ─── HERO ─── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroInner}>
            <span className={styles.kicker}>The Armory</span>
            <h1 className={styles.headline}>
              {selectedLocation && currentLocation ? currentLocation.title : "Available Lounges"}
            </h1>
            <p className={styles.subheadline}>
              {selectedLocation && currentLocation
                ? "Choose your weapon. We offer the highest-end gaming hardware configured for optimal performance and comfort."
                : "Select a location to view available consoles and gaming stations."}
            </p>
          </div>
        </section>

        {/* ─── BODY ─── */}
        <div className={styles.body}>

          {selectedLocation && (
            <button className={styles.backBtn} onClick={() => setSelectedLocation(null)}>
              ← Back to Locations
            </button>
          )}

          <div className={styles.grid}>
            {!selectedLocation ? (
              locations.map((loc) => (
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
              ))
            ) : (
              dbConsoles.map((c) => (
                <ConsoleCard
                  key={c.id}
                  id={c.id}
                  title={c.hardwareTitle}
                  specs={c.specs || `PKR ${c.hourlyRate || baseRate}/hr · High Refresh Display`}
                  description={`Equipped station available at ${currentLocation?.title}. Play top competitive titles with low latency.`}
                  image={getStationImage(c.hardwareTitle, c.imagePath)}
                  status="Available Now"
                  statusColor="#d6ff01"
                  games={c.games && c.games.length > 0 ? c.games.map((g: any) => g.game.name) : ["Tekken 8", "FC 24", "Call of Duty", "Valorant"]}
                />
              ))
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
