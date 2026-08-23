'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import { 
  getSnacks, addSnack, deleteSnack, 
  getConsoles, toggleConsoleGame, addConsole, deleteConsole,
  getBaseHourlyRate, setBaseHourlyRate,
  getExtraControllerRate, setExtraControllerRate,
  getLoyaltyRates, setLoyaltyRates, adjustUserLoyaltyPoints,
  getProducts, addProduct, deleteProduct,
  getAnalyticsData,
  searchUsers, promoteUserToStaff,
  getHeroTrending, setHeroTrending, getHeroGallery, setHeroGallery,
  type HeroTrendingSlide, type HeroGalleryImage
} from '@/backend/actions';

const AnalyticsTab = dynamic(() => import('@/components/admin/tabs/AnalyticsTab'), {
  loading: () => <div style={{ color: 'white', padding: '2rem' }}>Loading Analytics Dashboard...</div>,
  ssr: false,
});

type SnackItem = {
  id: string;
  name: string;
  icon: string;
  price: number;
};

type ConsoleItem = {
  id: string;
  hardwareTitle: string;
  hourlyRate?: number | null;
  specs?: string | null;
  imagePath?: string | null;
  games: { game: { name: string } }[];
};

type ProductItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
};

const AVAILABLE_GAMES = ["FIFA 24", "Tekken 8", "Spider-Man 2", "Call of Duty", "Mortal Kombat 1", "Fortnite", "Apex Legends", "EAFC 24", "Valorant", "CS2", "League of Legends", "Dota 2", "Rainbow Six Siege", "Overwatch 2", "Halo Infinite", "Forza Horizon 5"];

