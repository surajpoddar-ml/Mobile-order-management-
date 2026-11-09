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
  User,
  Phone,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  X,
  FileText
} from 'lucide-react';

export const AdminDistributorCredit = () => {
  const [distributors, setDistributors] = useState([]);
  const [stats, setStats] = useState({
    totalDistributors: 0,
    totalAssigned: 0,
    totalUsed: 0,
    totalAvailable: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState(null);

  // Modal State for Credit Adjustment
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustDistributor, setAdjustDistributor] = useState(null);
  const [adjustMode, setAdjustMode] = useState('SET'); // 'SET' | 'INCREASE' | 'DECREASE'
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState(null);
  const [adjustSuccess, setAdjustSuccess] = useState(null);

  // Ledger state for selected distributor
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

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

  // Load transaction ledger when selecting a distributor
  const handleSelectDistributor = async (dist) => {
    setSelectedDistributor(dist);
    setLoadingLedger(true);
    try {
      const res = await api.credits.getDistributorLedger(dist.distributorId);
      if (res.success) {
        setLedgerTransactions(res.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch distributor ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const openAdjustModal = (dist, e) => {
    if (e) e.stopPropagation();
    setAdjustDistributor(dist);
    setAdjustMode('SET');
    setAdjustAmount(dist.totalCredit || '');
    setAdjustDescription('');
    setAdjustError(null);
    setAdjustSuccess(null);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustDistributor) return;

    const num = Number(adjustAmount);
    if (isNaN(num) || num < 0) {
      setAdjustError('Please enter a valid credit amount.');
      return;
    }

    setAdjustSubmitting(true);
    setAdjustError(null);
    setAdjustSuccess(null);

    try {
      const res = await api.credits.adjustCredit({
        distributorId: adjustDistributor.distributorId,
        amount: num,
        mode: adjustMode,
        description: adjustDescription
      });

      if (res.success) {
        setAdjustSuccess(res.message);
        // Refresh distributor list
        await loadDistributorCredits(searchQuery);
        // Refresh ledger if currently open
        if (selectedDistributor && selectedDistributor.distributorId === adjustDistributor.distributorId) {
          handleSelectDistributor(adjustDistributor);
        }
        setTimeout(() => {
          setIsAdjustModalOpen(false);
        }, 1200);
      } else {
        setAdjustError(res.message || 'Failed to update credit.');
      }
    } catch (err) {
      setAdjustError(err.message || 'An error occurred while updating credit.');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN')}`;
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return String(isoStr);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={24} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Distributor Credit Management
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', opacity: 0.9 }}>
                Admin-controlled distributor credit lines, balance allocation, real-time checkout limits & audit ledger.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadDistributorCredits(searchQuery)}
          className="btn"
          style={{
            background: 'rgba(255, 255, 255, 0.18)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '8px 16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* 2. Aggregate Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Credit Assigned
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284c7', marginTop: '6px' }}>
            {formatCurrency(stats.totalAssigned)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            Across {stats.totalDistributors} registered distributors
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Credit Utilized
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ea580c', marginTop: '6px' }}>
            {formatCurrency(stats.totalUsed)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            Deducted via approved credit orders
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Remaining Available
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
            {formatCurrency(stats.totalAvailable)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
            Available for instant wholesale checkout
          </div>
        </div>
      </div>

      {/* 3. Search and Distributors Table */}
      <div className="glass-panel" style={{
        padding: '20px',
        borderRadius: '16px',
        background: '#ffffff',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Distributor Credit Directory
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Search by Distributor ID, Name, or Business to assign or adjust limits.
            </p>
          </div>

          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search distributor ID, name, business..."
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
                <th style={{ padding: '12px 14px' }}>Assigned Credit</th>
                <th style={{ padding: '12px 14px' }}>Credit Used</th>
                <th style={{ padding: '12px 14px' }}>Remaining Available</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {distributors.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => openAdjustModal(d, e)}
                            className="btn"
                            style={{
                              background: '#0284c7',
                              color: '#ffffff',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Adjust Credit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectDistributor(d)}
                            className="btn"
                            style={{
                              background: isSelected ? '#e2e8f0' : '#f1f5f9',
                              color: '#334155',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            View Ledger
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

      {/* 4. Distributor-wise Ledger Section (when a distributor is selected) */}
      {selectedDistributor && (
        <div className="glass-panel" style={{
          padding: '24px',
          borderRadius: '16px',
          background: '#ffffff',
          border: '1.5px solid #0284c7'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}>
                  {selectedDistributor.distributorId}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {selectedDistributor.fullName} — Credit Ledger
                </h3>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                Total Limit: <b>{formatCurrency(selectedDistributor.totalCredit)}</b> | Used: <b>{formatCurrency(selectedDistributor.usedCredit)}</b> | Available: <b style={{ color: '#059669' }}>{formatCurrency(selectedDistributor.availableCredit)}</b>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={(e) => openAdjustModal(selectedDistributor, e)}
                className="btn btn-sky"
                style={{ padding: '7px 14px', fontSize: '0.82rem', fontWeight: 700 }}
              >
                + Update Credit Limit
              </button>
              <button
                type="button"
                onClick={() => setSelectedDistributor(null)}
                className="btn"
                style={{ background: '#f1f5f9', color: '#64748b', padding: '7px 12px', borderRadius: '8px', fontSize: '0.82rem' }}
              >
                Close Ledger
              </button>
            </div>
          </div>

          {loadingLedger ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              Loading audit transactions...
            </div>
          ) : ledgerTransactions.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
              No credit transactions or purchases recorded for this distributor yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px' }}>Date & Time</th>
                    <th style={{ padding: '10px 12px' }}>Type</th>
                    <th style={{ padding: '10px 12px' }}>Amount</th>
                    <th style={{ padding: '10px 12px' }}>Previous Balance</th>
                    <th style={{ padding: '10px 12px' }}>New Balance</th>
                    <th style={{ padding: '10px 12px' }}>Order Ref / Note</th>
                    <th style={{ padding: '10px 12px' }}>Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerTransactions.map((tx) => {
                    const isDeduction = tx.transaction_type === 'PURCHASE_DEDUCTION';
                    const isRefund = tx.transaction_type === 'REFUND';
                    const isAllocation = tx.transaction_type === 'ALLOCATION';

                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', color: '#334155', whiteSpace: 'nowrap' }}>
                          {formatDateTime(tx.created_at)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: isDeduction ? 'rgba(239, 68, 68, 0.1)' : (isRefund ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 132, 199, 0.1)'),
                            color: isDeduction ? '#dc2626' : (isRefund ? '#059669' : '#0284c7')
                          }}>
                            {isDeduction ? 'PURCHASE DEDUCTION' : (isRefund ? 'ORDER REFUND' : tx.transaction_type)}
                          </span>
                        </td>
                        <td style={{
                          padding: '12px',
                          fontWeight: 800,
                          color: isDeduction ? '#dc2626' : '#059669'
                        }}>
                          {isDeduction ? '-' : '+'}{formatCurrency(tx.amount)}
                        </td>
                        <td style={{ padding: '12px', color: '#64748b' }}>
                          {formatCurrency(tx.previous_credit)}
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>
                          {formatCurrency(tx.new_credit)}
                        </td>
                        <td style={{ padding: '12px', color: '#334155' }}>
                          {tx.reference_order_number && (
                            <span style={{ fontWeight: 700, color: '#0284c7', marginRight: '6px' }}>
                              {tx.reference_order_number}
                            </span>
                          )}
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {tx.description || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: '0.78rem' }}>
                          {tx.admin_name || 'System'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Modal: Assign / Adjust Credit Limit */}
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
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Manage Distributor Credit
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                  Distributor: <b>{adjustDistributor.fullName}</b> ({adjustDistributor.distributorId})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#94a3b8'
                }}
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
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Used Credit</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                  {formatCurrency(adjustDistributor.usedCredit)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Remaining</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                  {formatCurrency(adjustDistributor.availableCredit)}
                </div>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit}>
              {/* Action Mode Toggle */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Adjustment Action
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
                      onClick={() => setAdjustMode(m.id)}
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
                      onClick={() => setAdjustAmount(preset)}
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
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 5000, 10000, 25000"
                  className="form-input"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '0.94rem', fontWeight: 700 }}
                />
              </div>

              {/* Description / Audit Note */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Admin Reason / Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  placeholder="e.g. Approved monthly credit line, Season bonus, etc."
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              {/* Status Alerts */}
              {adjustError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '14px'
                }}>
                  ⚠️ {adjustError}
                </div>
              )}

              {adjustSuccess && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '14px'
                }}>
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
                  {adjustSubmitting ? 'Saving...' : 'Confirm & Save Credit Limit'}
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

