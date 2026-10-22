import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { CustomerPortal } from './pages/CustomerPortal';
import { DistributorPortal } from './pages/DistributorPortal';
import { AdminPanel } from './pages/AdminPanel';

function AppContent() {
  const { currentRoute, user } = useAuth();
  const [prefillDemo, setPrefillDemo] = useState(null);

  const handleQuickFill = (email, password, role) => {
    setPrefillDemo({ email, password, role });
  };

  // Determine active view based on current browser path
  const renderView = () => {
    if (currentRoute === '/portal/customer') {
      return (
        <ProtectedRoute allowedRoles={['Customer']}>
          <CustomerPortal />
        </ProtectedRoute>
      );
    }

    if (currentRoute === '/portal/distributor') {
      return (
        <ProtectedRoute allowedRoles={['Distributor']}>
          <DistributorPortal />
        </ProtectedRoute>
      );
    }

    if (currentRoute === '/admin' || currentRoute === '/portal/admin') {
      return (
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminPanel />
        </ProtectedRoute>
      );
    }

    // Default to Auth / Login view
    return <AuthPage prefillData={prefillDemo} />;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onQuickFillDemo={handleQuickFill} />

      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.95)',
        padding: '24px 20px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
        lineHeight: '1.6'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
            Mobile Spare-Parts Marketplace & Distribution Engine — User Management & RBAC Foundation
          </div>
          <div>
            Built with strict role-based access control, bcrypt hashing, JWT token validation, distributor approval pipeline & product visibility filtering.
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
