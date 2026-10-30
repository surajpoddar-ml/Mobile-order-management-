import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CustomerWarrantyScanner } from './CustomerWarrantyScanner';
import { WarrantyVerificationCard } from './WarrantyVerificationCard';
import {
  ShieldCheck,
  Camera,
  CheckCircle2,
  Package,
  Calendar,
  Clock,
  RefreshCw,
  QrCode,
  Shield,
  Layers,
  Award
} from 'lucide-react';

export const CustomerWarrantySection = () => {
  const [activeSubTab, setActiveSubTab] = useState('scan'); // 'scan' | 'my-warranties'
  const [currentScannedToken, setCurrentScannedToken] = useState('');
  const [verificationData, setVerificationData] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activationMsg, setActivationMsg] = useState('');

  // Customer's registered warranties
  const [myWarranties, setMyWarranties] = useState([]);
  const [loadingMyWarranties, setLoadingMyWarranties] = useState(false);

  const fetchMyWarranties = async () => {
    setLoadingMyWarranties(true);
    try {
      const res = await api.warranties.getMyWarranties();
      if (res.success && Array.isArray(res.warranties)) {
        setMyWarranties(res.warranties);
      }
    } catch (err) {
      console.warn('Failed to load my warranties:', err.message);
    } finally {
      setLoadingMyWarranties(false);
    }
  };

  useEffect(() => {
    fetchMyWarranties();
  }, []);

  const handleScanSuccess = async (token) => {
    if (!token) return;
    setCurrentScannedToken(token);
    setVerifying(true);
    setActivationMsg('');
    try {
      const res = await api.warranties.verify(token);
      setVerificationData(res);
    } catch (err) {
      setVerificationData({
        invalid: true,
        message: err.data?.message || err.message || 'Invalid product warranty QR code.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleActivate = async () => {
    if (!currentScannedToken) return;
    setActivating(true);
    try {
      const res = await api.warranties.activate(currentScannedToken);
      if (res.success) {
        setActivationMsg(res.message || '✓ Warranty Activated Successfully! Your warranty period has started from today.');
        // Re-verify to display updated active state
        const updated = await api.warranties.verify(currentScannedToken);
        setVerificationData(updated);
        // Refresh customer list
        fetchMyWarranties();
      }
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to activate warranty.');
    } finally {
      setActivating(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '10px auto 60px auto' }}>

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #031738 0%, #0a2e6f 100%)',
        borderRadius: '16px',
        padding: '24px 20px',
        color: '#ffffff',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 8px 24px rgba(3, 23, 56, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(2, 132, 199, 0.3)',
            border: '1.5px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
              Verify Product Warranty
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '4px 0 0 0' }}>
              Scan genuine MWS Eagle QR codes to verify authenticity and activate your warranty coverage.
            </p>
          </div>
        </div>

        {/* Sub Navigation Toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('scan');
              setVerificationData(null);
              setActivationMsg('');
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: activeSubTab === 'scan' ? '#0284c7' : 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: activeSubTab === 'scan' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Camera size={14} />
            Scan QR
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('my-warranties')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: activeSubTab === 'my-warranties' ? '#0284c7' : 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: activeSubTab === 'my-warranties' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Shield size={14} />
            My Warranties ({myWarranties.length})
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {activationMsg && (
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
          fontWeight: 700,
          fontSize: '0.9rem',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
        }}>
          <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0 }} />
          <div>{activationMsg}</div>
        </div>
      )}

      {/* View 1: Scan & Verification */}
      {activeSubTab === 'scan' && (
        <div>
          {verificationData ? (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationData(null);
                    setActivationMsg('');
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid var(--border-medium)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Camera size={14} />
                  Scan Another Product QR
                </button>
              </div>

              <WarrantyVerificationCard
                verificationData={verificationData}
                loading={verifying}
                activating={activating}
                onActivate={handleActivate}
                isAuthenticated={true}
              />
            </div>
          ) : (
            <CustomerWarrantyScanner onScanSuccess={handleScanSuccess} />
          )}
        </div>
      )}

      {/* View 2: Customer's Registered Warranties */}
      {activeSubTab === 'my-warranties' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc'
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
              Your Registered Products & Active Warranties
            </div>
            <button
              type="button"
              onClick={fetchMyWarranties}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <RefreshCw size={13} className={loadingMyWarranties ? 'spin-animation' : ''} />
              Refresh
            </button>
          </div>

          <div style={{ padding: '16px' }}>
            {loadingMyWarranties ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                <RefreshCw size={20} className="spin-animation" style={{ margin: '0 auto 8px auto', color: '#0284c7' }} />
                Loading your registered warranties...
              </div>
            ) : myWarranties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
                <ShieldCheck size={38} color="#cbd5e1" style={{ margin: '0 auto 10px auto' }} />
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#334155' }}>No Warranties Registered Yet</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px', maxWidth: '360px', margin: '4px auto 16px auto' }}>
                  Scan the QR code printed on your MWS Eagle product card to activate your official warranty coverage.
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('scan')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Scan QR Code Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                {myWarranties.map((w) => {
                  const status = w.effectiveStatus || w.status;
                  const isActive = status === 'Active';
                  const isExpired = status === 'Expired';

                  return (
                    <div
                      key={w.id}
                      style={{
                        borderRadius: '12px',
                        border: `1.5px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}`,
                        background: '#ffffff',
                        padding: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                            {w.product_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#0284c7', fontFamily: 'monospace', fontWeight: 700 }}>
                            {w.warranty_code} • {w.product_code}
                          </div>
                        </div>

                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: isActive ? '#dcfce7' : '#f1f5f9',
                          color: isActive ? '#15803d' : '#64748b'
                        }}>
                          {status}
                        </span>
                      </div>

                      <div style={{
                        background: '#f8fafc',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        marginTop: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#64748b' }}>Coverage:</span>
                          <strong>{w.warranty_duration} {w.warranty_duration_unit} {w.warranty_type}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#64748b' }}>Start Date:</span>
                          <span>{formatDate(w.warranty_start_date)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Expiry Date:</span>
                          <span style={{ fontWeight: 700, color: isExpired ? '#dc2626' : '#15803d' }}>
                            {formatDate(w.warranty_end_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CustomerWarrantySection;
