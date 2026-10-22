import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Smartphone, 
  LogOut, 
  User, 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const Navbar = ({ onQuickFillDemo }) => {
  const { user, logout, navigate, currentRoute } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const demoAccounts = [
    { label: 'System Admin', email: 'admin@sparedepot.com', role: 'Admin', status: 'Active', desc: 'Manage users, approvals & permissions' },
    { label: 'Active Customer', email: 'customer@example.com', role: 'Customer', status: 'Active', desc: 'Instant access, customer catalog' },
    { label: 'Approved Distributor', email: 'approved.dist@mobilecare.com', role: 'Distributor', status: 'Active', desc: 'Wholesale pricing & bulk spare lots' },
    { label: 'Pending Distributor', email: 'pending.dist@speedyfix.com', role: 'Distributor', status: 'Pending', desc: 'Tests pending review error prompt' },
    { label: 'Rejected Distributor', email: 'rejected.dist@fakeparts.com', role: 'Distributor', status: 'Rejected', desc: 'Tests rejected account error prompt' },
    { label: 'Suspended Distributor', email: 'suspended.dist@latepay.com', role: 'Distributor', status: 'Suspended', desc: 'Tests suspended access denial' }
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Brand / Logo */}
        <div 
          onClick={() => {
            if (user) {
              if (user.userType === 'Customer') navigate('/portal/customer');
              else if (user.userType === 'Distributor') navigate('/portal/distributor');
              else if (user.userType === 'Admin') navigate('/admin');
            } else {
              navigate('/login');
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}>
            <Smartphone size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>SPARE<span style={{ color: 'var(--primary)' }}>DEPOT</span></span>
              <span style={{ 
                fontSize: '0.65rem', 
                background: 'rgba(99, 102, 241, 0.2)', 
                color: '#818cf8', 
                padding: '2px 6px', 
                borderRadius: '4px',
                fontWeight: 700 
              }}>PRO</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Mobile Spare-Parts & Wholesale Platform
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Quick Demo Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Quickly test any user role"
            >
              <Sparkles size={14} color="#818cf8" />
              <span>Test Credentials</span>
              <ChevronDown size={14} />
            </button>

            {showDemoMenu && (
              <div 
                className="glass-panel" 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: '320px',
                  padding: '12px',
                  zIndex: 100,
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
                  QUICK TEST ACCOUNTS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {demoAccounts.map((acc, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (onQuickFillDemo) {
                          onQuickFillDemo(acc.email, acc.role === 'Admin' ? 'Admin@123' : acc.role === 'Customer' ? 'Customer@123' : 'Distributor@123', acc.role);
                        }
                        setShowDemoMenu(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{acc.label}</span>
                        <span className={`badge badge-${acc.status.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          {acc.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {acc.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Status / Account Bar */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {user.userType === 'Customer' && (
                  <span className="badge badge-customer">
                    <User size={12} /> Customer Portal
                  </span>
                )}
                {user.userType === 'Distributor' && (
                  <span className="badge badge-distributor">
                    <Building2 size={12} /> Distributor Wholesale
                  </span>
                )}
                {user.userType === 'Admin' && (
                  <span className="badge badge-admin">
                    <ShieldCheck size={12} /> Admin Panel
                  </span>
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  lineHeight: '1.2'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {user.fullName}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {user.userId}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Logout of current session"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary btn-sm"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
