import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import api, { getMediaUrl, getProductFallbackImage } from '../../services/api';
import {
  downloadSingleWarrantyCard,
  downloadSingleWarrantyQrOnly,
  downloadAllWarrantiesAsZip
} from '../../utils/warrantyCardGenerator';
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
  Info,
  CheckSquare,
  Square,
  FileText,
  Boxes,
  Sliders,
  Hash
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

  // Checkbox multi-selection for bulk operations
  const [selectedWarrantyIds, setSelectedWarrantyIds] = useState([]);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Creation options
  const [creationMode, setCreationMode] = useState('catalog'); // 'catalog' | 'manual'
  const [catalogSearch, setCatalogSearch] = useState('');
  const [batchCount, setBatchCount] = useState(1);
  const [serialPrefix, setSerialPrefix] = useState('SN-');
  const [startSequence, setStartSequence] = useState(1);

  // Selected for Print / Card Preview (Single)
  const [selectedWarrantyCard, setSelectedWarrantyCard] = useState(null);
  const [cardQrDataUrl, setCardQrDataUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Selected for Details & Scan History
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Batch Result Modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [generatedBatch, setGeneratedBatch] = useState([]);
  const [batchQrImages, setBatchQrImages] = useState({});

  // Batch Printable Sheet Modal (Multi-card grid)
  const [batchSheetModalOpen, setBatchSheetModalOpen] = useState(false);
  const [batchSheetWarranties, setBatchSheetWarranties] = useState([]);

  // ZIP packaging progress state
  const [zipPackaging, setZipPackaging] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });

  // Create Form State
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    productSku: '',
    brand: 'MWS Eagle',
    model: '',
    category: 'Displays',
    productCode: '', // Serial Number
    warrantyType: 'Warranty', // 'Warranty' | 'Guarantee'
    warrantyDuration: 6,
    warrantyDurationUnit: 'Months', // 'Months' | 'Years'
    qrExpiryDate: '',
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
    loadProducts();
  }, [searchTerm, statusFilter, typeFilter]);

  // Load products list for the selector
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.products.getAll();
      if (res && res.success && Array.isArray(res.products)) {
        setProductsList(res.products);
      } else if (Array.isArray(res)) {
        setProductsList(res);
      }
    } catch (err) {
      console.error('Failed to load products list:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups = {};
    const filtered = (productsList || []).filter(p => {
      if (!catalogSearch) return true;
      const term = catalogSearch.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.specifications && p.specifications.toLowerCase().includes(term))
      );
    });

    filtered.forEach(p => {
      const cat = p.category || 'General Products';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });

    return groups;
  }, [productsList, catalogSearch]);

  const handleOpenCreateModal = () => {
    loadProducts();
    setCreateError('');
    setBatchCount(1);
    setCreationMode('catalog');
    setCatalogSearch('');
    // Generate suggested serial
    const suggestedSerial = `SN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    setSerialPrefix('SN-');
    setStartSequence(1);
    setFormData({
      productId: '',
      productName: '',
      productSku: '',
      brand: 'MWS Eagle',
      model: '',
      category: 'Displays',
      productCode: suggestedSerial,
      warrantyType: 'Warranty',
      warrantyDuration: 6,
      warrantyDurationUnit: 'Months',
      qrExpiryDate: '',
      description: '',
      purchaseInfo: '',
      terms: 'Standard MWS Eagle Official Warranty. Valid for manufacturing defects and operational failures. Physical breakage or liquid immersion voids warranty.'
    });
    setSelectedProductPreview(null);
    setCreateModalOpen(true);
  };

  const handleProductSelect = (e) => {
    const pId = e.target.value;
    if (pId === 'custom_manual') {
      setCreationMode('manual');
      setSelectedProductPreview(null);
      setFormData(prev => ({
        ...prev,
        productId: 'custom',
        productName: '',
        productSku: '',
        brand: 'MWS Eagle'
      }));
      return;
    }

    const prod = productsList.find(p => String(p.id) === String(pId));
    if (prod) {
      setSelectedProductPreview(prod);
      // Derive a clean serial prefix from SKU or name
      const cleanPrefix = prod.sku
        ? `SN-${prod.sku.replace(/[^a-zA-Z0-9]/g, '')}-`
        : `SN-${prod.name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')}-`;
      setSerialPrefix(cleanPrefix);

      setFormData(prev => ({
        ...prev,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku || '',
        brand: prod.brand || 'MWS Eagle',
        category: prod.category || 'Displays',
        description: prod.description || prod.specifications || ''
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

    if (creationMode === 'catalog' && !formData.productId) {
      setCreateError('Please select a product or raw material from the catalog list.');
      return;
    }

    if (creationMode === 'manual' && !formData.productName.trim()) {
      setCreateError('Please enter a product or material name.');
      return;
    }

    const count = Math.max(1, Math.min(500, parseInt(batchCount, 10) || 1));

    if (count === 1 && !formData.productCode.trim()) {
      setCreateError('Please provide a unique serial number or product code.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      if (count === 1) {
        // Single generation
        const res = await api.warranties.admin.create({
          ...formData,
          productId: creationMode === 'manual' ? 'custom' : formData.productId
        });
        if (res.success) {
          setCreateModalOpen(false);
          fetchWarranties();
          handleOpenPrintCard(res.warranty);
        }
      } else {
        // Batch generation
        const res = await api.warranties.admin.createBatch({
          ...formData,
          productId: creationMode === 'manual' ? 'custom' : formData.productId,
          count,
          serialPrefix: serialPrefix.trim() || 'SN-',
          startSequence: parseInt(startSequence, 10) || 1
        });

        if (res.success && Array.isArray(res.warranties)) {
          setCreateModalOpen(false);
          fetchWarranties();
          // Open Batch result modal
          setGeneratedBatch(res.warranties);
          // Pre-generate QR data URLs for the batch preview
          generateBatchQrDataUrls(res.warranties);
          setBatchModalOpen(true);
        }
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to generate warranty QR(s).');
    } finally {
      setCreating(false);
    }
  };

  // Pre-generate QR Data URLs for batch display
  const generateBatchQrDataUrls = async (list) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mwseagle.com';
    const dict = {};
    for (const w of list.slice(0, 30)) {
      try {
        const verifyUrl = `${origin}/verify-warranty/${w.warranty_token}`;
        const url = await QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 });
        dict[w.id] = url;
      } catch (err) {}
    }
    setBatchQrImages(dict);
  };

  // Open printable warranty card & generate QR code data URL (Single)
  const handleOpenPrintCard = async (warranty) => {
    setSelectedWarrantyCard(warranty);
    setCopiedUrl(false);

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

  const handlePrintCard = () => {
    window.print();
  };

  // Download All as ZIP
  const handleDownloadZip = async (targetList, customFileName) => {
    if (!Array.isArray(targetList) || targetList.length === 0) {
      alert('No warranty records selected to download.');
      return;
    }

    setZipPackaging(true);
    setZipProgress({ current: 0, total: targetList.length });

    const safeName = customFileName || `MWS-Warranty-QRs-${Date.now().toString().slice(-6)}.zip`;

    try {
      await downloadAllWarrantiesAsZip(targetList, safeName, (current, total) => {
        setZipProgress({ current, total });
      });
    } catch (err) {
      console.error('Failed to generate warranty ZIP:', err);
      alert('Failed to package ZIP: ' + (err.message || 'Unknown error'));
    } finally {
      setZipPackaging(false);
    }
  };

  // Open Multi-Card Printable Sheet
  const handleOpenPrintSheet = async (items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    setBatchSheetWarranties(items);
    await generateBatchQrDataUrls(items);
    setBatchSheetModalOpen(true);
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
        setSelectedWarrantyIds(prev => prev.filter(id => id !== warranty.id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete warranty.');
    }
  };

  // Select all or toggle single checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedWarrantyIds(warranties.map(w => w.id));
    } else {
      setSelectedWarrantyIds([]);
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedWarrantyIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedWarrantiesList = useMemo(() => {
    return warranties.filter(w => selectedWarrantyIds.includes(w.id));
  }, [warranties, selectedWarrantyIds]);

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
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Official MWS Eagle Digital Warranty Management • Batch QR Generation & Instant Packaging
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {/* Download All Filtered as ZIP */}
          <button
            type="button"
            onClick={() => handleDownloadZip(warranties, `MWS-All-Warranty-QRs-${Date.now().toString().slice(-4)}.zip`)}
            disabled={zipPackaging || warranties.length === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 15px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1.5px solid #0284c7',
              color: '#0284c7',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: warranties.length === 0 || zipPackaging ? 'not-allowed' : 'pointer',
              opacity: warranties.length === 0 ? 0.6 : 1
            }}
          >
            <Download size={15} />
            {zipPackaging ? `Packaging (${zipProgress.current}/${zipProgress.total})...` : `Download All QRs (${warranties.length}) as ZIP`}
          </button>

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

        {/* Total Scans Logged */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #e0e7ff',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#3730a3' }}>Customer Verification Scans</span>
            <Eye size={18} color="#4f46e5" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4338ca', marginTop: '8px' }}>
            {metrics.totalScans}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#3730a3', marginTop: '4px' }}>
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
            placeholder="Search by product, material, code, serial number, or customer..."
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

      {/* Floating Multi-Selection Action Toolbar */}
      {selectedWarrantyIds.length > 0 && (
        <div style={{
          background: '#031738',
          color: '#ffffff',
          borderRadius: '10px',
          padding: '12px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
          boxShadow: '0 8px 20px rgba(3, 23, 56, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 700 }}>
            <CheckSquare size={18} color="#38bdf8" />
            <span>{selectedWarrantyIds.length} warranties selected</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleDownloadZip(selectedWarrantiesList, `MWS-Selected-Warranties-${Date.now().toString().slice(-4)}.zip`)}
              disabled={zipPackaging}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              {zipPackaging ? 'Packaging...' : 'Download Selected (ZIP)'}
            </button>

            <button
              type="button"
              onClick={() => handleOpenPrintSheet(selectedWarrantiesList)}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Printer size={14} />
              Print Selected Sheet
            </button>

            <button
              type="button"
              onClick={() => setSelectedWarrantyIds([])}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

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
                <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={warranties.length > 0 && selectedWarrantyIds.length === warranties.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Warranty ID</th>
                <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Product / Material</th>
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
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={22} className="spin-animation" style={{ display: 'block', margin: '0 auto 8px auto', color: '#0284c7' }} />
                    Loading warranty records...
                  </td>
                </tr>
              ) : warranties.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={40} color="#cbd5e1" style={{ margin: '0 auto 10px auto' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#334155' }}>No Warranty Records Found</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Click "Create Warranty QR" above to generate new product warranties or batch QRs.</div>
                  </td>
                </tr>
              ) : (
                warranties.map((w) => {
                  const status = w.effectiveStatus || w.status;
                  const isNotAct = status === 'Not Activated';
                  const isActive = status === 'Active';
                  const isExp = status === 'Expired';
                  const isSusp = status === 'Suspended';
                  const isSelected = selectedWarrantyIds.includes(w.id);

                  return (
                    <tr
                      key={w.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isSelected ? '#f0f9ff' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(w.id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>

                      {/* Warranty ID */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0284c7', fontFamily: 'monospace' }}>
                          {w.warranty_code}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          Created: {formatDate(w.created_at)}
                        </div>
                      </td>

                      {/* Product / Material */}
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
                        {w.purchase_info && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Ref: {w.purchase_info}
                          </div>
                        )}
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
                          <div>
                            <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Pending Scan</div>
                            {w.qr_expiry_date && (
                              <div style={{
                                color: new Date(w.qr_expiry_date) < new Date() ? '#ef4444' : '#64748b',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                marginTop: '2px'
                              }}>
                                QR Exp: {formatDate(w.qr_expiry_date)}
                              </div>
                            )}
                          </div>
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
                            Print
                          </button>

                          {/* Quick Card PNG Download */}
                          <button
                            type="button"
                            onClick={() => downloadSingleWarrantyCard(w)}
                            title="Download Warranty Card PNG"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: '#f8fafc',
                              border: '1px solid var(--border-medium)',
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            <Download size={14} />
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
                  Create Product Warranty QR Codes
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

              {/* Source Toggle: Catalog Product / Raw Material vs Manual Custom Entry */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Product / Material Source *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode('catalog');
                      if (formData.productId === 'custom') {
                        setFormData(prev => ({ ...prev, productId: '' }));
                      }
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: creationMode === 'catalog' ? '2px solid #0284c7' : '1.5px solid var(--border-medium)',
                      background: creationMode === 'catalog' ? '#f0f9ff' : '#ffffff',
                      color: creationMode === 'catalog' ? '#0284c7' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Package size={16} />
                    From Catalog Products & Materials ({productsList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreationMode('manual');
                      setSelectedProductPreview(null);
                      setFormData(prev => ({ ...prev, productId: 'custom' }));
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: creationMode === 'manual' ? '2px solid #0284c7' : '1.5px solid var(--border-medium)',
                      background: creationMode === 'manual' ? '#f0f9ff' : '#ffffff',
                      color: creationMode === 'manual' ? '#0284c7' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Sliders size={16} />
                    Custom Material / Manual Item Entry
                  </button>
                </div>
              </div>

              {/* 1A. Catalog Product Selector */}
              {creationMode === 'catalog' ? (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      Select Available Product or Material *
                    </label>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {loadingProducts ? 'Refreshing catalog...' : `${productsList.length} items available`}
                    </span>
                  </div>

                  {/* Filter input for catalog */}
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Type to filter displays, cables, chargers, silicon, SKU..."
                      style={{
                        width: '100%',
                        padding: '7px 10px 7px 32px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

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
                    <option value="">-- Choose a product / material from catalog --</option>
                    {Object.keys(groupedProducts).map(catName => (
                      <optgroup key={catName} label={`📁 ${catName}`}>
                        {groupedProducts[catName].map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.sku ? `(${p.sku})` : ''} • {p.category} {p.inStock ? '• In Stock' : '• Out of Stock'}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="custom_manual">+ ✍️ Or Enter Custom Material / Product Manually</option>
                  </select>
                </div>
              ) : (
                /* 1B. Manual Product / Raw Material Input Fields */
                <div style={{
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Product / Material Name *
                      </label>
                      <input
                        type="text"
                        value={formData.productName}
                        onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                        placeholder="e.g. OLED Display Assembly or 55W Silicon Wire"
                        required
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid var(--border-medium)',
                          fontSize: '0.86rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid var(--border-medium)',
                          fontSize: '0.86rem',
                          background: '#ffffff'
                        }}
                      >
                        <option value="Displays">Displays</option>
                        <option value="Cables">Cables</option>
                        <option value="Chargers">Chargers</option>
                        <option value="Batteries">Batteries</option>
                        <option value="Raw Materials">Raw Materials</option>
                        <option value="Spare Parts">Spare Parts</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        SKU / Material Item Code (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.productSku}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, productSku: val }));
                          if (val) setSerialPrefix(`SN-${val.replace(/[^a-zA-Z0-9]/g, '')}-`);
                        }}
                        placeholder="e.g. MWS-MAT-01"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid var(--border-medium)',
                          fontSize: '0.84rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="MWS Eagle"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid var(--border-medium)',
                          fontSize: '0.84rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Product Preview Card */}
              {selectedProductPreview && creationMode === 'catalog' && (
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

              {/* 2. Number of QR Codes (Quantity / Batch Option) */}
              <div style={{
                background: '#f1f5f9',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Hash size={16} color="#0284c7" />
                    Number of QR Codes to Generate (Quantity) *
                  </label>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0284c7' }}>
                    {batchCount === 1 ? 'Single Warranty QR' : `Batch of ${batchCount} QR Codes`}
                  </span>
                </div>

                {/* Preset Count Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {[1, 5, 10, 25, 50, 100].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setBatchCount(cnt)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: batchCount === cnt ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: batchCount === cnt ? '#0284c7' : '#ffffff',
                        color: batchCount === cnt ? '#ffffff' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {cnt === 1 ? '1 (Single)' : `${cnt} QRs`}
                    </button>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Custom:</span>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={batchCount}
                      onChange={(e) => setBatchCount(Math.max(1, Math.min(500, parseInt(e.target.value, 10) || 1)))}
                      style={{
                        width: '70px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #94a3b8',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>

                {/* Single QR: Serial Number input */}
                {batchCount === 1 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
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
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid var(--border-medium)',
                          fontSize: '0.86rem',
                          fontFamily: 'monospace',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Model (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="e.g. Eagle Pro 2026"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          border: '1.5px solid var(--border-medium)',
                          fontSize: '0.86rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Batch QRs: Prefix and Sequence */
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Serial Number Prefix *
                        </label>
                        <input
                          type="text"
                          value={serialPrefix}
                          onChange={(e) => setSerialPrefix(e.target.value)}
                          placeholder="e.g. SN-MDC102- or SN-"
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1.5px solid var(--border-medium)',
                            fontSize: '0.86rem',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                          Starting Sequence #
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={startSequence}
                          onChange={(e) => setStartSequence(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1.5px solid var(--border-medium)',
                            fontSize: '0.86rem',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{
                      padding: '8px 12px',
                      background: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #93c5fd',
                      fontSize: '0.76rem',
                      color: '#0369a1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Info size={14} style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Preview:</strong> Will generate {batchCount} QR codes with serial numbers from{' '}
                        <code>{serialPrefix}{String(startSequence).padStart(4, '0')}</code> to{' '}
                        <code>{serialPrefix}{String(startSequence + batchCount - 1).padStart(4, '0')}</code>.
                      </span>
                    </div>
                  </div>
                )}
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

              {/* QR Expiration Date */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  QR Expiration Date
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={formData.qrExpiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, qrExpiryDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-medium)',
                      fontSize: '0.88rem',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formData.qrExpiryDate && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, qrExpiryDate: '' }))}
                      style={{
                        padding: '9px 12px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                  Admin-selected expiration date. After this date, scanning this specific QR code will be rejected as expired on the backend.
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
                  rows={2}
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
                  <strong>Important Notice:</strong> Generating {batchCount > 1 ? `these ${batchCount} QR codes` : 'this QR code'} creates records with status <em>"Not Activated"</em>. The warranty start date is authoritative and will begin on the exact day the customer scans and activates it.
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
                  {creating ? 'Generating...' : (batchCount > 1 ? `Generate ${batchCount} Warranty QRs` : 'Generate Warranty QR')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ======= 6. BATCH GENERATED & DOWNLOAD CENTER MODAL ===== */}
      {/* ======================================================== */}
      {batchModalOpen && (
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
            maxWidth: '760px',
            maxHeight: '94vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-medium)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={24} color="#16a34a" />
                <div>
                  <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Successfully Generated {generatedBatch.length} Warranty QRs!
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {generatedBatch[0]?.product_name} • {generatedBatch[0]?.warranty_duration} {generatedBatch[0]?.warranty_duration_unit} {generatedBatch[0]?.warranty_type}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Prominent Action Banner for Downloading All */}
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, #031738 0%, #0c2d6b 100%)',
              color: '#ffffff',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  Download & Print Packaging Center
                </div>
                <div style={{ fontSize: '0.8rem', color: '#93c5fd', marginTop: '2px' }}>
                  Download high-resolution branded cards as ZIP or print multi-sticker sheets
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {/* Download All as ZIP */}
                <button
                  type="button"
                  onClick={() => handleDownloadZip(generatedBatch, `MWS-Warranty-Batch-${generatedBatch.length}QRs.zip`)}
                  disabled={zipPackaging}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 18px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: zipPackaging ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <Download size={17} />
                  {zipPackaging ? `Packaging (${zipProgress.current}/${zipProgress.total})...` : `Download All (${generatedBatch.length}) as ZIP`}
                </button>

                {/* Print Sheet */}
                <button
                  type="button"
                  onClick={() => handleOpenPrintSheet(generatedBatch)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#031738',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={17} />
                  Print Multi-Card Sheet
                </button>
              </div>
            </div>

            {/* Generated Items Table / List */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '12px' }}>
                Generated QRs in this Batch ({generatedBatch.length})
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Serial Number</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Warranty Code</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>QR Preview</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedBatch.map((w, index) => (
                      <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{index + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                          {w.product_code}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>
                          {w.warranty_code}
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          {batchQrImages[w.id] ? (
                            <img src={batchQrImages[w.id]} alt="QR" style={{ width: '40px', height: '40px' }} />
                          ) : (
                            <QrCode size={24} color="#94a3b8" />
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => downloadSingleWarrantyCard(w)}
                              title="Download Single Card PNG"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                color: '#0284c7',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              PNG Card
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenPrintCard(w)}
                              title="View & Print Single Card"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: '#f8fafc',
                                border: '1px solid var(--border-medium)',
                                color: '#334155',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              View Card
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ======= 7. PRINTABLE SINGLE WARRANTY CARD MODAL ======== */}
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
                Print Card
              </button>

              <button
                type="button"
                onClick={() => downloadSingleWarrantyCard(selectedWarrantyCard)}
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
                Download Card PNG
              </button>

              <button
                type="button"
                onClick={() => downloadSingleWarrantyQrOnly(selectedWarrantyCard)}
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
                <QrCode size={15} />
                QR Only PNG
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
                {copiedUrl ? 'Copied URL!' : 'Copy Link'}
              </button>
            </div>

            {/* EXACT PRINTABLE CARD ELEMENT */}
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
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Serial / Code:</span>
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
                        width: '210px',
                        height: '210px',
                        borderRadius: '8px',
                        padding: '8px',
                        background: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        display: 'inline-block'
                      }}
                    />
                  ) : (
                    <div style={{ padding: '60px 0', color: 'var(--text-muted)' }}>
                      Generating QR Image...
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div style={{ textAlign: 'center', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a' }}>
                    Scan with any smartphone camera or MWS Eagle app
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px' }}>
                    Instant digital activation & authentic verification. Keep this card safe.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ======= 8. MULTI-CARD PRINTABLE SHEET MODAL ============ */}
      {/* ======================================================== */}
      {batchSheetModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 1150
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '920px',
            maxHeight: '94vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
          }}>
            <div className="no-print" style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                  Multi-Card Printable Sticker Sheet ({batchSheetWarranties.length} Cards)
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Optimized for sticker paper or A4 printing (Click "Print Sheet" or Ctrl+P to print / save as PDF)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={16} />
                  Print Sheet
                </button>

                <button
                  type="button"
                  onClick={() => setBatchSheetModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Sheet Grid Container */}
            <div style={{ padding: '24px' }}>
              <div
                id="mws-printable-batch-sheet"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px'
                }}
              >
                {batchSheetWarranties.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '2px solid #031738',
                      borderRadius: '10px',
                      padding: '14px',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #0284c7', paddingBottom: '6px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 900, fontSize: '0.86rem', color: '#031738' }}>MWS EAGLE</div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.warranty_duration} {item.warranty_duration_unit} {item.warranty_type}
                      </div>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product_name}
                    </div>

                    <div style={{ textAlign: 'center', padding: '6px 0' }}>
                      {batchQrImages[item.id] ? (
                        <img src={batchQrImages[item.id]} alt="QR" style={{ width: '130px', height: '130px', display: 'inline-block' }} />
                      ) : (
                        <QrCode size={100} color="#0f172a" />
                      )}
                    </div>

                    <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', textAlign: 'center', marginTop: '6px' }}>
                      <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>SERIAL NUMBER</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'monospace', color: '#0284c7' }}>
                        {item.product_code}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '0.62rem', color: '#64748b', marginTop: '6px' }}>
                      Scan to activate official MWS Eagle warranty
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ======= 9. DETAILS & SCAN AUDIT TRAIL MODAL ============ */}
      {/* ======================================================== */}
      {selectedDetails && (
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
            maxWidth: '640px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-medium)'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Warranty Security & Scan History
                </h3>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  ID: {selectedDetails.warranty?.warranty_code}
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

            <div style={{ padding: '24px' }}>
              {/* Product Info */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '14px',
                border: '1px solid #e2e8f0',
                marginBottom: '18px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '0.82rem'
              }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.74rem' }}>Product:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedDetails.warranty?.product_name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.74rem' }}>Serial / Code:</span>
                  <div style={{ fontWeight: 800, color: '#0284c7', fontFamily: 'monospace' }}>{selectedDetails.warranty?.product_code}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.74rem' }}>Duration:</span>
                  <div style={{ fontWeight: 700 }}>{selectedDetails.warranty?.warranty_duration} {selectedDetails.warranty?.warranty_duration_unit}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.74rem' }}>Effective Status:</span>
                  <div style={{ fontWeight: 800, color: '#15803d' }}>{selectedDetails.warranty?.effectiveStatus || selectedDetails.warranty?.status}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.74rem' }}>QR Expiration:</span>
                  <div style={{
                    fontWeight: 700,
                    color: selectedDetails.warranty?.qr_expiry_date && new Date(selectedDetails.warranty.qr_expiry_date) < new Date() ? '#ef4444' : '#0f172a'
                  }}>
                    {formatDate(selectedDetails.warranty?.qr_expiry_date) || 'No Expiration Set'}
                  </div>
                </div>
              </div>

              {/* Customer Registration info */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Registered Customer Information
                </h4>
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem'
                }}>
                  {selectedDetails.warranty?.activated_by_user_id ? (
                    <>
                      <div><strong>Full Name:</strong> {selectedDetails.warranty?.activated_by_name || 'N/A'}</div>
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

      {/* Print Specific CSS to ensure clean printing for both single card and multi-sheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #mws-printable-warranty-card, #mws-printable-warranty-card *,
          #mws-printable-batch-sheet, #mws-printable-batch-sheet * {
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
          #mws-printable-batch-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            background: #ffffff !important;
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
