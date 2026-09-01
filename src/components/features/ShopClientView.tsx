'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ProductItem } from '@/data/shopCatalog';
import styles from '@/app/shop/page.module.css';

interface ShopClientViewProps {
  initialProducts: ProductItem[];
}

export default function ShopClientView({ initialProducts }: ShopClientViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const { addItem } = useCart();

  // Extract unique categories and calculate counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { All: initialProducts.length };
    initialProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    const uniqueCats = ['All', ...Array.from(new Set(initialProducts.map((p) => p.category)))];
    return uniqueCats.map((cat) => ({
      name: cat,
      count: counts[cat] || 0,
    }));
  }, [initialProducts]);

  // Filter & Sort products
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Category filter
    if (activeCategory !== 'All') {
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

  return (
    <div className={styles.shopSection}>
      <div className={styles.container}>
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
              We couldn't find any products matching "{searchQuery}". Try searching for another keyword or reset the category filters.
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

              // Extract top 2 spec chips
              const specValues = product.specs
                ? Object.values(product.specs).slice(0, 2)
                : [];

              return (
                <div key={product.id} className={styles.productCard}>
                  {/* Image Showcase */}
                  <div className={styles.imageContainer}>
                    <div className={styles.ambientGlow} />
                    
                    {product.tag && (
                      <span className={styles.tagBadge}>{product.tag}</span>
                    )}

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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
