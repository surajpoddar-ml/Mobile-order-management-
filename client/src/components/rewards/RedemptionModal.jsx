import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  X,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Package,
  Search,
  Plus,
  Minus,
  RefreshCw,
  Gift,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';

export const RedemptionModal = ({
  isOpen,
  onClose,
  currentPoints = 0,
  conversionRate = 1.0,
  userType = 'Customer',
  onRedeemSuccess
}) => {
  // Step 1: Product Selection, Step 2: Shipping & Confirm, Step 3: Success
  const [step, setStep] = useState('select'); // 'select' | 'shipping' | 'success'

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Shipping form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  // Helper to calculate product price based on user role
  const getProductPrice = (p) => {
    if (!p) return 0;
    if (userType === 'Distributor' && p.distributorPrice > 0) {
      return Number(p.distributorPrice);
    }
    return Number(p.customerPrice || p.originalPrice || p.distributorPrice || 0);
  };

  // 1 Reward Point = NPR 1
  const unitPrice = selectedProduct ? getProductPrice(selectedProduct) : 0;
  const totalRequiredPoints = Math.round(unitPrice * quantity);
  const hasEnoughPoints = currentPoints >= totalRequiredPoints && totalRequiredPoints > 0;
  const pointsShort = Math.max(0, totalRequiredPoints - currentPoints);

  // Fetch catalog products when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setErrorMsg('');
      setSuccessOrder(null);
      setSelectedProduct(null);
      setQuantity(1);
      loadCatalogProducts();

      // Pre-fill user information from localStorage if available
      try {
        const storedUser = localStorage.getItem('mws_user') || localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.fullName) setCustomerName(parsed.fullName);
          if (parsed.phoneNumber) setCustomerPhone(parsed.phoneNumber);
          if (parsed.address) setShippingAddress(parsed.address);
          if (parsed.district) setDistrict(parsed.district);
          if (parsed.city) setCity(parsed.city);
        }
      } catch (e) {}
    }
  }, [isOpen]);

  const loadCatalogProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.products.getVisibleProducts(userType, 'All');
      if (res && res.success) {
        // Filter out inactive products and products with no price
        const available = (res.products || []).filter(
          (p) => p.productStatus !== 'Inactive' && p.inStock > 0
        );
        setProducts(available);
      }
    } catch (err) {
      console.warn('Failed to load products for redemption:', err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  });

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setQuantity(1);
    setErrorMsg('');
  };

  const handleProceedToShipping = () => {
    if (!selectedProduct) {
      return setErrorMsg('Please select a product to purchase.');
    }
    if (!hasEnoughPoints) {
      return setErrorMsg(
        `Insufficient points. You need ${totalRequiredPoints} points (NPR ${totalRequiredPoints}), but only have ${currentPoints} points.`
      );
    }
    setErrorMsg('');
    setStep('shipping');
  };

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedProduct) {
      return setErrorMsg('Please select a product to purchase.');
    }

    if (!shippingAddress.trim()) {
      return setErrorMsg('Please enter your full delivery address.');
    }

    if (!district.trim()) {
      return setErrorMsg('Please specify your delivery district.');
    }

    if (!hasEnoughPoints) {
      return setErrorMsg(
        `Insufficient points. You need ${totalRequiredPoints} points (NPR ${totalRequiredPoints}), but only have ${currentPoints} points.`
      );
    }

    setSubmitting(true);
    try {
      const payload = {
        productId: selectedProduct.id,
        quantity,
        shippingAddress: shippingAddress.trim(),
        district: district.trim(),
        city: city.trim(),
        customerPhone: customerPhone.trim(),
        customerName: customerName.trim(),
        notes: notes.trim()
      };

      const res = await api.rewards.redeemProduct(payload);
      if (res.success) {
        setSuccessOrder(res.order);
        setStep('success');

        // Dispatch live sync events
        window.dispatchEvent(new Event('mws_rewards_updated'));
        window.dispatchEvent(new Event('mws_notifications_refresh'));
        if (onRedeemSuccess) onRedeemSuccess(res);
      } else {
        setErrorMsg(res.message || 'Failed to place reward order.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error placing reward order. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: step === 'select' ? '820px' : '560px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          transition: 'max-width 0.25s ease'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}
            >
              <Gift size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Buy Products with Points
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Redeem your earned reward points for catalog products • 1 Point = NPR 1
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* User points balance pill */}
            <div
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
              className="reward-points-pill"
            >
              <Sparkles size={14} color="#f59e0b" />
              <span>{currentPoints.toLocaleString()} pts (NPR {currentPoints.toLocaleString()})</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Available Points Ribbon */}
        <div
          style={{
            backgroundColor: '#0f172a',
            padding: '10px 24px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.82rem',
            color: '#e2e8f0',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#94a3b8' }}>Your Available Balance:</span>
            <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: '0.98rem' }}>
              {currentPoints.toLocaleString()} Points
            </span>
            <span style={{ color: '#cbd5e1' }}>
              (= <strong>NPR {currentPoints.toLocaleString()}</strong>)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.78rem', fontWeight: 700 }}>
            <CheckCircle2 size={14} />
            <span>Rate: 1 Point = NPR 1</span>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          {/* Error Message Box */}
          {errorMsg && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1.5px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '14px',
                padding: '12px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.84rem',
                lineHeight: 1.4
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: SELECT PRODUCT & QUANTITY */}
          {/* ======================================================== */}
          {step === 'select' && (
            <div>
              {/* Search Bar */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <Search
                  size={18}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Search products by name or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Products List */}
              {loadingProducts ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                  <div>Loading available products...</div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <Package size={36} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    No products found
                  </div>
                  <div style={{ fontSize: '0.82rem' }}>
                    {productSearch ? 'Try a different search term.' : 'No catalog products are currently available.'}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: '12px',
                    maxHeight: '360px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                    marginBottom: '20px'
                  }}
                >
                  {filteredProducts.map((p) => {
                    const price = getProductPrice(p);
                    const isSelected = selectedProduct?.id === p.id;
                    const canAffordSingle = currentPoints >= price;

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        style={{
                          borderRadius: '16px',
                          border: isSelected ? '2px solid #f59e0b' : '1.5px solid #e2e8f0',
                          backgroundColor: isSelected ? '#fffbeb' : '#ffffff',
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: isSelected ? '0 4px 14px rgba(245, 158, 11, 0.2)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          {/* Image */}
                          <div
                            style={{
                              width: '100%',
                              height: '110px',
                              borderRadius: '10px',
                              backgroundColor: '#f8fafc',
                              overflow: 'hidden',
                              marginBottom: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative'
                            }}
                          >
                            <img
                              src={p.imageUrl || '/mws_eagle_logo.jpg?v=3'}
                              alt={p.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.src = '/mws_eagle_logo.jpg?v=3';
                              }}
                            />
                            {isSelected && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  backgroundColor: '#f59e0b',
                                  color: '#ffffff',
                                  borderRadius: '50%',
                                  width: '22px',
                                  height: '22px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <CheckCircle2 size={16} />
                              </div>
                            )}
                          </div>

                          {/* Product Name */}
                          <div
                            style={{
                              fontSize: '0.86rem',
                              fontWeight: 800,
                              color: '#0f172a',
                              lineHeight: 1.3,
                              marginBottom: '4px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {p.name}
                          </div>

                          {p.category && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '8px' }}>
                              {p.category}
                            </div>
                          )}
                        </div>

                        <div>
                          {/* Price & Required Points */}
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                            <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#f59e0b' }}>
                              {price} <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>pts</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              NPR {price.toLocaleString()}
                            </div>
                          </div>

                          {/* Eligibility Badge */}
                          <div style={{ marginTop: '8px' }}>
                            {canAffordSingle ? (
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  color: '#059669',
                                  backgroundColor: '#ecfdf5',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  border: '1px solid #a7f3d0'
                                }}
                              >
                                Points Covered
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  color: '#dc2626',
                                  backgroundColor: '#fef2f2',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  border: '1px solid #fecaca'
                                }}
                              >
                                Need {price - currentPoints} more pts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selected Product Action Bar */}
              {selectedProduct && (
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '18px',
                    border: '1.5px solid #e2e8f0',
                    padding: '16px',
                    marginTop: '12px'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={selectedProduct.imageUrl || '/mws_eagle_logo.jpg?v=3'}
                        alt={selectedProduct.name}
                        style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = '/mws_eagle_logo.jpg?v=3';
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                          {selectedProduct.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Unit Price: NPR {unitPrice.toLocaleString()} ({unitPrice} pts)
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Qty:</span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#ffffff',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          style={{
                            padding: '6px 10px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#334155'
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ padding: '0 10px', fontWeight: 800, fontSize: '0.9rem', minWidth: '24px', textAlign: 'center' }}>
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(quantity + 1)}
                          style={{
                            padding: '6px 10px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#334155'
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Total Required Points */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                        Total Required
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b' }}>
                        {totalRequiredPoints.toLocaleString()} <span style={{ fontSize: '0.8rem' }}>pts</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                        (NPR {totalRequiredPoints.toLocaleString()})
                      </div>
                    </div>
                  </div>

                  {/* Insufficient Points Warning or Success confirmation notice */}
                  {!hasEnoughPoints ? (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#b91c1c',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      <div>
                        <strong>Insufficient Points:</strong> You need <strong>{totalRequiredPoints} points</strong> for this purchase, but you currently have <strong>{currentPoints} points</strong>. You are short by <strong>{pointsShort} points</strong>.
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#047857',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                      <div>
                        You have sufficient points! Remaining after purchase: <strong>{currentPoints - totalRequiredPoints} points</strong>.
                      </div>
                    </div>
                  )}

                  {/* Proceed to Shipping Button */}
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleProceedToShipping}
                      disabled={!hasEnoughPoints}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: hasEnoughPoints ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#cbd5e1',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: hasEnoughPoints ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: hasEnoughPoints ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none'
                      }}
                    >
                      <span>Continue to Delivery</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: SHIPPING ADDRESS & PURCHASE CONFIRMATION */}
          {/* ======================================================== */}
          {step === 'shipping' && selectedProduct && (
            <form onSubmit={handleConfirmPurchase}>
              {/* Summary Card */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '16px',
                  border: '1.5px solid #e2e8f0',
                  padding: '14px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={selectedProduct.imageUrl || '/mws_eagle_logo.jpg?v=3'}
                    alt={selectedProduct.name}
                    style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = '/mws_eagle_logo.jpg?v=3';
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                      {quantity}x {selectedProduct.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Payment: {totalRequiredPoints} Reward Points (NPR {totalRequiredPoints.toLocaleString()})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('select')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Change
                </button>
              </div>

              {/* Delivery Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter recipient full name"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter active phone number"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Shipping Address *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="House / Shop #, Street, Landmark..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Kathmandu, Lalitpur..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.86rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      City / Town
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Thamel, Pokhara..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.86rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Order Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific delivery instructions"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.86rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Bottom CTAs */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  disabled={submitting}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={submitting || !hasEnoughPoints}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: submitting || !hasEnoughPoints ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm & Purchase ({totalRequiredPoints} Points)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 3: PURCHASE CONFIRMATION & ORDER STATUS */}
          {/* ======================================================== */}
          {step === 'success' && successOrder && (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginBottom: '6px' }}>
                Order Placed Successfully!
              </div>

              <div style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '380px', margin: '0 auto 20px' }}>
                Your order has been paid using reward points and submitted directly to the system.
              </div>

              {/* Order Receipt Box */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '16px',
                  border: '1.5px solid #e2e8f0',
                  padding: '18px 20px',
                  textAlign: 'left',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Order Number:</span>
                  <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#2563eb' }}>
                    {successOrder.orderNumber}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Purchased Product:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {successOrder.quantity}x {successOrder.productName}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Points Redeemed:</span>
                  <span style={{ fontWeight: 800, color: '#dc2626' }}>
                    -{successOrder.pointsRedeemed} Points
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Equivalent Value:</span>
                  <span style={{ fontWeight: 800, color: '#059669' }}>
                    NPR {Number(successOrder.totalNpr).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Payment Method:</span>
                  <span style={{ fontWeight: 800, color: '#0f172a', backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem' }}>
                    Reward Points
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Order Status:</span>
                  <span style={{ fontWeight: 800, color: '#b45309', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem' }}>
                    {successOrder.orderStatus || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Close & Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedemptionModal;
