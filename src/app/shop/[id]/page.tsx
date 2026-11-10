'use client';

import Link from 'next/link';
import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CyberButton from '@/components/ui/CyberButton';
import IconPlaceholder from '@/components/ui/IconPlaceholder';
import { getGamingIconType } from '@/components/ui/GamingIcon';
import { useCart } from '@/context/CartContext';
import { getProductById, getProducts, redeemStoreProductWithPoints, getUserLoyaltyHistory } from '@/backend/actions';
import { getShopProductById, ProductItem } from '@/data/shopCatalog';
import AuthModal from '@/components/features/AuthModal';
import DigitalMemberPassModal from '@/components/profile/DigitalMemberPassModal';
import styles from './page.module.css';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Loyalty states
  const [userPoints, setUserPoints] = useState<number>(() => session?.user?.loyaltyPoints || 0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<{
    orderId: string;
    pointsDeducted: number;
    newBalance: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      try {
        const [dbData, allProducts] = await Promise.all([
          getProductById(id).catch(() => null),
          getProducts().catch(() => [])
        ]);

        if (!isMounted) return;

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
        if (isMounted) setProduct(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const userId = session?.user?.id;
  const sessionPoints = session?.user?.loyaltyPoints || 0;

  useEffect(() => {
    let isMounted = true;
    if (userId) {
      getUserLoyaltyHistory(userId)
        .then((res) => {
          if (isMounted && res?.user) {
            setUserPoints(res.user.loyaltyPoints || 0);
          }
        })
        .catch(() => {
          if (isMounted) {
            setUserPoints(sessionPoints);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [userId, sessionPoints]);

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

  const handleRedeemReward = async () => {
    if (!product || !session?.user?.id) return;
    setIsRedeeming(true);
    setRedeemError(null);

    try {
      const res = await redeemStoreProductWithPoints(session.user.id, product.id);
      if (res.success) {
        setUserPoints(res.newBalance);
        setRedeemSuccess({
          orderId: res.orderId,
          pointsDeducted: res.pointsDeducted,
          newBalance: res.newBalance,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to redeem reward item.';
      setRedeemError(msg);
    } finally {
      setIsRedeeming(false);
    }
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
  const rewardPointsCost = product.pointsCost && product.pointsCost > 0
    ? product.pointsCost
    : Math.round(product.price);
  const hasEnoughPoints = userPoints >= rewardPointsCost;
  const progressPercent = Math.min(100, Math.round((userPoints / rewardPointsCost) * 100));

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
              {product.pointsEligible ? (
                <span className={styles.tagBadge} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  ⚡ Reward Store
                </span>
              ) : product.tag ? (
                <span className={styles.tagBadge}>{product.tag}</span>
              ) : null}
              <div className={styles.imageCanvas}>
                <IconPlaceholder
                  icon={getGamingIconType(`${product.name} ${product.category}`)}
                  title={product.name}
                  size={120}
                  isHero
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

              {/* Price & Reward Accrual */}
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

              {/* ─── POINTS REWARD STORE REDEMPTION BLOCK ─── */}
              {product.pointsEligible && (
                <div className={styles.rewardRedeemBox}>
                  <div className={styles.rewardHeader}>
                    <span className={styles.rewardKicker}>
                      ⚡ Official Reward Store Item
                    </span>
                    <span className={styles.rewardCostPill}>
                      {rewardPointsCost} XP (100% Free)
                    </span>
                  </div>

                  {redeemSuccess ? (
                    <div className={styles.rewardSuccessBanner}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        🎉 Reward Claimed Successfully!
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#fff' }}>
                        Order <strong>#{redeemSuccess.orderId.slice(-8).toUpperCase()}</strong> has been generated for reception desk collection.
                        XP Deducted: <strong>-{redeemSuccess.pointsDeducted} XP</strong> · Remaining: <strong>{redeemSuccess.newBalance} XP</strong>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', margin: '0.25rem 0 0.5rem 0' }}>
                        Present your Digital Member Pass QR code at the Udhyana lounge reception desk to verify and collect your gear.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsPassModalOpen(true)}
                        style={{
                          background: 'var(--accent)',
                          color: '#000',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          alignSelf: 'flex-start'
                        }}
                      >
                        View Member Pass QR ⚡
                      </button>
                    </div>
                  ) : (
                    <>
                      {session?.user ? (
                        <>
                          <div className={styles.rewardUserStatus}>
                            <span>Your XP Balance: <strong style={{ color: 'var(--accent)' }}>{userPoints} XP</strong></span>
                            <span>{hasEnoughPoints ? '✓ Ready to Claim' : `Need ${rewardPointsCost - userPoints} more XP`}</span>
                          </div>

                          {!hasEnoughPoints && (
                            <div className={styles.rewardProgressBar} title={`${progressPercent}% towards reward`}>
                              <div
                                className={styles.rewardProgressFill}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          )}

                          {redeemError && (
                            <div style={{ background: 'rgba(255, 77, 77, 0.15)', border: '1px solid #ff4d4d', color: '#ff6b6b', padding: '0.6rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                              {redeemError}
                            </div>
                          )}

                          <button
                            type="button"
                            disabled={!hasEnoughPoints || isRedeeming}
                            onClick={handleRedeemReward}
                            className={styles.rewardActionBtn}
                          >
                            {isRedeeming ? (
                              'Claiming Reward...'
                            ) : hasEnoughPoints ? (
                              <>⚡ Claim Free with {rewardPointsCost} XP</>
                            ) : (
                              <>Need {rewardPointsCost - userPoints} More XP to Claim</>
                            )}
                          </button>
                        </>
                      ) : (
                        <div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                            Udhyana VIP Members can claim this gear 100% free with <strong>{rewardPointsCost} XP</strong>.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsAuthModalOpen(true)}
                            className={styles.rewardActionBtn}
                          >
                            ⚡ Log in to Claim Free with {rewardPointsCost} XP
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

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
                      <IconPlaceholder
                        icon={getGamingIconType(`${rel.name} ${rel.category}`)}
                        title={rel.name}
                        size={48}
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

      {/* ─── DIGITAL MEMBER PASS MODAL ─── */}
      <DigitalMemberPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
      />

      {/* ─── AUTH MODAL ─── */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <Footer />
    </>
  );
}
