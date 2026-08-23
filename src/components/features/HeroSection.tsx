'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './HeroSection.module.css';
import {
  getHeroTrending,
  getHeroGallery,
  type HeroTrendingSlide,
  type HeroGalleryImage,
} from '@/backend/actions';

const DEFAULT_POSTERS: HeroTrendingSlide[] = [
  {
    id: '1',
    badge: 'NOW OPEN',
    title: 'UDHYANA GAMES',
    subtitle: 'LOUNGE',
    description: '',
    ctaText: 'SHOP NOW',
    ctaLink: '/shop',
    imageUrl: '/images/hero_main.jpg',
  },
  {
    id: '2',
    badge: 'NEW ARRIVAL',
    title: 'PS5 PRO',
    subtitle: 'STATION',
    description: '',
    ctaText: 'BOOK NOW',
    ctaLink: '/book',
    imageUrl: '/images/hero_slide2.jpg',
  },
  {
    id: '3',
    badge: 'MERCH DROP',
    title: 'OFFICIAL APPAREL',
    subtitle: 'COLLECTION',
    description: '',
    ctaText: 'EXPLORE DROP',
    ctaLink: '/shop',
    imageUrl: '/images/hero_slide3.jpg',
  },
];

const DEFAULT_GALLERY: HeroGalleryImage[] = [
  { id: '1', imageUrl: '/images/champs.jpg', label: 'DREAMHACK ATLANTA CHAMPS' },
  { id: '2', imageUrl: '/images/hero_side.jpg', label: 'VIP LOUNGE' },
  { id: '3', imageUrl: '/images/lounge_interior.png', label: 'MAIN ARENA' },
  { id: '4', imageUrl: '/images/strip1_single.jpg', label: 'PRO STATIONS' },
];

interface HeroSectionProps {
  initialTrending?: HeroTrendingSlide[];
  initialGallery?: HeroGalleryImage[];
}

export default function HeroSection({ initialTrending, initialGallery }: HeroSectionProps) {
  const [posters, setPosters] = useState<HeroTrendingSlide[]>(
    initialTrending && initialTrending.length > 0 ? initialTrending : DEFAULT_POSTERS
  );
  const [activePosterIndex, setActivePosterIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<HeroGalleryImage[]>(
    initialGallery && initialGallery.length > 0 ? initialGallery : DEFAULT_GALLERY
  );
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  useEffect(() => {
    if (initialTrending && initialGallery) return;
    async function load() {
      const [trending, gallery] = await Promise.all([
        getHeroTrending(),
        getHeroGallery(),
      ]);
      if (trending && trending.length > 0) setPosters(trending);
      if (gallery && gallery.length > 0) {
        setGalleryImages(gallery);
      }
    }
    load();
  }, [initialTrending, initialGallery]);

  // Left Poster Navigation
  const totalPosters = Math.max(1, posters.length);
  const prevPoster = useCallback(() => {
    setActivePosterIndex((prev) => (prev === 0 ? totalPosters - 1 : prev - 1));
  }, [totalPosters]);

  const nextPoster = useCallback(() => {
    setActivePosterIndex((prev) => (prev + 1) % totalPosters);
  }, [totalPosters]);

  // Right Feature Card Navigation
  const totalFeatures = Math.max(1, galleryImages.length);
  const prevFeature = useCallback(() => {
    setActiveFeatureIndex((prev) => (prev === 0 ? totalFeatures - 1 : prev - 1));
  }, [totalFeatures]);

  const nextFeature = useCallback(() => {
    setActiveFeatureIndex((prev) => (prev + 1) % totalFeatures);
  }, [totalFeatures]);

  // Auto-advance
  useEffect(() => {
    if (totalPosters <= 1) return;
    const timer = setInterval(() => {
      setActivePosterIndex((prev) => (prev + 1) % totalPosters);
    }, 7000);
    return () => clearInterval(timer);
  }, [totalPosters]);

  useEffect(() => {
    if (totalFeatures <= 1) return;
    const timer = setInterval(() => {
      setActiveFeatureIndex((prev) => (prev + 1) % totalFeatures);
    }, 6000);
    return () => clearInterval(timer);
  }, [totalFeatures]);

  const currentPoster = posters[activePosterIndex] || posters[0];
  const currentFeature = galleryImages[activeFeatureIndex] || {
    id: 'champs',
    imageUrl: '/images/champs.jpg',
    label: 'DREAMHACK ATLANTA CHAMPS',
  };

  return (
    <section className={styles.hero} id="hero-section">
      <div className={styles.heroContainer}>
        {/* ── LEFT: Full-Bleed Poster with Action Buttons (~63% width) ── */}
        <div className={styles.posterWrapper}>
          <div className={styles.posterCard}>
            <Image
              src={currentPoster.imageUrl}
              alt={currentPoster.title || 'Udhyana Games Lounge'}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 63vw"
              className={styles.heroBgImage}
              quality={85}
            />

            {/* Top-Left Navigation Arrows */}
            <div className={styles.posterNavButtons}>
              <button
                className={styles.navBtn}
                onClick={prevPoster}
                aria-label="Previous Poster"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <button
                className={styles.navBtn}
                onClick={nextPoster}
                aria-label="Next Poster"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>

            {/* Bottom Action Button */}
            {currentPoster.ctaText && (
              <div className={styles.posterBottomBar}>
                <Link href={currentPoster.ctaLink || '/shop'} className={styles.actionBtn}>
                  {currentPoster.ctaText}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Full-Bleed Featured Card with Navigation Controls (~37% width) ── */}
        <div className={styles.featureCardWrapper}>
          <div className={styles.featureCard}>
            <Image
              src={currentFeature.imageUrl}
              alt={currentFeature.label || 'Udhyana Games Feature'}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 37vw"
              className={styles.heroBgImage}
              quality={85}
            />
            {/* Corner Emblem */}
            <div className={styles.cardEmblem}>
              <div className={styles.emblemShield}>
                <span>U</span>
                <small>80</small>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className={styles.featureBottomBar}>
              {/* Navigation Arrows */}
              <div className={styles.featureNavArrows}>
                <button
                  className={styles.featureArrowBtn}
                  onClick={prevFeature}
                  aria-label="Previous Feature"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                <button
                  className={styles.featureArrowBtn}
                  onClick={nextFeature}
                  aria-label="Next Feature"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>

              {/* Pagination indicators */}
              <div className={styles.progressSegments}>
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.segmentBar} ${i === activeFeatureIndex ? styles.segmentActive : ''}`}
                    onClick={() => setActiveFeatureIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