export default function BackendAdmin() {
  const [activeTab, setActiveTab] = useState('products');
  const [baseHourlyRate, setBaseHourlyRateState] = useState(1000);
  const [extraControllerRate, setExtraControllerRateState] = useState(200);
  const [snacks, setSnacks] = useState<SnackItem[]>([]);
  const [consoles, setConsoles] = useState<ConsoleItem[]>([]);
  const [selectedConsoleId, setSelectedConsoleId] = useState<string>('');
  
  const [analytics, setAnalytics] = useState<any>(null);

  const [newSnackName, setNewSnackName] = useState('');
  const [newSnackPrice, setNewSnackPrice] = useState('');
  const [newSnackIcon, setNewSnackIcon] = useState('🥤');
  const [isLoading, setIsLoading] = useState(true);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('peripherals');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');

  const [newConsoleTitle, setNewConsoleTitle] = useState('');
  const [newConsoleRate, setNewConsoleRate] = useState('');
  const [newConsoleSlug, setNewConsoleSlug] = useState('');
  const [newConsoleImage, setNewConsoleImage] = useState('');
  const [newConsoleSpecs, setNewConsoleSpecs] = useState('');

  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffSearchResults, setStaffSearchResults] = useState<any[]>([]);

  // Loyalty Settings State
  const [pointsPerHour, setPointsPerHourState] = useState(50);
  const [spendPerPoint, setSpendPerPointState] = useState(10);
  const [userPointsModal, setUserPointsModal] = useState<any | null>(null);
  const [pointsDeltaInput, setPointsDeltaInput] = useState('');

  // Hero section state
  const [heroTrending, setHeroTrendingState] = useState<HeroTrendingSlide[]>([]);
  const [heroGallery, setHeroGalleryState] = useState<HeroGalleryImage[]>([]);
  const [newSlide, setNewSlide] = useState({ badge: '', title: '', subtitle: '', description: '', ctaText: '', ctaLink: '', imageUrl: '' });
  const [newGalleryImg, setNewGalleryImg] = useState({ imageUrl: '', label: '' });
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroTrendingSlide | null>(null);
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [rate, extraRate, loyaltyRates, fetchedSnacks, fetchedConsoles, fetchedProducts, fetchedAnalytics, fetchedTrending, fetchedGallery] = await Promise.all([
        getBaseHourlyRate(),
        getExtraControllerRate(),
        getLoyaltyRates(),
        getSnacks(),
        getConsoles(),
        getProducts(),
        getAnalyticsData(),
        getHeroTrending(),
        getHeroGallery()
      ]);

      setBaseHourlyRateState(rate);
      setExtraControllerRateState(extraRate);
      setPointsPerHourState(loyaltyRates.pointsPerHour);
      setSpendPerPointState(loyaltyRates.spendPerPoint);
      setSnacks(fetchedSnacks);
      setConsoles(fetchedConsoles as any);
      setProducts(fetchedProducts as any);
      setAnalytics(fetchedAnalytics);
      setHeroTrendingState(fetchedTrending);
      setHeroGalleryState(fetchedGallery);
      if (fetchedConsoles.length > 0) setSelectedConsoleId(fetchedConsoles[0].id);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    await setBaseHourlyRate(baseHourlyRate);
    await setExtraControllerRate(extraControllerRate);
    alert('Global pricing saved successfully!');
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct = await addProduct({
      name: newProductName,
      price: parseFloat(newProductPrice),
      category: newProductCategory,
      imageUrl: newProductImageUrl,
      description: newProductDesc
    });
    setProducts([newProduct as any, ...products]);
    setNewProductName(''); setNewProductPrice(''); setNewProductImageUrl(''); setNewProductDesc('');
    alert('Product added successfully!');
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this product?')) {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleAddConsole = async (e: React.FormEvent) => {
    e.preventDefault();
    const newConsole = await addConsole({
      id: newConsoleSlug,
      hardwareTitle: newConsoleTitle,
      hardwareSlug: newConsoleSlug,
      hourlyRate: parseFloat(newConsoleRate),
      imagePath: newConsoleImage,
      specs: newConsoleSpecs
    });
    setConsoles([...consoles, { ...newConsole, games: [] } as any]);
    setNewConsoleTitle(''); setNewConsoleRate(''); setNewConsoleSlug(''); setNewConsoleImage(''); setNewConsoleSpecs('');
    alert('Console added successfully!');
  };

  const handleDeleteConsole = async (id: string) => {
    if (confirm('Delete this console? This will remove all associated games.')) {
      await deleteConsole(id);
      setConsoles(consoles.filter(c => c.id !== id));
    }
  };

  const handleAddSnack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnackName || !newSnackPrice) return;

    const newSnack = await addSnack({
      name: newSnackName,
      price: parseInt(newSnackPrice),
      icon: newSnackIcon
    });

    setSnacks([...snacks, newSnack]);
    setNewSnackName('');
    setNewSnackPrice('');
    alert('Snack added and synced to Database!');
  };

  const handleDeleteSnack = async (id: string) => {
    if (confirm('Delete this snack?')) {
      await deleteSnack(id);
      setSnacks(snacks.filter(s => s.id !== id));
    }
  };

  const handleToggleGame = async (game: string) => {
    // Optimistic UI update
    setConsoles(prev => prev.map(c => {
      if (c.id === selectedConsoleId) {
        const hasGame = c.games.some(g => g.game.name === game);
        if (hasGame) {
          return { ...c, games: c.games.filter(g => g.game.name !== game) };
        } else {
          return { ...c, games: [...c.games, { game: { name: game } }] };
        }
      }
      return c;
    }));
    
    // Server mutation
    await toggleConsoleGame(selectedConsoleId, game);
  };

  const renderAnalyticsTab = () => <AnalyticsTab analytics={analytics} />;

  const renderProductsTab = () => (
    <>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Upload New Product</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleAddProduct}>
          <div className={styles.field}>
            <label className={styles.label}>Product Name</label>
            <input type="text" className={styles.input} value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="e.g. Neon Keyboard" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Price ($)</label>
            <input type="number" step="0.01" className={styles.input} value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="99.99" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select className={styles.select} value={newProductCategory} onChange={e => setNewProductCategory(e.target.value)} required>
              <option value="peripherals">Peripherals</option>
              <option value="apparel">Apparel</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Image URL / Path</label>
            <input type="text" className={styles.input} value={newProductImageUrl} onChange={e => setNewProductImageUrl(e.target.value)} placeholder="/images/products/item.png" required />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.input} rows={4} value={newProductDesc} onChange={e => setNewProductDesc(e.target.value)} placeholder="Product description..."></textarea>
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn}>Upload Product</button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Current Inventory</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Product Name</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Price</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className={styles.tr}>
                <td className={styles.td}>{p.name}</td>
                <td className={styles.td} style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td className={styles.td}>${p.price.toFixed(2)}</td>
                <td className={styles.td}>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No products in inventory.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Quick Sale (Snacks) Config</span>
        </div>

        <form className={styles.formGrid} onSubmit={handleAddSnack} style={{ marginBottom: '2rem' }}>
          <div className={styles.field}>
            <label className={styles.label}>Snack Name</label>
            <input type="text" className={styles.input} value={newSnackName} onChange={e => setNewSnackName(e.target.value)} placeholder="e.g. Water Bottle" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Price (PKR)</label>
            <input type="number" className={styles.input} value={newSnackPrice} onChange={e => setNewSnackPrice(e.target.value)} placeholder="100" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Icon / Emoji</label>
            <input type="text" className={styles.input} value={newSnackIcon} onChange={e => setNewSnackIcon(e.target.value)} placeholder="💧" required />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn}>Add Snack</button>
          </div>
        </form>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Icon</th>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Price</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {snacks.map(snack => (
              <tr key={snack.id} className={styles.tr}>
                <td className={styles.td} style={{ fontSize: '1.5rem' }}>{snack.icon}</td>
                <td className={styles.td}>{snack.name}</td>
                <td className={styles.td}>PKR {snack.price}</td>
                <td className={styles.td}>
                  <button onClick={() => handleDeleteSnack(snack.id)} className={`${styles.actionBtn} ${styles.actionBtnDelete}`}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const handleSaveLoyaltyRates = async (e: React.FormEvent) => {
    e.preventDefault();
    await setLoyaltyRates(pointsPerHour, spendPerPoint);
    alert('Loyalty Points configuration updated and saved!');
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPointsModal || !pointsDeltaInput) return;
    const delta = parseInt(pointsDeltaInput);
    if (isNaN(delta)) {
      alert('Please enter a valid points amount');
      return;
    }
    try {
      const updated = await adjustUserLoyaltyPoints(userPointsModal.id, delta);
      alert(`User points updated! New balance: ${updated.loyaltyPoints} XP (${updated.rank})`);
      // Update local search results
      setStaffSearchResults(prev => prev.map(u => u.id === userPointsModal.id ? { ...u, loyaltyPoints: updated.loyaltyPoints, rank: updated.rank } : u));
      setUserPointsModal(null);
      setPointsDeltaInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to adjust points');
    }
  };

  const renderScreensTab = () => (
    <>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Global Pricing Configuration</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleSaveRate}>
          <div className={`${styles.field}`}>
            <label className={styles.label}>Base Hourly Rate (PKR)</label>
            <input
              type="number"
              className={styles.input}
              value={baseHourlyRate}
              onChange={(e) => setBaseHourlyRateState(Number(e.target.value))}
              required
            />
          </div>
          <div className={`${styles.field}`}>
            <label className={styles.label}>Extra Controller Rate (PKR)</label>
            <input
              type="number"
              className={styles.input}
              value={extraControllerRate}
              onChange={(e) => setExtraControllerRateState(Number(e.target.value))}
              required
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn}>Save Global Pricing</button>
          </div>
        </form>
      </div>

      {/* Loyalty Points Configuration Panel */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>⭐ Loyalty Points & Rewards Rate Engine</span>
        </div>
        <p style={{ color: '#7f8388', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Control how players earn loyalty points during station gaming sessions and product shopping.
        </p>
        <form className={styles.formGrid} onSubmit={handleSaveLoyaltyRates}>
          <div className={styles.field}>
            <label className={styles.label}>Hourly Session Reward (Points / Hour)</label>
            <input
              type="number"
              className={styles.input}
              value={pointsPerHour}
              onChange={(e) => setPointsPerHourState(Number(e.target.value))}
              placeholder="e.g. 50"
              required
            />
            <span style={{ fontSize: '0.72rem', color: '#7f8388', marginTop: '3px' }}>Default: 50 XP per 1 hour played</span>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Shopping Reward (PKR Spent per 1 Point)</label>
            <input
              type="number"
              className={styles.input}
              value={spendPerPoint}
              onChange={(e) => setSpendPerPointState(Number(e.target.value))}
              placeholder="e.g. 10"
              required
            />
            <span style={{ fontSize: '0.72rem', color: '#7f8388', marginTop: '3px' }}>Default: 10 PKR = 1 Point (10% reward)</span>
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn}>Save Loyalty Points Rates</button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Add Console / Screen</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleAddConsole}>
          <div className={styles.field}>
            <label className={styles.label}>Hardware Title</label>
            <input type="text" className={styles.input} value={newConsoleTitle} onChange={e => setNewConsoleTitle(e.target.value)} placeholder="e.g. PS5 Pro Setup" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Hourly Rate (PKR)</label>
            <input type="number" className={styles.input} value={newConsoleRate} onChange={e => setNewConsoleRate(e.target.value)} placeholder="1000" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Hardware ID (Unique ID)</label>
            <input type="text" className={styles.input} value={newConsoleSlug} onChange={e => setNewConsoleSlug(e.target.value)} placeholder="e.g. ps5-7" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Image Path</label>
            <input type="text" className={styles.input} value={newConsoleImage} onChange={e => setNewConsoleImage(e.target.value)} placeholder="/images/products/ps5.png" />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Specs (Short String)</label>
            <input type="text" className={styles.input} value={newConsoleSpecs} onChange={e => setNewConsoleSpecs(e.target.value)} placeholder="e.g. 120Hz 4K • DualSense Edge" />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn}>Save Hardware</button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Manage Active Stations & Consoles ({consoles.length})</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Station Title</th>
              <th className={styles.th}>ID / Slug</th>
              <th className={styles.th}>Hourly Rate</th>
              <th className={styles.th}>Specs / Hardware</th>
              <th className={styles.th}>Installed Games</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consoles.map(c => (
               <tr key={c.id} className={styles.tr}>
                 <td className={styles.td}><strong>{c.hardwareTitle}</strong></td>
                 <td className={styles.td}><code style={{ color: '#d6ff01' }}>{c.id}</code></td>
                 <td className={styles.td}>PKR {c.hourlyRate || baseHourlyRate}/hr</td>
                 <td className={styles.td} style={{ fontSize: '0.8rem', color: '#7f8388' }}>{c.specs || 'Standard Display'}</td>
                 <td className={styles.td}>
                   <span style={{ fontSize: '0.8rem', color: '#d6ff01' }}>
                     {c.games?.length || 0} games
                   </span>
                 </td>
                 <td className={styles.td}>
                   <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteConsole(c.id)}>Delete</button>
                 </td>
               </tr>
            ))}
            {consoles.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No active stations configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderGamesTab = () => {
    const selectedConsole = consoles.find(c => c.id === selectedConsoleId);
    return (
      <>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Map Games to Consoles</span>
            <button className={styles.btn} onClick={() => alert('Game mappings are saved automatically when toggled!')}>Mapping Auto-Saves</button>
          </div>

          <div className={styles.field} style={{ marginBottom: '2rem' }}>
            <label className={styles.label}>Select Hardware Platform</label>
            <select className={styles.select} style={{ width: '300px' }} value={selectedConsoleId} onChange={e => setSelectedConsoleId(e.target.value)}>
              {consoles.map(c => (
                <option key={c.id} value={c.id}>{c.hardwareTitle}</option>
              ))}
            </select>
          </div>

          <label className={styles.label} style={{ marginBottom: '1rem', display: 'block' }}>Installed Games List</label>
          <div className={styles.checkboxGrid}>
            {AVAILABLE_GAMES.map((game, idx) => {
              const isChecked = selectedConsole?.games?.some(g => g.game.name === game) || false;
              return (
                <label key={idx} className={styles.checkboxLabel}>
                  <input type="checkbox" className={styles.checkbox} checked={isChecked} onChange={() => handleToggleGame(game)} />
                  {game}
                </label>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  const handleSearchStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const results = await searchUsers(staffSearchQuery);
    setStaffSearchResults(results);
  };

  const handlePromote = async (userId: string, role: string) => {
    try {
      await promoteUserToStaff(userId, role);
      alert(`User promoted to ${role} successfully! You can now log into Reception.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to promote user';
      alert(msg);
    }
  };

  // ── Hero Section File Upload Helper ──
  const uploadImageFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Failed to upload image');
    }
    return data.url;
  };

  const handlePosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPoster(true);
      const url = await uploadImageFile(file);
      setNewSlide(prev => ({ ...prev, imageUrl: url }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      alert(msg);
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingGallery(true);
      const url = await uploadImageFile(file);
      setNewGalleryImg(prev => ({ ...prev, imageUrl: url }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      alert(msg);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleEditPosterFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;
    try {
      setIsUploadingEdit(true);
      const url = await uploadImageFile(file);
      setEditingSlide({ ...editingSlide, imageUrl: url });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      alert(msg);
    } finally {
      setIsUploadingEdit(false);
    }
  };

  // ── Hero Section Handlers ──
  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlide.imageUrl) {
      alert('Please upload or provide an image for the poster');
      return;
    }
    const slide: HeroTrendingSlide = { ...newSlide, id: Date.now().toString() };
    const updated = [...heroTrending, slide];
    setHeroTrendingState(updated);
    await setHeroTrending(updated);
    setNewSlide({ badge: '', title: '', subtitle: '', description: '', ctaText: '', ctaLink: '', imageUrl: '' });
    alert('Left poster slide added!');
  };

  const handleUpdateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    const updated = heroTrending.map(s => s.id === editingSlide.id ? editingSlide : s);
    setHeroTrendingState(updated);
    await setHeroTrending(updated);
    setEditingSlide(null);
    alert('Poster slide updated successfully!');
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    const updated = heroTrending.filter(s => s.id !== id);
    setHeroTrendingState(updated);
    await setHeroTrending(updated);
  };

  const handleAddGalleryImg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryImg.imageUrl) {
      alert('Please upload or provide an image for the feature card');
      return;
    }
    const img: HeroGalleryImage = { ...newGalleryImg, id: Date.now().toString() };
    const updated = [...heroGallery, img];
    setHeroGalleryState(updated);
    await setHeroGallery(updated);
    setNewGalleryImg({ imageUrl: '', label: '' });
    alert('Right feature card added!');
  };

  const handleDeleteGalleryImg = async (id: string) => {
    if (!confirm('Delete this gallery image?')) return;
    const updated = heroGallery.filter(g => g.id !== id);
    setHeroGalleryState(updated);
    await setHeroGallery(updated);
  };

  const renderStaffTab = () => (
    <>
      {/* Adjust User Points Modal */}
      {userPointsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#141a20',
            border: '1px solid #22272c',
            borderRadius: '6px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d6ff01', textTransform: 'uppercase' }}>
                Adjust Points: {userPointsModal.fullName || userPointsModal.username}
              </h2>
              <button
                onClick={() => setUserPointsModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#0c1016', padding: '1rem', borderRadius: '4px', border: '1px solid #22272c', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#7f8388', display: 'block' }}>Current Balance</span>
                <strong style={{ fontSize: '1.25rem', color: '#ffffff' }}>{userPointsModal.loyaltyPoints || 0} XP</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#7f8388', display: 'block' }}>Current Rank</span>
                <span style={{ background: '#d6ff01', color: '#000', padding: '2px 8px', borderRadius: '2px', fontWeight: 800, fontSize: '0.72rem' }}>
                  {userPointsModal.rank || 'Rookie'}
                </span>
              </div>
            </div>

            <form onSubmit={handleAdjustPoints} className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Points to Add or Deduct (Use - to subtract)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={pointsDeltaInput}
                  onChange={e => setPointsDeltaInput(e.target.value)}
                  placeholder="e.g. +100 or -50"
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#7f8388', marginTop: '4px' }}>
                  Tip: Enter a positive number (e.g. 150) to reward points, or negative (e.g. -50) to deduct.
                </span>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className={styles.btn}>Apply Points</button>
                <button
                  type="button"
                  onClick={() => setUserPointsModal(null)}
                  style={{ background: '#22272c', color: '#fff', padding: '0.8rem 1.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Staff & User Loyalty Management</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Search for an existing user account to promote them to RECEPTIONIST/ADMIN, or manually add and deduct loyalty reward points.
        </p>
        
        <form onSubmit={handleSearchStaff} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            className={styles.input} 
            placeholder="Search by username, name, or phone" 
            value={staffSearchQuery}
            onChange={e => setStaffSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.btn}>Search Users</button>
        </form>

        {staffSearchResults.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Username</th>
                <th className={styles.th}>Rank</th>
                <th className={styles.th}>Loyalty Points</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffSearchResults.map(u => (
                <tr key={u.id} className={styles.tr}>
                  <td className={styles.td}><strong>{u.fullName || u.name}</strong></td>
                  <td className={styles.td}>@{u.username}</td>
                  <td className={styles.td}>
                    <span style={{ background: 'rgba(214,255,1,0.1)', color: '#d6ff01', padding: '2px 8px', borderRadius: '2px', fontWeight: 800, fontSize: '0.75rem' }}>
                      {u.rank || 'Rookie'}
                    </span>
                  </td>
                  <td className={styles.td}><strong style={{ color: '#d6ff01' }}>{u.loyaltyPoints || 0} XP</strong></td>
                  <td className={styles.td} style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className={styles.actionBtn}
                      style={{ background: '#d6ff01', color: '#000', fontWeight: 800 }}
                      onClick={() => {
                        setUserPointsModal(u);
                        setPointsDeltaInput('');
                      }}
                    >
                      ⭐ Adjust Points
                    </button>
                    <button className={styles.actionBtn} onClick={() => handlePromote(u.id, 'RECEPTIONIST')}>Make Reception</button>
                    <button className={styles.actionBtn} onClick={() => handlePromote(u.id, 'ADMIN')}>Make Admin</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderHeroTab = () => (
    <>
      {/* Edit Left Poster Modal */}
      {editingSlide && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#141a20',
            border: '1px solid #22272c',
            borderRadius: '6px',
            maxWidth: '600px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d6ff01', textTransform: 'uppercase' }}>Edit Poster Slide</h2>
              <button
                onClick={() => setEditingSlide(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSlide} className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Poster Title / Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editingSlide.title}
                  onChange={e => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  placeholder="e.g. SHOP NEW MERCH"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>CTA Button Text</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editingSlide.ctaText}
                  onChange={e => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                  placeholder="e.g. SHOP NOW"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>CTA Action Link URL</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editingSlide.ctaLink}
                  onChange={e => setEditingSlide({ ...editingSlide, ctaLink: e.target.value })}
                  placeholder="e.g. /shop or https://..."
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Poster Image URL (or upload below)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editingSlide.imageUrl}
                  onChange={e => setEditingSlide({ ...editingSlide, imageUrl: e.target.value })}
                  placeholder="/images/... or upload"
                  required
                />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Direct File Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditPosterFileUpload}
                  style={{ color: '#fff', fontSize: '0.85rem' }}
                />
                {isUploadingEdit && <span style={{ color: '#d6ff01', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image...</span>}
              </div>

              {editingSlide.imageUrl && (
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>Image Preview</label>
                  <div style={{ width: '100%', height: '140px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${editingSlide.imageUrl})`, borderRadius: '4px', border: '1px solid #22272c' }} />
                </div>
              )}

              <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className={styles.btn}>Save Changes</button>
                <button
                  type="button"
                  onClick={() => setEditingSlide(null)}
                  style={{ background: '#22272c', color: '#fff', padding: '0.8rem 1.5rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Left Posters Manager */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Add Left Poster Slide</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleAddSlide}>
          <div className={styles.field}>
            <label className={styles.label}>Poster Title / Name</label>
            <input type="text" className={styles.input} value={newSlide.title} onChange={e => setNewSlide({ ...newSlide, title: e.target.value })} placeholder="e.g. SHOP NEW MERCH" required />
          </div>
          
          <div className={styles.field}>
            <label className={styles.label}>CTA Button Text</label>
            <input type="text" className={styles.input} value={newSlide.ctaText} onChange={e => setNewSlide({ ...newSlide, ctaText: e.target.value })} placeholder="e.g. SHOP NOW" required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>CTA Button Link URL</label>
            <input type="text" className={styles.input} value={newSlide.ctaLink} onChange={e => setNewSlide({ ...newSlide, ctaLink: e.target.value })} placeholder="e.g. /shop or https://..." required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Poster Image URL (or upload below)</label>
            <input type="text" className={styles.input} value={newSlide.imageUrl} onChange={e => setNewSlide({ ...newSlide, imageUrl: e.target.value })} placeholder="/images/hero_main.jpg" required />
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>📁 Direct File Upload (Click or Select File)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePosterFileUpload}
              style={{ color: '#fff', fontSize: '0.85rem' }}
            />
            {isUploadingPoster && <span style={{ color: '#d6ff01', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image to server...</span>}
            {newSlide.imageUrl && (
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#7f8388', display: 'block', marginBottom: '4px' }}>Uploaded Preview:</span>
                <div style={{ width: '180px', height: '100px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${newSlide.imageUrl})`, borderRadius: '4px', border: '1px solid #22272c' }} />
              </div>
            )}
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn} disabled={isUploadingPoster}>
              {isUploadingPoster ? 'Uploading...' : 'Add Left Poster'}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Current Left Poster Slides ({heroTrending.length})</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Title</th>
              <th className={styles.th}>Image Preview</th>
              <th className={styles.th}>CTA Button</th>
              <th className={styles.th}>CTA Link</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {heroTrending.map(slide => (
              <tr key={slide.id} className={styles.tr}>
                <td className={styles.td}><strong>{slide.title}</strong></td>
                <td className={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '50px', height: '35px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${slide.imageUrl})`, borderRadius: '3px', border: '1px solid #22272c', flexShrink: 0 }} />
                    <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: '#7f8388' }}>{slide.imageUrl}</span>
                  </div>
                </td>
                <td className={styles.td}>
                  <span style={{ background: '#d6ff01', color: '#000', padding: '3px 8px', borderRadius: '3px', fontWeight: 800, fontSize: '0.72rem' }}>
                    {slide.ctaText || 'NONE'}
                  </span>
                </td>
                <td className={styles.td} style={{ fontSize: '0.8rem', color: '#7f8388' }}>{slide.ctaLink}</td>
                <td className={styles.td} style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className={styles.actionBtn}
                    style={{ background: '#22272c', color: '#d6ff01' }}
                    onClick={() => setEditingSlide(slide)}
                  >
                    Edit
                  </button>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteSlide(slide.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {heroTrending.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No custom posters. Default posters are being displayed.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Right Feature Cards Manager */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Add Right Feature Card</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleAddGalleryImg}>
          <div className={styles.field}>
            <label className={styles.label}>Feature Card Label</label>
            <input type="text" className={styles.input} value={newGalleryImg.label} onChange={e => setNewGalleryImg({ ...newGalleryImg, label: e.target.value })} placeholder="e.g. DREAMHACK ATLANTA CHAMPS" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Feature Image URL (or upload below)</label>
            <input type="text" className={styles.input} value={newGalleryImg.imageUrl} onChange={e => setNewGalleryImg({ ...newGalleryImg, imageUrl: e.target.value })} placeholder="/images/champs.jpg" required />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>📁 Direct File Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleGalleryFileUpload}
              style={{ color: '#fff', fontSize: '0.85rem' }}
            />
            {isUploadingGallery && <span style={{ color: '#d6ff01', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image to server...</span>}
            {newGalleryImg.imageUrl && (
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#7f8388', display: 'block', marginBottom: '4px' }}>Uploaded Preview:</span>
                <div style={{ width: '180px', height: '100px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${newGalleryImg.imageUrl})`, borderRadius: '4px', border: '1px solid #22272c' }} />
              </div>
            )}
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn} disabled={isUploadingGallery}>
              {isUploadingGallery ? 'Uploading...' : 'Add Right Feature Card'}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Current Right Feature Cards ({heroGallery.length})</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Label</th>
              <th className={styles.th}>Image Preview</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {heroGallery.map(img => (
              <tr key={img.id} className={styles.tr}>
                <td className={styles.td}><strong>{img.label}</strong></td>
                <td className={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '50px', height: '35px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${img.imageUrl})`, borderRadius: '3px', border: '1px solid #22272c', flexShrink: 0 }} />
                    <span style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: '#7f8388' }}>{img.imageUrl}</span>
                  </div>
                </td>
                <td className={styles.td}>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteGalleryImg(img.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {heroGallery.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No custom feature cards. Default cards are being displayed.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  if (isLoading) {
    return <div style={{ color: 'white', padding: '2rem' }}>Loading Database...</div>;
  }

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>M80 // Admin</Link>
        </div>
        <nav className={styles.nav}>
          <div
            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics & Revenue
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'products' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Product Management
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'screens' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('screens')}
          >
            Screen Management
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'games' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('games')}
          >
            Games Availability
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'staff' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            Staff & Roles
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'hero' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('hero')}
          >
            Hero Section
          </div>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>
            {activeTab === 'analytics' && 'Business Analytics'}
            {activeTab === 'products' && 'Shop Inventory'}
            {activeTab === 'screens' && 'Hardware Configuration'}
            {activeTab === 'games' && 'Game Deployments'}
            {activeTab === 'staff' && 'Staff Management'}
            {activeTab === 'hero' && 'Hero Section'}
          </h1>
        </header>

        <div className={styles.content}>
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'products' && renderProductsTab()}
          {activeTab === 'screens' && renderScreensTab()}
          {activeTab === 'games' && renderGamesTab()}
          {activeTab === 'staff' && renderStaffTab()}
          {activeTab === 'hero' && renderHeroTab()}
        </div>
      </main>
    </div>
  );
}
