import React, { useState, useEffect, useMemo } from 'react';
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
  User,
  Phone,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  X,
  FileText,
  Download,
  Printer,
  Filter,
  Calendar,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AdminDistributorCredit = () => {
  const [distributors, setDistributors] = useState([]);
  const [stats, setStats] = useState({
    totalDistributors: 0,
    totalAssigned: 0,
    totalUsed: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    totalAvailable: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

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
  const [adjustMode, setAdjustMode] = useState('SET'); // 'SET' | 'INCREASE' | 'DECREASE'
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
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  // Modal State for Single Transaction Details Inspector
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Format currency helper
  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date time helper
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

  // Load all distributors credit summary
  const loadDistributorCredits = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.credits.getDistributorsCredit(query);
      if (res.success) {
        setDistributors(res.distributors || []);
        if (res.stats) {
          setStats(res.stats);
        }
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
    setPaymentReference('');
    setPaymentDescription('');
    setPaymentError(null);
    setPaymentSuccess(null);
    setShowPaymentConfirm(false);
    setIsPaymentModalOpen(true);
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
      // Fetch all transactions for this distributor
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
        'Previous Balance (INR)',
        'New Balance (INR)',
        'Outstanding Before (INR)',
        'Outstanding After (INR)',
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
          Number(t.previous_credit || 0).toFixed(2),
          Number(t.new_credit || 0).toFixed(2),
          Number(t.outstanding_before || 0).toFixed(2),
          Number(t.outstanding_after || 0).toFixed(2),
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

  // Print Statement / PDF
  const handlePrintStatement = () => {
    window.print();
  };

  // Helper for badge style per transaction type
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
      case 'REFUND':
        return { bg: 'rgba(147, 51, 234, 0.1)', color: '#7c3aed', label: 'Order Refund' };
      case 'ADJUSTMENT':
      default:
        return { bg: 'rgba(100, 116, 139, 0.1)', color: '#475569', label: type || 'Adjustment' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Distributor Credit & Accounting System
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
            Administer credit lines, inspect immutable transaction ledgers, settle payments, and track distributor balances.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
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

      {/* 2. Aggregate Credit Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Active Distributors</span>
            <Building2 size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {stats.totalDistributors}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>Registered wholesale partners</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Total Credit Assigned</span>
            <CreditCard size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', marginTop: '8px' }}>
            {formatCurrency(stats.totalAssigned)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>Total credit limit authorized</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Total Consumed</span>
            <ArrowDownRight size={20} color="#ea580c" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ea580c', marginTop: '8px' }}>
            {formatCurrency(stats.totalUsed)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>Credit spent on purchases</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Total Payments Settled</span>
            <ArrowUpRight size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '8px' }}>
            {formatCurrency(stats.totalPaid)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>Collected from distributors</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Outstanding Debt</span>
            <AlertTriangle size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginTop: '8px' }}>
            {formatCurrency(stats.totalOutstanding)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>Pending receivables</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Available Credit</span>
            <ShieldCheck size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '8px' }}>
            {formatCurrency(stats.totalAvailable)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>Remaining buying power</div>
        </div>
      </div>

      {/* 3. Distributor Directory Table with Quick Filters */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Distributor Credit Management Directory
            </h3>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
              Select any distributor to inspect their dedicated transaction ledger, adjust limits, or record payments.
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
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 14px' }}>Distributor ID</th>
                <th style={{ padding: '12px 14px' }}>Name & Business</th>
                <th style={{ padding: '12px 14px' }}>Credit Limit</th>
                <th style={{ padding: '12px 14px' }}>Used</th>
                <th style={{ padding: '12px 14px' }}>Outstanding Debt</th>
                <th style={{ padding: '12px 14px' }}>Available Credit</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {distributors.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
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
                      <td style={{ padding: '14px', fontWeight: 800, color: '#0284c7', fontFamily: 'monospace' }}>
                        {d.distributorId}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.fullName}</div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                          {d.businessName ? `${d.businessName} • ` : ''}{d.phoneNumber || d.email}
                        </div>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 800, color: '#1e293b' }}>
                        {formatCurrency(d.totalCredit)}
                      </td>
                      <td style={{ padding: '14px', fontWeight: 700, color: '#ea580c' }}>
                        {formatCurrency(d.usedCredit)}
                      </td>
                      <td style={{ padding: '14px', fontWeight: 700, color: Number(d.outstandingBalance || 0) > 0 ? '#dc2626' : '#64748b' }}>
                        {formatCurrency(d.outstandingBalance || 0)}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          background: d.availableCredit > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: d.availableCredit > 0 ? '#059669' : '#dc2626'
                        }}>
                          {formatCurrency(d.availableCredit)}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => openAdjustModal(d, e)}
                            className="btn"
                            title="Adjust or set credit limit"
                            style={{
                              background: '#0284c7',
                              color: '#ffffff',
                              padding: '6px 10px',
                              borderRadius: '7px',
                              fontSize: '0.76rem',
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
                            title="Record payment received from distributor"
                            style={{
                              background: '#059669',
                              color: '#ffffff',
                              padding: '6px 10px',
                              borderRadius: '7px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Settle Payment
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectDistributor(d)}
                            className="btn"
                            style={{
                              background: isSelected ? '#0284c7' : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#334155',
                              padding: '6px 10px',
                              borderRadius: '7px',
                              fontSize: '0.76rem',
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

      {/* 4. Complete Dedicated Distributor-Wise Credit Ledger Section */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  {selectedDistributor.fullName} — Official Credit Ledger
                </h3>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: selectedDistributor.accountStatus === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: selectedDistributor.accountStatus === 'Active' ? '#059669' : '#dc2626'
                }}>
                  {selectedDistributor.accountStatus || 'Active'}
                </span>
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
                Print Statement
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Credit Limit Assigned</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.totalCreditAssigned ?? selectedDistributor.totalCredit)}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Amount Added / Approved</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.totalAmountAdded ?? selectedDistributor.totalCredit)}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Orders Deducted</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.totalOrderDeducted ?? selectedDistributor.usedCredit)}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Paid / Settled</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.totalAmountPaid ?? selectedDistributor.totalPaid)}
              </div>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 700 }}>Current Outstanding Debt</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.currentOutstanding ?? selectedDistributor.outstandingBalance)}
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>Available Credit Balance</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                {formatCurrency(ledgerData.summary?.currentAvailable ?? selectedDistributor.availableCredit)}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Transactions / Last Date</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', marginTop: '4px' }}>
                {ledgerData.summary?.totalTransactions ?? 0} txns
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                {ledgerData.summary?.lastTransactionDate ? formatDateTime(ledgerData.summary.lastTransactionDate) : 'No transactions'}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {/* Text Search */}
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

              {/* Transaction Type Filter */}
              <div>
                <select
                  value={ledgerFilters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Transaction Types</option>
                  <option value="CREDIT_ADDED">Credit Added / Allocated</option>
                  <option value="CREDIT_REMOVED">Credit Removed / Reduced</option>
                  <option value="PURCHASE_DEDUCTION">Order Deductions</option>
                  <option value="PAYMENT_SETTLEMENT">Payments Received</option>
                  <option value="REFUND">Order Refunds</option>
                  <option value="ADJUSTMENT">Adjustments</option>
                </select>
              </div>

              {/* Start Date */}
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

              {/* End Date */}
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

              {/* Sort Order */}
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

              {/* Clear Filters Button */}
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
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', display: 'block' }} />
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
                    <th style={{ padding: '10px 12px' }}>Txn ID</th>
                    <th style={{ padding: '10px 12px' }}>Date & Time</th>
                    <th style={{ padding: '10px 12px' }}>Type</th>
                    <th style={{ padding: '10px 12px' }}>Description / Reason</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Credit Added (+)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Credit Removed (-)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Payment Received</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Outstanding Debt</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Remaining Balance</th>
                    <th style={{ padding: '10px 12px' }}>Reference / Order</th>
                    <th style={{ padding: '10px 12px' }}>Admin</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.transactions.map((tx) => {
                    const badge = getTransactionBadge(tx.transaction_type);
                    const isOrderDeduction = tx.transaction_type === 'PURCHASE_DEDUCTION';
                    const isPayment = tx.transaction_type === 'PAYMENT_SETTLEMENT';
                    const isCreditAdded = tx.transaction_type === 'ALLOCATION' || tx.transaction_type === 'CREDIT_ADDED' || tx.transaction_type === 'INCREASE' || Number(tx.credit_added || 0) > 0;
                    const isCreditRemoved = tx.transaction_type === 'CREDIT_REMOVED' || tx.transaction_type === 'DECREASE' || (Number(tx.credit_removed || 0) > 0 && !isOrderDeduction);
                    const isRefund = tx.transaction_type === 'REFUND';

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                      >
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 800, color: '#0284c7', whiteSpace: 'nowrap' }}>
                          {tx.txn_number || `TXN-${String(tx.id).padStart(6, '0')}`}
                        </td>
                        <td style={{ padding: '12px', color: '#334155', whiteSpace: 'nowrap' }}>
                          {formatDateTime(tx.created_at)}
                        </td>
                        <td style={{ padding: '12px' }}>
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
                        <td style={{ padding: '12px', color: '#1e293b', maxWidth: '220px' }}>
                          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {tx.description || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: isCreditAdded || isRefund ? '#0284c7' : '#94a3b8' }}>
                          {isCreditAdded || isRefund ? `+${formatCurrency(tx.credit_added > 0 ? tx.credit_added : tx.amount)}` : '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: isOrderDeduction || isCreditRemoved ? '#dc2626' : '#94a3b8' }}>
                          {isOrderDeduction || isCreditRemoved ? `-${formatCurrency(tx.credit_removed > 0 ? tx.credit_removed : tx.amount)}` : '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: isPayment ? '#059669' : '#94a3b8' }}>
                          {isPayment ? `+${formatCurrency(tx.payment_amount > 0 ? tx.payment_amount : tx.amount)}` : '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: Number(tx.outstanding_after || 0) > 0 ? '#dc2626' : '#64748b' }}>
                          {formatCurrency(tx.outstanding_after || 0)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                          {formatCurrency(tx.new_credit)}
                        </td>
                        <td style={{ padding: '12px', color: '#0284c7', whiteSpace: 'nowrap' }}>
                          {tx.reference_order_number || tx.reference_id || '-'}
                        </td>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                          {tx.admin_name || 'System'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
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

      {/* 5. Modal: Transaction Details Inspector */}
      {selectedTransaction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '0.76rem',
                  fontWeight: 800
                }}>
                  {selectedTransaction.txn_number || `TXN-${selectedTransaction.id}`}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '6px 0 0', color: '#0f172a' }}>
                  Transaction Audit Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Date & Time</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {formatDateTime(selectedTransaction.created_at)}
                  </div>
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
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                    {formatCurrency(selectedTransaction.amount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Payment Method</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedTransaction.payment_method || 'System / Account Credit'}
                  </div>
                </div>
              </div>

              {/* Running Balance Impact Card */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  Balance Impact & Accounting
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Available Before: </span>
                    <b>{formatCurrency(selectedTransaction.previous_credit)}</b>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Available After: </span>
                    <b style={{ color: '#059669' }}>{formatCurrency(selectedTransaction.new_credit)}</b>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Debt Before: </span>
                    <b>{formatCurrency(selectedTransaction.outstanding_before)}</b>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Debt After: </span>
                    <b style={{ color: '#dc2626' }}>{formatCurrency(selectedTransaction.outstanding_after)}</b>
                  </div>
                </div>
              </div>

              {/* Reference & Performed By */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Reference / Order #</div>
                  <div style={{ fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                    {selectedTransaction.reference_order_number || selectedTransaction.reference_id || 'None'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Authorized By</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedTransaction.admin_name || 'Automated System'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Description / Reason</div>
                <div style={{ color: '#1e293b', marginTop: '4px', fontStyle: selectedTransaction.description ? 'normal' : 'italic' }}>
                  {selectedTransaction.description || 'No additional note provided.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="btn btn-sky"
                style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700 }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Assign / Adjust Credit Limit */}
      {isAdjustModalOpen && adjustDistributor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Manage Distributor Credit Limit
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                  Distributor: <b>{adjustDistributor.fullName}</b> ({adjustDistributor.distributorId})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Current Balance Overview */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '18px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Current Limit</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                  {formatCurrency(adjustDistributor.totalCredit)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Outstanding Debt</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                  {formatCurrency(adjustDistributor.outstandingBalance || 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Remaining Available</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  {formatCurrency(adjustDistributor.availableCredit)}
                </div>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit}>
              {/* Action Mode Toggle */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Credit Operation
                </label>
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
                        padding: '8px 4px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: adjustMode === m.id ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                        background: adjustMode === m.id ? 'rgba(2, 132, 199, 0.1)' : '#ffffff',
                        color: adjustMode === m.id ? '#0284c7' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Presets */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Quick Amount Presets
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[5000, 10000, 25000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => { setAdjustAmount(preset); setShowAdjustConfirm(false); }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: Number(adjustAmount) === preset ? '#0284c7' : '#f8fafc',
                        color: Number(adjustAmount) === preset ? '#ffffff' : '#334155',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  {adjustMode === 'SET' ? 'New Credit Limit Amount (₹) *' : 'Amount to Change (₹) *'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={adjustAmount}
                  onChange={(e) => { setAdjustAmount(e.target.value); setShowAdjustConfirm(false); }}
                  placeholder="e.g. 5000, 10000, 25000"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '0.94rem', fontWeight: 700 }}
                />
              </div>

              {/* Description / Audit Note */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Admin Reason / Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  placeholder="e.g. Approved monthly credit line, Season quota, etc."
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              {/* Pre-Confirmation Box */}
              {showAdjustConfirm && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '14px'
                }}>
                  ⚠️ Please confirm: You are about to {adjustMode === 'SET' ? 'set' : (adjustMode === 'INCREASE' ? 'increase' : 'decrease')} the credit limit by ₹{Number(adjustAmount || 0).toLocaleString('en-IN')}. This will update the distributor's balance and create an immutable audit record. Click again to execute.
                </div>
              )}

              {/* Status Alerts */}
              {adjustError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>
                  ⚠️ {adjustError}
                </div>
              )}

              {adjustSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>
                  ✓ {adjustSuccess}
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="btn"
                  style={{ background: '#f1f5f9', color: '#64748b', padding: '10px 16px', borderRadius: '8px', fontSize: '0.86rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="btn btn-sky"
                  style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 700 }}
                >
                  {adjustSubmitting ? 'Saving...' : showAdjustConfirm ? 'Yes, Execute Adjustment' : 'Confirm & Save Credit Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Record Payment / Settlement */}
      {isPaymentModalOpen && paymentDistributor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Record Payment Settlement
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                  Distributor: <b>{paymentDistributor.fullName}</b> ({paymentDistributor.distributorId})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Current Financial Balance Overview */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '18px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Assigned Limit</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                  {formatCurrency(paymentDistributor.totalCredit)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Current Debt</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                  {formatCurrency(paymentDistributor.outstandingBalance || 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Available Credit</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  {formatCurrency(paymentDistributor.availableCredit)}
                </div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              {/* Payment Amount Input */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    Payment Received Amount (₹) *
                  </label>
                  {Number(paymentDistributor.outstandingBalance || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => { setPaymentAmount(paymentDistributor.outstandingBalance); setShowPaymentConfirm(false); }}
                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      Pay Full Debt ({formatCurrency(paymentDistributor.outstandingBalance)})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => { setPaymentAmount(e.target.value); setShowPaymentConfirm(false); }}
                  placeholder="e.g. 5000, 10000"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '0.94rem', fontWeight: 700 }}
                />
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }}
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="UPI / QR">UPI / QR Payment</option>
                  <option value="Cash">Cash Deposit</option>
                  <option value="Cheque">Cheque Settlement</option>
                  <option value="Adjustment Voucher">Adjustment Voucher</option>
                </select>
              </div>

              {/* Reference ID / Cheque # */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Reference ID / UTR / Cheque Number
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UTR12345678, CHQ-998822"
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Notes / Audit Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="e.g. Settled invoice payment for batch order"
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              {/* Live Preview of Balances */}
              {Number(paymentAmount) > 0 && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                    Preview Balance Impact After Payment:
                  </div>
                  <div style={{ color: '#334155' }}>
                    New Outstanding Debt: <b>{formatCurrency(Math.max(0, Number(paymentDistributor.outstandingBalance || 0) - Number(paymentAmount)))}</b>
                  </div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>
                    Restored Available Credit: <b>{formatCurrency(Math.max(0, Number(paymentDistributor.totalCredit || 0) - Math.max(0, Number(paymentDistributor.outstandingBalance || 0) - Number(paymentAmount))))}</b>
                  </div>
                </div>
              )}

              {/* Pre-Confirmation Box */}
              {showPaymentConfirm && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '14px'
                }}>
                  ⚠️ Please confirm: Record payment of ₹{Number(paymentAmount).toLocaleString('en-IN')} via {paymentMethod}? This action will reduce outstanding debt and restore credit.
                </div>
              )}

              {/* Status Alerts */}
              {paymentError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>
                  ⚠️ {paymentError}
                </div>
              )}

              {paymentSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>
                  ✓ {paymentSuccess}
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn"
                  style={{ background: '#f1f5f9', color: '#64748b', padding: '10px 16px', borderRadius: '8px', fontSize: '0.86rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="btn"
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 700
                  }}
                >
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
