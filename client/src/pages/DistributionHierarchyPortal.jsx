import React, { useState, useEffect } from 'react';
import {
  MapPin, Building2, Store, Users, IndianRupee, Award,
  FileText, Clock, CheckCircle, RefreshCw, AlertCircle, ShoppingBag,
  CreditCard, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, ShieldCheck, Percent
} from 'lucide-react';
import api from '../services/api';
import ForcePasswordChangeModal from '../components/distribution/ForcePasswordChangeModal';
import UserProfileCard from '../components/UserProfileCard';
import UserProfileModal from '../components/UserProfileModal';
import { DistributorPortal } from './DistributorPortal';

export default function DistributionHierarchyPortal({ user, onLogout }) {
  // Fail-safe protection: Retailers and regular distributors belong to the eCommerce store portal, never the territory hierarchy view
  const isRetailerAccount = user?.userType === 'Retailer' || user?.role === 'Retailer' || user?.distributorLevel === 'Retailer';
  const isTerritorialAdmin = ['StateDistributor', 'DistrictDistributor', 'AreaDistributor'].includes(user?.distributorLevel);

  if (isRetailerAccount || !isTerritorialAdmin) {
    return <DistributorPortal />;
  }

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Retailer Credit Management State
  const [retailerTab, setRetailerTab] = useState('credit'); // 'credit' | 'overview'
  const [creditData, setCreditData] = useState(null);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [creditInterestHistory, setCreditInterestHistory] = useState([]);
  const [loadingCredit, setLoadingCredit] = useState(false);

  const level = user?.distributorLevel || (user?.userType === 'Retailer' ? 'Retailer' : 'StateDistributor');

  const fetchRetailerCredit = async () => {
    setLoadingCredit(true);
    try {
      const res = await api.credits.getMyCredit();
      if (res && res.success) {
        setCreditData(res.credit);
        setCreditTransactions(res.transactions || []);
        setCreditInterestHistory(res.interestHistory || []);
      }
    } catch (e) {
      console.warn('Could not fetch credit details for retailer:', e.message);
    } finally {
      setLoadingCredit(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (level === 'Retailer') {
      fetchRetailerCredit();
    }
  }, [level]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (level === 'StateDistributor') {
        res = await api.distribution.getStateDashboard();
      } else if (level === 'DistrictDistributor') {
        res = await api.distribution.getDistrictDashboard();
      } else if (level === 'AreaDistributor') {
        res = await api.distribution.getAreaDashboard();
      } else if (level === 'Retailer') {
        res = await api.distribution.getRetailerDashboard();
        fetchRetailerCredit();
      }

      if (res && res.success) {
        setData(res.data);
      } else {
        setError(res?.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Forced Password Change Modal for new accounts */}
      <ForcePasswordChangeModal user={user} onPasswordChanged={fetchDashboardData} />

      {/* Header Banner */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                level === 'StateDistributor' ? 'bg-indigo-100 text-indigo-700' :
                level === 'DistrictDistributor' ? 'bg-blue-100 text-blue-700' :
                level === 'AreaDistributor' ? 'bg-cyan-100 text-cyan-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {level === 'StateDistributor' ? 'State-Level Distributor' :
                 level === 'DistrictDistributor' ? 'District-Level Distributor' :
                 level === 'AreaDistributor' ? 'Area-Level Distributor' :
                 'Authorized Retailer'}
              </span>
              <span className="text-xs text-gray-400 font-mono">{user?.userId}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">
              Welcome, {user?.fullName} {user?.businessName && `(${user?.businessName})`}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboardData}
              className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* User Profile Card (Exact Reference Design) */}
        <UserProfileCard
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onCreditClick={() => setRetailerTab('credit')}
          creditAmount={creditData?.availableCredit ?? data?.walletBalance ?? data?.creditLimit}
        />

        {/* User Personal Profile Details Modal */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading your territory overview...</div>
        ) : !data ? (
          <div className="py-20 text-center text-gray-400">No dashboard information available.</div>
        ) : (
          <>
            {/* 1. STATE-LEVEL DISTRIBUTOR DASHBOARD */}
            {level === 'StateDistributor' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Assigned State</span>
                    <div className="text-xl font-bold text-indigo-700 mt-1">{data.assignedState}</div>
                    <span className="text-[11px] text-gray-400">{data.totalDistricts} Registered Districts</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-blue-600 uppercase">District Distributors</span>
                    <div className="text-xl font-bold text-blue-700 mt-1">{data.totalDistrictsDistributors}</div>
                    <span className="text-[11px] text-gray-400">{data.activeAccounts} Active Subordinates</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-emerald-600 uppercase">State Retail Outlets</span>
                    <div className="text-xl font-bold text-emerald-700 mt-1">{data.totalRetailers}</div>
                    <span className="text-[11px] text-gray-400">Under all districts</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-amber-600 uppercase">Reliability Score</span>
                    <div className="text-xl font-bold text-amber-700 mt-1">{data.paymentReliabilityScore}/100</div>
                    <span className="text-[11px] text-emerald-600 font-semibold">{data.reliabilityTier}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">
                      Districts under {data.assignedState} (View-Only Territory Oversight)
                    </h2>
                    <span className="text-xs text-gray-500 font-medium">Read-Only Subordinate Structure</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                          <th className="py-3 px-4">District</th>
                          <th className="py-3 px-4 text-center">Areas</th>
                          <th className="py-3 px-4 text-center">District Dists</th>
                          <th className="py-3 px-4 text-center">Area Dists</th>
                          <th className="py-3 px-4 text-center">Retailers</th>
                          <th className="py-3 px-4 text-center">Active Accounts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(data.districts || []).map((d) => (
                          <tr key={d.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-semibold text-gray-900">{d.name}</td>
                            <td className="py-3 px-4 text-center">{d.totalAreas || 0}</td>
                            <td className="py-3 px-4 text-center font-medium text-blue-700">{d.totalDistrictDistributors || 0}</td>
                            <td className="py-3 px-4 text-center font-medium text-cyan-700">{d.totalAreaDistributors || 0}</td>
                            <td className="py-3 px-4 text-center font-medium text-emerald-700">{d.totalRetailers || 0}</td>
                            <td className="py-3 px-4 text-center text-green-600 font-semibold">{d.totalActiveAccounts || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DISTRICT-LEVEL DISTRIBUTOR DASHBOARD */}
            {level === 'DistrictDistributor' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Assigned District</span>
                    <div className="text-xl font-bold text-blue-700 mt-1">{data.assignedDistrict}</div>
                    <span className="text-[11px] text-gray-400">{data.totalAreas} Registered Areas</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-cyan-600 uppercase">Area Distributors</span>
                    <div className="text-xl font-bold text-cyan-700 mt-1">{data.totalAreaDistributors}</div>
                    <span className="text-[11px] text-gray-400">{data.activeAccounts} Active Subordinates</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-emerald-600 uppercase">Retail Outlets</span>
                    <div className="text-xl font-bold text-emerald-700 mt-1">{data.totalRetailers}</div>
                    <span className="text-[11px] text-gray-400">In this district</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-amber-600 uppercase">Reliability Score</span>
                    <div className="text-xl font-bold text-amber-700 mt-1">{data.paymentReliabilityScore}/100</div>
                    <span className="text-[11px] text-emerald-600 font-semibold">{data.reliabilityTier}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">
                      Areas in {data.assignedDistrict} (View-Only Territory Oversight)
                    </h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                          <th className="py-3 px-4">Area Name</th>
                          <th className="py-3 px-4 text-center">Pincode</th>
                          <th className="py-3 px-4 text-center">Area Dists</th>
                          <th className="py-3 px-4 text-center">Retailers</th>
                          <th className="py-3 px-4 text-center">Active Accounts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(data.areas || []).map((a) => (
                          <tr key={a.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-semibold text-gray-900">{a.name}</td>
                            <td className="py-3 px-4 text-center font-mono text-xs">{a.pincode || '-'}</td>
                            <td className="py-3 px-4 text-center font-medium text-cyan-700">{a.totalAreaDistributors || 0}</td>
                            <td className="py-3 px-4 text-center font-medium text-emerald-700">{a.totalRetailers || 0}</td>
                            <td className="py-3 px-4 text-center text-green-600 font-semibold">{a.totalActiveAccounts || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. AREA-LEVEL DISTRIBUTOR DASHBOARD */}
            {level === 'AreaDistributor' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Assigned Area</span>
                    <div className="text-xl font-bold text-cyan-700 mt-1">{data.assignedArea}</div>
                    <span className="text-[11px] text-gray-400">Pincode: {data.pincode || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-emerald-600 uppercase">Total Retailers</span>
                    <div className="text-xl font-bold text-emerald-700 mt-1">{data.totalRetailers}</div>
                    <span className="text-[11px] text-gray-400">{data.activeRetailers} Active</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-amber-600 uppercase">Reliability Score</span>
                    <div className="text-xl font-bold text-amber-700 mt-1">{data.paymentReliabilityScore}/100</div>
                    <span className="text-[11px] text-emerald-600 font-semibold">{data.reliabilityTier}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <span className="text-xs font-semibold text-indigo-600 uppercase">Territory Scope</span>
                    <div className="text-xl font-bold text-indigo-700 mt-1">Area Lead</div>
                    <span className="text-[11px] text-gray-400">Subordinate view-only</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h2 className="text-base font-bold text-gray-900 mb-4">
                    Retailers in {data.assignedArea} (View-Only)
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                          <th className="py-3 px-4">Retailer</th>
                          <th className="py-3 px-4">Business / Shop</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Reliability</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(data.retailers || []).map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-semibold text-gray-900">{r.fullName}</td>
                            <td className="py-3 px-4 text-gray-600">{r.businessName || 'Retail Shop'}</td>
                            <td className="py-3 px-4 text-xs text-gray-500">{r.email} • {r.phoneNumber}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                                r.accountStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {r.accountStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-gray-800">
                              {r.overallScore ?? 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. RETAILER PERSONAL PORTAL */}
            {level === 'Retailer' && (
              <div className="space-y-6">
                {/* Retailer Tab Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setRetailerTab('credit')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: retailerTab === 'credit' ? '1.5px solid #059669' : '1px solid #cbd5e1',
                      background: retailerTab === 'credit' ? '#059669' : '#ffffff',
                      color: retailerTab === 'credit' ? '#ffffff' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: retailerTab === 'credit' ? '0 2px 8px rgba(5, 150, 105, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CreditCard size={17} />
                    <span>Credit Balance & Ledger</span>
                    {creditData && (
                      <span style={{
                        background: retailerTab === 'credit' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(5, 150, 105, 0.12)',
                        color: retailerTab === 'credit' ? '#ffffff' : '#059669',
                        padding: '1px 7px',
                        borderRadius: '12px',
                        fontSize: '0.74rem',
                        fontWeight: 900
                      }}>
                        ₹{Number(creditData.availableCredit || 0).toLocaleString('en-IN')}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRetailerTab('overview')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: retailerTab === 'overview' ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                      background: retailerTab === 'overview' ? '#4f46e5' : '#ffffff',
                      color: retailerTab === 'overview' ? '#ffffff' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: retailerTab === 'overview' ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Store size={17} />
                    <span>Overview & Wholesale Invoices</span>
                  </button>
                </div>

                {/* TAB 1: RETAILER CREDIT BALANCE & LEDGER (Exact Distributor Matching) */}
                {retailerTab === 'credit' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Header + Refresh */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                          Retailer Credit Facility & Transaction Ledger
                        </h2>
                        <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                          Use your authorized credit limit to place wholesale restocking orders with instant checkout.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={fetchRetailerCredit}
                        className="btn"
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #cbd5e1',
                          padding: '7px 14px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        <RefreshCw size={14} className={loadingCredit ? 'animate-spin' : ''} />
                        Refresh Credit
                      </button>
                    </div>

                    {/* 4 Key Credit Metric Cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '14px'
                    }}>
                      <div style={{ padding: '18px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Approved Credit Limit
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284c7', marginTop: '6px' }}>
                          ₹{Number(creditData?.totalCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                          Authorized limit by administration
                        </div>
                      </div>

                      <div style={{ padding: '18px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Used Credit Amount
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ea580c', marginTop: '6px' }}>
                          ₹{Number(creditData?.usedCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                          Utilized across placed stock orders
                        </div>
                      </div>

                      <div style={{ padding: '18px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Outstanding Principal
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#dc2626', marginTop: '6px' }}>
                          ₹{Number(creditData?.outstandingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                          Current pending receivables to settle
                        </div>
                      </div>

                      <div style={{
                        padding: '18px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
                        border: '1.5px solid rgba(16, 185, 129, 0.35)',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Available Credit Balance
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
                          ₹{Number(creditData?.availableCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#065f46', marginTop: '3px' }}>
                          Usable for instant checkout orders
                        </div>
                      </div>
                    </div>

                    {/* How It Works Notice */}
                    <div style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <CreditCard size={22} color="#0284c7" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                        <b>Credit-Based Ordering:</b> Select <b>"Purchase with Available Credit"</b> during checkout. Your order total will be validated against your available limit and deducted automatically. Repayments can be made through wholesale settlements or Super Admin payment recording.
                      </div>
                    </div>

                    {/* Dedicated Credit Interest Details Card */}
                    <div style={{
                      padding: '22px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)',
                      border: '1.5px solid #fbcfe8',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                            Credit Interest Details & Payable Summary
                          </h3>
                          <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                            Daily interest accrues automatically on unpaid principal. Payments reduce outstanding principal immediately.
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '14px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          background: creditData?.interestEnabled ? 'rgba(16, 185, 129, 0.14)' : 'rgba(100, 116, 139, 0.14)',
                          color: creditData?.interestEnabled ? '#059669' : '#475569'
                        }}>
                          {creditData?.interestEnabled ? '● Interest Active' : '○ Interest Paused'}
                        </span>
                      </div>

                      {/* Interest Metric Cards */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                        gap: '12px',
                        marginBottom: '18px'
                      }}>
                        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Principal Amount</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>
                            ₹{Number(creditData?.principalAmount ?? creditData?.outstandingBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>Outstanding credit balance</div>
                        </div>

                        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Applicable Interest Rate</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#4338ca', marginTop: '4px' }}>
                            {Number(creditData?.monthlyInterestRate || 0).toFixed(2)}% / mo
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                            {creditData?.calcMode === 'fixed_30' ? '30-day month basis' : `${creditData?.daysInCurrentMonth || 30}-day calendar basis`}
                          </div>
                        </div>

                        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase' }}>Today&apos;s Daily Interest</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#be185d', marginTop: '4px' }}>
                            ₹{Number(creditData?.dailyInterestAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / day
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9d174d', marginTop: '2px' }}>
                            Est. ₹{Number(creditData?.monthlyEstimatedInterest || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mo
                          </div>
                        </div>

                        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9d174d', textTransform: 'uppercase' }}>Accumulated Interest</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#be185d', marginTop: '4px' }}>
                            ₹{Number(creditData?.accumulatedInterest || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                            Last calc: {creditData?.lastInterestDate || 'Not yet run'}
                          </div>
                        </div>

                        <div style={{ background: '#fff7ed', padding: '14px', borderRadius: '12px', border: '1.5px solid #fed7aa' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase' }}>Total Payable (P + I)</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#c2410c', marginTop: '4px' }}>
                            ₹{Number(creditData?.totalPayable ?? creditData?.outstandingBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9a3412', marginTop: '2px' }}>Principal + Accumulated Interest</div>
                        </div>
                      </div>

                      {/* Daily Interest Calculation History Sub-table */}
                      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px' }}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 10px 0', color: '#0f172a' }}>
                          Daily Interest Calculation History
                        </h4>
                        {creditInterestHistory.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8' }}>
                            No daily interest entries recorded yet.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                                  <th style={{ padding: '8px 10px' }}>Date</th>
                                  <th style={{ padding: '8px 10px' }}>Reference</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Principal Used</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (%/mo)</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Daily Interest (+)</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Interest After</th>
                                </tr>
                              </thead>
                              <tbody>
                                {creditInterestHistory.map((log) => (
                                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '9px 10px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{log.interest_date}</td>
                                    <td style={{ padding: '9px 10px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 700 }}>{log.txn_number}</td>
                                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>
                                      ₹{Number(log.principal_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#4338ca', fontWeight: 700 }}>
                                      {Number(log.monthly_rate || 0).toFixed(2)}% ({log.days_in_month}d)
                                    </td>
                                    <td style={{ padding: '9px 10px', textAlign: 'right', color: '#be185d', fontWeight: 800 }}>
                                      +₹{Number(log.daily_interest || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                      ₹{Number(log.interest_after || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transaction Ledger Table */}
                    <div style={{
                      padding: '20px',
                      borderRadius: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 14px 0', color: '#0f172a' }}>
                        Credit Transactions & Repayment Ledger
                      </h3>

                      {loadingCredit ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                          Loading transaction records...
                        </div>
                      ) : creditTransactions.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                          No credit transactions or purchases recorded yet.
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                                <th style={{ padding: '10px 12px' }}>Date & Time</th>
                                <th style={{ padding: '10px 12px' }}>Activity</th>
                                <th style={{ padding: '10px 12px' }}>Amount</th>
                                <th style={{ padding: '10px 12px' }}>Previous Balance</th>
                                <th style={{ padding: '10px 12px' }}>New Balance</th>
                                <th style={{ padding: '10px 12px' }}>Reference / Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {creditTransactions.map((tx) => {
                                const isDeduction = tx.transaction_type === 'PURCHASE_DEDUCTION';
                                const isRefund = tx.transaction_type === 'REFUND';
                                const isDailyInterest = tx.transaction_type === 'DAILY_INTEREST';
                                const isPayment = tx.transaction_type === 'PAYMENT_SETTLEMENT';

                                let dateStr = tx.created_at;
                                try {
                                  dateStr = new Date(tx.created_at).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  });
                                } catch (e) {}

                                return (
                                  <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', color: '#334155', whiteSpace: 'nowrap' }}>
                                      {dateStr}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                      <span style={{
                                        padding: '3px 8px',
                                        borderRadius: '10px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        background: isDeduction
                                          ? 'rgba(239, 68, 68, 0.1)'
                                          : (isDailyInterest
                                              ? 'rgba(219, 39, 119, 0.12)'
                                              : (isRefund
                                                  ? 'rgba(147, 51, 234, 0.1)'
                                                  : (isPayment
                                                      ? 'rgba(16, 185, 129, 0.1)'
                                                      : 'rgba(2, 132, 199, 0.1)'))),
                                        color: isDeduction
                                          ? '#dc2626'
                                          : (isDailyInterest
                                              ? '#be185d'
                                              : (isRefund
                                                  ? '#7c3aed'
                                                  : (isPayment
                                                      ? '#059669'
                                                      : '#0284c7')))
                                      }}>
                                        {isDeduction
                                          ? 'PURCHASE DEDUCTION'
                                          : (isDailyInterest
                                              ? 'DAILY INTEREST'
                                              : (isRefund
                                                  ? 'ORDER REFUND'
                                                  : (isPayment
                                                      ? 'PAYMENT SETTLEMENT'
                                                      : tx.transaction_type)))}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: 800, color: isDeduction ? '#dc2626' : (isDailyInterest ? '#be185d' : '#059669') }}>
                                      {isDeduction ? '-' : '+'}₹{Number(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ padding: '12px', color: '#64748b' }}>
                                      ₹{Number(tx.previous_credit || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>
                                      ₹{Number(tx.new_credit || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ padding: '12px', color: '#334155' }}>
                                      <div style={{ fontWeight: 600 }}>{tx.description || '-'}</div>
                                      {tx.reference_id && (
                                        <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace' }}>
                                          Ref: {tx.reference_id}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: OVERVIEW & INVOICES */}
                {retailerTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <span className="text-xs font-semibold text-indigo-600 uppercase">My Total Orders</span>
                        <div className="text-xl font-bold text-indigo-700 mt-1">{data.totalOrders}</div>
                        <span className="text-[11px] text-gray-400">Wholesale stock orders</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <span className="text-xs font-semibold text-emerald-600 uppercase">Total Settled</span>
                        <div className="text-xl font-bold text-emerald-700 mt-1">₹{data.totalPaid.toLocaleString()}</div>
                        <span className="text-[11px] text-gray-400">Verified payments</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <span className="text-xs font-semibold text-amber-600 uppercase">Outstanding Balance</span>
                        <div className="text-xl font-bold text-amber-700 mt-1">₹{data.outstanding.toLocaleString()}</div>
                        <span className="text-[11px] text-gray-400">Payable amount</span>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <span className="text-xs font-semibold text-purple-600 uppercase">My Reliability Score</span>
                        <div className="text-xl font-bold text-purple-700 mt-1">{data.paymentReliabilityScore}/100</div>
                        <span className="text-[11px] text-emerald-600 font-semibold">{data.reliabilityTier}</span>
                      </div>
                    </div>

                    {/* Invoices List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                      <h2 className="text-base font-bold text-gray-900 mb-4">My Wholesale Invoices</h2>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                            <tr>
                              <th className="py-3 px-4">Invoice #</th>
                              <th className="py-3 px-4 text-center">Due Date</th>
                              <th className="py-3 px-4 text-right">Amount (₹)</th>
                              <th className="py-3 px-4 text-right">Paid (₹)</th>
                              <th className="py-3 px-4 text-right">Balance (₹)</th>
                              <th className="py-3 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(data.invoices || []).length === 0 ? (
                              <tr><td colSpan="6" className="py-6 text-center text-gray-400">No invoices issued yet.</td></tr>
                            ) : (
                              data.invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                  <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-700">{inv.invoiceNumber}</td>
                                  <td className="py-3 px-4 text-center text-xs">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                  <td className="py-3 px-4 text-right">₹{parseFloat(inv.totalAmount).toLocaleString()}</td>
                                  <td className="py-3 px-4 text-right text-emerald-700 font-medium">₹{parseFloat(inv.paidAmount).toLocaleString()}</td>
                                  <td className="py-3 px-4 text-right text-amber-700 font-bold">₹{parseFloat(inv.balanceAmount).toLocaleString()}</td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                                      inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {inv.status}
                                    </span>
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
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

