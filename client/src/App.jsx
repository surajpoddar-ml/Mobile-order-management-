import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { CustomerPortal } from './pages/CustomerPortal';
import { DistributorPortal } from './pages/DistributorPortal';
import { AdminPanel } from './pages/AdminPanel';
import { Phone, MessageCircle, MapPin } from 'lucide-react';

function AppContent() {
  const { currentRoute, user, navigate } = useAuth();
  const [prefillDemo, setPrefillDemo] = useState(null);

  const handleQuickFill = (email, password, role) => {
    setPrefillDemo({ email, password, role });
  };

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
      // If already logged in, redirect to proper portal
      if (user) {
        if (user.userType === 'Customer') { navigate('/portal/customer'); return null; }
        if (user.userType === 'Distributor') { navigate('/portal/distributor'); return null; }
        if (user.userType === 'Admin') { navigate('/admin'); return null; }
      }
      return <AuthPage prefillData={prefillDemo} />;
    }

    // ---- Default: Landing Page ----
    // If user is already logged in, redirect to their portal
    if (user) {
      if (user.userType === 'Customer') { navigate('/portal/customer'); return null; }
      if (user.userType === 'Distributor') { navigate('/portal/distributor'); return null; }
      if (user.userType === 'Admin') { navigate('/admin'); return null; }
    }

    return <LandingPage />;
  };

  const isAdmin = user?.userType === 'Admin' || currentRoute === '/admin' || currentRoute === '/admin-access' || currentRoute === '/portal/admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onQuickFillDemo={handleQuickFill} />

      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      {!isAdmin ? (
        <footer style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(11, 15, 25, 0.98)',
          padding: '30px 20px',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            {/* Brand Logo & Description */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/mws_eagle_logo.jpg" alt="MWS EAGLE" style={{ height: '44px', borderRadius: '8px' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>MWS EAGLE</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>PREMIUM MOBILE ACCESSORIES</div>
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

              {/* Location: Khagaria, Bihar */}
              <a
                href="https://maps.google.com/?q=Khagaria,+Bihar"
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
                <span>Khagaria, Bihar</span>
              </a>
            </div>

            {/* Copyright & Info */}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'right', lineHeight: 1.6 }}>
              <div>© 2026 MWS EAGLE Mobile Spare-Parts Marketplace. All rights reserved.</div>
              <div>Secure authentication · Role-based access control · Khagaria, Bihar Hub</div>
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
