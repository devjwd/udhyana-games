'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import CyberButton from '@/components/ui/CyberButton';
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
    <div className={styles.shopSection}>
      <div className={styles.container}>
        {/* ─── FILTER TABS ─── */}
        <div className={styles.filterBar}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`${styles.filterTab} ${filter === cat ? styles.activeTab : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ─── GRID HEADER ─── */}
        <div className={styles.gridHeader}>
          <h2 className={styles.gridTitle}>
            {filter === 'All' ? 'All Products' : filter}
          </h2>
          <span className={styles.gridCount}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* ─── PRODUCT GRID ─── */}
        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>No products found in this category.</div>
        ) : (
          <div className={styles.productGrid}>
            {filteredProducts.map((product) => (
              <div key={product.id} className={styles.productCard}>
                {/* Image & Price */}
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
                  <span className={styles.priceBadge}>
                    PKR {product.price.toLocaleString()}
                  </span>
                </div>

                {/* Info */}
                <div className={styles.productInfo}>
                  <span className={styles.productCategory}>{product.category}</span>
                  <Link href={`/shop/${product.id}`} className={styles.productTitleLink}>
                    <h3 className={styles.productName}>{product.name}</h3>
                  </Link>
                  <p className={styles.productDesc}>
                    {product.description || 'Official gear engineered for maximum performance.'}
                  </p>
                  <div style={{ marginTop: 'auto', width: '100%' }}>
                    <CyberButton
                      fullWidth
                      onClick={() =>
                        addItem({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.imageUrl || '',
                        })
                      }
                    >
                      Add to Cart →
                    </CyberButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

