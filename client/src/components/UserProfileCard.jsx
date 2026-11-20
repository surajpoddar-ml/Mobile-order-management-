import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../services/api';
import { Camera, CheckCircle, CreditCard, User, ShieldCheck } from 'lucide-react';

export const UserProfileCard = ({ onOpenProfile, onCreditClick, creditAmount = null }) => {
  const { user, uploadProfilePhoto } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!user) return null;

  const isDistributor = user.userType === 'Distributor' || Boolean(user.distributorLevel);
  const isRetailer = user.userType === 'Retailer';

  const title = user.shopName || user.businessName || user.fullName || 'Valued Partner';

  const badgeText = isRetailer
    ? 'Verified Retailer Account'
    : isDistributor
      ? 'Verified Wholesale Account'
      : 'Verified Customer Account';

  const avatarSrc = user.avatarUrl ? getMediaUrl(user.avatarUrl) : null;

  const handlePhotoUpload = async (e) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be smaller than 5 MB.');
      return;
    }

    setUploading(true);
    try {
      await uploadProfilePhoto(file);
    } catch (err) {
      alert(err.message || 'Failed to upload profile photo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      style={{
        maxWidth: '1240px',
        margin: '8px auto 0 auto',
        padding: '0 12px'
      }}
    >
      <div
        onClick={onOpenProfile}
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid rgba(2, 132, 199, 0.20)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.10)';
          e.currentTarget.style.borderColor = 'rgba(2, 132, 199, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.borderColor = 'rgba(2, 132, 199, 0.20)';
        }}
      >
        {/* Left: Circular Profile Photo with Camera Badge (Matches Attached Reference Image) */}
        <div
          style={{ position: 'relative', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={onOpenProfile}
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              border: '3px solid #0284c7',
              overflow: 'hidden',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(2, 132, 199, 0.25)',
              cursor: 'pointer'
            }}
            title="Click to view full personal profile"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <User size={38} color="#0284c7" />
            )}
          </div>

          {/* Camera Upload Badge on bottom-right of avatar */}
          <label
            htmlFor={`user-card-photo-input-${user.id}`}
            style={{
              position: 'absolute',
              bottom: '-1px',
              right: '-1px',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              border: '2px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploading ? 'wait' : 'pointer',
              color: '#ffffff',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.25)',
              transition: 'transform 0.15s'
            }}
            title="Upload or change profile photo"
            onClick={(e) => e.stopPropagation()}
          >
            {uploading ? (
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
            ) : (
              <Camera size={13} />
            )}
          </label>

          <input
            id={`user-card-photo-input-${user.id}`}
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            capture="user"
            disabled={uploading}
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Right Details Column (Matches Attached Reference Image) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Business / Shop Name */}
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {title}
          </div>

          {/* Verified Account Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: '#0284c7',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginTop: '2px'
            }}
          >
            <CheckCircle size={15} fill="#0284c7" color="#ffffff" />
            <span>{badgeText}</span>
          </div>

          {/* Account ID */}
          <div
            style={{
              fontSize: '0.80rem',
              fontWeight: 700,
              color: '#475569',
              fontFamily: 'monospace',
              letterSpacing: '0.5px',
              marginTop: '1px'
            }}
          >
            ID: {user.userId || 'MWS-ACCOUNT'}
          </div>

          {/* Green Credit / Balance Pill */}
          <div style={{ marginTop: '6px' }}>
            <div
              onClick={(e) => {
                if (onCreditClick) {
                  e.stopPropagation();
                  onCreditClick();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                padding: '4px 14px',
                borderRadius: '24px',
                cursor: onCreditClick ? 'pointer' : 'default',
                transition: 'all 0.15s ease'
              }}
              title={onCreditClick ? 'Click to view credit ledger' : 'Account Status'}
            >
              <CreditCard size={15} color="#059669" />
              <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 700 }}>
                {isDistributor || isRetailer ? 'Available Credit:' : 'Account Status:'}
              </span>
              <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#059669' }}>
                {isDistributor || isRetailer
                  ? `₹${Number(creditAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : (user.accountStatus || 'Active')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
