import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getMediaUrl } from '../services/api';
import AdvertisementBoard from '../components/AdvertisementBoard';
import PromotionalSticker from '../components/PromotionalSticker';
import {
  ShieldCheck,
  Zap,
  Package,
  Users,
  ArrowRight,
  Smartphone,
  Battery,
  Cable,
  Headphones,
  CheckCircle2,
  Star,
  ShoppingCart,
  Heart,
  TrendingUp,
  Award,
  Globe,
  Tag,
  Check,
  Layers,
  Sparkles
} from 'lucide-react';

import { useCart } from '../context/CartContext';

export const LandingPage = () => {
  const { user, navigate } = useAuth();
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    searchQuery,
    selectedCategory,
    setSelectedCategory,
    openProductDetails
  } = useCart();

  // Products state (Customer retail catalog in INR ₹)
  const [allProducts, setAllProducts] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(false);

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

  // Fetch all products from catalog
  const fetchAllProducts = () => {
    setLoadingAll(true);
    api.products.getVisibleProducts('Customer', 'All')
      .then(res => {
        if (res && res.products) {
          setAllProducts(res.products);
        } else {
          setAllProducts([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch catalog products:', err);
      })
      .finally(() => {
        setLoadingAll(false);
      });
  };

  // Fetch products for currently selected category (if not 'All')
  const fetchCategoryProducts = (cat) => {
    if (!cat || cat === 'All') {
      setCategoryProducts([]);
      return;
    }
    setLoadingCategory(true);
    api.products.getVisibleProducts('Customer', cat)
      .then(res => {
        if (res && res.products) {
          setCategoryProducts(res.products);
        } else {
          setCategoryProducts([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch category products:', err);
      })
      .finally(() => {
        setLoadingCategory(false);
      });
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All') {
      fetchCategoryProducts(selectedCategory);
    }
  }, [selectedCategory]);

  // Synchronize immediately if Admin updates or deletes a product
  useEffect(() => {
    const handleSync = () => {
      fetchAllProducts();
      if (selectedCategory && selectedCategory !== 'All') {
        fetchCategoryProducts(selectedCategory);
      }
    };
    const handleDeleted = (e) => {
      const deletedId = e.detail?.productId;
      if (deletedId) {
        setAllProducts(prev => prev.filter(p => p.id !== deletedId));
        setCategoryProducts(prev => prev.filter(p => p.id !== deletedId));
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'mws_products_last_update') {
        handleSync();
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

  const handleCategoryClick = (catName) => {
    if (selectedCategory === catName) {
      setSelectedCategory('All');
    } else {
      setSelectedCategory(catName);
      const el = document.getElementById('category-products-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return null;
    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    return discount > 0 ? `${discount}% OFF` : null;
  };

  // Filter helper for search query
  const matchesSearch = (p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  };

  const filteredAllProducts = allProducts.filter(matchesSearch);
  const filteredCategoryProducts = categoryProducts.filter(matchesSearch);

  // Render Product Card Component using exact application visual language
  const renderProductCard = (p) => {
    const wish = isWishlisted(p.id);
    const discountStr = calculateDiscount(p.price, p.originalPrice);
    const badgeLabel = p.badge || 'Bestseller';
    const isNew = badgeLabel.toLowerCase().includes('new');
    const badgeBg = isNew ? '#0284c7' : '#1d4ed8';
    const isItemInStock = p.inStock !== 0 && p.inStock !== false;

    return (
      <div
        key={p.id}
        onClick={() => openProductDetails(p)}
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
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.04)';
        }}
      >
        {/* Top Area: Image with Badges */}
        <div
          className="product-card-img-wrapper"
          style={{
            position: 'relative',
            width: '100%',
            background: '#f8fafc',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Badge (Bestseller, New!) */}
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
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}>
              {badgeLabel}
            </span>
          )}

          {/* Stock Status Pill */}
          {!isItemInStock && (
            <span style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              zIndex: 2,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
              letterSpacing: '0.04em'
            }}>
              OUT OF STOCK
            </span>
          )}

          {/* Product Image */}
          <img
            src={getMediaUrl(p.imageUrl) || 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80'}
            alt={p.name ? `${p.name} - MWS Eagle` : 'MWS Eagle Mobile Spare Part & Accessory'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s',
              filter: !isItemInStock ? 'grayscale(45%)' : 'none',
              opacity: !isItemInStock ? 0.75 : 1
            }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80';
            }}
          />
        </div>

        {/* Card Content Area */}
        <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Category uppercase label */}
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '6px'
          }}>
            {p.category || 'MWS ACCESSORIES'}
          </div>

          {/* Product Title */}
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

          {/* Star Rating & Reviews */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '12px'
          }}>
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

          {/* Pricing Row */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: '4px 6px',
            marginBottom: '14px',
            marginTop: 'auto'
          }}>
            <span style={{
              fontSize: 'clamp(1.05rem, 3.5vw, 1.22rem)',
              fontWeight: 800,
              color: '#111827'
            }}>
              ₹{Number(p.price || 0).toLocaleString()}
            </span>

            {p.originalPrice && p.originalPrice > p.price && (
              <span style={{
                fontSize: '0.80rem',
                color: '#9ca3af',
                textDecoration: 'line-through'
              }}>
                ₹{Number(p.originalPrice).toLocaleString()}
              </span>
            )}

            {discountStr && (
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#ef4444',
                whiteSpace: 'nowrap',
                background: '#fee2e2',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                {discountStr}
              </span>
            )}
          </div>

          {/* Buttons Row: Add to Cart + Heart Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(p);
              }}
              disabled={!isItemInStock}
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
              <ShoppingCart size={15} style={{ flexShrink: 0 }} />
              <span>{isItemInStock ? 'Add to Cart' : 'Out of Stock'}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(p);
              }}
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
              <Heart
                size={17}
                fill={wish ? '#ef4444' : 'none'}
                color={wish ? '#ef4444' : 'currentColor'}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ overflowX: 'hidden' }}>
      {/* Semantic H1 for search engines and accessibility */}
      <h1 className="sr-only">
        MWS Eagle — Official Website | Mobile Spare-Parts Marketplace &amp; Wholesale Distribution
      </h1>

      {/* ====== 1. LARGE ADMIN-CONTROLLED BANNER SLIDER ====== */}
      <AdvertisementBoard />

      {/* ====== 2. SHOP BY CATEGORY (DYNAMIC ADMIN-CONTROLLED CATEGORIES) ====== */}
      <section
        id="shop-by-category-section"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '16px 20px 20px 20px'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <div>
            <h2 style={{
              fontSize: 'clamp(1.2rem, 3.2vw, 1.6rem)',
              fontWeight: 900,
              color: 'var(--text-main)',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Shop by Category
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Select a category to explore genuine spare parts &amp; accessories
            </div>
          </div>

          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              Show All
            </button>
          )}
        </div>

        {/* Circular Category Strip */}
        <div className="shop-by-category-strip">
          {circularCategories.map((cat) => {
            const active = selectedCategory === cat.name;
            return (
              <button
                key={cat.id || cat.name}
                type="button"
                onClick={() => handleCategoryClick(cat.name)}
                className="category-circle-btn"
                title={`Shop ${cat.name}`}
              >
                <div
                  className="category-circle-avatar"
                  style={{
                    border: active ? '2.5px solid #2563eb' : '1.5px solid #e2e8f0',
                    boxShadow: active ? '0 0 0 3px rgba(37, 99, 235, 0.25)' : '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80';
                    }}
                  />
                </div>
                <span
                  className="category-circle-label"
                  style={{
                    color: active ? '#2563eb' : '#1e293b',
                    fontWeight: active ? 800 : 700
                  }}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ====== 3. CATEGORY CLICK → SPECIAL CATEGORY PRODUCTS ====== */}
      {selectedCategory !== 'All' && (
        <section
          id="category-products-section"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '10px 20px 24px 20px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '18px'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#2563eb',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: '#eff6ff',
                padding: '3px 10px',
                borderRadius: '6px',
                marginBottom: '4px'
              }}>
                <Tag size={13} /> Selected Category
              </div>
              <h2 style={{
                fontSize: 'clamp(1.3rem, 3.5vw, 1.75rem)',
                fontWeight: 900,
                color: 'var(--text-main)',
                margin: 0
              }}>
                {selectedCategory} Products
              </h2>
            </div>

            <button
              onClick={() => setSelectedCategory('All')}
              className="btn btn-outline"
              style={{ fontSize: '0.80rem', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
            >
              Clear Filter · View All
            </button>
          </div>

          {loadingCategory ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                Loading {selectedCategory} products...
              </div>
            </div>
          ) : filteredCategoryProducts.length > 0 ? (
            <div className="products-responsive-grid">
              {filteredCategoryProducts.map(p => renderProductCard(p))}
            </div>
          ) : (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <Package size={38} color="#9ca3af" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>
                No Products Found in {selectedCategory}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '0 0 14px 0' }}>
                Admin has not listed any items under this category yet.
              </p>
              <button
                onClick={() => setSelectedCategory('All')}
                className="btn btn-primary btn-sm"
              >
                Browse All Products
              </button>
            </div>
          )}
        </section>
      )}

      {/* ====== 4. STICKER / PROMOTIONAL STRIP (ADMIN-CONTROLLED) ====== */}
      <PromotionalSticker />

      {/* ====== 5. ALL PRODUCTS SECTION ====== */}
      <section
        id="best-selling-products-section"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '16px 20px 60px 20px'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 style={{
                fontSize: 'clamp(1.4rem, 3.8vw, 2rem)',
                fontWeight: 900,
                letterSpacing: '-0.025em',
                color: 'var(--text-main)',
                margin: 0
              }}>
                All Products
              </h2>
              <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Genuine Mobile Accessories &amp; Retail Rates in INR (₹). Fast Doorstep Fulfillment.
              </div>
            </div>

            {searchQuery && (
              <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Search results for: <strong>"{searchQuery}"</strong>
              </span>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {loadingAll && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div className="spinner" style={{ margin: '0 auto 14px auto' }} />
            <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Loading catalog products...
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loadingAll && filteredAllProducts.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            <Package size={44} color="#9ca3af" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              No Products Found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              We could not find any products matching your search criteria.
            </p>
          </div>
        )}

        {/* Products Grid */}
        {!loadingAll && filteredAllProducts.length > 0 && (
          <div className="products-responsive-grid">
            {filteredAllProducts.map(p => renderProductCard(p))}
          </div>
        )}
      </section>

      {/* ====== 6. PLATFORM CAPABILITIES & FEATURES ====== */}
      <section style={{
        padding: '60px 20px',
        background: 'rgba(120, 95, 55, 0.04)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px'
            }}>
              Platform Capabilities
            </div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3.5vw, 2.3rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-main)',
              marginBottom: '10px'
            }}>
              Engineered for Wholesale Scale &amp; Reliability
            </h2>
            <p style={{
              color: 'var(--text-body)',
              fontSize: '0.96rem',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              MWS EAGLE operates an enterprise-grade mobile parts marketplace with verified distributors, strict quality checks, and role visibility.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {[
              {
                icon: ShieldCheck,
                title: 'Verified Distributors Only',
                desc: 'Every wholesale distributor undergoes strict admin license & PAN/VAT review before obtaining marketplace access.',
                color: '#4f46e5',
                bg: 'rgba(79, 70, 229, 0.08)'
              },
              {
                icon: Zap,
                title: 'Fast Order Fulfillment',
                desc: 'Genuine OEM-grade components dispatched within 24 hours with real-time tracking and logistics priority.',
                color: '#059669',
                bg: 'rgba(5, 150, 105, 0.08)'
              },
              {
                icon: TrendingUp,
                title: 'Competitive Wholesale Tiers',
                desc: 'Approved distributors access wholesale tier pricing and bulk box lots hidden from general retail customers.',
                color: '#0284c7',
                bg: 'rgba(2, 132, 199, 0.08)'
              },
              {
                icon: Award,
                title: 'Certified OEM & Tested Spares',
                desc: 'All spare screens, batteries, and IC chips undergo lab testing with role-segregated visibility and warranty.',
                color: '#d97706',
                bg: 'rgba(217, 119, 6, 0.08)'
              }
            ].map((feat, i) => (
              <div
                key={i}
                className="glass-panel"
                style={{
                  padding: '24px',
                  background: '#ffffff',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div style={{
                  width: '48px', height: '48px',
                  borderRadius: '12px',
                  background: feat.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                  color: feat.color
                }}>
                  {React.createElement(feat.icon, { size: 24 })}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  {feat.title}
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
