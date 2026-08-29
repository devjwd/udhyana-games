/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import { 
  getSnacks, addSnack, deleteSnack, 
  getConsoles, toggleConsoleGame, addConsole, deleteConsole,
  getAllMasterGames, createMasterGame, deleteMasterGame,
  getBaseHourlyRate, setBaseHourlyRate,
  getExtraControllerRate, setExtraControllerRate,
  getLoyaltyRates, setLoyaltyRates, adjustUserLoyaltyPoints,
  getProducts, addProduct, deleteProduct,
  getAnalyticsData,
  searchUsers, promoteUserToStaff, getAllUsersWithRoles, updateUserRole, approveUser, rejectUser,
  getAllCustomersWithStats, getCustomerFullDossier, updateCustomerProfile,
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

type MasterGameItem = {
  id: string;
  name: string;
  consoles?: { consoleId: string; console?: { hardwareTitle: string } }[];
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

export default function BackendAdmin() {
  const [activeTab, setActiveTab] = useState('customers');
  const [baseHourlyRate, setBaseHourlyRateState] = useState(1000);
  const [extraControllerRate, setExtraControllerRateState] = useState(200);
  const [snacks, setSnacks] = useState<SnackItem[]>([]);
  const [consoles, setConsoles] = useState<ConsoleItem[]>([]);
  const [selectedConsoleId, setSelectedConsoleId] = useState<string>('');
  const [masterGames, setMasterGames] = useState<MasterGameItem[]>([]);
  const [newMasterGameName, setNewMasterGameName] = useState('');
  const [gameSearchFilter, setGameSearchFilter] = useState('');
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // Staff Management State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [staffRoleFilter, setStaffRoleFilter] = useState<'ALL_STAFF' | 'ADMIN' | 'RECEPTIONIST'>('ALL_STAFF');
  const [staffSearchText, setStaffSearchText] = useState('');
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteSearchText, setPromoteSearchText] = useState('');

  // Customers CRM & Dossier State
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerDossier, setSelectedCustomerDossier] = useState<any | null>(null);
  const [isDossierLoading, setIsDossierLoading] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [customerRankFilter, setCustomerRankFilter] = useState('ALL');
  const [customerStatusFilter, setCustomerStatusFilter] = useState('ALL');
  const [dossierActiveTab, setDossierActiveTab] = useState<'OVERVIEW' | 'SESSIONS' | 'ORDERS' | 'BOOKINGS' | 'EDIT'>('OVERVIEW');
  const [dossierPointsDelta, setDossierPointsDelta] = useState('');
  const [editCustomerForm, setEditCustomerForm] = useState({ fullName: '', phone: '', email: '', status: 'APPROVED', rank: 'Beginner' });
  
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
      const [rate, extraRate, loyaltyRates, fetchedSnacks, fetchedConsoles, fetchedProducts, fetchedAnalytics, fetchedTrending, fetchedGallery, fetchedMasterGames, fetchedUsers, fetchedCustomers] = await Promise.all([
        getBaseHourlyRate(),
        getExtraControllerRate(),
        getLoyaltyRates(),
        getSnacks(),
        getConsoles(),
        getProducts(),
        getAnalyticsData('7d'),
        getHeroTrending(),
        getHeroGallery(),
        getAllMasterGames(),
        getAllUsersWithRoles(),
        getAllCustomersWithStats()
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
      setMasterGames(fetchedMasterGames as any);
      setAllUsers(fetchedUsers as any);
      setCustomers(fetchedCustomers as any);
      if (fetchedConsoles.length > 0) setSelectedConsoleId(fetchedConsoles[0].id);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleTimeframeChange = async (timeframe: '7d' | '30d' | 'all') => {
    setIsAnalyticsLoading(true);
    try {
      const newAnalytics = await getAnalyticsData(timeframe);
      setAnalytics(newAnalytics);
    } catch {
      alert('Failed to load analytics for selected timeframe.');
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

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

  const handleCreateMasterGame = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMasterGameName.trim();
    if (!trimmed) return;

    try {
      const created = await createMasterGame(trimmed);
      setMasterGames(prev => [...prev, { id: created.id, name: created.name, consoles: [] }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewMasterGameName('');
      alert(`Game "${trimmed}" added to master library!`);
    } catch (err: any) {
      alert(err.message || 'Failed to add game.');
    }
  };

  const handleDeleteMasterGame = async (gameId: string, gameName: string) => {
    if (confirm(`Delete "${gameName}" from Master Library? This will uninstall it from all consoles.`)) {
      try {
        await deleteMasterGame(gameId);
        setMasterGames(prev => prev.filter(g => g.id !== gameId));
        setConsoles(prev => prev.map(c => ({
          ...c,
          games: c.games.filter(g => g.game.name !== gameName)
        })));
      } catch {
        alert('Failed to delete game.');
      }
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

  const renderAnalyticsTab = () => (
    <AnalyticsTab
      analytics={analytics}
      onTimeframeChange={handleTimeframeChange}
      isLoading={isAnalyticsLoading}
    />
  );

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
    const filteredMasterGames = masterGames.filter(g =>
      g.name.toLowerCase().includes(gameSearchFilter.toLowerCase())
    );

    return (
      <>
        {/* Panel 1: Master Game Library CRUD */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Master Game Library ({masterGames.length} Titles)</span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Add & manage games available across the lounge</span>
          </div>

          <form className={styles.formGrid} onSubmit={handleCreateMasterGame} style={{ marginBottom: '1.5rem' }}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.label}>Add New Game Title</label>
              <input
                type="text"
                className={styles.input}
                value={newMasterGameName}
                onChange={e => setNewMasterGameName(e.target.value)}
                placeholder="e.g. Black Myth: Wukong, FC 25, GTA V"
                required
              />
            </div>
            <div className={styles.field} style={{ justifyContent: 'flex-end', flex: '0 0 auto' }}>
              <label className={styles.label} style={{ visibility: 'hidden' }}>Submit</label>
              <button type="submit" className={styles.btn}>
                + Add Game to Library
              </button>
            </div>
          </form>

          {/* Master Games Table */}
          <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Game Title</th>
                  <th className={styles.th}>Installed Stations</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {masterGames.map(game => {
                  const installedCount = consoles.filter(c => c.games?.some(g => g.game.name === game.name)).length;
                  return (
                    <tr key={game.id} className={styles.tr}>
                      <td className={styles.td}>
                        <strong style={{ color: '#fff' }}>{game.name}</strong>
                      </td>
                      <td className={styles.td}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: installedCount > 0 ? 'rgba(193, 255, 28, 0.15)' : 'rgba(255,255,255,0.05)',
                          color: installedCount > 0 ? 'var(--primary-accent)' : 'rgba(255,255,255,0.4)'
                        }}>
                          {installedCount} / {consoles.length} Stations
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteMasterGame(game.id, game.name)}
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          title="Delete game from library"
                        >
                          Delete Game
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {masterGames.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                      No games in master library. Add your first game title above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Console Station Game Mapping */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Install & Remove Games from Stations</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-accent)', fontWeight: 800 }}>⚡ Auto-Saves to Live System</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
            <div className={styles.field} style={{ minWidth: '260px' }}>
              <label className={styles.label}>Select Gaming Station</label>
              <select
                className={styles.select}
                value={selectedConsoleId}
                onChange={e => setSelectedConsoleId(e.target.value)}
              >
                {consoles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.hardwareTitle} ({c.games?.length || 0} installed)
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field} style={{ flex: 1, minWidth: '200px' }}>
              <label className={styles.label}>Search Game Titles</label>
              <input
                type="text"
                className={styles.input}
                value={gameSearchFilter}
                onChange={e => setGameSearchFilter(e.target.value)}
                placeholder="Filter library games..."
              />
            </div>
          </div>

          <label className={styles.label} style={{ marginBottom: '1rem', display: 'block' }}>
            Installed on <strong>{selectedConsole?.hardwareTitle || 'Station'}</strong> ({selectedConsole?.games?.length || 0} / {masterGames.length} Games)
          </label>

          <div className={styles.checkboxGrid}>
            {filteredMasterGames.map((game) => {
              const isChecked = selectedConsole?.games?.some(g => g.game.name === game.name) || false;
              return (
                <label
                  key={game.id}
                  className={styles.checkboxLabel}
                  style={{
                    border: isChecked ? '1px solid var(--primary-accent)' : '1px solid rgba(255,255,255,0.08)',
                    background: isChecked ? 'rgba(193, 255, 28, 0.08)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isChecked}
                    onChange={() => handleToggleGame(game.name)}
                  />
                  <span style={{ fontWeight: isChecked ? 800 : 500, color: isChecked ? '#fff' : 'rgba(255,255,255,0.7)' }}>
                    {game.name}
                  </span>
                </label>
              );
            })}
            {filteredMasterGames.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', gridColumn: '1 / -1' }}>
                No matching games found in library.
              </div>
            )}
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert(`User role updated to ${newRole}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to update role.');
    }
  };

  const handleApproveUserAction = async (userId: string) => {
    try {
      await approveUser(userId);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'APPROVED' } : u));
      setCustomers(prev => prev.map(c => c.id === userId ? { ...c, status: 'APPROVED' } : c));
      alert('User membership approved & verified!');
    } catch {
      alert('Failed to approve user.');
    }
  };

  const handleRejectUserAction = async (userId: string) => {
    if (!confirm('Are you sure you want to reject / decline this account application?')) return;
    try {
      await rejectUser(userId);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'REJECTED' } : u));
      setCustomers(prev => prev.map(c => c.id === userId ? { ...c, status: 'REJECTED' } : c));
      alert('User account application rejected.');
    } catch {
      alert('Failed to reject user.');
    }
  };

  const renderStaffTab = () => {
    // Only users with ADMIN or RECEPTIONIST role are staff members
    const staffMembers = allUsers.filter(u => u.role === 'ADMIN' || u.role === 'RECEPTIONIST');
    const adminCount = staffMembers.filter(u => u.role === 'ADMIN').length;
    const receptionistCount = staffMembers.filter(u => u.role === 'RECEPTIONIST').length;
    const staffCount = staffMembers.length;

    const filteredStaff = staffMembers.filter(u => {
      if (staffRoleFilter === 'ADMIN' && u.role !== 'ADMIN') return false;
      if (staffRoleFilter === 'RECEPTIONIST' && u.role !== 'RECEPTIONIST') return false;

      if (staffSearchText.trim()) {
        const query = staffSearchText.toLowerCase();
        const matchName = (u.fullName || u.name || '').toLowerCase().includes(query);
        const matchUser = (u.username || '').toLowerCase().includes(query);
        const matchPhone = (u.phone || '').toLowerCase().includes(query);
        const matchEmail = (u.email || '').toLowerCase().includes(query);
        return matchName || matchUser || matchPhone || matchEmail;
      }
      return true;
    });

    // Candidates for staff promotion (regular gaming members)
    const eligibleMembers = allUsers
      .filter(u => u.role !== 'ADMIN' && u.role !== 'RECEPTIONIST')
      .filter(u => {
        if (!promoteSearchText.trim()) return true;
        const q = promoteSearchText.toLowerCase();
        return (
          (u.fullName || u.name || '').toLowerCase().includes(q) ||
          (u.username || '').toLowerCase().includes(q) ||
          (u.phone || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
        );
      });

    const handleDemoteStaff = async (userId: string, userName: string) => {
      if (!confirm(`Are you sure you want to demote "${userName}" back to a regular Player/Customer? They will lose staff portal access.`)) return;
      try {
        await updateUserRole(userId, 'USER');
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'USER' } : u));
        setCustomers(prev => prev.map(c => c.id === userId ? { ...c, role: 'USER' } : c));
        alert(`${userName} has been demoted to Player/Customer.`);
      } catch (err: any) {
        alert(err.message || 'Failed to demote staff member.');
      }
    };

    const handlePromoteUser = async (userId: string, targetRole: 'ADMIN' | 'RECEPTIONIST', userName: string) => {
      try {
        await updateUserRole(userId, targetRole);
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: targetRole } : u));
        setCustomers(prev => prev.map(c => c.id === userId ? { ...c, role: targetRole } : c));
        alert(`Successfully promoted ${userName} to ${targetRole === 'ADMIN' ? '👑 Administrator' : '⚡ Receptionist'}!`);
      } catch (err: any) {
        alert(err.message || 'Failed to promote member.');
      }
    };

    return (
      <>
        {/* Promote Member to Staff Modal */}
        {isPromoteModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{
              backgroundColor: '#141a20',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-accent)', margin: 0, textTransform: 'uppercase' }}>
                    ➕ Promote Member to Staff
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                    Select an existing registered gamer to assign Receptionist or Administrator permissions.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPromoteModalOpen(false)}
                  style={{ background: '#22272c', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Search members by name, @username, phone..."
                  value={promoteSearchText}
                  onChange={e => setPromoteSearchText(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                {eligibleMembers.map(m => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#0c1016',
                      padding: '0.9rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: '#22272c',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900
                      }}>
                        {(m.fullName || m.username || 'M').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{m.fullName || m.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>@{m.username} • {m.phone || m.email || 'No contact'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handlePromoteUser(m.id, 'RECEPTIONIST', m.fullName || m.username)}
                        style={{
                          background: 'rgba(193, 255, 28, 0.15)',
                          color: 'var(--primary-accent)',
                          border: '1px solid rgba(193, 255, 28, 0.3)',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        ⚡ Make Receptionist
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromoteUser(m.id, 'ADMIN', m.fullName || m.username)}
                        style={{
                          background: 'rgba(255, 180, 0, 0.15)',
                          color: '#ffb400',
                          border: '1px solid rgba(255, 180, 0, 0.3)',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        👑 Make Admin
                      </button>
                    </div>
                  </div>
                ))}

                {eligibleMembers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                    No gaming members found matching your search.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick KPI Stats Row for Staff */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Total Staff Team</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-accent)', marginTop: '0.25rem' }}>{staffCount}</div>
          </div>

          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>👑 Administrators</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffb400', marginTop: '0.25rem' }}>
              {adminCount}
            </div>
          </div>

          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>⚡ Front Desk Reception</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#00d2ff', marginTop: '0.25rem' }}>{receptionistCount}</div>
          </div>
        </div>

        {/* Main Staff Table Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span>Staff Roster & Access Control</span>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', background: '#060608', padding: '0.25rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {(['ALL_STAFF', 'ADMIN', 'RECEPTIONIST'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStaffRoleFilter(tab)}
                    style={{
                      background: staffRoleFilter === tab ? 'var(--primary-accent)' : 'transparent',
                      color: staffRoleFilter === tab ? '#000' : 'rgba(255,255,255,0.7)',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {tab === 'ALL_STAFF' ? `All Staff (${staffCount})` : tab === 'ADMIN' ? `👑 Admins (${adminCount})` : `⚡ Reception (${receptionistCount})`}
                  </button>
                ))}
              </div>

              {/* Add / Promote Staff Member Button */}
              <button
                type="button"
                onClick={() => {
                  setPromoteSearchText('');
                  setIsPromoteModalOpen(true);
                }}
                style={{
                  background: 'var(--primary-accent)',
                  color: '#000',
                  border: 'none',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>➕ Promote Member to Staff</span>
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              className={styles.input}
              placeholder="Search staff by name, @username, phone number, or email..."
              value={staffSearchText}
              onChange={e => setStaffSearchText(e.target.value)}
            />
          </div>

          {/* Staff Members Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Staff Member</th>
                  <th className={styles.th}>Contact Info</th>
                  <th className={styles.th}>Assigned Role</th>
                  <th className={styles.th}>Account Status</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Role & Permission Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(u => {
                  const isAdmin = u.role === 'ADMIN';
                  const isReception = u.role === 'RECEPTIONIST';

                  return (
                    <tr key={u.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isAdmin ? 'linear-gradient(135deg, #ffb400, #ff8c00)' : 'linear-gradient(135deg, #c1ff1c, #00d2ff)',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 900
                          }}>
                            {(u.fullName || u.username || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{u.fullName || u.name || 'Staff Member'}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>@{u.username || 'user'}</div>
                          </div>
                        </div>
                      </td>

                      <td className={styles.td}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>{u.phone || 'No phone'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{u.email || ''}</div>
                      </td>

                      <td className={styles.td}>
                        <span style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 900,
                          background: isAdmin ? 'rgba(255, 180, 0, 0.15)' : 'rgba(193, 255, 28, 0.15)',
                          color: isAdmin ? '#ffb400' : 'var(--primary-accent)',
                          border: `1px solid ${isAdmin ? 'rgba(255, 180, 0, 0.35)' : 'rgba(193, 255, 28, 0.35)'}`
                        }}>
                          {isAdmin ? '👑 ADMINISTRATOR' : '⚡ RECEPTIONIST'}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: 'rgba(52, 211, 153, 0.15)',
                          color: '#34d399'
                        }}>
                          ACTIVE
                        </span>
                      </td>

                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                          {/* Role Switcher Dropdown */}
                          <select
                            value={u.role || 'RECEPTIONIST'}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            style={{
                              background: '#0c1016',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.15)',
                              padding: '0.35rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="RECEPTIONIST">⚡ Receptionist</option>
                            <option value="ADMIN">👑 Administrator</option>
                          </select>

                          {/* Demote Button */}
                          <button
                            type="button"
                            onClick={() => handleDemoteStaff(u.id, u.fullName || u.username)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                            title="Demote back to regular customer"
                          >
                            Demote to Member
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                      No staff members found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

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

  const handleOpenCustomerDossier = async (customerId: string) => {
    setIsDossierLoading(true);
    try {
      const dossier = await getCustomerFullDossier(customerId);
      if (dossier) {
        setSelectedCustomerDossier(dossier);
        setEditCustomerForm({
          fullName: dossier.fullName || dossier.name || '',
          phone: dossier.phone || '',
          email: dossier.email || '',
          status: dossier.status || 'APPROVED',
          rank: dossier.rank || 'Beginner'
        });
        setDossierActiveTab('OVERVIEW');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load customer dossier.');
    } finally {
      setIsDossierLoading(false);
    }
  };

  const handleSaveCustomerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerDossier) return;
    try {
      await updateCustomerProfile(selectedCustomerDossier.id, editCustomerForm);
      setCustomers(prev => prev.map(c => c.id === selectedCustomerDossier.id ? { ...c, ...editCustomerForm } : c));
      setAllUsers(prev => prev.map(u => u.id === selectedCustomerDossier.id ? { ...u, ...editCustomerForm } : u));
      setSelectedCustomerDossier((prev: any) => prev ? { ...prev, ...editCustomerForm } : null);
      alert('Customer profile details saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update customer profile.');
    }
  };

  const handleAdjustPointsDelta = async (userId: string, delta: number) => {
    try {
      const updated = await adjustUserLoyaltyPoints(userId, delta);
      setCustomers(prev => prev.map(c => c.id === userId ? { ...c, loyaltyPoints: updated.loyaltyPoints, rank: updated.rank } : c));
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, loyaltyPoints: updated.loyaltyPoints, rank: updated.rank } : u));
      if (selectedCustomerDossier && selectedCustomerDossier.id === userId) {
        setSelectedCustomerDossier((prev: any) => prev ? { ...prev, loyaltyPoints: updated.loyaltyPoints, rank: updated.rank } : null);
      }
      if (userPointsModal && userPointsModal.id === userId) {
        setUserPointsModal((prev: any) => prev ? { ...prev, loyaltyPoints: updated.loyaltyPoints, rank: updated.rank } : null);
      }
      alert(`Loyalty points updated! New balance: ${updated.loyaltyPoints} XP (${updated.rank})`);
    } catch (err: any) {
      alert(err.message || 'Failed to update points.');
    }
  };

  const renderCustomersTab = () => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
    const vipCount = customers.filter(c => c.rank === 'Elite' || c.rank === 'Pro' || (c.loyaltyPoints || 0) >= 500).length;
    const totalHoursLogged = customers.reduce((sum, c) => sum + (c.playtimeHours || 0), 0);

    const filteredCustomers = customers.filter(c => {
      if (customerRankFilter !== 'ALL' && c.rank !== customerRankFilter) return false;
      if (customerStatusFilter !== 'ALL' && c.status !== customerStatusFilter) return false;

      if (customerSearchText.trim()) {
        const q = customerSearchText.toLowerCase();
        const matchName = (c.fullName || c.name || '').toLowerCase().includes(q);
        const matchUser = (c.username || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchId = (c.id || '').toLowerCase().includes(q);
        const passId = `udh-${c.username || c.id}`.toLowerCase();
        return matchName || matchUser || matchPhone || matchEmail || matchId || passId.includes(q);
      }
      return true;
    });

    return (
      <>
        {/* Customer Dossier / Full Profile Modal */}
        {selectedCustomerDossier && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{
              backgroundColor: '#12161c',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Modal Header Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #182028 0%, #0d1217 100%)',
                padding: '1.5rem 2rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #c1ff1c, #00d2ff)',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 900
                  }}>
                    {(selectedCustomerDossier.fullName || selectedCustomerDossier.username || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                        {selectedCustomerDossier.fullName || selectedCustomerDossier.name || 'Gamer Profile'}
                      </h2>
                      <span style={{
                        background: 'rgba(193, 255, 28, 0.15)',
                        color: 'var(--primary-accent)',
                        border: '1px solid rgba(193, 255, 28, 0.3)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 900
                      }}>
                        ★ {selectedCustomerDossier.rank || 'Rookie'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px', display: 'flex', gap: '1rem' }}>
                      <span>@{selectedCustomerDossier.username || 'user'}</span>
                      <span style={{ color: '#00d2ff' }}>🪪 Pass ID: UDH-{(selectedCustomerDossier.username || selectedCustomerDossier.id.slice(0, 6)).toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCustomerDossier(null)}
                  style={{ background: '#22272c', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>

              {/* Quick Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', padding: '1.5rem 2rem', background: '#0e1217', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ background: '#161c24', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Loyalty Points</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-accent)', marginTop: '0.2rem' }}>
                    {selectedCustomerDossier.loyaltyPoints || 0} XP
                  </div>
                </div>

                <div style={{ background: '#161c24', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Total Spent</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399', marginTop: '0.2rem' }}>
                    ${(selectedCustomerDossier.totalSpent || 0).toLocaleString()}
                  </div>
                </div>

                <div style={{ background: '#161c24', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Gaming Sessions</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#60a5fa', marginTop: '0.2rem' }}>
                    {selectedCustomerDossier.sessionsCount || selectedCustomerDossier.gameSessions?.length || 0}
                  </div>
                </div>

                <div style={{ background: '#161c24', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Total Playtime</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.2rem' }}>
                    {selectedCustomerDossier.playtimeHours || 0} hrs
                  </div>
                </div>
              </div>

              {/* Loyalty XP Quick Station */}
              <div style={{ padding: '1.25rem 2rem', background: '#141a22', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⭐ Quick Loyalty Points Adjustment
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    Rank dynamically updates as points cross threshold milestones
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {[50, 100, 250, 500].map(pts => (
                    <button
                      key={`add-${pts}`}
                      type="button"
                      onClick={() => handleAdjustPointsDelta(selectedCustomerDossier.id, pts)}
                      style={{
                        background: 'rgba(193, 255, 28, 0.15)',
                        color: 'var(--primary-accent)',
                        border: '1px solid rgba(193, 255, 28, 0.3)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      +{pts} XP
                    </button>
                  ))}
                  {[-50, -100, -250].map(pts => (
                    <button
                      key={`sub-${pts}`}
                      type="button"
                      onClick={() => handleAdjustPointsDelta(selectedCustomerDossier.id, pts)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {pts} XP
                    </button>
                  ))}
                </div>
              </div>

              {/* Dossier Navigation Sub-Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 2rem 0 2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0e1217' }}>
                {(['OVERVIEW', 'SESSIONS', 'ORDERS', 'BOOKINGS', 'EDIT'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDossierActiveTab(tab)}
                    style={{
                      background: dossierActiveTab === tab ? '#1a222c' : 'transparent',
                      color: dossierActiveTab === tab ? 'var(--primary-accent)' : 'rgba(255,255,255,0.6)',
                      border: 'none',
                      borderBottom: dossierActiveTab === tab ? '2px solid var(--primary-accent)' : '2px solid transparent',
                      padding: '0.6rem 1rem',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {tab === 'OVERVIEW' && '👤 Profile Summary'}
                    {tab === 'SESSIONS' && `🎮 Sessions (${selectedCustomerDossier.gameSessions?.length || 0})`}
                    {tab === 'ORDERS' && `🛍️ Purchases (${selectedCustomerDossier.orders?.length || 0})`}
                    {tab === 'BOOKINGS' && `📅 Bookings (${selectedCustomerDossier.bookings?.length || 0})`}
                    {tab === 'EDIT' && '⚙️ Edit Info'}
                  </button>
                ))}
              </div>

              {/* Sub-Tab Content Area */}
              <div style={{ padding: '1.5rem 2rem', overflowY: 'auto' }}>
                {/* 1. OVERVIEW */}
                {dossierActiveTab === 'OVERVIEW' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ background: '#161c24', padding: '1.25rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-accent)', marginBottom: '1rem', textTransform: 'uppercase' }}>
                        Contact & Account Information
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.72rem' }}>Full Name</strong> {selectedCustomerDossier.fullName || selectedCustomerDossier.name || 'Not provided'}</div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.72rem' }}>Gamer Tag / Username</strong> @{selectedCustomerDossier.username || 'user'}</div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.72rem' }}>Phone Number</strong> {selectedCustomerDossier.phone || 'No phone recorded'}</div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.72rem' }}>Email Address</strong> {selectedCustomerDossier.email || 'No email recorded'}</div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.72rem' }}>Account Status</strong> <span style={{ color: selectedCustomerDossier.status === 'APPROVED' ? '#34d399' : '#ffb400', fontWeight: 800 }}>{selectedCustomerDossier.status || 'PENDING'}</span></div>
                      </div>
                    </div>

                    <div style={{ background: '#161c24', padding: '1.25rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#00d2ff', marginBottom: '1rem', textTransform: 'uppercase' }}>
                        VIP Tier & Gaming Milestones
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.72rem' }}>Current Gaming Rank</strong> <span style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>★ {selectedCustomerDossier.rank || 'Beginner'}</span></div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.72rem' }}>Loyalty Balance</strong> {selectedCustomerDossier.loyaltyPoints || 0} XP</div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.72rem' }}>Total Gaming Sessions</strong> {selectedCustomerDossier.sessionsCount || selectedCustomerDossier.gameSessions?.length || 0} completed</div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.72rem' }}>Total Hours in Lounge</strong> {selectedCustomerDossier.playtimeHours || 0} hours</div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '0.72rem' }}>Total Orders Placed</strong> {selectedCustomerDossier.orders?.length || 0} orders</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SESSIONS */}
                {dossierActiveTab === 'SESSIONS' && (
                  <div>
                    {selectedCustomerDossier.gameSessions && selectedCustomerDossier.gameSessions.length > 0 ? (
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Station / Hardware</th>
                            <th className={styles.th}>Start Time</th>
                            <th className={styles.th}>End Time</th>
                            <th className={styles.th}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCustomerDossier.gameSessions.map((s: any) => (
                            <tr key={s.id} className={styles.tr}>
                              <td className={styles.td}><strong>{s.console?.hardwareTitle || s.consoleId}</strong></td>
                              <td className={styles.td} style={{ fontSize: '0.8rem' }}>{new Date(s.startTime).toLocaleString()}</td>
                              <td className={styles.td} style={{ fontSize: '0.8rem' }}>{new Date(s.endTime).toLocaleString()}</td>
                              <td className={styles.td}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '3px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  background: s.status === 'ACTIVE' ? 'rgba(193, 255, 28, 0.15)' : 'rgba(255,255,255,0.05)',
                                  color: s.status === 'ACTIVE' ? 'var(--primary-accent)' : '#fff'
                                }}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                        No session history found for this gamer.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. ORDERS */}
                {dossierActiveTab === 'ORDERS' && (
                  <div>
                    {selectedCustomerDossier.orders && selectedCustomerDossier.orders.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {selectedCustomerDossier.orders.map((ord: any) => (
                          <div key={ord.id} style={{ background: '#161c24', padding: '1rem 1.25rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <div>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Order #{ord.id.slice(-6)} • {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#34d399' }}>
                                ${ord.totalAmount?.toLocaleString()}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                              {ord.items && ord.items.map((it: any) => (
                                <span key={it.id} style={{ background: '#0e1217', padding: '3px 8px', borderRadius: '3px', fontSize: '0.75rem', color: '#fff' }}>
                                  {it.quantity}x {it.name} (${it.price})
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                        No store or snack purchases recorded yet.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. BOOKINGS */}
                {dossierActiveTab === 'BOOKINGS' && (
                  <div>
                    {selectedCustomerDossier.bookings && selectedCustomerDossier.bookings.length > 0 ? (
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Hardware Console</th>
                            <th className={styles.th}>Reserved Start</th>
                            <th className={styles.th}>Reserved End</th>
                            <th className={styles.th}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCustomerDossier.bookings.map((b: any) => (
                            <tr key={b.id} className={styles.tr}>
                              <td className={styles.td}><strong>{b.console?.hardwareTitle || b.consoleId}</strong></td>
                              <td className={styles.td} style={{ fontSize: '0.8rem' }}>{new Date(b.startTime).toLocaleString()}</td>
                              <td className={styles.td} style={{ fontSize: '0.8rem' }}>{new Date(b.endTime).toLocaleString()}</td>
                              <td className={styles.td}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '3px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  background: b.status === 'CONFIRMED' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.05)',
                                  color: b.status === 'CONFIRMED' ? '#34d399' : '#fff'
                                }}>
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                        No console reservations found.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. EDIT PROFILE */}
                {dossierActiveTab === 'EDIT' && (
                  <form onSubmit={handleSaveCustomerProfile} className={styles.formGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Full Name</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={editCustomerForm.fullName}
                        onChange={e => setEditCustomerForm({ ...editCustomerForm, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Phone Number</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={editCustomerForm.phone}
                        onChange={e => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Email Address</label>
                      <input
                        type="email"
                        className={styles.input}
                        value={editCustomerForm.email}
                        onChange={e => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Gaming Rank Tier</label>
                      <select
                        className={styles.select}
                        value={editCustomerForm.rank}
                        onChange={e => setEditCustomerForm({ ...editCustomerForm, rank: e.target.value })}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Rookie">Rookie</option>
                        <option value="Regular">Regular</option>
                        <option value="Pro">Pro</option>
                        <option value="Elite">Elite</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Verification Status</label>
                      <select
                        className={styles.select}
                        value={editCustomerForm.status}
                        onChange={e => setEditCustomerForm({ ...editCustomerForm, status: e.target.value })}
                      >
                        <option value="APPROVED">APPROVED (Verified Gamer)</option>
                        <option value="PENDING">PENDING (Awaiting Review)</option>
                        <option value="REJECTED">REJECTED (Suspended)</option>
                      </select>
                    </div>

                    <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" className={styles.btn}>Save Customer Changes</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top KPI Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Registered Gamers</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginTop: '0.25rem' }}>{totalCustomers}</div>
          </div>

          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Total Customer Revenue</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34d399', marginTop: '0.25rem' }}>
              ${totalRevenue.toLocaleString()}
            </div>
          </div>

          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>VIP High-Tier Gamers</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-accent)', marginTop: '0.25rem' }}>
              {vipCount} <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>(Pro / Elite)</span>
            </div>
          </div>

          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Total Lounge Playtime</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#60a5fa', marginTop: '0.25rem' }}>
              {totalHoursLogged} hrs
            </div>
          </div>
        </div>

        {/* Pending Approvals Alert Queue Card (When pending accounts exist) */}
        {allUsers.filter(u => u.status === 'PENDING').length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 180, 0, 0.15), rgba(255, 140, 0, 0.06))',
            border: '1px solid rgba(255, 180, 0, 0.4)',
            borderRadius: '8px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 30px rgba(255, 180, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🚨</span>
                <div>
                  <strong style={{ color: '#ffb400', fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Pending Account Approvals Queue ({allUsers.filter(u => u.status === 'PENDING').length})
                  </strong>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>
                    Player accounts awaiting administrative approval and ID verification before login access.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table} style={{ background: '#0b0e13', borderRadius: '6px' }}>
                <thead>
                  <tr>
                    <th className={styles.th}>Applicant</th>
                    <th className={styles.th}>Gamer Tag</th>
                    <th className={styles.th}>Contact Phone</th>
                    <th className={styles.th}>Email</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Admin Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.filter(u => u.status === 'PENDING').map(u => (
                    <tr key={u.id} className={styles.tr}>
                      <td className={styles.td}><strong style={{ color: '#fff' }}>{u.fullName || u.name}</strong></td>
                      <td className={styles.td} style={{ color: '#00d2ff' }}>@{u.username}</td>
                      <td className={styles.td}>{u.phone || 'No phone'}</td>
                      <td className={styles.td} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{u.email}</td>
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleApproveUserAction(u.id)}
                            style={{
                              background: '#34d399',
                              color: '#000',
                              border: 'none',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 900,
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectUserAction(u.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            ✕ Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Directory Table Panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span>Customer Profiles & Loyalty CRM</span>

            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={customerRankFilter}
                onChange={e => setCustomerRankFilter(e.target.value)}
                style={{
                  background: '#0c1016',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Rank Tiers</option>
                <option value="Elite">★ Elite</option>
                <option value="Pro">★ Pro</option>
                <option value="Regular">★ Regular</option>
                <option value="Rookie">★ Rookie</option>
                <option value="Beginner">★ Beginner</option>
              </select>

              <select
                value={customerStatusFilter}
                onChange={e => setCustomerStatusFilter(e.target.value)}
                style={{
                  background: '#0c1016',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Verified Only</option>
                <option value="PENDING">Pending Only</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              className={styles.input}
              placeholder="Search by Gamer Tag @username, Full Name, Phone, Email, or Pass ID (e.g. UDH-...)"
              value={customerSearchText}
              onChange={e => setCustomerSearchText(e.target.value)}
            />
          </div>

          {/* Customer Records Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Customer / Gamer</th>
                  <th className={styles.th}>Pass ID</th>
                  <th className={styles.th}>Contact</th>
                  <th className={styles.th}>Rank & XP</th>
                  <th className={styles.th}>Lifetime Spend</th>
                  <th className={styles.th}>Sessions & Playtime</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => {
                  const passId = `UDH-${(c.username || c.id.slice(0, 6)).toUpperCase()}`;
                  return (
                    <tr key={c.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #c1ff1c, #00d2ff)',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 900
                          }}>
                            {(c.fullName || c.username || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{c.fullName || c.name || 'Anonymous Gamer'}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>@{c.username || 'user'}</div>
                          </div>
                        </div>
                      </td>

                      <td className={styles.td}>
                        <span style={{
                          fontFamily: 'monospace',
                          background: 'rgba(0, 210, 255, 0.1)',
                          color: '#00d2ff',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          border: '1px solid rgba(0, 210, 255, 0.25)'
                        }}>
                          {passId}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>{c.phone || 'No phone'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{c.email || ''}</div>
                      </td>

                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{
                            background: 'rgba(193, 255, 28, 0.15)',
                            color: 'var(--primary-accent)',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '0.72rem',
                            fontWeight: 900
                          }}>
                            ★ {c.rank || 'Rookie'}
                          </span>
                          <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{c.loyaltyPoints || 0} XP</strong>
                        </div>
                      </td>

                      <td className={styles.td}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#34d399' }}>
                          ${(c.totalSpend || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                          {c.ordersCount || 0} orders
                        </div>
                      </td>

                      <td className={styles.td}>
                        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                          {c.playtimeHours || 0} hrs
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                          {c.sessionsCount || c.gameSessionsCount || 0} sessions • {c.bookingsCount || 0} bookings
                        </div>
                      </td>

                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ background: 'var(--primary-accent)', color: '#000', fontWeight: 900, fontSize: '0.75rem' }}
                            onClick={() => handleOpenCustomerDossier(c.id)}
                            disabled={isDossierLoading}
                          >
                            🔍 View Details
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ background: '#22272c', color: 'var(--primary-accent)', fontWeight: 800, fontSize: '0.75rem' }}
                            onClick={() => {
                              setUserPointsModal(c);
                              setPointsDeltaInput('');
                            }}
                            title="Adjust Loyalty Points"
                          >
                            ⭐ XP
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                      No customers found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  if (isLoading) {
    return <div style={{ color: 'white', padding: '2rem' }}>Loading Database...</div>;
  }

  const pendingApprovalsCount = allUsers.filter(u => u.status === 'PENDING').length;

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>M80 // Admin</Link>
        </div>
        <nav className={styles.nav}>
          <div
            className={`${styles.navItem} ${activeTab === 'customers' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('customers')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>Customer CRM</span>
            {pendingApprovalsCount > 0 && (
              <span style={{ background: '#ffb400', color: '#000', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900 }}>
                {pendingApprovalsCount}
              </span>
            )}
          </div>
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
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>Staff & Roles</span>
            {pendingApprovalsCount > 0 && (
              <span style={{ background: '#ffb400', color: '#000', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900 }}>
                {pendingApprovalsCount}
              </span>
            )}
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
            {activeTab === 'customers' && 'Customer Profiles & Loyalty CRM'}
            {activeTab === 'analytics' && 'Business Analytics'}
            {activeTab === 'products' && 'Shop Inventory'}
            {activeTab === 'screens' && 'Hardware Configuration'}
            {activeTab === 'games' && 'Game Deployments'}
            {activeTab === 'staff' && 'Staff Management'}
            {activeTab === 'hero' && 'Hero Section'}
          </h1>
        </header>

        <div className={styles.content}>
          {activeTab === 'customers' && renderCustomersTab()}
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
