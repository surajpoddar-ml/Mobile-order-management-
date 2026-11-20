import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../services/api';
import { Camera, CheckCircle, CreditCard, User, ShieldCheck, X, Check, Upload, AlertCircle } from 'lucide-react';

export const UserProfileCard = ({ onOpenProfile, onCreditClick, creditAmount = null }) => {
  const { user, uploadProfilePhoto } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null); // { file, url, sizeKb }
  const [uploadMsg, setUploadMsg] = useState(null); // { type: 'success' | 'error', text }
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

  const handlePhotoSelect = (e) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be smaller than 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      alert('Only JPG, JPEG, PNG, and WEBP formats are supported.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewPhoto({
      file,
      url: objectUrl,
      sizeKb: (file.size / 1024).toFixed(0)
    });
    setUploadMsg(null);
  };

  const handleConfirmUpload = async () => {
    if (!previewPhoto?.file) return;

    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await uploadProfilePhoto(previewPhoto.file);
      if (res && res.success) {
        setUploadMsg({ type: 'success', text: 'Profile photo uploaded to AWS S3 successfully!' });
        setTimeout(() => {
          setPreviewPhoto(null);
          setUploadMsg(null);
        }, 1200);
      } else {
        throw new Error(res?.message || 'Upload failed.');
      }
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.message || 'Failed to upload photo to S3.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelPreview = () => {
    if (previewPhoto?.url) {
      URL.revokeObjectURL(previewPhoto.url);
    }
    setPreviewPhoto(null);
    setUploadMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            disabled={uploading}
            onChange={handlePhotoSelect}
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

      {/* ======================================================== */}
      {/* ======= MODAL: PREVIEW PHOTO BEFORE UPLOAD (S3) ======== */}
      {/* ======================================================== */}
      {previewPhoto && (
        <div
          onClick={handleCancelPreview}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.70)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Preview Profile Photo
              </div>
              <button
                onClick={handleCancelPreview}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Circular Preview */}
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '4px solid #0284c7',
                margin: '0 auto 14px auto',
                overflow: 'hidden',
                background: '#f1f5f9',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)'
              }}
            >
              <img
                src={previewPhoto.url}
                alt="Selected Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 700, marginBottom: '4px' }}>
              {previewPhoto.file.name}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '14px' }}>
              Size: {previewPhoto.sizeKb} KB • Target: 512×512 (AWS S3)
            </div>

            <div
              style={{
                fontSize: '0.76rem',
                color: '#0284c7',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '8px 10px',
                marginBottom: '16px',
                lineHeight: 1.4
              }}
            >
              🔒 <strong>AWS S3 Secure Processing:</strong> Photo will be auto-resized to 512×512, stripped of EXIF metadata, and saved privately to AWS S3.
            </div>

            {uploadMsg && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  marginBottom: '14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: uploadMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                  color: uploadMsg.type === 'success' ? '#166534' : '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {uploadMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                {uploadMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleCancelPreview}
                disabled={uploading}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 14px', fontSize: '0.86rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '0.86rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {uploading ? (
                  <>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid #ffffff',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}
                    />
                    <span>Uploading to S3...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Confirm & Upload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileCard;
