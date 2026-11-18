import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Filter, RefreshCw, Calendar, IndianRupee,
  Layers, MapPin, Store, ArrowUpRight, TrendingUp, CheckCircle, PieChart
} from 'lucide-react';
import api from '../../services/api';

export default function DistributionReports() {
  const [reports, setReports] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await api.distribution.getReportsSummary(params);
      if (res.success) setReports(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reports || reports.length === 0) return;

    const headers = [
      'State / Territory',
      'Type',
      'Districts',
      'District Distributors',
      'Area Distributors',
      'Retailers',
      'Total Billed (INR)',
      'Total Collected (INR)',
      'Outstanding (INR)'
    ];

    const rows = reports.map((r) => [
      `"${r.stateName}"`,
      r.isUnionTerritory ? 'Union Territory' : 'State',
      r.totalDistricts || 0,
      r.districtDistributors || 0,
      r.areaDistributors || 0,
      r.retailers || 0,
      parseFloat(r.totalBilled || 0),
      parseFloat(r.totalCollected || 0),
      parseFloat(r.totalOutstanding || 0)
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MWS_Eagle_Distribution_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totals = reports.reduce(
    (acc, r) => {
      acc.billed += parseFloat(r.totalBilled || 0);
      acc.collected += parseFloat(r.totalCollected || 0);
      acc.outstanding += parseFloat(r.totalOutstanding || 0);
      acc.districts += parseInt(r.totalDistricts || 0);
      acc.retailers += parseInt(r.retailers || 0);
      return acc;
    },
    { billed: 0, collected: 0, outstanding: 0, districts: 0, retailers: 0 }
  );

  const filteredReports = reports.filter(r => 
    r.stateName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border-t-4 border-t-blue-500 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Distribution Billed</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totals.billed.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            Across 36 Indian Territories
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-t-4 border-t-emerald-500 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Settlements Realized</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{totals.collected.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Direct Bank & UPI Credits
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-t-4 border-t-amber-500 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Total Receivables Outstanding</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              !
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            ₹{totals.outstanding.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            In-term Dealer Credit
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-t-4 border-t-purple-500 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">National Retail Footprint</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">
            {totals.retailers.toLocaleString()} Outlets
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">
            Registered Store Endpoints
          </div>
        </div>
      </div>

      {/* Header, Date Filter & Actions */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <span>Hierarchical State & Territory Reports</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              National distribution penetration, tier depth, and wholesale settlement metrics across India.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition hover:shadow"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchReports}
              className="p-2.5 text-slate-600 hover:text-blue-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              title="Refresh Reports"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Date Filter:</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/50"
            />
            <span className="text-xs text-slate-400 font-semibold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/50"
            />
            <button
              onClick={fetchReports}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Filter
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setTimeout(fetchReports, 50);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline ml-1"
              >
                Reset
              </button>
            )}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Filter by State or UT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Main Reports Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">State / Territory</th>
                <th className="py-3.5 px-3 text-center">Designation</th>
                <th className="py-3.5 px-3 text-center">Districts</th>
                <th className="py-3.5 px-3 text-center">District Dists</th>
                <th className="py-3.5 px-3 text-center">Area Dists</th>
                <th className="py-3.5 px-3 text-center">Retailers</th>
                <th className="py-3.5 px-4 text-right">Total Billed (₹)</th>
                <th className="py-3.5 px-4 text-right">Settled (₹)</th>
                <th className="py-3.5 px-4 text-right">Outstanding (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">No territory records found.</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.stateId} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{r.stateName}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                        r.isUnionTerritory 
                          ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {r.isUnionTerritory ? 'Union Territory' : 'State'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{r.totalDistricts || 0}</td>
                    <td className="py-3 px-3 text-center font-bold text-blue-600">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100">
                        {r.districtDistributors || 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-cyan-600">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-100">
                        {r.areaDistributors || 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                        {r.retailers || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{parseFloat(r.totalBilled || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      ₹{parseFloat(r.totalCollected || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-amber-600">
                      ₹{parseFloat(r.totalOutstanding || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
