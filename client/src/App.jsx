import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { CustomerPortal } from './pages/CustomerPortal';
import { DistributorPortal } from './pages/DistributorPortal';
import { AdminPanel } from './pages/AdminPanel';
import { WarrantyVerificationPage } from './pages/WarrantyVerificationPage';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Phone, MessageCircle, MapPin } from 'lucide-react';

function AppContent() {
  const { currentRoute, user, navigate } = useAuth();
  const [prefillDemo, setPrefillDemo] = useState(null);

  const handleQuickFill = (email, password, role) => {
    setPrefillDemo({ email, password, role });
  };

  // Synchronize document title, canonical URL, and indexing directives dynamically based on current route
  useEffect(() => {
    const path = currentRoute ? currentRoute.split('?')[0] : '/';
    let title = 'MWS Eagle | Official Website — Mobile Spare-Parts Marketplace & Accessories';
    let isNoindex = false;

    if (path === '/login') {
      title = 'Login & Partner Registration | MWS Eagle Official';
    } else if (path === '/portal/customer' || path === '/customer') {
      title = 'Customer Portal | MWS Eagle';
      isNoindex = true;
    } else if (path === '/portal/distributor' || path === '/distributor') {
      title = 'Distributor Trade Terminal | MWS Eagle';
      isNoindex = true;
    } else if (path === '/admin' || path === '/admin-access' || path === '/portal/admin') {
      title = 'Administration Suite | MWS Eagle';
      isNoindex = true;
    } else if (path.startsWith('/verify-warranty')) {
      title = 'Product Warranty Verification | MWS Eagle Official';
      isNoindex = false;
    } else {
      title = 'MWS Eagle | Official Website — Mobile Spare-Parts Marketplace & Accessories';
    }

    document.title = title;

    // Dynamically maintain canonical link
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    const cleanPath = path === '/' ? '' : path;
    canonicalEl.setAttribute('href', `https://mwseagle.com${cleanPath}`);

    // Update robots meta tag for private portals to preserve crawl equity
    let robotsEl = document.querySelector('meta[name="robots"]');
    if (robotsEl) {
      robotsEl.setAttribute(
        'content',
        isNoindex
          ? 'noindex, nofollow'
          : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      );
    }
  }, [currentRoute]);

  const renderView = () => {
    const path = currentRoute.split('?')[0]; // strip query params for matching

    // ---- Portals (protected) ----
    if (path === '/portal/customer' || path === '/customer') {
      return (
        <ProtectedRoute allowedRoles={['Customer']}>
          <CustomerPortal />
        </ProtectedRoute>
      );
    }

    if (path === '/portal/distributor' || path === '/distributor') {
      return (
        <ProtectedRoute allowedRoles={['Distributor']}>
          <DistributorPortal />
        </ProtectedRoute>
      );
    }

    // ---- Admin Panel — accessible only via /admin or /admin-access (Admin role required) ----
    if (path === '/admin' || path === '/admin-access' || path === '/portal/admin') {
      return (
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminPanel />
        </ProtectedRoute>
      );
    }

    // ---- Auth: /login ----
    if (path === '/login') {
      return <AuthPage prefillData={prefillDemo} />;
    }

    // ---- Warranty Verification (Public & Customer QR Scan) ----
    if (path.startsWith('/verify-warranty')) {
      return <WarrantyVerificationPage />;
    }

    // ---- Default: Landing Page (or user portal if authenticated) ----
    if (user) {
      const role = user.role || user.userType;
      if (role === 'Customer') return <CustomerPortal />;
      if (role === 'Distributor') return <DistributorPortal />;
      if (role === 'Admin') return <AdminPanel />;
    }

    return <LandingPage />;
  };

  const isOnAdminDashboard = currentRoute === '/admin' || currentRoute === '/admin-access' || currentRoute === '/portal/admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onQuickFillDemo={handleQuickFill} />

      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      {!isOnAdminDashboard ? (
        <footer style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(11, 15, 25, 0.98)',
          padding: '30px 20px',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            {/* Brand Logo & Description */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/mws_eagle_logo.jpg?v=3" alt="MWS Eagle Official Logo" style={{ height: '44px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#ffffff', letterSpacing: '0.04em' }}>MWS EAGLE</div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>PREMIUM MOBILE ACCESSORIES</div>
              </div>
            </div>

            {/* Direct Contact Links: Call, WhatsApp, Location */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
              {/* Phone Call */}
              <a
                href="tel:+919507677590"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '24px',
                  backgroundColor: 'rgba(37, 99, 235, 0.15)',
                  border: '1px solid rgba(37, 99, 235, 0.35)',
                  color: '#60a5fa',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.3)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.15)';
                  e.currentTarget.style.color = '#60a5fa';
                }}
              >
                <Phone size={15} />
                <span>Call: +91 95076 77590</span>
              </a>

              {/* WhatsApp Chat */}
              <a
                href="https://wa.me/919507677590?text=Hello%20MWS%20EAGLE%2C%20I%20have%20an%20inquiry%20regarding%20mobile%20spare%20parts%20and%20orders."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '24px',
                  backgroundColor: 'rgba(37, 211, 102, 0.15)',
                  border: '1px solid rgba(37, 211, 102, 0.35)',
                  color: '#4ade80',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.3)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.15)';
                  e.currentTarget.style.color = '#4ade80';
                }}
              >
                <MessageCircle size={15} />
                <span>WhatsApp: +91 95076 77590</span>
              </a>

              {/* Location: Manufacture from Kathmandu Nepal, Branch Office Delhi, Mumbai */}
              <a
                href="https://maps.google.com/?q=Kathmandu,+Nepal"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: '24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              >
                <MapPin size={15} color="#fbbf24" />
                <span>Manufacture from Kathmandu Nepal, Branch Office Delhi, Mumbai</span>
              </a>
            </div>

            {/* Copyright & Info */}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'right', lineHeight: 1.6 }}>
              <div>© 2026 MWS EAGLE Mobile Spare-Parts Marketplace. All rights reserved.</div>
              <div>Secure authentication · Role-based access control · Manufacture from Kathmandu Nepal, Branch Office Delhi, Mumbai</div>
            </div>
          </div>
        </footer>
      ) : (
        <footer style={{
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: '12px 24px',
          fontSize: '0.78rem',
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ fontWeight: 700, color: '#334155' }}>
            MWS EAGLE Administration Suite
          </div>
          <div>
            Authorized Super Admin Access · Session: <span style={{ color: '#059669', fontWeight: 700 }}>● Active</span>
          </div>
        </footer>
      )}

      {/* Fixed Mobile Bottom Navigation Bar (Home, Categories, Wishlist, Cart, Account) */}
      <MobileBottomNav />
    </div>
  );
}

import { CartProvider } from './context/CartContext';
import { ShopModals } from './components/ShopModals';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
        <ShopModals />
      </CartProvider>
    </AuthProvider>
  );
}
