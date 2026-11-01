'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { ProductItem } from '@/data/shopCatalog';
import { redeemStoreProductWithPoints, getUserLoyaltyHistory } from '@/backend/actions';
import AuthModal from '@/components/features/AuthModal';
import DigitalMemberPassModal from '@/components/profile/DigitalMemberPassModal';
import styles from '@/app/shop/page.module.css';

interface ShopClientViewProps {
  initialProducts: ProductItem[];
}

export default function ShopClientView({ initialProducts }: ShopClientViewProps) {
  const { data: session } = useSession();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const { addItem } = useCart();

  // Loyalty user state
  const [userPoints, setUserPoints] = useState<number>(() => session?.user?.loyaltyPoints || 0);
  const [userRank, setUserRank] = useState<string>(() => session?.user?.rank || 'Rookie');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Redemption modal state
  const [selectedProductForRedeem, setSelectedProductForRedeem] = useState<ProductItem | null>(null);
  const [redeemSubmitting, setRedeemSubmitting] = useState(false);
  const [redeemSuccessResult, setRedeemSuccessResult] = useState<{
    orderId: string;
    productName: string;
    pointsDeducted: number;
    newBalance: number;
  } | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const userId = session?.user?.id;
  const sessionPoints = session?.user?.loyaltyPoints || 0;
  const sessionRank = session?.user?.rank || 'Rookie';

  // Sync latest user loyalty points from DB
  useEffect(() => {
    let isMounted = true;
    if (userId) {
      getUserLoyaltyHistory(userId)
        .then((res) => {
          if (isMounted && res?.user) {
            setUserPoints(res.user.loyaltyPoints || 0);
            setUserRank(res.user.rank || 'Rookie');
          }
        })
        .catch(() => {
          if (isMounted) {
            setUserPoints(sessionPoints);
            setUserRank(sessionRank);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [userId, sessionPoints, sessionRank]);

  // Points eligible rewards count
  const pointsRewardCount = useMemo(() => {
    return initialProducts.filter((p) => p.pointsEligible).length;
  }, [initialProducts]);

  // Extract unique categories and calculate counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { All: initialProducts.length };
    initialProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    const uniqueCats = ['All'];
    if (pointsRewardCount > 0) {
      uniqueCats.push('⚡ XP Rewards');
    }
    const otherCats = Array.from(new Set(initialProducts.map((p) => p.category)));
    uniqueCats.push(...otherCats);

    return uniqueCats.map((cat) => ({
      name: cat,
      count: cat === '⚡ XP Rewards' ? pointsRewardCount : (counts[cat] || 0),
    }));
  }, [initialProducts, pointsRewardCount]);

  // Filter & Sort products
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Category filter
    if (activeCategory === '⚡ XP Rewards') {
      result = result.filter((p) => p.pointsEligible);
    } else if (activeCategory !== 'All') {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const inName = p.name.toLowerCase().includes(q);
        const inCat = p.category.toLowerCase().includes(q);
        const inDesc = p.description ? p.description.toLowerCase().includes(q) : false;
        const inTag = p.tag ? p.tag.toLowerCase().includes(q) : false;
        const inSpecs = p.specs ? Object.values(p.specs).some((v) => v.toLowerCase().includes(q)) : false;
        return inName || inCat || inDesc || inTag || inSpecs;
      });
    }

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [initialProducts, activeCategory, searchQuery, sortBy]);

  const handleAddToCart = (product: ProductItem) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.imageUrl || '/images/products/headphones.png',
    });

    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 1600);
  };

  const clearFilters = () => {
    setActiveCategory('All');
    setSearchQuery('');
    setSortBy('featured');
  };

  const handleConfirmRedeem = async () => {
    if (!session?.user?.id || !selectedProductForRedeem) return;

    setRedeemSubmitting(true);
    setRedeemError(null);

    try {
      const res = await redeemStoreProductWithPoints(session.user.id, selectedProductForRedeem.id);
      if (res.success) {
        setUserPoints(res.newBalance);
        setRedeemSuccessResult(res);
      } else {
        setRedeemError('Redemption failed. Please try again or ask reception staff.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to redeem reward item.';
      setRedeemError(msg);
    } finally {
      setRedeemSubmitting(false);
    }
  };

  return (
    <div className={styles.shopSection}>
      <div className={styles.container}>
        {/* ─── VIP LOYALTY XP BANNER ─── */}
        <div className={styles.userPointsBar}>
          <div className={styles.userPointsInfo}>
            <span className={styles.userPointsIcon}>⚡</span>
            <div className={styles.userPointsText}>
              {session?.user ? (
                <>
                  <strong>{userRank} VIP Member: {userPoints.toLocaleString()} XP Spendable Balance</strong>
                  <p>1 XP = PKR 1 · Spend your XP on free console gaming sessions or exclusive Reward Store gear below.</p>
                </>
              ) : (
                <>
                  <strong>Join the Udhyana VIP Loyalty Program (+50 XP Bonus)</strong>
                  <p>Earn XP on every gaming session and redeem points for free game time or exclusive pro-shop rewards.</p>
                </>
              )}
            </div>
          </div>

          <div>
            {session?.user ? (
              <button
                type="button"
                onClick={() => setIsPassModalOpen(true)}
                className={styles.viewPassBtn}
              >
                Digital Pass & History ⚡
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className={styles.viewPassBtn}
              >
                Sign In / Join +50 XP
              </button>
            )}
          </div>
        </div>

        {/* ─── TOOLBAR CONTROLS ─── */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarTop}>
            {/* Live Search */}
            <div className={styles.searchWrap}>
              <svg
                className={styles.searchIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gear, jerseys, switches, headsets..."
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className={styles.sortWrap}>
              <span className={styles.sortLabel}>Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="featured">Featured Picks</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className={styles.categoryPills}>
            {categoriesWithCounts.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`${styles.filterPill} ${
                  activeCategory === cat.name ? styles.activePill : ''
                }`}
              >
                <span>{cat.name}</span>
                <span className={styles.countChip}>{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── GRID HEADER ─── */}
        <div className={styles.gridHeader}>
          <div className={styles.gridTitle}>
            <span>
              {activeCategory === 'All' ? 'Catalog Inventory' : activeCategory}
            </span>
            {(searchQuery || activeCategory !== 'All') && (
              <button onClick={clearFilters} className={styles.resetBtn}>
                Reset Filters ✕
              </button>
            )}
          </div>
          <span className={styles.gridCount}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'ITEM' : 'ITEMS'} AVAILABLE
          </span>
        </div>

        {/* ─── PRODUCT GRID ─── */}
        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3 className={styles.emptyTitle}>No matching gear found</h3>
            <p className={styles.emptySubtitle}>
              We couldn&apos;t find any products matching &quot;{searchQuery}&quot;. Try searching for another keyword or reset the category filters.
            </p>
            <button onClick={clearFilters} className={styles.resetBtn} style={{ padding: '0.6rem 1.2rem', marginTop: '0.5rem' }}>
              View All Equipment
            </button>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {filteredProducts.map((product) => {
              const isAdded = !!addedItems[product.id];
              const xpPoints = product.points || Math.max(10, Math.floor(product.price / 10));
              const rewardPointsCost = product.pointsCost && product.pointsCost > 0
                ? product.pointsCost
                : Math.round(product.price);

              // Extract top 2 spec chips
              const specValues = product.specs
                ? Object.values(product.specs).slice(0, 2)
                : [];

              return (
                <div key={product.id} className={styles.productCard}>
                  {/* Image Showcase */}
                  <div className={styles.imageContainer}>
                    <div className={styles.ambientGlow} />

                    {product.pointsEligible ? (
                      <div className={styles.xpRewardBadge}>
                        <span>⚡</span>
                        <span>{rewardPointsCost} XP Reward</span>
                      </div>
                    ) : product.tag ? (
                      <span className={styles.tagBadge}>{product.tag}</span>
                    ) : null}

                    <span className={styles.stockBadge}>
                      <span className={styles.stockDot} />
                      {product.inStock !== false ? 'In Stock' : 'Pre-order'}
                    </span>

                    <Link href={`/shop/${product.id}`} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <Image
                        src={product.imageUrl || '/images/products/headphones.png'}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={styles.cardImage}
                        priority={false}
                      />
                    </Link>
                  </div>

                  {/* Card Body */}
                  <div className={styles.cardBody}>
                    <div className={styles.cardKickerRow}>
                      <span className={styles.categoryTag}>{product.category}</span>
                      {product.rating && (
                        <span className={styles.ratingTag}>
                          <span className={styles.ratingStar}>★</span>
                          {product.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <Link href={`/shop/${product.id}`} className={styles.productTitleLink}>
                      <h3 className={styles.productName}>{product.name}</h3>
                    </Link>

                    <p className={styles.productDesc}>
                      {product.description || 'Tournament-grade hardware built for competitive performance.'}
                    </p>

                    {specValues.length > 0 && (
                      <div className={styles.specChips}>
                        {specValues.map((val, idx) => (
                          <span key={idx} className={styles.specChip}>
                            {val}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Card Footer: Price & CTA */}
                    <div className={styles.cardFooter}>
                      <div className={styles.priceRow}>
                        <div className={styles.priceValue}>
                          <span className={styles.currency}>PKR</span>
                          {product.price.toLocaleString()}
                        </div>
                        <span className={styles.xpTag}>+{xpPoints} XP</span>
                      </div>

                      <div className={styles.btnGroup}>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className={`${styles.quickAddBtn} ${isAdded ? styles.addedState : ''}`}
                        >
                          {isAdded ? (
                            <>
                              <span>✓</span> Added to Cart
                            </>
                          ) : (
                            <>
                              <span>+</span> Add to Cart
                            </>
                          )}
                        </button>

                        <Link
                          href={`/shop/${product.id}`}
                          className={styles.inspectBtn}
                          title="View Technical Specs"
                          aria-label={`View specs for ${product.name}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>

                      {/* Points Store Quick Redeem Option */}
                      {product.pointsEligible && (
                        <div>
                          {!session?.user ? (
                            <button
                              type="button"
                              onClick={() => setIsAuthModalOpen(true)}
                              className={styles.rewardRedeemBtn}
                            >
                              ⚡ Log in to Claim ({rewardPointsCost} XP)
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={rewardPointsCost > userPoints}
                              onClick={() => {
                                setRedeemError(null);
                                setRedeemSuccessResult(null);
                                setSelectedProductForRedeem(product);
                              }}
                              className={styles.rewardRedeemBtn}
                            >
                              {rewardPointsCost <= userPoints ? (
                                <>⚡ Claim Free ({rewardPointsCost} XP)</>
                              ) : (
                                <>⚡ Need {rewardPointsCost - userPoints} more XP</>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── REDEEM REWARD CONFIRMATION MODAL ─── */}
      {selectedProductForRedeem && (
        <div className={styles.rewardModalOverlay} onClick={() => setSelectedProductForRedeem(null)}>
          <div className={styles.rewardModalBox} onClick={(e) => e.stopPropagation()}>
            {redeemSuccessResult ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
                  <h3 style={{ color: 'var(--accent)', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                    Reward Redeemed Successfully!
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                    Order <strong style={{ color: '#fff' }}>#{redeemSuccessResult.orderId.slice(-8).toUpperCase()}</strong> has been generated for reception collection.
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '6px', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Item Claimed:</span>
                    <strong style={{ color: '#fff' }}>{redeemSuccessResult.productName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>XP Deducted:</span>
                    <strong style={{ color: '#ff6b6b' }}>-{redeemSuccessResult.pointsDeducted} XP</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>New Spendable Balance:</span>
                    <strong style={{ color: 'var(--accent)' }}>{redeemSuccessResult.newBalance} XP</strong>
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.25rem' }}>
                  Show your Digital Member Pass QR code to the receptionist at Udhyana Games lounge to verify and collect your gear.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductForRedeem(null);
                      setRedeemSuccessResult(null);
                      setIsPassModalOpen(true);
                    }}
                    className={styles.viewPassBtn}
                    style={{ flex: 1, padding: '0.75rem', textAlign: 'center' }}
                  >
                    View Member Pass QR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductForRedeem(null);
                      setRedeemSuccessResult(null);
                    }}
                    className={styles.resetBtn}
                    style={{ flex: 1, padding: '0.75rem', textAlign: 'center' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--accent)' }}>⚡</span> Confirm Reward Redemption
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  You are about to redeem an item from the Loyalty Reward Store using your accumulated XP balance.
                </p>

                <div style={{ background: 'rgba(214, 255, 1, 0.05)', border: '1px solid rgba(214, 255, 1, 0.2)', padding: '1rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Equipment:</span>
                    <strong style={{ color: '#fff' }}>{selectedProductForRedeem.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Points Required:</span>
                    <strong style={{ color: 'var(--accent)' }}>
                      {selectedProductForRedeem.pointsCost || Math.round(selectedProductForRedeem.price)} XP
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Your Available Balance:</span>
                    <strong style={{ color: '#fff' }}>{userPoints} XP</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Balance After Redemption:</span>
                    <strong style={{ color: 'var(--accent)' }}>
                      {Math.max(0, userPoints - (selectedProductForRedeem.pointsCost || Math.round(selectedProductForRedeem.price)))} XP
                    </strong>
                  </div>
                </div>

                {redeemError && (
                  <div style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.4)', color: '#ff6b6b', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {redeemError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    disabled={redeemSubmitting}
                    onClick={() => setSelectedProductForRedeem(null)}
                    className={styles.resetBtn}
                    style={{ flex: 1, padding: '0.75rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={redeemSubmitting}
                    onClick={handleConfirmRedeem}
                    className={styles.viewPassBtn}
                    style={{ flex: 1.5, padding: '0.75rem', opacity: redeemSubmitting ? 0.7 : 1 }}
                  >
                    {redeemSubmitting ? 'Redeeming Reward...' : 'Confirm & Claim ⚡'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
}
