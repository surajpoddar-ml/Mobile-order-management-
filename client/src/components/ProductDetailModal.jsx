import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { getMediaUrl } from '../services/api';
import {
  X,
  ShoppingCart,
  Heart,
  Star,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  ChevronRight,
  Package,
  Layers,
  ArrowRight,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';

export const ProductDetailModal = () => {
  const {
    selectedProduct,
    isProductDetailOpen,
    setIsProductDetailOpen,
    addToCart,
    buyNow,
    toggleWishlist,
    isWishlisted
  } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  // Reset internal state when a new product is selected
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      setSelectedImageIndex(0);
      setSelectedColor(null);
      setSelectedModel(null);
    }
  }, [selectedProduct]);

  if (!isProductDetailOpen || !selectedProduct) {
    return null;
  }

  const p = selectedProduct;
  const wish = isWishlisted(p.id);
  const isItemInStock = p.inStock !== 0 && p.inStock !== false;

  // Calculate discount percentage
  const origPrice = Number(p.originalPrice || 0);
  const curPrice = Number(p.price || 0);
  let discountStr = null;
  if (origPrice > curPrice && origPrice > 0) {
    const disc = Math.round(((origPrice - curPrice) / origPrice) * 100);
    if (disc > 0) discountStr = `${disc}% OFF`;
  }

  // Parse images: handles comma-separated URLs or JSON array or single imageUrl
  let imageList = [];
  if (p.imageUrl) {
    if (p.imageUrl.startsWith('[') && p.imageUrl.endsWith(']')) {
      try {
        imageList = JSON.parse(p.imageUrl);
      } catch (e) {
        imageList = [p.imageUrl];
      }
    } else if (p.imageUrl.includes(',')) {
      imageList = p.imageUrl.split(',').map(u => u.trim()).filter(Boolean);
    } else {
      imageList = [p.imageUrl];
    }
  }

  // Parse specifications / features / colors / models if available in p.specifications
  let parsedSpecs = [];
  let detectedColors = [];
  let detectedModels = [];

  if (p.specifications) {
    try {
      if (typeof p.specifications === 'string') {
        if (p.specifications.startsWith('{') || p.specifications.startsWith('[')) {
          const parsed = JSON.parse(p.specifications);
          if (Array.isArray(parsed)) {
            parsedSpecs = parsed;
          } else if (typeof parsed === 'object') {
            parsedSpecs = Object.entries(parsed).map(([key, value]) => ({ key, value }));
          }
        } else {
          // Plain text specifications separated by newlines or semicolons
          const lines = p.specifications.split(/[\r\n;]+/).filter(l => l.trim().length > 0);
          parsedSpecs = lines.map(line => {
            if (line.includes(':')) {
              const [k, ...rest] = line.split(':');
              return { key: k.trim(), value: rest.join(':').trim() };
            }
            return { key: 'Feature', value: line.trim() };
          });
        }
      }
    } catch (e) {
      parsedSpecs = [{ key: 'Details', value: p.specifications }];
    }
  }

  // Check if any specs represent Colors or Models
  parsedSpecs.forEach(item => {
    const k = (item.key || '').toLowerCase();
    if (k.includes('color') || k.includes('colour')) {
      const parts = String(item.value).split(/[,/]+/).map(c => c.trim()).filter(Boolean);
      detectedColors = [...detectedColors, ...parts];
    }
    if (k.includes('model') || k.includes('variety') || k.includes('compatibility')) {
      const parts = String(item.value).split(/[,/]+/).map(m => c.trim()).filter(Boolean);
      detectedModels = [...detectedModels, ...parts];
    }
  });

  const activeImage = imageList[selectedImageIndex] || imageList[0];

  const handleAddToCart = () => {
    addToCart(p, quantity);
  };

  const handleBuyNow = () => {
    buyNow(p);
  };

  return (
    <div
      onClick={() => setIsProductDetailOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'fadeIn 0.2s ease',
        overflowY: 'auto'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s ease'
        }}
      >
        {/* Modal Top Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid #f1f5f9',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#2563eb',
              letterSpacing: '0.06em',
              background: '#eff6ff',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              {p.category || 'MWS ACCESSORIES'}
            </span>
            {p.sku && (
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                SKU: {p.sku}
              </span>
            )}
          </div>

          <button
            onClick={() => setIsProductDetailOpen(false)}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              transition: 'background 0.15s'
            }}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div style={{
          padding: '16px 18px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Top Gallery View */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center'
          }}>
            {/* Main Stage Image */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(220px, 40vw, 320px)',
              background: '#f8fafc',
              borderRadius: '14px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e2e8f0'
            }}>
              {p.badge && (
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  zIndex: 2
                }}>
                  {p.badge}
                </span>
              )}

              {/* Wishlist Button in Image Corner */}
              <button
                type="button"
                onClick={() => toggleWishlist(p)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  color: wish ? '#ef4444' : '#64748b'
                }}
                aria-label="Toggle Wishlist"
              >
                <Heart size={18} fill={wish ? '#ef4444' : 'none'} color={wish ? '#ef4444' : 'currentColor'} />
              </button>

              <img
                src={getMediaUrl(activeImage)}
                alt={p.name || 'MWS Eagle Product'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: '12px',
                  filter: !isItemInStock ? 'grayscale(40%)' : 'none'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            {/* Thumbnail Row if Multiple Images */}
            {imageList.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                width: '100%',
                overflowX: 'auto',
                padding: '2px 0'
              }}>
                {imageList.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '8px',
                      border: selectedImageIndex === idx ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      overflow: 'hidden',
                      padding: 0,
                      background: '#f8fafc',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={getMediaUrl(imgUrl)}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Title and Brand */}
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              Brand: <strong style={{ color: '#0f172a' }}>{p.brand || 'MWS Eagle'}</strong>
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.3,
              margin: 0
            }}>
              {p.name}
            </h2>
          </div>

          {/* Rating & Stock Status Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map((starIdx) => {
                const isFilled = starIdx <= Math.round(p.rating || 5);
                return (
                  <Star
                    key={starIdx}
                    size={15}
                    color={isFilled ? '#f59e0b' : '#d1d5db'}
                    fill={isFilled ? '#f59e0b' : 'none'}
                  />
                );
              })}
              <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#0f172a', marginLeft: '4px' }}>
                {Number(p.rating || 5).toFixed(1)}
              </span>
              <span style={{ fontSize: '0.76rem', color: '#64748b', marginLeft: '2px' }}>
                ({p.reviewCount || 0} reviews)
              </span>
            </div>

            {/* Stock pill */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 800,
              background: isItemInStock ? '#ecfdf5' : '#fef2f2',
              color: isItemInStock ? '#059669' : '#dc2626',
              border: `1px solid ${isItemInStock ? '#a7f3d0' : '#fecaca'}`
            }}>
              {isItemInStock ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {isItemInStock ? 'In Stock · Doorstep Delivery' : 'Out of Stock'}
            </span>
          </div>

          {/* Pricing Box */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#0f172a'
            }}>
              ₹{Number(p.price || 0).toLocaleString()}
            </span>

            {origPrice > curPrice && (
              <span style={{
                fontSize: '0.90rem',
                color: '#94a3b8',
                textDecoration: 'line-through',
                fontWeight: 600
              }}>
                ₹{origPrice.toLocaleString()}
              </span>
            )}

            {discountStr && (
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#dc2626',
                background: '#fee2e2',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {discountStr}
              </span>
            )}
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: 'auto' }}>
              Inclusive of all taxes
            </span>
          </div>

          {/* Colors Selection (if specified in product) */}
          {detectedColors.length > 0 && (
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                Available Colors:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {detectedColors.map((col, idx) => {
                  const isSel = selectedColor === col || (selectedColor === null && idx === 0);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        border: isSel ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isSel ? '#eff6ff' : '#ffffff',
                        color: isSel ? '#1d4ed8' : '#334155',
                        fontSize: '0.78rem',
                        fontWeight: isSel ? 800 : 600,
                        cursor: 'pointer'
                      }}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Models / Variety Selection (if specified in product) */}
          {detectedModels.length > 0 && (
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                Compatible Models / Varieties:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {detectedModels.map((mod, idx) => {
                  const isSel = selectedModel === mod || (selectedModel === null && idx === 0);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedModel(mod)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        border: isSel ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isSel ? '#eff6ff' : '#ffffff',
                        color: isSel ? '#1d4ed8' : '#334155',
                        fontSize: '0.78rem',
                        fontWeight: isSel ? 800 : 600,
                        cursor: 'pointer'
                      }}
                    >
                      {mod}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {p.description && (
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Description
              </h4>
              <p style={{
                fontSize: '0.84rem',
                color: '#475569',
                lineHeight: 1.55,
                margin: 0,
                whiteSpace: 'pre-line'
              }}>
                {p.description}
              </p>
            </div>
          )}

          {/* Specifications Table */}
          {parsedSpecs.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                Specifications & Features
              </h4>
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                {parsedSpecs.map((spec, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      fontSize: '0.80rem',
                      padding: '8px 12px',
                      background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                      borderBottom: i < parsedSpecs.length - 1 ? '1px solid #f1f5f9' : 'none'
                    }}
                  >
                    <div style={{ width: '38%', fontWeight: 700, color: '#475569' }}>
                      {spec.key}
                    </div>
                    <div style={{ width: '62%', color: '#0f172a' }}>
                      {String(spec.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assured Badges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            paddingTop: '6px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px',
              background: '#f8fafc',
              borderRadius: '8px',
              fontSize: '0.74rem',
              color: '#334155'
            }}>
              <ShieldCheck size={16} color="#059669" />
              <span>100% Genuine MWS Eagle Spares</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px',
              background: '#f8fafc',
              borderRadius: '8px',
              fontSize: '0.74rem',
              color: '#334155'
            }}>
              <Truck size={16} color="#2563eb" />
              <span>Fast Doorstep Shipping</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid #f1f5f9',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {/* Quantity selector */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || !isItemInStock}
              style={{
                width: '32px',
                height: '38px',
                background: '#f8fafc',
                border: 'none',
                cursor: quantity <= 1 || !isItemInStock ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569'
              }}
            >
              <Minus size={14} />
            </button>
            <span style={{
              width: '32px',
              textAlign: 'center',
              fontSize: '0.86rem',
              fontWeight: 800,
              color: '#0f172a'
            }}>
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              disabled={!isItemInStock}
              style={{
                width: '32px',
                height: '38px',
                background: '#f8fafc',
                border: 'none',
                cursor: !isItemInStock ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569'
              }}
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
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
              height: '40px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: isItemInStock ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s'
            }}
          >
            <ShoppingCart size={15} />
            <span>{isItemInStock ? 'Add to Cart' : 'Out of Stock'}</span>
          </button>

          {/* Buy Now Button */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!isItemInStock}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: isItemInStock ? '#0f172a' : '#cbd5e1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              height: '40px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: isItemInStock ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s'
            }}
          >
            <span>Buy Now</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
