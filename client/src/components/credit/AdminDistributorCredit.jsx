import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CreditCard,
  Search,
  PlusCircle,
  TrendingUp,
  History,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  X,
  Download,
  Printer,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Percent,
  Settings,
  Play,
  Sliders
} from 'lucide-react';

export const AdminDistributorCredit = () => {
  const [distributors, setDistributors] = useState([]);
  const [stats, setStats] = useState({
    totalDistributors: 0,
    totalAssigned: 0,
    totalUsed: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalAvailable: 0,
    totalAccumulatedInterest: 0,
    totalPayableAll: 0,
    totalDailyInterestAll: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Global Credit Interest Settings State
  const [interestSettings, setInterestSettings] = useState({
    enabled: false,
    defaultMonthlyRate: 1.5,
    startDate: '',
    calcMode: 'calendar_days',
    compounding: false,
    nepalToday: '',
    daysInCurrentMonth: 30
  });
  const [applyCommonToAll, setApplyCommonToAll] = useState(false);
  const [savingInterestSettings, setSavingInterestSettings] = useState(false);
  const [runningInterestJob, setRunningInterestJob] = useState(false);
  const [interestFeedback, setInterestFeedback] = useState(null);
  const [isInterestSettingsOpen, setIsInterestSettingsOpen] = useState(true);

  // Selected distributor for Dedicated Ledger view
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [ledgerData, setLedgerData] = useState({
    summary: null,
    distributor: null,
    transactions: [],
    pagination: { currentPage: 1, totalPages: 1, totalItems: 0, limit: 25 }
  });
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Ledger Filters & Sorting state
  const [ledgerFilters, setLedgerFilters] = useState({
    search: '',
    type: 'ALL',
    startDate: '',
    endDate: '',
    sort: 'newest',
    page: 1,
    limit: 25
  });

  // Modal State for Credit Adjustment (Add / Remove / Set)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustDistributor, setAdjustDistributor] = useState(null);
  const [adjustMode, setAdjustMode] = useState('SET');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState(null);
  const [adjustSuccess, setAdjustSuccess] = useState(null);
  const [showAdjustConfirm, setShowAdjustConfirm] = useState(false);

  // Modal State for Payment Settlement
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDistributor, setPaymentDistributor] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentAllocation, setPaymentAllocation] = useState('PRINCIPAL_FIRST');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  // Modal State for Per-Distributor Interest Settings
  const [isDistInterestModalOpen, setIsDistInterestModalOpen] = useState(false);
  const [distInterestTarget, setDistInterestTarget] = useState(null);
  const [distInterestEnabled, setDistInterestEnabled] = useState(true);
  const [distCustomRate, setDistCustomRate] = useState('');
  const [distStartDate, setDistStartDate] = useState('');
  const [distInterestSaving, setDistInterestSaving] = useState(false);
  const [distInterestMsg, setDistInterestMsg] = useState(null);

  // Modal State for Per-Distributor Interest History
  const [isInterestHistoryOpen, setIsInterestHistoryOpen] = useState(false);
  const [interestHistoryData, setInterestHistoryData] = useState({
    distributor: null,
    summary: null,
    logs: []
  });
  const [loadingInterestHistory, setLoadingInterestHistory] = useState(false);

  // Modal State for Single Transaction Details Inspector
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Load all distributors credit summary + global interest config
  const loadDistributorCredits = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.credits.getDistributorsCredit(query);
      if (res.success) {
        setDistributors(res.distributors || []);
        if (res.stats) setStats(res.stats);
        if (res.interestSettings) setInterestSettings(res.interestSettings);
      }
    } catch (err) {
      console.error('Failed to load distributor credits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDistributorCredits(searchQuery);
  }, [searchQuery]);

  // Save global Credit Interest Settings
  const handleSaveInterestSettings = async (e) => {
    e.preventDefault();
    setSavingInterestSettings(true);
    setInterestFeedback(null);
    try {
      const res = await api.credits.updateInterestSettings({
        enabled: interestSettings.enabled,
        defaultMonthlyRate: Number(interestSettings.defaultMonthlyRate),
        startDate: interestSettings.startDate,
        calcMode: interestSettings.calcMode,
        compounding: interestSettings.compounding,
        applyToAllDistributors: applyCommonToAll
      });
      if (res.success) {
        if (res.settings) setInterestSettings(res.settings);
        setApplyCommonToAll(false);
        setInterestFeedback({ type: 'success', text: res.message });
        loadDistributorCredits(searchQuery);
        if (selectedDistributor) {
          loadLedger(selectedDistributor.distributorId, ledgerFilters);
        }
      } else {
        setInterestFeedback({ type: 'error', text: res.message || 'Could not save settings.' });
      }
    } catch (err) {
      setInterestFeedback({ type: 'error', text: err.message || 'Failed to save interest settings.' });
    } finally {
      setSavingInterestSettings(false);
    }
  };

  // Run Daily Interest Job Manually (Idempotent)
  const handleRunDailyInterestNow = async () => {
    setRunningInterestJob(true);
    setInterestFeedback(null);
    try {
      const res = await api.credits.runDailyInterest({});
      setInterestFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message || 'Daily interest calculation completed.'
      });
      loadDistributorCredits(searchQuery);
      if (selectedDistributor) {
        loadLedger(selectedDistributor.distributorId, ledgerFilters);
      }
    } catch (err) {
      setInterestFeedback({ type: 'error', text: err.message || 'Failed to execute daily interest job.' });
    } finally {
      setRunningInterestJob(false);
    }
  };

  // Load transaction ledger when selecting a distributor or changing filters
  const loadLedger = async (distributorId, filters = ledgerFilters) => {
    if (!distributorId) return;
    setLoadingLedger(true);
    try {
      const res = await api.credits.getDistributorLedger(distributorId, filters);
      if (res.success) {
        setLedgerData({
          summary: res.summary || null,
          distributor: res.distributor || null,
          transactions: res.transactions || [],
          pagination: res.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, limit: 25 }
        });
      }
    } catch (err) {
      console.error('Failed to fetch distributor ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleSelectDistributor = (dist) => {
    setSelectedDistributor(dist);
    const initialFilters = {
      search: '',
      type: 'ALL',
      startDate: '',
      endDate: '',
      sort: 'newest',
      page: 1,
      limit: 25
    };
    setLedgerFilters(initialFilters);
    loadLedger(dist.distributorId, initialFilters);
  };

  const handleFilterChange = (key, value) => {
    const updated = { ...ledgerFilters, [key]: value, page: key === 'page' ? value : 1 };
    setLedgerFilters(updated);
    if (selectedDistributor) {
      loadLedger(selectedDistributor.distributorId, updated);
    }
  };

  const handleClearFilters = () => {
    const cleared = {
      search: '',
      type: 'ALL',
      startDate: '',
      endDate: '',
      sort: 'newest',
      page: 1,
      limit: 25
    };
    setLedgerFilters(cleared);
    if (selectedDistributor) {
      loadLedger(selectedDistributor.distributorId, cleared);
    }
  };

  // Open adjust credit modal
  const openAdjustModal = (dist, e, mode = 'SET') => {
    if (e) e.stopPropagation();
    setAdjustDistributor(dist);
    setAdjustMode(mode);
    setAdjustAmount(mode === 'SET' ? (dist.totalCredit || '') : '');
    setAdjustDescription('');
    setAdjustError(null);
    setAdjustSuccess(null);
    setShowAdjustConfirm(false);
    setIsAdjustModalOpen(true);
  };

  // Open payment settlement modal
  const openPaymentModal = (dist, e) => {
    if (e) e.stopPropagation();
    setPaymentDistributor(dist);
    setPaymentAmount('');
    setPaymentMethod('Bank Transfer');
    setPaymentAllocation('PRINCIPAL_FIRST');
    setPaymentReference('');
    setPaymentDescription('');
    setPaymentError(null);
    setPaymentSuccess(null);
    setShowPaymentConfirm(false);
    setIsPaymentModalOpen(true);
  };

  // Open per-distributor interest modal
  const openDistInterestModal = (dist, e) => {
    if (e) e.stopPropagation();
    setDistInterestTarget(dist);
    setDistInterestEnabled(dist.distributorInterestEnabled !== false);
    setDistCustomRate(dist.isCustomRate && dist.customMonthlyRate !== null ? String(dist.customMonthlyRate) : '');
    setDistStartDate(dist.interestStartDate || '');
    setDistInterestMsg(null);
    setIsDistInterestModalOpen(true);
  };

  // Open per-distributor interest history modal
  const openInterestHistoryModal = async (dist, e) => {
    if (e) e.stopPropagation();
    setIsInterestHistoryOpen(true);
    setLoadingInterestHistory(true);
    try {
      const res = await api.credits.getDistributorInterestHistory(dist.distributorId);
      if (res.success) {
        setInterestHistoryData({
          distributor: res.distributor,
          summary: res.summary,
          logs: res.logs || []
        });
      }
    } catch (err) {
      console.error('Failed to load distributor interest history:', err);
    } finally {
      setLoadingInterestHistory(false);
    }
  };

  const handleSaveDistInterest = async (e) => {
    e.preventDefault();
    if (!distInterestTarget) return;
    setDistInterestSaving(true);
    setDistInterestMsg(null);
    try {
      const res = await api.credits.updateDistributorInterest(distInterestTarget.distributorId, {
        interestEnabled: distInterestEnabled,
        customMonthlyRate: distCustomRate.trim() === '' ? null : Number(distCustomRate),
        interestStartDate: distStartDate.trim() === '' ? null : distStartDate.trim()
      });
      if (res.success) {
        setDistInterestMsg({ type: 'success', text: res.message });
        loadDistributorCredits(searchQuery);
        if (selectedDistributor && selectedDistributor.distributorId === distInterestTarget.distributorId) {
          loadLedger(selectedDistributor.distributorId, ledgerFilters);
        }
        setTimeout(() => {
          setIsDistInterestModalOpen(false);
          setDistInterestMsg(null);
        }, 1000);
      } else {
        setDistInterestMsg({ type: 'error', text: res.message || 'Update failed.' });
      }
    } catch (err) {
      setDistInterestMsg({ type: 'error', text: err.message || 'Failed to update distributor interest.' });
    } finally {
      setDistInterestSaving(false);
    }
  };

  // Submit credit adjustment
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustDistributor) return;
    if (!showAdjustConfirm) {
      setShowAdjustConfirm(true);
      return;
    }

    setAdjustSubmitting(true);
    setAdjustError(null);
    setAdjustSuccess(null);

    try {
      const res = await api.credits.adjustCredit({
        distributorId: adjustDistributor.distributorId,
        amount: Number(adjustAmount),
        mode: adjustMode,
        description: adjustDescription
      });

      if (res.success) {
        setAdjustSuccess(res.message);
        setShowAdjustConfirm(false);
        loadDistributorCredits(searchQuery);

        if (selectedDistributor && selectedDistributor.distributorId === adjustDistributor.distributorId) {
          loadLedger(selectedDistributor.distributorId, ledgerFilters);
        }

        setTimeout(() => {
          setIsAdjustModalOpen(false);
          setAdjustSuccess(null);
        }, 1200);
      } else {
        setAdjustError(res.message || 'Failed to update credit balance.');
        setShowAdjustConfirm(false);
      }
    } catch (err) {
      setAdjustError(err.message || 'Network error occurred while updating credit.');
      setShowAdjustConfirm(false);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Submit payment settlement
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentDistributor) return;
    if (!showPaymentConfirm) {
      setShowPaymentConfirm(true);
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const res = await api.credits.settlePayment({
        distributorId: paymentDistributor.distributorId,
        amount: Number(paymentAmount),
        paymentMethod,
        allocationMode: paymentAllocation,
        referenceId: paymentReference,
        description: paymentDescription
      });

      if (res.success) {
        setPaymentSuccess(res.message);
        setShowPaymentConfirm(false);
        loadDistributorCredits(searchQuery);

        if (selectedDistributor && selectedDistributor.distributorId === paymentDistributor.distributorId) {
          loadLedger(selectedDistributor.distributorId, ledgerFilters);
        }

        setTimeout(() => {
          setIsPaymentModalOpen(false);
          setPaymentSuccess(null);
        }, 1200);
      } else {
        setPaymentError(res.message || 'Failed to record payment settlement.');
        setShowPaymentConfirm(false);
      }
    } catch (err) {
      setPaymentError(err.message || 'Network error recording payment.');
      setShowPaymentConfirm(false);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Export full ledger to CSV
  const handleExportCSV = async () => {
    if (!selectedDistributor) return;
    try {
      const res = await api.credits.getDistributorLedger(selectedDistributor.distributorId, {
        ...ledgerFilters,
        limit: 'all'
      });

      const txns = res.transactions || [];
      if (txns.length === 0) {
        alert('No transactions available to export for this distributor.');
        return;
      }

      const headers = [
        'Transaction ID',
        'Date & Time',
        'Transaction Type',
        'Description',
        'Credit Added (INR)',
        'Credit Removed (INR)',
        'Payment Amount (INR)',
        'Interest Added (INR)',
        'Interest Rate (%)',
        'Principal Used (INR)',
        'Previous Balance (INR)',
        'New Balance (INR)',
        'Outstanding Before (INR)',
        'Outstanding After (INR)',
        'Interest Before (INR)',
        'Interest After (INR)',
        'Payment Method',
        'Reference ID',
        'Order Number',
        'Performed By'
      ];

      const csvRows = [headers.join(',')];

      txns.forEach((t) => {
        const row = [
          `"${t.txn_number || `TXN-${t.id}`}"`,
          `"${formatDateTime(t.created_at)}"`,
          `"${t.transaction_type}"`,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          Number(t.credit_added || 0).toFixed(2),
          Number(t.credit_removed || 0).toFixed(2),
          Number(t.payment_amount || 0).toFixed(2),
          Number(t.interest_amount || 0).toFixed(2),
          t.interest_rate !== null && t.interest_rate !== undefined ? Number(t.interest_rate).toFixed(3) : '',
          Number(t.principal_amount || 0).toFixed(2),
          Number(t.previous_credit || 0).toFixed(2),
          Number(t.new_credit || 0).toFixed(2),
          Number(t.outstanding_before || 0).toFixed(2),
          Number(t.outstanding_after || 0).toFixed(2),
          Number(t.interest_before || 0).toFixed(2),
          Number(t.interest_after || 0).toFixed(2),
          `"${t.payment_method || ''}"`,
          `"${t.reference_id || ''}"`,
          `"${t.reference_order_number || ''}"`,
          `"${t.admin_name || 'System'}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvContent);
      const today = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `MWS_Eagle_Distributor_Ledger_${selectedDistributor.distributorId}_${today}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch (e) {
      console.error('Failed to export CSV:', e);
      alert('Could not generate CSV export. Please try again.');
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'ALLOCATION':
      case 'CREDIT_ADDED':
      case 'INCREASE':
        return { bg: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', label: 'Credit Added' };
      case 'CREDIT_REMOVED':
      case 'DECREASE':
        return { bg: 'rgba(217, 119, 6, 0.1)', color: '#d97706', label: 'Credit Removed' };
      case 'PURCHASE_DEDUCTION':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', label: 'Order Deduction' };
      case 'PAYMENT_SETTLEMENT':
        return { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', label: 'Payment Received' };
      case 'DAILY_INTEREST':
        return { bg: 'rgba(219, 39, 119, 0.12)', color: '#be185d', label: 'Daily Interest' };
      case 'REFUND':
        return { bg: 'rgba(147, 51, 234, 0.1)', color: '#7c3aed', label: 'Order Refund' };
      case 'ADJUSTMENT':
      default:
        return { bg: 'rgba(100, 116, 139, 0.1)', color: '#475569', label: type || 'Adjustment' };
    }
  };

  // Sample calculation preview for ₹1,000 in settings panel
  const sampleDays = interestSettings.calcMode === 'fixed_30' ? 30 : (interestSettings.daysInCurrentMonth || 30);
  const sampleMonthly = (1000 * Number(interestSettings.defaultMonthlyRate || 0)) / 100;
  const sampleDaily = sampleMonthly / sampleDays;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Distributor Credit, Interest & Accounting System
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
            Administer credit lines, configure automatic daily interest, settle payments, and inspect immutable ledgers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsInterestSettingsOpen((prev) => !prev)}
            className="btn"
            style={{
              background: isInterestSettingsOpen ? '#eef2ff' : '#f8fafc',
              border: '1.5px solid #c7d2fe',
              color: '#4338ca',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Percent size={15} />
            Credit Interest Settings
          </button>
          <button
            type="button"
            onClick={() => {
              loadDistributorCredits(searchQuery);
              if (selectedDistributor) {
                loadLedger(selectedDistributor.distributorId, ledgerFilters);
              }
            }}
            className="btn"
            style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              color: '#334155',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Aggregate Credit & Interest Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '14px' }}>
        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Total Credit Assigned</span>
            <CreditCard size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', marginTop: '8px' }}>
            {formatCurrency(stats.totalAssigned)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
            {stats.totalDistributors} distributors
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Outstanding Principal</span>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '8px' }}>
            {formatCurrency(stats.totalOutstanding)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Unpaid credit principal</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', background: '#fdf2f8', border: '1px solid #fbcfe8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9d174d' }}>Accumulated Interest</span>
            <Percent size={18} color="#be185d" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#be185d', marginTop: '8px' }}>
            {formatCurrency(stats.totalAccumulatedInterest)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9d174d', marginTop: '2px' }}>
            Est. {formatCurrency(stats.totalDailyInterestAll)} / day
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9a3412' }}>Total Payable (P + I)</span>
            <TrendingUp size={18} color="#ea580c" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c2410c', marginTop: '8px' }}>
            {formatCurrency(stats.totalPayableAll)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#9a3412', marginTop: '2px' }}>Principal + accrued interest</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Total Payments Settled</span>
            <ArrowUpRight size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669', marginTop: '8px' }}>
            {formatCurrency(stats.totalPaid)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Collected from distributors</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Available Credit</span>
            <ShieldCheck size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16a34a', marginTop: '8px' }}>
            {formatCurrency(stats.totalAvailable)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Remaining buying power</div>
        </div>
      </div>

      {/* 3. Credit Interest Settings Panel */}
      {isInterestSettingsOpen && (
        <div className="glass-panel" style={{
          padding: '22px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
          border: '1.5px solid #c7d2fe'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#eef2ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Settings size={19} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.12rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Credit Interest Settings (Automatic Daily Accrual — Nepal Time: Asia/Kathmandu)
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Automatically calculates daily interest once per business day on each distributor's unpaid principal balance.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '4px 10px',
                borderRadius: '14px',
                fontSize: '0.76rem',
                fontWeight: 800,
                background: interestSettings.enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                color: interestSettings.enabled ? '#059669' : '#475569'
              }}>
                {interestSettings.enabled ? '● AUTOMATIC INTEREST ACTIVE' : '○ INTEREST SYSTEM PAUSED'}
              </span>
              <button
                type="button"
                disabled={runningInterestJob || !interestSettings.enabled}
                onClick={handleRunDailyInterestNow}
                className="btn"
                title={!interestSettings.enabled ? 'Enable interest system first' : 'Calculate today’s daily interest immediately (duplicate-safe)'}
                style={{
                  background: interestSettings.enabled ? '#4338ca' : '#e2e8f0',
                  color: interestSettings.enabled ? '#ffffff' : '#94a3b8',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: interestSettings.enabled ? 'pointer' : 'not-allowed'
                }}
              >
                <Play size={14} />
                {runningInterestJob ? 'Calculating...' : `Run Daily Interest Now (${interestSettings.nepalToday || 'Today'})`}
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveInterestSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              {/* Enable / Disable */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  System Status
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(interestSettings.enabled)}
                    onChange={(e) => setInterestSettings({ ...interestSettings, enabled: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#4338ca', cursor: 'pointer' }}
                  />
                  {interestSettings.enabled ? 'Enabled (Runs Daily)' : 'Disabled (No Charges)'}
                </label>
              </div>

              {/* Default Monthly Interest Rate (%) */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Default Monthly Interest Rate (%)
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={interestSettings.defaultMonthlyRate}
                    onChange={(e) => setInterestSettings({ ...interestSettings, defaultMonthlyRate: e.target.value })}
                    className="form-input"
                    style={{ width: '90px', padding: '6px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '0.92rem' }}
                  />
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {[1, 1.5, 2, 3].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setInterestSettings({ ...interestSettings, defaultMonthlyRate: rate })}
                        style={{
                          padding: '4px 7px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: Number(interestSettings.defaultMonthlyRate) === rate ? '#4338ca' : '#f8fafc',
                          color: Number(interestSettings.defaultMonthlyRate) === rate ? '#ffffff' : '#334155',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculation Method */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Daily Calculation Basis
                </label>
                <select
                  value={interestSettings.calcMode}
                  onChange={(e) => setInterestSettings({ ...interestSettings, calcMode: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <option value="calendar_days">Actual Calendar Days (28/29/30/31)</option>
                  <option value="fixed_30">Fixed 30-Day Month (Monthly ÷ 30)</option>
                </select>
              </div>

              {/* Start Date */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Interest Calculation Start Date
                </label>
                <input
                  type="date"
                  value={interestSettings.startDate || ''}
                  onChange={(e) => setInterestSettings({ ...interestSettings, startDate: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', fontSize: '0.82rem' }}
                />
              </div>

              {/* Compounding Policy */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Interest Calculation Base
                </label>
                <select
                  value={interestSettings.compounding ? 'true' : 'false'}
                  onChange={(e) => setInterestSettings({ ...interestSettings, compounding: e.target.value === 'true' })}
                  className="form-input"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <option value="false">Principal Only (Simple Interest — Default)</option>
                  <option value="true">Principal + Accumulated Interest (Compound)</option>
                </select>
              </div>
            </div>

            {/* Live Example Formula + Apply Common Option + Save Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '12px 14px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                <b>Example on ₹1,000 Principal:</b> At <b>{interestSettings.defaultMonthlyRate || 0}%/month</b> ({sampleDays}-day basis) ={' '}
                <b>₹{sampleMonthly.toFixed(2)}/month</b> → <b style={{ color: '#be185d' }}>₹{sampleDaily.toFixed(2)}/day</b>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={applyCommonToAll}
                    onChange={(e) => setApplyCommonToAll(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#4338ca' }}
                  />
                  Apply this common rate to all distributors (clear custom overrides)
                </label>

                <button
                  type="submit"
                  disabled={savingInterestSettings}
                  className="btn btn-sky"
                  style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  {savingInterestSettings ? 'Saving...' : 'Save Interest Settings'}
                </button>
              </div>
            </div>
          </form>

          {interestFeedback && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: interestFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: interestFeedback.type === 'success' ? '#059669' : '#dc2626',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              {interestFeedback.type === 'success' ? '✓ ' : '⚠️ '}
              {interestFeedback.text}
            </div>
          )}
        </div>
      )}

      {/* 4. Distributor Credit & Interest Management Directory */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Distributor Credit & Individual Interest Management
            </h3>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
              Manage credit limits, customize per-distributor interest rates, inspect daily interest history, or open full ledgers.
            </p>
          </div>

          <div style={{ position: 'relative', minWidth: '280px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by ID, name, business, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                border: '1.5px solid #cbd5e1'
              }}
            />
          </div>
        </div>

        {/* Directory Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 12px' }}>Distributor</th>
                <th style={{ padding: '12px 10px' }}>Credit Limit</th>
                <th style={{ padding: '12px 10px' }}>Outstanding Principal</th>
                <th style={{ padding: '12px 10px' }}>Monthly Rate</th>
                <th style={{ padding: '12px 10px' }}>Daily Interest</th>
                <th style={{ padding: '12px 10px' }}>Accumulated Interest</th>
                <th style={{ padding: '12px 10px' }}>Total Payable (P+I)</th>
                <th style={{ padding: '12px 10px' }}>Interest Status</th>
                <th style={{ padding: '12px 10px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {distributors.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    {loading ? 'Loading distributor credit records...' : 'No distributors found matching query.'}
                  </td>
                </tr>
              ) : (
                distributors.map((d) => {
                  const isSelected = selectedDistributor?.distributorId === d.distributorId;
                  return (
                    <tr
                      key={d.distributorId}
                      onClick={() => handleSelectDistributor(d)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isSelected ? 'rgba(2, 132, 199, 0.05)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = '#ffffff'; }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 800, color: '#0284c7', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {d.distributorId}
                        </div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.fullName}</div>
                        <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                          {d.businessName ? `${d.businessName} • ` : ''}{d.phoneNumber || d.email}
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{formatCurrency(d.totalCredit)}</div>
                        <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                          Avail: {formatCurrency(d.availableCredit)}
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 800, color: Number(d.outstandingBalance || 0) > 0 ? '#dc2626' : '#64748b' }}>
                        {formatCurrency(d.outstandingBalance || 0)}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 800, color: '#4338ca' }}>
                          {Number(d.effectiveMonthlyRate || 0).toFixed(2)}% / mo
                        </div>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: d.isCustomRate ? '#7c3aed' : '#64748b'
                        }}>
                          {d.isCustomRate ? 'Custom Rate' : 'Global Default'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 800, color: '#be185d' }}>
                        {formatCurrency(d.dailyInterestAmount || 0)}/day
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 800, color: Number(d.accumulatedInterest || 0) > 0 ? '#be185d' : '#64748b' }}>
                        {formatCurrency(d.accumulatedInterest || 0)}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 900, color: Number(d.totalPayable || 0) > 0 ? '#c2410c' : '#64748b' }}>
                        {formatCurrency(d.totalPayable || 0)}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          background: d.interestEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.16)',
                          color: d.interestEnabled ? '#059669' : '#475569'
                        }}>
                          {d.interestEnabled ? 'Active' : (!interestSettings.enabled ? 'Global Off' : 'Inactive')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={(e) => openAdjustModal(d, e)}
                            className="btn"
                            title="Adjust credit limit"
                            style={{
                              background: '#0284c7',
                              color: '#ffffff',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Adjust
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openPaymentModal(d, e)}
                            className="btn"
                            title="Record payment settlement"
                            style={{
                              background: '#059669',
                              color: '#ffffff',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Settle
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openDistInterestModal(d, e)}
                            className="btn"
                            title="Configure interest rate or disable for this distributor"
                            style={{
                              background: '#eef2ff',
                              color: '#4338ca',
                              border: '1px solid #c7d2fe',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Sliders size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                            Rate
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openInterestHistoryModal(d, e)}
                            className="btn"
                            title="View daily interest history"
                            style={{
                              background: '#fdf2f8',
                              color: '#be185d',
                              border: '1px solid #fbcfe8',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <History size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                            Interest
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectDistributor(d)}
                            className="btn"
                            style={{
                              background: isSelected ? '#0284c7' : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#334155',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            View Ledgers
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

      {/* 5. Complete Dedicated Distributor-Wise Credit Ledger Section */}
      {selectedDistributor && (
        <div
          id="printable-distributor-ledger"
          className="glass-panel"
          style={{
            padding: '24px',
            borderRadius: '16px',
            background: '#ffffff',
            border: '2px solid #0284c7',
            boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.1)'
          }}
        >
          {/* Ledger Header & Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1.5px solid #e2e8f0'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  fontWeight: 800
                }}>
                  {selectedDistributor.distributorId}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {selectedDistributor.fullName} — Official Credit & Interest Ledger
                </h3>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '6px' }}>
                {selectedDistributor.businessName ? `Business: ${selectedDistributor.businessName} • ` : ''}
                Phone: {selectedDistributor.phoneNumber || '-'} • Email: {selectedDistributor.email || '-'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={(e) => openAdjustModal(selectedDistributor, e)}
                className="btn btn-sky"
                style={{ padding: '7px 12px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusCircle size={15} />
                + Adjust Credit
              </button>
              <button
                type="button"
                onClick={(e) => openPaymentModal(selectedDistributor, e)}
                className="btn"
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle size={15} />
                Record Payment
              </button>
              <button
                type="button"
                onClick={(e) => openInterestHistoryModal(selectedDistributor, e)}
                className="btn"
                style={{
                  background: '#fdf2f8',
                  border: '1.5px solid #fbcfe8',
                  color: '#be185d',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <History size={15} />
                Interest History
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn"
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#334155',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={15} />
                Export CSV
              </button>
              <button
                type="button"
                onClick={handlePrintStatement}
                className="btn"
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#334155',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={15} />
                Print
              </button>
              <button
                type="button"
                onClick={() => setSelectedDistributor(null)}
                className="btn"
                style={{ background: '#f1f5f9', color: '#64748b', padding: '7px 12px', borderRadius: '8px', fontSize: '0.8rem' }}
              >
                Close Ledger
              </button>
            </div>
          </div>

          {/* Distributor Ledger Overview Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Credit Limit Assigned</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.totalCreditAssigned ?? selectedDistributor.totalCredit)}
              </div>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 700 }}>Principal Outstanding</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.currentOutstanding ?? selectedDistributor.outstandingBalance)}
              </div>
            </div>

            <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#9d174d', fontWeight: 700 }}>Accumulated Interest</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#be185d', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.accumulatedInterest ?? selectedDistributor.accumulatedInterest)}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#9d174d', marginTop: '2px' }}>
                {Number(ledgerData.summary?.effectiveMonthlyRate ?? selectedDistributor.effectiveMonthlyRate ?? 0).toFixed(2)}%/mo ({formatCurrency(ledgerData.summary?.dailyInterestAmount ?? selectedDistributor.dailyInterestAmount)}/day)
              </div>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#9a3412', fontWeight: 700 }}>Total Payable (P + I)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#c2410c', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.totalPayable ?? selectedDistributor.totalPayable)}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Paid / Settled</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.totalAmountPaid ?? selectedDistributor.totalPaid)}
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>Available Credit Balance</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.currentAvailable ?? selectedDistributor.availableCredit)}
              </div>
            </div>
          </div>

          {/* Filtering, Search & Sorting Controls */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.84rem', fontWeight: 700 }}>
              <Filter size={16} />
              Filter & Search Transaction History
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Txn ID, Order #, Ref, Note..."
                  value={ledgerFilters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '8px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <select
                  value={ledgerFilters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Transaction Types</option>
                  <option value="DAILY_INTEREST">Daily Interest Added</option>
                  <option value="CREDIT_ADDED">Credit Added / Allocated</option>
                  <option value="CREDIT_REMOVED">Credit Removed / Reduced</option>
                  <option value="PURCHASE_DEDUCTION">Order Deductions</option>
                  <option value="PAYMENT_SETTLEMENT">Payments Received</option>
                  <option value="REFUND">Order Refunds</option>
                  <option value="ADJUSTMENT">Adjustments</option>
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={ledgerFilters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="form-input"
                  title="Start Date"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <input
                  type="date"
                  value={ledgerFilters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="form-input"
                  title="End Date"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <select
                  value={ledgerFilters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn"
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#64748b',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Transaction Ledger Table */}
          {loadingLedger ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Loading verified audit transactions...
            </div>
          ) : ledgerData.transactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No credit transactions found matching the selected filter criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '10px 10px' }}>Txn ID</th>
                    <th style={{ padding: '10px 10px' }}>Date & Time</th>
                    <th style={{ padding: '10px 10px' }}>Type</th>
                    <th style={{ padding: '10px 10px' }}>Description / Reason</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right' }}>Credit (+/-)</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right' }}>Payment</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right' }}>Interest</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right' }}>Principal Debt</th>
                    <th style={{ padding: '10px 10px', textAlign: 'right' }}>Avail. Credit</th>
                    <th style={{ padding: '10px 10px' }}>Ref / Admin</th>
                    <th style={{ padding: '10px 10px', textAlign: 'center' }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.transactions.map((tx) => {
                    const badge = getTransactionBadge(tx.transaction_type);
                    const isOrderDeduction = tx.transaction_type === 'PURCHASE_DEDUCTION';
                    const isPayment = tx.transaction_type === 'PAYMENT_SETTLEMENT';
                    const isDailyInterest = tx.transaction_type === 'DAILY_INTEREST';
                    const isCreditAdded =
                      tx.transaction_type === 'ALLOCATION' ||
                      tx.transaction_type === 'CREDIT_ADDED' ||
                      tx.transaction_type === 'INCREASE' ||
                      Number(tx.credit_added || 0) > 0;
                    const isCreditRemoved =
                      tx.transaction_type === 'CREDIT_REMOVED' ||
                      tx.transaction_type === 'DECREASE' ||
                      (Number(tx.credit_removed || 0) > 0 && !isOrderDeduction);
                    const isRefund = tx.transaction_type === 'REFUND';

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                      >
                        <td style={{ padding: '11px 10px', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7', whiteSpace: 'nowrap' }}>
                          {tx.txn_number || `TXN-${String(tx.id).padStart(6, '0')}`}
                        </td>
                        <td style={{ padding: '11px 10px', color: '#334155', whiteSpace: 'nowrap' }}>
                          {formatDateTime(tx.created_at)}
                        </td>
                        <td style={{ padding: '11px 10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: badge.bg,
                            color: badge.color,
                            whiteSpace: 'nowrap'
                          }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '11px 10px', color: '#1e293b', maxWidth: '220px' }}>
                          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {tx.description || '-'}
                          </div>
                        </td>
                        <td style={{
                          padding: '11px 10px',
                          textAlign: 'right',
                          fontWeight: 800,
                          color: isOrderDeduction || isCreditRemoved ? '#dc2626' : (isCreditAdded || isRefund ? '#0284c7' : '#94a3b8')
                        }}>
                          {isCreditAdded || isRefund
                            ? `+${formatCurrency(tx.credit_added > 0 ? tx.credit_added : tx.amount)}`
                            : isOrderDeduction || isCreditRemoved
                              ? `-${formatCurrency(tx.credit_removed > 0 ? tx.credit_removed : tx.amount)}`
                              : '-'}
                        </td>
                        <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 800, color: isPayment ? '#059669' : '#94a3b8' }}>
                          {isPayment ? `+${formatCurrency(tx.payment_amount > 0 ? tx.payment_amount : tx.amount)}` : '-'}
                        </td>
                        <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 800, color: isDailyInterest ? '#be185d' : (Number(tx.interest_amount || 0) > 0 && isPayment ? '#059669' : '#94a3b8') }}>
                          {isDailyInterest
                            ? `+${formatCurrency(tx.interest_amount || tx.amount)}`
                            : (isPayment && Number(tx.interest_amount || 0) > 0)
                              ? `-${formatCurrency(tx.interest_amount)}`
                              : '-'}
                        </td>
                        <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: Number(tx.outstanding_after || 0) > 0 ? '#dc2626' : '#64748b' }}>
                          {formatCurrency(tx.outstanding_after || 0)}
                        </td>
                        <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          {formatCurrency(tx.new_credit)}
                        </td>
                        <td style={{ padding: '11px 10px', fontSize: '0.74rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          <div style={{ color: '#0284c7', fontWeight: 600 }}>{tx.reference_order_number || tx.reference_id || '-'}</div>
                          <div style={{ color: '#94a3b8' }}>{tx.admin_name || 'System'}</div>
                        </td>
                        <td style={{ padding: '11px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransaction(tx);
                            }}
                            className="btn"
                            style={{
                              background: '#f1f5f9',
                              color: '#0284c7',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={13} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {ledgerData.pagination && ledgerData.pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Showing page <b>{ledgerData.pagination.currentPage}</b> of <b>{ledgerData.pagination.totalPages}</b> ({ledgerData.pagination.totalItems} total transactions)
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  disabled={ledgerData.pagination.currentPage <= 1}
                  onClick={() => handleFilterChange('page', ledgerData.pagination.currentPage - 1)}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: ledgerData.pagination.currentPage <= 1 ? '#f8fafc' : '#ffffff',
                    color: ledgerData.pagination.currentPage <= 1 ? '#94a3b8' : '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: ledgerData.pagination.currentPage <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={14} style={{ verticalAlign: 'middle' }} /> Previous
                </button>
                <button
                  type="button"
                  disabled={ledgerData.pagination.currentPage >= ledgerData.pagination.totalPages}
                  onClick={() => handleFilterChange('page', ledgerData.pagination.currentPage + 1)}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: ledgerData.pagination.currentPage >= ledgerData.pagination.totalPages ? '#f8fafc' : '#ffffff',
                    color: ledgerData.pagination.currentPage >= ledgerData.pagination.totalPages ? '#94a3b8' : '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: ledgerData.pagination.currentPage >= ledgerData.pagination.totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Modal: Per-Distributor Interest Settings */}
      {isDistInterestModalOpen && distInterestTarget && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Distributor Interest Configuration
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                  {distInterestTarget.fullName} ({distInterestTarget.distributorId})
                </div>
              </div>
              <button type="button" onClick={() => setIsDistInterestModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDistInterest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={distInterestEnabled}
                    onChange={(e) => setDistInterestEnabled(e.target.checked)}
                    style={{ width: '17px', height: '17px', accentColor: '#4338ca' }}
                  />
                  Enable Daily Interest for this Distributor
                </label>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', marginLeft: '27px' }}>
                  Uncheck to pause/disable interest exclusively for this distributor without affecting others.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Custom Monthly Interest Rate (%) — Optional
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={distCustomRate}
                  onChange={(e) => setDistCustomRate(e.target.value)}
                  placeholder={`Leave blank to use Global Default (${interestSettings.defaultMonthlyRate}%)`}
                  className="form-input"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700 }}
                />
                <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '4px' }}>
                  Current Principal: <b>{formatCurrency(distInterestTarget.outstandingBalance)}</b> • Preview Daily Interest:{' '}
                  <b style={{ color: '#be185d' }}>
                    {distInterestEnabled && interestSettings.enabled
                      ? formatCurrency(
                          ((Number(distInterestTarget.outstandingBalance || 0) *
                            (distCustomRate.trim() !== '' ? Number(distCustomRate) : Number(interestSettings.defaultMonthlyRate || 0))) /
                            100) /
                            sampleDays
                        )
                      : '₹0.00'}
                    /day
                  </b>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Custom Interest Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={distStartDate}
                  onChange={(e) => setDistStartDate(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              {distInterestMsg && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: distInterestMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: distInterestMsg.type === 'success' ? '#059669' : '#dc2626'
                }}>
                  {distInterestMsg.text}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsDistInterestModalOpen(false)} className="btn" style={{ background: '#f1f5f9', color: '#64748b', padding: '9px 14px', borderRadius: '8px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={distInterestSaving} className="btn btn-sky" style={{ padding: '9px 18px', borderRadius: '8px', fontWeight: 700 }}>
                  {distInterestSaving ? 'Saving...' : 'Save Distributor Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Per-Distributor Interest History Audit Logs */}
      {isInterestHistoryOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '860px', maxHeight: '88vh',
            display: 'flex', flexDirection: 'column', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Daily Interest Audit History {interestHistoryData.distributor ? `— ${interestHistoryData.distributor.fullName}` : ''}
                </h3>
                {interestHistoryData.distributor && (
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                    ID: <b>{interestHistoryData.distributor.distributorId}</b> • {interestHistoryData.distributor.businessName || interestHistoryData.distributor.email}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setIsInterestHistoryOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {interestHistoryData.summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Outstanding Principal</div>
                  <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '1rem' }}>{formatCurrency(interestHistoryData.summary.outstandingPrincipal)}</div>
                </div>
                <div style={{ background: '#fdf2f8', padding: '10px 12px', borderRadius: '10px', border: '1px solid #fbcfe8' }}>
                  <div style={{ fontSize: '0.7rem', color: '#9d174d' }}>Accumulated Interest</div>
                  <div style={{ fontWeight: 800, color: '#be185d', fontSize: '1rem' }}>{formatCurrency(interestHistoryData.summary.accumulatedInterest)}</div>
                </div>
                <div style={{ background: '#fff7ed', padding: '10px 12px', borderRadius: '10px', border: '1px solid #fed7aa' }}>
                  <div style={{ fontSize: '0.7rem', color: '#9a3412' }}>Total Payable (P + I)</div>
                  <div style={{ fontWeight: 900, color: '#c2410c', fontSize: '1rem' }}>{formatCurrency(interestHistoryData.summary.totalPayable)}</div>
                </div>
                <div style={{ background: '#eef2ff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #c7d2fe' }}>
                  <div style={{ fontSize: '0.7rem', color: '#4338ca' }}>Rate / Today's Est.</div>
                  <div style={{ fontWeight: 800, color: '#4338ca', fontSize: '0.94rem' }}>
                    {Number(interestHistoryData.summary.effectiveMonthlyRate || 0).toFixed(2)}%/mo ({formatCurrency(interestHistoryData.summary.dailyInterestAmount)}/d)
                  </div>
                </div>
              </div>
            )}

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingInterestHistory ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading daily interest logs...</div>
              ) : interestHistoryData.logs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No daily interest entries recorded for this distributor yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                      <th style={{ padding: '9px 10px' }}>Business Date</th>
                      <th style={{ padding: '9px 10px' }}>Txn ID</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right' }}>Principal Used</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right' }}>Rate (%/mo)</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right' }}>Daily Interest (+)</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right' }}>Prev Interest</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right' }}>New Interest</th>
                      <th style={{ padding: '9px 10px' }}>Basis / Trigger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interestHistoryData.logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{log.interest_date}</td>
                        <td style={{ padding: '10px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>{log.txn_number}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(log.principal_amount)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#4338ca', fontWeight: 700 }}>{Number(log.monthly_rate).toFixed(2)}%</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#be185d', fontWeight: 800 }}>+{formatCurrency(log.daily_interest)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#64748b' }}>{formatCurrency(log.interest_before)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(log.interest_after)}</td>
                        <td style={{ padding: '10px', fontSize: '0.73rem', color: '#64748b' }}>
                          {log.days_in_month}d • {log.triggered_by}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Transaction Details Inspector */}
      {selectedTransaction && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '560px', padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#0284c7', color: '#ffffff', fontFamily: 'monospace', fontSize: '0.76rem', fontWeight: 800 }}>
                  {selectedTransaction.txn_number || `TXN-${selectedTransaction.id}`}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '6px 0 0', color: '#0f172a' }}>
                  Transaction Audit Record
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedTransaction(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Date & Time</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{formatDateTime(selectedTransaction.created_at)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Transaction Type</div>
                  <div style={{ marginTop: '2px' }}>
                    {(() => {
                      const b = getTransactionBadge(selectedTransaction.transaction_type);
                      return (
                        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, background: b.bg, color: b.color }}>
                          {b.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Transaction Amount</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>{formatCurrency(selectedTransaction.amount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Payment / Calc Method</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedTransaction.payment_method || selectedTransaction.calc_method || 'Account Credit'}
                  </div>
                </div>
              </div>

              {(selectedTransaction.transaction_type === 'DAILY_INTEREST' || Number(selectedTransaction.interest_amount || 0) > 0) && (
                <div style={{ border: '1px solid #fbcfe8', background: '#fdf2f8', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#9d174d', marginBottom: '6px' }}>Interest Accrual Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.82rem' }}>
                    {selectedTransaction.interest_rate !== null && (
                      <div><span style={{ color: '#9d174d' }}>Monthly Rate: </span><b>{Number(selectedTransaction.interest_rate).toFixed(2)}%</b></div>
                    )}
                    {Number(selectedTransaction.principal_amount || 0) > 0 && (
                      <div><span style={{ color: '#9d174d' }}>Principal Used: </span><b>{formatCurrency(selectedTransaction.principal_amount)}</b></div>
                    )}
                    <div><span style={{ color: '#9d174d' }}>Prev Interest: </span><b>{formatCurrency(selectedTransaction.interest_before)}</b></div>
                    <div><span style={{ color: '#9d174d' }}>New Interest: </span><b>{formatCurrency(selectedTransaction.interest_after)}</b></div>
                  </div>
                </div>
              )}

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Balance Impact & Accounting</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                  <div><span style={{ color: '#64748b' }}>Available Before: </span><b>{formatCurrency(selectedTransaction.previous_credit)}</b></div>
                  <div><span style={{ color: '#64748b' }}>Available After: </span><b style={{ color: '#059669' }}>{formatCurrency(selectedTransaction.new_credit)}</b></div>
                  <div><span style={{ color: '#64748b' }}>Principal Debt Before: </span><b>{formatCurrency(selectedTransaction.outstanding_before)}</b></div>
                  <div><span style={{ color: '#64748b' }}>Principal Debt After: </span><b style={{ color: '#dc2626' }}>{formatCurrency(selectedTransaction.outstanding_after)}</b></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Reference / Order #</div>
                  <div style={{ fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>{selectedTransaction.reference_order_number || selectedTransaction.reference_id || 'None'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Authorized By</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedTransaction.admin_name || 'Automated System'}</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Description / Reason</div>
                <div style={{ color: '#1e293b', marginTop: '4px', fontStyle: selectedTransaction.description ? 'normal' : 'italic' }}>
                  {selectedTransaction.description || 'No additional note provided.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button type="button" onClick={() => setSelectedTransaction(null)} className="btn btn-sky" style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700 }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal: Assign / Adjust Credit Limit */}
      {isAdjustModalOpen && adjustDistributor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Manage Distributor Credit Limit</h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                  Distributor: <b>{adjustDistributor.fullName}</b> ({adjustDistributor.distributorId})
                </div>
              </div>
              <button type="button" onClick={() => setIsAdjustModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px', textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Current Limit</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>{formatCurrency(adjustDistributor.totalCredit)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Principal Debt</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>{formatCurrency(adjustDistributor.outstandingBalance || 0)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Remaining Available</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{formatCurrency(adjustDistributor.availableCredit)}</div>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>Credit Operation</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'SET', label: 'Set Absolute Limit' },
                    { id: 'INCREASE', label: '+ Increase Limit' },
                    { id: 'DECREASE', label: '- Decrease Limit' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setAdjustMode(m.id); setShowAdjustConfirm(false); }}
                      style={{
                        padding: '8px 4px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                        border: adjustMode === m.id ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                        background: adjustMode === m.id ? 'rgba(2, 132, 199, 0.1)' : '#ffffff',
                        color: adjustMode === m.id ? '#0284c7' : '#475569', cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>Quick Amount Presets</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[5000, 10000, 25000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => { setAdjustAmount(preset); setShowAdjustConfirm(false); }}
                      style={{
                        padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1',
                        background: Number(adjustAmount) === preset ? '#0284c7' : '#f8fafc',
                        color: Number(adjustAmount) === preset ? '#ffffff' : '#334155',
                        fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  {adjustMode === 'SET' ? 'New Credit Limit Amount (₹) *' : 'Amount to Change (₹) *'}
                </label>
                <input
                  type="number" min="0" step="1" required value={adjustAmount}
                  onChange={(e) => { setAdjustAmount(e.target.value); setShowAdjustConfirm(false); }}
                  placeholder="e.g. 5000, 10000, 25000" className="form-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '0.94rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>Admin Reason / Audit Note (Optional)</label>
                <input
                  type="text" value={adjustDescription} onChange={(e) => setAdjustDescription(e.target.value)}
                  placeholder="e.g. Approved monthly credit line, Season quota, etc." className="form-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              {showAdjustConfirm && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>
                  ⚠️ Please confirm: {adjustMode === 'SET' ? 'set' : adjustMode === 'INCREASE' ? 'increase' : 'decrease'} credit limit by ₹{Number(adjustAmount || 0).toLocaleString('en-IN')}. Click again to execute.
                </div>
              )}

              {adjustError && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>⚠️ {adjustError}</div>}
              {adjustSuccess && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>✓ {adjustSuccess}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="btn" style={{ background: '#f1f5f9', color: '#64748b', padding: '10px 16px', borderRadius: '8px', fontSize: '0.86rem' }}>Cancel</button>
                <button type="submit" disabled={adjustSubmitting} className="btn btn-sky" style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 700 }}>
                  {adjustSubmitting ? 'Saving...' : showAdjustConfirm ? 'Yes, Execute Adjustment' : 'Confirm & Save Credit Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Modal: Record Payment / Settlement */}
      {isPaymentModalOpen && paymentDistributor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Record Payment Settlement</h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                  Distributor: <b>{paymentDistributor.fullName}</b> ({paymentDistributor.distributorId})
                </div>
              </div>
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px', textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Principal Debt</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>{formatCurrency(paymentDistributor.outstandingBalance || 0)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Accrued Interest</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#be185d', marginTop: '2px' }}>{formatCurrency(paymentDistributor.accumulatedInterest || 0)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Payable</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 900, color: '#c2410c', marginTop: '2px' }}>{formatCurrency(paymentDistributor.totalPayable || 0)}</div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>Payment Received Amount (₹) *</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {Number(paymentDistributor.outstandingBalance || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => { setPaymentAmount(paymentDistributor.outstandingBalance); setShowPaymentConfirm(false); }}
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Principal ({formatCurrency(paymentDistributor.outstandingBalance)})
                      </button>
                    )}
                    {Number(paymentDistributor.totalPayable || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => { setPaymentAmount(paymentDistributor.totalPayable); setShowPaymentConfirm(false); }}
                        style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Full P+I ({formatCurrency(paymentDistributor.totalPayable)})
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="number" min="0.01" step="0.01" required value={paymentAmount}
                  onChange={(e) => { setPaymentAmount(e.target.value); setShowPaymentConfirm(false); }}
                  placeholder="e.g. 5000, 10000" className="form-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '0.94rem', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>Payment Method *</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI / QR">UPI / QR Payment</option>
                    <option value="Cash">Cash Deposit</option>
                    <option value="Cheque">Cheque Settlement</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>Payment Allocation</label>
                  <select value={paymentAllocation} onChange={(e) => setPaymentAllocation(e.target.value)} className="form-input" style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <option value="PRINCIPAL_FIRST">Reduce Principal First</option>
                    <option value="INTEREST_FIRST">Clear Interest First</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>Reference ID / UTR / Cheque Number</label>
                <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="e.g. UTR12345678, CHQ-998822" className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>Notes / Audit Remarks (Optional)</label>
                <input type="text" value={paymentDescription} onChange={(e) => setPaymentDescription(e.target.value)} placeholder="e.g. Settled invoice payment" className="form-input" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }} />
              </div>

              {Number(paymentAmount) > 0 && (() => {
                const amt = Number(paymentAmount);
                const pBefore = Number(paymentDistributor.outstandingBalance || 0);
                const iBefore = Number(paymentDistributor.accumulatedInterest || 0);
                let pPaid = 0;
                let iPaid = 0;
                if (paymentAllocation === 'INTEREST_FIRST') {
                  iPaid = Math.min(iBefore, amt);
                  pPaid = Math.min(pBefore, Math.max(0, amt - iPaid));
                } else {
                  pPaid = Math.min(pBefore, amt);
                  iPaid = Math.min(iBefore, Math.max(0, amt - pPaid));
                }
                const newP = Math.max(0, pBefore - pPaid);
                const newI = Math.max(0, iBefore - iPaid);
                return (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Preview Balance Impact After Payment:</div>
                    <div>New Principal Balance: <b>{formatCurrency(newP)}</b> (Daily interest automatically recalculates on {formatCurrency(newP)})</div>
                    <div style={{ marginTop: '2px' }}>Remaining Interest Due: <b>{formatCurrency(newI)}</b></div>
                  </div>
                );
              })()}

              {showPaymentConfirm && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>
                  ⚠️ Please confirm: Record payment of ₹{Number(paymentAmount).toLocaleString('en-IN')} via {paymentMethod}?
                </div>
              )}

              {paymentError && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>⚠️ {paymentError}</div>}
              {paymentSuccess && <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>✓ {paymentSuccess}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn" style={{ background: '#f1f5f9', color: '#64748b', padding: '10px 16px', borderRadius: '8px', fontSize: '0.86rem' }}>Cancel</button>
                <button type="submit" disabled={paymentSubmitting} className="btn" style={{ background: '#059669', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 700 }}>
                  {paymentSubmitting ? 'Recording...' : showPaymentConfirm ? 'Yes, Record Payment' : 'Confirm & Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDistributorCredit;
