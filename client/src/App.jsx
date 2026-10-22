import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { CustomerPortal } from './pages/CustomerPortal';
import { DistributorPortal } from './pages/DistributorPortal';
import { AdminPanel } from './pages/AdminPanel';

function AppContent() {
  const { currentRoute, user, navigate } = useAuth();
  const [prefillDemo, setPrefillDemo] = useState(null);

  const handleQuickFill = (email, password, role) => {
    setPrefillDemo({ email, password, role });
  };

  const renderView = () => {
    const path = currentRoute.split('?')[0]; // strip query params for matching

    // ---- Portals (protected) ----
    if (path === '/portal/customer') {
      return (
        <ProtectedRoute allowedRoles={['Customer']}>
          <CustomerPortal />
        </ProtectedRoute>
      );
    }

    if (path === '/portal/distributor') {
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onQuickFillDemo={handleQuickFill} />

      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.96)',
        padding: '28px 20px',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/mws_eagle_logo.jpg" alt="MWS EAGLE" style={{ height: '40px', borderRadius: '8px' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>MWS EAGLE</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>HIGH PERFORMANCE ACCESSORIES</div>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'right', lineHeight: 1.6 }}>
            <div>© 2026 MWS EAGLE Mobile Spare-Parts Marketplace. All rights reserved.</div>
            <div>Secure authentication · Role-based access control · bcrypt hashed credentials</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
