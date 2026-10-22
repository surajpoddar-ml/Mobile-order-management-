import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldCheck, Users, Building2, Clock, CheckCircle, XCircle,
  Search, Eye, Trash2, Check, X, PauseCircle, PlayCircle, RefreshCw, Layers,
  Film, Image as ImageIcon, Upload, Plus, ExternalLink, Sparkles,
  LayoutDashboard, Package, Menu, Edit, ArrowLeft, AlertCircle
} from 'lucide-react';

export const AdminPanel = () => {
  const { user, navigate, logout } = useAuth();

  // Metrics state
  const [metrics, setMetrics] = useState({
    customers: { total: 0, active: 0, suspended: 0 },
    distributors: { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 }
  });

  // Core navigation & view state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'pending' | 'distributors' | 'customers' | 'all' | 'products' | 'advertisements'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

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
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Displays',
    sku: '',
    customerPrice: 0,
    distributorPrice: 0,
    targetVisibility: 'Both', // 'Customer' | 'Distributor' | 'Both'
    description: '',
    imageUrl: '',
    inStock: 1
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

  // Categories list for quick select
  const productCategories = [
    'Displays',
    'Batteries',
    'Chargers',
    'USB cables',
    'Earphones',
    'Mobile connectors',
    'Other mobile accessories'
  ];

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
      if (mRes.success) setMetrics(mRes.metrics);
      if (uRes.success) setUsers(uRes.users);
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
      const res = await api.products.getVisibleProducts();
      if (res.success) setAllProducts(res.products || []);
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
      if (res.success) setAdvertisements(res.advertisements || []);
    } catch (err) {
      console.error('Failed to load ads:', err);
    } finally {
      setLoadingAds(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [typeFilter, statusFilter, searchTerm]);

  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'overview') {
      loadProductData();
    }
    if (activeTab === 'advertisements' || activeTab === 'overview') {
      loadAdvertisementData();
    }
  }, [activeTab]);

  // Distributor verification actions
  const handleApprove = async (dist) => {
    if (!window.confirm(`Approve distributor application for "${dist.businessName || dist.fullName}"?`)) return;
    try {
      const r = await api.admin.approveDistributor(dist.id);
      notify(r.message);
      loadUserData();
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
    } catch (e) {
      alert(e.message);
    }
  };

  const handleActivate = async (u) => {
    try {
      const r = await api.admin.activateUser(u.id);
      notify(r.message);
      loadUserData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Permanently delete "${u.fullName}"? This action cannot be undone.`)) return;
    try {
      const r = await api.admin.deleteUser(u.id);
      notify(r.message);
      loadUserData();
    } catch (e) {
      alert(e.message);
    }
  };

  // Product CRUD actions (Admin Authority)
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Displays',
      sku: `PRD-${Date.now().toString().slice(-5)}`,
      customerPrice: 19.99,
      distributorPrice: 8.50,
      targetVisibility: 'Both',
      description: '',
      imageUrl: '',
      inStock: 1
    });
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      sku: prod.sku,
      customerPrice: prod.customerPrice !== undefined ? prod.customerPrice : 0,
      distributorPrice: prod.distributorPrice !== undefined ? prod.distributorPrice : 0,
      targetVisibility: prod.targetVisibility,
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      inStock: prod.inStock === 0 ? 0 : 1
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) {
      return alert('Product Name and SKU are required.');
    }

    setSavingProduct(true);
    try {
      if (editingProduct) {
        const res = await api.products.update(editingProduct.id, productForm);
        if (res.success) {
          notify(`Product "${productForm.name}" updated successfully!`);
          setProductModalOpen(false);
          loadProductData();
        }
      } else {
        const res = await api.products.create(productForm);
        if (res.success) {
          notify(`Product "${productForm.name}" created and published to: ${productForm.targetVisibility} Portal!`);
          setProductModalOpen(false);
          loadProductData();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Are you sure you want to delete product "${prod.name}" (SKU: ${prod.sku})?`)) return;
    try {
      const res = await api.products.delete(prod.id);
      if (res.success) {
        notify(`Product "${prod.name}" deleted.`);
        loadProductData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete product.');
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
  let displayUsers = users;
  if (activeTab === 'pending') {
    displayUsers = users.filter(u => u.userType === 'Distributor' && u.accountStatus === 'Pending');
  } else if (activeTab === 'distributors') {
    displayUsers = users.filter(u => u.userType === 'Distributor');
  } else if (activeTab === 'customers') {
    displayUsers = users.filter(u => u.userType === 'Customer');
  }

  // Filtered products for Product Authority tab
  const filteredProducts = productFilterVisibility === 'All'
    ? allProducts
    : allProducts.filter(p => p.targetVisibility === productFilterVisibility);

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

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5001${url}`;
  };

  // Sidebar Menu Items Definition
  const navMenuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, badge: null, color: 'var(--primary)' },
    { id: 'pending', label: 'Pending Approvals', icon: Clock, badge: metrics.distributors.pending, color: 'var(--status-pending)' },
    { id: 'distributors', label: 'Distributors', icon: Building2, badge: metrics.distributors.approved, color: 'var(--distributor-accent)' },
    { id: 'customers', label: 'Customers', icon: Users, badge: metrics.customers.active, color: 'var(--customer-accent)' },
    { id: 'products', label: 'Product Management', icon: Package, badge: allProducts.length, color: '#0d9488' },
    { id: 'advertisements', label: 'Ad Board & Media', icon: Film, badge: advertisements.length, color: '#ea580c' },
    { id: 'all', label: 'All User Accounts', icon: Search, badge: users.length, color: '#6366f1' },
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
              marginBottom: '28px'
            }}>
              {[
                { label: 'Pending Approvals', value: metrics.distributors.pending, color: 'var(--status-pending)', bg: 'var(--status-pending-bg)', Icon: Clock, tab: 'pending' },
                { label: 'Verified Distributors', value: metrics.distributors.approved, color: 'var(--distributor-accent)', bg: 'var(--distributor-light)', Icon: Building2, tab: 'distributors' },
                { label: 'Active Customers', value: metrics.customers.active, color: 'var(--customer-accent)', bg: 'var(--customer-light)', Icon: Users, tab: 'customers' },
                { label: 'Active Catalog Products', value: allProducts.length, color: '#0d9488', bg: 'rgba(13, 148, 136, 0.08)', Icon: Package, tab: 'products' },
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
                  Product Authority & Visibility Control
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.86rem', margin: 0, maxWidth: '580px' }}>
                  Admin can post products designated for Customer only, Distributor only, or Both portals. Use the Product Management module to create or edit items.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={openNewProductModal} className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '0.88rem' }}>
                  <Plus size={16} /> Post New Product
                </button>
                <button onClick={() => setActiveTab('advertisements')} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.88rem' }}>
                  <Film size={16} /> Manage Ads
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ========= VIEW 2: PRODUCT MANAGEMENT & AUTHORITY ======= */}
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
                  Product Management & Role Visibility
                </h1>
                <p style={{ color: 'var(--text-body)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Post new mobile spares and configure whether they appear in the <strong>Customer Portal</strong>, <strong>Distributor Portal</strong>, or <strong>Both</strong>.
                </p>
              </div>

              <button
                onClick={openNewProductModal}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                  padding: '11px 22px',
                  fontSize: '0.92rem'
                }}
              >
                <Plus size={18} /> Post New Product
              </button>
            </div>

            {/* Filter Tabs for Visibility */}
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '18px'
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-body)', marginRight: '6px' }}>
                Filter Portal Visibility:
              </span>
              {[
                { id: 'All', label: `All Products (${allProducts.length})` },
                { id: 'Customer', label: `Customer Only (${allProducts.filter(p => p.targetVisibility === 'Customer').length})`, color: 'var(--customer-accent)' },
                { id: 'Distributor', label: `Distributor Only (${allProducts.filter(p => p.targetVisibility === 'Distributor').length})`, color: 'var(--distributor-accent)' },
                { id: 'Both', label: `Both Portals (${allProducts.filter(p => p.targetVisibility === 'Both').length})`, color: 'var(--primary)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProductFilterVisibility(tab.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-medium)',
                    background: productFilterVisibility === tab.id ? '#1e293b' : '#ffffff',
                    color: productFilterVisibility === tab.id ? '#ffffff' : 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.16s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Products Table Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', background: 'var(--bg-app-2)', color: 'var(--text-body)' }}>
                      {['SKU', 'PRODUCT NAME', 'CATEGORY', 'CUSTOMER PRICE', 'DEALER PRICE', 'TARGET VISIBILITY', 'STOCK STATUS', 'ACTIONS'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingProducts ? (
                      <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading product catalog...</td></tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No products found under this filter.</td></tr>
                    ) : filteredProducts.map(p => (
                      <tr
                        key={p.id}
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-app)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* SKU */}
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                          {p.sku}
                        </td>

                        {/* Name & desc */}
                        <td style={{ padding: '12px 14px', maxWidth: '240px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
                          {p.description && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.description}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td style={{ padding: '12px 14px' }}>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontSize: '0.72rem' }}>
                            {p.category}
                          </span>
                        </td>

                        {/* Customer Price */}
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: p.customerPrice > 0 ? '#059669' : '#94a3b8' }}>
                          {p.customerPrice > 0 ? `$${p.customerPrice.toFixed(2)}` : 'N/A (Wholesale)'}
                        </td>

                        {/* Distributor Price */}
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0284c7' }}>
                          ${p.distributorPrice.toFixed(2)}
                        </td>

                        {/* Target Visibility */}
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge badge-${p.targetVisibility === 'Customer' ? 'customer' : p.targetVisibility === 'Distributor' ? 'distributor' : 'admin'}`}>
                            {p.targetVisibility === 'Customer' && 'Customer Portal Only'}
                            {p.targetVisibility === 'Distributor' && 'Distributor Portal Only'}
                            {p.targetVisibility === 'Both' && 'Both Portals'}
                          </span>
                        </td>

                        {/* Stock */}
                        <td style={{ padding: '12px 14px' }}>
                          <span className={`badge ${p.inStock ? 'badge-active' : 'badge-suspended'}`}>
                            {p.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => openEditProductModal(p)}
                              title="Edit Product"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 8px' }}
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              title="Delete Product"
                              className="btn btn-danger btn-sm"
                              style={{ padding: '5px 8px' }}
                            >
                              <Trash2 size={13} />
                            </button>
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
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
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
                          <span className={`badge badge-${u.userType.toLowerCase()}`}>
                            {u.userType === 'Customer' && <User size={10} />}
                            {u.userType === 'Distributor' && <Building2 size={10} />}
                            {u.userType === 'Admin' && <ShieldCheck size={10} />}
                            {u.userType}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '13px 16px' }}>
                          <span className={`badge badge-${u.accountStatus.toLowerCase()}`}>{u.accountStatus}</span>
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
                          {new Date(u.createdDate).toLocaleDateString()}
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

                            {u.accountStatus === 'Rejected' && (
                              <button onClick={() => handleDeleteUser(u)} title="Delete record" className="btn btn-danger btn-sm" style={{ padding: '5px 8px' }}>
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
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-subtle)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {editingProduct ? 'Edit Product Details' : 'Post New Product to Marketplace'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
                  Set pricing and designate visibility to Customers, Distributors, or Both.
                </p>
              </div>
              <button onClick={() => setProductModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              {/* Product Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultra-Tough 9H Tempered Glass Screen Protector"
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* SKU & Category */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                marginBottom: '14px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PRD-SCR-101"
                    value={productForm.sku}
                    onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                    Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {productCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TARGET VISIBILITY - CRITICAL CONTROL */}
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid #cbd5e1',
                marginBottom: '16px'
              }}>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Target Visibility Authority *
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'Customer', label: 'Customer Only', sub: 'Retail Portal', color: '#059669', bg: '#ecfdf5', border: '#10b981' },
                    { id: 'Distributor', label: 'Distributor Only', sub: 'Wholesale Portal', color: '#0284c7', bg: '#f0f9ff', border: '#0ea5e9' },
                    { id: 'Both', label: 'Both Portals', sub: 'Universal Access', color: '#4f46e5', bg: '#eef2ff', border: '#6366f1' },
                  ].map(v => {
                    const isSelected = productForm.targetVisibility === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, targetVisibility: v.id })}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${v.border}` : '1.5px solid #e2e8f0',
                          background: isSelected ? v.bg : '#ffffff',
                          color: isSelected ? v.color : '#475569',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div>{v.label}</div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 500, opacity: 0.85 }}>{v.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Price & Distributor Price */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                marginBottom: '14px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#059669' }}>
                    Customer Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 14.99"
                    value={productForm.customerPrice}
                    onChange={e => setProductForm({ ...productForm, customerPrice: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#0284c7' }}>
                    Distributor Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 5.50"
                    value={productForm.distributorPrice}
                    onChange={e => setProductForm({ ...productForm, distributorPrice: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                  Description / Specification
                </label>
                <textarea
                  rows="3"
                  placeholder="Technical details, model compatibility, packaging..."
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  style={textareaStyle}
                />
              </div>

              {/* Image URL & In Stock */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                marginBottom: '22px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                    Optional Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://... (image url)"
                    value={productForm.imageUrl}
                    onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: '#1f2937' }}>
                    Inventory Status
                  </label>
                  <select
                    value={productForm.inStock}
                    onChange={e => setProductForm({ ...productForm, inStock: Number(e.target.value) })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value={1}>In Stock (Ready to Order)</option>
                    <option value={0}>Out of Stock</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
                >
                  {savingProduct ? 'Saving...' : editingProduct ? 'Update Product' : 'Post Product'}
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
              <button
                onClick={handleSuspendConfirm}
                className="btn btn-sm"
                style={{
                  background: 'var(--status-suspended)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
