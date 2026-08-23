'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import styles from '@/app/shop/page.module.css';

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  description?: string | null;
}

interface ShopClientViewProps {
  initialProducts: ProductItem[];
}

export default function ShopClientView({ initialProducts }: ShopClientViewProps) {
  const [filter, setFilter] = useState('All');
  const { addItem } = useCart();

  const categories = ['All', ...Array.from(new Set(initialProducts.map((p) => p.category)))];
  const filteredProducts =
    filter === 'All' ? initialProducts : initialProducts.filter((p) => p.category === filter);

  return (
    <>
      {/* ─── FILTER BAR ─── */}
      <div className={styles.filterBar}>
        <div className={styles.filterBarInner}>
          {categories.map((cat) => (
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
          {filteredProducts.length === 0 ? (
            <div className={styles.emptyState}>No products found in this category.</div>
          ) : (
            <div className={styles.productGrid}>
              {filteredProducts.map((product) => (
                <div key={product.id} className={styles.productCard}>
                  {/* Image */}
                  <div className={styles.imageWrapper}>
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                      onClick={() =>
                        addItem({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.imageUrl || '',
                        })
                      }
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
    </>
  );
}
