'use client';

import { products } from '@/data/products';
import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';

export default function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = products.find(p => p.id === id);
  const { addItem } = useCart();

  if (!product) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.notFound}>
            <h2>Product Not Found</h2>
            <Link href="/shop" className={styles.backLink}>Return to Shop</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.title,
      price: parseFloat(product.price.replace('$', '')),
      image: product.image,
    });
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.backContainer}>
          <Link href="/shop" className={styles.backLink}>
            ← Back to Shop
          </Link>
        </div>
        
        <div className={styles.productContainer}>
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              <Image src={product.image} alt={product.title} fill className={styles.image} />
            </div>
            <div className={styles.glowBg}></div>
          </div>
          
          <div className={styles.infoSection}>
            <div className={styles.categoryBadge}>{product.category}</div>
            <h1 className={styles.title}>{product.title}</h1>
            <p className={styles.price}>{product.price}</p>
            
            <div className={styles.divider}></div>
            
            <h3 className={styles.descriptionTitle}>Overview</h3>
            <p className={styles.description}>{product.description}</p>
            
            <div className={styles.features}>
              <div className={styles.featureItem}>✓ Premium Quality</div>
              <div className={styles.featureItem}>✓ Free Shipping</div>
              <div className={styles.featureItem}>✓ 1 Year Warranty</div>
            </div>

            <button className={styles.addBtn} onClick={handleAddToCart}>Add to Cart</button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

