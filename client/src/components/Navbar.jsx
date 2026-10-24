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
  Gift
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

  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
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
          padding: '12px clamp(16px, 3vw, 28px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Left: Brand Logo + Admin Authority Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              <img
                src="/mws_eagle_logo.jpg"
                alt="MWS EAGLE"
                style={{
                  height: '40px',
                  width: 'auto',
                  objectFit: 'contain',
                  borderRadius: '6px'
                }}
              />
              <div>
                <div style={{
                  fontSize: '1.24rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  color: '#0f172a',
                  lineHeight: 1.1
                }}>
                  MWS <span style={{ color: '#2563eb' }}>EAGLE</span>
                </div>
                <div style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#64748b',
                  textTransform: 'uppercase'
                }}>
                  PREMIUM MOBILE ACCESSORIES
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              color: '#2563eb',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <ShieldCheck size={14} /> Admin Control Panel
            </div>
          </div>

          {/* Right: Required Admin Controls Only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Real-time Admin Notification Bell */}
            <NotificationBell />

            {/* View Live Storefront */}
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.16s ease'
              }}
              title="Preview Customer Website"
            >
              <ExternalLink size={14} />
              <span className="hide-on-mobile">View Storefront</span>
            </button>

            {/* Admin User Profile Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-full)'
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
              <div style={{ lineHeight: 1.2 }}>
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
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#dc2626',
                border: '1px solid #fca5a5',
                background: '#fef2f2',
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} />
              <span>Logout</span>
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
    setCategoriesDropdownOpen(false);
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
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '12px clamp(14px, 3vw, 24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(12px, 3vw, 24px)'
      }}>
        {/* Left: Brand Logo & Tagline */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <img
            src="/mws_eagle_logo.jpg"
            alt="MWS EAGLE"
            style={{
              height: '42px',
              width: 'auto',
              objectFit: 'contain',
              borderRadius: '6px'
            }}
          />
          <div>
            <div style={{
              fontSize: '1.28rem',
              fontWeight: 900,
              letterSpacing: '0.04em',
              color: '#0f172a',
              lineHeight: 1.1,
              fontFamily: 'var(--font-main)'
            }}>
              MWS <span style={{ color: '#2563eb' }}>EAGLE</span>
            </div>
            <div style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: '#64748b',
              textTransform: 'uppercase'
            }}>
              PREMIUM MOBILE ACCESSORIES
            </div>
          </div>
        </div>

        {/* Center: Large Rounded Search Bar with Blue Action Button */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            flex: 1,
            maxWidth: '620px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for products, model or category..."
            style={{
              width: '100%',
              padding: '11px 54px 11px 20px',
              fontSize: '0.9rem',
              color: '#1f2937',
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '9999px',
              outline: 'none',
              transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2563eb';
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.backgroundColor = '#f8fafc';
              e.target.style.boxShadow = 'none';
            }}
          />

          {/* Blue Round Search Button at Right Edge */}
          <button
            type="submit"
            style={{
              position: 'absolute',
              right: '4px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2563eb')}
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Right: User Login/Register + Wishlist + Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          {/* User Account / Login */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: '#1e293b'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: user.userType === 'Distributor' ? '#0284c7' : '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <span className="hide-on-mobile">{user.fullName.split(' ')[0]}</span>
                <ChevronDown size={14} color="#64748b" />
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
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#1e293b',
                padding: '6px 8px'
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
              onMouseLeave={e => (e.currentTarget.style.color = '#1e293b')}
            >
              <User size={20} color="#1e293b" />
              <span className="hide-on-mobile">Login / Register</span>
            </button>
          )}

          {/* Rewards Shortcut Button (Customer / Distributor) */}
          {user && (user.userType === 'Customer' || user.userType === 'Distributor') && (
            <button
              onClick={() => {
                const target = user.userType === 'Distributor' ? '/distributor?tab=rewards' : '/customer?tab=rewards';
                navigate(target);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1.5px solid #fde68a',
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                color: '#b45309',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="My Rewards & Points"
            >
              <Gift size={14} color="#d97706" />
              <span className="hide-on-mobile">Rewards</span>
            </button>
          )}

          {/* Notification Bell (Customer / Distributor) */}
          {user && <NotificationBell />}

          {/* Wishlist Heart Icon */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e293b'
            }}
            aria-label="Wishlist"
          >
            <Heart size={23} />
            {wishlistCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              position: 'relative',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e293b'
            }}
            aria-label="Shopping Cart"
          >
            <ShoppingCart size={23} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= TIER 2: SUB-NAVIGATION BAR (AS IN IMAGE) ================= */}
      <div style={{
        backgroundColor: '#fafbfc',
        borderTop: '1px solid #f1f5f9'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 clamp(14px, 3vw, 24px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(18px, 4vw, 36px)',
          height: '46px',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {/* All Categories Dropdown Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: '#1e293b',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '6px 0',
                whiteSpace: 'nowrap'
              }}
            >
              <Menu size={18} color="#2563eb" />
              <span>All Categories</span>
              <ChevronDown size={14} color="#64748b" />
            </button>

            {/* Dropdown Menu */}
            {categoriesDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  width: '230px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                  zIndex: 200,
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
                onMouseLeave={() => setCategoriesDropdownOpen(false)}
              >
                {categories.map((cat) => {
                  const isCurrent = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isCurrent ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                        color: isCurrent ? '#2563eb' : '#1f2937',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        fontWeight: isCurrent ? 800 : 600,
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={e => {
                        if (!isCurrent) e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={e => {
                        if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {React.createElement(cat.icon, { size: 16, color: isCurrent ? '#2563eb' : '#64748b' })}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subnav links: Home, Shop, Track Order, Contact Us */}
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#334155',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >
            Home
          </button>

          <button
            onClick={handleShopClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#334155',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >
            Shop
          </button>

          <button
            onClick={() => setIsTrackOrderOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#334155',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >
            Track Order
          </button>

          <button
            onClick={() => setIsContactOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#334155',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >
            Contact Us
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
