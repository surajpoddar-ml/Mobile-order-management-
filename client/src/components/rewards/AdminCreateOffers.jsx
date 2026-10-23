import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Plus,
  Printer,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import { PrintQRCodesModal } from './PrintQRCodesModal';
import { downloadAllAsZip, downloadSingleCard } from '../../utils/qrCardGenerator';

export const AdminCreateOffers = () => {
  // Generation Form State
  const [points, setPoints] = useState(50);
  const [customPoints, setCustomPoints] = useState('');
  const [count, setCount] = useState(1);
  const [title, setTitle] = useState('MWS Eagle Rewards');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // Download ZIP State
  const [zipLoading, setZipLoading] = useState(false);
  const [zipProgress, setZipProgress] = useState({ current: 0, total: 0 });

  // List & Filter State
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState({ all: 0, active: 0, claimed: 0, inactive: 0, totalClaimedPoints: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Claimed' | 'Inactive'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Single View State
  const [printModalTokens, setPrintModalTokens] = useState([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Preset point buttons according to user prompt: 10, 20, 30, 40, 50, 60, 100
  const POINT_PRESETS = [10, 20, 30, 40, 50, 60, 100];

  const loadTokens = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.rewards.admin.getTokens({
        status: statusFilter,
        search: searchTerm,
        limit: 150
      });
      if (res.success) {
        setTokens(res.tokens || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load QR tokens:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTokens();
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setFormMsg({ type: '', text: '' });

    const finalPoints = customPoints ? parseInt(customPoints, 10) : points;
    if (!finalPoints || finalPoints <= 0) {
      return setFormMsg({ type: 'error', text: 'Please specify a valid point value greater than 0.' });
    }

    const parsedCount = parseInt(count, 10);
    if (!parsedCount || parsedCount < 1) {
      return setFormMsg({ type: 'error', text: 'Please enter a valid count of QR codes to generate (minimum 1).' });
    }
    if (parsedCount > 1000) {
      return setFormMsg({ type: 'error', text: 'Batch count cannot exceed 1,000 QR codes at once.' });
    }

    setGenerating(true);
    try {
      const payload = {
        points: finalPoints,
        count: parsedCount,
        title: title.trim() || 'MWS Eagle Rewards',
        description: description.trim(),
        expiryDate: expiryDate || null
      };

      const res = await api.rewards.admin.generateTokens(payload);
      if (res.success) {
        setFormMsg({ type: 'success', text: res.message });
        loadTokens(true);
        // Automatically prompt print preview for the newly generated batch
        if (Array.isArray(res.tokens) && res.tokens.length > 0) {
          setPrintModalTokens(res.tokens);
          setIsPrintModalOpen(true);
        }
      } else {
        setFormMsg({ type: 'error', text: res.message || 'Failed to generate tokens.' });
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to generate tokens.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadZip = async (targetTokens, filename = 'MWS-Eagle-QR-Cards.zip') => {
    if (!Array.isArray(targetTokens) || targetTokens.length === 0) {
      return alert('No QR tokens available to download.');
    }
    setZipLoading(true);
    setZipProgress({ current: 0, total: targetTokens.length });
    try {
      await downloadAllAsZip(targetTokens, filename, (current, total) => {
        setZipProgress({ current, total });
      });
    } catch (err) {
      console.error('Download ZIP error:', err);
      alert('Failed to generate cards ZIP: ' + (err.message || 'Unknown error'));
    } finally {
      setZipLoading(false);
    }
  };

  const handleToggleStatus = async (tok) => {
    if (tok.status === 'Claimed') return;
    const nextStatus = tok.status === 'Active' ? 'Inactive' : 'Active';
    setActionLoadingId(tok.id);
    try {
      const res = await api.rewards.admin.updateTokenStatus(tok.id, nextStatus);
      if (res.success) {
        setTokens((prev) =>
          prev.map((t) => (t.id === tok.id ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to update token status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteToken = async (tok) => {
    if (tok.status === 'Claimed') {
      return alert('Claimed tokens cannot be deleted to preserve financial audit history.');
    }
    if (!window.confirm(`Are you sure you want to delete unclaimed QR token "${tok.token}" (${tok.points} pts)?`)) {
      return;
    }

    setActionLoadingId(tok.id);
    try {
      const res = await api.rewards.admin.deleteToken(tok.id);
      if (res.success) {
        setTokens((prev) => prev.filter((t) => t.id !== tok.id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete token.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopy = (tok) => {
    navigator.clipboard.writeText(tok.token);
    setCopiedId(tok.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrintSingle = (tok) => {
    setPrintModalTokens([tok]);
    setIsPrintModalOpen(true);
  };

  const handlePrintAllActive = () => {
    const activeOnes = tokens.filter((t) => t.status === 'Active');
    if (activeOnes.length === 0) {
      return alert('No active QR tokens found in current list to print.');
    }
    setPrintModalTokens(activeOnes);
    setIsPrintModalOpen(true);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', paddingBottom: '50px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#d97706',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Sparkles size={12} /> QR Offer Generator
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Create & Manage Reward QR Codes
          </h1>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            Generate cryptographic point-based QR codes, print package cards, and audit claim history.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              const activeOnes = tokens.filter((t) => t.status === 'Active');
              handleDownloadZip(activeOnes, 'MWS-Eagle-Active-QR-Cards.zip');
            }}
            disabled={zipLoading || tokens.filter((t) => t.status === 'Active').length === 0}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: zipLoading || tokens.filter((t) => t.status === 'Active').length === 0 ? 'not-allowed' : 'pointer',
              opacity: zipLoading || tokens.filter((t) => t.status === 'Active').length === 0 ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
            }}
          >
            <Download size={16} />
            <span>
              {zipLoading
                ? `Packaging (${zipProgress.current}/${zipProgress.total})...`
                : `Download All Active Cards (${tokens.filter((t) => t.status === 'Active').length}) as ZIP`}
            </span>
          </button>

          <button
            type="button"
            onClick={handlePrintAllActive}
            disabled={tokens.filter((t) => t.status === 'Active').length === 0}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: '1.5px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <Printer size={16} color="#2563eb" />
            <span>Print All Active ({tokens.filter((t) => t.status === 'Active').length})</span>
          </button>
        </div>
      </div>

      {/* Top Quick Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '26px'
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
            Total Generated
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
            {stats.all.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#059669', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
            Active (Unclaimed)
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669' }}>
            {stats.active.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#d97706', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
            Claimed by Users
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d97706' }}>
            {stats.claimed.toLocaleString()}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#2563eb', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
            Total Points Distributed
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb' }}>
            {stats.totalClaimedPoints.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>pts</span>
          </div>
        </div>
      </div>

      {/* 1. GENERATE OFFERS CARD */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 18px -4px rgba(15, 23, 42, 0.05)',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Plus size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
              Generate New Offer QR Codes
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Select points (10, 20, 30, 40, 50, 60, 100 or custom) and generate single or bulk batches
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerate}>
          {/* Point Presets Selector */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Select Point Value *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {POINT_PRESETS.map((pt) => {
                const isSelected = !customPoints && points === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => {
                      setPoints(pt);
                      setCustomPoints('');
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '12px',
                      border: isSelected ? '1.5px solid #f59e0b' : '1.5px solid #cbd5e1',
                      background: isSelected ? 'rgba(245, 158, 11, 0.12)' : '#ffffff',
                      color: isSelected ? '#d97706' : '#334155',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ⭐ {pt} Pts
                  </button>
                );
              })}

              {/* Custom Points Input */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>or Custom:</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Points"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  style={{
                    width: '95px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: customPoints ? '1.5px solid #f59e0b' : '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            {/* Batch Quantity with Manual Input and Presets */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Quantity (Enter Number of QRs) *
                </label>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Up to 1,000 / batch</span>
              </div>
              <input
                type="number"
                min="1"
                max="1000"
                placeholder="Type quantity (e.g. 5, 25, 100)"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  marginBottom: '6px'
                }}
              />
              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>Presets:</span>
                {[1, 5, 10, 25, 50, 100, 250, 500].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    style={{
                      padding: '2px 7px',
                      borderRadius: '6px',
                      border: parseInt(count, 10) === num ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: parseInt(count, 10) === num ? '#eff6ff' : '#ffffff',
                      color: parseInt(count, 10) === num ? '#2563eb' : '#64748b',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Offer / Campaign Title
              </label>
              <input
                type="text"
                placeholder="e.g. MWS Eagle Rewards, Festive Offer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Expiry Date (Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            {/* Notes / Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Internal Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Printed for 5000mAh Battery boxes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Alert Message */}
          {formMsg.text && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: formMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                border: formMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                color: formMsg.type === 'success' ? '#059669' : '#dc2626',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {formMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{formMsg.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={generating}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}
          >
            {generating ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Generating Cryptographic Tokens...</span>
              </>
            ) : (
              <>
                <QrCode size={18} />
                <span>
                  Generate {count} QR Code{count > 1 ? 's' : ''} ({customPoints || points} Points Each)
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. QR TOKENS DIRECTORY & TABLE */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 18px -4px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Table Toolbar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Status Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['All', 'Active', 'Claimed', 'Inactive'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: statusFilter === st ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: statusFilter === st ? '#2563eb' : '#ffffff',
                  color: statusFilter === st ? '#ffffff' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search token ID, title, user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.82rem',
                  outline: 'none',
                  width: '240px'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                background: '#0f172a',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </form>

          {/* Download Visible Cards as ZIP */}
          <button
            type="button"
            onClick={() => handleDownloadZip(tokens, `MWS-Eagle-QR-Cards-${statusFilter.toLowerCase()}.zip`)}
            disabled={zipLoading || tokens.length === 0}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1.5px solid #059669',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: zipLoading || tokens.length === 0 ? 'not-allowed' : 'pointer',
              opacity: zipLoading || tokens.length === 0 ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            <span>
              {zipLoading
                ? `Packaging (${zipProgress.current}/${zipProgress.total})...`
                : `Download Visible (${tokens.length}) as ZIP`}
            </span>
          </button>
        </div>

        {/* Tokens List Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
              Loading reward tokens...
            </div>
          ) : tokens.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
              <QrCode size={32} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
              <div style={{ fontWeight: 800, color: '#334155', fontSize: '0.95rem' }}>No QR Offer Tokens Found</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                {statusFilter !== 'All' ? `No tokens matching status "${statusFilter}"` : 'Use the generator above to create your first QR offer.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Token ID</th>
                  <th style={{ padding: '12px 16px' }}>Campaign Title</th>
                  <th style={{ padding: '12px 16px' }}>Points</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Created Date</th>
                  <th style={{ padding: '12px 16px' }}>Claimant Details</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((tok) => {
                  const isClaimed = tok.status === 'Claimed';
                  const isActive = tok.status === 'Active';

                  return (
                    <tr key={tok.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.84rem' }}>
                      {/* Token ID */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a', letterSpacing: '0.04em' }}>
                            {tok.token}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(tok)}
                            title="Copy Token"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedId === tok.id ? '#16a34a' : '#94a3b8',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                          >
                            {copiedId === tok.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Title & Notes */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{tok.title || 'MWS Points'}</div>
                        {tok.description && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{tok.description}</div>
                        )}
                      </td>

                      {/* Points */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: '#fef3c7',
                            border: '1px solid #fde68a',
                            color: '#d97706',
                            fontWeight: 900,
                            fontSize: '0.82rem',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Sparkles size={12} />
                          {tok.points} pts
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {isClaimed ? (
                          <span
                            style={{
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#059669',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: '10px'
                            }}
                          >
                            Claimed
                          </span>
                        ) : isActive ? (
                          <span
                            style={{
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#2563eb',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: '10px'
                            }}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#64748b',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: '10px'
                            }}
                          >
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.78rem' }}>
                        {formatDate(tok.createdDate)}
                      </td>

                      {/* Claimant */}
                      <td style={{ padding: '14px 16px' }}>
                        {isClaimed && tok.claimantName ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {tok.claimantName}{' '}
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                                ({tok.claimedByRole})
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{tok.claimantEmail}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formatDate(tok.claimedAt)}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Unclaimed</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Print / View Card */}
                          <button
                            type="button"
                            onClick={() => handlePrintSingle(tok)}
                            title="View & Print QR Card"
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            <Printer size={14} />
                          </button>

                          {/* Download Single Branded Card PNG */}
                          <button
                            type="button"
                            onClick={() => downloadSingleCard(tok)}
                            title="Download Branded Card (PNG)"
                            style={{
                              padding: '6px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#059669',
                              cursor: 'pointer'
                            }}
                          >
                            <Download size={14} />
                          </button>

                          {/* Toggle Active / Inactive if unclaimed */}
                          {!isClaimed && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(tok)}
                              disabled={actionLoadingId === tok.id}
                              title={isActive ? 'Deactivate' : 'Activate'}
                              style={{
                                padding: '6px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: isActive ? '#dc2626' : '#059669',
                                cursor: 'pointer'
                              }}
                            >
                              {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                          )}

                          {/* Delete if unclaimed */}
                          {!isClaimed && (
                            <button
                              type="button"
                              onClick={() => handleDeleteToken(tok)}
                              disabled={actionLoadingId === tok.id}
                              title="Delete Unclaimed Token"
                              style={{
                                padding: '6px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#dc2626',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Print QR Codes Modal */}
      <PrintQRCodesModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tokens={printModalTokens}
      />
    </div>
  );
};

export default AdminCreateOffers;
