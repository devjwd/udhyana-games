export interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  description?: string | null;
  tag?: string;
  badge?: string;
  specs?: Record<string, string>;
  inStock?: boolean;
  rating?: number;
  reviewsCount?: number;
  points?: number;
  pointsEligible?: boolean;
  pointsCost?: number | null;
}

/**
 * Format live database products for the storefront.
 * Returns only genuine database products managed in the Admin panel.
 */
export function getMergedShopProducts(dbProducts: Array<{
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  description?: string | null;
  pointsEligible?: boolean | null;
  pointsCost?: number | null;
}>): ProductItem[] {
  if (!dbProducts || dbProducts.length === 0) {
    return [];
  }

  // Normalize DB product categories to match title case
  return dbProducts.map((p) => {
    let cat = p.category || 'Peripherals & Hardware';
    const lower = cat.toLowerCase();
    if (lower.includes('apparel') || lower.includes('merch') || lower.includes('clothing')) {
      cat = 'Apparel & Merch';
    } else if (lower.includes('access') || lower.includes('periph') || lower.includes('gear') || lower.includes('hardware')) {
      cat = 'Peripherals & Hardware';
    } else if (lower.includes('snack') || lower.includes('drink') || lower.includes('fuel')) {
      cat = 'Snacks & Fuel';
    }

    return {
      id: p.id,
      name: p.name,
      price: p.price,
      category: cat,
      imageUrl: p.imageUrl || '/images/products/headphones.png',
      description: p.description || 'Official merchandise engineered for tournament-level gaming.',
      tag: p.pointsEligible ? 'REWARD STORE' : 'NEW ARRIVAL',
      badge: p.pointsEligible ? 'XP Redeemable' : 'In Stock',
      specs: {
        'Category': cat,
        'Condition': 'Brand New Factory Sealed',
        'Pickup': 'Reception Desk or Online Delivery',
        'Warranty': 'Official Udhyana Warranty Included'
      },
      inStock: true,
      rating: 5.0,
      reviewsCount: 1,
      points: Math.max(10, Math.floor(p.price / 10)),
      pointsEligible: Boolean(p.pointsEligible),
      pointsCost: p.pointsCost ? Number(p.pointsCost) : null,
    };
  });
}

export function getShopProductById(id: string, dbProduct?: ProductItem | null): ProductItem | null {
  if (!dbProduct) return null;

  return {
    ...dbProduct,
    specs: dbProduct.specs || {
      'Category': dbProduct.category,
      'Condition': 'Brand New Official Stock',
      'Pickup': 'Reception Counter Collection',
      'Warranty': '1-Year Official Warranty'
    },
    rating: dbProduct.rating || 5.0,
    reviewsCount: dbProduct.reviewsCount || 1,
    points: dbProduct.points || Math.max(10, Math.floor(dbProduct.price / 10)),
    pointsEligible: Boolean(dbProduct.pointsEligible),
    pointsCost: dbProduct.pointsCost ? Number(dbProduct.pointsCost) : null,
    inStock: dbProduct.inStock ?? true,
  };
}
