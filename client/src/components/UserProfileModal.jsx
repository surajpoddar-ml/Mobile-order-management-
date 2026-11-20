import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../services/api';
import {
  X,
  Camera,
  CheckCircle,
  Shield,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Lock,
  LogOut,
  CreditCard,
  Store,
  Layers,
  AlertCircle
} from 'lucide-react';

export const UserProfileModal = ({ isOpen, onClose, onCreditClick }) => {
  const { user, uploadProfilePhoto, logout } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null); // { file, url, sizeKb }
  const fileInputRef = useRef(null);

  if (!isOpen || !user) return null;

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5 MB limit. Please select a smaller photo.');
      setTimeout(() => setUploadError(''), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate format
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setUploadError('Invalid format. Please upload JPG, PNG, or WEBP photos.');
      setTimeout(() => setUploadError(''), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewPhoto({
      file,
      url: objectUrl,
      sizeKb: (file.size / 1024).toFixed(0)
    });
    setUploadError('');
    setUploadSuccess('');
  };

  const handleConfirmUpload = async () => {
    if (!previewPhoto?.file) return;

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const res = await uploadProfilePhoto(previewPhoto.file);
      if (res && res.success) {
        setUploadSuccess('Profile picture updated successfully in AWS S3!');
        setTimeout(() => {
          setPreviewPhoto(null);
          setUploadSuccess('');
        }, 1500);
      } else {
        setUploadError(res?.message || 'Failed to upload photo.');
      }
    } catch (err) {
      setUploadError(err.message || 'Error uploading profile photo.');
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
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isDistributor = user.userType === 'Distributor' || Boolean(user.distributorLevel);
  const isRetailer = user.userType === 'Retailer';
  const roleDisplay = isRetailer ? 'Retailer' : isDistributor ? 'Wholesale Distributor' : 'Customer';
  const verifiedBadgeText = isRetailer
    ? 'Verified Retailer Account'
    : isDistributor
      ? 'Verified Wholesale Account'
      : 'Verified Customer Account';

  const avatarSrc = user.avatarUrl ? getMediaUrl(user.avatarUrl) : null;

  const formattedDate = user.createdDate
    ? new Date(user.createdDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Active Member';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>Personal Profile Details</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                ID: {user.userId || 'MWS-ACCOUNT'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {/* Top Profile Summary Card (Matches Reference Image) */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}
          >
            {/* Profile Avatar with Camera Upload Badge */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  border: '3.5px solid #0284c7',
                  overflow: 'hidden',
                  background: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(2, 132, 199, 0.2)'
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user.fullName || 'User Profile'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <User size={42} color="#0284c7" />
                )}
              </div>

              {/* Camera Upload Badge */}
              <label
                htmlFor="user-profile-modal-photo-input"
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#0284c7',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploading ? 'wait' : 'pointer',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s ease'
                }}
                title="Upload or change profile picture"
              >
                <Camera size={14} />
              </label>

              <input
                id="user-profile-modal-photo-input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                capture="user"
                disabled={uploading}
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Profile Header Details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user.shopName || user.businessName || user.fullName}
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginTop: '4px',
                  color: '#0284c7',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <CheckCircle size={14} fill="#0284c7" color="#ffffff" />
                <span>{verifiedBadgeText}</span>
              </div>

              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#475569',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                  marginTop: '2px'
                }}
              >
                ID: {user.userId}
              </div>

              {/* Status Chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: user.accountStatus === 'Active' ? '#dcfce7' : '#fef3c7',
                    color: user.accountStatus === 'Active' ? '#15803d' : '#b45309',
                    fontSize: '0.70rem',
                    fontWeight: 800
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: user.accountStatus === 'Active' ? '#16a34a' : '#d97706'
                    }}
                  />
                  {user.accountStatus || 'Active'}
                </span>
                <span style={{ fontSize: '0.70rem', color: '#64748b' }}>
                  Since {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Upload Status Alerts */}
          {uploading && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: '14px',
                background: '#e0f2fe',
                color: '#0369a1',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid #0284c7',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
              Uploading and optimizing profile photo...
            </div>
          )}

          {uploadError && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: '14px',
                background: '#fee2e2',
                color: '#b91c1c',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <AlertCircle size={15} />
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div
              style={{
                padding: '8px 12px',
                marginBottom: '14px',
                background: '#dcfce7',
                color: '#15803d',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle size={15} />
              {uploadSuccess}
            </div>
          )}

          {/* Quick Photo Upload Trigger Button */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="user-profile-modal-photo-input"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1.5px solid #0284c7',
                background: '#f0f9ff',
                color: '#0369a1',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Camera size={16} />
              <span>{user.avatarUrl ? 'Change Profile Picture' : 'Upload Profile Picture'}</span>
            </label>
            <div style={{ fontSize: '0.70rem', color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
              Supports camera capture or gallery (JPG, PNG, WEBP, max 5 MB)
            </div>
          </div>

          {/* Admin-Only Policy Banner (Strictly Enforced) */}
          <div
            style={{
              padding: '12px 14px',
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '12px',
              marginBottom: '16px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}
          >
            <Lock size={18} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: 1.4 }}>
              <strong>Admin-Controlled Account:</strong> Personal, business, and territory details are permanently locked to ensure verification and security. To update your name, email, phone, or location, please contact MWS Eagle Administrator.
            </div>
          </div>

          {/* Section 1: Common Personal Account Information */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#334155',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <User size={14} color="#0284c7" /> Common Account Information
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px'
              }}
            >
              <ProfileField label="Full Name" value={user.fullName} />
              <ProfileField label="Email Address" value={user.email} />
              <ProfileField label="Phone Number" value={user.phoneNumber || 'Not provided'} />
              <ProfileField label="Account Type" value={roleDisplay} />
              <ProfileField label="Account Status" value={user.accountStatus || 'Active'} />
              <ProfileField label="Registered Date" value={formattedDate} />
            </div>
          </div>

          {/* Section 2: Business & Territory Information (Distributor & Retailer) */}
          {(isDistributor || isRetailer || user.businessName || user.shopName || user.state) && (
            <div style={{ marginBottom: '18px' }}>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <MapPin size={14} color="#0284c7" /> Geographical Territory & Business Details
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '10px'
                }}
              >
                {user.shopName && <ProfileField label="Shop Name" value={user.shopName} />}
                {user.businessName && <ProfileField label="Business Name" value={user.businessName} />}
                {user.ownerName && <ProfileField label="Owner Name" value={user.ownerName} />}
                {user.distributorLevel && <ProfileField label="Distributor Level" value={user.distributorLevel} />}
                <ProfileField label="Country" value={user.country || 'India'} />
                <ProfileField label="State / UT" value={user.state || 'Not assigned'} />
                <ProfileField label="District" value={user.district || 'Not assigned'} />
                <ProfileField label="Area / City" value={user.city || user.area || 'Not specified'} />
                <ProfileField label="Town / Village / Locality" value={user.locality || 'Not specified'} />
                <ProfileField label="PIN Code" value={user.pincode || 'Not specified'} />
              </div>

              {(user.address || user.businessAddress) && (
                <div style={{ marginTop: '10px' }}>
                  <ProfileField
                    label="Complete Registered Address"
                    value={user.address || user.businessAddress}
                    fullWidth
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.80rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>

          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Close
          </button>
        </div>

        {/* Modal: Preview Photo Before Upload */}
        {previewPhoto && (
          <div
            onClick={handleCancelPreview}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100000,
              padding: '16px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '400px',
                width: '100%',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                textAlign: 'center'
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

              <div
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  border: '4px solid #0284c7',
                  margin: '0 auto 12px auto',
                  overflow: 'hidden',
                  background: '#f1f5f9',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)'
                }}
              >
                <img
                  src={previewPhoto.url}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 700, marginBottom: '4px' }}>
                {previewPhoto.file.name}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '12px' }}>
                Size: {previewPhoto.sizeKb} KB • Resized to 512×512 (AWS S3)
              </div>

              {uploadError && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', background: '#fee2e2', color: '#991b1b', fontSize: '0.80rem', fontWeight: 700 }}>
                  {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', background: '#dcfce7', color: '#166534', fontSize: '0.80rem', fontWeight: 700 }}>
                  {uploadSuccess}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleCancelPreview}
                  disabled={uploading}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '9px 12px', fontSize: '0.84rem' }}
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
                    padding: '9px 12px',
                    fontSize: '0.84rem',
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
                      <span>Saving to S3...</span>
                    </>
                  ) : (
                    <span>Confirm & Upload</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileField = ({ label, value, fullWidth = false }) => {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '10px 12px',
        gridColumn: fullWidth ? '1 / -1' : 'auto'
      }}
    >
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginTop: '3px', wordBreak: 'break-word' }}>
        {value || '—'}
      </div>
    </div>
  );
};

export default UserProfileModal;
