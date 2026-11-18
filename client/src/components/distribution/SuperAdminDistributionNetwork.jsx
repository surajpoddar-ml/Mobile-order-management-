import React, { useState, useEffect } from 'react';
import {
  Users, MapPin, Building2, Store, Plus, Search, Filter, RefreshCw,
  Eye, Edit, Key, ArrowRightLeft, ShieldAlert, CheckCircle, AlertCircle,
  Copy, Check, ChevronDown, ChevronRight, IndianRupee, Layers, FileText
} from 'lucide-react';
import api from '../../services/api';

export default function SuperAdminDistributionNetwork() {
  const [activeSubTab, setActiveSubTab] = useState('list'); // 'list' | 'tree'
  const [metrics, setMetrics] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [networkTree, setNetworkTree] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState('');

  // States & UT list for dropdowns
  const [allStates, setAllStates] = useState([]);
  const [cascadingDistricts, setCascadingDistricts] = useState([]);
  const [cascadingAreas, setCascadingAreas] = useState([]);
  const [potentialParents, setPotentialParents] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Created credentials modal (shows generated ID & temporary password)
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form states for creation
  const [formLevel, setFormLevel] = useState('StateDistributor');
  const [formFullName, setFormFullName] = useState('');
  const [formBusinessName, setFormBusinessName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStateId, setFormStateId] = useState('');
  const [formDistrictId, setFormDistrictId] = useState('');
  const [formAreaId, setFormAreaId] = useState('');
  const [formParentUserId, setFormParentUserId] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formOpeningCredit, setFormOpeningCredit] = useState(0);
  const [formPaymentTerms, setFormPaymentTerms] = useState('Net 15');
  const [formCustomPassword, setFormCustomPassword] = useState('');

  // Status update form
  const [newStatus, setNewStatus] = useState('Active');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Transfer form
  const [transferStateId, setTransferStateId] = useState('');
  const [transferDistrictId, setTransferDistrictId] = useState('');
  const [transferAreaId, setTransferAreaId] = useState('');
  const [transferParentUserId, setTransferParentUserId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Status message
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchAccounts(),
        fetchStatesList()
      ]);
    } catch (err) {
      console.error('Error loading distribution network:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.distribution.getSuperAdminDashboard();
      if (res.success) setMetrics(res.metrics);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAccounts = async () => {
    try {
      const params = {};
      if (selectedLevel) params.level = selectedLevel;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedStateFilter) params.stateId = selectedStateFilter;
      if (search) params.search = search;

      const res = await api.distribution.getAccounts(params);
      if (res.success) setAccounts(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStatesList = async () => {
    try {
      const res = await api.distribution.getStates();
      if (res.success) setAllStates(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await api.distribution.getNetworkTree();
      if (res.success) setNetworkTree(res.tree);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [selectedLevel, selectedStatus, selectedStateFilter, search]);

  useEffect(() => {
    if (activeSubTab === 'tree' && !networkTree) {
      fetchTree();
    }
  }, [activeSubTab]);

  // Handle cascading dropdowns in create form
  const handleFormStateChange = async (stateId) => {
    setFormStateId(stateId);
    setFormDistrictId('');
    setFormAreaId('');
    setFormParentUserId('');
    setCascadingDistricts([]);
    setCascadingAreas([]);
    setPotentialParents([]);

    if (!stateId) return;

    // If level is DistrictDistributor, parent is StateDistributor in this state
    if (formLevel === 'DistrictDistributor') {
      const stateDistributors = accounts.filter(
        a => a.distributorLevel === 'StateDistributor' && a.assignedStateId === parseInt(stateId) && a.accountStatus === 'Active'
      );
      setPotentialParents(stateDistributors);
    }

    try {
      const res = await api.distribution.getDistricts(stateId);
      if (res.success) setCascadingDistricts(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFormDistrictChange = async (districtId) => {
    setFormDistrictId(districtId);
    setFormAreaId('');
    setFormParentUserId('');
    setCascadingAreas([]);
    setPotentialParents([]);

    if (!districtId) return;

    // If level is AreaDistributor, parent is DistrictDistributor in this district
    if (formLevel === 'AreaDistributor') {
      const distDistributors = accounts.filter(
        a => a.distributorLevel === 'DistrictDistributor' && a.assignedDistrictId === parseInt(districtId) && a.accountStatus === 'Active'
      );
      setPotentialParents(distDistributors);
    }

    try {
      const res = await api.distribution.getAreas(districtId);
      if (res.success) setCascadingAreas(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFormAreaChange = async (areaId) => {
    setFormAreaId(areaId);
    setFormParentUserId('');
    setPotentialParents([]);

    if (!areaId) return;

    // If level is Retailer, parent is AreaDistributor in this area
    if (formLevel === 'Retailer') {
      const areaDistributors = accounts.filter(
        a => a.distributorLevel === 'AreaDistributor' && a.assignedAreaId === parseInt(areaId) && a.accountStatus === 'Active'
      );
      setPotentialParents(areaDistributors);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    try {
      const payload = {
        fullName: formFullName.trim(),
        businessName: formBusinessName.trim() || undefined,
        email: formEmail.trim().toLowerCase(),
        phoneNumber: formPhone.trim(),
        distributorLevel: formLevel,
        stateId: formStateId ? parseInt(formStateId) : null,
        districtId: formDistrictId ? parseInt(formDistrictId) : null,
        areaId: formAreaId ? parseInt(formAreaId) : null,
        parentUserId: formParentUserId ? parseInt(formParentUserId) : null,
        completeAddress: formAddress.trim(),
        openingCredit: parseFloat(formOpeningCredit) || 0,
        paymentTerms: formPaymentTerms,
        customPassword: formCustomPassword.trim() || undefined
      };

      const res = await api.distribution.createAccount(payload);
      if (res.success) {
        setShowCreateModal(false);
        setCreatedCredentials(res.data);
        // Reset form
        setFormFullName('');
        setFormBusinessName('');
        setFormEmail('');
        setFormPhone('');
        setFormAddress('');
        setFormCustomPassword('');
        // Refresh data
        loadAll();
      } else {
        setActionError(res.message || 'Failed to create account');
      }
    } catch (err) {
      setActionError(err.message || 'Error creating distributor account');
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.distribution.updateAccountStatus(selectedAccount.id, {
        status: newStatus,
        remarks: statusRemarks.trim()
      });
      if (res.success) {
        setActionSuccess(`Account status updated to ${newStatus}`);
        setShowStatusModal(false);
        setSelectedAccount(null);
        loadAll();
      } else {
        setActionError(res.message || 'Failed to update status');
      }
    } catch (err) {
      setActionError(err.message || 'Error updating account status');
    }
  };

  const handleResetSubmit = async () => {
    if (!selectedAccount) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.distribution.resetPassword(selectedAccount.id);
      if (res.success) {
        setShowResetModal(false);
        setCreatedCredentials(res.data);
        loadAll();
      } else {
        setActionError(res.message || 'Failed to reset password');
      }
    } catch (err) {
      setActionError(err.message || 'Error resetting password');
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.distribution.transferTerritory(selectedAccount.id, {
        stateId: transferStateId ? parseInt(transferStateId) : null,
        districtId: transferDistrictId ? parseInt(transferDistrictId) : null,
        areaId: transferAreaId ? parseInt(transferAreaId) : null,
        parentUserId: transferParentUserId ? parseInt(transferParentUserId) : null,
        reason: transferReason.trim()
      });
      if (res.success) {
        setActionSuccess('Territory reassigned successfully');
        setShowTransferModal(false);
        setSelectedAccount(null);
        loadAll();
      } else {
        setActionError(res.message || 'Failed to transfer territory');
      }
    } catch (err) {
      setActionError(err.message || 'Error transferring territory');
    }
  };

  const copyCredentialsToClipboard = () => {
    if (!createdCredentials) return;
    const text = `MWS Eagle Account Credentials\nUnique ID: ${createdCredentials.userId}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.temporaryPassword}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 12 Master Statistics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-gray-500 uppercase">States & UTs</span>
            <div className="text-xl font-bold text-gray-900 mt-1">{metrics.totalStatesAndUTs}</div>
            <span className="text-[10px] text-gray-400">28 States + 8 UTs</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-indigo-600 uppercase">State Dists</span>
            <div className="text-xl font-bold text-indigo-700 mt-1">{metrics.totalStateDistributors}</div>
            <span className="text-[10px] text-gray-400">Tier 1 Hierarchy</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-blue-600 uppercase">District Dists</span>
            <div className="text-xl font-bold text-blue-700 mt-1">{metrics.totalDistrictDistributors}</div>
            <span className="text-[10px] text-gray-400">Tier 2 Hierarchy</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-cyan-600 uppercase">Area Dists</span>
            <div className="text-xl font-bold text-cyan-700 mt-1">{metrics.totalAreaDistributors}</div>
            <span className="text-[10px] text-gray-400">Tier 3 Hierarchy</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase">Retailers</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">{metrics.totalRetailers}</div>
            <span className="text-[10px] text-gray-400">Tier 4 Retail Outlets</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-green-600 uppercase">Active Accounts</span>
            <div className="text-xl font-bold text-green-700 mt-1">{metrics.totalActiveDistributors}</div>
            <span className="text-[10px] text-gray-400">Operational</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-amber-600 uppercase">Pending Review</span>
            <div className="text-xl font-bold text-amber-700 mt-1">{metrics.totalPendingDistributors}</div>
            <span className="text-[10px] text-gray-400">Awaiting Super Admin</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-red-600 uppercase">Suspended</span>
            <div className="text-xl font-bold text-red-700 mt-1">{metrics.totalSuspendedAccounts}</div>
            <span className="text-[10px] text-gray-400">Access Restricted</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-amber-700 uppercase">Outstanding (₹)</span>
            <div className="text-xl font-bold text-amber-800 mt-1">₹{metrics.totalOutstandingPayments.toLocaleString()}</div>
            <span className="text-[10px] text-gray-400">Receivable</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase">Collected (₹)</span>
            <div className="text-xl font-bold text-emerald-800 mt-1">₹{metrics.totalPaymentsReceived.toLocaleString()}</div>
            <span className="text-[10px] text-gray-400">Verified In Bank</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-semibold text-rose-600 uppercase">Overdue (₹)</span>
            <div className="text-xl font-bold text-rose-700 mt-1">₹{metrics.totalOverduePayments.toLocaleString()}</div>
            <span className="text-[10px] text-gray-400">Past Due Date</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm bg-gradient-to-br from-indigo-50 to-blue-50">
            <span className="text-[11px] font-semibold text-indigo-900 uppercase">Network Value</span>
            <div className="text-xl font-bold text-indigo-900 mt-1">₹{metrics.totalDistributionNetworkValue.toLocaleString()}</div>
            <span className="text-[10px] text-indigo-700">Total Billed Gross</span>
          </div>
        </div>
      )}

      {/* Action Header & Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSubTab('list')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeSubTab === 'list' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Distributor Accounts Table
            </button>
            <button
              onClick={() => setActiveSubTab('tree')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeSubTab === 'tree' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Interactive Network Tree
            </button>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Distributor</span>
            </button>
            <button
              onClick={loadAll}
              className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              title="Refresh Network"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        {activeSubTab === 'list' && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, email, phone, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Hierarchy Levels</option>
                <option value="StateDistributor">State-Level Distributor</option>
                <option value="DistrictDistributor">District-Level Distributor</option>
                <option value="AreaDistributor">Area-Level Distributor</option>
                <option value="Retailer">Retailer</option>
              </select>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending Review</option>
                <option value="Suspended">Suspended</option>
                <option value="Deactivated">Deactivated</option>
              </select>
            </div>
            <div>
              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All States & UTs</option>
                {allStates.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.isUnionTerritory ? 'UT' : 'State'})</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* SUB-VIEW 1: TABLE */}
      {activeSubTab === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Account ID & User</th>
                  <th className="py-3.5 px-4">Level</th>
                  <th className="py-3.5 px-4">Assigned Territory</th>
                  <th className="py-3.5 px-4">Reporting Parent</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Reliability</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-gray-400">
                      No accounts found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-indigo-50/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs font-bold text-indigo-700">{acc.userId}</div>
                        <div className="font-semibold text-gray-900">{acc.fullName}</div>
                        {acc.businessName && <div className="text-xs text-gray-500 font-medium">{acc.businessName}</div>}
                        <div className="text-xs text-gray-400">{acc.email} • {acc.phoneNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                          acc.distributorLevel === 'StateDistributor' ? 'bg-indigo-100 text-indigo-700' :
                          acc.distributorLevel === 'DistrictDistributor' ? 'bg-blue-100 text-blue-700' :
                          acc.distributorLevel === 'AreaDistributor' ? 'bg-cyan-100 text-cyan-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {acc.distributorLevel === 'StateDistributor' ? 'State Distributor' :
                           acc.distributorLevel === 'DistrictDistributor' ? 'District Distributor' :
                           acc.distributorLevel === 'AreaDistributor' ? 'Area Distributor' :
                           'Retailer'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {acc.stateName && <div className="font-medium text-gray-800">State: {acc.stateName}</div>}
                        {acc.districtName && <div className="text-gray-600">District: {acc.districtName}</div>}
                        {acc.areaName && <div className="text-gray-500">Area: {acc.areaName}</div>}
                        {!acc.stateName && <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {acc.parentName ? (
                          <div>
                            <div className="font-semibold text-gray-800">{acc.parentName}</div>
                            <div className="text-gray-500">{acc.parentLevel}</div>
                          </div>
                        ) : (
                          <span className="text-indigo-600 font-medium">Direct to Super Admin</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          acc.accountStatus === 'Active' ? 'bg-green-100 text-green-700' :
                          acc.accountStatus === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          acc.accountStatus === 'Suspended' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {acc.accountStatus}
                        </span>
                        {acc.mustChangePassword === 1 && (
                          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Temp Password</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {acc.overallScore !== null && acc.overallScore !== undefined ? (
                          <div>
                            <div className="text-xs font-bold text-gray-900">{acc.overallScore}/100</div>
                            <div className="text-[10px] text-emerald-600 font-medium">{acc.ratingTier}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not Rated</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedAccount(acc);
                              setNewStatus(acc.accountStatus);
                              setStatusRemarks('');
                              setShowStatusModal(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Update Status"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAccount(acc);
                              setShowResetModal(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded"
                            title="Reset Credentials"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAccount(acc);
                              setTransferStateId(acc.assignedStateId || '');
                              setTransferDistrictId(acc.assignedDistrictId || '');
                              setTransferAreaId(acc.assignedAreaId || '');
                              setTransferParentUserId(acc.parentUserId || '');
                              setTransferReason('');
                              setShowTransferModal(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Transfer Territory"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: INTERACTIVE VISUAL NETWORK TREE */}
      {activeSubTab === 'tree' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Hierarchical Distribution Network (India Master View)</span>
            </h2>
            <p className="text-xs text-gray-500">
              Interactive visualization of India's distribution chain from States to Districts, Areas, and Retailers.
            </p>
          </div>

          {loading || !networkTree ? (
            <div className="py-12 text-center text-gray-400">Loading hierarchical tree structure...</div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    IN
                  </div>
                  <div>
                    <div className="text-sm font-bold text-indigo-950">India National Distribution Ecosystem</div>
                    <div className="text-xs text-indigo-700">{networkTree.totalStates} States & Union Territories</div>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-600 text-white rounded-full">
                  Super Admin Controlled
                </span>
              </div>

              {/* State Nodes */}
              <div className="pl-4 space-y-3 border-l-2 border-indigo-100">
                {(networkTree.states || []).map((state) => (
                  <StateTreeNode key={state.stateId} state={state} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE DISTRIBUTOR MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Hierarchical Distributor Account</h2>
                <p className="text-xs text-gray-500">Super Admin account provisioning with secure temporary credentials</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-4 border border-red-200">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Distributor Level *
                </label>
                <select
                  required
                  value={formLevel}
                  onChange={(e) => {
                    setFormLevel(e.target.value);
                    setFormStateId('');
                    setFormDistrictId('');
                    setFormAreaId('');
                    setFormParentUserId('');
                    setCascadingDistricts([]);
                    setCascadingAreas([]);
                    setPotentialParents([]);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="StateDistributor">State-Level Distributor</option>
                  <option value="DistrictDistributor">District-Level Distributor</option>
                  <option value="AreaDistributor">Area-Level Distributor</option>
                  <option value="Retailer">Retailer</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Contact Person Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Business / Company Name
                  </label>
                  <input
                    type="text"
                    value={formBusinessName}
                    onChange={(e) => setFormBusinessName(e.target.value)}
                    placeholder="e.g. Eagle Wholesale Traders"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="distributor@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Geographical territory selectors based on level */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Territory & Hierarchy Assignment
                </span>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Select State / Union Territory *
                  </label>
                  <select
                    required
                    value={formStateId}
                    onChange={(e) => handleFormStateChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Choose State / UT --</option>
                    {allStates.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.isUnionTerritory ? 'UT' : 'State'})</option>
                    ))}
                  </select>
                </div>

                {/* District dropdown for District, Area, Retailer */}
                {(formLevel === 'DistrictDistributor' || formLevel === 'AreaDistributor' || formLevel === 'Retailer') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Select District *
                    </label>
                    <select
                      required
                      value={formDistrictId}
                      onChange={(e) => handleFormDistrictChange(e.target.value)}
                      disabled={!formStateId}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
                    >
                      <option value="">-- Choose District --</option>
                      {cascadingDistricts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Area dropdown for Area, Retailer */}
                {(formLevel === 'AreaDistributor' || formLevel === 'Retailer') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Select Area / Locality *
                    </label>
                    <select
                      required
                      value={formAreaId}
                      onChange={(e) => handleFormAreaChange(e.target.value)}
                      disabled={!formDistrictId}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
                    >
                      <option value="">-- Choose Area --</option>
                      {cascadingAreas.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.pincode || 'No Pincode'})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Parent Distributor assignment */}
                {formLevel !== 'StateDistributor' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reporting Parent Distributor {formLevel === 'Retailer' ? '(Area Distributor)' : formLevel === 'AreaDistributor' ? '(District Distributor)' : '(State Distributor)'}
                    </label>
                    <select
                      value={formParentUserId}
                      onChange={(e) => setFormParentUserId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="">-- Select Parent Account --</option>
                      {potentialParents.map((p) => (
                        <option key={p.id} value={p.id}>{p.fullName} ({p.businessName || p.userId})</option>
                      ))}
                    </select>
                    {potentialParents.length === 0 && (
                      <span className="text-[11px] text-amber-600 block mt-1">
                        Note: No active parent accounts currently exist in this selected territory. The account will report directly to Super Admin until a parent is assigned.
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Complete Address
                </label>
                <textarea
                  rows="2"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Street address, shop number, landmark..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Opening Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    value={formOpeningCredit}
                    onChange={(e) => setFormOpeningCredit(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={formPaymentTerms}
                    onChange={(e) => setFormPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  >
                    <option value="Immediate">Immediate / Advance</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Custom Temporary Password (Optional)
                </label>
                <input
                  type="text"
                  value={formCustomPassword}
                  onChange={(e) => setFormCustomPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate a secure password"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow"
                >
                  Create & Generate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATED CREDENTIALS DISPLAY MODAL */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-1">Account Created Successfully</h3>
            <p className="text-xs text-center text-gray-500 mb-5">
              Copy these login credentials and deliver them securely to the distributor.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Account ID:</span>
                <span className="font-bold text-indigo-700">{createdCredentials.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Full Name:</span>
                <span className="font-semibold text-gray-800">{createdCredentials.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-semibold text-gray-800">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-500">Temp Password:</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {createdCredentials.temporaryPassword}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={copyCredentialsToClipboard}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center space-x-2 shadow"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Credentials Copied!' : 'Copy Credentials to Clipboard'}</span>
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Update Account Status</h3>
            <p className="text-xs text-gray-500 mb-4">
              Updating status for {selectedAccount.fullName} ({selectedAccount.userId})
            </p>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Deactivated">Deactivated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks / Reason</label>
                <textarea
                  rows="3"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="State reason for suspension or status modification..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD CONFIRMATION MODAL */}
      {showResetModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reset Credentials</h3>
            <p className="text-sm text-gray-600 mb-5">
              Generate a new temporary password for <strong>{selectedAccount.fullName}</strong> ({selectedAccount.userId})? The user will be required to change it on their next login.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSubmit}
                className="px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow"
              >
                Generate New Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER TERRITORY MODAL */}
      {showTransferModal && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Transfer Account Territory</h3>
            <p className="text-xs text-gray-500 mb-4">
              Reassign territory for {selectedAccount.fullName} ({selectedAccount.distributorLevel})
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State / UT *</label>
                <select
                  value={transferStateId}
                  onChange={(e) => setTransferStateId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="">-- Select State / UT --</option>
                  {allStates.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Transfer</label>
                <input
                  type="text"
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Territory expansion, restructuring..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Collapsible Tree Node Components
 */
function StateTreeNode({ state }) {
  const [expanded, setExpanded] = useState(false);
  const totalSub = (state.districts || []).reduce((sum, d) => sum + (d.areas || []).length, 0);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer hover:bg-gray-100/70 p-1.5 rounded-lg transition"
      >
        <div className="flex items-center space-x-2">
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span className="font-bold text-gray-900 text-sm">{state.stateName}</span>
          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
            {state.distributors?.length || 0} State Distributors
          </span>
        </div>
        <span className="text-xs text-gray-500">{state.districts?.length || 0} Districts</span>
      </div>

      {expanded && (
        <div className="mt-3 pl-6 space-y-2.5 border-l-2 border-indigo-200">
          {(state.districts || []).length === 0 ? (
            <div className="text-xs text-gray-400 py-1">No subordinate districts assigned yet</div>
          ) : (
            state.districts.map((district) => (
              <DistrictTreeNode key={district.districtId} district={district} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DistrictTreeNode({ district }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2.5">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded transition"
      >
        <div className="flex items-center space-x-2">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-600" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
          <span className="font-semibold text-gray-800 text-xs">{district.districtName}</span>
          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            {district.distributors?.length || 0} District Distributors
          </span>
        </div>
        <span className="text-[11px] text-gray-400">{district.areas?.length || 0} Areas</span>
      </div>

      {expanded && (
        <div className="mt-2 pl-4 space-y-2 border-l border-blue-200">
          {(district.areas || []).map((area) => (
            <AreaTreeNode key={area.areaId} area={area} />
          ))}
        </div>
      )}
    </div>
  );
}

function AreaTreeNode({ area }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-50/50 border border-gray-100 rounded p-2 text-xs">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer hover:bg-gray-100/50 p-1 rounded"
      >
        <div className="flex items-center space-x-1.5">
          {expanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
          <span className="font-medium text-gray-800">{area.areaName}</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-cyan-100 text-cyan-700 rounded">
            {area.distributors?.length || 0} Area Distributors
          </span>
        </div>
        <span className="text-[10px] text-emerald-600 font-semibold">{area.retailers?.length || 0} Retailers</span>
      </div>

      {expanded && (
        <div className="mt-1.5 pl-3 space-y-1 border-l border-cyan-200">
          {(area.retailers || []).length === 0 ? (
            <div className="text-[11px] text-gray-400">No retailers registered in this area yet</div>
          ) : (
            area.retailers.map((ret) => (
              <div key={ret.id} className="text-[11px] py-1 px-2 bg-emerald-50 text-emerald-800 rounded flex justify-between">
                <span>{ret.name} ({ret.businessName || 'Retailer'})</span>
                <span className="font-mono text-[10px]">{ret.customId}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

