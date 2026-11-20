import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Building2,
  Store,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Phone,
  FileText,
  MapPin,
  Briefcase
} from 'lucide-react';

// List of 28 States and 8 Union Territories of India
const INDIAN_STATES_AND_UTS = [
  { name: 'Andhra Pradesh', type: 'STATE' },
  { name: 'Arunachal Pradesh', type: 'STATE' },
  { name: 'Assam', type: 'STATE' },
  { name: 'Bihar', type: 'STATE' },
  { name: 'Chhattisgarh', type: 'STATE' },
  { name: 'Goa', type: 'STATE' },
  { name: 'Gujarat', type: 'STATE' },
  { name: 'Haryana', type: 'STATE' },
  { name: 'Himachal Pradesh', type: 'STATE' },
  { name: 'Jharkhand', type: 'STATE' },
  { name: 'Karnataka', type: 'STATE' },
  { name: 'Kerala', type: 'STATE' },
  { name: 'Madhya Pradesh', type: 'STATE' },
  { name: 'Maharashtra', type: 'STATE' },
  { name: 'Manipur', type: 'STATE' },
  { name: 'Meghalaya', type: 'STATE' },
  { name: 'Mizoram', type: 'STATE' },
  { name: 'Nagaland', type: 'STATE' },
  { name: 'Odisha', type: 'STATE' },
  { name: 'Punjab', type: 'STATE' },
  { name: 'Rajasthan', type: 'STATE' },
  { name: 'Sikkim', type: 'STATE' },
  { name: 'Tamil Nadu', type: 'STATE' },
  { name: 'Telangana', type: 'STATE' },
  { name: 'Tripura', type: 'STATE' },
  { name: 'Uttar Pradesh', type: 'STATE' },
  { name: 'Uttarakhand', type: 'STATE' },
  { name: 'West Bengal', type: 'STATE' },
  { name: 'Andaman and Nicobar Islands', type: 'UT' },
  { name: 'Chandigarh', type: 'UT' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UT' },
  { name: 'Delhi', type: 'UT' },
  { name: 'Jammu and Kashmir', type: 'UT' },
  { name: 'Ladakh', type: 'UT' },
  { name: 'Lakshadweep', type: 'UT' },
  { name: 'Puducherry', type: 'UT' }
];

const locInputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: '#ffffff',
  border: '1.5px solid #d1d5db',
  borderRadius: '8px',
  color: '#111827',
  fontSize: '16px',
  fontWeight: 500,
  outline: 'none',
  boxSizing: 'border-box'
};

const locLabelStyle = {
  display: 'block',
  fontSize: '0.86rem',
  fontWeight: 700,
  marginBottom: '6px',
  color: '#1f2937'
};

