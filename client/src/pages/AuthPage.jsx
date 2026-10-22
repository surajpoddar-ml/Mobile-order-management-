import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  ShieldAlert,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Phone,
  FileText,
  MapPin,
  Briefcase
} from 'lucide-react';

export const AuthPage = ({ prefillData }) => {
  const { login, registerCustomer, registerDistributor, navigate } = useAuth();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [loginRole, setLoginRole] = useState('Customer'); // 'Customer' | 'Distributor'
  const [signupRole, setSignupRole] = useState('Customer'); // 'Customer' | 'Distributor'

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Customer Form
  const [custForm, setCustForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  // Distributor Form
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
    businessEmail: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusAlert, setStatusAlert] = useState(null);
  const [forgotModal, setForgotModal] = useState(false);

  // Parse URL query params
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const modeParam = url.searchParams.get('mode');
      const roleParam = url.searchParams.get('role');
      if (modeParam === 'signup') {
        setAuthMode('signup');
        if (roleParam === 'Distributor') setSignupRole('Distributor');
        else if (roleParam === 'Customer') setSignupRole('Customer');
      } else if (modeParam === 'login') {
        setAuthMode('login');
        if (roleParam === 'Distributor') setLoginRole('Distributor');
      }
    } catch (e) {}
  }, [window.location.href]);

  // Handle prefill demo data
  useEffect(() => {
    if (prefillData) {
      setAuthMode('login');
      setLoginEmail(prefillData.email || '');
      setLoginPassword(prefillData.password || '');
      if (prefillData.role && prefillData.role !== 'Admin') {
        setLoginRole(prefillData.role);
      }
      setErrorMsg(null);
      setStatusAlert(null);
    }
  }, [prefillData]);

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusAlert(null);
    setLoading(true);

    try {
      await login(loginEmail, loginPassword, loginRole);
    } catch (err) {
      const data = err.data || {};
      const status = data.accountStatus;

      if (status === 'Pending') {
        setStatusAlert({
          type: 'pending',
          title: 'Distributor Awaiting Admin Approval',
          message: 'Your distributor account registration has been submitted and is awaiting administrator verification. You cannot log in until your account is approved.'
        });
      } else if (status === 'Rejected') {
        setStatusAlert({
          type: 'rejected',
          title: 'Distributor Registration Rejected',
          message: 'Your distributor registration was reviewed and rejected by the administrator.',
          remark: data.statusRemark
        });
      } else if (status === 'Suspended') {
        setStatusAlert({
          type: 'suspended',
          title: 'Account Suspended',
          message: 'Your account has been suspended by the administrator. Access is temporarily revoked.',
          remark: data.statusRemark
        });
      } else {
        setErrorMsg(err.message || 'Invalid email or password. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Customer signup handler
  const handleCustomerSignup = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (custForm.password !== custForm.confirmPassword) {
      return setErrorMsg('Passwords do not match. Please re-type your password.');
    }
    if (custForm.password.length < 6) {
      return setErrorMsg('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      await registerCustomer({
        fullName: custForm.fullName,
        email: custForm.email,
        phoneNumber: custForm.phoneNumber,
        password: custForm.password
      });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete customer registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Distributor signup handler
  const handleDistributorSignup = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (distForm.password !== distForm.confirmPassword) {
      return setErrorMsg('Passwords do not match. Please re-type your password.');
    }
    if (distForm.password.length < 6) {
      return setErrorMsg('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      await registerDistributor({
        fullName: distForm.fullName,
        email: distForm.email,
        phoneNumber: distForm.phoneNumber,
        password: distForm.password,
        businessName: distForm.businessName,
        businessAddress: distForm.businessAddress,
        panVatNumber: distForm.panVatNumber,
        contactPerson: distForm.contactPerson || distForm.fullName,
        businessPhone: distForm.businessPhone || distForm.phoneNumber,
        businessEmail: distForm.businessEmail || distForm.email
      });

      setStatusAlert({
        type: 'pending',
        title: 'Application Submitted Successfully!',
        message: 'Your distributor account request has been received with status "Pending". The administrator will review your business license and PAN/VAT details. You will be able to log in once approved.'
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

  // Shared high-readability form styling
  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: '#ffffff',
    border: '1.5px solid #d1d5db',
    borderRadius: 'var(--radius-md)',
    color: '#111827',
    fontSize: '16px', // 16px avoids iOS zoom on mobile devices
    fontWeight: 500,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.86rem',
    fontWeight: 700,
    marginBottom: '6px',
    color: '#1f2937'
  };

  return (
    <div style={{
      maxWidth: '640px',
      margin: '24px auto 80px auto',
      padding: '0 16px'
    }}>
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-body)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.88rem',
          fontWeight: 600,
          marginBottom: '16px',
          padding: '6px 0'
        }}
      >
        <ArrowLeft size={16} /> Back to Marketplace Home
      </button>

      {/* Brand Logo & Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <img
          src="/mws_eagle_logo.jpg"
          alt="MWS EAGLE"
          style={{
            height: '76px',
            width: 'auto',
            borderRadius: '12px',
            objectFit: 'contain',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '12px'
          }}
        />
        <h1 style={{
          fontSize: 'clamp(1.5rem, 4vw, 1.95rem)',
          fontWeight: 800,
          color: 'var(--text-main)',
          margin: '0 0 6px 0',
          letterSpacing: '-0.02em'
        }}>
          {authMode === 'login' ? 'Sign In to MWS EAGLE' : 'Register for MWS EAGLE'}
        </h1>
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-body)',
          margin: 0,
          lineHeight: 1.5
        }}>
          {authMode === 'login'
            ? 'Access your customer orders or wholesale distributor inventory.'
            : 'Select your account type below to create an account.'}
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="glass-panel" style={{
        padding: 'clamp(20px, 4vw, 36px)',
        background: '#ffffff',
        border: '1px solid var(--border-medium)',
        boxShadow: 'var(--shadow-lg)'
      }}>

        {/* Master Switcher: Sign In vs Create Account */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-app-2)',
          borderRadius: 'var(--radius-lg)',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg(null);
              setStatusAlert(null);
            }}
            style={{
              padding: '11px 0',
              borderRadius: 'calc(var(--radius-lg) - 4px)',
              border: 'none',
              background: authMode === 'login' ? '#ffffff' : 'transparent',
              color: authMode === 'login' ? 'var(--primary)' : 'var(--text-body)',
              fontWeight: 800,
              fontSize: '0.94rem',
              cursor: 'pointer',
              boxShadow: authMode === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg(null);
              setStatusAlert(null);
            }}
            style={{
              padding: '11px 0',
              borderRadius: 'calc(var(--radius-lg) - 4px)',
              border: 'none',
              background: authMode === 'signup' ? '#ffffff' : 'transparent',
              color: authMode === 'signup' ? 'var(--primary)' : 'var(--text-body)',
              fontWeight: 800,
              fontSize: '0.94rem',
              cursor: 'pointer',
              boxShadow: authMode === 'signup' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Register / Sign Up
          </button>
        </div>

        {/* Status Alerts (Pending, Rejected, Suspended) */}
        {statusAlert && (
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            background: statusAlert.type === 'pending'
              ? '#fffbeb'
              : statusAlert.type === 'rejected'
                ? '#fef2f2'
                : '#fdf2f8',
            border: `1.5px solid ${statusAlert.type === 'pending'
              ? '#f59e0b'
              : statusAlert.type === 'rejected'
                ? '#ef4444'
                : '#ec4899'}`
          }}>
            {statusAlert.type === 'pending' && <Clock size={20} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />}
            {statusAlert.type === 'rejected' && <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />}
            {statusAlert.type === 'suspended' && <ShieldAlert size={20} color="#be185d" style={{ flexShrink: 0, marginTop: '2px' }} />}

            <div style={{ fontSize: '0.88rem' }}>
              <div style={{
                fontWeight: 800,
                color: statusAlert.type === 'pending'
                  ? '#92400e'
                  : statusAlert.type === 'rejected'
                    ? '#991b1b'
                    : '#831843',
                marginBottom: '4px'
              }}>
                {statusAlert.title}
              </div>
              <div style={{ color: '#374151', lineHeight: 1.55 }}>
                {statusAlert.message}
              </div>
              {statusAlert.remark && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#4b5563', padding: '6px 10px', background: 'rgba(0,0,0,0.04)', borderRadius: '6px' }}>
                  <strong>Administrator Remark:</strong> {statusAlert.remark}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div style={{
            padding: '13px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            background: '#fef2f2',
            border: '1.5px solid #f87171',
            color: '#b91c1c',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* ======================================================== */}
        {/* =============== LOGIN FORM (SIGN IN) ================== */}
        {/* ======================================================== */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            {/* Role Tabs for Login */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Select Your Portal Role:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Customer Login Tab */}
                <button
                  type="button"
                  onClick={() => setLoginRole('Customer')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: loginRole === 'Customer' ? '2px solid #059669' : '1.5px solid #e5e7eb',
                    background: loginRole === 'Customer' ? '#ecfdf5' : '#f9fafb',
                    color: loginRole === 'Customer' ? '#065f46' : '#4b5563',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: loginRole === 'Customer' ? '0 2px 8px rgba(5, 150, 105, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.94rem' }}>
                    <User size={18} color={loginRole === 'Customer' ? '#059669' : '#6b7280'} />
                    Customer
                  </div>
                  <span style={{ fontSize: '0.73rem', fontWeight: 500, color: '#047857' }}>
                    Retail & Direct Orders
                  </span>
                </button>

                {/* Distributor Login Tab */}
                <button
                  type="button"
                  onClick={() => setLoginRole('Distributor')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: loginRole === 'Distributor' ? '2px solid #0284c7' : '1.5px solid #e5e7eb',
                    background: loginRole === 'Distributor' ? '#f0f9ff' : '#f9fafb',
                    color: loginRole === 'Distributor' ? '#075985' : '#4b5563',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: loginRole === 'Distributor' ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.94rem' }}>
                    <Building2 size={18} color={loginRole === 'Distributor' ? '#0284c7' : '#6b7280'} />
                    Distributor
                  </div>
                  <span style={{ fontSize: '0.73rem', fontWeight: 500, color: '#0369a1' }}>
                    Wholesale (Requires Approval)
                  </span>
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                Email Address <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder={loginRole === 'Customer' ? 'e.g. customer@example.com' : 'e.g. distributor@mobilecare.com'}
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '42px' }}
                />
                <Mail
                  size={18}
                  color="#6b7280"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, margin: 0 }}>
                  Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
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
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '42px', paddingRight: '46px' }}
                />
                <Lock
                  size={18}
                  color="#6b7280"
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
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
                    color: '#6b7280',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: '4px'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.86rem', color: '#4b5563', cursor: 'pointer', fontWeight: 500 }}>
                Keep me signed in on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={loginRole === 'Distributor' ? 'btn btn-sky' : 'btn btn-emerald'}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)'
              }}
            >
              {loading ? 'Authenticating...' : `Sign In as ${loginRole}`}
            </button>

            {/* Switch to Register footer */}
            <div style={{
              textAlign: 'center',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.88rem',
              color: '#4b5563'
            }}>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMsg(null);
                  setStatusAlert(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                Register here
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* ============= SIGN UP / REGISTRATION FORM ============= */}
        {/* ======================================================== */}
        {authMode === 'signup' && (
          <div>
            {/* Account Type Selector for Registration */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Select Registration Type:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Customer Registration Selector */}
                <button
                  type="button"
                  onClick={() => { setSignupRole('Customer'); setErrorMsg(null); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: signupRole === 'Customer' ? '2px solid #059669' : '1.5px solid #e5e7eb',
                    background: signupRole === 'Customer' ? '#ecfdf5' : '#f9fafb',
                    color: signupRole === 'Customer' ? '#065f46' : '#4b5563',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: signupRole === 'Customer' ? '0 2px 8px rgba(5, 150, 105, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.94rem' }}>
                    <User size={18} color={signupRole === 'Customer' ? '#059669' : '#6b7280'} />
                    Customer Sign Up
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#059669' }}>
                    Instant Active Access
                  </span>
                </button>

                {/* Distributor Registration Selector */}
                <button
                  type="button"
                  onClick={() => { setSignupRole('Distributor'); setErrorMsg(null); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: signupRole === 'Distributor' ? '2px solid #0284c7' : '1.5px solid #e5e7eb',
                    background: signupRole === 'Distributor' ? '#f0f9ff' : '#f9fafb',
                    color: signupRole === 'Distributor' ? '#075985' : '#4b5563',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: signupRole === 'Distributor' ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.94rem' }}>
                    <Building2 size={18} color={signupRole === 'Distributor' ? '#0284c7' : '#6b7280'} />
                    Distributor Request
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0284c7' }}>
                    Requires Admin Review
                  </span>
                </button>
              </div>
            </div>

            {/* Notice for Distributor Applicants */}
            {signupRole === 'Distributor' && (
              <div style={{
                background: '#eff6ff',
                border: '1.5px solid #93c5fd',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: '20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <Clock size={20} color="#1d4ed8" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.86rem' }}>
                  <strong style={{ color: '#1e40af', display: 'block', marginBottom: '2px' }}>
                    Administrator Approval Required
                  </strong>
                  <div style={{ color: '#1e3a8a', lineHeight: 1.5 }}>
                    Distributor registration requests are placed in <strong>Pending</strong> status until verified by our administration team. Once approved, you can log in to access exclusive wholesale pricing.
                  </div>
                </div>
              </div>
            )}

            {/* --- CUSTOMER SIGN UP FORM --- */}
            {signupRole === 'Customer' ? (
              <form onSubmit={handleCustomerSignup}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Anderson"
                    value={custForm.fullName}
                    onChange={e => setCustForm({ ...custForm, fullName: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px',
                  marginBottom: '14px'
                }}>
                  <div>
                    <label style={labelStyle}>
                      Email Address <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@example.com"
                      value={custForm.email}
                      onChange={e => setCustForm({ ...custForm, email: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Mobile Phone Number <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+1-555-0199"
                      value={custForm.phoneNumber}
                      onChange={e => setCustForm({ ...custForm, phoneNumber: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px',
                  marginBottom: '22px'
                }}>
                  <div>
                    <label style={labelStyle}>
                      Password <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={custForm.password}
                      onChange={e => setCustForm({ ...custForm, password: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Confirm Password <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={custForm.confirmPassword}
                      onChange={e => setCustForm({ ...custForm, confirmPassword: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-emerald"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {loading ? 'Creating Customer Account...' : 'Complete Customer Registration'}
                </button>
              </form>
            ) : (
              /* --- DISTRIBUTOR APPLICATION FORM --- */
              <form onSubmit={handleDistributorSignup}>
                {/* SECTION 1: BUSINESS VERIFICATION */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#0369a1',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '12px',
                  paddingBottom: '6px',
                  borderBottom: '2px solid #e0f2fe'
                }}>
                  <Briefcase size={16} />
                  1. Business Details
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>
                    Registered Business / Store Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Mobile Spares Hub Ltd"
                    value={distForm.businessName}
                    onChange={e => setDistForm({ ...distForm, businessName: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px',
                  marginBottom: '14px'
                }}>
                  <div>
                    <label style={labelStyle}>
                      PAN / VAT Number <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VAT-984210492"
                      value={distForm.panVatNumber}
                      onChange={e => setDistForm({ ...distForm, panVatNumber: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Contact Person Name <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Robert Miller (Director)"
                      value={distForm.contactPerson}
                      onChange={e => setDistForm({ ...distForm, contactPerson: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle}>
                    Full Business / Warehouse Address <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Street address, city, region, postal code"
                    value={distForm.businessAddress}
                    onChange={e => setDistForm({ ...distForm, businessAddress: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                {/* SECTION 2: LOGIN CREDENTIALS */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#0369a1',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '12px',
                  paddingBottom: '6px',
                  borderBottom: '2px solid #e0f2fe'
                }}>
                  <User size={16} />
                  2. Login Account Credentials
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>
                    Account Holder Full Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your personal full name"
                    value={distForm.fullName}
                    onChange={e => setDistForm({ ...distForm, fullName: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px',
                  marginBottom: '14px'
                }}>
                  <div>
                    <label style={labelStyle}>
                      Login Email Address <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="login@company.com"
                      value={distForm.email}
                      onChange={e => setDistForm({ ...distForm, email: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Mobile Phone Number <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+1-555-0211"
                      value={distForm.phoneNumber}
                      onChange={e => setDistForm({ ...distForm, phoneNumber: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px',
                  marginBottom: '24px'
                }}>
                  <div>
                    <label style={labelStyle}>
                      Account Password <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={distForm.password}
                      onChange={e => setDistForm({ ...distForm, password: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Confirm Password <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={distForm.confirmPassword}
                      onChange={e => setDistForm({ ...distForm, confirmPassword: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-sky"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  {loading ? 'Submitting Application...' : 'Submit Distributor Registration Request'}
                </button>
              </form>
            )}

            {/* Switch to Login footer */}
            <div style={{
              textAlign: 'center',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.88rem',
              color: '#4b5563'
            }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg(null);
                  setStatusAlert(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                Sign in here
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(17, 24, 39, 0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 200
        }}>
          <div className="glass-panel" style={{
            maxWidth: '400px',
            width: '100%',
            padding: '28px',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)'
          }}>
            <h3 style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-main)'
            }}>
              <Lock size={18} color="var(--primary)" /> Reset Password
            </h3>
            <p style={{
              color: '#4b5563',
              fontSize: '0.88rem',
              lineHeight: 1.55,
              marginBottom: '16px'
            }}>
              Security policy requires administrator authorization for password resets. Please contact our system support desk directly.
            </p>
            <div style={{
              background: '#f8fafc',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              color: '#334155',
              marginBottom: '20px',
              border: '1px solid #e2e8f0',
              lineHeight: 1.6
            }}>
              <div>Admin Contact: <strong style={{ color: '#0f172a' }}>admin@mwseagle.com</strong></div>
              <div>Hotline: <strong style={{ color: '#0f172a' }}>+1-800-MWS-EAGLE</strong></div>
            </div>
            <button
              onClick={() => setForgotModal(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
