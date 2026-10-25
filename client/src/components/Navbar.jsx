import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import {
  Search,
  User,
  Heart,
  ShoppingCart,
  Menu,
  ChevronDown,
  LogOut,
  Building2,
  ShieldCheck,
  Package,
  Layers,
  Zap,
  Battery,
  Cable,
  Headphones,
  Tag,
  CheckCircle2,
  ExternalLink,
  Gift,
  X,
  Phone,
  MessageCircle,
  Bell,
  Home as HomeIcon,
  Store,
  ChevronRight
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { user, logout, navigate, currentRoute } = useAuth();
  const {
    cartCount,
    wishlistCount,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsTrackOrderOpen,
    setIsContactOpen,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory
  } = useCart();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    const loadCats = () => {
      api.categories.getAll()
        .then(res => {
          if (res && res.success && Array.isArray(res.categories)) {
            setDbCategories(res.categories);
          }
        })
        .catch(console.error);
    };
    loadCats();
    window.addEventListener('mws_categories_updated', loadCats);
    return () => window.removeEventListener('mws_categories_updated', loadCats);
  }, []);

  useEffect(() => {
    const handleOpenMenu = () => setMobileMenuOpen(true);
    window.addEventListener('mws_open_mobile_menu', handleOpenMenu);
    return () => window.removeEventListener('mws_open_mobile_menu', handleOpenMenu);
  }, []);

  // Check if currently on Admin Dashboard route
  const isOnAdminDashboard = currentRoute === '/admin' || currentRoute === '/admin-access' || currentRoute === '/portal/admin';

  // If viewing Admin Panel, render ONLY the required admin controls (no consumer shopping cart, search, wishlist, or category bar)
  if (isOnAdminDashboard) {
    return (
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#ffffff',
        borderBottom: '1.5px solid var(--border-medium)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          maxWidth: '100%',
          padding: '8px clamp(10px, 2.5vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          boxSizing: 'border-box'
        }}>
          {/* Left: Brand Logo + Admin Authority Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                minWidth: 0
              }}
            >
              <img
                src="/mws_eagle_logo.jpg?v=3"
                alt="MWS Eagle Official Logo"
                style={{
                  height: '34px',
                  width: 'auto',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  flexShrink: 0
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  color: '#0f172a',
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap'
                }}>
                  MWS <span style={{ color: '#2563eb' }}>EAGLE</span>
                </div>
                <div className="hide-on-mobile" style={{
                  fontSize: '0.48rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}>
                  PREMIUM MOBILE ACCESSORIES
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              color: '#2563eb',
              fontSize: '0.70rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              flexShrink: 0
            }}>
              <ShieldCheck size={13} />
              <span className="hide-on-mobile">Admin Panel</span>
            </div>
          </div>

          {/* Right: Required Admin Controls Only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Real-time Admin Notification Bell */}
            <NotificationBell />

            {/* View Live Storefront */}
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.16s ease',
                flexShrink: 0
              }}
              title="Preview Customer Website"
            >
              <ExternalLink size={14} />
              <span className="hide-on-mobile">Storefront</span>
            </button>

            {/* Admin User Profile Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-full)',
              flexShrink: 0
            }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 900
              }}>
                A
              </div>
              <div className="hide-on-mobile" style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                  {user?.fullName || 'System Super Admin'}
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669' }}>
                  ● Active Session
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#dc2626',
                border: '1px solid #fca5a5',
                background: '#fef2f2',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Logout"
            >
              <LogOut size={14} />
              <span className="hide-on-mobile">Logout</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  const categories = [
    { id: 'All', name: 'All Products', icon: Layers },
    ...(dbCategories.length > 0
      ? dbCategories.map(c => ({ id: c.name, name: c.name, icon: Tag }))
      : [
          { id: 'Charging', name: 'Charging', icon: Zap },
          { id: 'Power', name: 'Power', icon: Battery },
          { id: 'Cables', name: 'Cables', icon: Cable },
          { id: 'Audio', name: 'Audio', icon: Headphones },
          { id: 'Protection', name: 'Protection', icon: ShieldCheck }
        ])
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const el = document.getElementById('best-selling-products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    const el = document.getElementById('best-selling-products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleShopClick = () => {
    const el = document.getElementById('best-selling-products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/');
    }
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
    }}>
      {/* ================= TIER 1: BRAND LOGO + SEARCH + ACTIONS ================= */}
      <div className="navbar-tier1">
        {/* ROW 1: Logo & Three-dot/Hamburger menu on LEFT | Notification Bell & S Profile on RIGHT */}
        <div className="navbar-row-top">
          {/* Left: Brand Logo (Top mobile menu button removed) */}
          <div className="navbar-row1-left">
            <div
              onClick={() => {
                if (user?.role === 'Customer' || user?.userType === 'Customer') navigate('/customer');
                else if (user?.role === 'Distributor' || user?.userType === 'Distributor') navigate('/distributor');
                else if (user?.role === 'Admin' || user?.userType === 'Admin') navigate('/admin');
                else navigate('/');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                flexShrink: 1,
                minWidth: 0
              }}
            >
              <img
                src="/mws_eagle_logo.jpg?v=3"
                alt="MWS Eagle Official Logo"
                style={{
                  height: '34px',
                  width: 'auto',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  flexShrink: 0
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  lineHeight: 1.15,
                  fontFamily: 'var(--font-main)',
                  whiteSpace: 'nowrap'
                }}>
                  MWS <span style={{ color: '#ffffff' }}>EAGLE</span>
                </div>
                <div className="hide-on-mobile" style={{
                  fontSize: '0.50rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#e0f2fe',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}>
                  PREMIUM MOBILE ACCESSORIES
                </div>
              </div>
            </div>
          </div>

          {/* Right: Notification Bell + Wishlist + Cart + Profile */}
          <div className="navbar-row1-right">
            {/* Notification Bell */}
            {user ? (
              <NotificationBell />
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="nav-icon-btn"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={20} color="#ffffff" />
                <span className="nav-badge-pill nav-badge-red">2</span>
              </button>
            )}

            {/* Wishlist Heart Icon */}
            <button
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              className="nav-icon-btn"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart size={20} color="#ffffff" strokeWidth={2} />
              {wishlistCount > 0 && (
                <span className="nav-badge-pill nav-badge-red">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="nav-icon-btn"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingCart size={20} color="#ffffff" strokeWidth={2} />
              <span className="nav-badge-pill nav-badge-red">
                {cartCount || 0}
              </span>
            </button>

            {/* S Profile / User Account */}
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="nav-profile-circle-btn"
                  aria-label="User profile menu"
                >
                  <User size={18} color="#ffffff" />
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '210px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      zIndex: 200,
                      padding: '8px 0',
                      overflow: 'hidden'
                    }}
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{user.fullName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{user.userType} Account</div>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (user.userType === 'Customer') navigate('/portal/customer');
                        else if (user.userType === 'Distributor') navigate('/portal/distributor');
                        else if (user.userType === 'Admin') navigate('/admin');
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '0.86rem',
                        color: '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Layers size={15} color="#2563eb" />
                      My Portal
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setIsTrackOrderOpen(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '0.86rem',
                        color: '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Package size={15} color="#059669" />
                      My Orders
                    </button>

                    <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: '0.86rem',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="nav-profile-circle-btn"
                title="Login / Register"
                aria-label="Login / Register"
              >
                <User size={18} color="#ffffff" />
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Full-Width Search Bar */}
        <div className="navbar-row-secondary">
          <form onSubmit={handleSearchSubmit} className="navbar-search-form">
            <span className="navbar-search-left-icon">
              <Search size={16} color="#0284c7" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, categories, model..."
              className="navbar-search-input"
            />
            <button
              type="submit"
              className="navbar-search-btn"
              aria-label="Search"
            >
              <Search size={14} color="#ffffff" />
            </button>
          </form>
        </div>
      </div>

      {/* ================= TIER 2: SUB-NAVIGATION BAR (CATEGORIES, HOME, SHOP, TRACK ORDER) ================= */}
      <div className="navbar-tier2-wrapper">
        <div className="navbar-tier2-container">
          {/* 1. All Categories */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('shop-by-category-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                setMobileMenuOpen(true);
              }
            }}
            className="nav-all-categories-pill"
            title="All Categories"
          >
            <Menu size={15} />
            <span>All Categories</span>
            <ChevronRight size={13} />
          </button>

          {/* 2. Home */}
          <button
            onClick={() => {
              if (user?.role === 'Customer' || user?.userType === 'Customer') navigate('/customer');
              else if (user?.role === 'Distributor' || user?.userType === 'Distributor') navigate('/distributor');
              else if (user?.role === 'Admin' || user?.userType === 'Admin') navigate('/admin');
              else navigate('/');
            }}
            className={`nav-link-btn ${currentRoute === '/' || currentRoute === '/customer' || !currentRoute ? 'active' : ''}`}
          >
            <HomeIcon size={15} />
            <span>Home</span>
            {(currentRoute === '/' || currentRoute === '/customer' || !currentRoute) && (
              <span className="nav-active-bar" />
            )}
          </button>

          {/* 3. Shop */}
          <button
            onClick={handleShopClick}
            className="nav-link-btn"
          >
            <Store size={15} />
            <span>Shop</span>
          </button>

          {/* 4. Track Order */}
          <button
            onClick={() => setIsTrackOrderOpen(true)}
            className="nav-link-btn"
          >
            <Package size={15} />
            <span>Track Order</span>
          </button>

          {/* 5. Contact Us */}
          <button
            onClick={() => setIsContactOpen(true)}
            className="nav-link-btn"
          >
            <Phone size={15} />
            <span>Contact Us</span>
          </button>
        </div>
      </div>

      {/* ================= MOBILE SLIDE-OUT NAVIGATION DRAWER ================= */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-start',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '85%',
              maxWidth: '320px',
              height: '100%',
              background: '#ffffff',
              boxShadow: '4px 0 25px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
          >
            {/* Drawer Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src="/mws_eagle_logo.jpg?v=3"
                  alt="MWS EAGLE"
                  style={{
                    height: '38px',
                    width: 'auto',
                    borderRadius: '8px',
                    objectFit: 'contain',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    flexShrink: 0
                  }}
                />
                <div>
                  <div style={{ fontWeight: 900, fontSize: '0.84rem', color: '#0f172a', lineHeight: 1.15 }}>
                    MWS <span style={{ color: '#2563eb' }}>EAGLE</span>
                  </div>
                  <div style={{ fontSize: '0.50rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>
                    MOBILE SPARES & ACCESSORIES
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* User Session Info or Quick Sign In */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
              {user ? (
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Signed in as</div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>{user.fullName}</div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: user.userType === 'Distributor' ? '#0284c7' : '#059669', marginTop: '2px' }}>
                    {user.userType} Account
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (user.userType === 'Customer') navigate('/portal/customer');
                      else if (user.userType === 'Distributor') navigate('/portal/distributor');
                      else if (user.userType === 'Admin') navigate('/admin');
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', marginTop: '12px', fontWeight: 700 }}
                  >
                    Open {user.userType} Portal
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '10px' }}>
                    Sign in to track orders, save wishlist, or access wholesale prices.
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', fontWeight: 700 }}
                  >
                    <User size={15} /> Sign In / Register
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 8px' }}>
                Quick Navigation
              </div>

              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}
              >
                <Layers size={18} color="#2563eb" />
                Home Marketplace
              </button>

              <button
                onClick={() => { setMobileMenuOpen(false); handleShopClick(); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}
              >
                <Package size={18} color="#059669" />
                Shop All Products
              </button>

              <button
                onClick={() => { setMobileMenuOpen(false); setIsTrackOrderOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}
              >
                <Search size={18} color="#0284c7" />
                Track Order Status
              </button>

              <button
                onClick={() => { setMobileMenuOpen(false); setIsWishlistOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}
              >
                <Heart size={18} color="#ef4444" />
                Wishlist ({wishlistCount})
              </button>

              <button
                onClick={() => { setMobileMenuOpen(false); setIsContactOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 600, color: '#1e293b' }}
              >
                <Phone size={18} color="#8b5cf6" />
                Contact & Support
              </button>

              {/* Product Categories Arrangement in Mobile Drawer */}
              <div style={{ marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px 8px 8px' }}>
                  Product Categories
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {categories.map((cat) => {
                    const isCurrent = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleCategorySelect(cat.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '9px 12px',
                          background: isCurrent ? 'rgba(37, 99, 235, 0.08)' : 'none',
                          border: 'none',
                          textAlign: 'left',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                          fontWeight: isCurrent ? 800 : 600,
                          color: isCurrent ? '#2563eb' : '#1e293b',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        {React.createElement(cat.icon, { size: 16, color: isCurrent ? '#2563eb' : '#64748b' })}
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Direct Instant Contact (Call & WhatsApp) */}
            <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Instant Contact
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href="tel:+919507677590"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontSize: '0.84rem', fontWeight: 700 }}
                >
                  <Phone size={15} /> Call: +91 95076 77590
                </a>
                <a
                  href="https://wa.me/919507677590?text=Hello%20MWS%20EAGLE%2C%20I%20have%20an%20inquiry%20regarding%20mobile%20spare%20parts%20and%20orders."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', background: 'rgba(37, 211, 102, 0.12)', color: '#16a34a', fontSize: '0.84rem', fontWeight: 700 }}
                >
                  <MessageCircle size={15} /> WhatsApp Support
                </a>
              </div>

              {user && (
                <button
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  style={{ width: '100%', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
