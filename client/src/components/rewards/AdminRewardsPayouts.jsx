import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
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
  Send,
  Package,
  Gift,
  ExternalLink
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
    completedPayoutsCount: 0,
    totalUsersWithPoints: 0,
    totalOutstandingUserBalance: 0,
    settings: { rate: 1.0, minPoints: 10 }
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
  const [minPointsInput, setMinPointsInput] = useState('10');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' });

  // Load Dashboard Overview Metrics
  const loadDashboardMetrics = async () => {
    try {
      const res = await api.rewards.admin.getDashboard();
      if (res.success && res.metrics) {
        setMetrics(res.metrics);
        if (res.metrics.settings) {
          setRateInput(String(res.metrics.settings.rate || 1.0));
          setMinPointsInput(String(res.metrics.settings.minPoints || 10));
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

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg({ type: '', text: '' });
    try {
      const res = await api.rewards.admin.updateSettings({
        rate: parseFloat(rateInput) || 1.0,
        minPoints: parseInt(minPointsInput, 10) || 10
      });
      if (res.success) {
        setSettingsMsg({ type: 'success', text: 'Reward settings updated successfully!' });
        loadDashboardMetrics();
      } else {
        setSettingsMsg({ type: 'error', text: res.message || 'Failed to update settings.' });
      }
    } catch (err) {
      setSettingsMsg({ type: 'error', text: err.message || 'Error updating settings.' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Format date helper
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

  // Status badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Paid':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          color: '#059669',
          label: 'Approved'
        };
      case 'Processing':
        return {
          bg: '#eff6ff',
          border: '#bfdbfe',
          color: '#2563eb',
          label: 'Processing'
        };
      case 'Delivered':
        return {
          bg: '#f0fdf4',
          border: '#bbf7d0',
          color: '#16a34a',
          label: 'Delivered'
        };
      case 'Cancelled':
      case 'Rejected':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          color: '#dc2626',
          label: 'Cancelled / Refunded'
        };
      default:
        return {
          bg: '#fef3c7',
          border: '#fde68a',
          color: '#d97706',
          label: 'Pending'
        };
    }
  };

  // Calculate total NPR value redeemed
  const totalValueRedeemedNpr = redemptions.reduce((acc, r) => acc + (Number(r.cashAmount) || 0), 0);
  const totalPointsRedeemedSum = redemptions.reduce((acc, r) => acc + (Number(r.points) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. TOP METRICS DASHBOARD */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
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

        {/* Total Product Redemptions */}
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
            Total Product Purchases
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#059669', lineHeight: 1.1 }}>
            {redemptions.length} <span style={{ fontSize: '0.85rem' }}>orders</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {totalPointsRedeemedSum.toLocaleString()} points redeemed
          </div>
        </div>

        {/* Total Redeemed Value in NPR */}
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
            Total Redeemed Value
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#d97706', lineHeight: 1.1 }}>
            NPR {totalValueRedeemedNpr.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Exact conversion: 1 Pt = NPR 1
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
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <ShoppingBag size={17} color={activeTab === 'redemptions' ? '#059669' : '#94a3b8'} />
            <span>Reward Product Redemption History</span>
            <span
              style={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '10px'
              }}
            >
              {redemptions.length}
            </span>
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
              gap: '8px',
              whiteSpace: 'nowrap'
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
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <Settings size={17} color={activeTab === 'settings' ? '#059669' : '#94a3b8'} />
            <span>Redemption Rules & Rates</span>
          </button>
        </div>

        {/* TAB 1: PRODUCT REDEMPTION HISTORY */}
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
                {['All', 'Approved', 'Pending', 'Processing', 'Delivered', 'Cancelled'].map((st) => (
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
                  placeholder="Search order #, user, product..."
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
                  Loading product redemption history...
                </div>
              ) : redemptions.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                  <ShoppingBag size={32} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
                  <div style={{ fontWeight: 800, color: '#334155' }}>No Product Redemptions Found</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                    {redemptionStatusFilter !== 'All'
                      ? `No records matching "${redemptionStatusFilter}"`
                      : 'Records will appear here when customers or distributors buy products using reward points.'}
                  </div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>Order Reference</th>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>User Details</th>
                      <th style={{ padding: '12px 16px' }}>Purchased Product</th>
                      <th style={{ padding: '12px 16px' }}>Points Deducted</th>
                      <th style={{ padding: '12px 16px' }}>NPR Equivalent</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map((item) => {
                      const displayStatus = item.linkedOrderStatus || item.status || 'Approved';
                      const badge = getStatusBadge(displayStatus);

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.84rem' }}>
                          {/* Order Reference */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#2563eb' }}>
                              {item.orderNumber || item.requestNumber}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                              Ref: {item.requestNumber}
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
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: item.userType === 'Distributor' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                                color: item.userType === 'Distributor' ? '#0284c7' : '#059669',
                                fontWeight: 700
                              }}>
                                {item.userType}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {item.phoneNumber} {item.userEmail && `| ${item.userEmail}`}
                            </div>
                            {item.address && (
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                Dest: {item.address}
                              </div>
                            )}
                          </td>

                          {/* Purchased Product */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {item.productImage && (
                                <img
                                  src={item.productImage}
                                  alt={item.productName || 'Product'}
                                  style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }}
                                  onError={(e) => {
                                    e.target.src = '/mws_eagle_logo.jpg?v=3';
                                  }}
                                />
                              )}
                              <div>
                                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                                  {item.quantity ? `${item.quantity}x ` : '1x '}{item.productName || 'Catalog Item'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                                  Payment Method: Reward Points
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Points Deducted */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#dc2626' }}>
                              -{item.points} pts
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              Deducted atomically
                            </div>
                          </td>

                          {/* NPR Equivalent */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                              NPR {Number(item.cashAmount).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              1 pt = NPR 1
                            </div>
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
                            {item.rejectionReason && (
                              <div style={{ fontSize: '0.7rem', color: '#dc2626', marginTop: '4px' }}>
                                {item.rejectionReason}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <a
                              href={`/admin?tab=orders&search=${encodeURIComponent(item.orderNumber || '')}`}
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/admin?tab=orders&search=${encodeURIComponent(item.orderNumber || '')}`;
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                backgroundColor: '#f1f5f9',
                                color: '#2563eb',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                cursor: 'pointer',
                                border: '1px solid #cbd5e1'
                              }}
                            >
                              <span>Manage in Orders</span>
                              <ExternalLink size={12} />
                            </a>
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
                    width: '260px'
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
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Loading reward accounts...
                </div>
              ) : rewardUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No reward accounts found matching criteria.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>User Details</th>
                      <th style={{ padding: '12px 16px' }}>Role</th>
                      <th style={{ padding: '12px 16px' }}>Current Balance</th>
                      <th style={{ padding: '12px 16px' }}>Lifetime Earned</th>
                      <th style={{ padding: '12px 16px' }}>QR Claims</th>
                      <th style={{ padding: '12px 16px' }}>Product Redemptions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewardUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.84rem' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {u.email} {u.phoneNumber && `| ${u.phoneNumber}`}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: u.userType === 'Distributor' ? '#e0f2fe' : '#ecfdf5',
                              color: u.userType === 'Distributor' ? '#0369a1' : '#047857'
                            }}
                          >
                            {u.userType}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 900, color: '#f59e0b', fontSize: '1.05rem' }}>
                            {Number(u.pointsBalance || 0).toLocaleString()} <span style={{ fontSize: '0.75rem' }}>pts</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            NPR {Number(u.pointsBalance || 0).toLocaleString()} value
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#334155' }}>
                          {Number(u.totalPointsEarned || 0).toLocaleString()} pts
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          {u.totalClaims || 0} claims
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          {u.totalRedemptions || 0} purchases
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ padding: '24px', maxWidth: '640px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '6px' }}>
              Reward Point Conversion Rate
            </div>
            <div style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '24px' }}>
              The reward system allows customers and distributors to earn points via QR codes and redeem those points exclusively for catalog products at a fixed rate of 1 Point = NPR 1.
            </div>

            {settingsMsg.text && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  backgroundColor: settingsMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: settingsMsg.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fecaca',
                  color: settingsMsg.type === 'success' ? '#065f46' : '#991b1b',
                  fontSize: '0.85rem'
                }}
              >
                {settingsMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Points-to-NPR Rate (1 Point = NPR X)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    style={{
                      width: '160px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                    Standard Conversion: 1 Point = NPR 1.00
                  </span>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={savingSettings}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: savingSettings ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRewardsPayouts;
