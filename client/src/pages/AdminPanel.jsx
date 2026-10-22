import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Check, 
  X, 
  PauseCircle, 
  PlayCircle, 
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileText,
  UserCheck,
  Package,
  Layers
} from 'lucide-react';

export const AdminPanel = () => {
  const { user } = useAuth();

  // Metrics
  const [metrics, setMetrics] = useState({
    customers: { total: 0, active: 0, suspended: 0 },
    distributors: { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 }
  });

  // User management state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'distributors' | 'customers' | 'all' | 'products'

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Action states
  const [selectedUser, setSelectedUser] = useState(null); // for dossier view modal
  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendModalUser, setSuspendModalUser] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Products preview state (for Product Visibility Foundation tab)
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch metrics & users
  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, uRes] = await Promise.all([
        api.admin.getMetrics(),
        api.admin.getUsers({ userType: typeFilter, accountStatus: statusFilter, search: searchTerm })
      ]);

      if (mRes.success) setMetrics(mRes.metrics);
      if (uRes.success) setUsers(uRes.users);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products when products tab is opened
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const pRes = await api.products.getVisibleProducts();
      if (pRes.success) setAllProducts(pRes.products);
    } catch (err) {
      console.error('Error fetching products for admin:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter, searchTerm]);

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    }
  }, [activeTab]);

  const showNotification = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 5000);
  };

  // Actions
  const handleApprove = async (distributor) => {
    if (!window.confirm(`Approve distributor "${distributor.businessName || distributor.fullName}"? This grants immediate wholesale login access.`)) return;

    try {
      const res = await api.admin.approveDistributor(distributor.id);
      showNotification(res.message);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to approve distributor.');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalUser) return;
    try {
      const res = await api.admin.rejectDistributor(rejectModalUser.id, rejectionReason);
      showNotification(res.message);
      setRejectModalUser(null);
      setRejectionReason('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to reject distributor.');
    }
  };

  const handleSuspendConfirm = async () => {
    if (!suspendModalUser) return;
    try {
      const res = await api.admin.suspendUser(suspendModalUser.id, suspensionReason);
      showNotification(res.message);
      setSuspendModalUser(null);
      setSuspensionReason('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to suspend user.');
    }
  };

  const handleActivate = async (target) => {
    try {
      const res = await api.admin.activateUser(target.id);
      showNotification(res.message);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to activate user.');
    }
  };

  const handleDelete = async (target) => {
    if (!window.confirm(`Permanently delete account for "${target.fullName}" (${target.userId})? This cannot be undone.`)) return;
    try {
      const res = await api.admin.deleteUser(target.id);
      showNotification(res.message);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  // Filter tab logic
  let displayUsers = users;
  if (activeTab === 'pending') {
    displayUsers = users.filter(u => u.userType === 'Distributor' && u.accountStatus === 'Pending');
  } else if (activeTab === 'distributors') {
    displayUsers = users.filter(u => u.userType === 'Distributor');
  } else if (activeTab === 'customers') {
    displayUsers = users.filter(u => u.userType === 'Customer');
  }

  return (
    <div style={{ maxWidth: '1360px', margin: '30px auto 80px', padding: '0 20px' }}>
      {/* Admin Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-admin">
              <ShieldCheck size={12} /> Master Operations Control
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Logged in as: {user?.email}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            Administrator Management Panel
          </h1>
        </div>

        <button
          onClick={loadData}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Action Notification Toast */}
      {actionSuccessMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontWeight: 600
        }} className="animate-fade-in">
          <CheckCircle size={18} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ================= SECTION 4: METRICS CARDS ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* Pending Applications Card */}
        <div 
          className="glass-panel" 
          onClick={() => { setActiveTab('pending'); setStatusFilter('Pending'); setTypeFilter('Distributor'); }}
          style={{
            padding: '20px',
            border: metrics.distributors.pending > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-subtle)',
            background: metrics.distributors.pending > 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-card)',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-pending)', textTransform: 'uppercase' }}>
              Pending Applications
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-pending)' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>
            {metrics.distributors.pending}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Distributor accounts awaiting verification
          </div>
        </div>

        {/* Approved Distributors Card */}
        <div 
          className="glass-panel" 
          onClick={() => { setActiveTab('distributors'); setStatusFilter('Active'); setTypeFilter('Distributor'); }}
          style={{ padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              Approved Distributors
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
              <Building2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>
            {metrics.distributors.approved}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Active wholesale dealer accounts ({metrics.distributors.suspended} suspended)
          </div>
        </div>

        {/* Total Customers Card */}
        <div 
          className="glass-panel" 
          onClick={() => { setActiveTab('customers'); setStatusFilter('All'); setTypeFilter('Customer'); }}
          style={{ padding: '20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
              Active Customers
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
            {metrics.customers.active}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Total retail users: {metrics.customers.total} ({metrics.customers.suspended} suspended)
          </div>
        </div>

        {/* Total Applications Processed */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' }}>
              Rejected / Flagged
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <XCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171' }}>
            {metrics.distributors.rejected}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Rejected distributor applications
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        <button
          onClick={() => { setActiveTab('pending'); setStatusFilter('Pending'); setTypeFilter('Distributor'); }}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid var(--status-pending)' : '2px solid transparent',
            color: activeTab === 'pending' ? '#fbbf24' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={16} />
          <span>Pending Approvals</span>
          {metrics.distributors.pending > 0 && (
            <span className="badge badge-pending" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
              {metrics.distributors.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('distributors'); setStatusFilter('All'); setTypeFilter('Distributor'); }}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'distributors' ? '2px solid #0ea5e9' : '2px solid transparent',
            color: activeTab === 'distributors' ? '#38bdf8' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Building2 size={16} />
          <span>Distributors Directory</span>
        </button>

        <button
          onClick={() => { setActiveTab('customers'); setStatusFilter('All'); setTypeFilter('Customer'); }}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'customers' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'customers' ? '#34d399' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} />
          <span>Customers</span>
        </button>

        <button
          onClick={() => { setActiveTab('all'); setStatusFilter('All'); setTypeFilter('All'); }}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'all' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'all' ? '#818cf8' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Filter size={16} />
          <span>All Users & Filter</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'products' ? '2px solid #8b5cf6' : '2px solid transparent',
            color: activeTab === 'products' ? '#a78bfa' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={16} />
          <span>Product Visibility Foundation</span>
        </button>
      </div>

      {/* ================= TAB 5: PRODUCT VISIBILITY FOUNDATION AUDIT ================= */}
      {activeTab === 'products' ? (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              Product Visibility Role Matrix
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
              Foundation for Section 5: As Admin, you have full catalog oversight. Every product is assigned a <strong>Target User</strong> visibility setting. 
              The backend API automatically blocks customer or distributor access based on these rules.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '12px 14px' }}>SKU</th>
                  <th style={{ padding: '12px 14px' }}>PRODUCT NAME</th>
                  <th style={{ padding: '12px 14px' }}>CATEGORY</th>
                  <th style={{ padding: '12px 14px' }}>CUSTOMER PRICE</th>
                  <th style={{ padding: '12px 14px' }}>DISTRIBUTOR PRICE</th>
                  <th style={{ padding: '12px 14px' }}>TARGET VISIBILITY</th>
                  <th style={{ padding: '12px 14px' }}>PORTAL ACCESS RULES</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {p.sku}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 600, color: '#ffffff' }}>
                      {p.name}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '0.72rem' }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: '#34d399', fontWeight: 600 }}>
                      {p.customerPrice ? `$${p.customerPrice.toFixed(2)}` : '— (N/A)'}
                    </td>
                    <td style={{ padding: '14px', color: '#38bdf8', fontWeight: 600 }}>
                      ${p.distributorPrice?.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className={`badge ${
                        p.targetVisibility === 'Customer' ? 'badge-customer' :
                        p.targetVisibility === 'Distributor' ? 'badge-distributor' : 'badge-admin'
                      }`}>
                        {p.targetVisibility}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {p.targetVisibility === 'Customer' && 'Visible ONLY on Customer Portal'}
                      {p.targetVisibility === 'Distributor' && 'Visible ONLY on Distributor Portal'}
                      {p.targetVisibility === 'Both' && 'Visible on BOTH Customer & Distributor Portals'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= USER MANAGEMENT TABLES & FILTERS ================= */
        <div>
          {/* Search & Filter Toolbar */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
              <input
                type="text"
                placeholder="Search by Name, Email, Business Name, PAN/VAT, User ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
              <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Filter by Role */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All">All User Roles</option>
              <option value="Customer">Customers</option>
              <option value="Distributor">Distributors</option>
              <option value="Admin">Admins</option>
            </select>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Account Statuses</option>
              <option value="Pending">Pending Approval</option>
              <option value="Active">Active</option>
              <option value="Rejected">Rejected</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.25)', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '12px 16px' }}>USER ID</th>
                    <th style={{ padding: '12px 16px' }}>NAME / BUSINESS</th>
                    <th style={{ padding: '12px 16px' }}>CONTACT DETAILS</th>
                    <th style={{ padding: '12px 16px' }}>ROLE</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                    <th style={{ padding: '12px 16px' }}>REGISTERED</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>ADMIN ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading users...
                      </td>
                    </tr>
                  ) : displayUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No users matching current filters.
                      </td>
                    </tr>
                  ) : (
                    displayUsers.map((u) => (
                      <tr 
                        key={u.id} 
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: u.accountStatus === 'Pending' ? 'rgba(245, 158, 11, 0.04)' : 'transparent'
                        }}
                      >
                        {/* User ID */}
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {u.userId}
                        </td>

                        {/* Name / Business */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>
                            {u.fullName}
                          </div>
                          {u.businessName && (
                            <div style={{ fontSize: '0.78rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Building2 size={12} /> {u.businessName}
                            </div>
                          )}
                          {u.panVatNumber && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                              PAN/VAT: {u.panVatNumber}
                            </div>
                          )}
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem' }}>
                          <div>{u.email}</div>
                          <div style={{ color: 'var(--text-dim)' }}>{u.phoneNumber}</div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '14px 16px' }}>
                          <span className={`badge ${
                            u.userType === 'Customer' ? 'badge-customer' :
                            u.userType === 'Distributor' ? 'badge-distributor' : 'badge-admin'
                          }`}>
                            {u.userType}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span className={`badge badge-${u.accountStatus.toLowerCase()}`}>
                            {u.accountStatus}
                          </span>
                        </td>

                        {/* Registered Date */}
                        <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {new Date(u.createdDate).toLocaleDateString()}
                        </td>

                        {/* Admin Action Buttons */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {/* View Full Dossier */}
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="btn btn-secondary btn-sm"
                              title="View complete user dossier"
                            >
                              <Eye size={13} /> View
                            </button>

                            {/* Distributor Approval Workflow Actions */}
                            {u.userType === 'Distributor' && u.accountStatus === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(u)}
                                  className="btn btn-emerald btn-sm"
                                  title="Approve Distributor"
                                >
                                  <Check size={13} /> Approve
                                </button>
                                <button
                                  onClick={() => { setRejectModalUser(u); setRejectionReason(''); }}
                                  className="btn btn-danger btn-sm"
                                  title="Reject Distributor"
                                >
                                  <X size={13} /> Reject
                                </button>
                              </>
                            )}

                            {/* Suspend / Activate toggle */}
                            {u.userType !== 'Admin' && u.accountStatus === 'Active' && (
                              <button
                                onClick={() => { setSuspendModalUser(u); setSuspensionReason(''); }}
                                className="btn btn-danger btn-sm"
                                style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', borderColor: 'rgba(236, 72, 153, 0.3)' }}
                                title="Suspend Account"
                              >
                                <PauseCircle size={13} /> Suspend
                              </button>
                            )}

                            {u.userType !== 'Admin' && (u.accountStatus === 'Suspended' || u.accountStatus === 'Rejected') && (
                              <button
                                onClick={() => handleActivate(u)}
                                className="btn btn-emerald btn-sm"
                                title="Activate / Reactivate Account"
                              >
                                <PlayCircle size={13} /> Activate
                              </button>
                            )}

                            {/* Delete User */}
                            {u.userType !== 'Admin' && (
                              <button
                                onClick={() => handleDelete(u)}
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#ef4444' }}
                                title="Delete User"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: FULL USER DOSSIER VIEW ================= */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ maxWidth: '620px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span className={`badge badge-${selectedUser.accountStatus.toLowerCase()}`} style={{ marginBottom: '6px' }}>
                  {selectedUser.accountStatus}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  {selectedUser.fullName}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  User ID: {selectedUser.userId}
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* User Overview Section */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem', lineHeight: '1.8' }}>
              <div><strong>Email:</strong> {selectedUser.email}</div>
              <div><strong>Phone Number:</strong> {selectedUser.phoneNumber}</div>
              <div><strong>Account Type:</strong> {selectedUser.userType}</div>
              <div><strong>Created Date:</strong> {new Date(selectedUser.createdDate).toLocaleString()}</div>
              <div><strong>Last Login:</strong> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never logged in'}</div>
              {selectedUser.approvalDate && (
                <div><strong>Approved On:</strong> {new Date(selectedUser.approvalDate).toLocaleString()} by {selectedUser.approvedBy}</div>
              )}
              {selectedUser.statusRemark && (
                <div style={{ color: '#f87171' }}><strong>Admin Remark:</strong> {selectedUser.statusRemark}</div>
              )}
            </div>

            {/* Distributor Business Details Section (If Distributor) */}
            {selectedUser.userType === 'Distributor' && (
              <div style={{ border: '1px solid rgba(14, 165, 233, 0.3)', background: 'rgba(14, 165, 233, 0.05)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.85rem', lineHeight: '1.8' }}>
                <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                  Distributor Business Profile
                </div>
                <div><strong>Business Name:</strong> {selectedUser.businessName || 'N/A'}</div>
                <div><strong>PAN / VAT Registration:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedUser.panVatNumber || 'N/A'}</span></div>
                <div><strong>Business Address:</strong> {selectedUser.businessAddress || 'N/A'}</div>
                <div><strong>Contact Person:</strong> {selectedUser.contactPerson || 'N/A'}</div>
                <div><strong>Business Phone:</strong> {selectedUser.businessPhone || 'N/A'}</div>
                <div><strong>Business Email:</strong> {selectedUser.businessEmail || 'N/A'}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedUser.accountStatus === 'Pending' && selectedUser.userType === 'Distributor' && (
                <button
                  onClick={() => {
                    handleApprove(selectedUser);
                    setSelectedUser(null);
                  }}
                  className="btn btn-emerald"
                >
                  <Check size={16} /> Approve Account
                </button>
              )}
              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-secondary"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: REJECT DISTRIBUTOR ================= */}
      {rejectModalUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: '#f87171' }}>
              Reject Distributor Application
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Are you sure you want to reject the application from <strong>{rejectModalUser.businessName || rejectModalUser.fullName}</strong>?
            </p>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Rejection Reason (will be shown to applicant upon login attempt):
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Invalid PAN/VAT registration tax documents or non-matching business license."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setRejectModalUser(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="btn btn-danger"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: SUSPEND USER ================= */}
      {suspendModalUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--status-suspended)' }}>
              Suspend User Account
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Suspension immediately revokes all active session tokens for <strong>{suspendModalUser.fullName}</strong> ({suspendModalUser.userType}).
            </p>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                Suspension Reason (Logged in audit trail):
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Terms violation, suspicious purchasing patterns, or pending verification review."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSuspendModalUser(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendConfirm}
                className="btn btn-danger"
                style={{ background: 'var(--status-suspended)', color: '#fff', border: 'none' }}
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
