'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/context/CartContext';
import { getProductById } from '@/backend/actions';
import { use } from 'react';
import styles from './page.module.css';

interface ProductData {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  description: string | null;
}

export default function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProductById(id);
        setProduct(data as ProductData | null);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className={styles.notFound}>
            <h2>Loading...</h2>
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
      name: product.name,
      price: product.price,
      image: product.imageUrl,
    });
  };

  const formattedPrice = `PKR ${product.price.toLocaleString()}`;

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
              <Image src={product.imageUrl} alt={product.name} fill className={styles.image} />
            </div>
            <div className={styles.glowBg}></div>
          </div>
          
          <div className={styles.infoSection}>
            <div className={styles.categoryBadge}>{product.category}</div>
            <h1 className={styles.title}>{product.name}</h1>
            <p className={styles.price}>{formattedPrice}</p>
            
            <div className={styles.divider}></div>
            
            <h3 className={styles.descriptionTitle}>Overview</h3>
            <p className={styles.description}>{product.description || 'No description available.'}</p>
            
            <div className={styles.features}>
              <div className={styles.featureItem}>✓ Premium Quality</div>
              <div className={styles.featureItem}>✓ Available at Reception</div>
              <div className={styles.featureItem}>✓ Loyalty Points Earned</div>
            </div>

            <button className={styles.addBtn} onClick={handleAddToCart}>Add to Cart</button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
