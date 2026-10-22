import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  User,
  Building2,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export const Navbar = ({ onQuickFillDemo }) => {
  const { user, logout, navigate, currentRoute } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const demoAccounts = [
    { label: 'Active Customer', email: 'customer@example.com', password: 'Customer@123', role: 'Customer', status: 'Active', desc: 'Instant access & retail catalog' },
    { label: 'Approved Distributor', email: 'approved.dist@mobilecare.com', password: 'Distributor@123', role: 'Distributor', status: 'Active', desc: 'Wholesale pricing & bulk spare lots' },
    { label: 'Pending Distributor', email: 'pending.dist@speedyfix.com', password: 'Distributor@123', role: 'Distributor', status: 'Pending', desc: 'Tests pending review alert' },
    { label: 'Rejected Distributor', email: 'rejected.dist@fakeparts.com', password: 'Distributor@123', role: 'Distributor', status: 'Rejected', desc: 'Tests rejection alert notice' },
    { label: 'Suspended Distributor', email: 'suspended.dist@latepay.com', password: 'Distributor@123', role: 'Distributor', status: 'Suspended', desc: 'Tests suspended access denial' },
  ];

  const isLanding = !user && (currentRoute === '/' || currentRoute === '/home');

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'var(--bg-nav)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      boxShadow: '0 1px 8px rgba(120, 90, 40, 0.08)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 clamp(12px, 3vw, 24px)',
        height: '66px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
        >
          <img
            src="/mws_eagle_logo.jpg"
            alt="MWS EAGLE Logo"
            style={{ height: 'clamp(38px, 6vw, 46px)', width: 'auto', objectFit: 'contain', borderRadius: '8px' }}
          />
        </div>

        {/* Center Nav (Desktop only) */}
        {isLanding && (
          <nav style={{
            display: 'none',
            '@media (min-width: 768px)': { display: 'flex' },
            alignItems: 'center',
            gap: '4px'
          }} className="desktop-nav">
            {['Products', 'Wholesale', 'About'].map(item => (
              <button
                key={item}
                onClick={() => navigate(item === 'Wholesale' ? '/login?mode=signup&role=Distributor' : '/')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-body)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'color 0.15s, background 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'rgba(120,90,40,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-body)'; e.currentTarget.style.background = 'none'; }}
              >
                {item}
              </button>
            ))}
          </nav>
        )}

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>

          {/* Demo switcher (when not logged in) */}
          {!user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', padding: '7px 10px' }}
              >
                <Sparkles size={12} color="var(--primary)" />
                <span className="hide-on-very-small">Test Accounts</span>
                <ChevronDown size={12} />
              </button>

              {showDemoMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '115%',
                  width: 'min(310px, 90vw)',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-medium)',
                  padding: '10px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200
                }}>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--text-body)',
                    marginBottom: '8px',
                    paddingBottom: '6px',
                    borderBottom: '1px solid var(--border-subtle)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    Quick Demo Credentials
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {demoAccounts.map((acc, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (onQuickFillDemo) onQuickFillDemo(acc.email, acc.password, acc.role);
                          setShowDemoMenu(false);
                          navigate('/login');
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '7px',
                          background: 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>{acc.label}</span>
                          <span className={`badge badge-${acc.status.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>{acc.status}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-body)' }}>{acc.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Authenticated User */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {user.userType === 'Customer' && <span className="badge badge-customer"><User size={11} /> <span className="hide-on-mobile">Customer</span></span>}
                {user.userType === 'Distributor' && <span className="badge badge-distributor"><Building2 size={11} /> <span className="hide-on-mobile">Distributor</span></span>}
                {user.userType === 'Admin' && <span className="badge badge-admin"><ShieldCheck size={11} /> <span className="hide-on-mobile">Admin</span></span>}

                <div style={{ lineHeight: 1.2, textAlign: 'right', display: 'none', '@media (min-width: 640px)': { display: 'block' } }} className="hide-on-mobile">
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.fullName}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '0.8rem' }}
                title="Log out of account"
              >
                <LogOut size={13} />
                <span className="hide-on-mobile">Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => navigate('/login?mode=signup&role=Customer')}
                className="btn btn-secondary btn-sm hide-on-very-small"
                style={{ padding: '7px 12px', fontSize: '0.82rem' }}
              >
                Register
              </button>

              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary btn-sm"
                style={{ padding: '7px 16px', fontSize: '0.84rem' }}
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
