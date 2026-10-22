import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading, navigate } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying security credentials...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in -> Redirect to login
  if (!user) {
    return (
      <div style={{
        maxWidth: '500px',
        margin: '60px auto',
        padding: '32px',
        textAlign: 'center'
      }} className="glass-panel animate-fade-in">
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444'
        }}>
          <Lock size={30} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
          Authentication Required
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          You must be logged in to access this portal.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Proceed to Login
        </button>
      </div>
    );
  }

  // Role validation: Role-based access control (RBAC)
  if (!allowedRoles.includes(user.userType)) {
    const userPortal = 
      user.userType === 'Customer' ? '/portal/customer' :
      user.userType === 'Distributor' ? '/portal/distributor' : '/admin';

    return (
      <div style={{
        maxWidth: '560px',
        margin: '60px auto',
        padding: '36px',
        textAlign: 'center'
      }} className="glass-panel animate-fade-in">
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444'
        }}>
          <ShieldAlert size={32} />
        </div>
        <div className="badge badge-rejected" style={{ marginBottom: '12px' }}>
          403 Access Forbidden
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
          Unauthorized Portal Access
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.6' }}>
          You are currently signed in as a <strong style={{ color: 'var(--text-main)' }}>{user.userType}</strong>. 
          This route is restricted to <strong style={{ color: 'var(--primary)' }}>[{allowedRoles.join(', ')}]</strong> accounts only.
        </p>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          fontSize: '0.8rem',
          color: 'var(--text-dim)',
          textAlign: 'left'
        }}>
          <div><strong>Account:</strong> {user.fullName} ({user.email})</div>
          <div><strong>Role:</strong> {user.userType} | <strong>Status:</strong> {user.accountStatus}</div>
        </div>

        <button
          onClick={() => navigate(userPortal)}
          className="btn btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} />
          <span>Return to Your {user.userType} Portal</span>
        </button>
      </div>
    );
  }

  // User is authenticated and authorized for this route
  return children;
};
