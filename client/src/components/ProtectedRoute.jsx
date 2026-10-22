import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading, navigate } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px'
      }}>
        <div style={{
          width: '36px', height: '36px',
          border: '3px solid rgba(79, 70, 229, 0.15)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying credentials...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', padding: '32px 20px', textAlign: 'center' }}
        className="glass-panel animate-fade-in">
        <div style={{
          width: '60px', height: '60px', margin: '0 auto 16px',
          borderRadius: '50%', background: 'rgba(220, 38, 38, 0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(220, 38, 38, 0.15)'
        }}>
          <Lock size={26} color="#dc2626" />
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
          Authentication Required
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.6 }}>
          You must be signed in to access this portal.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%' }}>
          Proceed to Sign In
        </button>
      </div>
    );
  }

  if (!allowedRoles.includes(user.userType)) {
    const userPortal =
      user.userType === 'Customer' ? '/portal/customer' :
      user.userType === 'Distributor' ? '/portal/distributor' : '/admin';

    return (
      <div style={{ maxWidth: '540px', margin: '60px auto', padding: '36px 24px', textAlign: 'center' }}
        className="glass-panel animate-fade-in">
        <div style={{
          width: '60px', height: '60px', margin: '0 auto 16px',
          borderRadius: '50%', background: 'rgba(220, 38, 38, 0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(220, 38, 38, 0.15)'
        }}>
          <ShieldAlert size={28} color="#dc2626" />
        </div>
        <span className="badge badge-rejected" style={{ marginBottom: '12px' }}>403 Access Forbidden</span>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>
          Unauthorized Portal Access
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px', lineHeight: 1.6 }}>
          You are signed in as a <strong style={{ color: 'var(--text-main)' }}>{user.userType}</strong>.
          This route is restricted to <strong style={{ color: 'var(--primary)' }}>[{allowedRoles.join(', ')}]</strong> accounts only.
        </p>
        <div style={{
          background: 'var(--bg-input)', borderRadius: '8px',
          padding: '12px', marginBottom: '24px',
          fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'left',
          border: '1px solid var(--border-subtle)'
        }}>
          <div><strong>Account:</strong> {user.fullName} ({user.email})</div>
          <div><strong>Role:</strong> {user.userType} | <strong>Status:</strong> {user.accountStatus}</div>
        </div>
        <button onClick={() => navigate(userPortal)} className="btn btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Return to Your {user.userType} Portal
        </button>
      </div>
    );
  }

  return children;
};
