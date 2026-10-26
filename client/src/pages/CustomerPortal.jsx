import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AdvertisementBoard from '../components/AdvertisementBoard';
import PromotionalSticker from '../components/PromotionalSticker';
import api, { getMediaUrl } from '../services/api';
import {
  User,
  Package,
  CheckCircle,
  Layers,
  Zap,
  Battery,
  Cable,
  Headphones,
  ShieldCheck,
  Star,
  ShoppingCart,
  Heart,
  Truck,
  Clock,
  Check,
  MapPin,
  QrCode,
  Gift,
  ChevronRight
} from 'lucide-react';
import { RewardsSection } from '../components/rewards/RewardsSection';

export const CustomerPortal = () => {
  const { user } = useAuth();
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    searchQuery,
    selectedCategory,
    setSelectedCategory,
    openProductDetails
  } = useCart();

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'orders'
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [dbCategories, setDbCategories] = useState([]);

  const getCategoryImageUrl = (url) => {
    if (!url) return '';
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

  // Standard 9 Categories matching exact visual reference
  const standardCategories = [
    { id: 'Earphone', name: 'Earphone', image: '/cat_earphone.jpg' },
    { id: 'Ear Bud', name: 'Ear Bud', image: '/cat_earbud.jpg' },
    { id: 'Neck Band', name: 'Neck Band', image: '/cat_neckband.jpg' },
    { id: 'Charger', name: 'Charger', image: '/cat_charger.jpg' },
    { id: 'DC Charger', name: 'DC Charger', image: '/cat_dc_charger.jpg' },
    { id: 'Data Cable', name: 'Data Cable', image: '/cat_data_cable.jpg' },
    { id: 'Power Bank', name: 'Power Bank', image: '/cat_power_bank.jpg' },
    { id: 'Bluetooth Speaker', name: 'Bluetooth Speaker', image: '/cat_bt_speaker.jpg' },
    { id: 'OTG', name: 'OTG', image: '/cat_otg.jpg' }
  ];

  const categoriesList = dbCategories.length > 0
    ? dbCategories.map(cat => {
        const found = standardCategories.find(s => s.name.toLowerCase() === cat.name.toLowerCase());
        return {
          id: cat.name,
          name: cat.name,
          image: cat.imageUrl ? getCategoryImageUrl(cat.imageUrl) : (found ? found.image : '/cat_earphone.jpg')
        };
      })
    : standardCategories;

  const filterTabs = ['All', ...categoriesList.map(c => c.name)];

  // Fetch Customer Products
  const fetchProducts = () => {
    setLoadingProducts(true);
    api.products.getVisibleProducts('Customer', selectedCategory)
      .then(res => {
        if (res.success && res.products) {
          setProducts(res.products);
        } else {
          setProducts([]);
        }
      })
      .catch(err => {
        console.error('Failed to load customer products:', err);
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

  // Load customer orders when clicking orders tab
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

  const handleCategoryClick = (catName) => {
    if (selectedCategory === catName) {
      setSelectedCategory('All');
    } else {
      setSelectedCategory(catName);
      const el = document.getElementById('customer-products-grid');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
      {/* ====== 1. AD DISPLAY TV VIEWER (CONTROLLABLE BY ADMIN) ====== */}
      <AdvertisementBoard />

      {/* ====== 2. THREE EVENLY SPACED NAVIGATION CARDS: PRODUCT CATALOG, MY ORDERS, MY REWARD ====== */}
      <section className="portal-header-section" style={{
        maxWidth: '1240px',
        margin: '8px auto 0 auto',
        padding: '0 12px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px'
        }}>
          {/* Card 1: Product Catalog */}
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '7px 4px',
              borderRadius: '11px',
              background: activeTab === 'catalog' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
              color: activeTab === 'catalog' ? '#ffffff' : '#1e293b',
              border: activeTab === 'catalog' ? '1px solid #0284c7' : '1px solid rgba(2, 132, 199, 0.18)',
              boxShadow: activeTab === 'catalog' ? '0 3px 10px rgba(2, 132, 199, 0.25)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: '50px'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              background: activeTab === 'catalog' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(2, 132, 199, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 'catalog' ? '#ffffff' : '#0284c7'
            }}>
              <Layers size={15} style={{ transform: 'scale(0.6)' }} />
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: activeTab === 'catalog' ? 800 : 700,
              lineHeight: 1.15,
              whiteSpace: 'nowrap'
            }}>
              Product Catalog
            </span>
          </button>

          {/* Card 2: My Orders */}
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '7px 4px',
              borderRadius: '11px',
              background: activeTab === 'orders' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
              color: activeTab === 'orders' ? '#ffffff' : '#1e293b',
              border: activeTab === 'orders' ? '1px solid #0284c7' : '1px solid rgba(2, 132, 199, 0.18)',
              boxShadow: activeTab === 'orders' ? '0 3px 10px rgba(2, 132, 199, 0.25)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: '50px',
              position: 'relative'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              background: activeTab === 'orders' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(2, 132, 199, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 'orders' ? '#ffffff' : '#0284c7',
              position: 'relative'
            }}>
              <Package size={15} style={{ transform: 'scale(0.6)' }} />
              {myOrders.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-6px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.52rem',
                  fontWeight: 800,
                  padding: '1px 3.5px',
                  borderRadius: '10px',
                  lineHeight: 1
                }}>
                  {myOrders.length}
                </span>
              )}
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: activeTab === 'orders' ? 800 : 700,
              lineHeight: 1.15,
              whiteSpace: 'nowrap'
            }}>
              My Orders
            </span>
          </button>

          {/* Card 3: My Reward */}
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '7px 4px',
              borderRadius: '11px',
              background: activeTab === 'rewards' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
              color: activeTab === 'rewards' ? '#ffffff' : '#1e293b',
              border: activeTab === 'rewards' ? '1px solid #0284c7' : '1px solid rgba(2, 132, 199, 0.18)',
              boxShadow: activeTab === 'rewards' ? '0 3px 10px rgba(2, 132, 199, 0.25)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: '50px'
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              background: activeTab === 'rewards' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(2, 132, 199, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 'rewards' ? '#ffffff' : '#0284c7'
            }}>
              <Gift size={15} style={{ transform: 'scale(0.6)' }} />
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: activeTab === 'rewards' ? 800 : 700,
              lineHeight: 1.15,
              whiteSpace: 'nowrap'
            }}>
              My Reward
            </span>
          </button>
        </div>
      </section>

      {/* ====== 3. CATALOG VIEW: ORDER BY CATEGORY, PROMOTIONAL STICKER & ALL PRODUCTS ====== */}
      {activeTab === 'catalog' && (
        <>
          {/* Order by Category Section */}
          <section
            id="order-by-category-section"
            style={{
              maxWidth: '1240px',
              margin: '8px auto 0 auto',
              padding: '2px 14px 10px 14px'
            }}
          >
            <div className="shop-by-cat-heading-wrap" style={{ marginBottom: '10px' }}>
              <span className="cat-heading-line" />
              <h2 className="shop-by-cat-title" style={{ fontSize: 'clamp(1.1rem, 3.2vw, 1.45rem)' }}>
                <Zap size={18} className="cat-lightning-icon" /> Order by Category
              </h2>
              <span className="cat-heading-line" />
            </div>

            <div className="cat-cards-grid">
              {categoriesList.map((cat) => {
                const active = selectedCategory === cat.name;
                return (
                  <div
                    key={cat.id || cat.name}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`cat-product-card ${active ? 'active' : ''}`}
                    title={`Shop ${cat.name}`}
                  >
                    <div className="cat-card-img-container">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        onError={(e) => {
                          e.target.src = '/mws_eagle_logo.jpg';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="cat-pill-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryClick(cat.name);
                      }}
                    >
                      <span>{cat.name}</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Promotional Sticker Strip */}
          <PromotionalSticker />

          {/* All Products Section with Category Pills */}
          <section
            id="customer-products-grid"
            className="portal-products-section"
            style={{
              maxWidth: '1240px',
              margin: '0 auto',
              padding: '10px 20px 70px 20px'
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
                <h2 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 2.2rem)', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  All Products
                </h2>

                {searchQuery && (
                  <span style={{ fontSize: '0.86rem', color: '#64748b' }}>
                    Showing results for: <strong>"{searchQuery}"</strong>
                  </span>
                )}
              </div>

              {/* Filter Pills */}
              <div className="category-scroll-strip" style={{
                gap: '8px',
                paddingBottom: '8px'
              }}>
                {filterTabs.map((tab) => {
                  const active = selectedCategory === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setSelectedCategory(tab)}
                      className="category-filter-chip"
                      style={{
                        padding: '8px 20px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.86rem',
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        border: active ? '1px solid #2563eb' : '1px solid var(--border-medium)',
                        background: active ? '#2563eb' : '#ffffff',
                        color: active ? '#ffffff' : 'var(--text-body)',
                        boxShadow: active ? '0 2px 10px rgba(37, 99, 235, 0.28)' : 'var(--shadow-xs)',
                        flexShrink: 0
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
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Loading customer products in INR (₹)...</div>
              </div>
            ) : displayedProducts.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <Package size={44} color="#9ca3af" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>No Products Found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No products match your current search or category filter.</p>
              </div>
            ) : (
              <div className="products-responsive-grid" style={{
                gap: '22px'
              }}>
                {displayedProducts.map((p) => {
                  const wish = isWishlisted(p.id);
                  const discountStr = calculateDiscount(p.price, p.originalPrice, p.discount);
                  const badgeLabel = p.badge || 'Bestseller';
                  const isNew = badgeLabel.toLowerCase().includes('new');
                  const badgeBg = isNew ? '#0284c7' : '#1d4ed8';
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
                        opacity: isItemInStock ? 1 : 0.9,
                        cursor: 'pointer'
                      }}
                      onClick={() => openProductDetails(p)}
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
                        {badgeLabel && (
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
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            maxWidth: '80%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {badgeLabel}
                          </span>
                        )}

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
                      <div className="product-card-body" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div className="product-card-category" style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#9ca3af',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginBottom: '6px'
                        }}>
                          {p.category || 'MWS ACCESSORIES'}
                        </div>

                        <h3 className="product-card-title" style={{
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                          {[1, 2, 3, 4, 5].map((starIdx) => {
                            const isFilled = starIdx <= Math.round(p.rating || 0);
                            return (
                              <Star
                                key={starIdx}
                                size={13}
                                color={isFilled ? '#f59e0b' : '#d1d5db'}
                                fill={isFilled ? '#f59e0b' : 'none'}
                              />
                            );
                          })}
                          <span style={{ fontSize: '0.74rem', color: '#9ca3af', fontWeight: 600, marginLeft: '3px' }}>
                            ({p.reviewCount || 0})
                          </span>
                        </div>

                        {/* Price in INR ₹ */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          flexWrap: 'wrap',
                          gap: '4px 6px',
                          marginBottom: '12px',
                          marginTop: 'auto'
                        }}>
                          <span className="product-card-price" style={{ fontSize: 'clamp(1.05rem, 3.5vw, 1.22rem)', fontWeight: 800, color: '#111827' }}>
                            ₹{Number(p.price || 0).toLocaleString()}
                          </span>

                          {p.originalPrice && p.originalPrice > p.price && (
                            <span style={{ fontSize: '0.78rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                              ₹{Number(p.originalPrice).toLocaleString()}
                            </span>
                          )}

                          {discountStr && (
                            <span style={{
                              fontSize: '0.70rem',
                              fontWeight: 800,
                              color: '#ef4444',
                              whiteSpace: 'nowrap',
                              background: '#fee2e2',
                              padding: '1px 5px',
                              borderRadius: '4px'
                            }}>
                              {discountStr}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons: Add to Cart + Heart */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            disabled={!isItemInStock}
                            className="product-card-btn"
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              background: isItemInStock ? '#2563eb' : '#94a3b8',
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
                              if (isItemInStock) e.currentTarget.style.backgroundColor = '#1d4ed8';
                            }}
                            onMouseLeave={e => {
                              if (isItemInStock) e.currentTarget.style.backgroundColor = '#2563eb';
                            }}
                          >
                            <ShoppingCart size={14} style={{ flexShrink: 0 }} />
                            <span>{isItemInStock ? 'Add to Cart' : 'Out of Stock'}</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(p);
                            }}
                            className="product-card-heart-btn"
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
                            <Heart size={16} fill={wish ? '#ef4444' : 'none'} color={wish ? '#ef4444' : 'currentColor'} />
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

      {/* ====== 4. MY ORDERS VIEW ====== */}
      {activeTab === 'orders' && (
        <section className="portal-orders-section" style={{ maxWidth: '1000px', margin: '30px auto 80px', padding: '0 20px' }}>
          <div style={{ marginBottom: '22px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
              Your Orders & Delivery Status
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Track live dispatch and historical purchases linked to your customer account.
            </p>
          </div>

          {loadingOrders ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Loading your orders...</div>
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>No Orders Placed Yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '18px' }}>
                You have not placed any orders yet. Check out our high quality mobile accessories!
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontWeight: 700 }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="order-card-box"
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
                      <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Order Number</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#2563eb', fontFamily: 'monospace' }}>
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
                            background: isReached ? '#2563eb' : '#e2e8f0',
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

                  {/* Delivery Address */}
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
                    <MapPin size={16} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <strong>Ship To:</strong> {ord.customerName} ({ord.customerPhone}) — {ord.shippingAddress}
                      {ord.district && `, District: ${ord.district}`}
                      {ord.city && `, ${ord.city}`}
                      {ord.postalCode && ` - ${ord.postalCode}`}
                    </div>
                  </div>

                  {/* Ordered Items List */}
                  {ord.items && ord.items.length > 0 && (
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Items in this Order ({ord.items.length}):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ord.items.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, color: '#2563eb' }}>{it.quantity}x</span>
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
          <RewardsSection userType="Customer" />
        </section>
      )}
    </div>
  );
};

export default CustomerPortal;
