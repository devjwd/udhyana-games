/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { signOut } from 'next-auth/react';
import styles from './page.module.css';
import { 
  getSnacks, addSnack, updateSnack, deleteSnack, 
  getConsoles, toggleConsoleGame, addConsole, updateConsole, deleteConsole,
  getAllMasterGames, createMasterGame, updateMasterGame, deleteMasterGame,
  getBaseHourlyRate, setBaseHourlyRate,
  getExtraControllerRate, setExtraControllerRate,
  getLoyaltyRates, setLoyaltyRates, adjustUserLoyaltyPoints,
  getProducts, addProduct, updateProduct, deleteProduct,
  getAnalyticsData,
  searchUsers, promoteUserToStaff, getAllUsersWithRoles, updateUserRole,
  adminResetUserPassword, adminCreateUser, deleteUserAccount,
  getAllCustomersWithStats, getCustomerFullDossier, updateCustomerProfile,
  addRetroactiveSession, adjustUserStats, addRetroactiveOrder,
  getHeroTrending, setHeroTrending, getHeroGallery, setHeroGallery, updateHeroGalleryImage,
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
  description?: string | null;
};

export default function BackendAdmin() {
  const [activeTab, setActiveTab] = useState('customers');
  const [isLoading, setIsLoading] = useState(true);

  // Global Rates
  const [baseHourlyRate, setBaseHourlyRateState] = useState(1000);
  const [extraControllerRate, setExtraControllerRateState] = useState(200);
  const [pointsPerHour, setPointsPerHourState] = useState(50);
  const [spendPerPoint, setSpendPerPointState] = useState(10);

  // Products & Snacks State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productSearchText, setProductSearchText] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('peripherals');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);

  // Product Edit Modal State
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editProductForm, setEditProductForm] = useState({ name: '', price: '', category: 'peripherals', imageUrl: '', description: '' });
  const [isUploadingEditProduct, setIsUploadingEditProduct] = useState(false);

  // Snacks State & Edit Modal
  const [snacks, setSnacks] = useState<SnackItem[]>([]);
  const [newSnackName, setNewSnackName] = useState('');
  const [newSnackPrice, setNewSnackPrice] = useState('');
  const [newSnackIcon, setNewSnackIcon] = useState('🥤');
  const [editingSnack, setEditingSnack] = useState<SnackItem | null>(null);
  const [editSnackForm, setEditSnackForm] = useState({ name: '', price: '', icon: '🥤' });

  // Consoles & Stations State & Edit Modal
  const [consoles, setConsoles] = useState<ConsoleItem[]>([]);
  const [selectedConsoleId, setSelectedConsoleId] = useState<string>('');
  const [newConsoleTitle, setNewConsoleTitle] = useState('');
  const [newConsoleRate, setNewConsoleRate] = useState('');
  const [newConsoleSlug, setNewConsoleSlug] = useState('');
  const [newConsoleImage, setNewConsoleImage] = useState('');
  const [newConsoleSpecs, setNewConsoleSpecs] = useState('');
  const [isUploadingConsole, setIsUploadingConsole] = useState(false);
  const [editingConsole, setEditingConsole] = useState<ConsoleItem | null>(null);
  const [editConsoleForm, setEditConsoleForm] = useState({ hardwareTitle: '', hourlyRate: '', specs: '', imagePath: '' });
  const [isUploadingEditConsole, setIsUploadingEditConsole] = useState(false);

  // Master Games State & Edit Modal
  const [masterGames, setMasterGames] = useState<MasterGameItem[]>([]);
  const [newMasterGameName, setNewMasterGameName] = useState('');
  const [gameSearchFilter, setGameSearchFilter] = useState('');
  const [masterLibrarySearch, setMasterLibrarySearch] = useState('');
  const [editingGame, setEditingGame] = useState<MasterGameItem | null>(null);
  const [editGameName, setEditGameName] = useState('');

  // Hero Section State & Modals
  const [heroTrending, setHeroTrendingState] = useState<HeroTrendingSlide[]>([]);
  const [heroGallery, setHeroGalleryState] = useState<HeroGalleryImage[]>([]);
  const [newSlide, setNewSlide] = useState({ badge: 'FEATURED', title: '', subtitle: '', description: '', ctaText: 'PLAY NOW', ctaLink: '/book', imageUrl: '' });
  const [newGalleryImg, setNewGalleryImg] = useState({ imageUrl: '', label: '' });
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroTrendingSlide | null>(null);
  const [isUploadingEditPoster, setIsUploadingEditPoster] = useState(false);
  const [editingGalleryImg, setEditingGalleryImg] = useState<HeroGalleryImage | null>(null);
  const [editGalleryForm, setEditGalleryForm] = useState({ label: '', imageUrl: '' });
  const [isUploadingEditGallery, setIsUploadingEditGallery] = useState(false);

  // Staff Management State & Modals
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [staffRoleFilter, setStaffRoleFilter] = useState<'ALL_STAFF' | 'ADMIN' | 'RECEPTIONIST'>('ALL_STAFF');
  const [staffSearchText, setStaffSearchText] = useState('');
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteSearchText, setPromoteSearchText] = useState('');
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [addStaffForm, setAddStaffForm] = useState({ username: '', fullName: '', phone: '', email: '', password: '', role: 'RECEPTIONIST' });
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [editStaffForm, setEditStaffForm] = useState({ fullName: '', phone: '', email: '', role: 'RECEPTIONIST' });

  // Password Reset Modal (Staff & Customers)
  const [resetPasswordModalUser, setResetPasswordModalUser] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Customers CRM State & Modals
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerDossier, setSelectedCustomerDossier] = useState<any | null>(null);
  const [isDossierLoading, setIsDossierLoading] = useState(false);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [customerRankFilter, setCustomerRankFilter] = useState('ALL');
  const [dossierActiveTab, setDossierActiveTab] = useState<'OVERVIEW' | 'SESSIONS' | 'ORDERS' | 'BOOKINGS' | 'EDIT'>('OVERVIEW');
  const [editCustomerForm, setEditCustomerForm] = useState({ fullName: '', username: '', phone: '', email: '', rank: 'Beginner' });
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [addCustomerForm, setAddCustomerForm] = useState({ username: '', fullName: '', phone: '', email: '', password: '', rank: 'Beginner' });
  const [quickEditCustomer, setQuickEditCustomer] = useState<any | null>(null);
  const [quickEditForm, setQuickEditForm] = useState({ fullName: '', username: '', phone: '', email: '', rank: 'Beginner' });
  const [userPointsModal, setUserPointsModal] = useState<any | null>(null);
  const [pointsDeltaInput, setPointsDeltaInput] = useState('');

  // Retroactive Past Session & Stats Override State
  const [isAddPastSessionModalOpen, setIsAddPastSessionModalOpen] = useState(false);
  const [pastSessionForm, setPastSessionForm] = useState({
    userId: '',
    guestName: '',
    consoleId: '',
    startTime: '',
    durationHours: '1',
    totalPaid: '300',
    paymentMethod: 'cash',
    loyaltyPointsAwarded: '50',
    notes: ''
  });
  const [isSubmittingPastSession, setIsSubmittingPastSession] = useState(false);

  const [isAdjustStatsModalOpen, setIsAdjustStatsModalOpen] = useState(false);
  const [adjustStatsForm, setAdjustStatsForm] = useState({
    userId: '',
    username: '',
    fullName: '',
    playtimeHours: '',
    sessionsCount: '',
    loyaltyPoints: '',
    rank: 'Beginner'
  });
  const [isSubmittingAdjustStats, setIsSubmittingAdjustStats] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
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
      } catch (err) {
        console.error('Failed to load initial admin data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // ── Universal Image File Uploader ──
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

  // ── Products Handlers ──
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProduct = await addProduct({
        name: newProductName,
        price: parseFloat(newProductPrice),
        category: newProductCategory,
        imageUrl: newProductImageUrl,
        description: newProductDesc
      });
      setProducts([newProduct as any, ...products]);
      setNewProductName(''); setNewProductPrice(''); setNewProductImageUrl(''); setNewProductDesc('');
      alert('Product added successfully to inventory!');
    } catch (err: any) {
      alert(err.message || 'Failed to add product');
    }
  };

  const handleOpenEditProduct = (p: ProductItem) => {
    setEditingProduct(p);
    setEditProductForm({
      name: p.name,
      price: p.price.toString(),
      category: p.category || 'peripherals',
      imageUrl: p.imageUrl || '',
      description: p.description || ''
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const updated = await updateProduct(editingProduct.id, {
        name: editProductForm.name,
        price: parseFloat(editProductForm.price),
        category: editProductForm.category,
        imageUrl: editProductForm.imageUrl,
        description: editProductForm.description
      });
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? (updated as any) : p));
      setEditingProduct(null);
      alert('Product updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this product from inventory?')) {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // ── Snacks Handlers ──
  const handleAddSnack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnackName || !newSnackPrice) return;
    try {
      const newSnack = await addSnack({
        name: newSnackName,
        price: parseInt(newSnackPrice),
        icon: newSnackIcon
      });
      setSnacks([...snacks, newSnack]);
      setNewSnackName('');
      setNewSnackPrice('');
      alert('Snack added and synced to live POS!');
    } catch (err: any) {
      alert(err.message || 'Failed to add snack');
    }
  };

  const handleOpenEditSnack = (snack: SnackItem) => {
    setEditingSnack(snack);
    setEditSnackForm({
      name: snack.name,
      price: snack.price.toString(),
      icon: snack.icon || '🥤'
    });
  };

  const handleUpdateSnack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSnack) return;
    try {
      const updated = await updateSnack(editingSnack.id, {
        name: editSnackForm.name,
        price: parseInt(editSnackForm.price),
        icon: editSnackForm.icon
      });
      setSnacks(prev => prev.map(s => s.id === editingSnack.id ? updated : s));
      setEditingSnack(null);
      alert('Snack item updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update snack');
    }
  };

  const handleDeleteSnack = async (id: string) => {
    if (confirm('Delete this snack from quick sale?')) {
      await deleteSnack(id);
      setSnacks(snacks.filter(s => s.id !== id));
    }
  };

  // ── Consoles / Stations Handlers ──
  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    await setBaseHourlyRate(baseHourlyRate);
    await setExtraControllerRate(extraControllerRate);
    alert('Global pricing saved successfully!');
  };

  const handleSaveLoyaltyRates = async (e: React.FormEvent) => {
    e.preventDefault();
    await setLoyaltyRates(pointsPerHour, spendPerPoint);
    alert('Loyalty Points configuration updated and saved!');
  };

  const handleAddConsole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
      alert('Gaming station added successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to add console');
    }
  };

  const handleOpenEditConsole = (c: ConsoleItem) => {
    setEditingConsole(c);
    setEditConsoleForm({
      hardwareTitle: c.hardwareTitle,
      hourlyRate: (c.hourlyRate || baseHourlyRate).toString(),
      specs: c.specs || '',
      imagePath: c.imagePath || ''
    });
  };

  const handleUpdateConsole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConsole) return;
    try {
      const updated = await updateConsole(editingConsole.id, {
        hardwareTitle: editConsoleForm.hardwareTitle,
        hourlyRate: parseFloat(editConsoleForm.hourlyRate),
        specs: editConsoleForm.specs,
        imagePath: editConsoleForm.imagePath
      });
      setConsoles(prev => prev.map(c => c.id === editingConsole.id ? { ...c, ...updated } : c));
      setEditingConsole(null);
      alert('Station hardware & pricing updated!');
    } catch (err: any) {
      alert(err.message || 'Failed to update console');
    }
  };

  const handleDeleteConsole = async (id: string) => {
    if (confirm('Delete this station? This will remove all associated game mappings.')) {
      await deleteConsole(id);
      setConsoles(consoles.filter(c => c.id !== id));
    }
  };

  // ── Master Games Handlers ──
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

  const handleOpenEditGame = (g: MasterGameItem) => {
    setEditingGame(g);
    setEditGameName(g.name);
  };

  const handleUpdateGameName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame || !editGameName.trim()) return;
    try {
      const updated = await updateMasterGame(editingGame.id, editGameName.trim());
      setMasterGames(prev => prev.map(g => g.id === editingGame.id ? { ...g, name: updated.name } : g));
      setConsoles(prev => prev.map(c => ({
        ...c,
        games: c.games.map(g => g.game.name === editingGame.name ? { ...g, game: { ...g.game, name: updated.name } } : g)
      })));
      setEditingGame(null);
      alert('Game title updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to rename game');
    }
  };

  const handleDeleteMasterGame = async (gameId: string, gameName: string) => {
    if (confirm(`Delete "${gameName}" from Master Library? This will uninstall it from all stations.`)) {
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
    await toggleConsoleGame(selectedConsoleId, game);
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
    setNewSlide({ badge: 'FEATURED', title: '', subtitle: '', description: '', ctaText: 'PLAY NOW', ctaLink: '/book', imageUrl: '' });
    alert('Hero poster slide added!');
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

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= heroTrending.length) return;
    const updated = [...heroTrending];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
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
    alert('Feature card added!');
  };

  const handleOpenEditGallery = (img: HeroGalleryImage) => {
    setEditingGalleryImg(img);
    setEditGalleryForm({ label: img.label, imageUrl: img.imageUrl });
  };

  const handleUpdateGalleryImg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryImg) return;
    try {
      const updated = await updateHeroGalleryImage(editingGalleryImg.id, editGalleryForm);
      setHeroGalleryState(updated);
      setEditingGalleryImg(null);
      alert('Feature gallery card updated!');
    } catch (err: any) {
      alert(err.message || 'Failed to update feature card');
    }
  };

  const handleDeleteGalleryImg = async (id: string) => {
    if (!confirm('Delete this gallery image?')) return;
    const updated = heroGallery.filter(g => g.id !== id);
    setHeroGalleryState(updated);
    await setHeroGallery(updated);
  };

  const handleMoveGalleryImg = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= heroGallery.length) return;
    const updated = [...heroGallery];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setHeroGalleryState(updated);
    await setHeroGallery(updated);
  };

  // ── Staff & User Management Handlers ──
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setCustomers(prev => prev.map(c => c.id === userId ? { ...c, role: newRole } : c));
      alert(`User role updated to ${newRole}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to update role.');
    }
  };

  const handleAddStaffDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await adminCreateUser({
        ...addStaffForm,
        status: 'APPROVED'
      });
      setAllUsers([created, ...allUsers]);
      setCustomers([{ ...created, totalSpend: 0, ordersCount: 0, playtimeHours: 0, sessionsCount: 0 }, ...customers]);
      setIsAddStaffModalOpen(false);
      setAddStaffForm({ username: '', fullName: '', phone: '', email: '', password: '', role: 'RECEPTIONIST' });
      alert(`Staff account @${created.username} created successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to create staff account');
    }
  };

  const handleOpenEditStaff = (staff: any) => {
    setEditingStaff(staff);
    setEditStaffForm({
      fullName: staff.fullName || staff.name || '',
      phone: staff.phone || '',
      email: staff.email || '',
      role: staff.role || 'RECEPTIONIST'
    });
  };

  const handleSaveStaffDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      await updateCustomerProfile(editingStaff.id, {
        fullName: editStaffForm.fullName,
        phone: editStaffForm.phone,
        email: editStaffForm.email
      });
      if (editStaffForm.role !== editingStaff.role) {
        await updateUserRole(editingStaff.id, editStaffForm.role);
      }
      setAllUsers(prev => prev.map(u => u.id === editingStaff.id ? { ...u, ...editStaffForm } : u));
      setCustomers(prev => prev.map(c => c.id === editingStaff.id ? { ...c, ...editStaffForm } : c));
      setEditingStaff(null);
      alert('Staff details updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update staff');
    }
  };

  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModalUser || !newPasswordInput.trim()) return;
    try {
      await adminResetUserPassword(resetPasswordModalUser.id, newPasswordInput);
      alert(`Password/PIN for @${resetPasswordModalUser.username || resetPasswordModalUser.fullName} has been reset successfully!`);
      setResetPasswordModalUser(null);
      setNewPasswordInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };



  const handleDeleteUserAction = async (userId: string, userName: string) => {
    if (!confirm(`Permanently delete account for "${userName}"? This cannot be undone.`)) return;
    try {
      await deleteUserAccount(userId);
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      setCustomers(prev => prev.filter(c => c.id !== userId));
      if (selectedCustomerDossier?.id === userId) setSelectedCustomerDossier(null);
      alert('Account deleted successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete account.');
    }
  };

  // ── Customer CRM Handlers ──
  const handleAddCustomerDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await adminCreateUser({
        ...addCustomerForm,
        role: 'USER',
        status: 'APPROVED'
      });
      setAllUsers([created, ...allUsers]);
      setCustomers([{ ...created, totalSpend: 0, ordersCount: 0, playtimeHours: 0, sessionsCount: 0, loyaltyPoints: 0 }, ...customers]);
      setIsAddCustomerModalOpen(false);
      setAddCustomerForm({ username: '', fullName: '', phone: '', email: '', password: '', rank: 'Beginner' });
      alert(`Customer account @${created.username} created successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const handleOpenQuickEditCustomer = (customer: any) => {
    setQuickEditCustomer(customer);
    setQuickEditForm({
      fullName: customer.fullName || customer.name || '',
      username: customer.username || '',
      phone: customer.phone || '',
      email: customer.email || '',
      rank: customer.rank || 'Beginner'
    });
  };

  const handleSaveQuickEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditCustomer) return;
    try {
      const updated = await updateCustomerProfile(quickEditCustomer.id, quickEditForm);
      setCustomers(prev => prev.map(c => c.id === quickEditCustomer.id ? { ...c, ...quickEditForm } : c));
      setAllUsers(prev => prev.map(u => u.id === quickEditCustomer.id ? { ...u, ...quickEditForm } : u));
      if (selectedCustomerDossier?.id === quickEditCustomer.id) {
        setSelectedCustomerDossier((prev: any) => prev ? { ...prev, ...quickEditForm } : null);
      }
      setQuickEditCustomer(null);
      alert('Customer profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update customer profile');
    }
  };

  const handleOpenCustomerDossier = async (customerId: string) => {
    setIsDossierLoading(true);
    try {
      const dossier = await getCustomerFullDossier(customerId);
      if (dossier) {
        setSelectedCustomerDossier(dossier);
        setEditCustomerForm({
          fullName: dossier.fullName || dossier.name || '',
          username: dossier.username || '',
          phone: dossier.phone || '',
          email: dossier.email || '',
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
      if (selectedCustomerDossier?.id === userId) {
        setSelectedCustomerDossier((prev: any) => prev ? { ...prev, loyaltyPoints: updated.loyaltyPoints, rank: updated.rank } : null);
      }
      alert(`Loyalty points updated! New balance: ${updated.loyaltyPoints} XP (${updated.rank})`);
    } catch (err: any) {
      alert(err.message || 'Failed to update points.');
    }
  };

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

  // ── Retroactive / Missed Session & Stats Handlers ──
  const handleOpenLogPastSession = (targetUser?: any) => {
    const defaultConsoleId = consoles.length > 0 ? consoles[0].id : '';
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setPastSessionForm({
      userId: targetUser?.id || '',
      guestName: targetUser?.fullName || targetUser?.name || targetUser?.username || '',
      consoleId: defaultConsoleId,
      startTime: localIso,
      durationHours: '1',
      totalPaid: baseHourlyRate.toString(),
      paymentMethod: 'cash',
      loyaltyPointsAwarded: '50',
      notes: ''
    });
    setIsAddPastSessionModalOpen(true);
  };

  const handleSubmitPastSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastSessionForm.consoleId) {
      alert('Please select a console station.');
      return;
    }
    setIsSubmittingPastSession(true);
    try {
      await addRetroactiveSession({
        userId: pastSessionForm.userId || undefined,
        guestName: pastSessionForm.guestName || undefined,
        consoleId: pastSessionForm.consoleId,
        startTime: pastSessionForm.startTime,
        durationHours: parseFloat(pastSessionForm.durationHours) || 1,
        totalPaid: parseFloat(pastSessionForm.totalPaid) || 0,
        paymentMethod: pastSessionForm.paymentMethod,
        loyaltyPointsAwarded: pastSessionForm.loyaltyPointsAwarded ? parseInt(pastSessionForm.loyaltyPointsAwarded) : undefined,
        notes: pastSessionForm.notes || undefined
      });

      // Refresh customers list & dossier
      const updatedCustomers = await getAllCustomersWithStats();
      setCustomers(updatedCustomers as any);

      if (selectedCustomerDossier && selectedCustomerDossier.id === pastSessionForm.userId) {
        const freshDossier = await getCustomerFullDossier(selectedCustomerDossier.id);
        setSelectedCustomerDossier(freshDossier);
      }

      setIsAddPastSessionModalOpen(false);
      alert('Retroactive past session and revenue recorded successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to log past session.');
    } finally {
      setIsSubmittingPastSession(false);
    }
  };

  const handleOpenAdjustStats = (targetUser: any) => {
    setAdjustStatsForm({
      userId: targetUser.id,
      username: targetUser.username || '',
      fullName: targetUser.fullName || targetUser.name || '',
      playtimeHours: (targetUser.playtimeHours || 0).toString(),
      sessionsCount: (targetUser.sessionsCount || 0).toString(),
      loyaltyPoints: (targetUser.loyaltyPoints || 0).toString(),
      rank: targetUser.rank || 'Beginner'
    });
    setIsAdjustStatsModalOpen(true);
  };

  const handleSubmitAdjustStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustStatsForm.userId) return;
    setIsSubmittingAdjustStats(true);
    try {
      const updated = await adjustUserStats(adjustStatsForm.userId, {
        playtimeHours: parseFloat(adjustStatsForm.playtimeHours) || 0,
        sessionsCount: parseInt(adjustStatsForm.sessionsCount) || 0,
        loyaltyPoints: parseInt(adjustStatsForm.loyaltyPoints) || 0,
        rank: adjustStatsForm.rank
      });

      setCustomers(prev => prev.map(c => c.id === adjustStatsForm.userId ? {
        ...c,
        playtimeHours: updated.playtimeHours,
        sessionsCount: updated.sessionsCount,
        loyaltyPoints: updated.loyaltyPoints,
        rank: updated.rank
      } : c));

      setAllUsers(prev => prev.map(u => u.id === adjustStatsForm.userId ? {
        ...u,
        playtimeHours: updated.playtimeHours,
        sessionsCount: updated.sessionsCount,
        loyaltyPoints: updated.loyaltyPoints,
        rank: updated.rank
      } : u));

      if (selectedCustomerDossier?.id === adjustStatsForm.userId) {
        setSelectedCustomerDossier((prev: any) => prev ? {
          ...prev,
          playtimeHours: updated.playtimeHours,
          sessionsCount: updated.sessionsCount,
          loyaltyPoints: updated.loyaltyPoints,
          rank: updated.rank
        } : null);
      }

      setIsAdjustStatsModalOpen(false);
      alert(`User stats for @${adjustStatsForm.username} successfully updated!`);
    } catch (err: any) {
      alert(err.message || 'Failed to adjust user stats.');
    } finally {
      setIsSubmittingAdjustStats(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER TABS
  // ══════════════════════════════════════════════════════════════

  const renderProductsTab = () => {
    const filteredProducts = products.filter(p => {
      if (productCategoryFilter !== 'ALL' && p.category !== productCategoryFilter) return false;
      if (productSearchText.trim()) {
        const q = productSearchText.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      return true;
    });

    return (
      <>
        {/* Edit Product Modal */}
        {editingProduct && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>✏️ Edit Product Details</h2>
                <button type="button" className={styles.modalClose} onClick={() => setEditingProduct(null)}>✕</button>
              </div>
              <form onSubmit={handleUpdateProduct} className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Product Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editProductForm.name}
                    onChange={e => setEditProductForm({ ...editProductForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Price (PKR)</label>
                  <input
                    type="number"
                    step="1"
                    className={styles.input}
                    value={editProductForm.price}
                    onChange={e => setEditProductForm({ ...editProductForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Category</label>
                  <select
                    className={styles.select}
                    value={editProductForm.category}
                    onChange={e => setEditProductForm({ ...editProductForm, category: e.target.value })}
                  >
                    <option value="peripherals">Peripherals</option>
                    <option value="apparel">Apparel</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Image URL</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editProductForm.imageUrl}
                    onChange={e => setEditProductForm({ ...editProductForm, imageUrl: e.target.value })}
                    placeholder="/images/products/..."
                    required
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>📁 Direct Image Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setIsUploadingEditProduct(true);
                        const url = await uploadImageFile(file);
                        setEditProductForm(prev => ({ ...prev, imageUrl: url }));
                      } catch (err: any) {
                        alert(err.message || 'Upload failed');
                      } finally {
                        setIsUploadingEditProduct(false);
                      }
                    }}
                    style={{ color: '#fff', fontSize: '0.85rem' }}
                  />
                  {isUploadingEditProduct && <span style={{ color: 'var(--primary-accent)', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image...</span>}
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.input}
                    rows={3}
                    value={editProductForm.description}
                    onChange={e => setEditProductForm({ ...editProductForm, description: e.target.value })}
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className={styles.btn}>Save Product Changes</button>
                  <button type="button" onClick={() => setEditingProduct(null)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Snack Modal */}
        {editingSnack && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '480px' }}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>✏️ Edit Snack / Beverage</h2>
                <button type="button" className={styles.modalClose} onClick={() => setEditingSnack(null)}>✕</button>
              </div>
              <form onSubmit={handleUpdateSnack} className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Snack Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editSnackForm.name}
                    onChange={e => setEditSnackForm({ ...editSnackForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Price (PKR)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={editSnackForm.price}
                    onChange={e => setEditSnackForm({ ...editSnackForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>Icon / Emoji</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editSnackForm.icon}
                    onChange={e => setEditSnackForm({ ...editSnackForm, icon: e.target.value })}
                    required
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className={styles.btn}>Save Snack Changes</button>
                  <button type="button" onClick={() => setEditingSnack(null)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Panel 1: Upload Product */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Upload New Shop Product</span>
          </div>
          <form className={styles.formGrid} onSubmit={handleAddProduct}>
            <div className={styles.field}>
              <label className={styles.label}>Product Name</label>
              <input type="text" className={styles.input} value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="e.g. DualSense Edge Controller" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Price (PKR)</label>
              <input type="number" step="1" className={styles.input} value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="18500" required />
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
              <label className={styles.label}>📁 Direct Image File Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setIsUploadingProduct(true);
                    const url = await uploadImageFile(file);
                    setNewProductImageUrl(url);
                  } catch (err: any) {
                    alert(err.message || 'Upload failed');
                  } finally {
                    setIsUploadingProduct(false);
                  }
                }}
                style={{ color: '#fff', fontSize: '0.85rem' }}
              />
              {isUploadingProduct && <span style={{ color: 'var(--primary-accent)', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image to server...</span>}
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Description</label>
              <textarea className={styles.input} rows={3} value={newProductDesc} onChange={e => setNewProductDesc(e.target.value)} placeholder="Product specifications, features..."></textarea>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
              <button type="submit" className={styles.btn}>+ Add Product to Store</button>
            </div>
          </form>
        </div>

        {/* Panel 2: Product Inventory with Search & Edit */}
        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span>Store Inventory ({products.length} Items)</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={productCategoryFilter}
                onChange={e => setProductCategoryFilter(e.target.value)}
                className={styles.select}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              >
                <option value="ALL">All Categories</option>
                <option value="peripherals">Peripherals</option>
                <option value="apparel">Apparel</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <input
              type="text"
              className={styles.input}
              placeholder="Search products by name, category, or description..."
              value={productSearchText}
              onChange={e => setProductSearchText(e.target.value)}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Product</th>
                  <th className={styles.th}>Category</th>
                  <th className={styles.th}>Price</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {p.imageUrl ? (
                          <div style={{ width: '40px', height: '40px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${p.imageUrl})`, borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                        ) : null}
                        <div>
                          <strong style={{ color: '#fff' }}>{p.name}</strong>
                          {p.description && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className={styles.td} style={{ textTransform: 'capitalize' }}>
                      <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>{p.category}</span>
                    </td>
                    <td className={styles.td}><strong style={{ color: '#34d399' }}>PKR {p.price.toLocaleString()}</strong></td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => handleOpenEditProduct(p)}>
                          ✏️ Edit
                        </button>
                        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteProduct(p.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 3: Quick Sale Snacks */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Quick Sale (Snacks & Beverages) Config</span>
          </div>

          <form className={styles.formGrid} onSubmit={handleAddSnack} style={{ marginBottom: '2rem' }}>
            <div className={styles.field}>
              <label className={styles.label}>Snack Name</label>
              <input type="text" className={styles.input} value={newSnackName} onChange={e => setNewSnackName(e.target.value)} placeholder="e.g. Red Bull Energy" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Price (PKR)</label>
              <input type="number" className={styles.input} value={newSnackPrice} onChange={e => setNewSnackPrice(e.target.value)} placeholder="350" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Icon / Emoji</label>
              <input type="text" className={styles.input} value={newSnackIcon} onChange={e => setNewSnackIcon(e.target.value)} placeholder="⚡" required />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
              <button type="submit" className={styles.btn}>+ Add Snack to POS</button>
            </div>
          </form>

          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Icon</th>
                <th className={styles.th}>Snack Name</th>
                <th className={styles.th}>Price</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {snacks.map(snack => (
                <tr key={snack.id} className={styles.tr}>
                  <td className={styles.td} style={{ fontSize: '1.5rem', width: '50px' }}>{snack.icon}</td>
                  <td className={styles.td}><strong>{snack.name}</strong></td>
                  <td className={styles.td}><strong style={{ color: '#34d399' }}>PKR {snack.price}</strong></td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button type="button" onClick={() => handleOpenEditSnack(snack)} className={`${styles.actionBtn} ${styles.actionBtnEdit}`}>
                        ✏️ Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteSnack(snack.id)} className={`${styles.actionBtn} ${styles.actionBtnDelete}`}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderScreensTab = () => (
    <>
      {/* Edit Station / Console Modal */}
      {editingConsole && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>✏️ Edit Gaming Station: {editingConsole.id}</h2>
              <button type="button" className={styles.modalClose} onClick={() => setEditingConsole(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateConsole} className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Hardware Title</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editConsoleForm.hardwareTitle}
                  onChange={e => setEditConsoleForm({ ...editConsoleForm, hardwareTitle: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Hourly Rate (PKR)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={editConsoleForm.hourlyRate}
                  onChange={e => setEditConsoleForm({ ...editConsoleForm, hourlyRate: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Display / Hardware Specs</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editConsoleForm.specs}
                  onChange={e => setEditConsoleForm({ ...editConsoleForm, specs: e.target.value })}
                  placeholder="e.g. 120Hz 4K • DualSense Edge"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Image Path / URL</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editConsoleForm.imagePath}
                  onChange={e => setEditConsoleForm({ ...editConsoleForm, imagePath: e.target.value })}
                />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>📁 Direct Station Image Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setIsUploadingEditConsole(true);
                      const url = await uploadImageFile(file);
                      setEditConsoleForm(prev => ({ ...prev, imagePath: url }));
                    } catch (err: any) {
                      alert(err.message || 'Upload failed');
                    } finally {
                      setIsUploadingEditConsole(false);
                    }
                  }}
                  style={{ color: '#fff', fontSize: '0.85rem' }}
                />
                {isUploadingEditConsole && <span style={{ color: 'var(--primary-accent)', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image...</span>}
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className={styles.btn}>Save Station Changes</button>
                <button type="button" onClick={() => setEditingConsole(null)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Pricing */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Global Hourly Pricing Configuration</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleSaveRate}>
          <div className={styles.field}>
            <label className={styles.label}>Default Base Hourly Rate (PKR)</label>
            <input
              type="number"
              className={styles.input}
              value={baseHourlyRate}
              onChange={(e) => setBaseHourlyRateState(Number(e.target.value))}
              required
            />
          </div>
          <div className={styles.field}>
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
            <span style={{ fontSize: '0.72rem', color: '#7f8388', marginTop: '3px' }}>Default: 10 PKR = 1 Point</span>
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn}>Save Loyalty Rates</button>
          </div>
        </form>
      </div>

      {/* Add Station */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Add New Gaming Station / Screen</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleAddConsole}>
          <div className={styles.field}>
            <label className={styles.label}>Hardware Title</label>
            <input type="text" className={styles.input} value={newConsoleTitle} onChange={e => setNewConsoleTitle(e.target.value)} placeholder="e.g. PS5 Station 7" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Hourly Rate (PKR)</label>
            <input type="number" className={styles.input} value={newConsoleRate} onChange={e => setNewConsoleRate(e.target.value)} placeholder="1000" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Unique ID / Slug</label>
            <input type="text" className={styles.input} value={newConsoleSlug} onChange={e => setNewConsoleSlug(e.target.value)} placeholder="e.g. ps5-7" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Image Path</label>
            <input type="text" className={styles.input} value={newConsoleImage} onChange={e => setNewConsoleImage(e.target.value)} placeholder="/images/products/ps5.png" />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>📁 Direct Image File Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setIsUploadingConsole(true);
                  const url = await uploadImageFile(file);
                  setNewConsoleImage(url);
                } catch (err: any) {
                  alert(err.message || 'Upload failed');
                } finally {
                  setIsUploadingConsole(false);
                }
              }}
              style={{ color: '#fff', fontSize: '0.85rem' }}
            />
            {isUploadingConsole && <span style={{ color: 'var(--primary-accent)', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image...</span>}
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Specs (Short Hardware String)</label>
            <input type="text" className={styles.input} value={newConsoleSpecs} onChange={e => setNewConsoleSpecs(e.target.value)} placeholder="e.g. 120Hz 4K • DualSense Edge" />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn}>Save New Hardware Station</button>
          </div>
        </form>
      </div>

      {/* Active Stations Table with Edit Button */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Manage Active Stations & Consoles ({consoles.length})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Station Title</th>
                <th className={styles.th}>Station ID</th>
                <th className={styles.th}>Hourly Rate</th>
                <th className={styles.th}>Specs / Hardware</th>
                <th className={styles.th}>Installed Games</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {consoles.map(c => (
                <tr key={c.id} className={styles.tr}>
                  <td className={styles.td}><strong>{c.hardwareTitle}</strong></td>
                  <td className={styles.td}><code style={{ color: 'var(--primary-accent)' }}>{c.id}</code></td>
                  <td className={styles.td}><strong style={{ color: '#34d399' }}>PKR {c.hourlyRate || baseHourlyRate}/hr</strong></td>
                  <td className={styles.td} style={{ fontSize: '0.8rem', color: '#7f8388' }}>{c.specs || 'Standard Display'}</td>
                  <td className={styles.td}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', fontWeight: 800 }}>
                      {c.games?.length || 0} games
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => handleOpenEditConsole(c)}>
                        ✏️ Edit
                      </button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteConsole(c.id)}>
                        Delete
                      </button>
                    </div>
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
      </div>
    </>
  );

  const renderGamesTab = () => {
    const selectedConsole = consoles.find(c => c.id === selectedConsoleId);
    const filteredMasterGames = masterGames.filter(g =>
      g.name.toLowerCase().includes(masterLibrarySearch.toLowerCase())
    );
    const filteredCheckboxGames = masterGames.filter(g =>
      g.name.toLowerCase().includes(gameSearchFilter.toLowerCase())
    );

    return (
      <>
        {/* Rename Master Game Modal */}
        {editingGame && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>✏️ Rename Master Game</h2>
                <button type="button" className={styles.modalClose} onClick={() => setEditingGame(null)}>✕</button>
              </div>
              <form onSubmit={handleUpdateGameName} className={styles.formGrid}>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>Game Title</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editGameName}
                    onChange={e => setEditGameName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className={styles.btn}>Save Game Title</button>
                  <button type="button" onClick={() => setEditingGame(null)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Panel 1: Master Game Library CRUD */}
        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span>Master Game Library ({masterGames.length} Titles)</span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Add, rename & manage titles available across the lounge</span>
          </div>

          <form className={styles.formGrid} onSubmit={handleCreateMasterGame} style={{ marginBottom: '1.5rem' }}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label className={styles.label}>Add New Game Title</label>
              <input
                type="text"
                className={styles.input}
                value={newMasterGameName}
                onChange={e => setNewMasterGameName(e.target.value)}
                placeholder="e.g. Black Myth: Wukong, FC 25, GTA VI, Tekken 8"
                required
              />
            </div>
            <div className={styles.field} style={{ justifyContent: 'flex-end', flex: '0 0 auto' }}>
              <button type="submit" className={styles.btn}>
                + Add Game to Library
              </button>
            </div>
          </form>

          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              className={styles.input}
              placeholder="Search library games..."
              value={masterLibrarySearch}
              onChange={e => setMasterLibrarySearch(e.target.value)}
            />
          </div>

          {/* Master Games Table with Rename & Delete */}
          <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Game Title</th>
                  <th className={styles.th}>Installed Stations</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMasterGames.map(game => {
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
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditGame(game)}
                            className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                            title="Rename game"
                          >
                            ✏️ Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMasterGame(game.id, game.name)}
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            title="Delete game from library"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMasterGames.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                      No matching games in library.
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
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-accent)', fontWeight: 800 }}>⚡ Auto-Saves Live to Database</span>
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
              <label className={styles.label}>Filter Station Games</label>
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
            {filteredCheckboxGames.map((game) => {
              const isChecked = selectedConsole?.games?.some(g => g.game.name === game.name) || false;
              return (
                <label
                  key={game.id}
                  className={styles.checkboxLabel}
                  style={{
                    border: isChecked ? '1px solid var(--primary-accent)' : '1px solid rgba(255,255,255,0.08)',
                    background: isChecked ? 'rgba(193, 255, 28, 0.08)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s ease',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px'
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
          </div>
        </div>
      </>
    );
  };

  const renderHeroTab = () => (
    <>
      {/* Edit Left Poster Modal */}
      {editingSlide && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>✏️ Edit Poster Slide</h2>
              <button type="button" className={styles.modalClose} onClick={() => setEditingSlide(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateSlide} className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Badge Label</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editingSlide.badge || ''}
                  onChange={e => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                  placeholder="e.g. NOW OPEN, NEW ARRIVAL"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Poster Main Title</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editingSlide.title}
                  onChange={e => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  placeholder="e.g. UDHYANA"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Subtitle</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editingSlide.subtitle || ''}
                  onChange={e => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                  placeholder="e.g. GAMES, PS5 PRO"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>CTA Button Text</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editingSlide.ctaText}
                  onChange={e => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                  placeholder="e.g. BOOK NOW"
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
                  placeholder="e.g. /book or /shop"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Poster Image URL</label>
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
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.input}
                  rows={2}
                  value={editingSlide.description || ''}
                  onChange={e => setEditingSlide({ ...editingSlide, description: e.target.value })}
                />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>📁 Direct Image File Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !editingSlide) return;
                    try {
                      setIsUploadingEditPoster(true);
                      const url = await uploadImageFile(file);
                      setEditingSlide({ ...editingSlide, imageUrl: url });
                    } catch (err: any) {
                      alert(err.message || 'Upload failed');
                    } finally {
                      setIsUploadingEditPoster(false);
                    }
                  }}
                  style={{ color: '#fff', fontSize: '0.85rem' }}
                />
                {isUploadingEditPoster && <span style={{ color: 'var(--primary-accent)', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image...</span>}
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className={styles.btn}>Save Poster Changes</button>
                <button type="button" onClick={() => setEditingSlide(null)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Right Feature Gallery Card Modal */}
      {editingGalleryImg && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>✏️ Edit Feature Gallery Card</h2>
              <button type="button" className={styles.modalClose} onClick={() => setEditingGalleryImg(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdateGalleryImg} className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Card Label</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editGalleryForm.label}
                  onChange={e => setEditGalleryForm({ ...editGalleryForm, label: e.target.value })}
                  placeholder="e.g. GAMING LOUNGE"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Image URL</label>
                <input
                  type="text"
                  className={styles.input}
                  value={editGalleryForm.imageUrl}
                  onChange={e => setEditGalleryForm({ ...editGalleryForm, imageUrl: e.target.value })}
                  placeholder="/images/hero_side.jpg"
                  required
                />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>📁 Direct Image File Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setIsUploadingEditGallery(true);
                      const url = await uploadImageFile(file);
                      setEditGalleryForm(prev => ({ ...prev, imageUrl: url }));
                    } catch (err: any) {
                      alert(err.message || 'Upload failed');
                    } finally {
                      setIsUploadingEditGallery(false);
                    }
                  }}
                  style={{ color: '#fff', fontSize: '0.85rem' }}
                />
                {isUploadingEditGallery && <span style={{ color: 'var(--primary-accent)', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image...</span>}
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className={styles.btn}>Save Feature Card</button>
                <button type="button" onClick={() => setEditingGalleryImg(null)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Left Posters Manager */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Add Left Hero Poster Slide</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleAddSlide}>
          <div className={styles.field}>
            <label className={styles.label}>Badge Text</label>
            <input type="text" className={styles.input} value={newSlide.badge} onChange={e => setNewSlide({ ...newSlide, badge: e.target.value })} placeholder="e.g. NOW OPEN" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Main Title</label>
            <input type="text" className={styles.input} value={newSlide.title} onChange={e => setNewSlide({ ...newSlide, title: e.target.value })} placeholder="e.g. UDHYANA" required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Subtitle</label>
            <input type="text" className={styles.input} value={newSlide.subtitle} onChange={e => setNewSlide({ ...newSlide, subtitle: e.target.value })} placeholder="e.g. GAMES" />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>CTA Button Text</label>
            <input type="text" className={styles.input} value={newSlide.ctaText} onChange={e => setNewSlide({ ...newSlide, ctaText: e.target.value })} placeholder="e.g. BOOK NOW" required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>CTA Button Link URL</label>
            <input type="text" className={styles.input} value={newSlide.ctaLink} onChange={e => setNewSlide({ ...newSlide, ctaLink: e.target.value })} placeholder="e.g. /book or /shop" required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Poster Image URL</label>
            <input type="text" className={styles.input} value={newSlide.imageUrl} onChange={e => setNewSlide({ ...newSlide, imageUrl: e.target.value })} placeholder="/images/hero_main.jpg" required />
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.input} rows={2} value={newSlide.description} onChange={e => setNewSlide({ ...newSlide, description: e.target.value })} placeholder="The ultimate lounge experience..." />
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>📁 Direct File Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setIsUploadingPoster(true);
                  const url = await uploadImageFile(file);
                  setNewSlide(prev => ({ ...prev, imageUrl: url }));
                } catch (err: any) {
                  alert(err.message || 'Upload failed');
                } finally {
                  setIsUploadingPoster(false);
                }
              }}
              style={{ color: '#fff', fontSize: '0.85rem' }}
            />
            {isUploadingPoster && <span style={{ color: 'var(--primary-accent)', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image to server...</span>}
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn} disabled={isUploadingPoster}>
              + Add Hero Poster Slide
            </button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Current Left Poster Slides ({heroTrending.length})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Order</th>
                <th className={styles.th}>Badge & Title</th>
                <th className={styles.th}>Preview</th>
                <th className={styles.th}>CTA Button</th>
                <th className={styles.th}>Link</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {heroTrending.map((slide, idx) => (
                <tr key={slide.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button type="button" onClick={() => handleMoveSlide(idx, 'up')} disabled={idx === 0} style={{ background: 'transparent', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: idx === 0 ? 'default' : 'pointer' }}>▲</button>
                      <button type="button" onClick={() => handleMoveSlide(idx, 'down')} disabled={idx === heroTrending.length - 1} style={{ background: 'transparent', border: 'none', color: idx === heroTrending.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: idx === heroTrending.length - 1 ? 'default' : 'pointer' }}>▼</button>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--primary-accent)', fontWeight: 800 }}>{slide.badge || 'PROMO'}</div>
                    <strong style={{ color: '#fff' }}>{slide.title} {slide.subtitle}</strong>
                  </td>
                  <td className={styles.td}>
                    <div style={{ width: '50px', height: '35px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${slide.imageUrl})`, borderRadius: '3px', border: '1px solid #22272c' }} />
                  </td>
                  <td className={styles.td}>
                    <span style={{ background: 'var(--primary-accent)', color: '#000', padding: '3px 8px', borderRadius: '3px', fontWeight: 800, fontSize: '0.72rem' }}>
                      {slide.ctaText || 'NONE'}
                    </span>
                  </td>
                  <td className={styles.td} style={{ fontSize: '0.8rem', color: '#7f8388' }}>{slide.ctaLink}</td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                        onClick={() => setEditingSlide(slide)}
                      >
                        ✏️ Edit
                      </button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteSlide(slide.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {heroTrending.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No custom posters configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Feature Cards Manager */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Add Right Feature Card (Gallery)</span>
        </div>
        <form className={styles.formGrid} onSubmit={handleAddGalleryImg}>
          <div className={styles.field}>
            <label className={styles.label}>Feature Card Label</label>
            <input type="text" className={styles.input} value={newGalleryImg.label} onChange={e => setNewGalleryImg({ ...newGalleryImg, label: e.target.value })} placeholder="e.g. DREAMHACK ATLANTA CHAMPS" required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Feature Image URL</label>
            <input type="text" className={styles.input} value={newGalleryImg.imageUrl} onChange={e => setNewGalleryImg({ ...newGalleryImg, imageUrl: e.target.value })} placeholder="/images/champs.jpg" required />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>📁 Direct File Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setIsUploadingGallery(true);
                  const url = await uploadImageFile(file);
                  setNewGalleryImg(prev => ({ ...prev, imageUrl: url }));
                } catch (err: any) {
                  alert(err.message || 'Upload failed');
                } finally {
                  setIsUploadingGallery(false);
                }
              }}
              style={{ color: '#fff', fontSize: '0.85rem' }}
            />
            {isUploadingGallery && <span style={{ color: 'var(--primary-accent)', fontSize: '0.8rem', marginTop: '4px' }}>Uploading image to server...</span>}
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`} style={{ alignItems: 'flex-start' }}>
            <button type="submit" className={styles.btn} disabled={isUploadingGallery}>
              + Add Right Feature Card
            </button>
          </div>
        </form>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span>Current Right Feature Cards ({heroGallery.length})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Order</th>
                <th className={styles.th}>Label</th>
                <th className={styles.th}>Image Preview</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {heroGallery.map((img, idx) => (
                <tr key={img.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button type="button" onClick={() => handleMoveGalleryImg(idx, 'up')} disabled={idx === 0} style={{ background: 'transparent', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: idx === 0 ? 'default' : 'pointer' }}>▲</button>
                      <button type="button" onClick={() => handleMoveGalleryImg(idx, 'down')} disabled={idx === heroGallery.length - 1} style={{ background: 'transparent', border: 'none', color: idx === heroGallery.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: idx === heroGallery.length - 1 ? 'default' : 'pointer' }}>▼</button>
                    </div>
                  </td>
                  <td className={styles.td}><strong>{img.label}</strong></td>
                  <td className={styles.td}>
                    <div style={{ width: '50px', height: '35px', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${img.imageUrl})`, borderRadius: '3px', border: '1px solid #22272c' }} />
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button className={`${styles.actionBtn} ${styles.actionBtnEdit}`} onClick={() => handleOpenEditGallery(img)}>
                        ✏️ Edit
                      </button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnDelete}`} onClick={() => handleDeleteGalleryImg(img.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {heroGallery.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>No custom feature cards configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderStaffTab = () => {
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

    return (
      <>
        {/* Direct Add Staff Member Modal */}
        {isAddStaffModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>➕ Create New Staff Account</h2>
                <button type="button" className={styles.modalClose} onClick={() => setIsAddStaffModalOpen(false)}>✕</button>
              </div>
              <form onSubmit={handleAddStaffDirect} className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addStaffForm.fullName}
                    onChange={e => setAddStaffForm({ ...addStaffForm, fullName: e.target.value })}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Staff Username / ID</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addStaffForm.username}
                    onChange={e => setAddStaffForm({ ...addStaffForm, username: e.target.value })}
                    placeholder="e.g. staff_john"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addStaffForm.phone}
                    onChange={e => setAddStaffForm({ ...addStaffForm, phone: e.target.value })}
                    placeholder="03001234567"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={addStaffForm.email}
                    onChange={e => setAddStaffForm({ ...addStaffForm, email: e.target.value })}
                    placeholder="john@udhyanagames.com"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Login Password / PIN</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={addStaffForm.password}
                    onChange={e => setAddStaffForm({ ...addStaffForm, password: e.target.value })}
                    placeholder="Minimum 4 characters"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Assigned Staff Role</label>
                  <select
                    className={styles.select}
                    value={addStaffForm.role}
                    onChange={e => setAddStaffForm({ ...addStaffForm, role: e.target.value as any })}
                  >
                    <option value="RECEPTIONIST">⚡ Front Desk Receptionist</option>
                    <option value="ADMIN">👑 Full Administrator</option>
                  </select>
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className={styles.btn}>Create Staff Account</button>
                  <button type="button" onClick={() => setIsAddStaffModalOpen(false)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Staff Info Modal */}
        {editingStaff && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>✏️ Edit Staff Details: @{editingStaff.username}</h2>
                <button type="button" className={styles.modalClose} onClick={() => setEditingStaff(null)}>✕</button>
              </div>
              <form onSubmit={handleSaveStaffDetails} className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editStaffForm.fullName}
                    onChange={e => setEditStaffForm({ ...editStaffForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Staff Role</label>
                  <select
                    className={styles.select}
                    value={editStaffForm.role}
                    onChange={e => setEditStaffForm({ ...editStaffForm, role: e.target.value })}
                  >
                    <option value="RECEPTIONIST">⚡ Receptionist</option>
                    <option value="ADMIN">👑 Administrator</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={editStaffForm.phone}
                    onChange={e => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={editStaffForm.email}
                    onChange={e => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className={styles.btn}>Save Staff Changes</button>
                  <button type="button" onClick={() => setEditingStaff(null)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Promote Member to Staff Modal */}
        {isPromoteModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '650px' }}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>➕ Promote Existing Member to Staff</h2>
                <button type="button" className={styles.modalClose} onClick={() => setIsPromoteModalOpen(false)}>✕</button>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Search registered members by name, @username, phone..."
                  value={promoteSearchText}
                  onChange={e => setPromoteSearchText(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
                {eligibleMembers.map(m => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#0c1016',
                      padding: '0.8rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{m.fullName || m.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>@{m.username} • {m.phone || m.email || 'No contact'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRoleChange(m.id, 'RECEPTIONIST');
                          setIsPromoteModalOpen(false);
                        }}
                        className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        ⚡ Make Receptionist
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleRoleChange(m.id, 'ADMIN');
                          setIsPromoteModalOpen(false);
                        }}
                        className={`${styles.actionBtn} ${styles.actionBtnWarn}`}
                        style={{ fontSize: '0.72rem' }}
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

        {/* Quick KPI Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Total Staff</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary-accent)', marginTop: '0.25rem' }}>{staffCount}</div>
          </div>
          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>👑 Administrators</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffb400', marginTop: '0.25rem' }}>{adminCount}</div>
          </div>
          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>⚡ Front Desk Reception</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#00d2ff', marginTop: '0.25rem' }}>{receptionistCount}</div>
          </div>
        </div>

        {/* Staff Table */}
        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span>Staff Roster & Access Control</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    {tab === 'ALL_STAFF' ? `All (${staffCount})` : tab === 'ADMIN' ? `👑 Admins (${adminCount})` : `⚡ Reception (${receptionistCount})`}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(true)}
                className={styles.btn}
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.75rem' }}
              >
                + Add Staff Directly
              </button>

              <button
                type="button"
                onClick={() => {
                  setPromoteSearchText('');
                  setIsPromoteModalOpen(true);
                }}
                className={styles.actionBtn}
                style={{ background: '#1c222a', color: 'var(--primary-accent)', fontSize: '0.75rem' }}
              >
                Promote Member
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <input
              type="text"
              className={styles.input}
              placeholder="Search staff by name, @username, phone, or email..."
              value={staffSearchText}
              onChange={e => setStaffSearchText(e.target.value)}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Staff Member</th>
                  <th className={styles.th}>Contact Info</th>
                  <th className={styles.th}>Assigned Role</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(u => {
                  const isAdmin = u.role === 'ADMIN';
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

                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                            onClick={() => handleOpenEditStaff(u)}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnWarn}`}
                            onClick={() => {
                              setResetPasswordModalUser(u);
                              setNewPasswordInput('');
                            }}
                            title="Reset Staff Password / PIN"
                          >
                            🔑 PIN
                          </button>

                          <select
                            value={u.role || 'RECEPTIONIST'}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            style={{
                              background: '#0c1016',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.15)',
                              padding: '0.35rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="RECEPTIONIST">⚡ Reception</option>
                            <option value="ADMIN">👑 Admin</option>
                            <option value="USER">Player</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderCustomersTab = () => {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
    const vipCount = customers.filter(c => c.rank === 'Elite' || c.rank === 'Pro' || (c.loyaltyPoints || 0) >= 500).length;
    const totalHoursLogged = customers.reduce((sum, c) => sum + (c.playtimeHours || 0), 0);

    const filteredCustomers = customers.filter(c => {
      if (customerRankFilter !== 'ALL' && c.rank !== customerRankFilter) return false;

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
        {/* Direct Add Customer Modal */}
        {isAddCustomerModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>➕ Register Walk-in Customer Account</h2>
                <button type="button" className={styles.modalClose} onClick={() => setIsAddCustomerModalOpen(false)}>✕</button>
              </div>
              <form onSubmit={handleAddCustomerDirect} className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addCustomerForm.fullName}
                    onChange={e => setAddCustomerForm({ ...addCustomerForm, fullName: e.target.value })}
                    placeholder="e.g. Ali Khan"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Gamer Tag / Username</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addCustomerForm.username}
                    onChange={e => setAddCustomerForm({ ...addCustomerForm, username: e.target.value })}
                    placeholder="e.g. alikhan"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={addCustomerForm.phone}
                    onChange={e => setAddCustomerForm({ ...addCustomerForm, phone: e.target.value })}
                    placeholder="03001234567"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={addCustomerForm.email}
                    onChange={e => setAddCustomerForm({ ...addCustomerForm, email: e.target.value })}
                    placeholder="ali@example.com"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Password / PIN</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={addCustomerForm.password}
                    onChange={e => setAddCustomerForm({ ...addCustomerForm, password: e.target.value })}
                    placeholder="Optional or 4-digit PIN"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Starting Rank Tier</label>
                  <select
                    className={styles.select}
                    value={addCustomerForm.rank}
                    onChange={e => setAddCustomerForm({ ...addCustomerForm, rank: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Rookie">Rookie</option>
                    <option value="Regular">Regular</option>
                    <option value="Pro">Pro</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className={styles.btn}>Register Customer</button>
                  <button type="button" onClick={() => setIsAddCustomerModalOpen(false)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Edit Customer Modal */}
        {quickEditCustomer && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>✏️ Edit Customer: @{quickEditCustomer.username}</h2>
                <button type="button" className={styles.modalClose} onClick={() => setQuickEditCustomer(null)}>✕</button>
              </div>
              <form onSubmit={handleSaveQuickEditCustomer} className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={quickEditForm.fullName}
                    onChange={e => setQuickEditForm({ ...quickEditForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Username / Gamer Tag</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={quickEditForm.username}
                    onChange={e => setQuickEditForm({ ...quickEditForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={quickEditForm.phone}
                    onChange={e => setQuickEditForm({ ...quickEditForm, phone: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={quickEditForm.email}
                    onChange={e => setQuickEditForm({ ...quickEditForm, email: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Rank Tier</label>
                  <select
                    className={styles.select}
                    value={quickEditForm.rank}
                    onChange={e => setQuickEditForm({ ...quickEditForm, rank: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Rookie">Rookie</option>
                    <option value="Regular">Regular</option>
                    <option value="Pro">Pro</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className={styles.btn}>Save Customer Changes</button>
                  <button type="button" onClick={() => setQuickEditCustomer(null)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Retroactive / Missed Session Modal */}
        {isAddPastSessionModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '650px' }}>
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>🎮 Log Previous / Missed Session Record</h2>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                    Record past or offline gaming history. Credits playtime hours, session count, loyalty XP, and lounge revenue.
                  </p>
                </div>
                <button type="button" className={styles.modalClose} onClick={() => setIsAddPastSessionModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmitPastSession} className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Select Registered Gamer (Optional)</label>
                  <select
                    className={styles.select}
                    value={pastSessionForm.userId}
                    onChange={e => {
                      const selectedId = e.target.value;
                      const userObj = customers.find(c => c.id === selectedId);
                      setPastSessionForm({
                        ...pastSessionForm,
                        userId: selectedId,
                        guestName: userObj ? (userObj.fullName || userObj.name || userObj.username) : pastSessionForm.guestName
                      });
                    }}
                  >
                    <option value="">-- Guest / Unregistered Walk-in --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.fullName || c.name || c.username} (@{c.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Player / Guest Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={pastSessionForm.guestName}
                    onChange={e => setPastSessionForm({ ...pastSessionForm, guestName: e.target.value })}
                    placeholder="e.g. Hamza / Guest Player"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Station Hardware</label>
                  <select
                    className={styles.select}
                    value={pastSessionForm.consoleId}
                    onChange={e => setPastSessionForm({ ...pastSessionForm, consoleId: e.target.value })}
                    required
                  >
                    {consoles.map(c => (
                      <option key={c.id} value={c.id}>{c.hardwareTitle}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Session Date &amp; Start Time</label>
                  <input
                    type="datetime-local"
                    className={styles.input}
                    value={pastSessionForm.startTime}
                    onChange={e => setPastSessionForm({ ...pastSessionForm, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    className={styles.input}
                    value={pastSessionForm.durationHours}
                    onChange={e => {
                      const dur = parseFloat(e.target.value) || 1;
                      const calcPaid = Math.round(dur * baseHourlyRate);
                      const calcXp = Math.floor(dur * 50) + Math.floor(calcPaid / 10);
                      setPastSessionForm({
                        ...pastSessionForm,
                        durationHours: e.target.value,
                        totalPaid: calcPaid.toString(),
                        loyaltyPointsAwarded: calcXp.toString()
                      });
                    }}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Total Amount Paid (PKR)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={pastSessionForm.totalPaid}
                    onChange={e => setPastSessionForm({ ...pastSessionForm, totalPaid: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Payment Method</label>
                  <select
                    className={styles.select}
                    value={pastSessionForm.paymentMethod}
                    onChange={e => setPastSessionForm({ ...pastSessionForm, paymentMethod: e.target.value })}
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card / POS</option>
                    <option value="account">📱 Account / Transfer</option>
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Loyalty XP Points to Credit</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={pastSessionForm.loyaltyPointsAwarded}
                    onChange={e => setPastSessionForm({ ...pastSessionForm, loyaltyPointsAwarded: e.target.value })}
                    placeholder="Auto-calculated from playtime & spend"
                  />
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label className={styles.label}>Game Played / Notes (Optional)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={pastSessionForm.notes}
                    onChange={e => setPastSessionForm({ ...pastSessionForm, notes: e.target.value })}
                    placeholder="e.g. Tekken 8 match, EA FC 25 tournament, missed offline session"
                  />
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                  <button type="submit" className={styles.btn} disabled={isSubmittingPastSession} style={{ background: '#10b981', color: '#000', fontWeight: 800 }}>
                    {isSubmittingPastSession ? 'Recording...' : '💾 Record Past Session & Revenue'}
                  </button>
                  <button type="button" onClick={() => setIsAddPastSessionModalOpen(false)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Direct Stats Override Modal */}
        {isAdjustStatsModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '550px' }}>
              <div className={styles.modalHeader}>
                <div>
                  <h2 className={styles.modalTitle}>⚡ Direct Stats Override</h2>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                    Manually adjust playtime hours, total session visits, loyalty XP, and rank for @{adjustStatsForm.username}.
                  </p>
                </div>
                <button type="button" className={styles.modalClose} onClick={() => setIsAdjustStatsModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleSubmitAdjustStats} className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Total Playtime (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className={styles.input}
                    value={adjustStatsForm.playtimeHours}
                    onChange={e => setAdjustStatsForm({ ...adjustStatsForm, playtimeHours: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Sessions Logged (Count)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={adjustStatsForm.sessionsCount}
                    onChange={e => setAdjustStatsForm({ ...adjustStatsForm, sessionsCount: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Loyalty Points (XP)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={adjustStatsForm.loyaltyPoints}
                    onChange={e => setAdjustStatsForm({ ...adjustStatsForm, loyaltyPoints: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Rank Tier</label>
                  <select
                    className={styles.select}
                    value={adjustStatsForm.rank}
                    onChange={e => setAdjustStatsForm({ ...adjustStatsForm, rank: e.target.value })}
                  >
                    <option value="Beginner">Beginner (0+ XP)</option>
                    <option value="Rookie">Rookie (200+ XP)</option>
                    <option value="Regular">Regular (500+ XP)</option>
                    <option value="Pro">Pro (1000+ XP)</option>
                    <option value="Elite">Elite (2000+ XP)</option>
                  </select>
                </div>

                <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                  <button type="submit" className={styles.btn} disabled={isSubmittingAdjustStats} style={{ background: '#00d2ff', color: '#000', fontWeight: 800 }}>
                    {isSubmittingAdjustStats ? 'Saving...' : '💾 Save Adjusted Gamer Stats'}
                  </button>
                  <button type="button" onClick={() => setIsAdjustStatsModalOpen(false)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Dossier / Full Profile Modal */}
        {selectedCustomerDossier && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '900px' }}>
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #c1ff1c, #00d2ff)',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    fontWeight: 900
                  }}>
                    {(selectedCustomerDossier.fullName || selectedCustomerDossier.username || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className={styles.modalTitle} style={{ color: '#fff' }}>
                      {selectedCustomerDossier.fullName || selectedCustomerDossier.name || 'Gamer Profile'}
                    </h2>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                      @{selectedCustomerDossier.username} • 🪪 Pass ID: <span style={{ color: '#00d2ff' }}>UDH-{(selectedCustomerDossier.username || selectedCustomerDossier.id.slice(0, 6)).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <button type="button" className={styles.modalClose} onClick={() => setSelectedCustomerDossier(null)}>✕</button>
              </div>

              {/* Quick Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#0e1217', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Loyalty XP</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--primary-accent)', marginTop: '0.2rem' }}>
                    {selectedCustomerDossier.loyaltyPoints || 0} XP
                  </div>
                </div>
                <div style={{ background: '#0e1217', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Total Spent</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#34d399', marginTop: '0.2rem' }}>
                    PKR {(selectedCustomerDossier.totalSpent || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{ background: '#0e1217', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Sessions</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#60a5fa', marginTop: '0.2rem' }}>
                    {selectedCustomerDossier.sessionsCount || selectedCustomerDossier.gameSessions?.length || 0}
                  </div>
                </div>
                <div style={{ background: '#0e1217', padding: '0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>Playtime</span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.2rem' }}>
                    {selectedCustomerDossier.playtimeHours || 0} hrs
                  </div>
                </div>
              </div>

              {/* Dossier Navigation Sub-Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.25rem' }}>
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
                      padding: '0.5rem 0.8rem',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {tab === 'OVERVIEW' && '👤 Profile'}
                    {tab === 'SESSIONS' && `🎮 Sessions (${selectedCustomerDossier.gameSessions?.length || 0})`}
                    {tab === 'ORDERS' && `🛍️ Orders (${selectedCustomerDossier.orders?.length || 0})`}
                    {tab === 'BOOKINGS' && `📅 Bookings (${selectedCustomerDossier.bookings?.length || 0})`}
                    {tab === 'EDIT' && '⚙️ Edit Details'}
                  </button>
                ))}
              </div>

              {/* Sub-Tab Content */}
              <div>
                {dossierActiveTab === 'OVERVIEW' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#0e1217', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-accent)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Contact Info</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)' }}>Full Name:</strong> {selectedCustomerDossier.fullName || 'Not set'}</div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)' }}>Username:</strong> @{selectedCustomerDossier.username}</div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)' }}>Phone:</strong> {selectedCustomerDossier.phone || 'No phone'}</div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)' }}>Email:</strong> {selectedCustomerDossier.email || 'No email'}</div>
                      </div>
                    </div>

                    <div style={{ background: '#0e1217', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00d2ff', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Loyalty & Level</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem' }}>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)' }}>Rank Tier:</strong> <span style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>★ {selectedCustomerDossier.rank}</span></div>
                        <div><strong style={{ color: 'rgba(255,255,255,0.5)' }}>Points:</strong> {selectedCustomerDossier.loyaltyPoints || 0} XP</div>
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
                          {[50, 100, 250].map(p => (
                            <button key={p} type="button" onClick={() => handleAdjustPointsDelta(selectedCustomerDossier.id, p)} className={`${styles.actionBtn} ${styles.actionBtnSuccess}`} style={{ fontSize: '0.7rem' }}>+{p} XP</button>
                          ))}
                          {[-50, -100].map(p => (
                            <button key={p} type="button" onClick={() => handleAdjustPointsDelta(selectedCustomerDossier.id, p)} className={`${styles.actionBtn} ${styles.actionBtnDelete}`} style={{ fontSize: '0.7rem' }}>{p} XP</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenLogPastSession(selectedCustomerDossier)}
                        className={styles.btn}
                        style={{ background: '#10b981', color: '#000', fontWeight: 800, fontSize: '0.78rem' }}
                      >
                        ➕ Log Past / Missed Session for this Gamer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAdjustStats(selectedCustomerDossier)}
                        className={styles.btn}
                        style={{ background: '#00d2ff', color: '#000', fontWeight: 800, fontSize: '0.78rem' }}
                      >
                        ⚡ Direct Stats Override (Hours, XP, Visits)
                      </button>
                    </div>
                  </div>
                )}

                {dossierActiveTab === 'SESSIONS' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                        Total Recorded Sessions: <strong>{selectedCustomerDossier.gameSessions?.length || 0}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenLogPastSession(selectedCustomerDossier)}
                        className={styles.btn}
                        style={{ background: '#10b981', color: '#000', fontSize: '0.72rem', padding: '0.35rem 0.75rem', fontWeight: 800 }}
                      >
                        + Add Past Session Record
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Station</th>
                            <th className={styles.th}>Start</th>
                            <th className={styles.th}>End</th>
                            <th className={styles.th}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCustomerDossier.gameSessions?.map((s: any) => (
                            <tr key={s.id} className={styles.tr}>
                              <td className={styles.td}><strong>{s.console?.hardwareTitle || s.consoleId}</strong></td>
                              <td className={styles.td} style={{ fontSize: '0.8rem' }}>{new Date(s.startTime).toLocaleString()}</td>
                              <td className={styles.td} style={{ fontSize: '0.8rem' }}>{new Date(s.endTime).toLocaleString()}</td>
                              <td className={styles.td}><span style={{ color: s.status === 'ACTIVE' ? 'var(--primary-accent)' : '#fff', fontWeight: 800, fontSize: '0.75rem' }}>{s.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {dossierActiveTab === 'ORDERS' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedCustomerDossier.orders?.map((ord: any) => (
                      <div key={ord.id} style={{ background: '#0e1217', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Order #{ord.id.slice(-6)} • {new Date(ord.createdAt).toLocaleDateString()}</span>
                          <strong style={{ color: '#34d399' }}>PKR {ord.totalAmount?.toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                          {ord.items?.map((it: any) => (
                            <span key={it.id} style={{ background: '#182028', padding: '2px 6px', borderRadius: '3px', fontSize: '0.72rem', color: '#fff' }}>
                              {it.quantity}x {it.name} (PKR {it.price})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {dossierActiveTab === 'BOOKINGS' && (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Station</th>
                        <th className={styles.th}>Reserved Start</th>
                        <th className={styles.th}>Reserved End</th>
                        <th className={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomerDossier.bookings?.map((b: any) => (
                        <tr key={b.id} className={styles.tr}>
                          <td className={styles.td}><strong>{b.console?.hardwareTitle || b.consoleId}</strong></td>
                          <td className={styles.td} style={{ fontSize: '0.8rem' }}>{new Date(b.startTime).toLocaleString()}</td>
                          <td className={styles.td} style={{ fontSize: '0.8rem' }}>{new Date(b.endTime).toLocaleString()}</td>
                          <td className={styles.td}><span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.75rem' }}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

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
                      <label className={styles.label}>Username</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={editCustomerForm.username}
                        onChange={e => setEditCustomerForm({ ...editCustomerForm, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Phone</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={editCustomerForm.phone}
                        onChange={e => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Email</label>
                      <input
                        type="email"
                        className={styles.input}
                        value={editCustomerForm.email}
                        onChange={e => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Rank</label>
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

                    <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button type="submit" className={styles.btn}>Save Customer Profile</button>
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
              PKR {totalRevenue.toLocaleString()}
            </div>
          </div>

          <div style={{ background: '#0E0F14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 800 }}>VIP Gamers</span>
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



        {/* Main Customer CRM Table */}
        <div className={styles.panel}>
          <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span>Customer Profiles & Loyalty CRM</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={customerRankFilter}
                onChange={e => setCustomerRankFilter(e.target.value)}
                className={styles.select}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              >
                <option value="ALL">All Rank Tiers</option>
                <option value="Elite">★ Elite</option>
                <option value="Pro">★ Pro</option>
                <option value="Regular">★ Regular</option>
                <option value="Rookie">★ Rookie</option>
                <option value="Beginner">★ Beginner</option>
              </select>

              <button
                type="button"
                onClick={() => handleOpenLogPastSession()}
                className={styles.btn}
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.75rem', background: '#10b981', color: '#000', fontWeight: 800 }}
              >
                ➕ Log Past Session
              </button>

              <button
                type="button"
                onClick={() => setIsAddCustomerModalOpen(true)}
                className={styles.btn}
                style={{ padding: '0.45rem 0.8rem', fontSize: '0.75rem' }}
              >
                + Register Customer
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <input
              type="text"
              className={styles.input}
              placeholder="Search by Gamer Tag @username, Full Name, Phone, Email, or Pass ID (e.g. UDH-...)"
              value={customerSearchText}
              onChange={e => setCustomerSearchText(e.target.value)}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Customer / Gamer</th>
                  <th className={styles.th}>Pass ID</th>
                  <th className={styles.th}>Contact</th>
                  <th className={styles.th}>Rank & XP</th>
                  <th className={styles.th}>Spend</th>
                  <th className={styles.th}>Playtime</th>
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
                        <span style={{ fontFamily: 'monospace', background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', padding: '3px 7px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(0, 210, 255, 0.25)' }}>
                          {passId}
                        </span>
                      </td>

                      <td className={styles.td}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>{c.phone || 'No phone'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{c.email || ''}</div>
                      </td>

                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ background: 'rgba(193, 255, 28, 0.15)', color: 'var(--primary-accent)', padding: '2px 6px', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 900 }}>
                            ★ {c.rank || 'Rookie'}
                          </span>
                          <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{c.loyaltyPoints || 0} XP</strong>
                        </div>
                      </td>

                      <td className={styles.td}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#34d399' }}>
                          PKR {(c.totalSpend || 0).toLocaleString()}
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
                          {c.sessionsCount || c.gameSessionsCount || 0} sessions
                        </div>
                      </td>

                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleOpenLogPastSession(c)}
                            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                            title="Log Past / Missed Session for this Gamer"
                          >
                            🎮 Session
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleOpenAdjustStats(c)}
                            style={{ background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.3)' }}
                            title="Directly Edit Hours, XP & Session Stats"
                          >
                            ⚡ Stats
                          </button>

                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                            onClick={() => handleOpenQuickEditCustomer(c)}
                            title="Quick Edit Profile"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnWarn}`}
                            onClick={() => {
                              setResetPasswordModalUser(c);
                              setNewPasswordInput('');
                            }}
                            title="Reset Customer Password / PIN"
                          >
                            🔑
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ background: 'var(--primary-accent)', color: '#000', fontWeight: 900 }}
                            onClick={() => handleOpenCustomerDossier(c.id)}
                            disabled={isDossierLoading}
                            title="Open full profile dossier"
                          >
                            🔍 Details
                          </button>

                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            onClick={() => handleDeleteUserAction(c.id, c.fullName || c.username)}
                            title="Delete Account"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderAnalyticsTab = () => (
    <AnalyticsTab
      analytics={analytics}
      onTimeframeChange={handleTimeframeChange}
      isLoading={isAnalyticsLoading}
    />
  );

  if (isLoading) {
    return <div style={{ color: 'white', padding: '3rem', textAlign: 'center', background: '#060608', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Udhyana Games Admin Database...</div>;
  }



  return (
    <div className={styles.container}>
      {/* Universal Password Reset Modal */}
      {resetPasswordModalUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '440px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🔑 Reset Password / PIN</h2>
              <button type="button" className={styles.modalClose} onClick={() => setResetPasswordModalUser(null)}>✕</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Set a new login password or PIN for <strong>@{resetPasswordModalUser.username || resetPasswordModalUser.fullName}</strong>.
            </p>
            <form onSubmit={handleExecutePasswordReset} className={styles.formGrid}>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>New Password / PIN</label>
                <input
                  type="password"
                  className={styles.input}
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  placeholder="Minimum 4 characters"
                  required
                  autoFocus
                />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className={styles.btn}>Save New Password</button>
                <button type="button" onClick={() => setResetPasswordModalUser(null)} className={styles.actionBtn} style={{ background: '#22272c', color: '#fff' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            UDHYANA GAMES // Admin
          </Link>
        </div>
        <nav className={styles.nav}>
          <div
            className={`${styles.navItem} ${activeTab === 'customers' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('customers')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>👤 Customer CRM</span>

          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Analytics & Revenue
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'products' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('products')}
          >
            🛍️ Product & Snacks
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'screens' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('screens')}
          >
            🖥️ Station Hardware
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'games' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('games')}
          >
            🎮 Games Library
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'staff' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('staff')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>👥 Staff & Roles</span>
          </div>
          <div
            className={`${styles.navItem} ${activeTab === 'hero' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('hero')}
          >
            🖼️ Hero Section
          </div>
        </nav>
      </aside>

      {/* Main Area */}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>
            {activeTab === 'customers' && 'Customer Profiles & Loyalty CRM'}
            {activeTab === 'analytics' && 'Business Analytics & Lounge Intelligence'}
            {activeTab === 'products' && 'Product & Snack Inventory Management'}
            {activeTab === 'screens' && 'Hardware Stations & Pricing Configuration'}
            {activeTab === 'games' && 'Master Games Library & Deployments'}
            {activeTab === 'staff' && 'Staff Roster & Permissions'}
            {activeTab === 'hero' && 'Website Hero Posters & Feature Cards'}
          </h1>

          {/* Quick Header Actions */}
          <div className={styles.headerActions}>
            <Link href="/reception" className={styles.headerBtn} target="_blank">
              ⚡ Reception Desk
            </Link>
            <Link href="/" className={styles.headerBtn} target="_blank">
              🌐 Live Site
            </Link>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{ background: 'rgba(255, 77, 77, 0.1)', borderColor: 'rgba(255, 77, 77, 0.3)', color: '#ff6b6b', cursor: 'pointer' }}
            >
              🚪 Sign Out
            </button>
          </div>
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
