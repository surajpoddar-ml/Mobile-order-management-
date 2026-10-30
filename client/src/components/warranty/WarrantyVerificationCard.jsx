import React from 'react';
import { getMediaUrl } from '../../services/api';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  Package,
  Award,
  Lock,
  ArrowRight
} from 'lucide-react';

export const WarrantyVerificationCard = ({
  verificationData,
  loading = false,
  activating = false,
  onActivate = null,
  isAuthenticated = false,
  onRequireLogin = null
}) => {
  if (loading) {
    return (
      <div style={{
        maxWidth: '460px',
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid var(--border-medium)',
        padding: '40px 20px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="spin-animation" style={{
          width: '36px',
          height: '36px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#0284c7',
          borderRadius: '50%',
          margin: '0 auto 14px auto'
        }} />
        <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#0f172a' }}>Verifying Product Warranty...</div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Authenticating QR with MWS Eagle security records</div>
      </div>
    );
  }

  if (!verificationData) return null;

  const {
    invalid,
    message,
    warranty
  } = verificationData;

  // 1. Invalid Product QR
  if (invalid || !warranty) {
    return (
      <div style={{
        maxWidth: '460px',
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: '16px',
        border: '2px solid #ef4444',
        padding: '30px 20px',
        textAlign: 'center',
        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.12)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fee2e2',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#dc2626'
        }}>
          <XCircle size={36} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', margin: '0 0 8px 0' }}>
          Invalid Product QR
        </h3>

        <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          {message || 'This QR code could not be verified by MWS Eagle. It is either unregistered or counterfeit.'}
        </p>

        <div style={{
          padding: '10px 14px',
          background: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          fontSize: '0.76rem',
          color: '#b91c1c'
        }}>
          If you purchased this item as an authentic MWS Eagle product, please contact official support or your distributor.
        </div>
      </div>
    );
  }

  const status = warranty.status;
  const isNotActivated = status === 'Not Activated';
  const isActive = status === 'Active';
  const isExpired = status === 'Expired';
  const isSuspended = status === 'Suspended';
  const isOwner = warranty.isOwner;
  const isAlreadyActivated = warranty.isAlreadyActivated;

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
    <div style={{
      maxWidth: '460px',
      margin: '0 auto',
      background: '#ffffff',
      borderRadius: '16px',
      border: '1.5px solid var(--border-medium)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden'
    }}>
      {/* Brand Header & Verification Banner */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #031738 0%, #0a2559 100%)',
        color: '#ffffff',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* MWS Eagle Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
          <img
            src="/mws_eagle_logo.jpg?v=3"
            alt="MWS Eagle"
            style={{ height: '32px', borderRadius: '4px', objectFit: 'contain' }}
          />
          <span style={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.06em' }}>MWS EAGLE</span>
        </div>

        {/* Verification Title */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '20px',
          background: isActive || isNotActivated ? 'rgba(34, 197, 94, 0.2)' : isExpired ? 'rgba(148, 163, 184, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          border: `1px solid ${isActive || isNotActivated ? '#22c55e' : isExpired ? '#94a3b8' : '#ef4444'}`,
          fontSize: '0.8rem',
          fontWeight: 800,
          color: isActive || isNotActivated ? '#4ade80' : isExpired ? '#cbd5e1' : '#f87171',
          marginBottom: '6px'
        }}>
          <ShieldCheck size={16} />
          ✓ Product Verified
        </div>

        <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
          This product has been verified by MWS Eagle Official System.
        </div>
      </div>

      {/* Main Content Details */}
      <div style={{ padding: '20px' }}>

        {/* Product Visual & Identity */}
        <div style={{
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px'
        }}>
          {warranty.productImageUrl ? (
            <img
              src={getMediaUrl(warranty.productImageUrl)}
              alt={warranty.productName}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid #e2e8f0',
                background: '#ffffff'
              }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '8px',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
            }}>
              <Package size={28} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{
              margin: '0 0 4px 0',
              fontWeight: 800,
              fontSize: '0.94rem',
              color: '#0f172a',
              lineHeight: 1.3
            }}>
              {warranty.productName}
            </h4>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Brand: <strong>{warranty.brand || 'MWS Eagle'}</strong>
              {warranty.model ? ` • Model: ${warranty.model}` : ''}
            </div>
            <div style={{
              fontSize: '0.76rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#0284c7',
              marginTop: '4px'
            }}>
              Code: {warranty.productCode}
            </div>
          </div>
        </div>

        {/* Coverage Specifications */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <div style={{
            background: '#f8fafc',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Coverage Period</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {warranty.warrantyDuration} {warranty.warrantyDurationUnit}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>
              {warranty.warrantyType}
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Warranty Status</div>
            <div style={{
              fontSize: '0.88rem',
              fontWeight: 800,
              marginTop: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: isNotActivated ? '#ca8a04' : isActive ? '#15803d' : isExpired ? '#64748b' : '#dc2626'
            }}>
              {isNotActivated && <Clock size={14} />}
              {isActive && <CheckCircle2 size={14} />}
              {isExpired && <XCircle size={14} />}
              {isSuspended && <AlertTriangle size={14} />}
              {status}
            </div>
          </div>
        </div>

        {/* Lifecycle Dates Display (If activated or expired) */}
        {(isActive || isExpired || warranty.warrantyStartDate) && (
          <div style={{
            background: isExpired ? '#f8fafc' : '#f0fdf4',
            border: `1px solid ${isExpired ? '#e2e8f0' : '#bbf7d0'}`,
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Warranty Started:</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                {formatDate(warranty.warrantyStartDate)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Warranty Expires:</span>
              <span style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: isExpired ? '#dc2626' : '#15803d'
              }}>
                {formatDate(warranty.warrantyEndDate)}
              </span>
            </div>

            {isActive && (
              <div style={{
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px dashed #bbf7d0',
                fontSize: '0.72rem',
                color: '#15803d',
                fontWeight: 700,
                textAlign: 'center'
              }}>
                ✓ Active Official Coverage
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* =============== ACTION STATES / BUTTONS ================ */}
        {/* ======================================================== */}

        {/* Case A: Not Activated -> Eligible for Activation */}
        {isNotActivated && (
          <div>
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fef08a',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.76rem',
              color: '#854d0e',
              marginBottom: '16px',
              lineHeight: 1.4
            }}>
              This product is genuine and has not been activated yet. Tap <strong>"Activate Warranty"</strong> below to begin your official {warranty.warrantyDuration} {warranty.warrantyDurationUnit} warranty period from today.
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={onActivate}
                disabled={activating}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.94rem',
                  cursor: activating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)'
                }}
              >
                {activating ? (
                  <>Activating Warranty...</>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Activate Warranty
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequireLogin}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                <Lock size={16} />
                Sign In to Activate Warranty
              </button>
            )}
          </div>
        )}

        {/* Case B: Active & User is Registered Owner */}
        {isActive && isOwner && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <CheckCircle2 size={18} />
              Warranty Registered to Your Account
            </div>
            <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '4px' }}>
              Your warranty period has started from {formatDate(warranty.warrantyStartDate)} and is valid until {formatDate(warranty.warrantyEndDate)}.
            </div>
          </div>
        )}

        {/* Case C: Already Activated by Another Customer */}
        {isActive && !isOwner && isAlreadyActivated && (
          <div style={{
            background: '#fefce8',
            border: '1px solid #fef08a',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#854d0e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <AlertTriangle size={18} />
              Warranty Already Registered
            </div>
            <div style={{ fontSize: '0.78rem', color: '#713f12', marginTop: '4px', lineHeight: 1.4 }}>
              This product warranty has already been activated on <strong>{formatDate(warranty.warrantyStartDate)}</strong>. Multiple registrations are not permitted.
            </div>
          </div>
        )}

        {/* Case D: Expired */}
        {isExpired && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <XCircle size={18} />
              Warranty Expired
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              The coverage period for this product expired on {formatDate(warranty.warrantyEndDate)}.
            </div>
          </div>
        )}

        {/* Case E: Suspended */}
        {isSuspended && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <AlertTriangle size={18} />
              Warranty Suspended
            </div>
            <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '4px' }}>
              This warranty has been suspended by administration. Please contact MWS Eagle support.
            </div>
          </div>
        )}

        {/* Terms footer note */}
        {warranty.terms && (
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px dashed #e2e8f0',
            fontSize: '0.7rem',
            color: '#64748b',
            lineHeight: 1.4
          }}>
            <strong>Coverage Terms:</strong> {warranty.terms}
          </div>
        )}

      </div>
    </div>
  );
};

export default WarrantyVerificationCard;
