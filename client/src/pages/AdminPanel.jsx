import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getMediaUrl } from '../services/api';
import {
  ShieldCheck, Users, User, Building2, Clock, CheckCircle, XCircle,
  Search, Eye, Trash2, Check, X, PauseCircle, PlayCircle, RefreshCw, Layers,
  Film, Image as ImageIcon, Upload, Plus, ExternalLink, Sparkles,
  LayoutDashboard, Package, Menu, Edit, ArrowLeft, AlertCircle,
  ShoppingCart, Truck, FileText, QrCode, Calculator, Percent, Tag, EyeOff, Info, ArrowRightLeft, ToggleLeft, ToggleRight,
  FolderTree, Battery, BatteryCharging, Cable, Headphones, Shield, Smartphone, Cpu, Zap, Wallet
} from 'lucide-react';
import { AdminCreateOffers } from '../components/rewards/AdminCreateOffers';
import { AdminRewardsPayouts } from '../components/rewards/AdminRewardsPayouts';

export const AdminPanel = () => {
  const { user, navigate, logout } = useAuth();

  // Metrics state
  const [metrics, setMetrics] = useState({
    customers: { total: 0, active: 0, suspended: 0 },
    distributors: { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 }
  });

  // Core navigation & view state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'pending' | 'distributors' | 'customers' | 'all' | 'products' | 'advertisements'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Sync activeTab with URL query parameter e.g. /admin?tab=products
  useEffect(() => {
    const syncTabFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['overview', 'orders', 'pending', 'distributors', 'customers', 'all', 'products', 'advertisements', 'categories', 'create-offers', 'rewards-payouts'].includes(tab)) {
          setActiveTab(tab);
        }
      } catch (e) {}
    };

    syncTabFromUrl();

    const handleRouteChange = (e) => {
      try {
        const path = e.detail?.path || '';
        if (path.includes('?')) {
          const params = new URLSearchParams(path.split('?')[1]);
          const tab = params.get('tab');
          if (tab && ['overview', 'orders', 'pending', 'distributors', 'customers', 'all', 'products', 'advertisements', 'categories', 'create-offers', 'rewards-payouts'].includes(tab)) {
            setActiveTab(tab);
          }
        }
      } catch (err) {}
    };

    window.addEventListener('mws_route_change', handleRouteChange);
    return () => window.removeEventListener('mws_route_change', handleRouteChange);
  }, []);

  // Orders management state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderUserType, setOrderUserType] = useState('All'); // 'All' | 'Customer' | 'Distributor'
  const [orderFilterStatus, setOrderFilterStatus] = useState('All');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [viewProofModal, setViewProofModal] = useState(null); // Order object for viewing payment proof image

  // User management state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendModalUser, setSuspendModalUser] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  // Product management & authority state
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productFilterVisibility, setProductFilterVisibility] = useState('All');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStockFilter, setProductStockFilter] = useState('All');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingProductImg, setUploadingProductImg] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Displays',
    brand: 'MWS Eagle',
    sku: '',
    description: '',
    specifications: '',
    imageUrl: '',
    badge: 'Bestseller',
    inStock: 1,
    productStatus: 'Active',
    // Customer Portal Pricing & Visibility
    showOnCustomerPortal: true,
    customerPricingMode: 'auto', // 'auto' | 'manual'
    customerOriginalPrice: 2000,
    customerDiscount: 10,
    customerPrice: 1800,
    // Distributor Portal Pricing & Visibility
    showOnDistributorPortal: true,
    distributorPricingMode: 'auto', // 'auto' | 'manual'
    distributorOriginalPrice: 1500,
    distributorDiscount: 25,
    distributorPrice: 1125,
    targetVisibility: 'Both'
  });

  // Advertisement Board State
  const [advertisements, setAdvertisements] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [creatingAd, setCreatingAd] = useState(false);
  const [adForm, setAdForm] = useState({
    title: '',
    description: '',
    mediaType: 'video',
    mediaUrl: '',
    badgeText: 'FEATURED DEAL',
    linkUrl: '/login?mode=signup&role=Distributor',
    orderIndex: 0
  });

  // Category management & taxonomy state
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('All'); // 'All' | 'Active' | 'Inactive'
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [uploadingCategoryImg, setUploadingCategoryImg] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    imageUrl: ''
  });

  const categoryIconMap = {
    Zap,
    Battery,
    BatteryCharging,
    Cable,
    Headphones,
    Shield,
    Smartphone,
    Cpu,
    Tag,
    Package,
    Layers,
    Sparkles,
    FolderTree
  };

  const getCategoryIconComponent = (iconName) => {
    return categoryIconMap[iconName] || Tag;
  };

  const AVAILABLE_CATEGORY_ICONS = [
    { id: 'Zap', label: 'Charging / Fast Charge' },
    { id: 'Battery', label: 'Battery / Power' },
    { id: 'BatteryCharging', label: 'Power Supply' },
    { id: 'Cable', label: 'Cables & USB' },
    { id: 'Headphones', label: 'Audio & Sound' },
    { id: 'Shield', label: 'Cases & Protection' },
    { id: 'Smartphone', label: 'Displays & Screens' },
    { id: 'Cpu', label: 'Hardware & Chips' },
    { id: 'Tag', label: 'Accessories' },
    { id: 'Package', label: 'Bundles & Kits' },
    { id: 'Layers', label: 'Modules & Parts' },
    { id: 'Sparkles', label: 'Featured & Deals' },
    { id: 'FolderTree', label: 'Taxonomy Group' }
  ];

  // Dynamic categories list from database (with fallback to defaults)
  const activeCategoryList = (Array.isArray(categories) && categories.length > 0)
    ? categories.map(c => c && c.name).filter(Boolean)
    : [
        'Charging',
        'Power',
        'Cables',
        'Audio',
        'Protection',
        'Displays',
        'Batteries',
        'Chargers',
        'Connectors',
        'Other mobile accessories'
      ];

  const allCategoryList = (Array.isArray(categories) && categories.length > 0)
    ? Array.from(new Set(categories.map(c => c && c.name).filter(Boolean)))
    : activeCategoryList;

  // Backward compatibility alias for any existing reference
  const productCategories = allCategoryList;

  const notify = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 5000);
  };

  // Load metrics & users
  const loadUserData = async () => {
    setLoadingUsers(true);
    try {
      const [mRes, uRes] = await Promise.all([
        api.admin.getMetrics(),
        api.admin.getUsers({ userType: typeFilter, accountStatus: statusFilter, search: searchTerm })
      ]);
      if (mRes && mRes.success && mRes.metrics) setMetrics(mRes.metrics);
      if (uRes && uRes.success && Array.isArray(uRes.users)) setUsers(uRes.users);
    } catch (err) {
      console.error('Error loading admin user data:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load products catalog
  const loadProductData = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.products.getVisibleProducts('Admin');
      if (res && res.success && Array.isArray(res.products)) setAllProducts(res.products);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load advertisements
  const loadAdvertisementData = async () => {
    setLoadingAds(true);
    try {
      const res = await api.advertisements.getAll();
      if (res && res.success && Array.isArray(res.advertisements)) setAdvertisements(res.advertisements);
    } catch (err) {
      console.error('Failed to load ads:', err);
    } finally {
      setLoadingAds(false);
    }
  };

  // Load customer orders
  const loadOrderData = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.orders.getAllAdmin();
      if (res && res.success && Array.isArray(res.orders)) setOrders(res.orders);
    } catch (err) {
      console.error('Failed to load orders in admin:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load categories catalog
  const loadCategoryData = async () => {
    setLoadingCategories(true);
    try {
      const res = await api.categories.getAll(true);
      if (res && res.success && Array.isArray(res.categories)) setCategories(res.categories);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const slugify = (text) => {
    return (text || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  };

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      imageUrl: ''
    });
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || '',
      imageUrl: cat.imageUrl || ''
    });
    setCategoryModalOpen(true);
  };

  const handleCategoryImgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('imageFile', file);

    setUploadingCategoryImg(true);
    try {
      const res = await api.categories.uploadImage(formData);
      if (res.success && res.url) {
        setCategoryForm(prev => ({
          ...prev,
          imageUrl: res.url
        }));
        notify('Category image uploaded successfully!');
      }
    } catch (err) {
      alert(err.message || 'Failed to upload category image.');
    } finally {
      setUploadingCategoryImg(false);
    }
  };

  const handleSaveCategory = async (e) => {
    if (e) e.preventDefault();
    const catName = categoryForm.name.trim();
    if (!catName) {
      alert('Please enter a category name.');
      return;
    }

    setSavingCategory(true);
    try {
      const payload = {
        name: catName,
        imageUrl: categoryForm.imageUrl?.trim() || ''
      };

      if (editingCategory) {
        const res = await api.categories.update(editingCategory.id, payload);
        notify(res.message || 'Category updated successfully');
      } else {
        const res = await api.categories.create(payload);
        notify(res.message || 'Category created successfully');
      }

      setCategoryModalOpen(false);
      await loadCategoryData();
      await loadProductData(); // Sync products in case category name was changed
      window.dispatchEvent(new Event('mws_categories_updated'));
    } catch (err) {
      alert(err.message || 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const prodCount = cat.productCount || 0;
    const confirmMsg = prodCount > 0
      ? `Are you sure you want to delete category "${cat.name}"?\n\n(${prodCount} product(s) are assigned to this category)`
      : `Are you sure you want to delete category "${cat.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingCategoryId(cat.id);
    try {
      const res = await api.categories.delete(cat.id);
      notify(res.message || 'Category deleted successfully');
      await loadCategoryData();
      await loadProductData();
      window.dispatchEvent(new Event('mws_categories_updated'));
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setDeletingCategoryId(null);
    }
  };


  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.orders.updateStatus(orderId, newStatus);
      if (res.success) {
        notify(`Order status updated to "${newStatus}".`);
        loadOrderData();
        window.dispatchEvent(new Event('mws_notifications_refresh'));
        if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
          setSelectedOrderDetails(res.order);
        }
      } else {
        alert(res.message || 'Failed to update order status.');
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status.');
    }
  };

  const handleApprovePayment = async (orderId) => {
    try {
      const res = await api.orders.approvePayment(orderId);
      if (res.success) {
        notify('Payment verified & approved! Order status moved to Processing.');
        loadOrderData();
        window.dispatchEvent(new Event('mws_notifications_refresh'));
        if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
          setSelectedOrderDetails(res.order);
        }
        if (viewProofModal && viewProofModal.id === orderId) {
          setViewProofModal(res.order);
        }
      } else {
        alert(res.message || 'Failed to approve payment.');
      }
    } catch (err) {
      alert(err.message || 'Failed to approve payment.');
    }
  };

  const handleRejectPayment = async (orderId) => {
    const reason = window.prompt('Enter reason for rejecting payment proof (optional):', 'Invalid transaction ID or payment not received');
    if (reason === null) return;
    try {
      const res = await api.orders.rejectPayment(orderId, reason);
      if (res.success) {
        notify('Payment rejected. Order has been cancelled.');
        loadOrderData();
        window.dispatchEvent(new Event('mws_notifications_refresh'));
        if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
          setSelectedOrderDetails(res.order);
        }
        if (viewProofModal && viewProofModal.id === orderId) {
          setViewProofModal(res.order);
        }
      } else {
        alert(res.message || 'Failed to reject payment.');
      }
    } catch (err) {
      alert(err.message || 'Failed to reject payment.');
    }
  };

  useEffect(() => {
    loadUserData();
  }, [typeFilter, statusFilter, searchTerm]);

  // Synchronize activeTab with URL query parameters (?tab=orders, ?tab=pending, etc.)
  useEffect(() => {
    const syncTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    window.addEventListener('mws_route_change', syncTabFromUrl);

    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
      window.removeEventListener('mws_route_change', syncTabFromUrl);
    };
  }, []);

  useEffect(() => {
    loadCategoryData();
    const handleCategorySync = () => loadCategoryData();
    window.addEventListener('mws_categories_updated', handleCategorySync);
    return () => window.removeEventListener('mws_categories_updated', handleCategorySync);
  }, []);

  useEffect(() => {
    if (activeTab === 'categories' || activeTab === 'products' || activeTab === 'overview') {
      loadCategoryData();
    }
    if (activeTab === 'products' || activeTab === 'overview') {
      loadProductData();
    }
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisementData();
    }
    if (activeTab === 'orders' || activeTab === 'overview') {
      loadOrderData();
    }
  }, [activeTab]);

  // Distributor verification actions
  const handleApprove = async (dist) => {
    if (!window.confirm(`Approve distributor application for "${dist.businessName || dist.fullName}"?`)) return;
    try {
      const r = await api.admin.approveDistributor(dist.id);
      notify(r.message);
      loadUserData();
      window.dispatchEvent(new Event('mws_notifications_refresh'));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRejectConfirm = async () => {
    try {
      const r = await api.admin.rejectDistributor(rejectModalUser.id, rejectionReason);
      notify(r.message);
      setRejectModalUser(null);
      setRejectionReason('');
      loadUserData();
      window.dispatchEvent(new Event('mws_notifications_refresh'));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSuspendConfirm = async () => {
    try {
      const r = await api.admin.suspendUser(suspendModalUser.id, suspensionReason);
      notify(r.message);
      setSuspendModalUser(null);
      setSuspensionReason('');
      loadUserData();
      window.dispatchEvent(new Event('mws_notifications_refresh'));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleActivate = async (u) => {
    try {
      const r = await api.admin.activateUser(u.id);
      notify(r.message);
      loadUserData();
      window.dispatchEvent(new Event('mws_notifications_refresh'));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Permanently delete "${u.fullName}" (${u.userId})? This action cannot be undone.`)) return;
    // Optimistic removal from state
    setUsers(prev => prev.filter(user => user.id !== u.id));
    try {
      const r = await api.admin.deleteUser(u.id);
      notify(r.message || 'User deleted successfully.');
      localStorage.setItem('mws_users_last_update', Date.now().toString());
      window.dispatchEvent(new CustomEvent('mws_user_deleted', { detail: { userId: u.id, email: u.email } }));
      loadUserData();
    } catch (e) {
      alert(e.message || 'Failed to delete user.');
      loadUserData();
    }
  };

  // Standard Pricing Helpers
  const calcFinalPrice = (orig, disc) => {
    const o = Math.max(0, parseFloat(orig) || 0);
    const d = Math.max(0, Math.min(100, parseFloat(disc) || 0));
    const finalP = o - (o * (d / 100));
    return Math.max(0, Math.round(finalP * 100) / 100);
  };

  const calcDiscountPercent = (orig, finalPrice) => {
    const o = Math.max(0, parseFloat(orig) || 0);
    const f = Math.max(0, parseFloat(finalPrice) || 0);
    if (o <= 0 || f >= o) return 0;
    return Math.max(0, Math.min(100, Math.round(((o - f) / o) * 1000) / 10));
  };

  // Product CRUD actions (Admin Dual-Portal Authority)
  const openNewProductModal = () => {
    setEditingProduct(null);
    const defaultCustOrig = 2000;
    const defaultCustDisc = 10;
    const defaultDistOrig = 1500;
    const defaultDistDisc = 25;

    setProductForm({
      name: '',
      category: 'Chargers',
      brand: 'MWS Eagle',
      sku: `PRD-${Date.now().toString().slice(-5)}`,
      description: 'High-speed fast charging adapter with smart IC overload protection.',
      specifications: '• Input: 100-240V AC 50/60Hz\n• Output: 5V/3A, 9V/2.22A, 12V/1.67A (20W Max)\n• Material: Fireproof PC Shell\n• Warranty: 6 Months Official Warranty',
      imageUrl: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=600&q=80',
      badge: 'Bestseller',
      inStock: 1,
      productStatus: 'Active',
      // Customer Portal Section
      showOnCustomerPortal: true,
      customerPricingMode: 'auto',
      customerOriginalPrice: defaultCustOrig,
      customerDiscount: defaultCustDisc,
      customerPrice: calcFinalPrice(defaultCustOrig, defaultCustDisc),
      // Distributor Portal Section
      showOnDistributorPortal: true,
      distributorPricingMode: 'auto',
      distributorOriginalPrice: defaultDistOrig,
      distributorDiscount: defaultDistDisc,
      distributorPrice: calcFinalPrice(defaultDistOrig, defaultDistDisc),
      targetVisibility: 'Both'
    });
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);

    const custOrig = prod.customerOriginalPrice !== undefined && prod.customerOriginalPrice !== null && prod.customerOriginalPrice > 0
      ? Number(prod.customerOriginalPrice)
      : (prod.originalPrice || prod.customerPrice || 0);
    const custPrice = prod.customerPrice !== undefined ? Number(prod.customerPrice) : 0;
    const custDisc = prod.customerDiscount !== undefined && prod.customerDiscount !== null
      ? Number(prod.customerDiscount)
      : calcDiscountPercent(custOrig, custPrice);

    const distOrig = prod.distributorOriginalPrice !== undefined && prod.distributorOriginalPrice !== null && prod.distributorOriginalPrice > 0
      ? Number(prod.distributorOriginalPrice)
      : (prod.originalPrice || (prod.distributorPrice ? Math.round(prod.distributorPrice * 1.35) : 0));
    const distPrice = prod.distributorPrice !== undefined ? Number(prod.distributorPrice) : 0;
    const distDisc = prod.distributorDiscount !== undefined && prod.distributorDiscount !== null
      ? Number(prod.distributorDiscount)
      : calcDiscountPercent(distOrig, distPrice);

    const showCust = prod.showOnCustomerPortal !== undefined && prod.showOnCustomerPortal !== null
      ? (prod.showOnCustomerPortal === 1 || prod.showOnCustomerPortal === true)
      : (prod.targetVisibility === 'Customer' || prod.targetVisibility === 'Both');

    const showDist = prod.showOnDistributorPortal !== undefined && prod.showOnDistributorPortal !== null
      ? (prod.showOnDistributorPortal === 1 || prod.showOnDistributorPortal === true)
      : (prod.targetVisibility === 'Distributor' || prod.targetVisibility === 'Both');

    setProductForm({
      name: prod.name || '',
      category: prod.category || 'Displays',
      brand: prod.brand || 'MWS Eagle',
      sku: prod.sku || '',
      description: prod.description || '',
      specifications: prod.specifications || '',
      imageUrl: prod.imageUrl || '',
      badge: prod.badge || '',
      inStock: prod.inStock === 0 ? 0 : 1,
      productStatus: prod.productStatus || 'Active',
      // Customer Portal Section
      showOnCustomerPortal: showCust,
      customerPricingMode: prod.customerPricingMode || 'auto',
      customerOriginalPrice: custOrig,
      customerDiscount: custDisc,
      customerPrice: custPrice,
      // Distributor Portal Section
      showOnDistributorPortal: showDist,
      distributorPricingMode: prod.distributorPricingMode || 'auto',
      distributorOriginalPrice: distOrig,
      distributorDiscount: distDisc,
      distributorPrice: distPrice,
      targetVisibility: (showCust && showDist) ? 'Both' : (showCust ? 'Customer' : (showDist ? 'Distributor' : 'None'))
    });
    setProductModalOpen(true);
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('imageFile', file);

    setUploadingProductImg(true);
    try {
      const res = await api.products.uploadImage(formData);
      if (res.success && res.url) {
        setProductForm(prev => ({
          ...prev,
          imageUrl: res.url
        }));
        setActionMsg('Product picture uploaded successfully!');
        setTimeout(() => setActionMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to upload product picture.');
    } finally {
      setUploadingProductImg(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    // 1. Common Validation
    if (!productForm.name || !productForm.name.trim()) {
      return alert('Product Name is required.');
    }
    if (!productForm.sku || !productForm.sku.trim()) {
      return alert('SKU / Product Code is required.');
    }
    if (!productForm.category || !productForm.category.trim()) {
      return alert('Category is required.');
    }

    // 2. Validate Customer Pricing
    const custOrig = Math.max(0, parseFloat(productForm.customerOriginalPrice) || 0);
    const custDisc = parseFloat(productForm.customerDiscount) || 0;
    const custFinal = parseFloat(productForm.customerPrice) || 0;

    if (custOrig < 0) {
      return alert('Customer Original Price cannot be negative.');
    }
    if (custDisc < 0 || custDisc > 100) {
      return alert('Customer Discount must be between 0% and 100%.');
    }
    if (custFinal < 0) {
      return alert('Customer Final Price cannot be negative.');
    }

    // 3. Validate Distributor Pricing
    const distOrig = Math.max(0, parseFloat(productForm.distributorOriginalPrice) || 0);
    const distDisc = parseFloat(productForm.distributorDiscount) || 0;
    const distFinal = parseFloat(productForm.distributorPrice) || 0;

    if (distOrig < 0) {
      return alert('Distributor Original Price cannot be negative.');
    }
    if (distDisc < 0 || distDisc > 100) {
      return alert('Distributor Discount must be between 0% and 100%.');
    }
    if (distFinal < 0) {
      return alert('Distributor Final Price cannot be negative.');
    }

    // Calculate final prices based on active pricing mode
    const finalCustPrice = productForm.customerPricingMode === 'auto'
      ? calcFinalPrice(custOrig, custDisc)
      : custFinal;

    const finalDistPrice = productForm.distributorPricingMode === 'auto'
      ? calcFinalPrice(distOrig, distDisc)
      : distFinal;

    const payload = {
      ...productForm,
      name: productForm.name.trim(),
      sku: productForm.sku.trim(),
      category: productForm.category.trim(),
      brand: (productForm.brand || 'MWS Eagle').trim(),
      customerOriginalPrice: custOrig,
      customerDiscount: custDisc,
      customerPrice: finalCustPrice,
      distributorOriginalPrice: distOrig,
      distributorDiscount: distDisc,
      distributorPrice: finalDistPrice,
      showOnCustomerPortal: Boolean(productForm.showOnCustomerPortal),
      showOnDistributorPortal: Boolean(productForm.showOnDistributorPortal),
      targetVisibility: (productForm.showOnCustomerPortal && productForm.showOnDistributorPortal)
        ? 'Both'
        : (productForm.showOnCustomerPortal ? 'Customer' : (productForm.showOnDistributorPortal ? 'Distributor' : 'None'))
    };

    setSavingProduct(true);
    try {
      if (editingProduct) {
        const res = await api.products.update(editingProduct.id, payload);
        if (res.success) {
          notify(`Product "${payload.name}" updated successfully across portals!`);
          setProductModalOpen(false);
          localStorage.setItem('mws_products_last_update', Date.now().toString());
          window.dispatchEvent(new Event('mws_products_updated'));
          loadProductData();
        }
      } else {
        const res = await api.products.create(payload);
        if (res.success) {
          notify(`Product "${payload.name}" created! Portals: Customer (${payload.showOnCustomerPortal ? 'Active' : 'Hidden'}), Distributor (${payload.showOnDistributorPortal ? 'Active' : 'Hidden'})`);
          setProductModalOpen(false);
          localStorage.setItem('mws_products_last_update', Date.now().toString());
          window.dispatchEvent(new Event('mws_products_updated'));
          loadProductData();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  // Fast 1-Click Visibility Toggle for Customer or Distributor Portal
  const handleTogglePortalVisibility = async (prod, portalType) => {
    const isCustomer = portalType === 'customer';
    const currentVal = isCustomer
      ? (prod.showOnCustomerPortal === 1 || prod.showOnCustomerPortal === true)
      : (prod.showOnDistributorPortal === 1 || prod.showOnDistributorPortal === true);
    const newVal = !currentVal;

    // Optimistic UI update
    setAllProducts(prev => prev.map(p => {
      if (p.id === prod.id) {
        return {
          ...p,
          showOnCustomerPortal: isCustomer ? (newVal ? 1 : 0) : p.showOnCustomerPortal,
          showOnDistributorPortal: !isCustomer ? (newVal ? 1 : 0) : p.showOnDistributorPortal
        };
      }
      return p;
    }));

    notify(`${isCustomer ? 'Customer Portal' : 'Distributor Portal'} visibility toggled to: ${newVal ? 'ON' : 'OFF'}`);

    try {
      const payload = isCustomer
        ? { showOnCustomerPortal: newVal }
        : { showOnDistributorPortal: newVal };
      const res = await api.products.toggleVisibility(prod.id, payload);
      if (res.success) {
        localStorage.setItem('mws_products_last_update', Date.now().toString());
        window.dispatchEvent(new Event('mws_products_updated'));
      } else {
        alert(res.message || 'Failed to toggle portal visibility.');
        loadProductData();
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle portal visibility.');
      loadProductData();
    }
  };

  // Fast 1-Click Stock Toggle
  const handleToggleStock = async (prod) => {
    const newStock = prod.inStock ? 0 : 1;
    // Optimistic UI update
    setAllProducts(prev => prev.map(p => p.id === prod.id ? { ...p, inStock: newStock } : p));
    notify(`Stock status updating to: ${newStock ? 'In Stock' : 'Out of Stock'}...`);

    try {
      const res = await api.products.toggleStock(prod.id);
      if (res.success) {
        notify(`Product "${prod.name}" is now marked ${newStock ? 'IN STOCK' : 'OUT OF STOCK'}.`);
        localStorage.setItem('mws_products_last_update', Date.now().toString());
        window.dispatchEvent(new Event('mws_products_updated'));
      } else {
        alert(res.message || 'Failed to toggle stock status.');
        loadProductData();
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle stock status.');
      loadProductData();
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Are you sure you want to delete product "${prod.name}" (SKU: ${prod.sku})?\n\nThis will permanently delete it from Admin and User portals.`)) return;

    // 1. Optimistic removal from Admin UI immediately
    setAllProducts(prev => prev.filter(p => p.id !== prod.id));

    // 2. Broadcast signal immediately to user portals and carts
    localStorage.setItem('mws_products_last_update', Date.now().toString());
    window.dispatchEvent(new CustomEvent('mws_product_deleted', { detail: { productId: prod.id } }));
    window.dispatchEvent(new Event('mws_products_updated'));

    try {
      const res = await api.products.delete(prod.id);
      if (res.success) {
        notify(`Product "${prod.name}" permanently deleted.`);
      } else {
        alert(res.message || 'Failed to delete product.');
        loadProductData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete product.');
      loadProductData();
    }
  };

  // Advertisement management
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('mediaFile', file);

    setUploadingFile(true);
    try {
      const res = await api.advertisements.uploadMedia(formData);
      if (res.success) {
        setAdForm(prev => ({
          ...prev,
          mediaUrl: res.url,
          mediaType: res.mediaType
        }));
        notify(`${res.mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully! Preview updated.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to upload media file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateAdvertisement = async (e) => {
    e.preventDefault();
    if (!adForm.title || !adForm.mediaUrl) {
      return alert('Please provide a title and media file/URL.');
    }

    setCreatingAd(true);
    try {
      const res = await api.advertisements.create(adForm);
      if (res.success) {
        notify('Advertisement published to landing page board!');
        setAdForm({
          title: '',
          description: '',
          mediaType: 'video',
          mediaUrl: '',
          badgeText: 'FEATURED DEAL',
          linkUrl: '/login?mode=signup&role=Distributor',
          orderIndex: 0
        });
        loadAdvertisementData();
      }
    } catch (err) {
      alert(err.message || 'Failed to publish advertisement.');
    } finally {
      setCreatingAd(false);
    }
  };

  const handleToggleAdStatus = async (ad) => {
    try {
      const res = await api.advertisements.update(ad.id, { isActive: ad.isActive ? 0 : 1 });
      if (res.success) {
        notify(`Advertisement set to ${ad.isActive ? 'Inactive' : 'Active'}.`);
        loadAdvertisementData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAd = async (ad) => {
    if (!window.confirm(`Delete advertisement "${ad.title}"?`)) return;
    try {
      const res = await api.advertisements.delete(ad.id);
      if (res.success) {
        notify('Advertisement deleted.');
        loadAdvertisementData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtered users for specific tabs
  const safeUsers = Array.isArray(users) ? users : [];
  let displayUsers = safeUsers;
  if (activeTab === 'pending') {
    displayUsers = safeUsers.filter(u => u && u.userType === 'Distributor' && u.accountStatus === 'Pending');
  } else if (activeTab === 'distributors') {
    displayUsers = safeUsers.filter(u => u && u.userType === 'Distributor');
  } else if (activeTab === 'customers') {
    displayUsers = safeUsers.filter(u => u && u.userType === 'Customer');
  }

  // Filtered products for Product Management Dual-Portal tab
  const safeProducts = Array.isArray(allProducts) ? allProducts : [];
  const filteredProducts = safeProducts.filter(p => {
    if (!p) return false;
    // Visibility filter
    const isCustomer = p.showOnCustomerPortal === 1 || p.showOnCustomerPortal === true || p.targetVisibility === 'Customer' || p.targetVisibility === 'Both';
    const isDistributor = p.showOnDistributorPortal === 1 || p.showOnDistributorPortal === true || p.targetVisibility === 'Distributor' || p.targetVisibility === 'Both';

    if (productFilterVisibility === 'Both' && (!isCustomer || !isDistributor)) return false;
    if (productFilterVisibility === 'Customer' && !isCustomer) return false;
    if (productFilterVisibility === 'Distributor' && !isDistributor) return false;
    if (productFilterVisibility === 'CustomerOnly' && (!isCustomer || isDistributor)) return false;
    if (productFilterVisibility === 'DistributorOnly' && (!isDistributor || isCustomer)) return false;
    if (productFilterVisibility === 'Hidden' && (isCustomer || isDistributor)) return false;

    // Category filter
    if (productCategoryFilter !== 'All' && p.category !== productCategoryFilter) return false;

    // Stock status filter
    if (productStockFilter === 'InStock' && (p.inStock === 0 || p.inStock === false)) return false;
    if (productStockFilter === 'OutOfStock' && (p.inStock !== 0 && p.inStock !== false)) return false;

    // Search term filter
    if (productSearchTerm.trim()) {
      const q = productSearchTerm.toLowerCase().trim();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchSku = (p.sku || '').toLowerCase().includes(q);
      const matchBrand = (p.brand || '').toLowerCase().includes(q);
      const matchCategory = (p.category || '').toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchBrand && !matchCategory) return false;
    }

    return true;
  });

  // Filtered categories for Category Management tab
  const safeCategories = Array.isArray(categories) ? categories : [];
  const filteredCategories = safeCategories.filter(cat => {
    if (!cat) return false;
    return !categorySearchTerm.trim() || cat.name?.toLowerCase().includes(categorySearchTerm.toLowerCase().trim());
  });

  // Common UI Styles
  const selectStyle = {
    padding: '10px 14px',
    background: '#ffffff',
    border: '1.5px solid var(--border-medium)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-main)',
    fontSize: '0.86rem',
    outline: 'none',
    cursor: 'pointer'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#ffffff',
    border: '1.5px solid var(--border-medium)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-main)',
    fontSize: '0.88rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const textareaStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#ffffff',
    border: '1.5px solid var(--border-medium)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-main)',
    fontSize: '0.86rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const modalOverlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28, 25, 23, 0.55)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 200
  };

  // Sidebar Menu Items Definition
  const navMenuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, badge: null, color: 'var(--primary)' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: orders?.length ?? 0, color: '#2563eb' },
    { id: 'create-offers', label: 'Create Offers', icon: QrCode, badge: null, color: '#f59e0b' },
    { id: 'rewards-payouts', label: 'Rewards & Payouts', icon: Wallet, badge: null, color: '#10b981' },
    { id: 'pending', label: 'Pending Approvals', icon: Clock, badge: metrics?.distributors?.pending ?? 0, color: 'var(--status-pending)' },
    { id: 'distributors', label: 'Distributors', icon: Building2, badge: metrics?.distributors?.approved ?? 0, color: 'var(--distributor-accent)' },
    { id: 'customers', label: 'Customers', icon: Users, badge: metrics?.customers?.active ?? 0, color: 'var(--customer-accent)' },
    { id: 'products', label: 'Product Management', icon: Package, badge: allProducts?.length ?? 0, color: '#0d9488' },
    { id: 'categories', label: 'Categories', icon: FolderTree, badge: categories?.length ?? 0, color: '#8b5cf6' },
    { id: 'advertisements', label: 'Ad Board & Media', icon: Film, badge: advertisements?.length ?? 0, color: '#ea580c' },
    { id: 'all', label: 'All User Accounts', icon: Search, badge: users?.length ?? 0, color: '#6366f1' },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 66px)',
      background: 'var(--bg-app)',
      position: 'relative'
    }}>

      {/* ======================================================== */}
      {/* ================= ADMIN CONTROL SIDEBAR ================ */}
      {/* ======================================================== */}
      <aside style={{
        width: '270px',
        flexShrink: 0,
        background: '#ffffff',
        borderRight: '1px solid var(--border-medium)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 40,
        // Desktop persistent, Mobile drawer slide
        position: 'sticky',
        top: '66px',
        height: 'calc(100vh - 66px)',
        overflowY: 'auto'
      }} className="admin-desktop-sidebar">

        <div>
          {/* Sidebar Brand / Authority Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingBottom: '20px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                Admin Operations
              </div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                Superuser Access
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 10px 4px 10px' }}>
              Management Controls
            </div>

            {navMenuItems.map(item => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                    if (item.id === 'pending') { setStatusFilter('Pending'); setTypeFilter('Distributor'); }
                    else if (item.id === 'distributors') { setStatusFilter('All'); setTypeFilter('Distributor'); }
                    else if (item.id === 'customers') { setStatusFilter('All'); setTypeFilter('Customer'); }
                    else if (item.id === 'all') { setStatusFilter('All'); setTypeFilter('All'); }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: active ? 'rgba(79, 70, 229, 0.09)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: active ? 800 : 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.16s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = 'rgba(120, 90, 40, 0.05)';
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} color={active ? 'var(--primary)' : '#64748b'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge > 0 && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: active ? item.color : '#e2e8f0',
                      color: active ? '#ffffff' : '#475569'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div style={{
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Signed in Administrator:</div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.email || 'admin@mwseagle.com'}
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0
            }}
          >
            <ArrowLeft size={13} /> View Public Marketplace
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* ============= MOBILE SIDEBAR DRAWER OVERLAY ============ */}
      {/* ======================================================== */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '280px',
              background: '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '20px 16px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="var(--primary)" />
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>Admin Controls</span>
                </div>
                <button onClick={() => setMobileSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {navMenuItems.map(item => {
                  const active = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                        if (item.id === 'pending') { setStatusFilter('Pending'); setTypeFilter('Distributor'); }
                        else if (item.id === 'distributors') { setStatusFilter('All'); setTypeFilter('Distributor'); }
                        else if (item.id === 'customers') { setStatusFilter('All'); setTypeFilter('Customer'); }
                        else if (item.id === 'all') { setStatusFilter('All'); setTypeFilter('All'); }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: active ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                        color: active ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: active ? 800 : 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon size={18} color={active ? 'var(--primary)' : '#64748b'} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && item.badge > 0 && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: active ? item.color : '#e2e8f0',
                          color: active ? '#ffffff' : '#475569'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => { setMobileSidebarOpen(false); navigate('/'); }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '0.86rem' }}
            >
              <ArrowLeft size={14} /> Back to Marketplace
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ================= MAIN CONTENT WORKSPACE =============== */}
      {/* ======================================================== */}
      <main style={{
        flex: 1,
        padding: 'clamp(16px, 3vw, 32px)',
        minWidth: 0,
        overflowX: 'hidden'
      }}>
        {/* Mobile Header Bar with Hamburger toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }} className="admin-mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '8px 12px' }}
              aria-label="Open navigation sidebar"
            >
              <Menu size={18} />
              <span style={{ fontWeight: 700, marginLeft: '4px' }}>Controls Menu</span>
            </button>
            <span className="badge badge-admin" style={{ fontSize: '0.72rem' }}>
              {navMenuItems.find(i => i.id === activeTab)?.label}
            </span>
          </div>

          <button onClick={() => { loadUserData(); loadProductData(); loadAdvertisementData(); }} className="btn btn-secondary btn-sm">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Global Action Notification Toast */}
        {actionMsg && (
          <div style={{
            background: 'var(--status-active-bg)',
            border: '1.5px solid var(--status-active-border)',
            color: 'var(--status-active)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 700,
            boxShadow: 'var(--shadow-xs)'
          }} className="animate-fade-in">
            <CheckCircle size={18} /> {actionMsg}
          </div>
        )}

        {/* ======================================================== */}
        {/* =============== VIEW 1: DASHBOARD OVERVIEW ============= */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 1.95rem)', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                System Operations Dashboard
              </h1>
              <p style={{ color: 'var(--text-body)', fontSize: '0.92rem', margin: 0 }}>
                High-level operational metrics, catalog visibility, and pending verification requests.
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="admin-metrics-grid" style={{
              display: 'grid',
              gap: '16px',
              marginBottom: '28px'
            }}>
              {[
                { label: 'Total Orders', value: orders?.length ?? 0, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)', Icon: ShoppingCart, tab: 'orders' },
                { label: 'Pending Approvals', value: metrics?.distributors?.pending ?? 0, color: 'var(--status-pending)', bg: 'var(--status-pending-bg)', Icon: Clock, tab: 'pending' },
                { label: 'Verified Distributors', value: metrics?.distributors?.approved ?? 0, color: 'var(--distributor-accent)', bg: 'var(--distributor-light)', Icon: Building2, tab: 'distributors' },
                { label: 'Active Customers', value: metrics?.customers?.active ?? 0, color: 'var(--customer-accent)', bg: 'var(--customer-light)', Icon: Users, tab: 'customers' },
                { label: 'Active Catalog Products', value: allProducts?.length ?? 0, color: '#0d9488', bg: 'rgba(13, 148, 136, 0.08)', Icon: Package, tab: 'products' },
                { label: 'Catalog Categories', value: categories?.length ?? 0, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', Icon: FolderTree, tab: 'categories' },
              ].map(card => (
                <div
                  key={card.label}
                  onClick={() => setActiveTab(card.tab)}
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    background: '#ffffff',
                    border: '1.5px solid var(--border-medium)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: card.color, textTransform: 'uppercase' }}>{card.label}</span>
                    <card.Icon size={18} color={card.color} />
                  </div>
                  <div style={{ fontSize: '2.1rem', fontWeight: 900, color: card.color }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Action Shortcuts Banner */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              border: '1.5px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)',
              marginBottom: '28px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                  Orders & Product Authority Control
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.86rem', margin: 0, maxWidth: '580px' }}>
                  Manage customer and distributor purchase orders, view delivery addresses, update shipment status, and post products for Customer, Distributor, or Both portals.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab('orders')} className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>
                  <ShoppingCart size={16} /> View Orders ({orders.length})
                </button>
                <button onClick={openNewProductModal} className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>
                  <Plus size={16} /> Post New Product
                </button>
                <button onClick={() => setActiveTab('categories')} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.88rem' }}>
                  <FolderTree size={16} /> Categories ({categories.length})
                </button>
                <button onClick={() => setActiveTab('advertisements')} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.88rem' }}>
                  <Film size={16} /> Manage Ads
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ============ VIEW: CUSTOMER & DISTRIBUTOR ORDERS ======== */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '22px'
            }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  <ShoppingCart size={14} /> Full Order Fulfillment Access
                </div>
                <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.85rem)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Orders & Payment Verification
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Manage customer and distributor orders, verify online QR payment transaction IDs & screenshots, approve payments, and maintain complete dispatch history.
                </p>
              </div>

              <button onClick={loadOrderData} className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>
                <RefreshCw size={13} /> Refresh Orders
              </button>
            </div>

            {/* Metrics cards row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              marginBottom: '20px'
            }}>
              {[
                { label: 'Total Orders', value: orders.length, color: '#2563eb' },
                { label: 'Pending Verification', value: orders.filter(o => o.paymentStatus === 'Pending Verification').length, color: '#b45309', bg: '#fef3c7' },
                { label: 'Processing', value: orders.filter(o => o.orderStatus === 'Processing').length, color: '#7c3aed' },
                { label: 'Dispatched', value: orders.filter(o => o.orderStatus === 'Dispatched').length, color: '#0284c7' },
                { label: 'Delivered', value: orders.filter(o => o.orderStatus === 'Delivered').length, color: '#059669' },
                { label: 'Total Revenue', value: `₹${orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}`, color: '#111827' }
              ].map(stat => (
                <div
                  key={stat.label}
                  style={{
                    background: stat.bg || '#ffffff',
                    border: '1px solid ' + (stat.bg ? '#fde68a' : '#e2e8f0'),
                    borderRadius: '12px',
                    padding: '14px 18px',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: stat.bg ? '#92400e' : '#64748b', textTransform: 'uppercase' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: stat.color, marginTop: '2px' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* TWO PRIMARY PARTS: CUSTOMER ORDERS & DISTRIBUTOR ORDERS */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              borderBottom: '2px solid #e2e8f0',
              paddingBottom: '12px'
            }}>
              {[
                { id: 'All', label: 'All Orders', count: orders.length, color: '#2563eb' },
                { id: 'Customer', label: 'Customer Orders', count: orders.filter(o => o.userType === 'Customer').length, color: '#059669' },
                { id: 'Distributor', label: 'Distributor Orders', count: orders.filter(o => o.userType === 'Distributor').length, color: '#0284c7' }
              ].map(tab => {
                const isSelected = orderUserType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setOrderUserType(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${tab.color}` : '1.5px solid #e2e8f0',
                      background: isSelected ? '#ffffff' : '#f8fafc',
                      color: isSelected ? tab.color : '#475569',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.16s ease'
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: isSelected ? tab.color : '#e2e8f0',
                      color: isSelected ? '#ffffff' : '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Pills & Search bar */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}>
              {/* Status filter pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Filter:</span>
                {[
                  { id: 'All', label: 'All Statuses' },
                  { id: 'Pending Verification', label: 'Pending Payment Proof ⚠️', isProof: true },
                  { id: 'Pending', label: 'Pending' },
                  { id: 'Processing', label: 'Processing' },
                  { id: 'Dispatched', label: 'Dispatched' },
                  { id: 'Delivered', label: 'Delivered' },
                  { id: 'Cancelled', label: 'Cancelled' }
                ].map(st => {
                  const active = orderFilterStatus === st.id;
                  const count = st.id === 'All'
                    ? (orderUserType === 'All' ? orders.length : orders.filter(o => o.userType === orderUserType).length)
                    : st.id === 'Pending Verification'
                    ? orders.filter(o => (orderUserType === 'All' || o.userType === orderUserType) && o.paymentStatus === 'Pending Verification').length
                    : orders.filter(o => (orderUserType === 'All' || o.userType === orderUserType) && o.orderStatus === st.id).length;

                  return (
                    <button
                      key={st.id}
                      onClick={() => setOrderFilterStatus(st.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid ' + (active ? (st.isProof ? '#d97706' : '#2563eb') : (st.isProof ? '#fcd34d' : '#e2e8f0')),
                        background: active ? (st.isProof ? '#d97706' : '#2563eb') : (st.isProof ? '#fef3c7' : '#ffffff'),
                        color: active ? '#ffffff' : (st.isProof ? '#92400e' : '#334155'),
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.16s'
                      }}
                    >
                      {st.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Order Search Input */}
              <div style={{ minWidth: '260px', flex: 1, maxWidth: '400px' }}>
                <input
                  type="text"
                  value={orderSearchTerm}
                  onChange={e => setOrderSearchTerm(e.target.value)}
                  placeholder="Search order #, customer, UTR, phone..."
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Orders Table */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div className="responsive-table-container">
                <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc', color: '#475569' }}>
                      {['ORDER NUMBER & DATE', 'BUYER DETAILS', 'ITEMS ORDERED', 'DELIVERY DESTINATION', 'PAYMENT & PROOF', 'ORDER STATUS', 'ACTION CONTROLS'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading orders and proof history...</td></tr>
                    ) : orders.filter(o => {
                      if (orderUserType !== 'All' && o.userType !== orderUserType) return false;
                      if (orderFilterStatus !== 'All') {
                        if (orderFilterStatus === 'Pending Verification') {
                          if (o.paymentStatus !== 'Pending Verification') return false;
                        } else if (o.orderStatus !== orderFilterStatus) {
                          return false;
                        }
                      }
                      if (orderSearchTerm.trim()) {
                        const q = orderSearchTerm.toLowerCase();
                        return (
                          (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
                          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
                          (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
                          (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
                          (o.transactionId && o.transactionId.toLowerCase().includes(q))
                        );
                      }
                      return true;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                          No orders found matching the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      orders.filter(o => {
                        if (orderUserType !== 'All' && o.userType !== orderUserType) return false;
                        if (orderFilterStatus !== 'All') {
                          if (orderFilterStatus === 'Pending Verification') {
                            if (o.paymentStatus !== 'Pending Verification') return false;
                          } else if (o.orderStatus !== orderFilterStatus) {
                            return false;
                          }
                        }
                        if (orderSearchTerm.trim()) {
                          const q = orderSearchTerm.toLowerCase();
                          return (
                            (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
                            (o.customerName && o.customerName.toLowerCase().includes(q)) ||
                            (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
                            (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
                            (o.transactionId && o.transactionId.toLowerCase().includes(q))
                          );
                        }
                        return true;
                      }).map(ord => (
                        <tr
                          key={ord.id}
                          style={{ borderBottom: '1px solid #f1f5f9' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Order Number & Date */}
                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: '0.9rem' }}>
                              {ord.orderNumber}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                              {new Date(ord.createdDate).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {new Date(ord.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Customer Details */}
                          <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>
                              {ord.customerName}
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', margin: '3px 0' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: ord.userType === 'Distributor' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                                color: ord.userType === 'Distributor' ? '#0284c7' : '#059669'
                              }}>
                                {ord.userType}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#475569' }}>{ord.customerPhone}</div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{ord.customerEmail}</div>
                          </td>

                          {/* Items Ordered */}
                          <td style={{ padding: '12px 14px', verticalAlign: 'top', maxWidth: '220px' }}>
                            {ord.items && ord.items.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {ord.items.map((it, idx) => (
                                  <div key={idx} style={{ fontSize: '0.8rem', color: '#1e293b', lineHeight: 1.3 }}>
                                    <strong>{it.quantity}x</strong> {it.name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>No item details</span>
                            )}
                          </td>

                          {/* Delivery Address */}
                          <td style={{ padding: '12px 14px', verticalAlign: 'top', maxWidth: '200px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>
                              {ord.shippingAddress}
                              {ord.district && <div style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.74rem', marginTop: '2px' }}>District: {ord.district}</div>}
                              {ord.city && <div>{ord.city} {ord.postalCode && `- ${ord.postalCode}`}</div>}
                            </div>
                          </td>

                          {/* Payment & Proof Details */}
                          <td style={{ padding: '12px 14px', verticalAlign: 'top', minWidth: '180px' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                              ₹{Number(ord.totalAmount).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '1px' }}>
                              {ord.paymentMethod}
                            </div>

                            {/* Payment Status Badge */}
                            <div style={{ marginTop: '4px' }}>
                              <span style={{
                                display: 'inline-block',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background:
                                  ord.paymentStatus === 'Verified & Approved' ? '#dcfce7' :
                                  ord.paymentStatus === 'Payment Rejected' ? '#fee2e2' :
                                  ord.paymentStatus === 'Pending Verification' ? '#fef3c7' : '#f1f5f9',
                                color:
                                  ord.paymentStatus === 'Verified & Approved' ? '#15803d' :
                                  ord.paymentStatus === 'Payment Rejected' ? '#b91c1c' :
                                  ord.paymentStatus === 'Pending Verification' ? '#b45309' : '#475569'
                              }}>
                                {ord.paymentStatus || 'Pending Verification'}
                              </span>
                            </div>

                            {/* UTR / Transaction ID */}
                            {ord.transactionId && (
                              <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#334155' }}>
                                UTR: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669', background: '#f0fdf4', padding: '1px 4px', borderRadius: '3px' }}>{ord.transactionId}</span>
                              </div>
                            )}

                            {/* Screenshot Proof Button & Thumbnail */}
                            {ord.paymentScreenshot ? (
                              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img
                                  src={getMediaUrl(ord.paymentScreenshot)}
                                  alt="Proof"
                                  onClick={() => setViewProofModal(ord)}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '4px',
                                    objectFit: 'cover',
                                    border: '1.5px solid #2563eb',
                                    cursor: 'pointer'
                                  }}
                                  title="Click to view full screenshot proof"
                                />
                                <button
                                  onClick={() => setViewProofModal(ord)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: '#2563eb',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0,
                                    textDecoration: 'underline'
                                  }}
                                >
                                  View Proof
                                </button>
                              </div>
                            ) : ord.paymentMethod?.includes('QR') || ord.paymentMethod?.includes('UPI') ? (
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>No screenshot</div>
                            ) : null}
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: '12px 14px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              background:
                                ord.orderStatus === 'Delivered' ? 'rgba(5, 150, 105, 0.1)' :
                                ord.orderStatus === 'Dispatched' ? 'rgba(2, 132, 199, 0.1)' :
                                ord.orderStatus === 'Processing' ? 'rgba(124, 58, 237, 0.1)' :
                                ord.orderStatus === 'Cancelled' ? 'rgba(220, 38, 38, 0.1)' :
                                'rgba(217, 119, 6, 0.1)',
                              color:
                                ord.orderStatus === 'Delivered' ? '#059669' :
                                ord.orderStatus === 'Dispatched' ? '#0284c7' :
                                ord.orderStatus === 'Processing' ? '#7c3aed' :
                                ord.orderStatus === 'Cancelled' ? '#dc2626' :
                                '#d97706'
                            }}>
                              {ord.orderStatus}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 14px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {/* Quick Approve / Reject for Online Payment Proof */}
                              {ord.paymentStatus === 'Pending Verification' && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => handleApprovePayment(ord.id)}
                                    title="Verify & Approve Payment"
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: '#059669',
                                      color: '#ffffff',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(ord.id)}
                                    title="Reject Payment Proof"
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #dc2626',
                                      background: '#fee2e2',
                                      color: '#dc2626',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              )}

                              <select
                                value={ord.orderStatus}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  background: '#ffffff'
                                }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>

                              <button
                                onClick={() => setSelectedOrderDetails(ord)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563eb',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  padding: '2px 0'
                                }}
                              >
                                View Details & Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ========= VIEW 2: PRODUCT MANAGEMENT & AUTHORITY ======= */}
        {/* ======================================================== */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div>
            {/* Header with Post Product button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  <Package size={14} /> Catalog Authority Control
                </div>
                <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Product Management — Single Record, Dual Portals
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Create and manage a single product record with completely independent pricing and visibility controls for the <strong>Customer Portal</strong> (Retail) and <strong>Distributor Portal</strong> (Wholesale B2B).
                </p>
              </div>

              <button
                onClick={openNewProductModal}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                  padding: '11px 22px',
                  fontSize: '0.92rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)'
                }}
              >
                <Plus size={18} /> Create New Product
              </button>
            </div>

            {/* Quick Metrics Bar for Dual Portal Catalog */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ background: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Catalog Products</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{allProducts.length}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>Single master product records</div>
              </div>

              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>Customer Portal Active</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065f46', marginTop: '4px' }}>
                  {allProducts.filter(p => p.showOnCustomerPortal === 1 || p.showOnCustomerPortal === true || p.targetVisibility === 'Customer' || p.targetVisibility === 'Both').length}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '2px' }}>Retail pricing applied</div>
              </div>

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Distributor Portal Active</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#075985', marginTop: '4px' }}>
                  {allProducts.filter(p => p.showOnDistributorPortal === 1 || p.showOnDistributorPortal === true || p.targetVisibility === 'Distributor' || p.targetVisibility === 'Both').length}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '2px' }}>Wholesale B2B pricing applied</div>
              </div>

              <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase' }}>Both Portals Live</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3730a3', marginTop: '4px' }}>
                  {allProducts.filter(p => (p.showOnCustomerPortal === 1 || p.showOnCustomerPortal === true) && (p.showOnDistributorPortal === 1 || p.showOnDistributorPortal === true)).length}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4f46e5', marginTop: '2px' }}>Shared product, separate pricing</div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border-medium)', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inventory Health</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                  {allProducts.filter(p => p.inStock !== 0 && p.inStock !== false).length}
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#ef4444', marginLeft: '6px' }}>
                    ({allProducts.filter(p => p.inStock === 0 || p.inStock === false).length} OOS)
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>In Stock vs Out of Stock</div>
              </div>
            </div>

            {/* Search and Filter Strip */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              padding: '16px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', flex: '1 1 260px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by product name, SKU, brand, or category..."
                    value={productSearchTerm}
                    onChange={e => setProductSearchTerm(e.target.value)}
                    style={{
                      ...inputStyle,
                      paddingLeft: '36px',
                      fontSize: '0.84rem'
                    }}
                  />
                  {productSearchTerm && (
                    <button
                      onClick={() => setProductSearchTerm('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div style={{ minWidth: '160px' }}>
                  <select
                    value={productCategoryFilter}
                    onChange={e => setProductCategoryFilter(e.target.value)}
                    style={{ ...selectStyle, width: '100%', fontSize: '0.84rem' }}
                  >
                    <option value="All">All Categories</option>
                    {productCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Filter */}
                <div style={{ minWidth: '140px' }}>
                  <select
                    value={productStockFilter}
                    onChange={e => setProductStockFilter(e.target.value)}
                    style={{ ...selectStyle, width: '100%', fontSize: '0.84rem' }}
                  >
                    <option value="All">All Stock</option>
                    <option value="InStock">In Stock Only</option>
                    <option value="OutOfStock">Out of Stock Only</option>
                  </select>
                </div>
              </div>

              {/* Portal Visibility Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-body)', marginRight: '6px' }}>
                  Portal Visibility Filter:
                </span>
                {[
                  { id: 'All', label: `All (${allProducts.length})` },
                  { id: 'Both', label: `Both Portals (${allProducts.filter(p => (p.showOnCustomerPortal === 1 || p.showOnCustomerPortal === true) && (p.showOnDistributorPortal === 1 || p.showOnDistributorPortal === true)).length})`, color: '#4f46e5' },
                  { id: 'Customer', label: `Customer Portal Active (${allProducts.filter(p => p.showOnCustomerPortal === 1 || p.showOnCustomerPortal === true || p.targetVisibility === 'Customer' || p.targetVisibility === 'Both').length})`, color: '#059669' },
                  { id: 'Distributor', label: `Distributor Portal Active (${allProducts.filter(p => p.showOnDistributorPortal === 1 || p.showOnDistributorPortal === true || p.targetVisibility === 'Distributor' || p.targetVisibility === 'Both').length})`, color: '#0284c7' },
                  { id: 'CustomerOnly', label: `Customer Only (${allProducts.filter(p => (p.showOnCustomerPortal === 1 || p.showOnCustomerPortal === true) && (p.showOnDistributorPortal === 0 || p.showOnDistributorPortal === false)).length})`, color: '#059669' },
                  { id: 'DistributorOnly', label: `Distributor Only (${allProducts.filter(p => (p.showOnDistributorPortal === 1 || p.showOnDistributorPortal === true) && (p.showOnCustomerPortal === 0 || p.showOnCustomerPortal === false)).length})`, color: '#0284c7' },
                  { id: 'Hidden', label: `Hidden from Both (${allProducts.filter(p => (p.showOnCustomerPortal === 0 || p.showOnCustomerPortal === false) && (p.showOnDistributorPortal === 0 || p.showOnDistributorPortal === false)).length})`, color: '#dc2626' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setProductFilterVisibility(tab.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: productFilterVisibility === tab.id ? '1px solid #1e293b' : '1px solid var(--border-medium)',
                      background: productFilterVisibility === tab.id ? '#1e293b' : '#ffffff',
                      color: productFilterVisibility === tab.id ? '#ffffff' : (tab.color || 'var(--text-main)'),
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Table Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div className="responsive-table-container">
                <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', background: 'var(--bg-app-2)', color: 'var(--text-body)' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRODUCT & CODE</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(16, 185, 129, 0.04)', color: '#047857' }}>
                        CUSTOMER PORTAL (RETAIL)
                      </th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(2, 132, 199, 0.04)', color: '#0284c7' }}>
                        DISTRIBUTOR PORTAL (B2B)
                      </th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>B2B MARGIN GAP</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STOCK</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingProducts ? (
                      <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading product catalog...</td></tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No products found matching current filters.</td></tr>
                    ) : filteredProducts.map(p => {
                      const showCust = p.showOnCustomerPortal === 1 || p.showOnCustomerPortal === true || p.targetVisibility === 'Customer' || p.targetVisibility === 'Both';
                      const showDist = p.showOnDistributorPortal === 1 || p.showOnDistributorPortal === true || p.targetVisibility === 'Distributor' || p.targetVisibility === 'Both';
                      const custPrice = Number(p.customerPrice || 0);
                      const custOrig = Number(p.customerOriginalPrice || p.originalPrice || custPrice);
                      const custDisc = Number(p.customerDiscount || 0);
                      const distPrice = Number(p.distributorPrice || 0);
                      const distOrig = Number(p.distributorOriginalPrice || p.originalPrice || distPrice);
                      const distDisc = Number(p.distributorDiscount || 0);
                      const priceGap = Math.max(0, custPrice - distPrice);
                      const priceGapPercent = custPrice > 0 ? Math.round((priceGap / custPrice) * 100) : 0;

                      return (
                        <tr
                          key={p.id}
                          style={{ borderBottom: '1px solid var(--border-subtle)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-app)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Product Image & Info */}
                          <td style={{ padding: '12px 14px', minWidth: '240px', maxWidth: '320px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '8px',
                                background: '#f1f5f9',
                                overflow: 'hidden',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e2e8f0'
                              }}>
                                <img
                                  src={p.imageUrl || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=120&q=80'}
                                  alt={p.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=120&q=80'; }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: 1.3 }}>
                                  {p.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                                    {p.sku}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', background: '#f1f5f9', color: '#334155', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    {p.category}
                                  </span>
                                  {p.brand && (
                                    <span style={{ fontSize: '0.68rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                      {p.brand}
                                    </span>
                                  )}
                                  {p.badge && (
                                    <span style={{ fontSize: '0.66rem', background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                      {p.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Customer Portal Column */}
                          <td style={{ padding: '12px 14px', background: 'rgba(16, 185, 129, 0.02)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {/* 1-Click Visibility Toggle */}
                              <button
                                type="button"
                                onClick={() => handleTogglePortalVisibility(p, 'customer')}
                                title="Click to toggle visibility on Customer Portal"
                                style={{
                                  alignSelf: 'flex-start',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-full)',
                                  border: showCust ? '1px solid #10b981' : '1px solid #cbd5e1',
                                  background: showCust ? '#ecfdf5' : '#f8fafc',
                                  color: showCust ? '#047857' : '#64748b',
                                  fontSize: '0.70rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: showCust ? '#10b981' : '#94a3b8' }} />
                                {showCust ? 'Live on Customer' : 'Hidden from Customer'}
                              </button>

                              {/* Price Details */}
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>
                                  ₹{custPrice.toLocaleString()}
                                </span>
                                {custOrig > custPrice && (
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                    ₹{custOrig.toLocaleString()}
                                  </span>
                                )}
                                {custDisc > 0 && (
                                  <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '1px 4px', borderRadius: '3px' }}>
                                    -{custDisc}%
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic' }}>
                                Mode: {p.customerPricingMode === 'manual' ? 'Manual Set Price' : 'Auto Discount'}
                              </span>
                            </div>
                          </td>

                          {/* Distributor Portal Column */}
                          <td style={{ padding: '12px 14px', background: 'rgba(2, 132, 199, 0.02)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {/* 1-Click Visibility Toggle */}
                              <button
                                type="button"
                                onClick={() => handleTogglePortalVisibility(p, 'distributor')}
                                title="Click to toggle visibility on Distributor Portal"
                                style={{
                                  alignSelf: 'flex-start',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-full)',
                                  border: showDist ? '1px solid #0284c7' : '1px solid #cbd5e1',
                                  background: showDist ? '#f0f9ff' : '#f8fafc',
                                  color: showDist ? '#0369a1' : '#64748b',
                                  fontSize: '0.70rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: showDist ? '#0284c7' : '#94a3b8' }} />
                                {showDist ? 'Live on Distributor' : 'Hidden from Distributor'}
                              </button>

                              {/* Price Details */}
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0284c7' }}>
                                  ₹{distPrice.toLocaleString()}
                                </span>
                                {distOrig > distPrice && (
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                    ₹{distOrig.toLocaleString()}
                                  </span>
                                )}
                                {distDisc > 0 && (
                                  <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '1px 4px', borderRadius: '3px' }}>
                                    -{distDisc}% B2B
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic' }}>
                                Mode: {p.distributorPricingMode === 'manual' ? 'Manual Set Price' : 'Auto Discount'}
                              </span>
                            </div>
                          </td>

                          {/* B2B Margin Gap Column */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 700, color: '#4338ca', fontSize: '0.86rem' }}>
                              ₹{priceGap.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.70rem', color: '#6366f1', fontWeight: 600 }}>
                              {priceGapPercent}% Wholesale Margin
                            </div>
                          </td>

                          {/* Stock Status with 1-Click Toggle */}
                          <td style={{ padding: '12px 14px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleStock(p)}
                              title={`Click to switch status: currently ${p.inStock ? 'In Stock' : 'Out of Stock'}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-full)',
                                border: p.inStock ? '1px solid #10b981' : '1px solid #ef4444',
                                background: p.inStock ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: p.inStock ? '#047857' : '#b91c1c',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: p.inStock ? '#10b981' : '#ef4444'
                              }} />
                              {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => openEditProductModal(p)}
                                title="Edit Dual-Portal Product"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Edit size={13} /> Edit Product
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                title="Delete Product"
                                className="btn btn-danger btn-sm"
                                style={{ padding: '6px 8px' }}
                              >
                                <Trash2 size={13} />
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
          </div>
        )}

        {/* ======================================================== */}
        {/* ========= VIEW: MASTER CATEGORY MANAGEMENT ============= */}
        {/* ======================================================== */}
        {activeTab === 'categories' && (
          <div>
            {/* Header with Title and Add Category button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  <FolderTree size={14} /> Catalog Taxonomy
                </div>
                <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Category Management
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Manage product categories with simple name and image controls.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={loadCategoryData}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={13} className={loadingCategories ? 'spin' : ''} /> Refresh
                </button>
                <button
                  onClick={openNewCategoryModal}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.28)',
                    padding: '10px 20px',
                    fontSize: '0.90rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={16} /> Add New Category
                </button>
              </div>
            </div>

            {/* Search and Summary Bar */}
            <div className="glass-panel" style={{
              padding: '16px 20px',
              background: '#ffffff',
              border: '1.5px solid var(--border-medium)',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search categories by name..."
                  value={categorySearchTerm}
                  onChange={e => setCategorySearchTerm(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '34px', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#64748b' }}>
                Total Categories: <strong style={{ color: '#7c3aed' }}>{categories.length}</strong>
              </div>
            </div>

            {/* Categories Table View */}
            <div className="glass-panel" style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border-medium)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div className="responsive-table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                      <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px' }}>
                        Image
                      </th>
                      <th style={{ padding: '14px 18px', fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Category Name
                      </th>
                      <th style={{ padding: '14px 18px', fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Products
                      </th>
                      <th style={{ padding: '14px 20px', fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '48px 24px', textAlign: 'center' }}>
                          <FolderTree size={36} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
                            No Categories Found
                          </div>
                          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 16px 0' }}>
                            {categorySearchTerm.trim()
                              ? 'No category matching "' + categorySearchTerm + '".'
                              : 'No categories have been added yet.'}
                          </p>
                          <button onClick={openNewCategoryModal} className="btn btn-primary btn-sm" style={{ background: '#7c3aed' }}>
                            <Plus size={14} /> Add First Category
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat, idx) => {
                        const productCount = cat.productCount || 0;

                        return (
                          <tr
                            key={cat.id || idx}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: '#ffffff',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
                          >
                            {/* Category Image Thumbnail */}
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '10px',
                                background: '#f1f5f9',
                                border: '1.5px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0
                              }}>
                                {cat.imageUrl ? (
                                  <img
                                    src={getMediaUrl(cat.imageUrl)}
                                    alt={cat.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <Tag size={22} color="#7c3aed" />
                                )}
                              </div>
                            </td>

                            {/* Category Name */}
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                                {cat.name}
                              </div>
                            </td>

                            {/* Assigned Products Count */}
                            <td style={{ padding: '14px 18px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setProductCategoryFilter(cat.name);
                                  setActiveTab('products');
                                }}
                                style={{
                                  background: productCount > 0 ? 'rgba(124, 58, 237, 0.08)' : '#f1f5f9',
                                  border: '1px solid ' + (productCount > 0 ? 'rgba(124, 58, 237, 0.2)' : '#e2e8f0'),
                                  borderRadius: '20px',
                                  padding: '5px 12px',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  color: productCount > 0 ? '#7c3aed' : '#64748b',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                                title="Click to filter products in this category"
                              >
                                <Package size={13} />
                                {productCount} {productCount === 1 ? 'Product' : 'Products'}
                              </button>
                            </td>

                            {/* Actions (Edit / Delete) */}
                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => openEditCategoryModal(cat)}
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    padding: '7px 14px',
                                    fontSize: '0.80rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: 700
                                  }}
                                  title="Edit Category Name and Image"
                                >
                                  <Edit size={13} /> Edit
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingCategoryId === cat.id}
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="btn btn-danger btn-sm"
                                  style={{
                                    padding: '7px 12px',
                                    fontSize: '0.80rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 700
                                  }}
                                  title="Delete Category"
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ============ VIEW: CREATE OFFERS (QR CODES) ============ */}
        {/* ======================================================== */}
        {activeTab === 'create-offers' && (
          <AdminCreateOffers />
        )}

        {/* ======================================================== */}
        {/* ============ VIEW: REWARDS & PAYOUTS MANAGEMENT ======== */}
        {/* ======================================================== */}
        {activeTab === 'rewards-payouts' && (
          <AdminRewardsPayouts />
        )}

        {/* ======================================================== */}
        {/* =========== VIEW 3: AD BOARD & MEDIA MANAGEMENT ======== */}
        {/* ======================================================== */}
        {activeTab === 'advertisements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div className="glass-panel" style={{
              padding: '24px',
              background: '#ffffff',
              border: '1.5px solid rgba(234, 88, 12, 0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Film size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Upload & Manage Landing Page Advertisements
                  </h2>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.86rem', margin: '2px 0 0 0' }}>
                    Upload video clips (.mp4, .webm) and banner images (.jpg, .png) displayed on the landing page interactive board.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateAdvertisement} style={{ marginTop: '20px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                      Advertisement Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50% OFF Wholesale Screws, Flex & Display Assemblies"
                      value={adForm.title}
                      onChange={e => setAdForm({ ...adForm, title: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                      Badge Tag (e.g. MEGA SALE, HOT VIDEO)
                    </label>
                    <input
                      type="text"
                      placeholder="HOT DEAL"
                      value={adForm.badgeText}
                      onChange={e => setAdForm({ ...adForm, badgeText: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                    Caption / Description
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Short description highlighting the promotion or feature..."
                    value={adForm.description}
                    onChange={e => setAdForm({ ...adForm, description: e.target.value })}
                    style={textareaStyle}
                  />
                </div>

                {/* Media Selection: Upload File OR Direct URL */}
                <div style={{
                  background: '#f8fafc',
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e2e8f0',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1e293b' }}>
                      Media Content (Video or Image) *
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setAdForm({ ...adForm, mediaType: 'video' })}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-full)',
                          border: 'none',
                          background: adForm.mediaType === 'video' ? '#0284c7' : '#e2e8f0',
                          color: adForm.mediaType === 'video' ? '#ffffff' : '#475569',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Film size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        Video
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdForm({ ...adForm, mediaType: 'image' })}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-full)',
                          border: 'none',
                          background: adForm.mediaType === 'image' ? '#059669' : '#e2e8f0',
                          color: adForm.mediaType === 'image' ? '#ffffff' : '#475569',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <ImageIcon size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        Image
                      </button>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        Option A: Upload Local File (.mp4, .webm, .png, .jpg)
                      </label>
                      <input
                        type="file"
                        accept="video/*,image/*"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        style={{
                          padding: '8px',
                          background: '#ffffff',
                          border: '1px dashed #94a3b8',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.84rem',
                          width: '100%',
                          cursor: 'pointer'
                        }}
                      />
                      {uploadingFile && (
                        <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>
                          Uploading file to server...
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        Option B: Or Paste Direct Media URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://... (mp4 video or image link)"
                        value={adForm.mediaUrl}
                        onChange={e => setAdForm({ ...adForm, mediaUrl: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {adForm.mediaUrl && (
                    <div style={{ marginTop: '14px', padding: '12px', background: '#0f172a', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 700 }}>
                        Live Media Preview:
                      </div>
                      {adForm.mediaType === 'video' ? (
                        <video
                          src={getMediaUrl(adForm.mediaUrl)}
                          controls
                          style={{ maxHeight: '200px', width: '100%', borderRadius: '6px' }}
                        />
                      ) : (
                        <img
                          src={getMediaUrl(adForm.mediaUrl)}
                          alt="Preview"
                          style={{ maxHeight: '180px', objectFit: 'contain', borderRadius: '6px' }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Target Link & Order */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                      Target CTA Link
                    </label>
                    <input
                      type="text"
                      placeholder="/login?mode=signup&role=Distributor"
                      value={adForm.linkUrl}
                      onChange={e => setAdForm({ ...adForm, linkUrl: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                      Display Order Index (0 = Top priority)
                    </label>
                    <input
                      type="number"
                      value={adForm.orderIndex}
                      onChange={e => setAdForm({ ...adForm, orderIndex: Number(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingAd || uploadingFile}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                    padding: '12px 26px',
                    fontSize: '0.92rem'
                  }}
                >
                  <Plus size={16} />
                  {creatingAd ? 'Publishing...' : 'Publish to Advertisement Board'}
                </button>
              </form>
            </div>

            {/* Existing Advertisements Grid */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Active Advertisements ({advertisements.length})
                </h3>
                <button onClick={loadAdvertisementData} className="btn btn-secondary btn-sm">
                  <RefreshCw size={12} /> Reload
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                gap: '20px'
              }}>
                {advertisements.map((ad) => (
                  <div
                    key={ad.id}
                    className="glass-panel"
                    style={{
                      background: '#ffffff',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'var(--shadow-card)'
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      height: '180px',
                      background: '#090d16',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {ad.mediaType === 'video' ? (
                        <video
                          src={getMediaUrl(ad.mediaUrl)}
                          controls
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <img
                          src={getMediaUrl(ad.mediaUrl)}
                          alt={ad.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}

                      <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                        <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                          {ad.badgeText || 'HOT DEAL'}
                        </span>
                        <span style={{ background: ad.mediaType === 'video' ? 'rgba(2, 132, 199, 0.85)' : 'rgba(5, 150, 105, 0.85)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                          {ad.mediaType === 'video' ? 'Video' : 'Image'}
                        </span>
                      </div>

                      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        <span className={`badge ${ad.isActive ? 'badge-active' : 'badge-suspended'}`}>
                          {ad.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                          {ad.title}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', margin: 0, lineHeight: 1.45 }}>
                          {ad.description || 'No caption provided.'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                          onClick={() => handleToggleAdStatus(ad)}
                          className={ad.isActive ? 'btn btn-secondary btn-sm' : 'btn btn-emerald btn-sm'}
                          style={{ fontSize: '0.78rem' }}
                        >
                          {ad.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleDeleteAd(ad)}
                          className="btn btn-danger btn-sm"
                          style={{ fontSize: '0.78rem' }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* =========== VIEWS 4-7: USER MANAGEMENT TABLES ========== */}
        {/* ======================================================== */}
        {(activeTab === 'pending' || activeTab === 'distributors' || activeTab === 'customers' || activeTab === 'all') && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                {activeTab === 'pending' && 'Pending Distributor Applications'}
                {activeTab === 'distributors' && 'Wholesale Distributors'}
                {activeTab === 'customers' && 'Retail Customers'}
                {activeTab === 'all' && 'All Registered User Accounts'}
              </h1>
              <p style={{ color: 'var(--text-body)', fontSize: '0.88rem', margin: 0 }}>
                {activeTab === 'pending' && 'Review business licenses, VAT/PAN documents, and approve or reject distributor requests.'}
                {activeTab === 'distributors' && 'Manage approved wholesale accounts, view VAT/PAN numbers, and update account statuses.'}
                {activeTab === 'customers' && 'View customer accounts and monitor retail activity.'}
                {activeTab === 'all' && 'Search and filter the complete user directory across all role tiers.'}
              </p>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <input
                  type="text"
                  placeholder="Search by name, email, company, PAN/VAT, user ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '40px' }}
                />
                <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              {activeTab === 'all' && (
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
                  <option value="All">All Roles</option>
                  <option value="Customer">Customers</option>
                  <option value="Distributor">Distributors</option>
                  <option value="Admin">Admin</option>
                </select>
              )}

              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Rejected">Rejected</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Table Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div className="responsive-table-container">
                <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', background: 'var(--bg-app-2)', color: 'var(--text-body)' }}>
                      {['USER & ACCOUNT', 'ROLE', 'STATUS', 'BUSINESS & TAX REGISTRATION', 'REGISTERED', 'ACTIONS'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</td></tr>
                    ) : displayUsers.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No matching users found.</td></tr>
                    ) : displayUsers.map(u => (
                      <tr
                        key={u.id}
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-app)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* User */}
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-body)' }}>{u.email}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{u.userId}</div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '13px 16px' }}>
                          <span className={`badge badge-${(u.userType || 'customer').toLowerCase()}`}>
                            {u.userType === 'Customer' && <User size={10} />}
                            {u.userType === 'Distributor' && <Building2 size={10} />}
                            {u.userType === 'Admin' && <ShieldCheck size={10} />}
                            {u.userType}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '13px 16px' }}>
                          <span className={`badge badge-${(u.accountStatus || 'active').toLowerCase()}`}>{u.accountStatus || 'Active'}</span>
                        </td>

                        {/* Business */}
                        <td style={{ padding: '13px 16px', maxWidth: '220px' }}>
                          {u.businessName ? (
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.84rem' }}>{u.businessName}</div>
                              {u.panVatNumber && (
                                <div style={{ fontSize: '0.74rem', color: '#0369a1', fontFamily: 'var(--font-mono)' }}>
                                  PAN/VAT: {u.panVatNumber}
                                </div>
                              )}
                            </div>
                          ) : <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>— (Retail Customer)</span>}
                        </td>

                        {/* Registered */}
                        <td style={{ padding: '13px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {u.createdDate ? new Date(u.createdDate).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button onClick={() => setSelectedUser(u)} title="View profile" className="btn btn-secondary btn-sm" style={{ padding: '5px 8px' }}>
                              <Eye size={13} />
                            </button>

                            {u.userType === 'Distributor' && u.accountStatus === 'Pending' && (
                              <>
                                <button onClick={() => handleApprove(u)} title="Approve Distributor" className="btn btn-emerald btn-sm" style={{ padding: '5px 8px' }}>
                                  <Check size={13} /> Approve
                                </button>
                                <button onClick={() => setRejectModalUser(u)} title="Reject Distributor" className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }}>
                                  <X size={13} />
                                </button>
                              </>
                            )}

                            {u.accountStatus === 'Active' && u.userType !== 'Admin' && (
                              <button onClick={() => setSuspendModalUser(u)} title="Suspend user" className="btn btn-secondary btn-sm" style={{ padding: '5px 8px', color: 'var(--status-suspended)' }}>
                                <PauseCircle size={13} />
                              </button>
                            )}

                            {u.accountStatus === 'Suspended' && (
                              <button onClick={() => handleActivate(u)} title="Reactivate user" className="btn btn-emerald btn-sm" style={{ padding: '5px 8px' }}>
                                <PlayCircle size={13} /> Reactivate
                              </button>
                            )}

                            {u.userType !== 'Admin' && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title={`Permanently delete ${u.fullName} (${u.userType})`}
                                className="btn btn-danger btn-sm"
                                style={{ padding: '5px 8px' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* ============ MODAL: POST / EDIT PRODUCT FORM =========== */}
      {/* ======================================================== */}
      {productModalOpen && (
        <div style={modalOverlay}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '860px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-subtle)',
            maxHeight: '92vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', paddingBottom: '16px', borderBottom: '1.5px solid var(--border-subtle)' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  <Layers size={13} /> Dual-Portal Product Management
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {editingProduct ? `Edit: ${editingProduct.name}` : 'Create Single Product for Both Portals'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
                  Manage common product attributes in one record while independently configuring <strong>Customer (Retail)</strong> and <strong>Distributor (B2B)</strong> pricing and portal visibility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              {/* ======================================================== */}
              {/* SECTION 1: COMMON PRODUCT INFORMATION */}
              {/* ======================================================== */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                  <Package size={18} color="#0f766e" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    1. Common Product Information
                  </span>
                  <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600, marginLeft: 'auto' }}>
                    Shared across both portals
                  </span>
                </div>

                {/* Product Name */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ultra-Fast 65W GaN Dual-Port Charger (Type-C + USB-A)"
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                {/* SKU, Brand & Category */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '14px'
                }}>
                  {/* SKU */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                        Product Code / SKU *
                      </label>
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, sku: `MWS-${Date.now().toString().slice(-6)}` })}
                        style={{ background: 'none', border: 'none', color: '#0d9488', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Generate SKU
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="MWS-CHG-65W"
                      value={productForm.sku}
                      onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                      style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                      Brand / Manufacturer
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MWS Eagle, OEM, Samsung"
                      value={productForm.brand}
                      onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                        Category *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setProductModalOpen(false);
                          setActiveTab('categories');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#7c3aed',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: 0
                        }}
                        title="Manage product categories"
                      >
                        <FolderTree size={12} /> Manage Categories
                      </button>
                    </div>
                    <select
                      value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {Array.from(new Set([...activeCategoryList, productForm.category].filter(Boolean))).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Product Picture File Upload (File Upload System Only) */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                    Product Picture (File Upload Only) *
                  </label>

                  {productForm.imageUrl ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 16px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1'
                    }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={getMediaUrl(productForm.imageUrl)}
                          alt="Product"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80'; }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {productForm.imageUrl.split('/').pop()}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                          <CheckCircle size={13} /> Picture ready & linked to product
                        </div>
                      </div>

                      <label style={{
                        padding: '8px 14px',
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#334155',
                        cursor: uploadingProductImg ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.16s'
                      }}>
                        <Upload size={14} />
                        {uploadingProductImg ? 'Uploading...' : 'Change Picture'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          disabled={uploadingProductImg}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '24px 16px',
                      background: uploadingProductImg ? '#f1f5f9' : '#f8fafc',
                      borderRadius: '12px',
                      border: '2px dashed #94a3b8',
                      cursor: uploadingProductImg ? 'wait' : 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#0d9488'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#94a3b8'}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(13, 148, 136, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0d9488'
                      }}>
                        {uploadingProductImg ? (
                          <div className="spinner" style={{ width: '20px', height: '20px' }} />
                        ) : (
                          <Upload size={22} />
                        )}
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                        {uploadingProductImg ? 'Uploading picture to server...' : 'Click to Upload Product Picture'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Choose file from device — Supports JPG, PNG, WEBP, GIF, SVG (up to 20MB)
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageUpload}
                        disabled={uploadingProductImg}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>

                {/* Description & Specifications */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '12px',
                  marginBottom: '14px'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                      Description
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Short summary of key benefits, materials, and usage..."
                      value={productForm.description}
                      onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                      style={textareaStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                      Specifications / Key Features
                    </label>
                    <textarea
                      rows="3"
                      placeholder="• Pin Configuration: Type-C PD 3.0&#10;• Power Output: 65W Super Fast Charging&#10;• Warranty: 6 Months Official Replacement"
                      value={productForm.specifications}
                      onChange={e => setProductForm({ ...productForm, specifications: e.target.value })}
                      style={textareaStyle}
                    />
                  </div>
                </div>

                {/* Badge, Stock & Product Status */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                      Badge Label (Optional)
                    </label>
                    <select
                      value={productForm.badge}
                      onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">None</option>
                      <option value="Bestseller">Bestseller</option>
                      <option value="New!">New Arrival</option>
                      <option value="Hot Deal">Hot Deal</option>
                      <option value="Wholesale Special">Wholesale Special</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                      Stock / Inventory Status
                    </label>
                    <select
                      value={productForm.inStock}
                      onChange={e => setProductForm({ ...productForm, inStock: Number(e.target.value) })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value={1}>In Stock (Available for Orders)</option>
                      <option value={0}>Out of Stock</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                      Product Lifecycle Status
                    </label>
                    <select
                      value={productForm.productStatus}
                      onChange={e => setProductForm({ ...productForm, productStatus: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="Active">Active (Published)</option>
                      <option value="Draft">Draft (Unpublished)</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION 2: CUSTOMER PORTAL PRICING & VISIBILITY */}
              {/* ======================================================== */}
              <div style={{
                background: '#f0fdf4',
                border: '2px solid #86efac',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.06)'
              }}>
                {/* Header & Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={15} />
                    </div>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#065f46' }}>
                        2. Customer Portal Pricing (Retail)
                      </span>
                      <div style={{ fontSize: '0.74rem', color: '#047857' }}>
                        Controls retail customer pricing and launch visibility
                      </div>
                    </div>
                  </div>

                  {/* Show on Customer Portal Toggle Switch */}
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: productForm.showOnCustomerPortal ? '#059669' : '#e2e8f0',
                    color: productForm.showOnCustomerPortal ? '#ffffff' : '#64748b',
                    fontSize: '0.80rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={productForm.showOnCustomerPortal}
                      onChange={e => setProductForm({ ...productForm, showOnCustomerPortal: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Show on Customer Portal
                  </label>
                </div>

                {/* Customer Pricing Mode Switcher */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', marginBottom: '8px' }}>
                    Customer Pricing Mode:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const newPrice = calcFinalPrice(productForm.customerOriginalPrice, productForm.customerDiscount);
                        setProductForm({ ...productForm, customerPricingMode: 'auto', customerPrice: newPrice });
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: productForm.customerPricingMode === 'auto' ? '2px solid #059669' : '1.5px solid #cbd5e1',
                        background: productForm.customerPricingMode === 'auto' ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        color: productForm.customerPricingMode === 'auto' ? '#047857' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: productForm.customerPricingMode === 'auto' ? '0 2px 6px rgba(5, 150, 105, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                        <Calculator size={14} /> Automatic Calculation Mode
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#059669', opacity: 0.9 }}>
                        Original Price - Discount % = Final Price
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, customerPricingMode: 'manual' })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: productForm.customerPricingMode === 'manual' ? '2px solid #059669' : '1.5px solid #cbd5e1',
                        background: productForm.customerPricingMode === 'manual' ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        color: productForm.customerPricingMode === 'manual' ? '#047857' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: productForm.customerPricingMode === 'manual' ? '0 2px 6px rgba(5, 150, 105, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                        <Tag size={14} /> Manual Pricing Mode
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#059669', opacity: 0.9 }}>
                        Admin manually types final Customer selling price
                      </span>
                    </button>
                  </div>
                </div>

                {/* Customer Pricing Inputs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginBottom: '14px'
                }}>
                  {/* Customer Original Price */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '6px', color: '#065f46' }}>
                      Customer Original Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      placeholder="e.g. 2000"
                      value={productForm.customerOriginalPrice}
                      onChange={e => {
                        const newOrig = parseFloat(e.target.value) || 0;
                        if (productForm.customerPricingMode === 'auto') {
                          const newFinal = calcFinalPrice(newOrig, productForm.customerDiscount);
                          setProductForm({ ...productForm, customerOriginalPrice: e.target.value, customerPrice: newFinal });
                        } else {
                          const newDisc = calcDiscountPercent(newOrig, productForm.customerPrice);
                          setProductForm({ ...productForm, customerOriginalPrice: e.target.value, customerDiscount: newDisc });
                        }
                      }}
                      style={{ ...inputStyle, borderColor: '#86efac' }}
                    />
                  </div>

                  {/* Customer Discount (%) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '6px', color: '#065f46' }}>
                      Customer Discount (%) {productForm.customerPricingMode === 'auto' ? '*' : '(Calculated)'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g. 10"
                        value={productForm.customerDiscount}
                        onChange={e => {
                          const newDisc = parseFloat(e.target.value) || 0;
                          if (productForm.customerPricingMode === 'auto') {
                            const newFinal = calcFinalPrice(productForm.customerOriginalPrice, newDisc);
                            setProductForm({ ...productForm, customerDiscount: e.target.value, customerPrice: newFinal });
                          } else {
                            setProductForm({ ...productForm, customerDiscount: e.target.value });
                          }
                        }}
                        style={{ ...inputStyle, borderColor: '#86efac' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#047857' }}>%</span>
                    </div>
                  </div>

                  {/* Customer Final Price */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '6px', color: '#065f46' }}>
                      Customer Final Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      readOnly={productForm.customerPricingMode === 'auto'}
                      placeholder="e.g. 1800"
                      value={productForm.customerPrice}
                      onChange={e => {
                        const newPrice = parseFloat(e.target.value) || 0;
                        const newDisc = calcDiscountPercent(productForm.customerOriginalPrice, newPrice);
                        setProductForm({ ...productForm, customerPrice: e.target.value, customerDiscount: newDisc });
                      }}
                      style={{
                        ...inputStyle,
                        borderColor: '#86efac',
                        background: productForm.customerPricingMode === 'auto' ? '#f0fdf4' : '#ffffff',
                        fontWeight: 800,
                        color: '#047857'
                      }}
                    />
                  </div>
                </div>

                {/* Live Customer Portal Preview Badge */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 600 }}>
                    <strong>Retail Customer will see:</strong>{' '}
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669', marginLeft: '6px' }}>
                      ₹{Number(productForm.customerPrice || 0).toLocaleString()}
                    </span>
                    {Number(productForm.customerOriginalPrice) > Number(productForm.customerPrice) && (
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>
                        ₹{Number(productForm.customerOriginalPrice).toLocaleString()}
                      </span>
                    )}
                    {Number(productForm.customerDiscount) > 0 && (
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>
                        {productForm.customerDiscount}% OFF
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: productForm.showOnCustomerPortal ? '#059669' : '#dc2626' }}>
                    {productForm.showOnCustomerPortal ? '● Visible on Customer Portal' : '○ Hidden from Customer Portal'}
                  </span>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION 3: DISTRIBUTOR PORTAL PRICING & VISIBILITY */}
              {/* ======================================================== */}
              <div style={{
                background: '#f0f9ff',
                border: '2px solid #7dd3fc',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.06)'
              }}>
                {/* Header & Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0284c7', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={15} />
                    </div>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#075985' }}>
                        3. Distributor Portal Pricing (Wholesale B2B)
                      </span>
                      <div style={{ fontSize: '0.74rem', color: '#0369a1' }}>
                        Independent wholesale pricing and launch visibility
                      </div>
                    </div>
                  </div>

                  {/* Show on Distributor Portal Toggle Switch */}
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: productForm.showOnDistributorPortal ? '#0284c7' : '#e2e8f0',
                    color: productForm.showOnDistributorPortal ? '#ffffff' : '#64748b',
                    fontSize: '0.80rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={productForm.showOnDistributorPortal}
                      onChange={e => setProductForm({ ...productForm, showOnDistributorPortal: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Show on Distributor Portal
                  </label>
                </div>

                {/* Distributor Pricing Mode Switcher */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#075985', marginBottom: '8px' }}>
                    Distributor Pricing Mode:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const newPrice = calcFinalPrice(productForm.distributorOriginalPrice, productForm.distributorDiscount);
                        setProductForm({ ...productForm, distributorPricingMode: 'auto', distributorPrice: newPrice });
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: productForm.distributorPricingMode === 'auto' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                        background: productForm.distributorPricingMode === 'auto' ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        color: productForm.distributorPricingMode === 'auto' ? '#0369a1' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: productForm.distributorPricingMode === 'auto' ? '0 2px 6px rgba(2, 132, 199, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                        <Calculator size={14} /> Automatic Calculation Mode
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#0284c7', opacity: 0.9 }}>
                        Distributor Original - Discount % = Final Wholesale Price
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, distributorPricingMode: 'manual' })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: productForm.distributorPricingMode === 'manual' ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                        background: productForm.distributorPricingMode === 'manual' ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        color: productForm.distributorPricingMode === 'manual' ? '#0369a1' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: productForm.distributorPricingMode === 'manual' ? '0 2px 6px rgba(2, 132, 199, 0.15)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}>
                        <Tag size={14} /> Manual Pricing Mode
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#0284c7', opacity: 0.9 }}>
                        Admin manually types final wholesale Distributor price
                      </span>
                    </button>
                  </div>
                </div>

                {/* Distributor Pricing Inputs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  marginBottom: '14px'
                }}>
                  {/* Distributor Original Price */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '6px', color: '#075985' }}>
                      Distributor Original Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      placeholder="e.g. 1500"
                      value={productForm.distributorOriginalPrice}
                      onChange={e => {
                        const newOrig = parseFloat(e.target.value) || 0;
                        if (productForm.distributorPricingMode === 'auto') {
                          const newFinal = calcFinalPrice(newOrig, productForm.distributorDiscount);
                          setProductForm({ ...productForm, distributorOriginalPrice: e.target.value, distributorPrice: newFinal });
                        } else {
                          const newDisc = calcDiscountPercent(newOrig, productForm.distributorPrice);
                          setProductForm({ ...productForm, distributorOriginalPrice: e.target.value, distributorDiscount: newDisc });
                        }
                      }}
                      style={{ ...inputStyle, borderColor: '#7dd3fc' }}
                    />
                  </div>

                  {/* Distributor Discount (%) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '6px', color: '#075985' }}>
                      Distributor Discount (%) {productForm.distributorPricingMode === 'auto' ? '*' : '(Calculated)'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g. 25"
                        value={productForm.distributorDiscount}
                        onChange={e => {
                          const newDisc = parseFloat(e.target.value) || 0;
                          if (productForm.distributorPricingMode === 'auto') {
                            const newFinal = calcFinalPrice(productForm.distributorOriginalPrice, newDisc);
                            setProductForm({ ...productForm, distributorDiscount: e.target.value, distributorPrice: newFinal });
                          } else {
                            setProductForm({ ...productForm, distributorDiscount: e.target.value });
                          }
                        }}
                        style={{ ...inputStyle, borderColor: '#7dd3fc' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7' }}>%</span>
                    </div>
                  </div>

                  {/* Distributor Final Price */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '6px', color: '#075985' }}>
                      Distributor Final Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      readOnly={productForm.distributorPricingMode === 'auto'}
                      placeholder="e.g. 1125"
                      value={productForm.distributorPrice}
                      onChange={e => {
                        const newPrice = parseFloat(e.target.value) || 0;
                        const newDisc = calcDiscountPercent(productForm.distributorOriginalPrice, newPrice);
                        setProductForm({ ...productForm, distributorPrice: e.target.value, distributorDiscount: newDisc });
                      }}
                      style={{
                        ...inputStyle,
                        borderColor: '#7dd3fc',
                        background: productForm.distributorPricingMode === 'auto' ? '#f0f9ff' : '#ffffff',
                        fontWeight: 800,
                        color: '#0284c7'
                      }}
                    />
                  </div>
                </div>

                {/* Live Distributor Portal Preview Badge */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#075985', fontWeight: 600 }}>
                    <strong>Wholesale Distributor will see:</strong>{' '}
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0284c7', marginLeft: '6px' }}>
                      ₹{Number(productForm.distributorPrice || 0).toLocaleString()}
                    </span>
                    {Number(productForm.distributorOriginalPrice) > Number(productForm.distributorPrice) && (
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>
                        ₹{Number(productForm.distributorOriginalPrice).toLocaleString()}
                      </span>
                    )}
                    {Number(productForm.distributorDiscount) > 0 && (
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px' }}>
                        {productForm.distributorDiscount}% OFF B2B
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: productForm.showOnDistributorPortal ? '#0284c7' : '#dc2626' }}>
                    {productForm.showOnDistributorPortal ? '● Visible on Distributor Portal' : '○ Hidden from Distributor Portal'}
                  </span>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SECTION 4: STRICT SEPARATION & COMPARISON REASSURANCE */}
              {/* ======================================================== */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '22px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <ShieldCheck size={18} color="#4f46e5" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>
                    Role-Based Separation & Margin Contrast
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.80rem'
                }}>
                  <div>
                    <div style={{ color: '#047857', fontWeight: 700 }}>Customer Portal Price</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                      ₹{Number(productForm.customerPrice || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Discount: {productForm.customerDiscount}% | Status: {productForm.showOnCustomerPortal ? 'Published' : 'Hidden'}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#0369a1', fontWeight: 700 }}>Distributor Portal Price</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                      ₹{Number(productForm.distributorPrice || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Discount: {productForm.distributorDiscount}% | Status: {productForm.showOnDistributorPortal ? 'Published' : 'Hidden'}
                    </div>
                  </div>

                  <div>
                    <div style={{ color: '#4338ca', fontWeight: 700 }}>Wholesale Price Delta</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4f46e5', marginTop: '2px' }}>
                      ₹{Math.max(0, Number(productForm.customerPrice || 0) - Number(productForm.distributorPrice || 0)).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      B2B margin over retail
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={13} color="#6366f1" />
                  <span>
                    Strict security guarantee: Customer Portal API never returns distributor prices. Distributor Portal API never returns customer prices.
                  </span>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    padding: '10px 26px',
                    fontSize: '0.90rem',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
                  }}
                >
                  {savingProduct ? 'Saving Configuration...' : editingProduct ? 'Save Product Changes' : 'Publish Product to Portals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ============== MODAL: ADD / EDIT CATEGORY ============= */}
      {/* ======================================================== */}
      {categoryModalOpen && (
        <div style={modalOverlay}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '480px',
            width: '100%',
            padding: '24px 28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-subtle)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1.5px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                  {editingCategory ? 'Update category name or image' : 'Enter category name and image'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              {/* Category Name */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Displays, Fast Chargers, Batteries..."
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  style={inputStyle}
                  autoFocus
                />
              </div>

              {/* Category Image */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                  Category Image
                </label>
                
                {/* Image Live Preview */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '12px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {categoryForm.imageUrl ? (
                      <img
                        src={getMediaUrl(categoryForm.imageUrl)}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <ImageIcon size={26} color="#94a3b8" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                      {categoryForm.imageUrl ? 'Image Selected' : 'No Image Selected'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', wordBreak: 'break-all' }}>
                      {categoryForm.imageUrl ? categoryForm.imageUrl : 'Paste an image URL or choose a file from your device below.'}
                    </div>
                    {categoryForm.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, imageUrl: '' })}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: '4px' }}
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>

                {/* Image URL Input */}
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="https://... (Direct image link)"
                    value={categoryForm.imageUrl}
                    onChange={e => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                {/* File Upload Option */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: uploadingCategoryImg ? 'wait' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}>
                    <Upload size={14} />
                    {uploadingCategoryImg ? 'Uploading...' : 'Upload Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingCategoryImg}
                      onChange={handleCategoryImgUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>PNG, JPG, WEBP, SVG</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '9px 18px', fontSize: '0.86rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory || uploadingCategoryImg}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    border: 'none',
                    padding: '9px 22px',
                    fontSize: '0.88rem',
                    fontWeight: 700
                  }}
                >
                  {savingCategory ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ================= MODAL: USER DETAILS ================== */}
      {/* ======================================================== */}
      {selectedUser && (
        <div style={modalOverlay}>
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-xl)', maxWidth: '500px', width: '100%', padding: '28px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{selectedUser.fullName}</h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>{selectedUser.userId}</div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-app-2)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '14px', fontSize: '0.86rem', lineHeight: '1.8', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-body)' }}><strong>Email:</strong> {selectedUser.email}</div>
              <div style={{ color: 'var(--text-body)' }}><strong>Phone:</strong> {selectedUser.phoneNumber}</div>
              <div style={{ color: 'var(--text-body)' }}><strong>Role:</strong> {selectedUser.userType}</div>
              <div style={{ color: 'var(--text-body)' }}><strong>Registered:</strong> {new Date(selectedUser.createdDate).toLocaleString()}</div>
              <div style={{ color: 'var(--text-body)' }}><strong>Last Login:</strong> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</div>
              {selectedUser.statusRemark && <div style={{ color: 'var(--status-rejected)' }}><strong>Remark:</strong> {selectedUser.statusRemark}</div>}
            </div>

            {selectedUser.userType === 'Distributor' && (
              <div style={{ border: '1.5px solid rgba(2,132,199,0.3)', background: 'var(--distributor-light)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '18px', fontSize: '0.86rem', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 800, color: 'var(--distributor-accent)', marginBottom: '6px' }}>Distributor Business Profile</div>
                <div style={{ color: 'var(--text-body)' }}><strong>Company:</strong> {selectedUser.businessName || 'N/A'}</div>
                <div style={{ color: 'var(--text-body)' }}><strong>PAN/VAT:</strong> <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{selectedUser.panVatNumber || 'N/A'}</span></div>
                <div style={{ color: 'var(--text-body)' }}><strong>Address:</strong> {selectedUser.businessAddress || 'N/A'}</div>
                <div style={{ color: 'var(--text-body)' }}><strong>Contact:</strong> {selectedUser.contactPerson || 'N/A'}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedUser.accountStatus === 'Pending' && selectedUser.userType === 'Distributor' && (
                <button onClick={() => { handleApprove(selectedUser); setSelectedUser(null); }} className="btn btn-emerald">
                  <Check size={15} /> Approve Distributor
                </button>
              )}
              <button onClick={() => setSelectedUser(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ================ MODAL: REJECT DISTRIBUTOR ============= */}
      {/* ======================================================== */}
      {rejectModalUser && (
        <div style={modalOverlay}>
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-xl)', maxWidth: '450px', width: '100%', padding: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px', color: 'var(--status-rejected)' }}>Reject Distributor Application</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '16px' }}>
              Are you sure you want to reject <strong>{rejectModalUser.businessName || rejectModalUser.fullName}</strong>?
            </p>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-body)' }}>Rejection Reason:</label>
              <textarea
                rows="3"
                placeholder="e.g. Invalid PAN/VAT registration documents..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                style={textareaStyle}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setRejectModalUser(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleRejectConfirm} className="btn btn-danger">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ================== MODAL: SUSPEND USER ================= */}
      {/* ======================================================== */}
      {suspendModalUser && (
        <div style={modalOverlay}>
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-xl)', maxWidth: '450px', width: '100%', padding: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px', color: 'var(--status-suspended)' }}>Suspend User Account</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '16px' }}>
              Suspending <strong>{suspendModalUser.fullName}</strong> revokes all active session permissions immediately.
            </p>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-body)' }}>Suspension Reason:</label>
              <textarea
                rows="3"
                placeholder="e.g. Terms violation, suspicious activity..."
                value={suspensionReason}
                onChange={e => setSuspensionReason(e.target.value)}
                style={textareaStyle}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSuspendModalUser(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSuspendConfirm} className="btn btn-danger">Suspend Account</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ============ MODAL: ORDER DETAILS & INVOICE ============ */}
      {/* ======================================================== */}
      {selectedOrderDetails && (
        <div style={modalOverlay}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Purchase Order Invoice
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2563eb', margin: '2px 0 0 0', fontFamily: 'monospace' }}>
                  {selectedOrderDetails.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Customer & Shipping Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Customer Profile:
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedOrderDetails.customerName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                    {selectedOrderDetails.customerPhone}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {selectedOrderDetails.customerEmail}
                  </div>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '1px 8px',
                    borderRadius: '4px',
                    background: selectedOrderDetails.userType === 'Distributor' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                    color: selectedOrderDetails.userType === 'Distributor' ? '#0284c7' : '#059669'
                  }}>
                    {selectedOrderDetails.userType} Account
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Delivery Destination:
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.45 }}>
                    {selectedOrderDetails.shippingAddress}
                    {selectedOrderDetails.district && `, District: ${selectedOrderDetails.district}`}
                    {selectedOrderDetails.city && `, ${selectedOrderDetails.city}`}
                    {selectedOrderDetails.state && `, ${selectedOrderDetails.state}`}
                    {selectedOrderDetails.postalCode && ` - ${selectedOrderDetails.postalCode}`}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '6px' }}>
                    Payment: <strong>{selectedOrderDetails.paymentMethod}</strong>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: selectedOrderDetails.paymentStatus === 'Verified & Approved' ? '#dcfce7' : '#fef3c7',
                      color: selectedOrderDetails.paymentStatus === 'Verified & Approved' ? '#15803d' : '#b45309'
                    }}>
                      {selectedOrderDetails.paymentStatus || 'Pending Verification'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Online Payment Proof Verification Strip (If online or proof attached) */}
              {(selectedOrderDetails.transactionId || selectedOrderDetails.paymentScreenshot) && (
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {selectedOrderDetails.paymentScreenshot && (
                      <img
                        src={getMediaUrl(selectedOrderDetails.paymentScreenshot)}
                        alt="Payment Proof"
                        onClick={() => setViewProofModal(selectedOrderDetails)}
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '2px solid #2563eb',
                          cursor: 'pointer'
                        }}
                        title="Click to view full screenshot proof"
                      />
                    )}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                        Online Payment Proof
                      </div>
                      {selectedOrderDetails.transactionId && (
                        <div style={{ fontSize: '0.84rem', color: '#334155', marginTop: '2px' }}>
                          UTR / Ref No: <strong style={{ fontFamily: 'monospace', color: '#059669' }}>{selectedOrderDetails.transactionId}</strong>
                        </div>
                      )}
                      {selectedOrderDetails.paymentScreenshot && (
                        <button
                          onClick={() => setViewProofModal(selectedOrderDetails)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: 0,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Enlarge Payment Screenshot ↗
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedOrderDetails.paymentStatus === 'Pending Verification' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApprovePayment(selectedOrderDetails.id)}
                        className="btn btn-emerald"
                        style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 800 }}
                      >
                        ✓ Approve Payment
                      </button>
                      <button
                        onClick={() => handleRejectPayment(selectedOrderDetails.id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 800 }}
                      >
                        ✕ Reject Payment
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Items Ordered List */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Ordered Items Breakdown:
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 12px', fontSize: '0.72rem' }}>ITEM</th>
                        <th style={{ padding: '8px 12px', fontSize: '0.72rem', textAlign: 'center' }}>QTY</th>
                        <th style={{ padding: '8px 12px', fontSize: '0.72rem', textAlign: 'right' }}>UNIT PRICE</th>
                        <th style={{ padding: '8px 12px', fontSize: '0.72rem', textAlign: 'right' }}>SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrderDetails.items && selectedOrderDetails.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{it.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{it.sku} · {it.category}</div>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: '#2563eb' }}>
                            {it.quantity}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                            ₹{Number(it.unitPrice).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₹{Number(it.subtotal || it.unitPrice * it.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total & Status Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Total Order Value:</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#2563eb' }}>
                    ₹{Number(selectedOrderDetails.totalAmount).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Change Status:</span>
                  <select
                    value={selectedOrderDetails.orderStatus}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrderDetails.id, e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #2563eb',
                      background: '#ffffff',
                      fontWeight: 800,
                      color: '#0f172a',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedOrderDetails(null)} className="btn btn-secondary">
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ========== MODAL: VIEW PAYMENT SCREENSHOT PROOF ======== */}
      {/* ======================================================== */}
      {viewProofModal && (
        <div style={modalOverlay}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Payment Screenshot Proof Verification
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                  Order #{viewProofModal.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setViewProofModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Info strip */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.84rem'
              }}>
                <div><strong>Buyer:</strong> {viewProofModal.customerName} ({viewProofModal.userType})</div>
                <div><strong>Amount:</strong> <span style={{ color: '#2563eb', fontWeight: 900 }}>₹{Number(viewProofModal.totalAmount).toLocaleString()}</span></div>
                <div><strong>Payment Method:</strong> {viewProofModal.paymentMethod}</div>
                <div><strong>Payment Status:</strong> <span style={{ fontWeight: 800, color: viewProofModal.paymentStatus === 'Verified & Approved' ? '#059669' : '#d97706' }}>{viewProofModal.paymentStatus}</span></div>
                {viewProofModal.transactionId && (
                  <div style={{ gridColumn: 'span 2', background: '#ecfdf5', padding: '6px 10px', borderRadius: '6px', color: '#065f46' }}>
                    <strong>Transaction ID / UTR:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{viewProofModal.transactionId}</span>
                  </div>
                )}
              </div>

              {/* Full Screenshot Image */}
              <div style={{
                background: '#0f172a',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '260px'
              }}>
                <img
                  src={getMediaUrl(viewProofModal.paymentScreenshot)}
                  alt="Payment Proof Full"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '440px',
                    objectFit: 'contain',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>

            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {viewProofModal.paymentStatus !== 'Verified & Approved' && (
                  <button
                    onClick={() => handleApprovePayment(viewProofModal.id)}
                    className="btn btn-emerald"
                    style={{ padding: '8px 16px', fontSize: '0.84rem', fontWeight: 800 }}
                  >
                    ✓ Approve Payment
                  </button>
                )}
                {viewProofModal.paymentStatus !== 'Payment Rejected' && (
                  <button
                    onClick={() => handleRejectPayment(viewProofModal.id)}
                    className="btn btn-danger"
                    style={{ padding: '8px 16px', fontSize: '0.84rem', fontWeight: 800 }}
                  >
                    ✕ Reject Payment
                  </button>
                )}
              </div>
              <button onClick={() => setViewProofModal(null)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
