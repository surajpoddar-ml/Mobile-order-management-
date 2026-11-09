import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Search,
  HardDrive,
  FileText,
  Clock,
  Eye,
  X
} from 'lucide-react';

export const AdminMediaGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [latestUploadedUrl, setLatestUploadedUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  // Fetch images from GET /api/images
  const fetchImages = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.images.getAll();
      if (res && res.success && Array.isArray(res.images)) {
        setImages(res.images);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.error('Failed to load images:', err);
      setErrorMessage(err.message || 'Failed to load persistent images from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Handle image upload submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLatestUploadedUrl('');

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setErrorMessage('Please select an image file to upload.');
      return;
    }

    // Client-side pre-validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setErrorMessage(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 5 MB.`);
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    setUploadProgress(20);

    try {
      // Simulate progress progression
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 15 : prev));
      }, 150);

      const res = await api.images.upload(formData);
      clearInterval(progressTimer);
      setUploadProgress(100);

      if (res && res.success && res.image) {
        setSuccessMessage(`Image "${res.image.originalName}" uploaded successfully to persistent storage!`);
        setLatestUploadedUrl(res.image.url);
        // Reset file form
        if (formRef.current) formRef.current.reset();
        // Refresh list
        await fetchImages();
      } else {
        setErrorMessage(res?.message || 'Failed to upload image.');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setErrorMessage(err.data?.message || err.message || 'Image upload failed.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 400);
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(''), 2500);
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  };

  // Handle Delete
  const handleDeleteImage = async (id, storedName) => {
    if (!window.confirm(`Are you sure you want to delete "${storedName}"? This permanently removes the file from Hostinger storage and database.`)) {
      return;
    }

    setDeletingId(id);
    setErrorMessage('');
    try {
      const res = await api.images.delete(id);
      if (res && res.success) {
        setImages(prev => prev.filter(img => img.id !== id));
        setSuccessMessage(`Image "${storedName}" deleted successfully.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(res?.message || 'Failed to delete image.');
      }
    } catch (err) {
      console.error('Delete image error:', err);
      setErrorMessage(err.message || 'Error occurred while deleting image.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered images list based on search query
  const filteredImages = images.filter(img => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (img.originalName && img.originalName.toLowerCase().includes(q)) ||
      (img.storedName && img.storedName.toLowerCase().includes(q)) ||
      (img.mimeType && img.mimeType.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #090d16 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                background: 'rgba(2, 132, 199, 0.2)',
                color: '#38bdf8',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <HardDrive size={13} /> HOSTINGER PERSISTENT STORAGE
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
              Persistent Media & Image Manager
            </h2>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8', maxWidth: '640px', lineHeight: 1.5 }}>
              Images uploaded here are stored in dedicated persistent hosting storage outside the deployment directory.
              They are <strong>never wiped</strong> during Git pulls, redeployments, or updates.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchImages}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Reload Gallery'}
          </button>
        </div>
      </div>

      {/* Upload Box Form */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(2, 132, 199, 0.1)',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Upload size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              Upload New Image
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Select a JPG, PNG, GIF, or WebP image file up to 5 MB.
            </p>
          </div>
        </div>

        {/* Upload Form (satisfies: <form enctype="multipart/form-data">, field name: image) */}
        <form
          ref={formRef}
          onSubmit={handleUploadSubmit}
          encType="multipart/form-data"
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            background: '#f8fafc',
            transition: 'border-color 0.2s ease',
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              name="image"
              id="image"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={() => {
                const f = fileInputRef.current?.files?.[0];
                if (f) {
                  setErrorMessage('');
                  setSuccessMessage(`Selected file: ${f.name} (${(f.size / (1024 * 1024)).toFixed(2)} MB)`);
                }
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569'
              }}>
                <ImageIcon size={24} />
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#1e293b' }}>
                Click here or browse to select an image
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                Allowed formats: JPEG, PNG, GIF, WebP &bull; Maximum file size: 5 MB
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, marginBottom: '4px' }}>
                <span>Uploading file to persistent storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                  transition: 'width 0.2s ease'
                }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              fontSize: '0.84rem',
              fontWeight: 600
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message & URL Copy Box */}
          {successMessage && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              fontSize: '0.84rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                <span>{successMessage}</span>
              </div>

              {latestUploadedUrl && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #86efac',
                  marginTop: '4px'
                }}>
                  <input
                    type="text"
                    readOnly
                    value={latestUploadedUrl}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(latestUploadedUrl)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      background: copiedUrl === latestUploadedUrl ? '#16a34a' : '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedUrl === latestUploadedUrl ? <Check size={12} /> : <Copy size={12} />}
                    {copiedUrl === latestUploadedUrl ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={uploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '8px',
                background: uploading ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Upload size={16} />
              {uploading ? 'Uploading Image...' : 'Upload to Persistent Storage'}
            </button>
          </div>
        </form>
      </div>

      {/* Gallery Section */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Stored Images Gallery ({filteredImages.length})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Real images loaded directly via <code>GET /api/images</code> and rendered through <code>https://api.mwseagle.com/images/[filename]</code>
            </p>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search images by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px auto', display: 'block' }} />
            <span>Loading persistent gallery...</span>
          </div>
        ) : filteredImages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}>
            <ImageIcon size={42} color="#94a3b8" style={{ marginBottom: '10px' }} />
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#1e293b' }}>
              {searchQuery ? 'No images match your search' : 'No images uploaded yet'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem' }}>
              {searchQuery ? 'Try another keyword.' : 'Upload your first image using the form above.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '18px'
          }}>
            {filteredImages.map((img) => (
              <div
                key={img.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Image Display using normal <img> element (satisfies requirement 8 & 11) */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '170px',
                    background: '#090d16',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => setPreviewImage(img)}
                >
                  <img
                    src={img.url}
                    alt={img.originalName || 'MWS Eagle Image'}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.opacity = '0.5';
                    }}
                  />

                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    borderRadius: '6px',
                    padding: '4px 6px',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Eye size={12} /> View
                  </div>

                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    color: '#38bdf8',
                    fontSize: '0.68rem',
                    fontFamily: 'monospace',
                    fontWeight: 600
                  }}>
                    {formatFileSize(img.fileSize)}
                  </div>
                </div>

                {/* Metadata & Controls */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={img.originalName}
                    >
                      {img.originalName}
                    </div>

                    <div style={{
                      fontSize: '0.72rem',
                      color: '#64748b',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px'
                    }}
                    title={img.storedName}
                    >
                      {img.storedName}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.7rem', color: '#94a3b8' }}>
                      <Clock size={11} />
                      <span>{formatDate(img.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions: Copy URL & Delete */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(img.url)}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: copiedUrl === img.url ? '#16a34a' : '#f1f5f9',
                        color: copiedUrl === img.url ? '#ffffff' : '#0f172a',
                        border: 'none',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {copiedUrl === img.url ? <Check size={12} /> : <Copy size={12} />}
                      {copiedUrl === img.url ? 'Copied' : 'Copy URL'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id, img.storedName)}
                      disabled={deletingId === img.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: deletingId === img.id ? 'not-allowed' : 'pointer'
                      }}
                      title="Delete image permanently"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Preview */}
      {previewImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}
        onClick={() => setPreviewImage(null)}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            background: '#090d16',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
          onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <X size={18} />
            </button>

            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img
                src={previewImage.url}
                alt={previewImage.originalName}
                style={{
                  maxWidth: '85vw',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>

            <div style={{
              background: '#1e293b',
              padding: '12px 20px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{previewImage.originalName}</div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontFamily: 'monospace' }}>{previewImage.url}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewImage.url)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: copiedUrl === previewImage.url ? '#16a34a' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {copiedUrl === previewImage.url ? <Check size={14} /> : <Copy size={14} />}
                  {copiedUrl === previewImage.url ? 'Copied' : 'Copy URL'}
                </button>

                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                >
                  <ExternalLink size={14} /> Open Tab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMediaGallery;

