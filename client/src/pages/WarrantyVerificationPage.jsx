import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { WarrantyVerificationCard } from '../components/warranty/WarrantyVerificationCard';
import { CustomerWarrantyScanner } from '../components/warranty/CustomerWarrantyScanner';
import {
  Camera,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export const WarrantyVerificationPage = ({ urlToken = null }) => {
  const { user, navigate } = useAuth();

  // Extract token from prop or window location pathname e.g. /verify-warranty/:token
  const getTokenFromUrl = () => {
    if (urlToken) return urlToken;
    const path = window.location.pathname;
    if (path.includes('/verify-warranty/')) {
      const parts = path.split('/verify-warranty/');
      const raw = parts[1] || '';
      return raw.split('?')[0].split('#')[0].trim();
    }
    return '';
  };

  const [currentToken, setCurrentToken] = useState(getTokenFromUrl());
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(!!getTokenFromUrl());
  const [activationSuccessMsg, setActivationSuccessMsg] = useState('');
  const [showScanner, setShowScanner] = useState(!getTokenFromUrl());

  const fetchVerification = async (tokenToVerify) => {
    if (!tokenToVerify) return;
    setLoading(true);
    setActivationSuccessMsg('');
    try {
      const res = await api.warranties.verify(tokenToVerify);
      setVerificationData(res);
      if (res?.justActivated) {
        setActivationSuccessMsg('Product Verified ✓ Warranty/Guarantee Started ✓');
      }
      setShowScanner(false);
    } catch (err) {
      if (err.data?.expiredQR || err.status === 410) {
        setVerificationData({
          expiredQR: true,
          message: err.data?.message || 'QR Expired. This product warranty QR is no longer valid.',
          warranty: err.data?.warranty || null
        });
      } else {
        setVerificationData({
          invalid: true,
          message: err.data?.message || err.message || 'Invalid product warranty QR code.'
        });
      }
      setShowScanner(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getTokenFromUrl();
    if (token) {
      setCurrentToken(token);
      fetchVerification(token);
    }
  }, []);

  const handleScanSuccess = (detectedToken) => {
    if (!detectedToken) return;
    setCurrentToken(detectedToken);
    // Sync browser URL cleanly without page reload
    window.history.pushState({}, '', `/verify-warranty/${detectedToken}`);
    fetchVerification(detectedToken);
  };

  const handleRequireLogin = () => {
    // Redirect to login with return path
    navigate(`/login?returnUrl=/verify-warranty/${currentToken}`);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      background: 'var(--bg-app, #f8fafc)',
      padding: '30px 16px 60px 16px'
    }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Top Back / Home Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => {
              if (user?.userType === 'Customer') navigate('/portal/customer');
              else navigate('/');
            }}
            style={{
              background: '#ffffff',
              border: '1.5px solid var(--border-medium)',
              padding: '7px 14px',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={15} />
            Back to Portal
          </button>

          {!showScanner && (
            <button
              type="button"
              onClick={() => {
                setShowScanner(true);
                setVerificationData(null);
                setActivationSuccessMsg('');
              }}
              style={{
                background: '#f0f9ff',
                border: '1.5px solid #bae6fd',
                padding: '7px 14px',
                borderRadius: '8px',
                color: '#0284c7',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Camera size={15} />
              Scan Another QR
            </button>
          )}
        </div>

        {/* Celebratory Alert Banner on Automatic Activation */}
        {activationSuccessMsg && (
          <div style={{
            background: '#dcfce7',
            border: '1.5px solid #86efac',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#15803d',
            fontWeight: 800,
            fontSize: '0.92rem',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
          }}>
            <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0 }} />
            <div>{activationSuccessMsg}</div>
          </div>
        )}

        {/* Scanner View or Verification Result Card */}
        {showScanner ? (
          <CustomerWarrantyScanner onScanSuccess={handleScanSuccess} />
        ) : (
          <WarrantyVerificationCard
            verificationData={verificationData}
            loading={loading}
            isAuthenticated={!!user}
            onRequireLogin={handleRequireLogin}
          />
        )}

      </div>
    </div>
  );
};

export default WarrantyVerificationPage;
