import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../services/api';
import {
  Sparkles,
  Plus,
  RefreshCw,
  Search,
  Upload,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  X,
  Image as ImageIcon
} from 'lucide-react';

export const AdminStickers = () => {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    isActive: 1,
    orderIndex: 0
  });

  const showNotification = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  const loadStickers = async () => {
    setLoading(true);
    try {
      const res = await api.stickers.getAll();
      if (res && res.success && Array.isArray(res.stickers)) {
        setStickers(res.stickers);
      } else {
        setStickers([]);
      }
    } catch (err) {
      console.error('Failed to load promotional stickers:', err);
      showNotification('Could not load stickers from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStickers();
  }, []);

  const notifyChange = () => {
    window.dispatchEvent(new Event('mws_stickers_updated'));
    try {
      localStorage.setItem('mws_stickers_last_update', String(Date.now()));
    } catch (e) {}
  };

  const handleOpenAdd = () => {
    setEditingSticker(null);
    setFormData({
      title: '',
      imageUrl: '',
      linkUrl: '',
      isActive: 1,
      orderIndex: stickers.length
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setEditingSticker(st);
    setFormData({
      title: st.title || '',
      imageUrl: st.imageUrl || '',
      linkUrl: st.linkUrl || '',
      isActive: st.isActive ? 1 : 0,
      orderIndex: st.orderIndex || 0
    });
    setModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const data = new FormData();
    data.append('stickerImage', file);

    try {
      const res = await api.stickers.uploadMedia(data);
      if (res && res.success && res.url) {
        setFormData(prev => ({ ...prev, imageUrl: res.url }));
        showNotification('Sticker image uploaded successfully!');
      } else {
        alert(res.message || 'Image upload failed.');
      }
    } catch (err) {
      alert(err.message || 'Upload error.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl.trim()) {
      alert('Please upload or specify a sticker image.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSticker) {
        await api.stickers.update(editingSticker.id, formData);
        showNotification('Promotional sticker updated successfully!');
      } else {
        await api.stickers.create(formData);
        showNotification('New promotional sticker added successfully!');
      }
      setModalOpen(false);
      await loadStickers();
      notifyChange();
    } catch (err) {
      alert(err.message || 'Failed to save promotional sticker.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.stickers.toggle(id);
      if (res && res.success) {
        setStickers(prev => prev.map(s => s.id === id ? { ...s, isActive: res.isActive } : s));
        showNotification(res.message || 'Sticker visibility updated.');
        notifyChange();
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle sticker status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotional sticker?')) return;
    try {
      await api.stickers.delete(id);
      setStickers(prev => prev.filter(s => s.id !== id));
      showNotification('Promotional sticker deleted.');
      notifyChange();
    } catch (err) {
      alert(err.message || 'Failed to delete sticker.');
    }
  };

  const filteredStickers = stickers.filter(s => {
    if (!searchTerm.trim()) return true;
    return (s.title && s.title.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.86rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Alert toast if message exists */}
      {msg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '8px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          fontSize: '0.86rem',
          fontWeight: 700
        }}>
          {msg}
        </div>
      )}

      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.74rem',
            fontWeight: 800,
            color: '#ec4899',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '4px'
          }}>
            <Sparkles size={14} /> Promotional Strip
          </div>
          <h1 style={{ fontSize: 'clamp(1.35rem, 3.5vw, 1.8rem)', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Promotional Stickers &amp; Banners
          </h1>
          <p style={{ color: 'var(--text-body)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Control the thin promotional strip displayed right below the category grid on the mobile home page.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={loadStickers}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #db2777)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.28)',
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} /> Add Promotional Sticker
          </button>
        </div>
      </div>

      {/* Filter and summary card */}
      <div className="glass-panel" style={{
        padding: '14px 18px',
        background: '#ffffff',
        border: '1.5px solid var(--border-medium)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search promotional stickers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '34px', fontSize: '0.86rem' }}
          />
        </div>

        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#64748b' }}>
          Total Stickers: <strong style={{ color: '#db2777' }}>{stickers.length}</strong> · Active: <strong style={{ color: '#059669' }}>{stickers.filter(s => s.isActive).length}</strong>
        </div>
      </div>

      {/* Stickers Grid / Cards */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
          Loading promotional stickers...
        </div>
      ) : filteredStickers.length === 0 ? (
        <div style={{
          padding: '50px 20px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1.5px dashed #cbd5e1'
        }}>
          <Sparkles size={38} color="#ec4899" style={{ margin: '0 auto 10px auto', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
            No Promotional Stickers Uploaded
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.86rem', maxWidth: '440px', margin: '0 auto 14px auto' }}>
            Upload festival offers, seasonal banners, discounts, or special event strips to display below the category grid.
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            Upload First Sticker
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredStickers.map(st => (
            <div
              key={st.id}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              {/* Preview image */}
              <div style={{
                width: '100%',
                maxHeight: '120px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={getMediaUrl(st.imageUrl)}
                  alt={st.title}
                  style={{ width: '100%', maxHeight: '115px', objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Info row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                    {st.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    Link: {st.linkUrl || 'None (Banner only)'} · Priority Order: {st.orderIndex || 0}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleToggle(st.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: st.isActive ? '#ecfdf5' : '#fef2f2',
                      color: st.isActive ? '#059669' : '#dc2626',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {st.isActive ? <CheckCircle size={13} /> : <XCircle size={13} />}
                    {st.isActive ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(st)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    title="Edit / Replace sticker"
                  >
                    <Edit size={13} /> Edit
                  </button>

                  <button
                    onClick={() => handleDelete(st.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Delete sticker"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Sticker Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a' }}>
                {editingSticker ? 'Edit / Replace Promotional Sticker' : 'Add New Promotional Sticker'}
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                  Sticker Title / Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Festive Sale - 40% OFF Spare Parts"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Upload image */}
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                  Upload Sticker Graphic (Thin Banner Image) *
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ fontSize: '0.80rem', flex: 1 }}
                  />
                  {uploadingFile && <span style={{ fontSize: '0.74rem', color: '#db2777' }}>Uploading...</span>}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="Or enter direct image URL /uploads/stickers/..."
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    style={{ ...inputStyle, fontSize: '0.80rem' }}
                  />
                </div>

                {formData.imageUrl && (
                  <div style={{ marginTop: '8px', borderRadius: '6px', overflow: 'hidden', maxHeight: '70px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                    <img src={getMediaUrl(formData.imageUrl)} alt="Preview" style={{ width: '100%', maxHeight: '68px', objectFit: 'contain' }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                  Link / Redirection URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /category?name=Charger or https://..."
                  value={formData.linkUrl}
                  onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, marginBottom: '5px', color: '#334155' }}>
                    Display Order Index
                  </label>
                  <input
                    type="number"
                    value={formData.orderIndex}
                    onChange={e => setFormData({ ...formData, orderIndex: parseInt(e.target.value, 10) || 0 })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input
                    type="checkbox"
                    id="sticker-active-chk"
                    checked={Boolean(formData.isActive)}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked ? 1 : 0 })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="sticker-active-chk" style={{ fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                    Active &amp; Visible
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingFile}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #db2777)',
                    border: 'none',
                    padding: '8px 20px',
                    fontWeight: 700
                  }}
                >
                  {submitting ? 'Saving...' : editingSticker ? 'Update Sticker' : 'Save Sticker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStickers;
