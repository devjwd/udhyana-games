'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  description: string;
  image: string;
  category?: string;
}

export default function ProductCard({ id, title, price, description, image, category }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id,
      name: title,
      price: parseFloat(price.replace('$', '')),
      image,
    });
  };

  return (
    <Link href={`/shop/${id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {category && <span className={styles.categoryBadge}>{category}</span>}
        <Image src={image} alt={title} fill className={styles.image} />
      </div>
      <div className={styles.info}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.price}>{price}</span>
        </div>
        <p className={styles.description}>{description}</p>
        <button className={styles.addBtn} onClick={handleAddToCart}>Add to Cart</button>
      </div>
    </Link>
  );
}

