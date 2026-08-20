'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import styles from './page.module.css';

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    async function loadProducts() {
      try {
        const { getProducts } = await import('@/backend/actions');
        const data = await getProducts();
        setProducts(data);
      } catch (e) {
        console.error("Failed to load products", e);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = filter === 'All' ? products : products.filter(p => p.category === filter);

  return (
    <>
      <Header />
      <main>

        {/* ─── HERO ─── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroContent}>
            <span className={styles.kicker}>The Armory</span>
            <h1 className={styles.headline}>
              Gear Up.<br />
              <span className={styles.headlineAccent}>Perform.</span>
            </h1>
            <p className={styles.sub}>
              Exclusive peripherals, merch, and fuel to power your sessions.{' '}
              <span className={styles.subAccent}>Purchase at the reception desk.</span>
            </p>
          </div>
        </section>

        {/* ─── FILTER BAR ─── */}
        <div className={styles.filterBar}>
          <div className={styles.filterBarInner}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`${styles.filterBtn} ${filter === cat ? styles.filterBtnActive : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ─── PRODUCT GRID ─── */}
        <section className={styles.gridSection}>
          <div className={styles.gridInner}>
            {loading ? (
              <div className={styles.emptyState}>Loading Inventory...</div>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.emptyState}>No products found in this category.</div>
            ) : (
              <div className={styles.productGrid}>
                {filteredProducts.map(product => (
                  <div key={product.id} className={styles.productCard}>

                    {/* Image */}
                    <div className={styles.imageWrapper}>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className={styles.productImage}
                        />
                      ) : (
                        <div className={styles.imagePlaceholder}>NO IMAGE</div>
                      )}
                      <span className={styles.priceBadge}>PKR {product.price}</span>
                    </div>

                    {/* Info */}
                    <div className={styles.productInfo}>
                      <span className={styles.productCategory}>{product.category}</span>
                      <h3 className={styles.productName}>{product.name}</h3>
                      <p className={styles.productDesc}>
                        {product.description || 'Premium gear engineered for maximum performance.'}
                      </p>
                      <button
                        className={styles.addBtn}
                        onClick={() => addItem({ id: product.id, name: product.name, price: product.price, image: product.imageUrl || '' })}
                      >
                        Add to Cart
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
