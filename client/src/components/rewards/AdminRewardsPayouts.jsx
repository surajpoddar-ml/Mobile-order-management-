import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Users,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Settings,
  DollarSign,
  ShieldCheck,
  X,
  CreditCard,
  Send
} from 'lucide-react';
import api from '../../services/api';

export const AdminRewardsPayouts = () => {
  const [activeTab, setActiveTab] = useState('redemptions'); // 'redemptions' | 'users' | 'settings'
  const [metrics, setMetrics] = useState({
    totalTokens: 0,
    claimedTokens: 0,
    activeTokens: 0,
    totalPointsDistributed: 0,
    pendingPayoutsCount: 0,
    pendingPayoutsCash: 0,
    pendingPayoutsPoints: 0,
    completedPayoutsCount: 0,
    totalPayoutsPaidAmount: 0,
    totalUsersWithPoints: 0,
    totalOutstandingUserBalance: 0,
    settings: { rate: 1.0, minPoints: 50 }
  });

  // Redemptions state
  const [redemptions, setRedemptions] = useState([]);
  const [redemptionStatusFilter, setRedemptionStatusFilter] = useState('All');
  const [redemptionSearch, setRedemptionSearch] = useState('');
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  // User accounts directory state
  const [rewardUsers, setRewardUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Configurable Settings State
  const [rateInput, setRateInput] = useState('1.0');
  const [minPointsInput, setMinPointsInput] = useState('50');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' });

  // Modals for Payout actions
  const [payModalItem, setPayModalItem] = useState(null);
  const [txnRefInput, setTxnRefInput] = useState('');
  const [payNotesInput, setPayNotesInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Load Dashboard Overview Metrics
  const loadDashboardMetrics = async () => {
    try {
      const res = await api.rewards.admin.getDashboard();
      if (res.success && res.metrics) {
        setMetrics(res.metrics);
        if (res.metrics.settings) {
          setRateInput(String(res.metrics.settings.rate || 1.0));
          setMinPointsInput(String(res.metrics.settings.minPoints || 50));
        }
      }
    } catch (err) {
      console.error('Failed to load rewards dashboard metrics:', err);
    }
  };

  // Load Redemptions List
  const loadRedemptions = async (isSilent = false) => {
    if (!isSilent) setLoadingRedemptions(true);
    try {
      const res = await api.rewards.admin.getRedemptions({
        status: redemptionStatusFilter,
        search: redemptionSearch
      });
      if (res.success) {
        setRedemptions(res.redemptions || []);
      }
    } catch (err) {
      console.error('Failed to load redemptions:', err);
    } finally {
      if (!isSilent) setLoadingRedemptions(false);
    }
  };

  // Load Users Directory
  const loadUsers = async (isSilent = false) => {
    if (!isSilent) setLoadingUsers(true);
    try {
      const res = await api.rewards.admin.getUsers({
        userType: userRoleFilter,
        search: userSearch
      });
      if (res.success) {
        setRewardUsers(res.users || []);
      }
    } catch (err) {
      console.error('Failed to load reward users:', err);
    } finally {
      if (!isSilent) setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadDashboardMetrics();
    loadRedemptions();
  }, [redemptionStatusFilter]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, userRoleFilter]);

  const handleUpdateStatus = async (id, status, extra = {}) => {
    setActionLoading(true);
    try {
      const res = await api.rewards.admin.updateRedemptionStatus(id, {
        status,
        ...extra
      });
      if (res.success) {
        loadRedemptions(true);
        loadDashboardMetrics();
        setPayModalItem(null);
        setRejectModalItem(null);
        setTxnRefInput('');
        setPayNotesInput('');
        setRejectReasonInput('');
      } else {
        alert(res.message || 'Failed to update redemption status.');
      }
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsMsg({ type: '', text: '' });
    setSavingSettings(true);

    try {
      const res = await api.rewards.admin.updateSettings({
        rate: parseFloat(rateInput),
        minPoints: parseInt(minPointsInput, 10)
      });
      if (res.success) {
        setSettingsMsg({ type: 'success', text: 'Reward conversion settings updated successfully!' });
        loadDashboardMetrics();
      } else {
        setSettingsMsg({ type: 'error', text: res.message || 'Failed to update settings.' });
      }
    } catch (err) {
      setSettingsMsg({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSavingSettings(false);
    }
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669', label: 'Paid' };
      case 'Approved':
        return { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', label: 'Approved' };
      case 'Processing':
        return { bg: '#fef3c7', border: '#fde68a', color: '#d97706', label: 'Processing' };
      case 'Rejected':
        return { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', label: 'Rejected' };
      default:
        return { bg: '#f1f5f9', border: '#cbd5e1', color: '#64748b', label: 'Pending' };
    }
  };

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', paddingBottom: '50px' }}>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Wallet size={12} /> Financial Payouts & Audit
          </span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Rewards, Payouts & User Balances
        </h1>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
          Audit customer & distributor point balances, approve cash redemptions, and configure rewards conversion rates.
        </div>
      </div>

      {/* 1. TOP METRICS DASHBOARD */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        {/* Outstanding Pending Payouts */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)',
            borderRadius: '18px',
            border: '1.5px solid #fde047',
            padding: '18px 20px',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.1)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#854d0e', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
            Pending Payout Requests
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#ca8a04', lineHeight: 1.1 }}>
            ₹{Number(metrics.pendingPayoutsCash || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a16207', marginTop: '4px' }}>
            {metrics.pendingPayoutsCount} requests ({Number(metrics.pendingPayoutsPoints || 0).toLocaleString()} pts)
          </div>
        </div>

        {/* Total Cash Paid Out */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
            borderRadius: '18px',
            border: '1.5px solid #a7f3d0',
            padding: '18px 20px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#065f46', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
            Total Payouts Completed
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#059669', lineHeight: 1.1 }}>
            ₹{Number(metrics.totalPayoutsPaidAmount || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '4px' }}>
            {metrics.completedPayoutsCount} payouts settled
          </div>
        </div>

        {/* Total Points Distributed */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1.5px solid #e2e8f0',
            padding: '18px 20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
            Total Points Distributed
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#2563eb', lineHeight: 1.1 }}>
            {Number(metrics.totalPointsDistributed || 0).toLocaleString()} <span style={{ fontSize: '0.85rem' }}>pts</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {metrics.claimedTokens} QR codes claimed
          </div>
        </div>

        {/* Outstanding Points Liability */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1.5px solid #e2e8f0',
            padding: '18px 20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
            Outstanding User Balance
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
            {Number(metrics.totalOutstandingUserBalance || 0).toLocaleString()} <span style={{ fontSize: '0.85rem' }}>pts</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Held by {metrics.totalUsersWithPoints} active users
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 18px -4px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            overflowX: 'auto'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('redemptions')}
            style={{
              padding: '16px 24px',
              border: 'none',
              borderBottom: activeTab === 'redemptions' ? '3px solid #059669' : '3px solid transparent',
              background: activeTab === 'redemptions' ? '#ffffff' : 'transparent',
              color: activeTab === 'redemptions' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'redemptions' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Wallet size={17} color={activeTab === 'redemptions' ? '#059669' : '#94a3b8'} />
            <span>Cash Redemption Requests</span>
            {metrics.pendingPayoutsCount > 0 && (
              <span
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}
              >
                {metrics.pendingPayoutsCount} pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            style={{
              padding: '16px 24px',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid #059669' : '3px solid transparent',
              background: activeTab === 'users' ? '#ffffff' : 'transparent',
              color: activeTab === 'users' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'users' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={17} color={activeTab === 'users' ? '#059669' : '#94a3b8'} />
            <span>Reward Accounts Directory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '16px 24px',
              border: 'none',
              borderBottom: activeTab === 'settings' ? '3px solid #059669' : '3px solid transparent',
              background: activeTab === 'settings' ? '#ffffff' : 'transparent',
              color: activeTab === 'settings' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'settings' ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Settings size={17} color={activeTab === 'settings' ? '#059669' : '#94a3b8'} />
            <span>Redemption Rules & Rates</span>
          </button>
        </div>

        {/* TAB 1: REDEMPTION REQUESTS */}
        {activeTab === 'redemptions' && (
          <div>
            {/* Toolbar */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['All', 'Pending', 'Approved', 'Processing', 'Paid', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setRedemptionStatusFilter(st)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      border: redemptionStatusFilter === st ? '1px solid #059669' : '1px solid #cbd5e1',
                      backgroundColor: redemptionStatusFilter === st ? '#059669' : '#ffffff',
                      color: redemptionStatusFilter === st ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search request #, user, bank..."
                  value={redemptionSearch}
                  onChange={(e) => setRedemptionSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadRedemptions();
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.82rem',
                    outline: 'none',
                    width: '240px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => loadRedemptions()}
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
              </div>
            </div>

            {/* Redemptions Table */}
            <div style={{ overflowX: 'auto' }}>
              {loadingRedemptions ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Loading redemption requests...
                </div>
              ) : redemptions.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                  <Wallet size={32} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
                  <div style={{ fontWeight: 800, color: '#334155' }}>No Redemption Requests Found</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                    {redemptionStatusFilter !== 'All' ? `No requests matching "${redemptionStatusFilter}"` : 'Requests will appear here when users redeem points.'}
                  </div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>Request ID</th>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>User Details</th>
                      <th style={{ padding: '12px 16px' }}>Points & Cash</th>
                      <th style={{ padding: '12px 16px' }}>Bank Account</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map((item) => {
                      const badge = getStatusBadge(item.status);
                      const isPending = item.status === 'Pending';
                      const isApproved = item.status === 'Approved';
                      const isProcessing = item.status === 'Processing';

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.84rem' }}>
                          {/* Request Number */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                              {item.requestNumber}
                            </div>
                          </td>

                          {/* Date */}
                          <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.76rem' }}>
                            {formatDate(item.createdDate)}
                          </td>

                          {/* User Details */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {item.fullName}{' '}
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                                ({item.userType})
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {item.phoneNumber} {item.userEmail && `| ${item.userEmail}`}
                            </div>
                            {item.address && (
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.address}</div>
                            )}
                          </td>

                          {/* Points & Cash */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                              ₹{Number(item.cashAmount).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>
                              {item.points} pts
                            </div>
                          </td>

                          {/* Bank details */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#334155' }}>{item.bankName}</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace' }}>
                              A/C: {item.accountNumber}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              Holder: {item.accountHolderName} | IFSC: {item.ifscCode}
                            </div>
                            {item.upiId && (
                              <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>
                                UPI: {item.upiId}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '10px',
                                backgroundColor: badge.bg,
                                border: `1px solid ${badge.border}`,
                                color: badge.color,
                                fontSize: '0.72rem',
                                fontWeight: 700
                              }}
                            >
                              {badge.label}
                            </span>
                            {item.transactionReference && (
                              <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px', fontFamily: 'monospace' }}>
                                Ref: {item.transactionReference}
                              </div>
                            )}
                            {item.rejectionReason && (
                              <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '4px' }}>
                                Reason: {item.rejectionReason}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(item.id, 'Approved')}
                                  disabled={actionLoading}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #bfdbfe',
                                    backgroundColor: '#eff6ff',
                                    color: '#1d4ed8',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Approve
                                </button>
                              )}

                              {(isPending || isApproved) && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(item.id, 'Processing')}
                                  disabled={actionLoading}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #fde68a',
                                    backgroundColor: '#fef3c7',
                                    color: '#b45309',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Process
                                </button>
                              )}

                              {item.status !== 'Paid' && item.status !== 'Rejected' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPayModalItem(item);
                                    setTxnRefInput('');
                                  }}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#059669',
                                    color: '#ffffff',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Mark Paid
                                </button>
                              )}

                              {item.status !== 'Rejected' && item.status !== 'Paid' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectModalItem(item);
                                    setRejectReasonInput('');
                                  }}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #fecaca',
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Reject
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
        )}

        {/* TAB 2: REWARD USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                {['All', 'Customer', 'Distributor'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUserRoleFilter(r)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      border: userRoleFilter === r ? '1px solid #059669' : '1px solid #cbd5e1',
                      backgroundColor: userRoleFilter === r ? '#059669' : '#ffffff',
                      color: userRoleFilter === r ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search user name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadUsers();
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.82rem',
                    outline: 'none',
                    width: '240px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => loadUsers()}
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
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {loadingUsers ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading reward users...</div>
              ) : rewardUsers.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>No users found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>User</th>
                      <th style={{ padding: '12px 16px' }}>Role</th>
                      <th style={{ padding: '12px 16px' }}>Current Points Balance</th>
                      <th style={{ padding: '12px 16px' }}>Lifetime Earned</th>
                      <th style={{ padding: '12px 16px' }}>QR Codes Claimed</th>
                      <th style={{ padding: '12px 16px' }}>Redemptions</th>
                      <th style={{ padding: '12px 16px' }}>Cash Paid Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewardUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.84rem' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {u.email} {u.phoneNumber && `| ${u.phoneNumber}`}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '8px',
                              backgroundColor: u.userType === 'Distributor' ? '#f0f9ff' : '#f8fafc',
                              color: u.userType === 'Distributor' ? '#0284c7' : '#334155',
                              border: '1px solid #e2e8f0',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}
                          >
                            {u.userType}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#059669' }}>
                            {Number(u.pointsBalance).toLocaleString()} pts
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 700 }}>
                          {Number(u.totalPointsEarned).toLocaleString()} pts
                        </td>
                        <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600 }}>
                          {u.totalClaims} offers
                        </td>
                        <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600 }}>
                          {u.totalRedemptions} requests
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#059669' }}>
                          ₹{Number(u.totalCashPaid || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CONFIGURABLE SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ padding: '28px', maxWidth: '640px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                Reward & Cash Conversion Settings
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                These rates dictate the cash conversion formula for all customer and distributor redemptions.
              </div>
            </div>

            <form onSubmit={handleSaveSettings}>
              {/* Conversion Rate */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Points-to-Cash Rate (₹ per 1 Point) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ position: 'relative', width: '160px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b', fontWeight: 700 }}>₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 28px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        outline: 'none'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Example: At ₹{rateInput || '1'}, 100 points = <strong>₹{100 * (parseFloat(rateInput) || 1)}</strong>
                  </span>
                </div>
              </div>

              {/* Minimum Redemption Threshold */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Minimum Points Required to Request Redemption *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minPointsInput}
                    onChange={(e) => setMinPointsInput(e.target.value)}
                    style={{
                      width: '160px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Users cannot submit payout requests below this threshold.
                  </span>
                </div>
              </div>

              {/* Message */}
              {settingsMsg.text && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: settingsMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    border: settingsMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                    color: settingsMsg.type === 'success' ? '#059669' : '#dc2626',
                    fontSize: '0.82rem',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {settingsMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{settingsMsg.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingSettings}
                style={{
                  padding: '12px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: savingSettings ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                }}
              >
                {savingSettings ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MARK AS PAID MODAL */}
      {payModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPayModalItem(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                Confirm Bank Payout Sent
              </div>
              <button
                onClick={() => setPayModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '16px', fontSize: '0.84rem' }}>
              <div><strong>Beneficiary:</strong> {payModalItem.fullName} ({payModalItem.phoneNumber})</div>
              <div><strong>Bank:</strong> {payModalItem.bankName} (A/C: {payModalItem.accountNumber})</div>
              <div><strong>IFSC:</strong> {payModalItem.ifscCode}</div>
              <div style={{ marginTop: '6px', fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>
                Amount to Transfer: ₹{Number(payModalItem.cashAmount).toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Bank Transaction Reference / UTR Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UTR1234567890 or IMPS ref"
                value={txnRefInput}
                onChange={(e) => setTxnRefInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Admin Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Paid via HDFC Corporate NetBanking"
                value={payNotesInput}
                onChange={(e) => setPayNotesInput(e.target.value)}
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPayModalItem(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateStatus(payModalItem.id, 'Paid', {
                    transactionReference: txnRefInput.trim(),
                    adminNotes: payNotesInput.trim()
                  })
                }
                disabled={actionLoading || !txnRefInput.trim()}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: actionLoading || !txnRefInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: actionLoading || !txnRefInput.trim() ? 0.6 : 1
                }}
              >
                {actionLoading ? 'Saving...' : 'Confirm Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT & REFUND MODAL */}
      {rejectModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRejectModalItem(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#dc2626' }}>
                Reject Redemption Request
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px',
                fontSize: '0.82rem',
                color: '#991b1b',
                lineHeight: 1.45
              }}
            >
              <strong>Notice:</strong> Rejecting this request will automatically refund{' '}
              <strong>{rejectModalItem.points} points</strong> back to {rejectModalItem.fullName}'s account balance immediately.
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Rejection Reason *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Invalid bank account number or IFSC code"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateStatus(rejectModalItem.id, 'Rejected', {
                    rejectionReason: rejectReasonInput.trim()
                  })
                }
                disabled={actionLoading || !rejectReasonInput.trim()}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: actionLoading || !rejectReasonInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: actionLoading || !rejectReasonInput.trim() ? 0.6 : 1
                }}
              >
                {actionLoading ? 'Refunding...' : 'Confirm Rejection & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRewardsPayouts;
