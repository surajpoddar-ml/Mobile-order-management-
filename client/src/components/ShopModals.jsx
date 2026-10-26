import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api, { getMediaUrl, getProductFallbackImage } from '../services/api';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  Package,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  Search,
  ExternalLink,
  CreditCard,
  Building2,
  User,
  ShieldCheck,
  ArrowRight,
  Lock,
  LogIn,
  UserPlus,
  QrCode,
  Upload,
  FileCheck,
  Eye,
  Check,
  MessageCircle,
  PhoneCall
} from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';

export const ShopModals = () => {
  const { user, login, registerCustomer, navigate } = useAuth();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    wishlist,
    toggleWishlist,
    isWishlistOpen,
    setIsWishlistOpen,
    isTrackOrderOpen,
    setIsTrackOrderOpen,
    isContactOpen,
    setIsContactOpen,
    addToCart,
    showToast
  } = useCart();

  // Checkout Step: 'cart' | 'login_required' | 'checkout' | 'success'
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Online Payment Proof Upload state
  const [proofUploading, setProofUploading] = useState(false);
  const [proofPreview, setProofPreview] = useState(null);

  // Inline Auth State for Guest Ordering Gate
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Form Fields (including delivery location, district & online payment proof)
  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phoneNumber || '',
    shippingAddress: user?.businessAddress || '',
    district: '',
    city: '',
    state: '',
    postalCode: '',
    paymentMethod: user?.userType === 'Distributor' ? 'Wholesale Invoice (Net 30)' : 'Cash on Delivery',
    transactionId: '',
    paymentScreenshot: null,
    notes: ''
  });

  // Handle uploading payment screenshot proof to server
  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setProofPreview(localUrl);
    setProofUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('paymentProof', file);
      const res = await api.orders.uploadPaymentProof(uploadData);
      if (res.success && res.fileUrl) {
        setFormData(prev => ({ ...prev, paymentScreenshot: res.fileUrl }));
        showToast('Payment screenshot attached successfully!', 'success');
      } else {
        alert(res.message || 'Failed to upload screenshot.');
      }
    } catch (err) {
      alert(err.message || 'Failed to upload payment proof.');
    } finally {
      setProofUploading(false);
    }
  };

  // Track Order state
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedOrders, setTrackedOrders] = useState([]);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState(null);

  // Pre-fill user data when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.fullName || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
        customerPhone: user.phoneNumber || prev.customerPhone,
        shippingAddress: user.businessAddress || prev.shippingAddress,
        paymentMethod: user.userType === 'Distributor' ? 'Wholesale Invoice (Net 30)' : 'Cash on Delivery'
      }));
    }
  }, [user]);

  // Proceed to Checkout handler (Enforces login before ordering and checks stock availability)
  const handleProceedToCheckout = () => {
    const outOfStockItems = cart.filter(item => item.product.inStock === 0 || item.product.inStock === false);
    if (outOfStockItems.length > 0) {
      alert(`Cannot proceed to checkout:\n"${outOfStockItems[0].product.name}" is currently Out of Stock.\n\nPlease remove out-of-stock items from your cart before proceeding.`);
      return;
    }
    if (!user) {
      setCheckoutStep('login_required');
    } else {
      setCheckoutStep('checkout');
    }
  };

  // Inline Sign In handler inside checkout drawer
  const handleInlineLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await login(authEmail, authPassword);
      if (res.success) {
        setCheckoutStep('checkout');
      } else {
        setAuthError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Inline Customer Registration handler inside checkout drawer
  const handleInlineRegister = async (e) => {
    e.preventDefault();
    if (!authFullName || !authEmail || !authPhone || !authPassword) {
      setAuthError('Please fill in all registration fields.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await registerCustomer({
        fullName: authFullName,
        email: authEmail,
        phoneNumber: authPhone,
        password: authPassword
      });
      if (res.success) {
        setCheckoutStep('checkout');
      } else {
        setAuthError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // When Track Order opens, if user is logged in, automatically load their orders
  useEffect(() => {
    if (isTrackOrderOpen && user) {
      setTrackLoading(true);
      api.orders.getMyOrders()
        .then(res => {
          if (res.success && res.orders) {
            setTrackedOrders(res.orders);
          }
        })
        .catch(err => console.error('Failed to load user orders:', err))
        .finally(() => setTrackLoading(false));
    }
  }, [isTrackOrderOpen, user]);

  const handleTrackSearch = (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    setTrackLoading(true);
    setTrackError(null);

    api.orders.track(trackQuery)
      .then(res => {
        if (res.success && res.orders && res.orders.length > 0) {
          setTrackedOrders(res.orders);
        } else {
          setTrackedOrders([]);
          setTrackError('No orders found matching that order number, email, or phone.');
        }
      })
      .catch(err => {
        setTrackedOrders([]);
        setTrackError(err.message || 'No orders found.');
      })
      .finally(() => setTrackLoading(false));
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!cart.length) return;

    const outOfStockItems = cart.filter(item => item.product.inStock === 0 || item.product.inStock === false);
    if (outOfStockItems.length > 0) {
      alert(`Cannot submit order: "${outOfStockItems[0].product.name}" is currently Out of Stock.\n\nPlease remove out-of-stock items from your cart before completing payment.`);
      return;
    }

    if (!user) {
      setCheckoutStep('login_required');
      return;
    }

    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.shippingAddress || !formData.district) {
      alert('Please fill in your full name, email, phone number, delivery address, and district.');
      return;
    }

    if (formData.paymentMethod === 'UPI / QR Payment' || formData.paymentMethod.includes('QR')) {
      if (!formData.transactionId?.trim()) {
        alert('Please enter your UPI / Online Payment Transaction ID (UTR reference number).');
        return;
      }
      if (!formData.paymentScreenshot) {
        alert('Please upload a screenshot proof of your completed payment before placing the order.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        category: item.product.category,
        sku: item.product.sku,
        imageUrl: item.product.imageUrl,
        unitPrice: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      }));

      const payload = {
        ...formData,
        items: itemsPayload,
        totalAmount: cartTotal
      };

      const res = await api.orders.create(payload);
      if (res.success) {
        setPlacedOrder(res.order || { orderNumber: res.orderNumber, totalAmount: cartTotal });
        clearCart();
        setCheckoutStep('success');
        window.dispatchEvent(new Event('mws_notifications_refresh'));
      } else {
        alert(res.message || 'Failed to place order.');
      }
    } catch (err) {
      alert(err.message || 'An error occurred while placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return { bg: 'rgba(5, 150, 105, 0.1)', color: '#059669', label: 'Delivered' };
      case 'Dispatched':
        return { bg: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', label: 'Dispatched' };
      case 'Processing':
        return { bg: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', label: 'Processing' };
      case 'Cancelled':
        return { bg: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', label: 'Cancelled' };
      default:
        return { bg: 'rgba(217, 119, 6, 0.1)', color: '#d97706', label: 'Pending Confirmation' };
    }
  };

  return (
    <>
      {/* ================= 1. CART & CHECKOUT DRAWER ================= */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            height: '100%',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 25px rgba(0,0,0,0.2)',
            overflowY: 'auto'
          }}>
            {/* Drawer Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fcfbf8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart size={22} color="var(--primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {checkoutStep === 'cart' && `Your Shopping Cart (${cart.length})`}
                  {checkoutStep === 'checkout' && 'Checkout & Delivery'}
                  {checkoutStep === 'success' && 'Order Confirmed!'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setTimeout(() => setCheckoutStep('cart'), 300);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* STEP 1: CART ITEMS */}
            {checkoutStep === 'cart' && (
              <>
                <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                      <ShoppingCart size={48} color="#d1d5db" style={{ margin: '0 auto 12px auto' }} />
                      <h4 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>Your Cart is Empty</h4>
                      <p style={{ fontSize: '0.88rem', margin: 0 }}>Browse our products and add accessories to your cart.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          style={{
                            display: 'flex',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            background: '#ffffff'
                          }}
                        >
                          <img
                            src={getMediaUrl(item.product.imageUrl) || getProductFallbackImage(item.product.category)}
                            alt={item.product.name}
                            style={{
                              width: '68px',
                              height: '68px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              background: '#f8fafc',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              const fallback = getProductFallbackImage(item.product.category);
                              if (e.target.src !== fallback && !e.target.src.endsWith(fallback)) {
                                e.target.src = fallback;
                              }
                            }}
                          />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>
                                {item.product.category}
                              </div>
                              <div style={{
                                fontSize: '0.86rem',
                                fontWeight: 700,
                                color: '#1f2937',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {item.product.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827' }}>
                                  ₹{Number(item.product.price).toLocaleString()}
                                </span>
                                {(item.product.inStock === 0 || item.product.inStock === false) && (
                                  <span style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 800,
                                    color: '#dc2626',
                                    background: 'rgba(220, 38, 38, 0.12)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    letterSpacing: '0.03em'
                                  }}>
                                    OUT OF STOCK
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controls & Remove */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                border: '1px solid #e5e7eb',
                                borderRadius: 'var(--radius-full)',
                                padding: '2px'
                              }}>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px', color: '#4b5563' }}
                                >
                                  <Minus size={13} />
                                </button>
                                <span style={{ fontSize: '0.84rem', fontWeight: 700, padding: '0 6px', minWidth: '20px', textAlign: 'center' }}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px', color: '#4b5563' }}
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                title="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div style={{
                    padding: '20px',
                    borderTop: '1px solid var(--border-subtle)',
                    background: '#fcfbf8'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-body)' }}>
                      <span>Subtotal</span>
                      <span style={{ fontWeight: 700 }}>₹{cartTotal.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.9rem', color: 'var(--text-body)' }}>
                      <span>Estimated Shipping</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>FREE</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '18px',
                      fontSize: '1.25rem',
                      fontWeight: 900,
                      color: 'var(--text-main)',
                      borderTop: '1px dashed #d1d5db',
                      paddingTop: '10px'
                    }}>
                      <span>Total (INR)</span>
                      <span style={{ color: '#2563eb' }}>₹{cartTotal.toLocaleString()}</span>
                    </div>

                    <button
                      onClick={handleProceedToCheckout}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '14px',
                        fontSize: '1rem',
                        fontWeight: 800,
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      Proceed to Order <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* STEP: LOGIN REQUIRED TO ORDER GATE */}
            {checkoutStep === 'login_required' && (
              <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {/* Auth Notice Card */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  padding: '16px',
                  background: 'rgba(37, 99, 235, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(37, 99, 235, 0.15)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px auto'
                  }}>
                    <Lock size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                    Sign In Required to Place Order
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    You can add different products to your cart freely, but you must log in to your account before placing an order.
                  </p>
                </div>

                {/* Auth Mode Toggle Tabs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  background: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '10px',
                  marginBottom: '18px'
                }}>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(null); }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '7px',
                      border: 'none',
                      background: authMode === 'login' ? '#ffffff' : 'transparent',
                      color: authMode === 'login' ? '#2563eb' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: authMode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(null); }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '7px',
                      border: 'none',
                      background: authMode === 'register' ? '#ffffff' : 'transparent',
                      color: authMode === 'register' ? '#2563eb' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: authMode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    New Customer Sign Up
                  </button>
                </div>

                {authError && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(220, 38, 38, 0.08)',
                    color: '#dc2626',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '14px'
                  }}>
                    {authError}
                  </div>
                )}

                {/* Sign In Form */}
                {authMode === 'login' ? (
                  <form onSubmit={handleInlineLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="form-input"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="form-input"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="btn btn-primary"
                      style={{
                        marginTop: '8px',
                        padding: '12px',
                        fontWeight: 800,
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {authLoading ? 'Signing In...' : 'Sign In & Proceed to Order'} <ArrowRight size={16} />
                    </button>
                  </form>
                ) : (
                  /* Quick Customer Registration Form */
                  <form onSubmit={handleInlineRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        placeholder="Ramesh Sharma"
                        className="form-input"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                        Mobile Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="form-input"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="ramesh@example.com"
                        className="form-input"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                        Create Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="form-input"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="btn btn-primary"
                      style={{
                        marginTop: '8px',
                        padding: '12px',
                        fontWeight: 800,
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {authLoading ? 'Creating Account...' : 'Register & Proceed to Order'} <ArrowRight size={16} />
                    </button>
                  </form>
                )}

                {/* Navigation Options */}
                <div style={{ marginTop: 'auto', paddingTop: '18px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="btn btn-secondary btn-sm"
                  >
                    ← Back to Cart
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('/login');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Full Login Page →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CHECKOUT & DELIVERY FORM */}
            {checkoutStep === 'checkout' && (
              <form onSubmit={handleOrderSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                  {/* Verified User Banner */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'rgba(37, 99, 235, 0.06)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={18} color="#2563eb" />
                      <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>
                        Ordering as: <strong>{user?.fullName}</strong> ({user?.userType})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                      ● Active Account
                    </span>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                      Delivery Location & Information
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      Enter your destination address, district, and contact details for dispatch.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        placeholder="e.g. Ramesh Sharma"
                        className="form-input"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.customerPhone}
                          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="form-input"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.customerEmail}
                          onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                          placeholder="ramesh@example.com"
                          className="form-input"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                        Delivery Address (House / Flat / Street / Landmark) *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={formData.shippingAddress}
                        onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                        placeholder="Shop No. 12, Mobile Market, MG Road"
                        className="form-input"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                      />
                    </div>

                    {/* District & City */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                          District *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          placeholder="e.g. Mumbai Suburban, Patna..."
                          className="form-input"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                          City / Town *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="e.g. Mumbai"
                          className="form-input"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                        />
                      </div>
                    </div>

                    {/* State & PIN Code */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="e.g. Maharashtra"
                          className="form-input"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
                          PIN / Postal Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          placeholder="e.g. 400001"
                          className="form-input"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px' }}
                        />
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                        Payment Method
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { id: 'Cash on Delivery', label: 'Cash on Delivery (COD)', desc: 'Pay when products arrive' },
                          { id: 'UPI / QR Payment', label: 'UPI / QR Code', desc: 'Instant Google Pay / PhonePe / Paytm' },
                          ...(user?.userType === 'Distributor' ? [{ id: 'Wholesale Invoice (Net 30)', label: 'Wholesale Invoice (Net 30 Credit)', desc: 'B2B commercial invoice' }] : [])
                        ].map((m) => (
                          <label
                            key={m.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: `1.5px solid ${formData.paymentMethod === m.id ? '#2563eb' : '#e5e7eb'}`,
                              background: formData.paymentMethod === m.id ? 'rgba(37, 99, 235, 0.05)' : '#ffffff',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={formData.paymentMethod === m.id}
                              onChange={() => setFormData({ ...formData, paymentMethod: m.id })}
                            />
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1f2937' }}>{m.label}</div>
                              <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>{m.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Online Payment Proof Section (QR Code, Transaction ID, Screenshot Proof) */}
                      {formData.paymentMethod === 'UPI / QR Payment' && (
                        <div style={{
                          marginTop: '12px',
                          padding: '16px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          border: '1.5px solid #cbd5e1'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#2563eb',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <QrCode size={18} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                                Scan & Pay Online
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Use any UPI App (GPay, PhonePe, Paytm, BHIM)
                              </div>
                            </div>
                          </div>

                          {/* QR Code Card */}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: '#ffffff',
                            padding: '16px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            border: '1px solid #e2e8f0',
                            marginBottom: '16px'
                          }}>
                            <div style={{
                              padding: '10px',
                              background: '#ffffff',
                              borderRadius: '12px',
                              border: '2px dashed #94a3b8',
                              display: 'inline-block',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                            }}>
                              <img
                                src="/mws_payment_qr.png"
                                alt="MWS EAGLE Payment QR"
                                style={{ width: '180px', height: '180px', objectFit: 'contain', display: 'block', borderRadius: '6px' }}
                              />
                            </div>
                            <div style={{ marginTop: '10px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                                Amount to Pay: <span style={{ color: '#2563eb', fontSize: '1.05rem', fontWeight: 900 }}>₹{cartTotal.toLocaleString('en-IN')}</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                Scan this QR code and complete the transfer in your UPI app.
                              </div>
                            </div>
                          </div>

                          {/* Transaction ID / UTR Input */}
                          <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', color: '#1e293b' }}>
                              Payment Transaction ID / UTR Number *
                            </label>
                            <input
                              type="text"
                              required={formData.paymentMethod === 'UPI / QR Payment'}
                              value={formData.transactionId}
                              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                              placeholder="e.g. 12-digit UTR: 428901234567 or UPI Ref ID"
                              className="form-input"
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1.5px solid #94a3b8',
                                fontSize: '0.88rem',
                                background: '#ffffff',
                                fontFamily: 'monospace'
                              }}
                            />
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
                              You can find the 12-digit UPI reference / UTR number in your payment receipt.
                            </div>
                          </div>

                          {/* Screenshot Upload */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', color: '#1e293b' }}>
                              Upload Payment Screenshot Proof *
                            </label>
                            
                            <div style={{
                              border: '1.5px dashed #94a3b8',
                              borderRadius: '8px',
                              padding: '14px',
                              textAlign: 'center',
                              background: '#ffffff',
                              position: 'relative'
                            }}>
                              {proofPreview ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                  <img
                                    src={proofPreview}
                                    alt="Payment Screenshot Preview"
                                    style={{
                                      maxHeight: '140px',
                                      maxWidth: '100%',
                                      borderRadius: '6px',
                                      objectFit: 'contain',
                                      border: '1px solid #cbd5e1'
                                    }}
                                  />
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.78rem', fontWeight: 700 }}>
                                    <FileCheck size={16} /> Screenshot Attached
                                  </div>
                                  <label
                                    style={{
                                      fontSize: '0.74rem',
                                      color: '#2563eb',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                      textDecoration: 'underline'
                                    }}
                                  >
                                    Change Image
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleScreenshotUpload}
                                      style={{ display: 'none' }}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                                  <Upload size={24} color="#64748b" style={{ marginBottom: '6px' }} />
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                                    {proofUploading ? 'Uploading screenshot...' : 'Click to Upload Screenshot'}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                                    PNG, JPG or JPEG from your payment app
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleScreenshotUpload}
                                    style={{ display: 'none' }}
                                    disabled={proofUploading}
                                  />
                                </label>
                              )}
                            </div>
                            {formData.paymentScreenshot && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#059669', fontSize: '0.72rem', fontWeight: 600 }}>
                                <Check size={14} /> Ready for admin verification
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Checkout Footer */}
                <div style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--border-subtle)',
                  background: '#fcfbf8',
                  display: 'flex',
                  gap: '10px'
                }}>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="btn btn-outline"
                    style={{ padding: '12px 18px', fontSize: '0.9rem' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {isSubmitting ? 'Placing Order...' : `Confirm & Place Order (₹${cartTotal.toLocaleString()})`}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: ORDER SUCCESS */}
            {checkoutStep === 'success' && placedOrder && (
              <div style={{
                flex: 1,
                padding: '40px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'rgba(5, 150, 105, 0.12)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <CheckCircle size={38} />
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Thank You for Your Order!
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', lineHeight: 1.55, maxWidth: '340px', marginBottom: '20px' }}>
                  Your order has been recorded in the MWS EAGLE order management system.
                </p>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  width: '100%',
                  maxWidth: '360px',
                  marginBottom: '26px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
                    <span style={{ color: '#64748b' }}>Order Number:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#2563eb' }}>{placedOrder.orderNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
                    <span style={{ color: '#64748b' }}>Total Amount:</span>
                    <strong style={{ color: '#0f172a' }}>₹{Number(placedOrder.totalAmount || cartTotal).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
                    <span style={{ color: '#64748b' }}>Destination:</span>
                    <strong style={{ color: '#1e293b', textAlign: 'right', maxWidth: '200px' }}>
                      {formData.district ? `${formData.district}, ` : ''}{formData.city || formData.state}
                    </strong>
                  </div>
                  {formData.transactionId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>UTR / Ref No:</span>
                      <strong style={{ color: '#16a34a', fontFamily: 'monospace' }}>{formData.transactionId}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: '#64748b' }}>Payment Status:</span>
                    <span style={{ color: formData.paymentMethod === 'UPI / QR Payment' ? '#2563eb' : '#d97706', fontWeight: 700 }}>
                      {formData.paymentMethod === 'UPI / QR Payment' ? 'Proof Submitted (Awaiting Approval)' : 'COD / Pending'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '360px' }}>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutStep('cart');
                      setTrackQuery(placedOrder.orderNumber);
                      setIsTrackOrderOpen(true);
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontWeight: 700 }}
                  >
                    Track Order Live
                  </button>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutStep('cart');
                    }}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 2. WISHLIST DRAWER ================= */}
      {isWishlistOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            height: '100%',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fcfbf8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart size={20} color="#ef4444" fill="#ef4444" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Your Saved Wishlist ({wishlist.length})
                </h3>
              </div>
              <button
                onClick={() => setIsWishlistOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, padding: '18px 20px', overflowY: 'auto' }}>
              {wishlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <Heart size={44} color="#d1d5db" style={{ margin: '0 auto 12px auto' }} />
                  <h4 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No Saved Products</h4>
                  <p style={{ fontSize: '0.88rem' }}>Click the heart icon on any product to save it here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {wishlist.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        background: '#ffffff'
                      }}
                    >
                      <img
                        src={getMediaUrl(item.imageUrl) || getProductFallbackImage(item.category)}
                        alt={item.name}
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => {
                          const fallback = getProductFallbackImage(item.category);
                          if (e.target.src !== fallback && !e.target.src.endsWith(fallback)) {
                            e.target.src = fallback;
                          }
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>
                          {item.category}
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                          ₹{Number(item.price).toLocaleString()}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              addToCart(item);
                              toggleWishlist(item);
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: 'var(--radius-full)' }}
                          >
                            Move to Cart
                          </button>
                          <button
                            onClick={() => toggleWishlist(item)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.78rem', padding: '5px 10px', borderRadius: 'var(--radius-full)' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. TRACK ORDER MODAL ================= */}
      {isTrackOrderOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(10px, 3vw, 20px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fcfbf8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={22} color="var(--primary)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Track Your Order
                </h3>
              </div>
              <button
                onClick={() => setIsTrackOrderOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Lookup Form */}
              <form onSubmit={handleTrackSearch} style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="Enter Order Number (e.g. MWS-ORD-123456) or Phone..."
                    className="form-input"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '10px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="btn btn-primary"
                  style={{ padding: '0 22px', fontWeight: 700, borderRadius: '10px' }}
                >
                  {trackLoading ? 'Searching...' : 'Track'}
                </button>
              </form>

              {trackError && (
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(220, 38, 38, 0.08)',
                  color: '#dc2626',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  marginBottom: '16px'
                }}>
                  {trackError}
                </div>
              )}

              {/* Order Results */}
              {trackedOrders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {trackedOrders.map((ord) => {
                    const badge = getStatusBadge(ord.orderStatus);
                    return (
                      <div
                        key={ord.id || ord.orderNumber}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '18px',
                          background: '#ffffff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                          <div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Order ID</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2563eb', fontFamily: 'monospace' }}>
                              {ord.orderNumber}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                              Placed on {new Date(ord.createdDate).toLocaleDateString()}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.color
                            }}>
                              {badge.label}
                            </span>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                              ₹{Number(ord.totalAmount).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Payment & Location Info Strip */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                          padding: '8px 12px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                            <MapPin size={14} color="#2563eb" />
                            <span>Destination: <strong>{ord.district ? `${ord.district}, ` : ''}{ord.city || ord.state}</strong></span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#64748b' }}>Payment: <strong>{ord.paymentMethod}</strong></span>
                            {ord.transactionId && (
                              <span style={{ fontFamily: 'monospace', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.74rem' }}>
                                UTR: {ord.transactionId}
                              </span>
                            )}
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: ord.paymentStatus?.includes('Approved') || ord.paymentStatus?.includes('Paid') ? '#dcfce7' : '#fef3c7',
                              color: ord.paymentStatus?.includes('Approved') || ord.paymentStatus?.includes('Paid') ? '#15803d' : '#b45309'
                            }}>
                              {ord.paymentStatus || 'Pending Verification'}
                            </span>
                          </div>
                        </div>

                        {/* Visual Step Tracker */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                          padding: '12px 0',
                          borderTop: '1px solid #f1f5f9',
                          borderBottom: '1px solid #f1f5f9',
                          marginBottom: '14px'
                        }}>
                          {['Placed', 'Processing', 'Dispatched', 'Delivered'].map((step, idx) => {
                            const statuses = ['Pending', 'Processing', 'Dispatched', 'Delivered'];
                            const currentIdx = statuses.indexOf(ord.orderStatus);
                            const isReached = currentIdx >= idx;

                            return (
                              <div key={step} style={{ textAlign: 'center' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: isReached ? '#2563eb' : '#e2e8f0',
                                  color: '#ffffff',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  margin: '0 auto 4px auto'
                                }}>
                                  {isReached ? '✓' : idx + 1}
                                </div>
                                <div style={{ fontSize: '0.74rem', fontWeight: isReached ? 700 : 500, color: isReached ? '#1e293b' : '#94a3b8' }}>
                                  {step}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Items preview */}
                        {ord.items && ord.items.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                              Items Ordered ({ord.items.length}):
                            </div>
                            {ord.items.map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#334155' }}>
                                <span>{item.quantity}x {item.name}</span>
                                <span style={{ fontWeight: 600 }}>₹{Number(item.subtotal || item.unitPrice * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. CONTACT US MODAL ================= */}
      {isContactOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(10px, 3vw, 20px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fcfbf8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Contact MWS EAGLE
                </h3>
              </div>
              <button
                onClick={() => setIsContactOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: 'var(--text-body)', fontSize: '0.92rem', lineHeight: 1.55, margin: 0 }}>
                We are India's premier wholesale mobile parts and accessories distributor. Reach out to us via direct Call or WhatsApp:
              </p>

              {/* Direct 1-Click Action Buttons: Call & WhatsApp */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <a
                  href="tel:+919507677590"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 14px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                  <PhoneCall size={18} />
                  <span>Call Now</span>
                </a>

                <a
                  href="https://wa.me/919507677590?text=Hello%20MWS%20EAGLE%2C%20I%20have%20an%20inquiry%20regarding%20mobile%20spare%20parts%20and%20orders."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 14px',
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    transition: 'all 0.18s ease',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.28)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#20ba59')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#25D366')}
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp</span>
                </a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Clickable Phone Call Block */}
                <a
                  href="tel:+919507677590"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    border: '1.5px solid #e2e8f0',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.backgroundColor = '#f0f7ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    flexShrink: 0
                  }}>
                    <Phone size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Phone Call Support</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>+91 95076 77590</div>
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#2563eb' }}>Tap to Call →</span>
                </a>

                {/* Clickable WhatsApp Chat Block */}
                <a
                  href="https://wa.me/919507677590?text=Hello%20MWS%20EAGLE%2C%20I%20have%20an%20inquiry%20regarding%20mobile%20spare%20parts%20and%20orders."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    background: '#f0fdf4',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    border: '1.5px solid #bbf7d0',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#22c55e';
                    e.currentTarget.style.backgroundColor = '#dcfce7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#bbf7d0';
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(37, 211, 102, 0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#15803d',
                    flexShrink: 0
                  }}>
                    <MessageCircle size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>Direct WhatsApp Chat</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>+91 95076 77590</div>
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#15803d' }}>Open WhatsApp →</span>
                </a>

                {/* Location: Khagaria, Bihar */}
                <a
                  href="https://maps.google.com/?q=Khagaria,+Bihar"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    border: '1.5px solid #e2e8f0',
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#d97706';
                    e.currentTarget.style.backgroundColor = '#fffbeb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706',
                    flexShrink: 0
                  }}>
                    <MapPin size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Hub & Distribution Center</div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>Khagaria, Bihar</div>
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#d97706' }}>Open Map →</span>
                </a>

                {/* Wholesale Email Inquiries */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                    flexShrink: 0
                  }}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Wholesale & Customer Inquiries</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>support@mwseagle.com</div>
                  </div>
                </div>

                {/* Operating Hours */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#7c3aed',
                    flexShrink: 0
                  }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Operating Hours</div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>Mon – Sat: 9:30 AM to 8:00 PM IST</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsContactOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontWeight: 700, marginTop: '4px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Dedicated Modal */}
      <ProductDetailModal />
    </>
  );
};

export default ShopModals;
