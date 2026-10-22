import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Building2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Briefcase, 
  Phone, 
  Mail, 
  Lock, 
  FileText,
  MapPin,
  ArrowRight
} from 'lucide-react';

export const AuthPage = ({ prefillData }) => {
  const { login, registerCustomer, registerDistributor } = useAuth();

  // Mode: 'login' or 'signup'
  const [authMode, setAuthMode] = useState('login');

  // Selected Login Portal Tab: 'Customer' | 'Distributor' | 'Admin'
  const [loginRole, setLoginRole] = useState('Customer');

  // Selected Signup Role: 'Customer' | 'Distributor'
  const [signupRole, setSignupRole] = useState('Customer');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Customer Signup form state
  const [custForm, setCustForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    profileInfo: ''
  });

  // Distributor Signup form state
  const [distForm, setDistForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessAddress: '',
    panVatNumber: '',
    contactPerson: '',
    businessPhone: '',
    businessEmail: '',
    profileInfo: ''
  });

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusAlert, setStatusAlert] = useState(null); // { type: 'pending'|'rejected'|'suspended'|'success', message: '' }
  const [forgotModal, setForgotModal] = useState(false);

  // Sync external prefill (from navbar demo clicks)
  useEffect(() => {
    if (prefillData) {
      setAuthMode('login');
      setLoginEmail(prefillData.email || '');
      setLoginPassword(prefillData.password || '');
      if (prefillData.role) {
        setLoginRole(prefillData.role);
      }
      setErrorMsg(null);
      setStatusAlert(null);
    }
  }, [prefillData]);

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusAlert(null);
    setLoading(true);

    try {
      await login(loginEmail, loginPassword, loginRole);
      // Navigation is triggered inside AuthContext
    } catch (err) {
      const data = err.data || {};
      const status = data.accountStatus;

      if (status === 'Pending') {
        setStatusAlert({
          type: 'pending',
          title: 'Distributor Awaiting Approval',
          message: 'Your distributor account is awaiting admin approval.'
        });
      } else if (status === 'Rejected') {
        setStatusAlert({
          type: 'rejected',
          title: 'Distributor Application Rejected',
          message: 'Your distributor registration has been rejected. Please contact the administrator.',
          remark: data.statusRemark
        });
      } else if (status === 'Suspended') {
        setStatusAlert({
          type: 'suspended',
          title: 'Account Suspended',
          message: loginRole === 'Distributor' 
            ? 'Your distributor account has been suspended. Please contact the administrator.'
            : 'Your account has been suspended. Please contact the administrator.',
          remark: data.statusRemark
        });
      } else {
        setErrorMsg(err.message || 'Login failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Customer Signup submission
  const handleCustomerSignup = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusAlert(null);

    if (custForm.password !== custForm.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await registerCustomer({
        fullName: custForm.fullName,
        email: custForm.email,
        phoneNumber: custForm.phoneNumber,
        password: custForm.password,
        profileInfo: custForm.profileInfo
      });
      // Redirect happens in AuthContext
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete customer registration.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Distributor Signup submission
  const handleDistributorSignup = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusAlert(null);

    if (distForm.password !== distForm.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerDistributor({
        fullName: distForm.fullName,
        email: distForm.email,
        phoneNumber: distForm.phoneNumber,
        password: distForm.password,
        businessName: distForm.businessName,
        businessAddress: distForm.businessAddress,
        panVatNumber: distForm.panVatNumber,
        contactPerson: distForm.contactPerson || distForm.fullName,
        businessPhone: distForm.businessPhone || distForm.phoneNumber,
        businessEmail: distForm.businessEmail || distForm.email,
        profileInfo: distForm.profileInfo
      });

      setStatusAlert({
        type: 'pending',
        title: 'Registration Submitted Successfully!',
        message: 'Your distributor account is awaiting admin approval. An administrator will review your business credentials before login access is granted.'
      });
      setAuthMode('login');
      setLoginRole('Distributor');
      setLoginEmail(distForm.email);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit distributor registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto 80px', padding: '0 16px' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Mobile Spare-Parts <span style={{ color: 'var(--primary)' }}>Marketplace</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Unified Authentication & Role-Based Access System
        </p>
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel" style={{ padding: '32px 28px', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Toggle between LOGIN and SIGN UP */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setErrorMsg(null); setStatusAlert(null); }}
            style={{
              padding: '10px 0',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: authMode === 'login' ? 'var(--primary)' : 'transparent',
              color: authMode === 'login' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setErrorMsg(null); setStatusAlert(null); }}
            style={{
              padding: '10px 0',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: authMode === 'signup' ? 'var(--primary)' : 'transparent',
              color: authMode === 'signup' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Status / Error Alerts */}
        {statusAlert && (
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            background: 
              statusAlert.type === 'pending' ? 'var(--status-pending-bg)' :
              statusAlert.type === 'rejected' ? 'var(--status-rejected-bg)' :
              statusAlert.type === 'suspended' ? 'var(--status-suspended-bg)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${
              statusAlert.type === 'pending' ? 'rgba(245, 158, 11, 0.4)' :
              statusAlert.type === 'rejected' ? 'rgba(239, 68, 68, 0.4)' :
              statusAlert.type === 'suspended' ? 'rgba(236, 72, 153, 0.4)' : 'rgba(16, 185, 129, 0.4)'
            }`
          }}>
            {statusAlert.type === 'pending' && <Clock size={20} color="var(--status-pending)" style={{ flexShrink: 0, marginTop: '2px' }} />}
            {statusAlert.type === 'rejected' && <AlertCircle size={20} color="var(--status-rejected)" style={{ flexShrink: 0, marginTop: '2px' }} />}
            {statusAlert.type === 'suspended' && <ShieldAlert size={20} color="var(--status-suspended)" style={{ flexShrink: 0, marginTop: '2px' }} />}
            {statusAlert.type === 'success' && <CheckCircle2 size={20} color="var(--status-active)" style={{ flexShrink: 0, marginTop: '2px' }} />}
            
            <div style={{ fontSize: '0.88rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px', color: '#ffffff' }}>
                {statusAlert.title}
              </div>
              <div style={{ color: 'var(--text-main)', lineHeight: '1.5' }}>
                {statusAlert.message}
              </div>
              {statusAlert.remark && (
                <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <strong>Administrator Remark:</strong> {statusAlert.remark}
                </div>
              )}
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ===================== MODE 1: LOGIN ===================== */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            {/* Account Type Selection (Customer / Distributor / Admin) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Select Portal / Account Type:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setLoginRole('Customer')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: loginRole === 'Customer' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                    background: loginRole === 'Customer' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: loginRole === 'Customer' ? '#34d399' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <User size={16} /> Customer
                </button>

                <button
                  type="button"
                  onClick={() => setLoginRole('Distributor')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: loginRole === 'Distributor' ? '1px solid #0ea5e9' : '1px solid var(--border-subtle)',
                    background: loginRole === 'Distributor' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: loginRole === 'Distributor' ? '#38bdf8' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <Building2 size={16} /> Distributor
                </button>

                <button
                  type="button"
                  onClick={() => setLoginRole('Admin')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: loginRole === 'Admin' ? '1px solid #8b5cf6' : '1px solid var(--border-subtle)',
                    background: loginRole === 'Admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: loginRole === 'Admin' ? '#a78bfa' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  <ShieldCheck size={16} /> Admin
                </button>
              </div>
            </div>

            {/* Email / Username */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                Email / Username:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder={
                    loginRole === 'Customer' ? 'customer@example.com' :
                    loginRole === 'Distributor' ? 'approved.dist@mobilecare.com' : 'admin@sparedepot.com'
                  }
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Password:
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 40px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--primary)', width: '16px', height: '16px' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Remember this device session
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={loginRole === 'Distributor' ? 'btn btn-sky' : loginRole === 'Customer' ? 'btn btn-emerald' : 'btn btn-primary'}
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
            >
              {loading ? 'Authenticating...' : `Sign In as ${loginRole}`}
            </button>
          </form>
        )}

        {/* ===================== MODE 2: SIGN UP ===================== */}
        {authMode === 'signup' && (
          <div>
            {/* Create Account As: [ Customer ] vs [ Distributor ] */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Create Account As:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSignupRole('Customer')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: signupRole === 'Customer' ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                    background: signupRole === 'Customer' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: signupRole === 'Customer' ? '#34d399' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={18} /> Customer
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-dim)' }}>
                    Instant Signup & Purchase
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSignupRole('Distributor')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: signupRole === 'Distributor' ? '2px solid #0ea5e9' : '1px solid var(--border-subtle)',
                    background: signupRole === 'Distributor' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: signupRole === 'Distributor' ? '#38bdf8' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={18} /> Distributor
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-dim)' }}>
                    Wholesale Application
                  </span>
                </button>
              </div>
            </div>

            {/* If Distributor Selected: Mandatory Approval Notice */}
            {signupRole === 'Distributor' && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <Clock size={20} color="var(--status-pending)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem' }}>
                  <strong style={{ color: '#fbbf24' }}>Notice for Wholesale Distributors:</strong>
                  <div style={{ color: 'var(--text-main)', marginTop: '2px' }}>
                    Distributor accounts require administrator approval before login. Once submitted, your business documents will be reviewed by admin.
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOMER SIGNUP FORM */}
            {signupRole === 'Customer' ? (
              <form onSubmit={handleCustomerSignup}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={custForm.fullName}
                    onChange={(e) => setCustForm({ ...custForm, fullName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={custForm.email}
                      onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1-555-0199"
                      value={custForm.phoneNumber}
                      onChange={(e) => setCustForm({ ...custForm, phoneNumber: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={custForm.password}
                      onChange={(e) => setCustForm({ ...custForm, password: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Confirm Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={custForm.confirmPassword}
                      onChange={(e) => setCustForm({ ...custForm, confirmPassword: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Profile Notes / City (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Mobile repair hobbyist, Los Angeles"
                    value={custForm.profileInfo}
                    onChange={(e) => setCustForm({ ...custForm, profileInfo: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-emerald"
                  style={{ width: '100%', padding: '12px' }}
                >
                  {loading ? 'Creating Account...' : 'Complete Customer Registration'}
                </button>
              </form>
            ) : (
              /* DISTRIBUTOR SIGNUP FORM WITH BUSINESS DETAILS */
              <form onSubmit={handleDistributorSignup}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
                  1. Business Details (Mandatory)
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Registered Business / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Mobile Spares Hub Ltd"
                    value={distForm.businessName}
                    onChange={(e) => setDistForm({ ...distForm, businessName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>PAN / VAT Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VAT-89234812"
                      value={distForm.panVatNumber}
                      onChange={(e) => setDistForm({ ...distForm, panVatNumber: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Contact Person *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Robert Miller"
                      value={distForm.contactPerson}
                      onChange={(e) => setDistForm({ ...distForm, contactPerson: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Complete Business Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 742 Tech Blvd, Industrial Zone, CA 90210"
                    value={distForm.businessAddress}
                    onChange={(e) => setDistForm({ ...distForm, businessAddress: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  />
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border-subtle)' }}>
                  2. Authorized Signatory / Login Account
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Signatory Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={distForm.fullName}
                      onChange={(e) => setDistForm({ ...distForm, fullName: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Signatory Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1-555-0211"
                      value={distForm.phoneNumber}
                      onChange={(e) => setDistForm({ ...distForm, phoneNumber: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Account Email (Login) *</label>
                    <input
                      type="email"
                      required
                      placeholder="distributor@domain.com"
                      value={distForm.email}
                      onChange={(e) => setDistForm({ ...distForm, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Business Official Email</label>
                    <input
                      type="email"
                      placeholder="procurement@domain.com"
                      value={distForm.businessEmail}
                      onChange={(e) => setDistForm({ ...distForm, businessEmail: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={distForm.password}
                      onChange={(e) => setDistForm({ ...distForm, password: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Confirm Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={distForm.confirmPassword}
                      onChange={(e) => setDistForm({ ...distForm, confirmPassword: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-sky"
                  style={{ width: '100%', padding: '12px' }}
                >
                  {loading ? 'Submitting Application...' : 'Submit Distributor Application (Pending Review)'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ maxWidth: '420px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--primary)" /> Reset Password
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '20px' }}>
              In this system, password resets can be requested by contacting your administrator or re-authenticating with verified master credentials.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '20px' }}>
              <div>Admin Contact: <strong>admin@sparedepot.com</strong></div>
              <div>Support Line: <strong>+1-800-555-0100</strong></div>
            </div>
            <button
              onClick={() => setForgotModal(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