// Cascading Indian Location Picker Component
const IndianLocationPicker = ({ form, setForm, isBusiness = false }) => {
  const [states, setStates] = useState(INDIAN_STATES_AND_UTS);
  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [customArea, setCustomArea] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (api.distribution?.getStates) {
      api.distribution.getStates()
        .then(res => {
          if (mounted && res?.data?.length > 0) {
            setStates(res.data);
          }
        })
        .catch(() => {});
    }
    return () => { mounted = false; };
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    if (!form.state) {
      setDistricts([]);
      setAreas([]);
      return;
    }
    const selectedState = states.find(s => s.name?.toLowerCase() === form.state?.toLowerCase());
    const stateId = selectedState?.id || form.state;

    setLoadingDistricts(true);
    if (api.distribution?.getDistricts) {
      api.distribution.getDistricts(stateId)
        .then(res => {
          if (res?.data && res.data.length > 0) {
            setDistricts(res.data);
          } else {
            setDistricts([]);
          }
        })
        .catch(() => setDistricts([]))
        .finally(() => setLoadingDistricts(false));
    } else {
      setLoadingDistricts(false);
    }
  }, [form.state, states]);

  // Fetch areas when district changes
  useEffect(() => {
    if (!form.district) {
      setAreas([]);
      return;
    }
    const selectedDist = districts.find(d => d.name?.toLowerCase() === form.district?.toLowerCase());
    const distId = selectedDist?.id || form.district;

    setLoadingAreas(true);
    if (api.distribution?.getAreas) {
      api.distribution.getAreas(distId)
        .then(res => {
          if (res?.data && res.data.length > 0) {
            setAreas(res.data);
          } else {
            setAreas([]);
          }
        })
        .catch(() => setAreas([]))
        .finally(() => setLoadingAreas(false));
    } else {
      setLoadingAreas(false);
    }
  }, [form.district, districts]);

  return (
    <div style={{
      background: '#f8fafc',
      border: '1.5px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '18px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#0f766e',
        fontWeight: 800,
        fontSize: '0.84rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '14px',
        paddingBottom: '8px',
        borderBottom: '1.5px solid #ccfbf1'
      }}>
        <MapPin size={16} />
        India Geographical Location & Address
      </div>

      {/* Country (Fixed India) */}
      <div style={{ marginBottom: '14px' }}>
        <label style={locLabelStyle}>Country</label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: '#f1f5f9',
          border: '1.5px solid #cbd5e1',
          borderRadius: '8px',
          fontWeight: 700,
          color: '#1e293b',
          fontSize: '0.92rem'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🇮🇳</span> India (Official Territory)
        </div>
      </div>

      {/* State & District row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        marginBottom: '14px'
      }}>
        {/* State Dropdown */}
        <div>
          <label style={locLabelStyle}>
            State / Union Territory <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            required
            value={form.state || ''}
            onChange={e => {
              const val = e.target.value;
              setForm(prev => ({
                ...prev,
                state: val,
                district: '',
                city: '',
                locality: ''
              }));
              setCustomArea(false);
            }}
            style={locInputStyle}
          >
            <option value="">-- Select State / UT --</option>
            <optgroup label="States (28)">
              {states.filter(s => s.type !== 'UT').map(s => (
                <option key={s.id || s.name} value={s.name}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="Union Territories (8)">
              {states.filter(s => s.type === 'UT').map(s => (
                <option key={s.id || s.name} value={s.name}>{s.name} (UT)</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* District Dropdown */}
        <div>
          <label style={locLabelStyle}>
            District <span style={{ color: '#dc2626' }}>*</span>
            {loadingDistricts && <span style={{ fontSize: '0.72rem', color: '#0284c7', marginLeft: '6px' }}>(Loading...)</span>}
          </label>
          {districts.length > 0 ? (
            <select
              required
              disabled={!form.state || loadingDistricts}
              value={form.district || ''}
              onChange={e => {
                const val = e.target.value;
                setForm(prev => ({
                  ...prev,
                  district: val,
                  city: '',
                  locality: ''
                }));
                setCustomArea(false);
              }}
              style={locInputStyle}
            >
              <option value="">-- Select District --</option>
              {districts.map(d => (
                <option key={d.id || d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              required
              disabled={!form.state}
              placeholder={form.state ? "Enter District Name" : "Select State first"}
              value={form.district || ''}
              onChange={e => setForm(prev => ({ ...prev, district: e.target.value }))}
              style={locInputStyle}
            />
          )}
        </div>
      </div>

      {/* Area / City & Locality / Ward row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        marginBottom: '14px'
      }}>
        {/* Area / City / Municipality */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ ...locLabelStyle, margin: 0 }}>
              Area / City / Municipality <span style={{ color: '#dc2626' }}>*</span>
            </label>
            {areas.length > 0 && (
              <button
                type="button"
                onClick={() => setCustomArea(!customArea)}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {customArea ? 'Choose from list' : '+ Enter custom'}
              </button>
            )}
          </div>
          {areas.length > 0 && !customArea ? (
            <select
              required
              disabled={!form.district || loadingAreas}
              value={form.city || ''}
              onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
              style={locInputStyle}
            >
              <option value="">-- Select Area / City --</option>
              {areas.map(a => (
                <option key={a.id || a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              required
              placeholder="e.g. Andheri East / Central Market"
              value={form.city || ''}
              onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
              style={locInputStyle}
            />
          )}
        </div>

        {/* Town / Village / Locality / Ward */}
        <div>
          <label style={locLabelStyle}>
            Town / Village / Locality / Ward
          </label>
          <input
            type="text"
            placeholder="e.g. Sector 4, MG Road, Ward 12"
            value={form.locality || ''}
            onChange={e => setForm(prev => ({ ...prev, locality: e.target.value }))}
            style={locInputStyle}
          />
        </div>
      </div>

      {/* PIN Code & Address */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px'
      }}>
        <div>
          <label style={locLabelStyle}>
            PIN Code (Postal Code) <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            required
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="6-digit PIN (e.g. 110001)"
            value={form.pincode || ''}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setForm(prev => ({ ...prev, pincode: val }));
            }}
            style={locInputStyle}
          />
        </div>

        <div>
          <label style={locLabelStyle}>
            {isBusiness ? 'Complete Business / Shop Address' : 'Complete Delivery Address'} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Shop/Building No., Floor, Street Name"
            value={form.address || ''}
            onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
            style={locInputStyle}
          />
        </div>
      </div>
    </div>
  );
};

export const AuthPage = ({ prefillData }) => {
  const { login, loginWithGoogle, switchAccount, registerCustomer, registerDistributor, registerRetailer, navigate } = useAuth();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [loginRole, setLoginRole] = useState('Customer'); // 'Customer' | 'Distributor' | 'Retailer'
  const [signupRole, setSignupRole] = useState('Customer'); // 'Customer' | 'Distributor' | 'Retailer'

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Remembered Account from previous persistent session
  const [rememberedAccount, setRememberedAccount] = useState(() => {
    try {
      const raw = localStorage.getItem('mws_remembered_account');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  // Automatically prefill recognized account on initial mount
  useEffect(() => {
    if (rememberedAccount && !loginEmail) {
      if (rememberedAccount.email) setLoginEmail(rememberedAccount.email);
      if (rememberedAccount.userType && (rememberedAccount.userType === 'Customer' || rememberedAccount.userType === 'Distributor' || rememberedAccount.userType === 'Retailer' || rememberedAccount.userType === 'Admin')) {
        setLoginRole(rememberedAccount.userType);
      }
    }
  }, [rememberedAccount]);

  // Google OAuth Credential Handler
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    setErrorMsg(null);
    setStatusAlert(null);
    try {
      await loginWithGoogle({
        credential: response.credential,
        requestedRole: loginRole,
        rememberMe
      });
    } catch (err) {
      const data = err.data || {};
      if (data.accountStatus === 'Pending') {
        setStatusAlert({
          type: 'pending',
          title: `${loginRole} Awaiting Admin Approval`,
          message: `Your Google-linked ${loginRole.toLowerCase()} account is awaiting administrator review.`
        });
      } else if (data.accountStatus === 'Suspended') {
        setStatusAlert({
          type: 'suspended',
          title: 'Account Suspended',
          message: 'Your account has been suspended by the administrator.'
        });
      } else {
        setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services (GSI) & Google One-Tap
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1029384756-mwseagle.apps.googleusercontent.com';
    let isMounted = true;

    const setupGoogleAuth = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: true, // Automatic recognition if Google session is active on browser
            cancel_on_tap_outside: false
          });

          const btnContainer = document.getElementById('google-signin-btn-container');
          if (btnContainer && isMounted) {
            btnContainer.innerHTML = '';
            window.google.accounts.id.renderButton(btnContainer, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: 'continue_with',
              shape: 'rectangular',
              width: 280,
              logo_alignment: 'left'
            });
          }

          // Trigger Google One-Tap account prompt if supported
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
              // Gracefully handle browser restrictions or third-party cookie blocking
            }
          });
        } catch (e) {
          console.warn('Google GSI initialization:', e.message);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleAuth();
    } else {
      const existingScript = document.getElementById('google-gsi-client');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) setupGoogleAuth();
        };
        document.body.appendChild(script);
      }
    }

    return () => { isMounted = false; };
  }, [authMode, loginRole]);

  // Customer Form
  const [custForm, setCustForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    country: 'India',
    state: '',
    district: '',
    city: '',
    locality: '',
    pincode: '',
    address: ''
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
    businessEmail: '',
    country: 'India',
    state: '',
    district: '',
    city: '',
    locality: '',
    pincode: '',
    address: ''
  });

  // Retailer Form
  const [retailerForm, setRetailerForm] = useState({
    ownerName: '',
    shopName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    country: 'India',
    state: '',
    district: '',
    city: '',
    locality: '',
    pincode: '',
    address: ''
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
        else if (roleParam === 'Retailer') setSignupRole('Retailer');
        else if (roleParam === 'Customer') setSignupRole('Customer');
      } else if (modeParam === 'login' || modeParam === 'admin') {
        setAuthMode('login');
        if (roleParam === 'Distributor') setLoginRole('Distributor');
        else if (roleParam === 'Retailer') setLoginRole('Retailer');
        else if (roleParam === 'Admin' || modeParam === 'admin') setLoginRole('Admin');
      }
    } catch (e) {}
  }, [window.location.href]);

  // Handle prefill demo data
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

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusAlert(null);
    setLoading(true);

    try {
      await login(loginEmail, loginPassword, loginRole, rememberMe);
    } catch (err) {
      const data = err.data || {};
      const status = data.accountStatus;
      const roleTitle = loginRole === 'Admin' ? 'Admin' : loginRole;

      if (status === 'Pending') {
        setStatusAlert({
          type: 'pending',
          title: `${roleTitle} Account Awaiting Admin Approval`,
          message: `Your ${roleTitle.toLowerCase()} account registration has been submitted and is awaiting administrator verification. You cannot log in until your account is approved.`
        });
      } else if (status === 'Rejected') {
        setStatusAlert({
          type: 'rejected',
          title: `${roleTitle} Registration Rejected`,
          message: `Your ${roleTitle.toLowerCase()} registration was reviewed and rejected by the administrator.`,
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
        password: custForm.password,
        country: 'India',
        state: custForm.state || '',
        district: custForm.district || '',
        city: custForm.city || '',
        locality: custForm.locality || '',
        pincode: custForm.pincode || '',
        address: custForm.address || ''
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
        fullName: distForm.fullName || distForm.businessName,
        email: distForm.email,
        phoneNumber: distForm.phoneNumber,
        password: distForm.password,
        businessName: distForm.businessName,
        businessAddress: distForm.businessAddress || distForm.address,
        panVatNumber: distForm.panVatNumber || '',
        contactPerson: distForm.contactPerson || '',
        businessPhone: distForm.businessPhone || distForm.phoneNumber,
        businessEmail: distForm.businessEmail || distForm.email,
        country: 'India',
        state: distForm.state || '',
        district: distForm.district || '',
        city: distForm.city || '',
        locality: distForm.locality || '',
        pincode: distForm.pincode || '',
        address: distForm.address || distForm.businessAddress
      });

      setStatusAlert({
        type: 'pending',
        title: 'Application Submitted Successfully!',
        message: 'Your distributor account request has been received with status "Pending". The administrator will review your application. You will be able to log in once approved.'
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

  // Retailer signup handler
  const handleRetailerSignup = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (retailerForm.password !== retailerForm.confirmPassword) {
      return setErrorMsg('Passwords do not match. Please re-type your password.');
    }
    if (retailerForm.password.length < 6) {
      return setErrorMsg('Password must be at least 6 characters long.');
    }
    if (!retailerForm.state || !retailerForm.district) {
      return setErrorMsg('Please select your state and district.');
    }

    setLoading(true);
    try {
      await registerRetailer({
        ownerName: retailerForm.ownerName,
        shopName: retailerForm.shopName,
        email: retailerForm.email,
        phoneNumber: retailerForm.phoneNumber,
        password: retailerForm.password,
        country: 'India',
        state: retailerForm.state,
        district: retailerForm.district,
        city: retailerForm.city || retailerForm.locality,
        locality: retailerForm.locality,
        pincode: retailerForm.pincode,
        address: retailerForm.address
      });

      setStatusAlert({
        type: 'pending',
        title: 'Retailer Application Submitted Successfully!',
        message: 'Your retailer registration request has been submitted with status "Pending". The administrator will review and verify your business credentials. You will be able to log in once approved.'
      });
      setAuthMode('login');
      setLoginRole('Retailer');
      setLoginEmail(retailerForm.email);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit retailer registration.');
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
          src="/mws_eagle_logo.jpg?v=3"
          alt="MWS Eagle Official Logo"
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
          <div>
            {/* Automatic Account Recognition / Remembered Account Card */}
            {rememberedAccount && (
              <div style={{
                marginBottom: '20px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.06) 0%, rgba(3, 105, 161, 0.1) 100%)',
                border: '1.5px solid rgba(2, 132, 199, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#0284c7',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem'
                  }}>
                    {rememberedAccount.fullName ? rememberedAccount.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      {rememberedAccount.fullName || 'Welcome Back'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {rememberedAccount.email} • <span style={{ color: '#0284c7', fontWeight: 700 }}>{rememberedAccount.userType}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail(rememberedAccount.email);
                      if (rememberedAccount.userType) setLoginRole(rememberedAccount.userType);
                    }}
                    className="btn btn-sky"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px' }}
                  >
                    Continue as {rememberedAccount.fullName?.split(' ')[0] || 'User'}
                  </button>
                  <button
                    type="button"
                    onClick={switchAccount}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '6px 8px'
                    }}
                  >
                    Switch Account
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
            {/* Role Tabs for Login */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Select Your Portal Role:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {/* Customer Login Tab */}
                <button
                  type="button"
                  onClick={() => setLoginRole('Customer')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 6px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.88rem' }}>
                    <User size={16} color={loginRole === 'Customer' ? '#059669' : '#6b7280'} />
                    Customer
                  </div>
                  <span style={{ fontSize: '0.70rem', fontWeight: 600, color: '#047857' }}>
                    Retail Orders
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
                    padding: '10px 6px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.88rem' }}>
                    <Building2 size={16} color={loginRole === 'Distributor' ? '#0284c7' : '#6b7280'} />
                    Distributor
                  </div>
                  <span style={{ fontSize: '0.70rem', fontWeight: 600, color: '#0369a1' }}>
                    Wholesale B2B
                  </span>
                </button>

                {/* Retailer Login Tab */}
                <button
                  type="button"
                  onClick={() => setLoginRole('Retailer')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '10px 6px',
                    borderRadius: 'var(--radius-md)',
                    border: loginRole === 'Retailer' ? '2px solid #7c3aed' : '1.5px solid #e5e7eb',
                    background: loginRole === 'Retailer' ? '#f5f3ff' : '#f9fafb',
                    color: loginRole === 'Retailer' ? '#6d28d9' : '#4b5563',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: loginRole === 'Retailer' ? '0 2px 8px rgba(124, 58, 237, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.88rem' }}>
                    <Store size={16} color={loginRole === 'Retailer' ? '#7c3aed' : '#6b7280'} />
                    Retailer
                  </div>
                  <span style={{ fontSize: '0.70rem', fontWeight: 600, color: '#7c3aed' }}>
                    Shop Portal
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
                  placeholder={
                    loginRole === 'Customer'
                      ? 'e.g. customer@example.com'
                      : loginRole === 'Distributor'
                        ? 'e.g. distributor@mobilecare.com'
                        : 'e.g. admin@mwseagle.com'
                  }
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
              className={loginRole === 'Distributor' ? 'btn btn-sky' : loginRole === 'Retailer' ? 'btn btn-primary' : loginRole === 'Admin' ? 'btn btn-primary' : 'btn btn-emerald'}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                background: loginRole === 'Retailer' ? '#7c3aed' : undefined,
                borderColor: loginRole === 'Retailer' ? '#6d28d9' : undefined
              }}
            >
              {loading ? 'Authenticating...' : loginRole === 'Admin' ? 'Sign In to Admin Panel' : `Sign In as ${loginRole}`}
            </button>

            {/* Google OAuth & Automatic Google Account Recognition */}
            <div style={{ marginTop: '18px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '16px 0',
                color: '#94a3b8',
                fontSize: '0.76rem',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}>
                <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span>OR SIGN IN WITH GOOGLE</span>
                <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>

              {/* Official Google GSI Render Target */}
              <div id="google-signin-btn-container" style={{ display: 'flex', justifyContent: 'center', minHeight: '44px', width: '100%' }}></div>
            </div>

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
        </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {/* Customer Registration Selector */}
                <button
                  type="button"
                  onClick={() => { setSignupRole('Customer'); setErrorMsg(null); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '12px 8px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
                    <User size={16} color={signupRole === 'Customer' ? '#059669' : '#6b7280'} />
                    Customer
                  </div>
                  <span style={{ fontSize: '0.70rem', fontWeight: 600, color: '#059669' }}>
                    Instant Access
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
                    padding: '12px 8px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
                    <Building2 size={16} color={signupRole === 'Distributor' ? '#0284c7' : '#6b7280'} />
                    Distributor
                  </div>
                  <span style={{ fontSize: '0.70rem', fontWeight: 600, color: '#0284c7' }}>
                    Admin Review
                  </span>
                </button>

                {/* Retailer Registration Selector */}
                <button
                  type="button"
                  onClick={() => { setSignupRole('Retailer'); setErrorMsg(null); }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: signupRole === 'Retailer' ? '2px solid #7c3aed' : '1.5px solid #e5e7eb',
                    background: signupRole === 'Retailer' ? '#f5f3ff' : '#f9fafb',
                    color: signupRole === 'Retailer' ? '#6d28d9' : '#4b5563',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: signupRole === 'Retailer' ? '0 2px 8px rgba(124, 58, 237, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
                    <Store size={16} color={signupRole === 'Retailer' ? '#7c3aed' : '#6b7280'} />
                    Retailer
                  </div>
                  <span style={{ fontSize: '0.70rem', fontWeight: 600, color: '#7c3aed' }}>
                    Admin Review
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
                    Distributor Approval Required
                  </strong>
                  <div style={{ color: '#1e3a8a', lineHeight: 1.5 }}>
                    Distributor registration requests are placed in <strong>Pending</strong> status until verified by our administration team. Once approved, you can log in to access exclusive wholesale pricing.
                  </div>
                </div>
              </div>
            )}

            {/* Notice for Retailer Applicants */}
            {signupRole === 'Retailer' && (
              <div style={{
                background: '#f5f3ff',
                border: '1.5px solid #c4b5fd',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: '20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <Clock size={20} color="#7c3aed" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.86rem' }}>
                  <strong style={{ color: '#5b21b6', display: 'block', marginBottom: '2px' }}>
                    Retailer Shop Verification Required
                  </strong>
                  <div style={{ color: '#4c1d95', lineHeight: 1.5 }}>
                    Retail store registrations are submitted in <strong>Pending</strong> status. Our administrator will verify your shop location and business details before activating your account.
                  </div>
                </div>
              </div>
            )}

            {/* --- CUSTOMER SIGN UP FORM --- */}
            {signupRole === 'Customer' && (
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
                      placeholder="+91 98765 43210"
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
                  marginBottom: '18px'
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

                {/* Indian Geographical Location & Address */}
                <IndianLocationPicker form={custForm} setForm={setCustForm} isBusiness={false} />

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
            )}

            {/* --- DISTRIBUTOR APPLICATION FORM --- */}
            {signupRole === 'Distributor' && (
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
                    Registered Business / Enterprise Name <span style={{ color: '#dc2626' }}>*</span>
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
                      Owner / Contact Person Name <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={distForm.contactPerson || distForm.fullName}
                      onChange={e => setDistForm({ ...distForm, contactPerson: e.target.value, fullName: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      PAN / GSTIN / VAT Registration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5 / ABCDE1234F"
                      value={distForm.panVatNumber}
                      onChange={e => setDistForm({ ...distForm, panVatNumber: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
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
                  marginTop: '18px',
                  paddingBottom: '6px',
                  borderBottom: '2px solid #e0f2fe'
                }}>
                  <User size={16} />
                  2. Login Account Credentials
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
                      placeholder="+91 98765 43210"
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
                  marginBottom: '18px'
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

                {/* Indian Geographical Location & Address */}
                <IndianLocationPicker form={distForm} setForm={setDistForm} isBusiness={true} />

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

            {/* --- RETAILER APPLICATION FORM --- */}
            {signupRole === 'Retailer' && (
              <form onSubmit={handleRetailerSignup}>
                {/* SECTION 1: SHOP & BUSINESS INFORMATION */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#6d28d9',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '12px',
                  paddingBottom: '6px',
                  borderBottom: '2px solid #ede9fe'
                }}>
                  <Store size={16} />
                  1. Retailer Shop & Business Details
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px',
                  marginBottom: '14px'
                }}>
                  <div>
                    <label style={labelStyle}>
                      Owner / Prop. Full Name <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Patel"
                      value={retailerForm.ownerName}
                      onChange={e => setRetailerForm({ ...retailerForm, ownerName: e.target.value })}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Retail Shop / Store Name <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Patel Telecom & Mobile Care"
                      value={retailerForm.shopName}
                      onChange={e => setRetailerForm({ ...retailerForm, shopName: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* SECTION 2: LOGIN CREDENTIALS */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#6d28d9',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '12px',
                  marginTop: '18px',
                  paddingBottom: '6px',
                  borderBottom: '2px solid #ede9fe'
                }}>
                  <User size={16} />
                  2. Retailer Login Account Credentials
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
                      placeholder="e.g. shop@pateltelecom.com"
                      value={retailerForm.email}
                      onChange={e => setRetailerForm({ ...retailerForm, email: e.target.value })}
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
                      placeholder="+91 98765 43210"
                      value={retailerForm.phoneNumber}
                      onChange={e => setRetailerForm({ ...retailerForm, phoneNumber: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '14px',
                  marginBottom: '18px'
                }}>
                  <div>
                    <label style={labelStyle}>
                      Account Password <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={retailerForm.password}
                      onChange={e => setRetailerForm({ ...retailerForm, password: e.target.value })}
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
                      value={retailerForm.confirmPassword}
                      onChange={e => setRetailerForm({ ...retailerForm, confirmPassword: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Indian Geographical Location & Address */}
                <IndianLocationPicker form={retailerForm} setForm={setRetailerForm} isBusiness={true} />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    background: '#7c3aed',
                    borderColor: '#6d28d9'
                  }}
                >
                  {loading ? 'Submitting Application...' : 'Submit Retailer Registration Request'}
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
