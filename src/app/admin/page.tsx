'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { 
  getSnacks, addSnack, deleteSnack, 
  getConsoles, toggleConsoleGame, addConsole, deleteConsole,
  getBaseHourlyRate, setBaseHourlyRate,
  getExtraControllerRate, setExtraControllerRate,
  seedInitialData,
  getProducts, addProduct, deleteProduct,
  getAnalyticsData,
  searchUsers, promoteUserToStaff,
  getHeroTrending, setHeroTrending, getHeroGallery, setHeroGallery,
  type HeroTrendingSlide, type HeroGalleryImage
} from '@/backend/actions';

type SnackItem = {
  id: string;
  name: string;
  icon: string;
  price: number;
};

type ConsoleItem = {
  id: string;
  hardwareTitle: string;
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

  // Hero section state
  const [heroTrending, setHeroTrendingState] = useState<HeroTrendingSlide[]>([]);
  const [heroGallery, setHeroGalleryState] = useState<HeroGalleryImage[]>([]);
  const [newSlide, setNewSlide] = useState({ badge: '', title: '', subtitle: '', description: '', ctaText: '', ctaLink: '', imageUrl: '' });
  const [newGalleryImg, setNewGalleryImg] = useState({ imageUrl: '', label: '' });

  useEffect(() => {
    async function loadData() {
      await seedInitialData(); 
      
      await seedInitialData();

      const [rate, extraRate, fetchedSnacks, fetchedConsoles, fetchedProducts, fetchedAnalytics, fetchedTrending, fetchedGallery] = await Promise.all([
        getBaseHourlyRate(),
        getExtraControllerRate(),
        getSnacks(),
        getConsoles(),
        getProducts(),
        getAnalyticsData(),
        getHeroTrending(),
        getHeroGallery()
      ]);

      setBaseHourlyRateState(rate);
      setExtraControllerRateState(extraRate);
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

  const renderAnalyticsTab = () => {
    if (!analytics) return <div style={{ color: 'white', padding: '2rem' }}>Loading analytics...</div>;
    
    // Find max amount to scale the bars
    const maxAmount = Math.max(...analytics.revenueByDay.map((d: any) => d.amount), 1);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Total Revenue</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-accent)' }}>PKR {analytics.totalRevenue}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Total Orders</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>{analytics.totalOrders}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Total Sessions</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white' }}>{analytics.totalSessions}</div>
          </div>

        </div>

        {/* Revenue Chart */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px' }}>
          <h2 style={{ color: 'white', fontSize: '1.5rem', margin: '0 0 2rem 0' }}>Revenue Last 7 Days</h2>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '300px', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
            {analytics.revenueByDay.slice().reverse().map((day: any) => {
              const heightPct = (day.amount / maxAmount) * 100;
              const displayDate = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '10%' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{day.amount > 0 ? day.amount : ''}</div>
                  <div style={{ 
                    width: '100%', 
                    height: `${heightPct}%`, 
                    background: 'linear-gradient(180deg, var(--primary-accent) 0%, rgba(193, 255, 28, 0.2) 100%)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: '4px',
                    transition: 'height 1s ease-out'
                  }}></div>
                  <div style={{ position: 'absolute', bottom: '-2rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{displayDate}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  };

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
          <span>Manage Active Screens</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Title</th>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consoles.map(c => (
               <tr key={c.id} className={styles.tr}>
                 <td className={styles.td}>{c.hardwareTitle}</td>
                 <td className={styles.td}>{c.id}</td>
                 <td className={styles.td}>
                   <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteConsole(c.id)}>Delete</button>
                 </td>
               </tr>
            ))}
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
    e.preventDefault();
    const results = await searchUsers(staffSearchQuery);
    setStaffSearchResults(results);
  };

  const handlePromote = async (userId: string, role: string) => {
    try {
      await promoteUserToStaff(userId, role);
      alert(`User promoted to ${role} successfully! You can now log into Reception.`);
    } catch (err: any) {
      alert(err.message || 'Failed to promote user');
    }
  };

  // ── Hero Section Handlers ──
  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const slide: HeroTrendingSlide = { ...newSlide, id: Date.now().toString() };
    const updated = [...heroTrending, slide];
    setHeroTrendingState(updated);
    await setHeroTrending(updated);
    setNewSlide({ badge: '', title: '', subtitle: '', description: '', ctaText: '', ctaLink: '', imageUrl: '' });
    alert('Trending slide added!');
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    const updated = heroTrending.filter(s => s.id !== id);
    setHeroTrendingState(updated);
    await setHeroTrending(updated);
  };

  const handleAddGalleryImg = async (e: React.FormEvent) => {
    e.preventDefault();
    const img: HeroGalleryImage = { ...newGalleryImg, id: Date.now().toString() };
    const updated = [...heroGallery, img];
    setHeroGalleryState(updated);
    await setHeroGallery(updated);
    setNewGalleryImg({ imageUrl: '', label: '' });
    alert('Gallery image added!');
  };

  const handleDeleteGalleryImg = async (id: string) => {
    if (!confirm('Delete this gallery image?')) return;
    const updated = heroGallery.filter(g => g.id !== id);
    setHeroGalleryState(updated);
    await setHeroGallery(updated);
  };

  const renderStaffTab = () => (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span>Staff Management</span>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        Search for an existing user account to promote them to RECEPTIONIST or ADMIN.
        <br />
        <strong>Note:</strong> If this is your first time setting up, promote your own account to ADMIN.
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
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffSearchResults.map(u => (
              <tr key={u.id} className={styles.tr}>
                <td className={styles.td}>{u.fullName}</td>
                <td className={styles.td}>@{u.username}</td>
                <td className={styles.td} style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className={styles.actionBtn} onClick={() => handlePromote(u.id, 'RECEPTIONIST')}>Make Receptionist</button>
                  <button className={styles.actionBtn} onClick={() => handlePromote(u.id, 'ADMIN')}>Make Admin</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderHeroTab = () => (
    <>
      {/* Trending Slides Manager */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Add Trending Slide</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleAddSlide}>
          <div className={styles.field}>
            <label className={styles.label}>Badge Text</label>
            <input type="text" className={styles.input} value={newSlide.badge} onChange={e => setNewSlide({ ...newSlide, badge: e.target.value })} placeholder="e.g. NOW OPEN" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Title (Line 1)</label>
            <input type="text" className={styles.input} value={newSlide.title} onChange={e => setNewSlide({ ...newSlide, title: e.target.value })} placeholder="e.g. AVAILABLE" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Subtitle (Line 2, accented)</label>
            <input type="text" className={styles.input} value={newSlide.subtitle} onChange={e => setNewSlide({ ...newSlide, subtitle: e.target.value })} placeholder="e.g. NOW" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>CTA Button Text</label>
            <input type="text" className={styles.input} value={newSlide.ctaText} onChange={e => setNewSlide({ ...newSlide, ctaText: e.target.value })} placeholder="e.g. SHOP NOW" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>CTA Link URL</label>
            <input type="text" className={styles.input} value={newSlide.ctaLink} onChange={e => setNewSlide({ ...newSlide, ctaLink: e.target.value })} placeholder="/shop" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Background Image URL</label>
            <input type="text" className={styles.input} value={newSlide.imageUrl} onChange={e => setNewSlide({ ...newSlide, imageUrl: e.target.value })} placeholder="/images/hero_main.jpg" required />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.input} rows={3} value={newSlide.description} onChange={e => setNewSlide({ ...newSlide, description: e.target.value })} placeholder="Short description..." />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn}>Add Slide</button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Current Trending Slides ({heroTrending.length})</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Badge</th>
              <th className={styles.th}>Title</th>
              <th className={styles.th}>CTA</th>
              <th className={styles.th}>Image</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {heroTrending.map(slide => (
              <tr key={slide.id} className={styles.tr}>
                <td className={styles.td}>{slide.badge}</td>
                <td className={styles.td}>{slide.title} {slide.subtitle}</td>
                <td className={styles.td}>{slide.ctaText}</td>
                <td className={styles.td} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slide.imageUrl}</td>
                <td className={styles.td}>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteSlide(slide.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {heroTrending.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No trending slides. Defaults will be used.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Gallery Images Manager */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Add Gallery Image</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleAddGalleryImg}>
          <div className={styles.field}>
            <label className={styles.label}>Image URL / Path</label>
            <input type="text" className={styles.input} value={newGalleryImg.imageUrl} onChange={e => setNewGalleryImg({ ...newGalleryImg, imageUrl: e.target.value })} placeholder="/images/hero_side.jpg" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Label</label>
            <input type="text" className={styles.input} value={newGalleryImg.label} onChange={e => setNewGalleryImg({ ...newGalleryImg, label: e.target.value })} placeholder="e.g. CHAMPIONS" required />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn}>Add Gallery Image</button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Current Gallery Images ({heroGallery.length})</span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Label</th>
              <th className={styles.th}>Image URL</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {heroGallery.map(img => (
              <tr key={img.id} className={styles.tr}>
                <td className={styles.td}>{img.label}</td>
                <td className={styles.td} style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.imageUrl}</td>
                <td className={styles.td}>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteGalleryImg(img.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {heroGallery.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No gallery images. Defaults will be used.</td>
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
