import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getMediaUrl } from '../services/api';
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
  SlidersHorizontal,
  Store,
  Building2,
  Check,
  LogIn,
  X
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
    setSelectedCategory
  } = useCart();

  // Products state (defaults strictly to Customer retail catalog in INR ₹)
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchProducts = () => {
    setLoading(true);
    api.products.getVisibleProducts('Customer', selectedCategory)
      .then(res => {
        if (res && res.products) {
          setProducts(res.products);
        } else {
          setProducts([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch catalog products:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  // Synchronize immediately if Admin deletes a product or toggles stock status
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

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    const el = document.getElementById('best-selling-products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) return null;
    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    return discount > 0 ? `${discount}% OFF` : null;
  };

  // Filter products by search query
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
      {/* ====== 1. CIRCULAR CATEGORIES STRIP (AT TOP) ====== */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '20px clamp(12px, 3vw, 20px) 14px'
      }}>
        <div className="circular-categories-container">
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
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {/* Circular image avatar */}
                <div style={{
                  width: 'clamp(64px, 8vw, 78px)',
                  height: 'clamp(64px, 8vw, 78px)',
                  borderRadius: '50%',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#0a0d14',
                  boxShadow: isSelected
                    ? '0 0 0 3px #2563eb, 0 8px 18px rgba(37, 99, 235, 0.35)'
                    : '0 4px 14px rgba(0, 0, 0, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s'
                }}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.9
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }} />
                </div>

                <span style={{
                  fontSize: '0.86rem',
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                  letterSpacing: '0.01em',
                  transition: 'color 0.2s'
                }}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ====== 3. BEST SELLING PRODUCTS (AS IN IMAGE 2) ====== */}
      <section
        id="best-selling-products-section"
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '24px 20px 60px 20px'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.7rem, 4vw, 2.3rem)',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              color: 'var(--text-main)',
              margin: 0
            }}>
              Best Selling Products
            </h2>

            {searchQuery && (
              <span style={{ fontSize: '0.86rem', color: '#64748b' }}>
                Search results for: <strong>"{searchQuery}"</strong>
              </span>
            )}
          </div>

          {/* Default notice */}
          <div style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#2563eb'
            }} />
            <span>
              Showing Genuine Mobile Accessories & Retail Rates in INR (₹). Fast Doorstep Fulfillment.
            </span>
          </div>

          {/* Filter Pills */}
          <div className="category-scroll-strip">
            {filterTabs.map(tab => {
              const active = selectedCategory === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedCategory(tab)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.84rem',
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

        {/* Loading Indicator */}
        {loading && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div className="spinner" style={{ margin: '0 auto 14px auto' }} />
            <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Loading products...
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            <Package size={44} color="#9ca3af" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              No Products Found in this Category
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              We could not find any {selectedCategory} products in the catalog.
            </p>
            <button
              onClick={() => setSelectedCategory('All')}
              className="btn btn-outline"
              style={{ fontSize: '0.86rem', padding: '8px 18px' }}
            >
              View All Products
            </button>
          </div>
        )}

        {/* Products Grid (Responsive 2-col on mobile, full multi-col on desktop) */}
        {!loading && displayedProducts.length > 0 && (
          <div className="products-responsive-grid">
            {displayedProducts.map((p) => {
              const wish = isWishlisted(p.id);
              const discountStr = calculateDiscount(p.price, p.originalPrice);
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
                      alt={p.name}
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

                    {/* Pricing Row: Current Price in INR ₹, Strikethrough Original, Discount Tag */}
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
                        onClick={() => addToCart(p)}
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
            })}
          </div>
        )}
      </section>

      {/* ====== 4. PLATFORM CAPABILITIES & FEATURES ====== */}
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
              Engineered for Wholesale Scale & Reliability
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

      {/* ====== 5. TWO PORTALS SELECTOR CTA ====== */}
      <section style={{ padding: 'clamp(36px, 6vw, 70px) 16px' }}>
        <div style={{
          maxWidth: '1060px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '24px'
        }}>
          {/* Customer Portal Card */}
          <div className="glass-panel" style={{
            padding: '32px',
            background: '#ffffff',
            border: '1.5px solid rgba(5, 150, 105, 0.25)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '14px',
                background: 'rgba(5, 150, 105, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '18px',
                color: '#059669'
              }}>
                <Users size={26} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Instant Access
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 10px 0' }}>
                Customer Portal
              </h3>
              <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '20px' }}>
                Direct sign up with immediate login. Browse genuine smartphone accessories, cables, screen protectors, and audio accessories at retail pricing.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Instant sign up & immediate login',
                  'Customer-specific retail catalog',
                  'Quality guaranteed spare parts',
                  'Fast doorstep dispatch'
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => navigate('/login?role=Customer')}
              className="btn btn-emerald"
              style={{ width: '100%', padding: '13px', fontSize: '0.92rem', fontWeight: 700 }}
            >
              Sign In to Customer Portal
            </button>
          </div>

          {/* Distributor Portal Card */}
          <div className="glass-panel" style={{
            padding: '32px',
            background: '#ffffff',
            border: '1.5px solid rgba(2, 132, 199, 0.25)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '14px',
                background: 'rgba(2, 132, 199, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '18px',
                color: '#0284c7'
              }}>
                <Package size={26} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Wholesale Portal
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 10px 0' }}>
                Distributor Portal
              </h3>
              <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '20px' }}>
                Authorized wholesale dealer portal. Unlock bulk lots, factory pricing tiers, and technician assemblies for verified business partners.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Admin-verified wholesale access',
                  'Exclusive wholesale box pricing',
                  'Distributor-only component assemblies',
                  'Bulk logistics & invoice processing'
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.86rem', color: 'var(--text-main)' }}>
                    <CheckCircle2 size={16} color="#0284c7" style={{ flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => navigate('/login?role=Distributor')}
              className="btn btn-sky"
              style={{ width: '100%', padding: '13px', fontSize: '0.92rem', fontWeight: 700 }}
            >
              Sign In to Distributor Portal
            </button>
          </div>
        </div>
      </section>

      {/* ====== 6. BOTTOM CALLOUT ====== */}
      <section style={{
        padding: '50px 20px',
        background: '#ffffff',
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginBottom: '12px'
          }}>
            Ready to Elevate Your Mobile Spares Supply?
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '26px' }}>
            Access genuine smartphone spares, wholesale pricing tiers, and fast priority fulfillment today.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ padding: '12px 30px', fontSize: '0.95rem' }}
            >
              Sign In to Your Account <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
