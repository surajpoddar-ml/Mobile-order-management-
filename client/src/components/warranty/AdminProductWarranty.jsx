import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import api, { getMediaUrl, getProductFallbackImage } from '../../services/api';
import {
  ShieldCheck,
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  Clock,
  User,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Tag,
  Shield,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export const AdminProductWarranty = () => {
  // Warranties list & pagination
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    notActivated: 0,
    expired: 0,
    totalScans: 0
  });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Selected for Print / Card Preview
  const [selectedWarrantyCard, setSelectedWarrantyCard] = useState(null);
  const [cardQrDataUrl, setCardQrDataUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Selected for Details & Scan History
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Create Form State
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    productSku: '',
    brand: 'MWS Eagle',
    model: '',
    productCode: '', // Serial Number
    warrantyType: 'Warranty', // 'Warranty' | 'Guarantee'
    warrantyDuration: 6,
    warrantyDurationUnit: 'Months', // 'Months' | 'Years'
    description: '',
    purchaseInfo: '',
    terms: 'Standard MWS Eagle Official Warranty. Valid for manufacturing defects and operational failures. Physical breakage or liquid immersion voids warranty.'
  });

  // Selected product preview
  const [selectedProductPreview, setSelectedProductPreview] = useState(null);

  // Load warranties from server
  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const res = await api.warranties.admin.getAll({
        search: searchTerm,
        status: statusFilter,
        warrantyType: typeFilter
      });
      if (res.success) {
        setWarranties(res.warranties || []);
        if (res.metrics) setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to load warranties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, [searchTerm, statusFilter, typeFilter]);

  // Load products list for the selector
  const loadProducts = async () => {
    if (productsList.length > 0) return;
    setLoadingProducts(true);
    try {
      const res = await api.products.getAll();
      if (res.success && Array.isArray(res.products)) {
        setProductsList(res.products);
      }
    } catch (err) {
      console.error('Failed to load products list:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenCreateModal = () => {
    loadProducts();
    setCreateError('');
    // Generate suggested serial
    const suggestedSerial = `SN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    setFormData({
      productId: '',
      productName: '',
      productSku: '',
      brand: 'MWS Eagle',
      model: '',
      productCode: suggestedSerial,
      warrantyType: 'Warranty',
      warrantyDuration: 6,
      warrantyDurationUnit: 'Months',
      description: '',
      purchaseInfo: '',
      terms: 'Standard MWS Eagle Official Warranty. Valid for manufacturing defects and operational failures. Physical breakage or liquid immersion voids warranty.'
    });
    setSelectedProductPreview(null);
    setCreateModalOpen(true);
  };

  const handleProductSelect = (e) => {
    const pId = e.target.value;
    const prod = productsList.find(p => String(p.id) === String(pId));
    if (prod) {
      setSelectedProductPreview(prod);
      setFormData(prev => ({
        ...prev,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku || '',
        brand: prod.brand || 'MWS Eagle',
        description: prod.description || ''
      }));
    } else {
      setSelectedProductPreview(null);
      setFormData(prev => ({
        ...prev,
        productId: '',
        productName: '',
        productSku: '',
        brand: 'MWS Eagle',
        description: ''
      }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId) {
      setCreateError('Please select a product from the list.');
      return;
    }
    if (!formData.productCode.trim()) {
      setCreateError('Please provide a unique serial number or product code.');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      const res = await api.warranties.admin.create(formData);
      if (res.success) {
        setCreateModalOpen(false);
        fetchWarranties();
        // Immediately show printable warranty card
        handleOpenPrintCard(res.warranty);
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to generate warranty QR.');
    } finally {
      setCreating(false);
    }
  };

  // Open printable warranty card & generate QR code data URL
  const handleOpenPrintCard = async (warranty) => {
    setSelectedWarrantyCard(warranty);
    setCopiedUrl(false);

    // Build the secure verification URL
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mwseagle.com';
    const verifyUrl = `${origin}/verify-warranty/${warranty.warranty_token}`;

    try {
      const dataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#031738',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });
      setCardQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR code image:', err);
    }
  };

  const handleCopyUrl = (warranty) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mwseagle.com';
    const verifyUrl = `${origin}/verify-warranty/${warranty.warranty_token}`;
    navigator.clipboard.writeText(verifyUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleDownloadQr = (warranty) => {
    if (!cardQrDataUrl) return;
    const a = document.createElement('a');
    a.href = cardQrDataUrl;
    a.download = `MWS-Warranty-QR-${warranty.warranty_code || warranty.product_code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintCard = () => {
    window.print();
  };

  // View Details & Scans
  const handleOpenDetails = async (warranty) => {
    setSelectedDetails(null);
    setLoadingDetails(true);
    try {
      const res = await api.warranties.admin.getById(warranty.id);
      if (res.success) {
        setSelectedDetails(res);
      }
    } catch (err) {
      alert('Failed to load warranty details: ' + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Delete Warranty
  const handleDeleteWarranty = async (warranty) => {
    if (!window.confirm(`Permanently delete warranty record for "${warranty.product_name}" (${warranty.warranty_code})? This will also remove all scan logs.`)) {
      return;
    }
    try {
      const res = await api.warranties.admin.delete(warranty.id);
      if (res.success) {
        fetchWarranties();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete warranty.');
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

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1440px', margin: '0 auto' }}>

      {/* ======================================================== */}
      {/* ==================== 1. HEADER SECTION ================= */}
      {/* ======================================================== */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Product Warranty & QR Verification
              </h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Generate authentic QR cards, print serial labels, and track customer warranty activations
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchWarranties}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1.5px solid var(--border-medium)',
              color: 'var(--text-main)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Plus size={16} />
            Create Warranty QR
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ================= 2. METRICS DASHBOARD ================= */}
      {/* ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Total Warranties */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Warranty QRs</span>
            <QrCode size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {metrics.total}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            Generated product cards
          </div>
        </div>

        {/* Active Warranties */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #bbf7d0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#166534' }}>Active Warranties</span>
            <CheckCircle2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '8px' }}>
            {metrics.active}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '4px' }}>
            Currently covered
          </div>
        </div>

        {/* Not Activated */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #fef08a',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#854d0e' }}>Not Activated</span>
            <Clock size={18} color="#ca8a04" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a16207', marginTop: '8px' }}>
            {metrics.notActivated}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#854d0e', marginTop: '4px' }}>
            Printed / Awaiting customer scan
          </div>
        </div>

        {/* Expired */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Expired Warranties</span>
            <XCircle size={18} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#64748b', marginTop: '8px' }}>
            {metrics.expired}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            Coverage period elapsed
          </div>
        </div>

        {/* Total Scans */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e0e7ff',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#3730a3' }}>Verification Scans</span>
            <Eye size={18} color="#4f46e5" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4338ca', marginTop: '8px' }}>
            {metrics.totalScans}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#4338ca', marginTop: '4px' }}>
            All-time audit scans logged
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ================= 3. SEARCH & FILTERS ================== */}
      {/* ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '14px 18px',
        border: '1px solid var(--border-medium)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '18px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product, code, serial number, or customer..."
            style={{
              width: '100%',
              padding: '9px 14px 9px 36px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-medium)',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-medium)',
              fontSize: '0.84rem',
              color: 'var(--text-main)',
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Not Activated">Not Activated</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-medium)',
              fontSize: '0.84rem',
              color: 'var(--text-main)',
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <option value="All">All Types</option>
            <option value="Warranty">Warranty</option>
            <option value="Guarantee">Guarantee</option>
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ================= 4. RECORDS TABLE ===================== */}
      {/* ======================================================== */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid var(--border-medium)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid var(--border-medium)' }}>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Warranty ID</th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Product</th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Serial / Code</th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Coverage</th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Start & End</th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Scans</th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={22} className="spin-animation" style={{ display: 'block', margin: '0 auto 8px auto', color: '#0284c7' }} />
                    Loading warranty records...
                  </td>
                </tr>
              ) : warranties.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={40} color="#cbd5e1" style={{ margin: '0 auto 10px auto' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#334155' }}>No Warranty Records Found</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Click "Create Warranty QR" above to generate a new product warranty card.</div>
                  </td>
                </tr>
              ) : (
                warranties.map((w) => {
                  const status = w.effectiveStatus || w.status;
                  const isNotAct = status === 'Not Activated';
                  const isActive = status === 'Active';
                  const isExp = status === 'Expired';
                  const isSusp = status === 'Suspended';

                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                      {/* Warranty ID */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0284c7', fontFamily: 'monospace' }}>
                          {w.warranty_code}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          QR: {formatDate(w.created_at)}
                        </div>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {w.product_image && (
                            <img
                              src={getMediaUrl(w.product_image)}
                              alt={w.product_name}
                              style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {w.product_name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              {w.brand} {w.product_sku ? `• SKU: ${w.product_sku}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Serial / Code */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#334155'
                        }}>
                          {w.product_code}
                        </span>
                      </td>

                      {/* Coverage */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b' }}>
                          {w.warranty_duration} {w.warranty_duration_unit}
                        </div>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: w.warranty_type === 'Guarantee' ? '#fdf4ff' : '#eff6ff',
                          color: w.warranty_type === 'Guarantee' ? '#c026d3' : '#2563eb'
                        }}>
                          {w.warranty_type}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: isNotAct ? '#fef9c3' : isActive ? '#dcfce7' : isExp ? '#f1f5f9' : '#fee2e2',
                          color: isNotAct ? '#854d0e' : isActive ? '#15803d' : isExp ? '#64748b' : '#b91c1c'
                        }}>
                          {isNotAct && <Clock size={11} />}
                          {isActive && <CheckCircle2 size={11} />}
                          {isExp && <XCircle size={11} />}
                          {isSusp && <AlertTriangle size={11} />}
                          {status}
                        </span>
                      </td>

                      {/* Start & End */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', fontSize: '0.78rem' }}>
                        {w.warranty_start_date ? (
                          <>
                            <div style={{ color: '#0f172a', fontWeight: 600 }}>Start: {formatDate(w.warranty_start_date)}</div>
                            <div style={{ color: isExp ? '#ef4444' : '#15803d', fontWeight: 600 }}>End: {formatDate(w.warranty_end_date)}</div>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Pending Activation</span>
                        )}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        {w.activated_by_name ? (
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>{w.activated_by_name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{w.activated_by_email || '—'}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Unregistered</span>
                        )}
                      </td>

                      {/* Scans */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#4338ca' }}>
                          {w.scan_count || 0} scans
                        </div>
                        {w.last_scan_date && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            Last: {formatDate(w.last_scan_date)}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {/* Print / Card */}
                          <button
                            type="button"
                            onClick={() => handleOpenPrintCard(w)}
                            title="Print Warranty QR Card"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: '#f0f9ff',
                              border: '1px solid #bae6fd',
                              color: '#0284c7',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.76rem',
                              fontWeight: 700
                            }}
                          >
                            <Printer size={13} />
                            Print QR
                          </button>

                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(w)}
                            title="View Scan Audit & History"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: '#f8fafc',
                              border: '1px solid var(--border-medium)',
                              color: 'var(--text-main)',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteWarranty(w)}
                            title="Delete Warranty Record"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              color: '#e11d48',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ============ 5. CREATE WARRANTY QR MODAL =============== */}
      {/* ======================================================== */}
      {createModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 1050
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-medium)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <QrCode size={22} color="#0284c7" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Create Product Warranty QR
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} style={{ padding: '24px' }}>
              {createError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#fee2e2',
                  border: '1px solid #f87171',
                  color: '#991b1b',
                  fontSize: '0.84rem',
                  marginBottom: '16px'
                }}>
                  {createError}
                </div>
              )}

              {/* 1. Product Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Select Product *
                </label>
                <select
                  value={formData.productId}
                  onChange={handleProductSelect}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-medium)',
                    fontSize: '0.88rem',
                    color: 'var(--text-main)',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Choose a product from catalog --</option>
                  {productsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''} — {p.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Preview Card */}
              {selectedProductPreview && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '18px'
                }}>
                  {selectedProductPreview.imageUrl && (
                    <img
                      src={getMediaUrl(selectedProductPreview.imageUrl)}
                      alt={selectedProductPreview.name}
                      style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{selectedProductPreview.name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Brand: {selectedProductPreview.brand || 'MWS Eagle'} • Category: {selectedProductPreview.category} • SKU: {selectedProductPreview.sku || 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Serial Number / Product Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Serial Number / Unique Product Code *
                  </label>
                  <input
                    type="text"
                    value={formData.productCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, productCode: e.target.value }))}
                    placeholder="e.g. SN-981245 or Batch IMEI"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-medium)',
                      fontSize: '0.88rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Model (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g. Eagle Pro 2026"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-medium)',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* 3. Warranty Type & Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Warranty Type *
                  </label>
                  <select
                    value={formData.warrantyType}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyType: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-medium)',
                      fontSize: '0.88rem',
                      background: '#ffffff'
                    }}
                  >
                    <option value="Warranty">Warranty</option>
                    <option value="Guarantee">Guarantee</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Duration *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.warrantyDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyDuration: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-medium)',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Duration Unit *
                  </label>
                  <select
                    value={formData.warrantyDurationUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, warrantyDurationUnit: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-medium)',
                      fontSize: '0.88rem',
                      background: '#ffffff'
                    }}
                  >
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                </div>
              </div>

              {/* 4. Optional Purchase / Reference Info */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Purchase / Batch Reference (Optional)
                </label>
                <input
                  type="text"
                  value={formData.purchaseInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseInfo: e.target.value }))}
                  placeholder="e.g. Batch #2026-Q4 or Distributor consignment invoice"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-medium)',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 5. Terms & Conditions */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Warranty Coverage Terms
                </label>
                <textarea
                  rows={3}
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-medium)',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Notice */}
              <div style={{
                padding: '10px 14px',
                background: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                fontSize: '0.78rem',
                color: '#1e40af',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Important Notice:</strong> Generating this QR code creates the record with status <em>"Not Activated"</em>. The warranty start date is authoritative and will begin on the exact day the customer scans and activates it.
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1.5px solid var(--border-medium)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {creating ? 'Generating QR...' : 'Generate Warranty QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ======= 6. PRINTABLE WARRANTY QR CARD MODAL ============ */}
      {/* ======================================================== */}
      {selectedWarrantyCard && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 1100
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '94vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-medium)'
          }}>
            {/* Modal Controls (Not Printed) */}
            <div className="no-print" style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} color="#0284c7" />
                Printable Warranty Card Preview
              </div>
              <button
                type="button"
                onClick={() => setSelectedWarrantyCard(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Actions Bar (Not Printed) */}
            <div className="no-print" style={{
              padding: '12px 20px',
              background: '#ffffff',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                type="button"
                onClick={handlePrintCard}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Printer size={15} />
                Print Card (window.print)
              </button>

              <button
                type="button"
                onClick={() => handleDownloadQr(selectedWarrantyCard)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid var(--border-medium)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <Download size={15} />
                Download QR PNG
              </button>

              <button
                type="button"
                onClick={() => handleCopyUrl(selectedWarrantyCard)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#334155',
                  border: '1.5px solid var(--border-medium)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                {copiedUrl ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
                {copiedUrl ? 'Copied URL!' : 'Copy Verification URL'}
              </button>
            </div>

            {/* ======================================================== */}
            {/* ============= EXACT PRINTABLE CARD ELEMENT ============= */}
            {/* ======================================================== */}
            <div style={{ padding: '24px' }}>
              <div
                id="mws-printable-warranty-card"
                style={{
                  background: '#ffffff',
                  border: '2px solid #031738',
                  borderRadius: '12px',
                  padding: '24px 20px',
                  maxWidth: '440px',
                  margin: '0 auto',
                  boxShadow: '0 8px 24px rgba(3, 23, 56, 0.08)',
                  color: '#0f172a',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}
              >
                {/* Brand Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src="/mws_eagle_logo.jpg?v=3"
                      alt="MWS Eagle Logo"
                      style={{ height: '42px', borderRadius: '6px', objectFit: 'contain' }}
                    />
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#031738', letterSpacing: '0.04em' }}>
                        MWS EAGLE
                      </div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#0284c7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Product Warranty Verification
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      background: selectedWarrantyCard.warranty_type === 'Guarantee' ? '#fae8ff' : '#e0f2fe',
                      color: selectedWarrantyCard.warranty_type === 'Guarantee' ? '#86198f' : '#0369a1',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {selectedWarrantyCard.warranty_duration} {selectedWarrantyCard.warranty_duration_unit} {selectedWarrantyCard.warranty_type}
                    </div>
                  </div>
                </div>

                {/* Product & Code Metadata */}
                <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Product:</span>
                    <span style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 800, textAlign: 'right', maxWidth: '240px' }}>
                      {selectedWarrantyCard.product_name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Product Code / Serial:</span>
                    <span style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 800, fontFamily: 'monospace' }}>
                      {selectedWarrantyCard.product_code}
                    </span>
                  </div>

                  {selectedWarrantyCard.model && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Model:</span>
                      <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 700 }}>
                        {selectedWarrantyCard.model}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Warranty ID:</span>
                    <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 800, fontFamily: 'monospace' }}>
                      {selectedWarrantyCard.warranty_code}
                    </span>
                  </div>
                </div>

                {/* QR Code Container */}
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  {cardQrDataUrl ? (
                    <img
                      src={cardQrDataUrl}
                      alt="Warranty Verification QR Code"
                      style={{
                        width: '180px',
                        height: '180px',
                        margin: '0 auto',
                        display: 'block',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '6px',
                        background: '#ffffff'
                      }}
                    />
                  ) : (
                    <div style={{ width: '180px', height: '180px', margin: '0 auto', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Generating QR...
                    </div>
                  )}

                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#031738', marginTop: '10px' }}>
                    Scan to Verify Product & Activate Warranty
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                    Scan with any smartphone camera or MWS Eagle scanner
                  </div>
                </div>

                {/* Footer / Terms Note */}
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.64rem', color: '#475569', lineHeight: 1.3 }}>
                    {selectedWarrantyCard.terms || 'Covers manufacturing defects. Warranty starts from date of customer QR activation.'}
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#0284c7', marginTop: '4px', letterSpacing: '0.04em' }}>
                    OFFICIAL MWS EAGLE AUTHENTIC PRODUCT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ======= 7. DETAILS & SCAN AUDIT HISTORY MODAL ========== */}
      {/* ======================================================== */}
      {selectedDetails && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 1060
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1px solid var(--border-medium)'
          }}>
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Warranty Record Details & Audit Trail
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#0284c7', fontFamily: 'monospace', marginTop: '2px' }}>
                  {selectedDetails.warranty?.warranty_code}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Product Info */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Product Information
                </h4>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                  <div><strong>Name:</strong> {selectedDetails.warranty?.product_name}</div>
                  <div style={{ marginTop: '4px' }}><strong>Code / Serial:</strong> {selectedDetails.warranty?.product_code}</div>
                  <div style={{ marginTop: '4px' }}><strong>Brand:</strong> {selectedDetails.warranty?.brand}</div>
                  {selectedDetails.warranty?.model && <div style={{ marginTop: '4px' }}><strong>Model:</strong> {selectedDetails.warranty?.model}</div>}
                  {selectedDetails.warranty?.product_sku && <div style={{ marginTop: '4px' }}><strong>SKU:</strong> {selectedDetails.warranty?.product_sku}</div>}
                </div>
              </div>

              {/* Warranty Info */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Warranty Coverage & Lifecycle
                </h4>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                  <div><strong>Type:</strong> {selectedDetails.warranty?.warranty_type}</div>
                  <div style={{ marginTop: '4px' }}><strong>Duration:</strong> {selectedDetails.warranty?.warranty_duration} {selectedDetails.warranty?.warranty_duration_unit}</div>
                  <div style={{ marginTop: '4px' }}><strong>QR Created:</strong> {formatDateTime(selectedDetails.warranty?.created_at)}</div>
                  <div style={{ marginTop: '4px' }}><strong>Status:</strong> {selectedDetails.warranty?.effectiveStatus || selectedDetails.warranty?.status}</div>
                  <div style={{ marginTop: '4px' }}><strong>Activated At:</strong> {formatDateTime(selectedDetails.warranty?.activated_at)}</div>
                  <div style={{ marginTop: '4px' }}><strong>Warranty Start:</strong> {formatDate(selectedDetails.warranty?.warranty_start_date)}</div>
                  <div style={{ marginTop: '4px' }}><strong>Warranty Expiry:</strong> {formatDate(selectedDetails.warranty?.warranty_end_date)}</div>
                </div>
              </div>

              {/* Customer Profile Info (Masked / Safe) */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Registered Customer
                </h4>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                  {selectedDetails.warranty?.customer_full_name ? (
                    <>
                      <div><strong>Customer Name:</strong> {selectedDetails.warranty?.customer_full_name}</div>
                      <div style={{ marginTop: '4px' }}><strong>Customer ID:</strong> {selectedDetails.warranty?.customer_uid || 'N/A'}</div>
                      <div style={{ marginTop: '4px' }}><strong>Email:</strong> {selectedDetails.warranty?.customer_masked_email || '—'}</div>
                    </>
                  ) : (
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                      Not yet claimed or registered by a customer.
                    </div>
                  )}
                </div>
              </div>

              {/* Scan History Audit Trail */}
              <div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Scan History & Audit Trail ({selectedDetails.scans?.length || 0})
                </h4>
                {selectedDetails.scans && selectedDetails.scans.length > 0 ? (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Date & Time</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>User</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Event</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Device / IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDetails.scans.map((s) => (
                          <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 10px', color: '#0f172a' }}>{formatDateTime(s.scanned_at)}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{s.user_name || 'Visitor'}</td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                background: s.event_type === 'Warranty Activated' ? '#dcfce7' : '#e0f2fe',
                                color: s.event_type === 'Warranty Activated' ? '#15803d' : '#0369a1'
                              }}>
                                {s.event_type}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', color: '#64748b' }}>
                              {s.ip_address || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    No scan activity recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Specific CSS to ensure clean printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #mws-printable-warranty-card, #mws-printable-warranty-card * {
            visibility: visible;
          }
          #mws-printable-warranty-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 480px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
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

export default AdminProductWarranty;
