import React, { useState, useEffect } from 'react';
import {
  MapPin, Building2, Store, Users, IndianRupee, Award,
  FileText, Clock, CheckCircle, RefreshCw, AlertCircle, ShoppingBag
} from 'lucide-react';
import api from '../services/api';
import ForcePasswordChangeModal from '../components/distribution/ForcePasswordChangeModal';

export default function DistributionHierarchyPortal({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const level = user?.distributorLevel || (user?.userType === 'Retailer' ? 'Retailer' : 'StateDistributor');

  useEffect(() => {
    fetchDashboardData();
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
          </>
        )}
      </main>
    </div>
  );
}

