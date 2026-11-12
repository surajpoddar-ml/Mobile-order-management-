import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AdvertisementBoard from '../components/AdvertisementBoard';
import PromotionalSticker from '../components/PromotionalSticker';
import api, { getMediaUrl, getProductFallbackImage, getCategoryFallbackImage } from '../services/api';
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
  QrCode,
  ChevronRight,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { RewardsSection } from '../components/rewards/RewardsSection';
import { LiveChatWindow } from '../components/chat/LiveChatWindow';
import { MessageSquare } from 'lucide-react';

export const DistributorPortal = () => {
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

  const [activeTab, setActiveTab] = useState('catalog');
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  useEffect(() => {
    api.chat.getUnreadCount()
      .then(res => {
        if (res.success && typeof res.unreadCount === 'number') {
          setChatUnreadCount(res.unreadCount);
        }
      })
      .catch(() => {});
  }, [activeTab]);
 // 'catalog' | 'orders'
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Distributor Available Credit State
  const [distributorCredit, setDistributorCredit] = useState(null);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [creditInterestHistory, setCreditInterestHistory] = useState([]);
  const [loadingCredit, setLoadingCredit] = useState(false);

  const fetchDistributorCredit = () => {
    setLoadingCredit(true);
    api.credits.getMyCredit()
      .then(res => {
        if (res.success && res.credit) {
          setDistributorCredit(res.credit);
          setCreditTransactions(res.transactions || []);
          setCreditInterestHistory(res.interestHistory || []);
        }
      })
      .catch(err => {
        console.warn('Failed to load credit details:', err);
      })
      .finally(() => setLoadingCredit(false));
  };

  useEffect(() => {
    fetchDistributorCredit();
    const handleCreditRefresh = () => fetchDistributorCredit();
    window.addEventListener('mws_notifications_refresh', handleCreditRefresh);
    return () => window.removeEventListener('mws_notifications_refresh', handleCreditRefresh);
  }, []);

  useEffect(() => {
    if (activeTab === 'credit') {
      fetchDistributorCredit();
    }
  }, [activeTab]);

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
    ? dbCategories.map(cat => ({
      id: cat.name,
      name: cat.name,
      image: cat.imageUrl ? getCategoryImageUrl(cat.imageUrl) : getCategoryFallbackImage(cat.name)
    }))
    : standardCategories;

  const filterTabs = ['All', ...categoriesList.map(c => c.name)];

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

  const handleCategoryClick = (catName) => {
    if (selectedCategory === catName) {
      setSelectedCategory('All');
    } else {
      setSelectedCategory(catName);
      const el = document.getElementById('distributor-products-grid');
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

      {/* ====== 2. DISTRIBUTOR IDENTITY & AVAILABLE CREDIT QUICK STATUS BAR ====== */}
      <section style={{
        maxWidth: '1240px',
        margin: '10px auto 4px auto',
        padding: '0 12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 16px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid rgba(2, 132, 199, 0.22)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 9px',
              borderRadius: '6px',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '0.5px'
            }}>
              ID: {user?.userId || 'DISTRIBUTOR'}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
              {user?.businessName || user?.fullName}
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7'
            }}>
              Verified Wholesale Account
            </span>
          </div>

          <div
            onClick={() => setActiveTab('credit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              padding: '5px 14px',
              borderRadius: '24px',
              transition: 'all 0.2s ease'
            }}
            title="Click to view full credit ledger"
          >
            <CreditCard size={16} color="#059669" />
            <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 700 }}>
              Available Credit:
            </span>
            <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#059669' }}>
              ₹{(distributorCredit?.availableCredit ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </section>

      {/* ====== 3. FIVE EVENLY SPACED NAVIGATION CARDS: PRODUCT CATALOG, MY ORDERS, CREDIT BALANCE, MY REWARD, LIVE CHAT ====== */}
      <section className="portal-header-section" style={{
        maxWidth: '1240px',
        margin: '6px auto 0 auto',
        padding: '0 12px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
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

          {/* Card 3: Available Credit */}
          <button
            type="button"
            onClick={() => setActiveTab('credit')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '7px 4px',
              borderRadius: '11px',
              background: activeTab === 'credit' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#ffffff',
              color: activeTab === 'credit' ? '#ffffff' : '#1e293b',
              border: activeTab === 'credit' ? '1px solid #059669' : '1px solid rgba(16, 185, 129, 0.22)',
              boxShadow: activeTab === 'credit' ? '0 3px 10px rgba(16, 185, 129, 0.25)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
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
              background: activeTab === 'credit' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 'credit' ? '#ffffff' : '#059669'
            }}>
              <CreditCard size={15} style={{ transform: 'scale(0.6)' }} />
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: activeTab === 'credit' ? 800 : 700,
              lineHeight: 1.15,
              whiteSpace: 'nowrap'
            }}>
              Credit Balance
            </span>
          </button>

          {/* Card 4: My Reward */}
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

          {/* Card 5: Live Chat */}
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '7px 4px',
              borderRadius: '11px',
              background: activeTab === 'messages' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
              color: activeTab === 'messages' ? '#ffffff' : '#1e293b',
              border: activeTab === 'messages' ? '1px solid #0284c7' : '1px solid rgba(2, 132, 199, 0.18)',
              boxShadow: activeTab === 'messages' ? '0 3px 10px rgba(2, 132, 199, 0.25)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
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
              background: activeTab === 'messages' ? 'rgba(255, 255, 255, 0.22)' : 'rgba(2, 132, 199, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTab === 'messages' ? '#ffffff' : '#0284c7',
              position: 'relative'
            }}>
              <MessageSquare size={15} style={{ transform: 'scale(0.8)' }} />
              {chatUnreadCount > 0 && (
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
                  {chatUnreadCount}
                </span>
              )}
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: activeTab === 'messages' ? 800 : 700,
              lineHeight: 1.15,
              whiteSpace: 'nowrap'
            }}>
              Live Chat
            </span>
          </button>
        </div>
      </section>

      {/* ====== 3. CATALOG VIEW: ORDER BY CATEGORY, PROMOTIONAL STICKER & WHOLESALE PRODUCTS ====== */}
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
                        src={cat.image || getCategoryFallbackImage(cat.name)}
                        alt={cat.name}
                        onError={(e) => {
                          const fallback = getCategoryFallbackImage(cat.name);
                          if (e.target.src !== fallback && !e.target.src.endsWith(fallback)) {
                            e.target.src = fallback;
                          }
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

          {/* Wholesale Best Selling Products Section */}
          <section
            id="distributor-products-grid"
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
                <div>
                  <h2 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 2.2rem)', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
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
                        border: active ? '1px solid #0284c7' : '1px solid var(--border-medium)',
                        background: active ? '#0284c7' : '#ffffff',
                        color: active ? '#ffffff' : 'var(--text-body)',
                        boxShadow: active ? '0 2px 10px rgba(2, 132, 199, 0.28)' : 'var(--shadow-xs)',
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
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Loading wholesale distributor inventory...</div>
              </div>
            ) : displayedProducts.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <Package size={44} color="#9ca3af" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>No Wholesale Products Found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No inventory matches your current search or category filter.</p>
              </div>
            ) : (
              <div className="products-responsive-grid">
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
                      className="product-card-container"
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
                        <span
                          className="product-card-badge"
                          style={{
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

                        {/* Stock Status Pill */}
                        {!isItemInStock && (
                          <span
                            className="product-card-stock-pill"
                            style={{
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
                          src={getMediaUrl(p.imageUrl) || getProductFallbackImage(p.category)}
                          alt={p.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: !isItemInStock ? 'grayscale(45%)' : 'none',
                            opacity: !isItemInStock ? 0.75 : 1
                          }}
                          onError={(e) => {
                            const fallback = getProductFallbackImage(p.category);
                            if (e.target.src !== fallback && !e.target.src.endsWith(fallback)) {
                              e.target.src = fallback;
                            }
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
                          {p.category || 'MWS WHOLESALE'}
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
                        <div className="product-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
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

                        {/* Wholesale Price in INR ₹ */}
                        <div className="product-card-pricing-row" style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          flexWrap: 'wrap',
                          gap: '4px 6px',
                          marginBottom: '12px',
                          marginTop: 'auto'
                        }}>
                          <span className="product-card-price" style={{ fontSize: 'clamp(1.05rem, 3.5vw, 1.22rem)', fontWeight: 900, color: '#0284c7' }}>
                            ₹{Number(p.price || 0).toLocaleString()}
                          </span>

                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="product-card-original-price" style={{ fontSize: '0.78rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                              ₹{Number(p.originalPrice).toLocaleString()}
                            </span>
                          )}

                          {discountStr && (
                            <span className="product-card-discount-tag" style={{ fontSize: '0.70rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                              {discountStr}
                            </span>
                          )}

                          <span style={{
                            fontSize: '0.68rem',
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
                        <div className="product-card-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                            <ShoppingCart size={14} style={{ flexShrink: 0 }} />
                            <span className="btn-text-full">{isItemInStock ? 'Order Lot' : 'Out of Stock'}</span>
                            <span className="btn-text-short">{isItemInStock ? 'Order' : 'Out'}</span>
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

          {/* Support & Locations: Live Chat, Manufacture & Head Office */}
          <section style={{ maxWidth: '1240px', margin: '20px auto 30px auto', padding: '0 12px' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '11px',
                    background: 'rgba(2, 132, 199, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    flexShrink: 0
                  }}>
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                      Distributor Desk & Wholesale Support
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Direct bulk orders, custom quotes, invoice assistance, and real-time support.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('messages');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Start Live Chat</span>
                </button>
              </div>

              {/* Separately in below: Manufacture and Head Office */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}>
                  <MapPin size={15} color="#d97706" />
                  <span>Manufacture from: <strong>Kathmandu, Nepal</strong></span>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  backgroundColor: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  color: '#3730a3',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}>
                  <Building2 size={15} color="#4f46e5" />
                  <span>Head Office: <strong>Mumbai, Delhi, Chennai, Hyderabad</strong></span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ====== 4. MY WHOLESALE ORDERS VIEW ====== */}
      {activeTab === 'orders' && (
        <section className="portal-orders-section" style={{ maxWidth: '1000px', margin: '30px auto 80px', padding: '0 20px' }}>
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

      {/* ====== 5. CREDIT BALANCE & TRANSACTION LEDGER VIEW ====== */}
      {activeTab === 'credit' && (
        <section style={{ maxWidth: '1000px', margin: '30px auto 80px', padding: '0 20px' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Distributor Credit Balance
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Your admin-approved wholesale credit line, available balance, and complete purchase audit history.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchDistributorCredit}
              className="btn"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loadingCredit ? 'spin' : ''} />
              Refresh
            </button>
          </div>

          {/* 3 Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Credit Assigned
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0284c7', marginTop: '6px' }}>
                ₹{Number(distributorCredit?.totalCredit || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                Authorized credit limit by administration
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Credit Used
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#ea580c', marginTop: '6px' }}>
                ₹{Number(distributorCredit?.usedCredit || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                Utilized across placed orders
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Outstanding Debt
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#dc2626', marginTop: '6px' }}>
                ₹{Number(distributorCredit?.outstandingBalance || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                Current pending receivables to settle
              </div>
            </div>

            <div className="glass-panel" style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Remaining Available Credit
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
                ₹{Number(distributorCredit?.availableCredit || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#065f46', marginTop: '4px' }}>
                Usable for instant checkout orders
              </div>
            </div>
          </div>

          {/* Usage Notice */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CreditCard size={22} color="#0284c7" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
              <b>How it works:</b> Choose <b>"Purchase with Available Credit"</b> during checkout. Your order total will be deducted directly from your available balance. Orders exceeding your available limit will be blocked. Contact support or admin to request a limit increase.
            </div>
          </div>

          {/* Dedicated Credit Interest Details Section */}
          <div className="glass-panel" style={{
            padding: '22px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)',
            border: '1.5px solid #fbcfe8',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{ fontSize: '1.12rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Credit Interest Details
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Daily interest is calculated automatically on your unpaid principal balance. Payments reduce your principal immediately.
                </p>
              </div>
              <span style={{
                padding: '4px 10px',
                borderRadius: '14px',
                fontSize: '0.74rem',
                fontWeight: 800,
                background: distributorCredit?.interestEnabled ? 'rgba(16, 185, 129, 0.14)' : 'rgba(100, 116, 139, 0.14)',
                color: distributorCredit?.interestEnabled ? '#059669' : '#475569'
              }}>
                {distributorCredit?.interestEnabled ? '● Interest Active' : '○ Interest Paused'}
              </span>
            </div>

            {/* Interest Metric Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
              gap: '12px',
              marginBottom: '18px'
            }}>
              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Principal Amount</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>
                  ₹{Number(distributorCredit?.principalAmount ?? distributorCredit?.outstandingBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>Outstanding credit balance</div>
              </div>

              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Monthly Interest Rate</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#4338ca', marginTop: '4px' }}>
                  {Number(distributorCredit?.monthlyInterestRate || 0).toFixed(2)}% / mo
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                  {distributorCredit?.calcMode === 'fixed_30' ? '30-day month basis' : `${distributorCredit?.daysInCurrentMonth || 30}-day calendar basis`}
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase' }}>Today&apos;s Daily Interest</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#be185d', marginTop: '4px' }}>
                  ₹{Number(distributorCredit?.dailyInterestAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / day
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9d174d', marginTop: '2px' }}>
                  Est. ₹{Number(distributorCredit?.monthlyEstimatedInterest || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase' }}>Accumulated Interest</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#be185d', marginTop: '4px' }}>
                  ₹{Number(distributorCredit?.accumulatedInterest || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                  Last calc: {distributorCredit?.lastInterestDate || 'Not yet run'}
                </div>
              </div>

              <div style={{ background: '#fff7ed', padding: '14px', borderRadius: '12px', border: '1.5px solid #fed7aa' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase' }}>Total Amount Payable</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#c2410c', marginTop: '4px' }}>
                  ₹{Number(distributorCredit?.totalPayable ?? distributorCredit?.outstandingBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9a3412', marginTop: '2px' }}>Principal + Accumulated Interest</div>
              </div>
            </div>

            {/* Daily Interest Transaction History Sub-table */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px' }}>
              <h4 style={{ fontSize: '0.94rem', fontWeight: 800, margin: '0 0 10px 0', color: '#0f172a' }}>
                Daily Interest Calculation History
              </h4>
              {creditInterestHistory.length === 0 ? (
                <div style={{ padding: '18px', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
                  No daily interest charges have been recorded yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                        <th style={{ padding: '8px 10px' }}>Date</th>
                        <th style={{ padding: '8px 10px' }}>Reference</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Principal Used</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (%/mo)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Daily Interest (+)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Interest After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditInterestHistory.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '9px 10px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{log.interest_date}</td>
                          <td style={{ padding: '9px 10px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>{log.txn_number}</td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>
                            ₹{Number(log.principal_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', color: '#4338ca', fontWeight: 700 }}>
                            {Number(log.monthly_rate || 0).toFixed(2)}% ({log.days_in_month}d)
                          </td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', color: '#be185d', fontWeight: 800 }}>
                            +₹{Number(log.daily_interest || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₹{Number(log.interest_after || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Ledger Table */}
          <div className="glass-panel" style={{
            padding: '20px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 14px 0', color: '#0f172a' }}>
              Credit & Purchase Transaction History
            </h3>

            {loadingCredit ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                Loading transaction records...
              </div>
            ) : creditTransactions.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                No credit transactions or purchases recorded yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                      <th style={{ padding: '10px 12px' }}>Date & Time</th>
                      <th style={{ padding: '10px 12px' }}>Activity</th>
                      <th style={{ padding: '10px 12px' }}>Amount</th>
                      <th style={{ padding: '10px 12px' }}>Previous Balance</th>
                      <th style={{ padding: '10px 12px' }}>New Balance</th>
                      <th style={{ padding: '10px 12px' }}>Reference / Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditTransactions.map((tx) => {
                      const isDeduction = tx.transaction_type === 'PURCHASE_DEDUCTION';
                      const isRefund = tx.transaction_type === 'REFUND';
                      const isDailyInterest = tx.transaction_type === 'DAILY_INTEREST';

                      let dateStr = tx.created_at;
                      try {
                        dateStr = new Date(tx.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        });
                      } catch (e) {}

                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', color: '#334155', whiteSpace: 'nowrap' }}>
                            {dateStr}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: isDeduction
                                ? 'rgba(239, 68, 68, 0.1)'
                                : (isDailyInterest
                                    ? 'rgba(219, 39, 119, 0.12)'
                                    : (isRefund
                                        ? 'rgba(147, 51, 234, 0.1)'
                                        : (tx.transaction_type === 'PAYMENT_SETTLEMENT'
                                            ? 'rgba(16, 185, 129, 0.1)'
                                            : 'rgba(2, 132, 199, 0.1)'))),
                              color: isDeduction
                                ? '#dc2626'
                                : (isDailyInterest
                                    ? '#be185d'
                                    : (isRefund
                                        ? '#7c3aed'
                                        : (tx.transaction_type === 'PAYMENT_SETTLEMENT'
                                            ? '#059669'
                                            : '#0284c7')))
                            }}>
                              {isDeduction
                                ? 'PURCHASE DEDUCTION'
                                : (isDailyInterest
                                    ? 'DAILY INTEREST'
                                    : (isRefund
                                        ? 'ORDER REFUND'
                                        : (tx.transaction_type === 'PAYMENT_SETTLEMENT'
                                            ? 'PAYMENT RECEIVED'
                                            : tx.transaction_type)))}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: isDeduction ? '#dc2626' : (isDailyInterest ? '#be185d' : '#059669') }}>
                            {isDeduction ? '-' : '+'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px', color: '#64748b' }}>
                            ₹{Number(tx.previous_credit || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>
                            ₹{Number(tx.new_credit || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '12px', color: '#334155' }}>
                            {(tx.reference_order_number || tx.reference_id) && (
                              <span style={{ fontWeight: 700, color: '#0284c7', marginRight: '6px' }}>
                                {tx.reference_order_number || tx.reference_id}
                              </span>
                            )}
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {tx.description || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ====== 5. MY REWARDS VIEW ====== */}
      {activeTab === 'rewards' && (
        <section style={{ maxWidth: '1240px', margin: '30px auto 80px', padding: '0 20px' }}>
          <RewardsSection userType="Distributor" />
        </section>
      )}
{/* ====== 6. LIVE MESSAGING / LIVE CHAT VIEW ====== */}
      {activeTab === 'messages' && (
        <section style={{ maxWidth: '860px', margin: '20px auto 80px', padding: '0 16px' }}>
          <LiveChatWindow
            recipientName="MWS Eagle Distributor Desk"
            recipientRole="Admin"
            recipientSubtitle="Direct Distributor Support & Wholesale Inquiries"
            currentUser={user}
            height="calc(100vh - 240px)"
          />
        </section>
      )}

      {/* Floating Chat Trigger Button */}
      {activeTab !== 'messages' && (
        <button
          type="button"
          onClick={() => {
            setActiveTab('messages');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 18px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(2, 132, 199, 0.45)',
            transition: 'transform 0.18s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MessageSquare size={18} />
            {chatUnreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-7px',
                right: '-9px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 900,
                padding: '1px 5px',
                borderRadius: '10px',
                border: '1.5px solid #ffffff'
              }}>
                {chatUnreadCount}
              </span>
            )}
          </div>
          <span>Live Chat</span>
        </button>
      )}
    </div>
  );
};

export default DistributorPortal;
