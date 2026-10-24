import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AdvertisementBoard from '../components/AdvertisementBoard';
import api, { getMediaUrl } from '../services/api';
import {
  Building2,
  ShieldCheck,
  Package,
  CheckCircle,
  Layers,
  Zap,
  Battery,
  Cable,
  Headphones,
  Star,
  ShoppingCart,
  Heart,
  Truck,
  TrendingUp,
  FileText,
  MapPin,
  Gift,
  QrCode
} from 'lucide-react';
import { RewardsSection } from '../components/rewards/RewardsSection';

export const DistributorPortal = () => {
  const { user } = useAuth();
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    searchQuery,
    selectedCategory,
    setSelectedCategory
  } = useCart();

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'orders'
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [dbCategories, setDbCategories] = useState([]);

  const getCategoryImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80';
    return getMediaUrl(url);
  };

  const fetchCategories = () => {
    api.categories.getAll()
      .then(res => {
        if (res && res.success && Array.isArray(res.categories)) {
          setDbCategories(res.categories);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCategories();
    const handleCategorySync = () => fetchCategories();
    window.addEventListener('mws_categories_updated', handleCategorySync);
    return () => window.removeEventListener('mws_categories_updated', handleCategorySync);
  }, []);

  // Circular Categories loaded dynamically from DB (with fallback defaults)
  const circularCategories = dbCategories.length > 0
    ? dbCategories.map(cat => ({
        id: cat.name,
        name: cat.name,
        image: getCategoryImageUrl(cat.imageUrl)
      }))
    : [
        { id: 'Charging', name: 'Charging', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=300&q=80' },
        { id: 'Power', name: 'Power', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=300&q=80' },
        { id: 'Cables', name: 'Cables', image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=300&q=80' },
        { id: 'Audio', name: 'Audio', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=80' },
        { id: 'Protection', name: 'Protection', image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80' }
      ];

  const filterTabs = ['All', ...circularCategories.map(c => c.name)];

  // Fetch Distributor Wholesale Products
  const fetchProducts = () => {
    setLoadingProducts(true);
    api.products.getVisibleProducts('Distributor', selectedCategory)
      .then(res => {
        if (res.success && res.products) {
          setProducts(res.products);
        } else {
          setProducts([]);
        }
      })
      .catch(err => {
        console.error('Failed to load distributor products:', err);
        setProducts([]);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  // Real-time synchronization when Admin modifies products or stock
  useEffect(() => {
    const handleSync = () => fetchProducts();
    const handleDeleted = (e) => {
      const deletedId = e.detail?.productId;
      if (deletedId) {
        setProducts(prev => prev.filter(p => p.id !== deletedId));
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'mws_products_last_update') {
        fetchProducts();
      }
    };

    window.addEventListener('mws_products_updated', handleSync);
    window.addEventListener('mws_product_deleted', handleDeleted);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('mws_products_updated', handleSync);
      window.removeEventListener('mws_product_deleted', handleDeleted);
      window.removeEventListener('storage', handleStorage);
    };
  }, [selectedCategory]);

  // Synchronize activeTab with URL query parameters (?tab=orders, ?tab=catalog)
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

  // Load distributor orders when clicking orders tab
  useEffect(() => {
    if (activeTab === 'orders') {
      setLoadingOrders(true);
      api.orders.getMyOrders()
        .then(res => {
          if (res.success && res.orders) {
            setMyOrders(res.orders);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingOrders(false));
    }
  }, [activeTab]);

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    const el = document.getElementById('distributor-products-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const calculateDiscount = (price, originalPrice, discountFromDb) => {
    if (discountFromDb !== undefined && discountFromDb !== null && Number(discountFromDb) > 0) {
      return `${Number(discountFromDb)}% OFF`;
    }
    if (!originalPrice || originalPrice <= price) return null;
    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    return discount > 0 ? `${discount}% OFF` : null;
  };

  // Client-side search query filtering
  const displayedProducts = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* ====== DISTRIBUTOR WELCOME BANNER & TAB CONTROLS ====== */}
      <section style={{
        maxWidth: '1240px',
        margin: '20px auto 0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid rgba(2, 132, 199, 0.25)',
          padding: '22px 26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-distributor">
                <Building2 size={12} /> Approved Wholesale Partner
              </span>
              <span className="badge badge-active">
                <CheckCircle size={12} /> {user?.accountStatus}
              </span>
            </div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              {user?.businessName || user?.fullName}
            </h1>
            <div style={{ fontSize: '0.84rem', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
              PAN/VAT: {user?.panVatNumber || 'Verified B2B Dealer'} · Commercial wholesale rates in INR (₹)
            </div>
          </div>

          {/* Navigation Tabs: Wholesale Catalog vs My Invoices & Orders */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: 'var(--radius-full)'
          }}>
            <button
              onClick={() => setActiveTab('catalog')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: activeTab === 'catalog' ? '#0284c7' : 'transparent',
                color: activeTab === 'catalog' ? '#ffffff' : '#475569',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <TrendingUp size={15} />
              Wholesale Catalog
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: activeTab === 'orders' ? '#0284c7' : 'transparent',
                color: activeTab === 'orders' ? '#ffffff' : '#475569',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Package size={15} />
              Wholesale Orders {myOrders.length > 0 && `(${myOrders.length})`}
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: activeTab === 'rewards' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                color: activeTab === 'rewards' ? '#ffffff' : '#475569',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'rewards' ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              <Gift size={15} />
              <span>My Rewards</span>
            </button>
          </div>
        </div>
      </section>

      {/* ====== 3. CATALOG VIEW: CIRCULAR CATEGORIES & WHOLESALE BEST SELLING PRODUCTS ====== */}
      {activeTab === 'catalog' && (
        <>
          {/* Circular Categories Strip */}
          <section style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '30px 20px 10px 20px'
          }}>
            <div className="circular-categories-container" style={{
              gap: 'clamp(20px, 4vw, 50px)'
            }}>
              {circularCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px',
                      outline: 'none',
                      transition: 'transform 0.2s ease',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)'
                    }}
                  >
                    <div style={{
                      width: 'clamp(64px, 8vw, 76px)',
                      height: 'clamp(64px, 8vw, 76px)',
                      borderRadius: '50%',
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#0a0d14',
                      boxShadow: isSelected
                        ? '0 0 0 3px #0284c7, 0 8px 18px rgba(2, 132, 199, 0.35)'
                        : '0 4px 14px rgba(0, 0, 0, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.25s'
                    }}>
                      <img
                        src={cat.image}
                        alt={cat.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 70%)',
                        pointerEvents: 'none'
                      }} />
                    </div>

                    <span style={{
                      fontSize: '0.86rem',
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? '#0284c7' : 'var(--text-main)'
                    }}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Wholesale Best Selling Products Section */}
          <section
            id="distributor-products-grid"
            style={{
              maxWidth: '1240px',
              margin: '0 auto',
              padding: '24px 20px 70px 20px'
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div>
                  <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    Wholesale B2B Catalog
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
                    Showing Factory Tier Wholesale Rates & Bulk Lot Packages
                  </div>
                </div>

                {searchQuery && (
                  <span style={{ fontSize: '0.86rem', color: '#64748b' }}>
                    Showing results for: <strong>"{searchQuery}"</strong>
                  </span>
                )}
              </div>

              {/* Filter Pills */}
              <div className="category-scroll-strip" style={{
                gap: '10px',
                paddingBottom: '8px'
              }}>
                {filterTabs.map((tab) => {
                  const active = selectedCategory === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setSelectedCategory(tab)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.86rem',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        border: active ? '1px solid #0284c7' : '1px solid var(--border-medium)',
                        background: active ? '#0284c7' : '#ffffff',
                        color: active ? '#ffffff' : 'var(--text-body)',
                        boxShadow: active ? '0 2px 10px rgba(2, 132, 199, 0.28)' : 'var(--shadow-xs)'
                      }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Grid */}
            {loadingProducts ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Loading wholesale distributor inventory...</div>
              </div>
            ) : displayedProducts.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <Package size={44} color="#9ca3af" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>No Wholesale Products Found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No inventory matches your current search or category filter.</p>
              </div>
            ) : (
              <div className="products-responsive-grid" style={{
                gap: '22px'
              }}>
                {displayedProducts.map((p) => {
                  const wish = isWishlisted(p.id);
                  const discountStr = calculateDiscount(p.price, p.originalPrice, p.discount);
                  const badgeLabel = p.badge || 'Wholesale Box';
                  const isWholesale = badgeLabel.includes('Wholesale');
                  const badgeBg = isWholesale ? '#059669' : '#0284c7';
                  const isItemInStock = p.inStock !== 0 && p.inStock !== false;

                  return (
                    <div
                      key={p.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        opacity: isItemInStock ? 1 : 0.9
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.04)';
                      }}
                    >
                      {/* Image Area with Badges */}
                      <div className="product-card-img-wrapper" style={{
                        position: 'relative',
                        width: '100%',
                        background: '#f8fafc',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: badgeBg,
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          zIndex: 2,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                        }}>
                          {badgeLabel}
                        </span>

                        {/* Stock Status Pill */}
                        {!isItemInStock && (
                          <span style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: '#dc2626',
                            color: '#ffffff',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            zIndex: 2,
                            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
                            letterSpacing: '0.04em'
                          }}>
                            OUT OF STOCK
                          </span>
                        )}

                        <img
                          src={getMediaUrl(p.imageUrl) || 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80'}
                          alt={p.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: !isItemInStock ? 'grayscale(45%)' : 'none',
                            opacity: !isItemInStock ? 0.75 : 1
                          }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                      </div>

                      {/* Content Area */}
                      <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#9ca3af',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: '6px'
                        }}>
                          {p.category || 'MWS WHOLESALE'}
                        </div>

                        <h3 style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: '#1f2937',
                          lineHeight: 1.35,
                          marginBottom: '8px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '2.7em'
                        }} title={p.name}>
                          {p.name}
                        </h3>

                        {/* Star Rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                          {[1, 2, 3, 4, 5].map((starIdx) => {
                            const isFilled = starIdx <= Math.round(p.rating || 0);
                            return (
                              <Star
                                key={starIdx}
                                size={14}
                                color={isFilled ? '#f59e0b' : '#d1d5db'}
                                fill={isFilled ? '#f59e0b' : 'none'}
                              />
                            );
                          })}
                          <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginLeft: '4px' }}>
                            ({p.reviewCount || 0})
                          </span>
                        </div>

                        {/* Wholesale Price in INR ₹ */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          flexWrap: 'wrap',
                          gap: '4px 6px',
                          marginBottom: '14px',
                          marginTop: 'auto'
                        }}>
                          <span style={{ fontSize: 'clamp(1.05rem, 3.5vw, 1.22rem)', fontWeight: 900, color: '#0284c7' }}>
                            ₹{Number(p.price || 0).toLocaleString()}
                          </span>

                          {p.originalPrice && p.originalPrice > p.price && (
                            <span style={{ fontSize: '0.80rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                              ₹{Number(p.originalPrice).toLocaleString()}
                            </span>
                          )}

                          {discountStr && (
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                              {discountStr}
                            </span>
                          )}

                          <span style={{
                            fontSize: '0.70rem',
                            fontWeight: 700,
                            color: '#059669',
                            background: 'rgba(5, 150, 105, 0.1)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                          }}>
                            B2B
                          </span>
                        </div>

                        {/* Action Buttons: Add to Wholesale Cart + Heart */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => addToCart(p)}
                            disabled={!isItemInStock}
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              background: isItemInStock ? '#0284c7' : '#94a3b8',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '9px 8px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: isItemInStock ? 'pointer' : 'not-allowed',
                              transition: 'background-color 0.2s',
                              whiteSpace: 'nowrap',
                              minWidth: 0
                            }}
                            onMouseEnter={e => {
                              if (isItemInStock) e.currentTarget.style.backgroundColor = '#0369a1';
                            }}
                            onMouseLeave={e => {
                              if (isItemInStock) e.currentTarget.style.backgroundColor = '#0284c7';
                            }}
                          >
                            <ShoppingCart size={15} style={{ flexShrink: 0 }} />
                            <span>{isItemInStock ? 'Order Lot' : 'Out of Stock'}</span>
                          </button>

                          <button
                            onClick={() => toggleWishlist(p)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              background: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              color: wish ? '#ef4444' : '#6b7280',
                              flexShrink: 0
                            }}
                            aria-label="Wishlist"
                          >
                            <Heart size={17} fill={wish ? '#ef4444' : 'none'} color={wish ? '#ef4444' : 'currentColor'} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* ====== 4. MY WHOLESALE ORDERS VIEW ====== */}
      {activeTab === 'orders' && (
        <section style={{ maxWidth: '1000px', margin: '30px auto 80px', padding: '0 20px' }}>
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Wholesale Purchase Invoices & Order Logs
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Official B2B lot orders, invoice settlements, and logistics dispatch status.
            </p>
          </div>

          {loadingOrders ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Loading wholesale orders...</div>
            </div>
          ) : myOrders.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0'
            }}>
              <Package size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>No Wholesale Orders Yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '18px' }}>
                You have not placed any bulk orders yet. Browse our wholesale lots and boxes!
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="btn btn-sky"
                style={{ padding: '10px 24px', fontWeight: 700 }}
              >
                Browse Wholesale Catalog
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '22px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Commercial Order / Invoice</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7', fontFamily: 'monospace' }}>
                        {ord.orderNumber}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                        Placed on {new Date(ord.createdDate).toLocaleDateString()} at {new Date(ord.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background:
                          ord.orderStatus === 'Delivered' ? 'rgba(5, 150, 105, 0.1)' :
                          ord.orderStatus === 'Processing' ? 'rgba(124, 58, 237, 0.1)' :
                          ord.orderStatus === 'Dispatched' ? 'rgba(2, 132, 199, 0.1)' :
                          ord.orderStatus === 'Cancelled' ? 'rgba(220, 38, 38, 0.1)' :
                          'rgba(217, 119, 6, 0.1)',
                        color:
                          ord.orderStatus === 'Delivered' ? '#059669' :
                          ord.orderStatus === 'Processing' ? '#7c3aed' :
                          ord.orderStatus === 'Dispatched' ? '#0284c7' :
                          ord.orderStatus === 'Cancelled' ? '#dc2626' :
                          '#d97706'
                      }}>
                        {ord.orderStatus}
                      </span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                        ₹{Number(ord.totalAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Payment & Verification Strip */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '14px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#475569' }}>Payment Method: <strong>{ord.paymentMethod}</strong></span>
                      {ord.transactionId && (
                        <span style={{ fontFamily: 'monospace', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          UTR: {ord.transactionId}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#64748b' }}>Verification:</span>
                      <span style={{
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
                  </div>

                  {/* Visual 4-Step Progress Tracker */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    padding: '14px 10px',
                    background: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    marginBottom: '14px'
                  }}>
                    {['Placed', 'Processing', 'Dispatched', 'Delivered'].map((step, idx) => {
                      const stages = ['Pending', 'Processing', 'Dispatched', 'Delivered'];
                      const currentIdx = stages.indexOf(ord.orderStatus);
                      const isReached = currentIdx >= idx;

                      return (
                        <div key={step} style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isReached ? '#0284c7' : '#e2e8f0',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 6px auto'
                          }}>
                            {isReached ? '✓' : idx + 1}
                          </div>
                          <div style={{ fontSize: '0.75rem', fontWeight: isReached ? 800 : 500, color: isReached ? '#1e293b' : '#94a3b8' }}>
                            {step}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Wholesale Delivery Address */}
                  <div style={{
                    fontSize: '0.84rem',
                    color: '#475569',
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <MapPin size={16} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <strong>Wholesale Delivery Address:</strong> {ord.customerName} ({ord.customerPhone}) — {ord.shippingAddress}
                      {ord.district && `, District: ${ord.district}`}
                      {ord.city && `, ${ord.city}`}
                      {ord.postalCode && ` - ${ord.postalCode}`}
                    </div>
                  </div>

                  {/* Wholesale Items List */}
                  {ord.items && ord.items.length > 0 && (
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Wholesale Lots Dispatched ({ord.items.length}):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ord.items.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, color: '#0284c7' }}>{it.quantity}x</span>
                              <span style={{ color: '#1e293b' }}>{it.name}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>
                              ₹{Number(it.subtotal || it.unitPrice * it.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ====== 5. MY REWARDS VIEW ====== */}
      {activeTab === 'rewards' && (
        <section style={{ maxWidth: '1240px', margin: '30px auto 80px', padding: '0 20px' }}>
          <RewardsSection userType="Distributor" />
        </section>
      )}
    </div>
  );
};

export default DistributorPortal;
