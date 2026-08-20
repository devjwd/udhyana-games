"use client";

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ConsoleCard from '@/components/ui/ConsoleCard';
import LocationCard from '@/components/ui/LocationCard';
import styles from './page.module.css';

export default function Consoles() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const locations = [
    {
      id: "udhyana-matta",
      title: "Udhyana Games Matta",
      specs: "Premium Gaming Lounge",
      description: "Experience the ultimate gaming lounge atmosphere at Udhyana Games Matta. Featuring top-tier setups, comfortable seating, and a vibrant gaming community.",
      image: "/images/products/ps5.png",
      status: "Open Now",
      statusColor: "#c1ff1c",
      features: ["PS5", "Xbox Series X", "Custom PCs", "Snacks"],
      consoles: [
        {
          id: "ps5-matta",
          title: "PS5 Pro Setup",
          specs: "$10/hr · 120Hz 4K · DualSense Edge",
          description: "Experience the next generation of PlayStation with ultra-fast loading, ray tracing, and all the latest exclusive titles.",
          image: "/images/products/ps5.png",
          status: "Available Now",
          statusColor: "#c1ff1c",
          games: ["Tekken 8", "Spider-Man 2", "FC 24", "Call of Duty: MW3"]
        },
        {
          id: "xbox-matta",
          title: "Xbox Series X",
          specs: "$10/hr · Game Pass Ultimate · Elite Series 2",
          description: "Power your dreams with 12 Teraflops of processing power. Play thousands of titles across four generations.",
          image: "/images/products/xbox.png",
          status: "In Use (Avail. 4:00 PM)",
          statusColor: "#ffcc00",
          games: ["Halo Infinite", "Forza Horizon 5", "Starfield", "Mortal Kombat 1"]
        },
        {
          id: "pc-matta",
          title: "Custom Esports PC",
          specs: "$15/hr · RTX 4090 · 360Hz Monitor",
          description: "Dominate the competition on our top-tier custom rigs designed specifically for ultra-high framerate competitive play.",
          image: "/images/products/pc.png",
          status: "Available Now",
          statusColor: "#c1ff1c",
          games: ["Valorant", "CS2", "League of Legends", "Apex Legends"]
        }
      ]
    },
    {
      id: "udhyana-downtown",
      title: "Udhyana Games Downtown",
      specs: "Esports Arena",
      description: "Our downtown location specializes in competitive gaming with 240Hz monitors and regular weekly tournaments.",
      image: "/images/products/pc.png",
      status: "Open Now",
      statusColor: "#c1ff1c",
      features: ["Esports PCs", "Streaming Booths", "Tournaments"],
      consoles: [
        {
          id: "pc-downtown",
          title: "Pro Esports Rig",
          specs: "$15/hr · RTX 4090 · 360Hz Monitor",
          description: "Dominate the competition on our top-tier custom rigs designed specifically for ultra-high framerate competitive play.",
          image: "/images/products/pc.png",
          status: "Available Now",
          statusColor: "#c1ff1c",
          games: ["Valorant", "CS2", "League of Legends", "Apex Legends"]
        }
      ]
    }
  ];

  const currentLocation = locations.find(l => l.id === selectedLocation);

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
              currentLocation?.consoles.map((c) => (
                <ConsoleCard
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  specs={c.specs}
                  description={c.description}
                  image={c.image}
                  status={c.status}
                  statusColor={c.statusColor}
                  games={c.games}
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
