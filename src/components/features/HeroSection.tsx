'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './HeroSection.module.css';
import CyberArrowButton from '@/components/ui/CyberArrowButton';
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
              <CyberArrowButton
                direction="left"
                size={40}
                onClick={prevPoster}
                aria-label="Previous Poster"
              />
              <CyberArrowButton
                direction="right"
                size={40}
                onClick={nextPoster}
                aria-label="Next Poster"
              />
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
                <CyberArrowButton
                  direction="left"
                  size={36}
                  onClick={prevFeature}
                  aria-label="Previous Feature"
                />
                <CyberArrowButton
                  direction="right"
                  size={36}
                  onClick={nextFeature}
                  aria-label="Next Feature"
                />
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
