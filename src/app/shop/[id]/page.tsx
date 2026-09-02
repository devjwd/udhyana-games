'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, use } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CyberButton from '@/components/ui/CyberButton';
import { useCart } from '@/context/CartContext';
import { getProductById, getProducts } from '@/backend/actions';
import { getShopProductById, ProductItem } from '@/data/shopCatalog';
import styles from './page.module.css';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const [dbData, allProducts] = await Promise.all([
          getProductById(id).catch(() => null),
          getProducts().catch(() => [])
        ]);

        if (dbData) {
          const resolvedProduct = getShopProductById(id, dbData as unknown as ProductItem);
          setProduct(resolvedProduct);

          // Find other products from DB in same or other categories
          const others = (allProducts as unknown as ProductItem[])
            .filter((p) => p.id !== id)
            .slice(0, 3)
            .map((p) => getShopProductById(p.id, p)!);
          setRelatedProducts(others);
        } else {
          setProduct(null);
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.imageUrl || '/images/products/headphones.png',
      });
    }

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading product details...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.notFound}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
            <h2 className={styles.notFoundTitle}>Equipment Not Found</h2>
            <p className={styles.notFoundDesc}>
              The product you are looking for might have been retired or moved to another section.
            </p>
            <Link href="/shop" className={styles.backButtonPrimary}>
              ← Return to Pro Shop
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const calculatedPoints = (product.points || Math.max(10, Math.floor(product.price / 10))) * quantity;
  const totalPrice = product.price * quantity;

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* ─── BREADCRUMBS ─── */}
          <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
            <Link href="/shop" className={styles.breadcrumbLink}>
              Pro Shop
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCategory}>{product.category}</span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>{product.name}</span>
          </nav>

          {/* ─── PRODUCT HERO GRID ─── */}
          <div className={styles.productGrid}>
            {/* Left: Media Showcase */}
            <div className={styles.mediaContainer}>
              <div className={styles.ambientGlow} />
              {product.tag && <span className={styles.tagBadge}>{product.tag}</span>}
              <div className={styles.imageCanvas}>
                <Image
                  src={product.imageUrl || '/images/products/headphones.png'}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className={styles.mainImage}
                />
              </div>
            </div>

            {/* Right: Info & Purchase Controls */}
            <div className={styles.infoContainer}>
              <div className={styles.headerMeta}>
                <span className={styles.categoryBadge}>{product.category}</span>
                <span className={styles.stockBadge}>
                  <span className={styles.stockDot} />
                  {product.inStock !== false ? 'In Stock · Ready for Pickup' : 'Pre-order'}
                </span>
              </div>

              <h1 className={styles.title}>{product.name}</h1>

              {product.rating && (
                <div className={styles.ratingRow}>
                  <span className={styles.ratingStars}>★★★★★</span>
                  <span className={styles.ratingScore}>{product.rating.toFixed(1)}</span>
                  <span className={styles.reviewsCount}>
                    ({product.reviewsCount || 24} customer reviews)
                  </span>
                </div>
              )}

              {/* Price & Reward */}
              <div className={styles.priceContainer}>
                <div className={styles.priceWrap}>
                  <span className={styles.currency}>PKR</span>
                  <span className={styles.priceNumber}>{totalPrice.toLocaleString()}</span>
                  {quantity > 1 && (
                    <span className={styles.unitPrice}>
                      (PKR {product.price.toLocaleString()} each)
                    </span>
                  )}
                </div>
                <div className={styles.loyaltyBadge}>
                  ⭐ +{calculatedPoints} Loyalty XP Points
                </div>
              </div>

              <p className={styles.description}>
                {product.description ||
                  'High-performance gaming equipment configured for ultra-responsive gameplay.'}
              </p>

              {/* Quantity Selector & Add CTA */}
              <div className={styles.actionBlock}>
                <div className={styles.quantityControl}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className={styles.qtyBtn}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className={styles.qtyDisplay}>{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className={styles.qtyBtn}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className={styles.ctaWrapper}>
                  <CyberButton
                    onClick={handleAddToCart}
                    fullWidth
                  >
                    {isAdded ? '✓ Added to Cart!' : `Add to Cart — PKR ${totalPrice.toLocaleString()}`}
                  </CyberButton>
                </div>
              </div>

              {/* Trust Badges */}
              <div className={styles.trustPillars}>
                <div className={styles.pillarItem}>
                  <span className={styles.pillarIcon}>⚡</span>
                  <div>
                    <strong>Instant Venue Pickup</strong>
                    <p>Collect at Matta or Downtown lounge reception desk</p>
                  </div>
                </div>
                <div className={styles.pillarItem}>
                  <span className={styles.pillarIcon}>🛡️</span>
                  <div>
                    <strong>1-Year Local Warranty</strong>
                    <p>Direct manufacturer replacement & support</p>
                  </div>
                </div>
                <div className={styles.pillarItem}>
                  <span className={styles.pillarIcon}>🎮</span>
                  <div>
                    <strong>Esports Station Compatible</strong>
                    <p>Plug and play with PS5 Pro & RTX 4090 Rigs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── TECHNICAL SPECIFICATIONS TABLE ─── */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <section className={styles.specsSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>Hardware Data</span>
                <h2 className={styles.sectionTitle}>Technical Specifications</h2>
              </div>

              <div className={styles.specsGrid}>
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className={styles.specRow}>
                    <span className={styles.specLabel}>{key}</span>
                    <span className={styles.specValue}>{val}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── RELATED GEAR CAROUSEL ─── */}
          {relatedProducts.length > 0 && (
            <section className={styles.relatedSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionKicker}>Complete Your Loadout</span>
                <h2 className={styles.sectionTitle}>Frequently Paired Equipment</h2>
              </div>

              <div className={styles.relatedGrid}>
                {relatedProducts.map((rel) => (
                  <Link key={rel.id} href={`/shop/${rel.id}`} className={styles.relatedCard}>
                    <div className={styles.relatedImageWrap}>
                      <Image
                        src={rel.imageUrl || '/images/products/headphones.png'}
                        alt={rel.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className={styles.relatedImage}
                      />
                    </div>
                    <div className={styles.relatedInfo}>
                      <span className={styles.relatedCategory}>{rel.category}</span>
                      <h4 className={styles.relatedName}>{rel.name}</h4>
                      <span className={styles.relatedPrice}>
                        PKR {rel.price.toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
